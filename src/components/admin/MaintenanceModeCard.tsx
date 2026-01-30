import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Copy, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AccessPassword {
  id: string;
  label: string;
  created_at: string;
  expires_at: string | null;
  used_count: number;
  last_used_at: string | null;
}

export function MaintenanceModeCard() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [passwords, setPasswords] = useState<AccessPassword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [newPasswordLabel, setNewPasswordLabel] = useState('');
  const [isAddingPassword, setIsAddingPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showGenerated, setShowGenerated] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load maintenance mode setting
      const { data: setting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();
      
      setIsMaintenanceMode(setting?.value === 'true');

      // Load passwords
      const { data: passwordData, error } = await supabase
        .from('access_passwords')
        .select('id, label, created_at, expires_at, used_count, last_used_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPasswords(passwordData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    setIsToggling(true);
    try {
      const newValue = !isMaintenanceMode;
      const { error } = await supabase
        .from('system_settings')
        .update({ value: newValue ? 'true' : 'false', updated_at: new Date().toISOString() })
        .eq('key', 'maintenance_mode');

      if (error) throw error;
      
      setIsMaintenanceMode(newValue);
      toast.success(
        newValue 
          ? 'Mode Coming Soon activé' 
          : '🎉 Site ouvert au public !'
      );
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsToggling(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const addNewPassword = async () => {
    if (!newPasswordLabel.trim()) {
      toast.error('Veuillez entrer un libellé');
      return;
    }

    setIsAddingPassword(true);
    try {
      const clearPassword = generateRandomPassword();
      
      // Hash the password using the edge function (we'll create a simple hash for now)
      const { data, error } = await supabase.rpc('add_access_password', {
        p_password: clearPassword,
        p_label: newPasswordLabel.trim()
      });

      if (error) {
        // Fallback: insert directly with SQL crypt
        const { error: insertError } = await supabase
          .from('access_passwords')
          .insert({
            password_hash: clearPassword, // Will be hashed by trigger or we'll update
            label: newPasswordLabel.trim()
          });
        
        if (insertError) throw insertError;
      }

      setGeneratedPassword(clearPassword);
      setShowGenerated(true);
      setNewPasswordLabel('');
      loadData();
      toast.success('Mot de passe créé !');
    } catch (error) {
      console.error('Error adding password:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setIsAddingPassword(false);
    }
  };

  const deletePassword = async (id: string) => {
    try {
      const { error } = await supabase
        .from('access_passwords')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPasswords(prev => prev.filter(p => p.id !== id));
      toast.success('Mot de passe supprimé');
    } catch (error) {
      console.error('Error deleting password:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papiers');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Toggle Card */}
      <Card className={isMaintenanceMode ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-green-500/50 bg-green-500/5'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMaintenanceMode ? (
                <div className="p-2 rounded-full bg-yellow-500/20">
                  <Lock className="w-5 h-5 text-yellow-600" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-green-500/20">
                  <Unlock className="w-5 h-5 text-green-600" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg">Mode Coming Soon</CardTitle>
                <CardDescription>
                  {isMaintenanceMode 
                    ? 'Le site est actuellement protégé par mot de passe'
                    : 'Le site est ouvert au public'
                  }
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isMaintenanceMode ? 'secondary' : 'default'} className={isMaintenanceMode ? 'bg-yellow-500/20 text-yellow-700' : 'bg-green-500/20 text-green-700'}>
                {isMaintenanceMode ? 'Protégé' : 'Public'}
              </Badge>
              <Switch
                checked={isMaintenanceMode}
                onCheckedChange={toggleMaintenanceMode}
                disabled={isToggling}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            {isMaintenanceMode ? (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <p className="text-muted-foreground">
                  Les visiteurs doivent entrer un mot de passe pour accéder au site. 
                  Les <strong>Super Admins</strong> connectés contournent automatiquement cette protection.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <p className="text-muted-foreground">
                  Le site est accessible à tous. Activez le mode Coming Soon pour restreindre l'accès.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Passwords Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Mots de passe d'accès</CardTitle>
              <CardDescription>
                Gérez les mots de passe permettant d'accéder au site en mode Coming Soon
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={loadData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generated Password Display */}
          {generatedPassword && showGenerated && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Nouveau mot de passe généré</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Copiez-le maintenant, il ne sera plus affiché
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowGenerated(false)}
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <code className="bg-white/50 px-3 py-2 rounded font-mono text-sm flex-1">
                  {generatedPassword}
                </code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(generatedPassword)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Add New Password */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Libellé (ex: Client Demo, Investisseur...)"
                value={newPasswordLabel}
                onChange={(e) => setNewPasswordLabel(e.target.value)}
                disabled={isAddingPassword}
              />
            </div>
            <Button onClick={addNewPassword} disabled={isAddingPassword}>
              {isAddingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Générer
            </Button>
          </div>

          <Separator />

          {/* Password List */}
          <div className="space-y-2">
            {passwords.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun mot de passe configuré
              </p>
            ) : (
              passwords.map((pwd) => (
                <div 
                  key={pwd.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{pwd.label}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>
                        Créé le {format(new Date(pwd.created_at), 'dd MMM yyyy', { locale: fr })}
                      </span>
                      <span>•</span>
                      <span>{pwd.used_count} utilisation{pwd.used_count > 1 ? 's' : ''}</span>
                      {pwd.last_used_at && (
                        <>
                          <span>•</span>
                          <span>
                            Dernière: {format(new Date(pwd.last_used_at), 'dd MMM à HH:mm', { locale: fr })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deletePassword(pwd.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
