import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Key,
  Search,
  MoreHorizontal,
  Power,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Gauge,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface ApiKeyWithUser {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[] | null;
  rate_limit: number | null;
  is_active: boolean | null;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  company?: string;
  api_calls_count?: number;
}

const AVAILABLE_PERMISSIONS = [
  { value: 'score', label: 'Score de crédit', description: 'Calculer des scores' },
  { value: 'kyc', label: 'KYC', description: 'Vérification d\'identité' },
  { value: 'identity', label: 'Identité', description: 'Enrichissement de profil' },
  { value: 'precheck', label: 'Precheck', description: 'Vérification rapide' },
  { value: 'fraud', label: 'Fraude', description: 'Détection de fraude' },
  { value: 'monitoring', label: 'Monitoring', description: 'Surveillance de profils' },
];

export default function AdminApiKeys() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedKey, setSelectedKey] = useState<ApiKeyWithUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Edit form state
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editRateLimit, setEditRateLimit] = useState<number>(1000);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all API keys with user information
  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['admin-api-keys'],
    queryFn: async () => {
      // Fetch all API keys (super admin has access via RLS)
      const { data: keys, error: keysError } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (keysError) throw keysError;

      // Fetch profiles for user info
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, company');

      if (profilesError) throw profilesError;

      // Fetch API call counts
      const { data: apiCalls, error: apiCallsError } = await supabase
        .from('api_calls')
        .select('api_key_id');

      // Create a map of api_key_id to call count
      const callCounts: Record<string, number> = {};
      if (!apiCallsError && apiCalls) {
        apiCalls.forEach(call => {
          callCounts[call.api_key_id] = (callCounts[call.api_key_id] || 0) + 1;
        });
      }

      // Merge data
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return (keys || []).map(key => {
        const profile = profileMap.get(key.user_id);
        return {
          ...key,
          permissions: key.permissions as string[] | null,
          user_email: profile?.email,
          user_name: profile?.full_name,
          company: profile?.company,
          api_calls_count: callCounts[key.id] || 0,
        };
      }) as ApiKeyWithUser[];
    },
  });

  // Toggle API key status
  const toggleMutation = useMutation({
    mutationFn: async ({ keyId, isActive }: { keyId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', keyId);
      
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      toast({
        title: isActive ? 'Clé activée' : 'Clé suspendue',
        description: isActive 
          ? 'La clé API est maintenant active' 
          : 'La clé API a été suspendue',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut de la clé',
        variant: 'destructive',
      });
    },
  });

  // Update API key permissions/rate limit
  const updateMutation = useMutation({
    mutationFn: async ({ keyId, permissions, rateLimit }: { keyId: string; permissions: string[]; rateLimit: number }) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ 
          permissions: permissions as any, 
          rate_limit: rateLimit,
          updated_at: new Date().toISOString() 
        })
        .eq('id', keyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Clé mise à jour',
        description: 'Les paramètres de la clé ont été modifiés',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
      setEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la clé',
        variant: 'destructive',
      });
    },
  });

  // Delete API key
  const deleteMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Clé supprimée',
        description: 'La clé API a été définitivement supprimée',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la clé',
        variant: 'destructive',
      });
    },
  });

  // Filter keys
  const filteredKeys = apiKeys.filter(key => {
    const matchesSearch = 
      key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.key_prefix.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && key.is_active) ||
      (statusFilter === 'inactive' && !key.is_active) ||
      (statusFilter === 'expired' && key.expires_at && new Date(key.expires_at) < new Date());
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: apiKeys.length,
    active: apiKeys.filter(k => k.is_active).length,
    inactive: apiKeys.filter(k => !k.is_active).length,
    expired: apiKeys.filter(k => k.expires_at && new Date(k.expires_at) < new Date()).length,
    totalCalls: apiKeys.reduce((sum, k) => sum + (k.api_calls_count || 0), 0),
  };

  const openEditDialog = (key: ApiKeyWithUser) => {
    setSelectedKey(key);
    setEditPermissions(key.permissions || []);
    setEditRateLimit(key.rate_limit || 1000);
    setEditDialogOpen(true);
  };

  const handlePermissionToggle = (permission: string) => {
    setEditPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  return (
    <DashboardLayout role="admin" title="Gestion des Clés API">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Key className="w-6 h-6" />
            Gestion des Clés API
          </h1>
          <p className="text-muted-foreground">
            Gérez toutes les clés API de la plateforme
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Key className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Actives</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suspendues</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.inactive}</p>
                </div>
                <XCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expirées</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                </div>
                <Clock className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Appels API</p>
                  <p className="text-2xl font-bold">{stats.totalCalls.toLocaleString()}</p>
                </div>
                <Activity className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, préfixe, email, entreprise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="inactive">Suspendues</SelectItem>
                  <SelectItem value="expired">Expirées</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] })}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Keys Table */}
        <Card>
          <CardHeader>
            <CardTitle>Clés API ({filteredKeys.length})</CardTitle>
            <CardDescription>
              Liste complète des clés API avec leurs permissions et statistiques
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredKeys.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune clé API trouvée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clé</TableHead>
                      <TableHead>Propriétaire</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Limite</TableHead>
                      <TableHead>Appels</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Dernière utilisation</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKeys.map((key) => {
                      const isExpired = key.expires_at && new Date(key.expires_at) < new Date();
                      
                      return (
                        <TableRow key={key.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{key.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {key.key_prefix}...
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm">{key.user_name || key.user_email}</p>
                                {key.company && (
                                  <p className="text-xs text-muted-foreground">{key.company}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(key.permissions || []).slice(0, 2).map(perm => (
                                <Badge key={perm} variant="secondary" className="text-xs">
                                  {perm}
                                </Badge>
                              ))}
                              {(key.permissions?.length || 0) > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(key.permissions?.length || 0) - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Gauge className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{key.rate_limit?.toLocaleString()}/h</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{key.api_calls_count?.toLocaleString() || 0}</span>
                          </TableCell>
                          <TableCell>
                            {isExpired ? (
                              <Badge variant="destructive">Expirée</Badge>
                            ) : key.is_active ? (
                              <Badge className="bg-green-100 text-green-700">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Suspendue</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {key.last_used_at
                                ? formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true, locale: fr })
                                : 'Jamais'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setSelectedKey(key);
                                  setDetailsDialogOpen(true);
                                }}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(key)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => toggleMutation.mutate({ 
                                    keyId: key.id, 
                                    isActive: !key.is_active 
                                  })}
                                >
                                  <Power className="w-4 h-4 mr-2" />
                                  {key.is_active ? 'Suspendre' : 'Activer'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedKey(key);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la clé API</DialogTitle>
            <DialogDescription>
              Modifiez les permissions et limites de la clé "{selectedKey?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid gap-2">
                {AVAILABLE_PERMISSIONS.map(perm => (
                  <div key={perm.value} className="flex items-center space-x-3">
                    <Checkbox
                      id={perm.value}
                      checked={editPermissions.includes(perm.value)}
                      onCheckedChange={() => handlePermissionToggle(perm.value)}
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor={perm.value} className="font-normal cursor-pointer">
                        {perm.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rateLimit">Limite de requêtes (par heure)</Label>
              <Input
                id="rateLimit"
                type="number"
                value={editRateLimit}
                onChange={(e) => setEditRateLimit(parseInt(e.target.value) || 1000)}
                min={0}
                max={100000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => selectedKey && updateMutation.mutate({
                keyId: selectedKey.id,
                permissions: editPermissions,
                rateLimit: editRateLimit,
              })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Supprimer la clé API
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement la clé "{selectedKey?.name}" ?
              Cette action est irréversible et bloquera immédiatement tous les appels API utilisant cette clé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedKey && deleteMutation.mutate(selectedKey.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la clé API</DialogTitle>
          </DialogHeader>
          {selectedKey && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-medium">{selectedKey.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Préfixe</p>
                  <p className="font-mono">{selectedKey.key_prefix}...</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Propriétaire</p>
                  <p className="font-medium">{selectedKey.user_name || selectedKey.user_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entreprise</p>
                  <p className="font-medium">{selectedKey.company || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  {selectedKey.is_active ? (
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Suspendue</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Limite</p>
                  <p className="font-medium">{selectedKey.rate_limit?.toLocaleString()} req/h</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Créée le</p>
                  <p className="font-medium">
                    {format(new Date(selectedKey.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expire le</p>
                  <p className="font-medium">
                    {selectedKey.expires_at 
                      ? format(new Date(selectedKey.expires_at), 'dd/MM/yyyy', { locale: fr })
                      : 'Jamais'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dernière utilisation</p>
                  <p className="font-medium">
                    {selectedKey.last_used_at
                      ? format(new Date(selectedKey.last_used_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                      : 'Jamais'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total appels</p>
                  <p className="font-medium">{selectedKey.api_calls_count?.toLocaleString() || 0}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedKey.permissions || []).map(perm => (
                    <Badge key={perm} variant="secondary">{perm}</Badge>
                  ))}
                  {(!selectedKey.permissions || selectedKey.permissions.length === 0) && (
                    <span className="text-sm text-muted-foreground">Aucune permission</span>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Fermer
            </Button>
            <Button onClick={() => {
              setDetailsDialogOpen(false);
              if (selectedKey) openEditDialog(selectedKey);
            }}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
