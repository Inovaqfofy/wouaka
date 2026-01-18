import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailTemplatePreview } from "@/components/email/EmailTemplatePreview";
import { 
  Bell, 
  Shield, 
  Globe,
  Save,
  Mail,
  Settings
} from "lucide-react";

const AdminSettings = () => {
  return (
    <DashboardLayout role="admin" title="Paramètres système">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
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
                  <Input id="platform-name" defaultValue="Wouaka" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="support-email">Email de support</Label>
                  <Input id="support-email" type="email" defaultValue="support@wouaka-creditscore.com" />
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
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Expiration des sessions</p>
                  <p className="text-sm text-muted-foreground">
                    Déconnecter automatiquement après 24h d'inactivité
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Journalisation des actions</p>
                  <p className="text-sm text-muted-foreground">
                    Enregistrer toutes les actions administratives
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button size="lg">
              <Save className="w-4 h-4 mr-2" />
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
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertes de sécurité</p>
                  <p className="text-sm text-muted-foreground">
                    Notifier en cas de tentatives de connexion suspectes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Rapports hebdomadaires</p>
                  <p className="text-sm text-muted-foreground">
                    Envoyer un récapitulatif hebdomadaire par email
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdminSettings;
