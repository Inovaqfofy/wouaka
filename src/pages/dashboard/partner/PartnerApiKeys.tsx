import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { 
  Key, 
  Plus,
  Copy,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle
} from "lucide-react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useToast } from "@/hooks/use-toast";
import { CreateApiKeyDialog } from "@/components/api/CreateApiKeyDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const PartnerApiKeys = () => {
  const { toast } = useToast();
  const { apiKeys, isLoading, toggleApiKey, deleteApiKey, createApiKey } = useApiKeys();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const copyToClipboard = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    toast({
      title: "Clé copiée",
      description: "La clé API a été copiée dans le presse-papier",
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activeKeys = apiKeys?.filter(k => k.is_active).length || 0;
  const expiredKeys = apiKeys?.filter(k => k.expires_at && new Date(k.expires_at) < new Date()).length || 0;

  return (
    <DashboardLayout role="partner" title="Clés API">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{apiKeys?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total clés</p>
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
                  <p className="text-2xl font-bold text-green-600">{activeKeys}</p>
                  <p className="text-sm text-muted-foreground">Actives</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Key className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{expiredKeys}</p>
                  <p className="text-sm text-muted-foreground">Expirées</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Keys List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mes Clés API</CardTitle>
              <CardDescription>Gérez vos clés d'accès à l'API Wouaka</CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Clé
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : !apiKeys || apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune clé API</h3>
                <p className="text-muted-foreground mb-4">
                  Créez votre première clé pour accéder à l'API
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une clé
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div key={key.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{key.name}</h3>
                          <Badge variant={key.is_active ? 'default' : 'secondary'}>
                            {key.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Créée le {format(new Date(key.created_at), 'dd MMMM yyyy', { locale: fr })}
                          {key.expires_at && ` • Expire le ${format(new Date(key.expires_at), 'dd MMM yyyy', { locale: fr })}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Active</span>
                        <Switch
                          checked={key.is_active || false}
                          onCheckedChange={(checked) => toggleApiKey(key.id, checked)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                      <span className="flex-1">
                        {showKeys[key.id] ? `${key.key_prefix}${'*'.repeat(32)}` : `${key.key_prefix}${'•'.repeat(32)}`}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => toggleKeyVisibility(key.id)}>
                        {showKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => copyToClipboard(`${key.key_prefix}${'*'.repeat(32)}`, key.id)}
                      >
                        {copiedKey === key.id ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Régénérer
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteApiKey(key.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateApiKeyDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreateKey={createApiKey} />
    </DashboardLayout>
  );
};

export default PartnerApiKeys;
