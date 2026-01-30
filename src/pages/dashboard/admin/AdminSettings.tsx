import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailTemplatePreview } from "@/components/email/EmailTemplatePreview";
import { MaintenanceModeCard } from "@/components/admin/MaintenanceModeCard";
import { useSettings } from "@/hooks/useSettings";
import { 
  Bell, 
  Shield, 
  Globe,
  Save,
  Mail,
  Settings,
  Lock,
  Loader2
} from "lucide-react";

const AdminSettings = () => {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();
  
  // Local state for form values
  const [platformName, setPlatformName] = useState("Wouaka");
  const [supportEmail, setSupportEmail] = useState("support@wouaka-creditscore.com");
  const [require2FA, setRequire2FA] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState(true);
  const [actionLogging, setActionLogging] = useState(true);
  const [kycAlerts, setKycAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  // Sync local state with loaded settings
  useEffect(() => {
    if (settings) {
      setPlatformName(settings.company_name || "Wouaka");
      setSupportEmail(settings.company_email || "support@wouaka-creditscore.com");
      setRequire2FA(settings.email_notifications ?? true);
      setSessionExpiry(settings.webhook_notifications ?? true);
      setActionLogging(settings.enable_logging ?? true);
      setKycAlerts(settings.email_notifications ?? true);
      setSecurityAlerts(settings.webhook_notifications ?? true);
      setWeeklyReports(settings.sms_notifications ?? false);
    }
  }, [settings]);

  const handleSaveGeneral = () => {
    updateSettings({
      company_name: platformName,
      company_email: supportEmail,
      enable_logging: actionLogging,
    });
  };

  const handleSaveNotifications = () => {
    updateSettings({
      email_notifications: kycAlerts,
      webhook_notifications: securityAlerts,
      sms_notifications: weeklyReports,
    });
  };
  return (
    <DashboardLayout role="admin" title="Paramètres système">
      <Tabs defaultValue="maintenance" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Accès
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertes
          </TabsTrigger>
        </TabsList>

        {/* Maintenance Mode Tab */}
        <TabsContent value="maintenance" className="space-y-6 max-w-4xl">
          <MaintenanceModeCard />
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6 max-w-4xl">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Paramètres généraux
              </CardTitle>
              <CardDescription>
                Configuration générale de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="platform-name">Nom de la plateforme</Label>
                  <Input 
                    id="platform-name" 
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="support-email">Email de support</Label>
                  <Input 
                    id="support-email" 
                    type="email" 
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Sécurité
              </CardTitle>
              <CardDescription>
                Paramètres de sécurité et d'authentification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Authentification à deux facteurs</p>
                  <p className="text-sm text-muted-foreground">
                    Exiger la 2FA pour tous les administrateurs
                  </p>
                </div>
                <Switch 
                  checked={require2FA}
                  onCheckedChange={setRequire2FA}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Expiration des sessions</p>
                  <p className="text-sm text-muted-foreground">
                    Déconnecter automatiquement après 24h d'inactivité
                  </p>
                </div>
                <Switch 
                  checked={sessionExpiry}
                  onCheckedChange={setSessionExpiry}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Journalisation des actions</p>
                  <p className="text-sm text-muted-foreground">
                    Enregistrer toutes les actions administratives
                  </p>
                </div>
                <Switch 
                  checked={actionLogging}
                  onCheckedChange={setActionLogging}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button size="lg" onClick={handleSaveGeneral} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Enregistrer les modifications
            </Button>
          </div>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="emails">
          <EmailTemplatePreview />
        </TabsContent>

        {/* Notification Settings Tab */}
        <TabsContent value="notifications" className="space-y-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configuration des alertes et notifications système
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertes KYC en attente</p>
                  <p className="text-sm text-muted-foreground">
                    Notifier quand des validations sont en attente depuis plus de 24h
                  </p>
                </div>
                <Switch 
                  checked={kycAlerts}
                  onCheckedChange={setKycAlerts}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertes de sécurité</p>
                  <p className="text-sm text-muted-foreground">
                    Notifier en cas de tentatives de connexion suspectes
                  </p>
                </div>
                <Switch 
                  checked={securityAlerts}
                  onCheckedChange={setSecurityAlerts}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Rapports hebdomadaires</p>
                  <p className="text-sm text-muted-foreground">
                    Envoyer un récapitulatif hebdomadaire par email
                  </p>
                </div>
                <Switch 
                  checked={weeklyReports}
                  onCheckedChange={setWeeklyReports}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button for Notifications */}
          <div className="flex justify-end">
            <Button size="lg" onClick={handleSaveNotifications} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Enregistrer les alertes
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdminSettings;
