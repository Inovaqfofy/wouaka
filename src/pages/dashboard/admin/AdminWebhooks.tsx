import { useState } from "react";
import { 
  Search, 
  Filter,
  Webhook,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const eventTypes = [
  { id: "score.completed", label: "Score calculé" },
  { id: "score.failed", label: "Score échoué" },
  { id: "kyc.approved", label: "KYC approuvé" },
  { id: "kyc.rejected", label: "KYC rejeté" },
  { id: "payment.completed", label: "Paiement effectué" },
  { id: "subscription.created", label: "Abonnement créé" },
  { id: "subscription.canceled", label: "Abonnement annulé" },
];

const AdminWebhooks = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch all webhooks
  const { data: webhooks, isLoading: webhooksLoading } = useQuery({
    queryKey: ["admin-webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhooks")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch profiles separately
  const { data: profiles } = useQuery({
    queryKey: ["admin-webhook-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, company");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch webhook deliveries
  const { data: deliveries, isLoading: deliveriesLoading } = useQuery({
    queryKey: ["admin-webhook-deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_deliveries")
        .select(`
          *,
          webhooks (name, url)
        `)
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  const filteredWebhooks = webhooks?.filter(w => {
    const matchesSearch = 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && w.is_active) ||
      (statusFilter === "inactive" && !w.is_active);
    return matchesSearch && matchesStatus;
  }) || [];

  const activeCount = webhooks?.filter(w => w.is_active).length || 0;
  const totalDeliveries = deliveries?.length || 0;
  const successfulDeliveries = deliveries?.filter(d => d.status_code && d.status_code >= 200 && d.status_code < 300).length || 0;

  return (
    <DashboardLayout role="admin" title="Webhooks">
      <div className="space-y-6">
        <Tabs defaultValue="webhooks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="webhooks">Endpoints</TabsTrigger>
            <TabsTrigger value="deliveries">Historique des envois</TabsTrigger>
          </TabsList>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Webhook className="w-8 h-8 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">{webhooks?.length || 0}</div>
                      <p className="text-sm text-muted-foreground">Total webhooks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-success" />
                    <div>
                      <div className="text-2xl font-bold text-success">{activeCount}</div>
                      <p className="text-sm text-muted-foreground">Actifs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">{totalDeliveries}</div>
                      <p className="text-sm text-muted-foreground">Envois totaux</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-success" />
                    <div>
                      <div className="text-2xl font-bold">
                        {totalDeliveries > 0 
                          ? Math.round((successfulDeliveries / totalDeliveries) * 100)
                          : 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">Taux de succès</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex flex-1 gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un webhook..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Webhooks Table */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des webhooks</CardTitle>
                <CardDescription>
                  Tous les endpoints configurés par les utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {webhooksLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Propriétaire</TableHead>
                        <TableHead>Événements</TableHead>
                        <TableHead>Échecs</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Dernier appel</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWebhooks.map((webhook) => {
                        const profile = profiles?.find(p => p.id === webhook.user_id);
                        return (
                          <TableRow key={webhook.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Webhook className="w-4 h-4 text-primary" />
                                <span className="font-medium">{webhook.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                                  {webhook.url}
                                </code>
                                <a href={webhook.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                                </a>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{profile?.company || "—"}</p>
                                <p className="text-xs text-muted-foreground">{profile?.email || "—"}</p>
                              </div>
                            </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{webhook.events?.length || 0} événement(s)</Badge>
                          </TableCell>
                          <TableCell>
                            {webhook.failure_count && webhook.failure_count > 0 ? (
                              <Badge variant="destructive">{webhook.failure_count}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={webhook.is_active ? "success" : "secondary"}>
                              {webhook.is_active ? "Actif" : "Inactif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {webhook.last_triggered_at 
                              ? new Date(webhook.last_triggered_at).toLocaleDateString("fr-FR")
                              : "—"
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Tester
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Désactiver
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                      {filteredWebhooks.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Aucun webhook trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deliveries Tab */}
          <TabsContent value="deliveries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historique des envois</CardTitle>
                <CardDescription>
                  Derniers 100 envois de webhooks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deliveriesLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Webhook</TableHead>
                        <TableHead>Événement</TableHead>
                        <TableHead>Code réponse</TableHead>
                        <TableHead>Tentatives</TableHead>
                        <TableHead>Date d'envoi</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveries?.map((delivery) => {
                        const isSuccess = delivery.status_code && delivery.status_code >= 200 && delivery.status_code < 300;
                        
                        return (
                          <TableRow key={delivery.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{delivery.webhooks?.name || "—"}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {delivery.webhooks?.url}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{delivery.event_type}</Badge>
                            </TableCell>
                            <TableCell>
                              {delivery.status_code ? (
                                <Badge variant={isSuccess ? "success" : "destructive"}>
                                  {delivery.status_code}
                                </Badge>
                              ) : (
                                <Badge variant="warning">En attente</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {(delivery.retry_count || 0) + 1}
                            </TableCell>
                            <TableCell>
                              {new Date(delivery.created_at).toLocaleString("fr-FR")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(!deliveries || deliveries.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Aucun envoi trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminWebhooks;
