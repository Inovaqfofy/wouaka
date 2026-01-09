import { useState } from "react";
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Trash2, 
  Power, 
  PowerOff, 
  Check,
  Shield,
  Clock,
  AlertTriangle
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiKeys } from "@/hooks/useApiKeys";
import { CreateApiKeyDialog } from "@/components/api/CreateApiKeyDialog";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

const ApiClientKeys = () => {
  const { apiKeys, isLoading, createApiKey, rotateApiKey, deleteApiKey, toggleApiKey } = useApiKeys();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activeKeys = apiKeys.filter(k => k.is_active);
  const expiredKeys = apiKeys.filter(k => k.expires_at && new Date(k.expires_at) < new Date());

  return (
    <DashboardLayout role="api-client" title="Clés API">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{apiKeys.length}</p>
              <p className="text-sm text-muted-foreground">Total des clés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeKeys.length}</p>
              <p className="text-sm text-muted-foreground">Clés actives</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiredKeys.length}</p>
              <p className="text-sm text-muted-foreground">Clés expirées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys List */}
      <Card className="card-premium">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="w-5 h-5" />
              Gestion des clés API
            </CardTitle>
            <CardDescription>
              Créez et gérez vos clés d'accès à l'API Wouaka
            </CardDescription>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Nouvelle clé
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h3 className="font-medium text-lg mb-2">Aucune clé API</h3>
              <p className="text-sm mb-4">Créez votre première clé pour accéder à l'API Wouaka</p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Créer une clé
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => {
                const isExpired = apiKey.expires_at && new Date(apiKey.expires_at) < new Date();
                return (
                  <div 
                    key={apiKey.id} 
                    className={`p-4 rounded-xl border ${
                      isExpired 
                        ? 'bg-destructive/5 border-destructive/20' 
                        : apiKey.is_active 
                          ? 'bg-muted/50 border-transparent' 
                          : 'bg-muted/30 border-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{apiKey.name}</h4>
                          <Badge variant={apiKey.is_active ? "default" : "outline"}>
                            {apiKey.is_active ? "Actif" : "Inactif"}
                          </Badge>
                          {isExpired && (
                            <Badge variant="destructive">Expiré</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <code className="text-sm text-muted-foreground bg-background px-3 py-1.5 rounded-lg font-mono">
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
                            {copiedKey === apiKey.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Créée {formatDistanceToNow(new Date(apiKey.created_at), { locale: fr, addSuffix: true })}
                          </span>
                          {apiKey.last_used_at && (
                            <span>
                              Dernière utilisation: {formatDistanceToNow(new Date(apiKey.last_used_at), { locale: fr, addSuffix: true })}
                            </span>
                          )}
                          {apiKey.expires_at && (
                            <span className={isExpired ? 'text-destructive' : ''}>
                              Expire le {format(new Date(apiKey.expires_at), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                          )}
                        </div>

                        {apiKey.permissions && (
                          <div className="flex gap-1 mt-3 flex-wrap">
                            {(Array.isArray(apiKey.permissions) ? apiKey.permissions : []).slice(0, 4).map((perm, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {String(perm)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
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
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateApiKeyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreateKey={createApiKey}
      />
    </DashboardLayout>
  );
};

export default ApiClientKeys;
