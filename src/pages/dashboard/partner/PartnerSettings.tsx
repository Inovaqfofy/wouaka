import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  Bell,
  Shield,
  Globe,
  Loader2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const PartnerSettings = () => {
  const { profile, user, refreshProfile } = useAuth();
  const { settings: savedSettings, isLoading, updateSettings, isUpdating } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    company_name: '',
    company_email: '',
    phone: '',
    country: 'CI',
    timezone: 'Africa/Abidjan',
    email_notifications: true,
    webhook_notifications: true,
    sms_notifications: false,
    api_rate_limit: '1000',
  });

  // Load saved settings or profile data
  useEffect(() => {
    if (savedSettings && Object.keys(savedSettings).length > 0) {
      setSettings(prev => ({
        ...prev,
        company_name: savedSettings.company_name || profile?.company || prev.company_name,
        company_email: savedSettings.company_email || profile?.email || prev.company_email,
        phone: savedSettings.phone || profile?.phone || prev.phone,
        country: savedSettings.country || prev.country,
        timezone: savedSettings.timezone || prev.timezone,
        email_notifications: savedSettings.email_notifications ?? prev.email_notifications,
        webhook_notifications: savedSettings.webhook_notifications ?? prev.webhook_notifications,
        sms_notifications: savedSettings.sms_notifications ?? prev.sms_notifications,
        api_rate_limit: savedSettings.api_rate_limit || prev.api_rate_limit,
      }));
    } else if (profile) {
      // Fallback to profile data if no settings saved yet
      setSettings(prev => ({
        ...prev,
        company_name: profile.company || '',
        company_email: profile.email || '',
        phone: profile.phone || '',
      }));
    }
  }, [savedSettings, profile]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      // Update profile table with phone and company
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: settings.phone || null,
          company: settings.company_name || null,
        })
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Profile update error:', profileError);
        toast.error('Erreur lors de la mise à jour du profil');
        return;
      }

      // Update settings
      updateSettings(settings);
      
      // Refresh profile data
      await refreshProfile();
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout role="partner" title="Paramètres">
      <div className="space-y-6 max-w-3xl">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Informations de l'entreprise
            </CardTitle>
            <CardDescription>
              Configurez les informations de votre organisation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Nom de l'entreprise</Label>
                    <Input
                      id="company_name"
                      value={settings.company_name}
                      onChange={(e) => setSettings(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="Votre entreprise"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_email">Email de contact</Label>
                    <Input
                      id="company_email"
                      type="email"
                      value={settings.company_email}
                      onChange={(e) => setSettings(prev => ({ ...prev, company_email: e.target.value }))}
                      placeholder="contact@entreprise.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+225 XX XX XX XX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <Select
                      value={settings.country}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, country: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CI">Côte d'Ivoire</SelectItem>
                        <SelectItem value="SN">Sénégal</SelectItem>
                        <SelectItem value="ML">Mali</SelectItem>
                        <SelectItem value="BF">Burkina Faso</SelectItem>
                        <SelectItem value="TG">Togo</SelectItem>
                        <SelectItem value="BJ">Bénin</SelectItem>
                        <SelectItem value="NE">Niger</SelectItem>
                        <SelectItem value="GW">Guinée-Bissau</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>
              Gérez vos préférences de notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notifications par email</p>
                <p className="text-sm text-muted-foreground">
                  Recevez des alertes par email
                </p>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, email_notifications: checked }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notifications webhook</p>
                <p className="text-sm text-muted-foreground">
                  Recevez des événements en temps réel
                </p>
              </div>
              <Switch
                checked={settings.webhook_notifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, webhook_notifications: checked }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notifications SMS</p>
                <p className="text-sm text-muted-foreground">
                  Recevez des alertes importantes par SMS
                </p>
              </div>
              <Switch
                checked={settings.sms_notifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sms_notifications: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Configuration API
            </CardTitle>
            <CardDescription>
              Paramètres de votre accès API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rate_limit">Limite de requêtes (par minute)</Label>
              <Select
                value={settings.api_rate_limit}
                onValueChange={(value) => setSettings(prev => ({ ...prev, api_rate_limit: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 requêtes/min</SelectItem>
                  <SelectItem value="500">500 requêtes/min</SelectItem>
                  <SelectItem value="1000">1000 requêtes/min</SelectItem>
                  <SelectItem value="5000">5000 requêtes/min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Abidjan">Abidjan (UTC+0)</SelectItem>
                  <SelectItem value="Africa/Dakar">Dakar (UTC+0)</SelectItem>
                  <SelectItem value="Africa/Lagos">Lagos (UTC+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Sécurité
            </CardTitle>
            <CardDescription>
              Options de sécurité de votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Authentification à deux facteurs</p>
                <p className="text-sm text-muted-foreground">
                  Ajoutez une couche de sécurité supplémentaire
                </p>
              </div>
              <Button variant="outline">Configurer</Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Changer le mot de passe</p>
                <p className="text-sm text-muted-foreground">
                  Dernière modification il y a 30 jours
                </p>
              </div>
              <Button variant="outline">Modifier</Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving || isUpdating}>
            {isSaving || isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer les modifications'
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PartnerSettings;
