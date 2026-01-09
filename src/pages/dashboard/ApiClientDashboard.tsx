import { 
  Key, 
  BarChart3, 
  Webhook,
  Activity,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Check
} from "lucide-react";
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/cards/StatCard";
import { MonthlyScoresChart } from "@/components/charts/ScoreChart";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useWebhooks } from "@/hooks/useWebhooks";
import { useApiCalls } from "@/hooks/useApiCalls";
import { ApiSimulator } from "@/components/api/ApiSimulator";
import { CreateApiKeyDialog } from "@/components/api/CreateApiKeyDialog";
import { CreateWebhookDialog } from "@/components/api/CreateWebhookDialog";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const ApiClientDashboard = () => {
  const { apiKeys, isLoading: keysLoading, createApiKey, rotateApiKey, deleteApiKey, toggleApiKey } = useApiKeys();
  const { webhooks, isLoading: webhooksLoading, createWebhook, deleteWebhook, toggleWebhook } = useWebhooks();
  const { apiCalls, stats, isLoading: callsLoading } = useApiCalls();

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newApiKeyDialogOpen, setNewApiKeyDialogOpen] = useState(false);
  const [newWebhookDialogOpen, setNewWebhookDialogOpen] = useState(false);

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const statusBadge = (status: number) => {
    if (status >= 200 && status < 300) return <Badge variant="success">{status}</Badge>;
    if (status >= 400 && status < 500) return <Badge variant="warning">{status}</Badge>;
    return <Badge variant="destructive">{status}</Badge>;
  };

  const activeWebhooks = webhooks.filter(w => w.is_active).length;

  return (
    <DashboardLayout role="api-client" title="Console API">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Appels API"
          value={callsLoading ? "..." : stats.totalCalls.toLocaleString()}
          icon={Activity}
          trend={{ value: 18, isPositive: true }}
          subtitle="ce mois"
        />
        <StatCard
          title="Taux de succès"
          value={callsLoading ? "..." : `${stats.successRate.toFixed(1)}%`}
          icon={BarChart3}
          subtitle="dernières 24h"
          variant="primary"
        />
        <StatCard
          title="Latence moyenne"
          value={callsLoading ? "..." : `${Math.round(stats.avgLatency)}ms`}
          icon={Activity}
          trend={{ value: 8, isPositive: true }}
          subtitle="optimisé"
        />
        <StatCard
          title="Webhooks actifs"
          value={webhooksLoading ? "..." : activeWebhooks.toString()}
          icon={Webhook}
          subtitle="configurés"
          variant="secondary"
        />
      </div>

      {/* API Keys */}
      <Card className="card-premium mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-5 h-5" />
              Clés API
            </CardTitle>
            <CardDescription>Gérez vos clés d'accès à l'API Wouaka</CardDescription>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setNewApiKeyDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Nouvelle clé
          </Button>
        </CardHeader>
        <CardContent>
          {keysLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Aucune clé API</p>
              <p className="text-sm">Créez votre première clé pour commencer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium">{apiKey.name}</span>
                      <Badge variant={apiKey.is_active ? "default" : "outline"}>
                        {apiKey.is_active ? "Actif" : "Inactif"}
                      </Badge>
                      {apiKey.expires_at && new Date(apiKey.expires_at) < new Date() && (
                        <Badge variant="destructive">Expiré</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-muted-foreground bg-background px-2 py-1 rounded">
                        {showKeys[apiKey.id] ? `${apiKey.key_prefix}...` : "wk_****_****************"}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {showKeys[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8"
                        onClick={() => copyToClipboard(apiKey.key_prefix, apiKey.id)}
                      >
                        {copiedKey === apiKey.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Créée {formatDistanceToNow(new Date(apiKey.created_at), { locale: fr, addSuffix: true })}
                      {apiKey.last_used_at && ` • Dernière utilisation: ${formatDistanceToNow(new Date(apiKey.last_used_at), { locale: fr, addSuffix: true })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => toggleApiKey(apiKey.id, !apiKey.is_active)}
                      title={apiKey.is_active ? "Désactiver" : "Activer"}
                    >
                      {apiKey.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => rotateApiKey(apiKey.id)}
                      title="Régénérer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteApiKey(apiKey.id)}
                      title="Supprimer"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Simulator */}
      <div className="mb-6">
        <ApiSimulator />
      </div>

      {/* Usage Chart */}
      <div className="mb-6">
        <MonthlyScoresChart title="Utilisation de l'API" />
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Webhooks */}
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Webhooks configurés
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setNewWebhookDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Ajouter
            </Button>
          </CardHeader>
          <CardContent>
            {webhooksLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : webhooks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Webhook className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Aucun webhook configuré</p>
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{webhook.name}</p>
                        <Badge variant={webhook.is_active ? "success" : "outline"}>
                          {webhook.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{webhook.url}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {webhook.events.slice(0, 2).map((event, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8"
                        onClick={() => toggleWebhook(webhook.id, !webhook.is_active)}
                      >
                        {webhook.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 text-destructive hover:text-destructive"
                        onClick={() => deleteWebhook(webhook.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent API Calls */}
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Appels récents</CardTitle>
            <Badge variant="outline">{apiCalls.length} appels</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {callsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : apiCalls.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Aucun appel API enregistré</p>
              </div>
            ) : (
              <DataTable
                columns={[
                  { key: "method", header: "Méthode", render: (item) => (
                    <Badge variant={(item.method as string) === "POST" ? "default" : "outline"}>
                      {item.method as string}
                    </Badge>
                  )},
                  { key: "endpoint", header: "Endpoint", render: (item) => (
                    <span className="truncate max-w-[120px] block">{item.endpoint as string}</span>
                  )},
                  { key: "status_code", header: "Status", render: (item) => statusBadge(item.status_code as number) },
                  { key: "processing_time_ms", header: "Latence", render: (item) => (
                    <span>{item.processing_time_ms ? `${item.processing_time_ms}ms` : '-'}</span>
                  )},
                ]}
                data={apiCalls.slice(0, 10) as unknown as Record<string, unknown>[]}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateApiKeyDialog
        open={newApiKeyDialogOpen}
        onOpenChange={setNewApiKeyDialogOpen}
        onCreateKey={createApiKey}
      />
      <CreateWebhookDialog
        open={newWebhookDialogOpen}
        onOpenChange={setNewWebhookDialogOpen}
        onCreateWebhook={createWebhook}
      />
    </DashboardLayout>
  );
};

export default ApiClientDashboard;
