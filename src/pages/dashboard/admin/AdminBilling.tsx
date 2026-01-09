import { useState } from "react";
import { 
  Search, 
  Filter,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Settings
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive"; icon: typeof CheckCircle }> = {
  completed: { label: "Payé", variant: "success", icon: CheckCircle },
  pending: { label: "En attente", variant: "warning", icon: Clock },
  failed: { label: "Échoué", variant: "destructive", icon: XCircle },
};

const AdminBilling = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all payment transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select(`
          *,
          subscription_plans (name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch all invoices
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch payment settings from system settings
  const { data: paymentSettings } = useQuery({
    queryKey: ["admin-payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("category", "payment")
        .eq("is_system", true);
      
      if (error) throw error;
      return data;
    },
  });

  const filteredTransactions = transactions?.filter(t => {
    const matchesSearch = 
      t.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.payment_method?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const completedAmount = transactions?.filter(t => t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const pendingAmount = transactions?.filter(t => t.status === "pending")
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  return (
    <DashboardLayout role="admin" title="Facturation & Paiements">
      <div className="space-y-6">
        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="invoices">Factures</TabsTrigger>
            <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
            <TabsTrigger value="settings">Moyens de paiement</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">{transactions?.length || 0}</div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-success" />
                    <div>
                      <div className="text-2xl font-bold text-success">{formatPrice(completedAmount)}</div>
                      <p className="text-sm text-muted-foreground">Encaissé</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-warning" />
                    <div>
                      <div className="text-2xl font-bold text-warning">{formatPrice(pendingAmount)}</div>
                      <p className="text-sm text-muted-foreground">En attente</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">
                        {transactions?.filter(t => t.status === "completed").length || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Paiements réussis</p>
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
                    placeholder="Rechercher..."
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
                    <SelectItem value="completed">Payé</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="failed">Échoué</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Historique des transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Transaction</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => {
                        const status = statusConfig[transaction.status] || statusConfig.pending;
                        const StatusIcon = status.icon;
                        
                        return (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-mono text-sm">
                              {transaction.transaction_id.slice(0, 12).toUpperCase()}
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">{formatPrice(Number(transaction.amount))}</span>
                            </TableCell>
                            <TableCell>
                              {transaction.subscription_plans?.name || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {transaction.payment_method || "CinetPay"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="gap-1">
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(transaction.created_at).toLocaleDateString("fr-FR")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredTransactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Aucune transaction trouvée
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Factures émises</CardTitle>
                <CardDescription>Liste de toutes les factures générées</CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Facture</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date émission</TableHead>
                        <TableHead>Date paiement</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices?.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono font-semibold">
                            {invoice.invoice_number}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">{formatPrice(Number(invoice.amount))}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={invoice.status === "paid" ? "success" : "warning"}>
                              {invoice.status === "paid" ? "Payée" : "En attente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.issued_at).toLocaleDateString("fr-FR")}
                          </TableCell>
                          <TableCell>
                            {invoice.paid_at 
                              ? new Date(invoice.paid_at).toLocaleDateString("fr-FR")
                              : "—"
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {invoice.pdf_url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4 mr-1" />
                                  PDF
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!invoices || invoices.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Aucune facture trouvée
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <SubscriptionsManager />
          </TabsContent>

          {/* Payment Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <PaymentMethodsSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

// Subscriptions Manager Component
const SubscriptionsManager = () => {
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["admin-all-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          subscription_plans (name, price_monthly)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch profiles separately
  const { data: profiles } = useQuery({
    queryKey: ["admin-subscription-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, company");
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des abonnements</CardTitle>
        <CardDescription>Tous les abonnements actifs et passés</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Début période</TableHead>
                <TableHead>Fin période</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions?.map((sub) => {
                const profile = profiles?.find(p => p.id === sub.user_id);
                return (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{profile?.company || profile?.full_name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{profile?.email || "—"}</p>
                      </div>
                    </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sub.subscription_plans?.name || "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sub.status === "active" ? "success" : "secondary"}>
                      {sub.status === "active" ? "Actif" : 
                       sub.status === "canceled" ? "Annulé" : 
                       sub.status === "expired" ? "Expiré" : sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(sub.current_period_start).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    {sub.current_period_end 
                      ? new Date(sub.current_period_end).toLocaleDateString("fr-FR")
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
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <XCircle className="w-4 h-4 mr-2" />
                          Résilier
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                );
              })}
              {(!subscriptions || subscriptions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun abonnement trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

// Payment Methods Settings Component
const PaymentMethodsSettings = () => {
  const [cinetpayEnabled, setCinetpayEnabled] = useState(true);
  const [orangeMoneyEnabled, setOrangeMoneyEnabled] = useState(false);
  const [mtnMomoEnabled, setMtnMomoEnabled] = useState(false);
  const [waveEnabled, setWaveEnabled] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration des moyens de paiement
          </CardTitle>
          <CardDescription>
            Activez ou désactivez les moyens de paiement disponibles pour vos clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CinetPay */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">CinetPay</h4>
                <p className="text-sm text-muted-foreground">
                  Passerelle de paiement principale - Cartes bancaires, Mobile Money
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="success">Configuré</Badge>
              <Switch checked={cinetpayEnabled} onCheckedChange={setCinetpayEnabled} />
            </div>
          </div>

          {/* Orange Money */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold">Orange Money</h4>
                <p className="text-sm text-muted-foreground">
                  Paiement via Orange Money directement
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">Non configuré</Badge>
              <Switch checked={orangeMoneyEnabled} onCheckedChange={setOrangeMoneyEnabled} />
            </div>
          </div>

          {/* MTN MoMo */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold">MTN Mobile Money</h4>
                <p className="text-sm text-muted-foreground">
                  Paiement via MTN MoMo directement
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">Non configuré</Badge>
              <Switch checked={mtnMomoEnabled} onCheckedChange={setMtnMomoEnabled} />
            </div>
          </div>

          {/* Wave */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold">Wave</h4>
                <p className="text-sm text-muted-foreground">
                  Paiement via Wave
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">Non configuré</Badge>
              <Switch checked={waveEnabled} onCheckedChange={setWaveEnabled} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CinetPay Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration CinetPay</CardTitle>
          <CardDescription>
            Paramètres de la passerelle de paiement CinetPay
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="site_id">Site ID</Label>
              <Input id="site_id" placeholder="Votre Site ID CinetPay" type="password" defaultValue="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input id="api_key" placeholder="Votre API Key CinetPay" type="password" defaultValue="••••••••••••••••" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="secret_key">Secret Key</Label>
              <Input id="secret_key" placeholder="Votre Secret Key" type="password" defaultValue="••••••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mode">Mode</Label>
              <Select defaultValue="sandbox">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
                  <SelectItem value="live">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button>
              Enregistrer la configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBilling;
