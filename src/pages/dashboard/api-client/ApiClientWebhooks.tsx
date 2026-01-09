import { useState } from "react";
import { 
  Webhook, 
  Plus, 
  Trash2, 
  Power, 
  PowerOff,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebhooks } from "@/hooks/useWebhooks";
import { CreateWebhookDialog } from "@/components/api/CreateWebhookDialog";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const ApiClientWebhooks = () => {
  const { webhooks, isLoading, createWebhook, deleteWebhook, toggleWebhook } = useWebhooks();
  const [dialogOpen, setDialogOpen] = useState(false);

  const activeWebhooks = webhooks.filter(w => w.is_active);
  const failedWebhooks = webhooks.filter(w => (w.failure_count || 0) > 0);

  return (
    <DashboardLayout role="api-client" title="Webhooks">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Webhook className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{webhooks.length}</p>
              <p className="text-sm text-muted-foreground">Total webhooks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeWebhooks.length}</p>
              <p className="text-sm text-muted-foreground">Webhooks actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{failedWebhooks.length}</p>
              <p className="text-sm text-muted-foreground">En erreur</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks List */}
      <Card className="card-premium">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Gestion des webhooks
            </CardTitle>
            <CardDescription>
              Recevez des notifications en temps réel sur vos endpoints
            </CardDescription>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Ajouter webhook
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Webhook className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h3 className="font-medium text-lg mb-2">Aucun webhook configuré</h3>
              <p className="text-sm mb-4">Configurez des webhooks pour recevoir des notifications en temps réel</p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Ajouter un webhook
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => {
                const hasErrors = (webhook.failure_count || 0) > 0;
                return (
                  <div 
                    key={webhook.id} 
                    className={`p-4 rounded-xl border ${
                      hasErrors 
                        ? 'bg-destructive/5 border-destructive/20' 
                        : webhook.is_active 
                          ? 'bg-muted/50 border-transparent' 
                          : 'bg-muted/30 border-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{webhook.name}</h4>
                          <Badge variant={webhook.is_active ? "success" : "outline"}>
                            {webhook.is_active ? "Actif" : "Inactif"}
                          </Badge>
                          {hasErrors && (
                            <Badge variant="destructive">
                              {webhook.failure_count} erreurs
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <code className="text-sm text-muted-foreground bg-background px-3 py-1.5 rounded-lg truncate max-w-md">
                            {webhook.url}
                          </code>
                          <a 
                            href={webhook.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {webhook.events.map((event, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Créé {formatDistanceToNow(new Date(webhook.created_at), { locale: fr, addSuffix: true })}
                          </span>
                          {webhook.last_triggered_at && (
                            <span>
                              Dernier appel: {formatDistanceToNow(new Date(webhook.last_triggered_at), { locale: fr, addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleWebhook(webhook.id, !webhook.is_active)}
                          title={webhook.is_active ? "Désactiver" : "Activer"}
                        >
                          {webhook.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteWebhook(webhook.id)}
                          title="Supprimer"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Types Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Événements disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { event: 'score.created', desc: 'Nouveau score calculé' },
              { event: 'score.updated', desc: 'Score mis à jour' },
              { event: 'kyc.verified', desc: 'KYC validé' },
              { event: 'kyc.rejected', desc: 'KYC rejeté' },
              { event: 'payment.success', desc: 'Paiement réussi' },
              { event: 'payment.failed', desc: 'Paiement échoué' },
            ].map((item) => (
              <div key={item.event} className="p-3 bg-muted/50 rounded-lg">
                <code className="text-sm font-medium text-primary">{item.event}</code>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <CreateWebhookDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreateWebhook={createWebhook}
      />
    </DashboardLayout>
  );
};

export default ApiClientWebhooks;
