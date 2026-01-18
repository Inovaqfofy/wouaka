import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { 
  Webhook, 
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink
} from "lucide-react";
import { useWebhooks } from "@/hooks/useWebhooks";
import { CreateWebhookDialog } from "@/components/api/CreateWebhookDialog";

const PartnerWebhooks = () => {
  const { webhooks, isLoading, toggleWebhook, deleteWebhook, createWebhook } = useWebhooks();
  const [dialogOpen, setDialogOpen] = useState(false);

  const activeWebhooks = webhooks?.filter(w => w.is_active).length || 0;

  const eventTypes = [
    { event: 'score.calculated', description: 'Lorsqu\'un score est calculé' },
    { event: 'kyc.completed', description: 'Lorsqu\'une vérification KYC est terminée' },
    { event: 'application.received', description: 'Lorsqu\'une candidature est reçue' },
    { event: 'application.status_changed', description: 'Lorsque le statut d\'une candidature change' },
  ];

  return (
    <DashboardLayout role="partner" title="Webhooks">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Webhook className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{webhooks?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total webhooks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{activeWebhooks}</p>
                  <p className="text-sm text-muted-foreground">Actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {webhooks?.filter(w => (w.failure_count || 0) > 0).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">En erreur</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Webhooks List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mes Webhooks</CardTitle>
              <CardDescription>Recevez des notifications en temps réel</CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Webhook
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !webhooks || webhooks.length === 0 ? (
              <div className="text-center py-12">
                <Webhook className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun webhook</h3>
                <p className="text-muted-foreground mb-4">
                  Configurez un webhook pour recevoir des notifications
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un webhook
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{webhook.name}</h4>
                          <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                            {webhook.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                          {(webhook.failure_count || 0) > 0 && (
                            <Badge variant="destructive">Erreur</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-mono bg-muted p-2 rounded">
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          {webhook.url}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {webhook.events?.map((event: string) => (
                            <Badge key={event} variant="outline">{event}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={webhook.is_active || false}
                          onCheckedChange={(checked) => toggleWebhook(webhook.id, checked)}
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteWebhook(webhook.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Events */}
        <Card>
          <CardHeader>
            <CardTitle>Événements Disponibles</CardTitle>
            <CardDescription>Types d'événements que vous pouvez écouter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventTypes.map((event) => (
                <div key={event.event} className="p-3 border rounded-lg">
                  <code className="text-sm font-mono text-primary">{event.event}</code>
                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateWebhookDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreateWebhook={createWebhook} />
    </DashboardLayout>
  );
};

export default PartnerWebhooks;
