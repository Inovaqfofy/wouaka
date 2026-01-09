import { useState, useEffect } from "react";
import { 
  Settings, 
  Bell, 
  Shield, 
  Globe,
  Save,
  User,
  Building2,
  Loader2
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, UserSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ApiClientSettings = () => {
  const { user, profile } = useAuth();
  const { settings: savedSettings, isLoading, updateSettings, isUpdating } = useSettings();
  
  const [settings, setSettings] = useState<UserSettings>({
    companyName: '',
    contactEmail: '',
    webhookRetries: '3',
    timezone: 'Africa/Abidjan',
    notifyOnError: true,
    notifyOnQuotaWarning: true,
    notifyOnNewFeatures: false,
    ipWhitelist: '',
    rateLimitBurst: '100',
    enableLogging: true,
  });

  // Sync with saved settings when loaded
  useEffect(() => {
    if (savedSettings && Object.keys(savedSettings).length > 0) {
      setSettings(prev => ({
        ...prev,
        ...savedSettings,
        // Use profile data as fallback
        companyName: savedSettings.companyName || profile?.company || '',
        contactEmail: savedSettings.contactEmail || profile?.email || user?.email || '',
      }));
    } else if (profile || user) {
      setSettings(prev => ({
        ...prev,
        companyName: profile?.company || '',
        contactEmail: profile?.email || user?.email || '',
      }));
    }
  }, [savedSettings, profile, user]);

  const handleSave = () => {
    updateSettings(settings);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="api-client" title="Paramètres">
        <div className="max-w-4xl space-y-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="api-client" title="Paramètres">
      <div className="max-w-4xl space-y-6">
        {/* Company Info */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Informations entreprise
            </CardTitle>
            <CardDescription>
              Informations de votre organisation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de l'entreprise</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  placeholder="Ma Société SARL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email de contact</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  placeholder="api@masociete.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Select 
                value={settings.timezone} 
                onValueChange={(value) => setSettings({ ...settings, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Abidjan">Africa/Abidjan (UTC+0)</SelectItem>
                  <SelectItem value="Africa/Lagos">Africa/Lagos (UTC+1)</SelectItem>
                  <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (UTC+2)</SelectItem>
                  <SelectItem value="Europe/Paris">Europe/Paris (UTC+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Configuration API
            </CardTitle>
            <CardDescription>
              Paramètres techniques de l'API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="webhookRetries">Tentatives webhook</Label>
                <Select 
                  value={settings.webhookRetries}
                  onValueChange={(value) => setSettings({ ...settings, webhookRetries: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 tentative</SelectItem>
                    <SelectItem value="3">3 tentatives</SelectItem>
                    <SelectItem value="5">5 tentatives</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rateLimitBurst">Limite burst (req/s)</Label>
                <Input
                  id="rateLimitBurst"
                  type="number"
                  value={settings.rateLimitBurst}
                  onChange={(e) => setSettings({ ...settings, rateLimitBurst: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ipWhitelist">
                Liste blanche IP <span className="text-muted-foreground">(optionnel)</span>
              </Label>
              <Input
                id="ipWhitelist"
                value={settings.ipWhitelist}
                onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
                placeholder="192.168.1.1, 10.0.0.0/24"
              />
              <p className="text-xs text-muted-foreground">
                Séparez les adresses IP par des virgules. Laissez vide pour autoriser toutes les IP.
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableLogging">Journalisation détaillée</Label>
                <p className="text-sm text-muted-foreground">
                  Enregistrer les détails des requêtes et réponses
                </p>
              </div>
              <Switch
                id="enableLogging"
                checked={settings.enableLogging}
                onCheckedChange={(checked) => setSettings({ ...settings, enableLogging: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Gérez vos préférences de notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifyOnError">Alertes d'erreur</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir une notification en cas d'erreur API
                </p>
              </div>
              <Switch
                id="notifyOnError"
                checked={settings.notifyOnError}
                onCheckedChange={(checked) => setSettings({ ...settings, notifyOnError: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifyOnQuotaWarning">Alerte quota</Label>
                <p className="text-sm text-muted-foreground">
                  Notification à 80% du quota mensuel
                </p>
              </div>
              <Switch
                id="notifyOnQuotaWarning"
                checked={settings.notifyOnQuotaWarning}
                onCheckedChange={(checked) => setSettings({ ...settings, notifyOnQuotaWarning: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifyOnNewFeatures">Nouvelles fonctionnalités</Label>
                <p className="text-sm text-muted-foreground">
                  Être informé des nouvelles fonctionnalités API
                </p>
              </div>
              <Switch
                id="notifyOnNewFeatures"
                checked={settings.notifyOnNewFeatures}
                onCheckedChange={(checked) => setSettings({ ...settings, notifyOnNewFeatures: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sécurité
            </CardTitle>
            <CardDescription>
              Options de sécurité avancées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl">
                <h4 className="font-medium mb-1">Authentification à deux facteurs</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Ajoutez une couche de sécurité supplémentaire à votre compte
                </p>
                <Button variant="outline" size="sm">Configurer 2FA</Button>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl">
                <h4 className="font-medium mb-1">Sessions actives</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Gérez les appareils connectés à votre compte
                </p>
                <Button variant="outline" size="sm">Voir les sessions</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2" disabled={isUpdating}>
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApiClientSettings;
