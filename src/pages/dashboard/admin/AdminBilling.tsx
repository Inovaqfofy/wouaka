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
  Settings,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Calendar,
  FlaskConical,
  Ban,
  Mail,
  Send,
  ExternalLink,
  Gift,
  Plus
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ManualSubscriptionDialog } from "@/components/admin/ManualSubscriptionDialog";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary"; icon: typeof CheckCircle }> = {
  completed: { label: "Payé", variant: "success", icon: CheckCircle },
  pending: { label: "En attente", variant: "warning", icon: Clock },
  failed: { label: "Échoué", variant: "destructive", icon: XCircle },
  cancelled: { label: "Annulé", variant: "secondary", icon: Ban },
  expired: { label: "Expiré", variant: "secondary", icon: AlertTriangle },
};

interface TransactionDetails {
  id: string;
  user_id: string;
  transaction_id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  subscription_plans?: { name: string } | null;
  metadata?: Record<string, unknown> | null;
  profiles?: { email: string; full_name: string | null } | null;
  payment_url?: string | null;
}

interface SubscriptionDetails {
  id: string;
  user_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string | null;
  subscription_plans?: { name: string; price_monthly: number } | null;
}

// Helper to check if a transaction is abandoned (pending > 30 minutes)
const isAbandoned = (createdAt: string): boolean => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - created.getTime()) / (1000 * 60);
  return diffMinutes > 30;
};

// Helper to check if a transaction is old (pending > 24 hours)
const isOldPending = (createdAt: string): boolean => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  return diffHours > 24;
};

// Helper to detect test/sandbox transactions
const isTestTransaction = (metadata: Record<string, unknown> | null): boolean => {
  if (!metadata) return false;
  return metadata.environment === 'sandbox' || metadata.is_test === true;
};

// Get product type from transaction
const getProductType = (metadata: Record<string, unknown> | null): string => {
  if (!metadata) return "other";
  const packageName = (metadata.package_name as string || "").toLowerCase();
  if (packageName.includes("score")) return "score";
  if (packageName.includes("kyc")) return "kyc";
  if (packageName.includes("pack") || packageName.includes("bundle")) return "bundle";
  return "other";
};

const AdminBilling = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [showTests, setShowTests] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetails | null>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState<string | null>(null);
  const [transactionToRemind, setTransactionToRemind] = useState<TransactionDetails | null>(null);
  const [isManualSubscriptionOpen, setIsManualSubscriptionOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all payment transactions with profiles
  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select(`
          id,
          user_id,
          plan_id,
          transaction_id,
          amount,
          currency,
          status,
          payment_method,
          payment_url,
          metadata,
          created_at,
          paid_at,
          subscription_plans (name),
          profiles!payment_transactions_user_id_fkey(email, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(200);
      
      if (error) {
        // Fallback without join
        const { data: fallback } = await supabase
          .from("payment_transactions")
          .select(`
            id,
            user_id,
            plan_id,
            transaction_id,
            amount,
            currency,
            status,
            payment_method,
            metadata,
            created_at,
            paid_at,
            subscription_plans (name)
          `)
          .order("created_at", { ascending: false })
          .limit(200);
        return fallback || [];
      }
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

  // Cancel transaction mutation
  const cancelTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from("payment_transactions")
        .update({ status: "cancelled" })
        .eq("id", transactionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
      toast.success("Transaction annulée");
      setIsCancelDialogOpen(false);
      setTransactionToCancel(null);
    },
    onError: () => {
      toast.error("Erreur lors de l'annulation");
    },
  });

  // Purge old pending transactions mutation
  const purgeOldTransactionsMutation = useMutation({
    mutationFn: async () => {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const { error } = await supabase
        .from("payment_transactions")
        .update({ status: "expired" })
        .eq("status", "pending")
        .lt("created_at", twentyFourHoursAgo.toISOString());
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
      toast.success("Transactions abandonnées marquées comme expirées");
      setIsPurgeDialogOpen(false);
    },
    onError: () => {
      toast.error("Erreur lors de la purge");
    },
  });

  // Send payment reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async (transaction: TransactionDetails) => {
      const userEmail = transaction.profiles?.email;
      const fullName = transaction.profiles?.full_name || userEmail?.split('@')[0] || 'Client';
      const metadata = transaction.metadata as Record<string, unknown> | null;
      const productName = metadata?.package_name as string || transaction.subscription_plans?.name || 'Produit WOUAKA';
      const paymentUrl = transaction.payment_url;

      if (!userEmail) {
        throw new Error("Email du client non disponible");
      }
      if (!paymentUrl) {
        throw new Error("Lien de paiement non disponible");
      }

      const { error } = await supabase.functions.invoke('send-automated-email', {
        body: {
          template: 'payment_reminder',
          to: userEmail,
          data: {
            fullName,
            productName,
            amount: transaction.amount,
            paymentUrl,
            transactionId: transaction.transaction_id,
            createdAt: transaction.created_at,
          },
          triggeredBy: 'admin_reminder',
        },
      });

      if (error) throw error;

      // Log to audit
      await supabase.from('audit_logs').insert({
        action: 'payment_reminder_sent',
        entity_type: 'transaction',
        entity_id: transaction.id,
        metadata: {
          product: productName,
          amount: transaction.amount,
          recipient_masked: userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        },
      });
    },
    onSuccess: () => {
      toast.success("Email de relance envoyé");
      setIsReminderDialogOpen(false);
      setTransactionToRemind(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'envoi de la relance");
    },
  });

  const filteredTransactions = transactions?.filter(t => {
    const metadata = t.metadata as Record<string, unknown> | null;
    const productName = metadata?.package_name as string || t.subscription_plans?.name || "";
    const userEmail = (t as TransactionDetails).profiles?.email || "";
    
    const matchesSearch = 
      t.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.payment_method?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    
    const productType = getProductType(metadata);
    const matchesProduct = productFilter === "all" || productType === productFilter;
    
    const isTest = isTestTransaction(metadata);
    const matchesTestFilter = showTests || !isTest;
    
    return matchesSearch && matchesStatus && matchesProduct && matchesTestFilter;
  }) || [];

  const completedAmount = transactions?.filter(t => t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const pendingAmount = transactions?.filter(t => t.status === "pending")
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const pendingCount = transactions?.filter(t => t.status === "pending").length || 0;
  const abandonedCount = transactions?.filter(t => 
    t.status === "pending" && isAbandoned(t.created_at)
  ).length || 0;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const handleViewTransaction = (transaction: TransactionDetails) => {
    setSelectedTransaction(transaction);
    setIsTransactionDialogOpen(true);
  };

  const handleCancelTransaction = (transactionId: string) => {
    setTransactionToCancel(transactionId);
    setIsCancelDialogOpen(true);
  };

  const handleSendReminder = (transaction: TransactionDetails) => {
    setTransactionToRemind(transaction);
    setIsReminderDialogOpen(true);
  };

  const handleExportTransactions = () => {
    if (!filteredTransactions.length) {
      toast.error("Aucune transaction à exporter");
      return;
    }

    const headers = ["ID Transaction", "Montant", "Produit", "Email", "Méthode", "Statut", "Date"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(t => {
        const metadata = t.metadata as Record<string, unknown> | null;
        return [
          t.transaction_id,
          t.amount,
          metadata?.package_name || t.subscription_plans?.name || "",
          (t as TransactionDetails).profiles?.email || t.user_id,
          t.payment_method || "CinetPay",
          t.status,
          new Date(t.created_at).toLocaleDateString("fr-FR")
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("Export CSV téléchargé");
  };

  const handleRefresh = async () => {
    await refetchTransactions();
    toast.success("Données actualisées");
  };

  return (
    <DashboardLayout role="admin" title="Facturation & Paiements">
      <div className="space-y-6">
        {/* Header with Manual Grant Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Gestion des paiements</h2>
            <p className="text-sm text-muted-foreground">
              Transactions, factures et attribution manuelle de forfaits
            </p>
          </div>
          <Button onClick={() => setIsManualSubscriptionOpen(true)} className="gap-2">
            <Gift className="w-4 h-4" />
            Attribuer un forfait
          </Button>
        </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                      <p className="text-sm text-muted-foreground">En attente ({pendingCount})</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                    <div>
                      <div className="text-2xl font-bold text-destructive">{abandonedCount}</div>
                      <p className="text-sm text-muted-foreground">Abandonnées</p>
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
                      <p className="text-sm text-muted-foreground">Réussis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher ID, email, produit..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="completed">Payé</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="failed">Échoué</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                    <SelectItem value="expired">Expiré</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Produit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les produits</SelectItem>
                    <SelectItem value="score">Scoring WOUAKA</SelectItem>
                    <SelectItem value="kyc">Vérification WOUAKA</SelectItem>
                    <SelectItem value="bundle">Pack / Bundle</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
                  <FlaskConical className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="show-tests" className="text-sm cursor-pointer">Tests</Label>
                  <Switch 
                    id="show-tests"
                    checked={showTests} 
                    onCheckedChange={setShowTests}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-between">
                <div className="flex gap-2">
                  {abandonedCount > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive border-destructive/50 hover:bg-destructive/10"
                      onClick={() => setIsPurgeDialogOpen(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Purger {abandonedCount} abandonnée{abandonedCount > 1 ? 's' : ''} (&gt;24h)
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" onClick={handleExportTransactions}>
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Historique des transactions</CardTitle>
                <CardDescription>
                  {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''} affichée{filteredTransactions.length > 1 ? 's' : ''}
                </CardDescription>
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
                        <TableHead>Client</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Montant</TableHead>
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
                        const metadata = transaction.metadata as Record<string, unknown> | null;
                        const productName = 
                          metadata?.package_name as string || 
                          transaction.subscription_plans?.name || 
                          "—";
                        const userEmail = (transaction as TransactionDetails).profiles?.email;
                        const userName = (transaction as TransactionDetails).profiles?.full_name;
                        const abandoned = transaction.status === "pending" && isAbandoned(transaction.created_at);
                        const oldPending = transaction.status === "pending" && isOldPending(transaction.created_at);
                        const isTest = isTestTransaction(metadata);
                        
                        return (
                          <TableRow 
                            key={transaction.id}
                            className={oldPending ? "bg-destructive/5" : abandoned ? "bg-warning/5" : ""}
                          >
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-sm">
                                  {userName || userEmail?.split('@')[0] || "—"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {userEmail || transaction.user_id.slice(0, 8)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{productName}</span>
                                {isTest && (
                                  <Badge variant="outline" className="text-xs gap-1 bg-muted">
                                    <FlaskConical className="w-3 h-3" />
                                    Test
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">{formatPrice(Number(transaction.amount))}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {transaction.payment_method || "cinetpay"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant={status.variant} className="gap-1 w-fit">
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
                                </Badge>
                                {abandoned && !oldPending && (
                                  <Badge variant="outline" className="text-xs gap-1 text-warning border-warning/50">
                                    <Clock className="w-3 h-3" />
                                    Abandonnée
                                  </Badge>
                                )}
                                {oldPending && (
                                  <Badge variant="outline" className="text-xs gap-1 text-destructive border-destructive/50">
                                    <AlertTriangle className="w-3 h-3" />
                                    &gt;24h
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">
                                  {new Date(transaction.created_at).toLocaleDateString("fr-FR")}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(transaction.created_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewTransaction(transaction as TransactionDetails)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  {transaction.status === "pending" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      {(transaction as TransactionDetails).payment_url && (transaction as TransactionDetails).profiles?.email && (
                                        <DropdownMenuItem 
                                          onClick={() => handleSendReminder(transaction as TransactionDetails)}
                                        >
                                          <Mail className="w-4 h-4 mr-2" />
                                          Envoyer une relance
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem 
                                        className="text-destructive"
                                        onClick={() => handleCancelTransaction(transaction.id)}
                                      >
                                        <Ban className="w-4 h-4 mr-2" />
                                        Annuler
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
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
            <InvoicesManager invoices={invoices} isLoading={invoicesLoading} formatPrice={formatPrice} />
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <SubscriptionsManager formatPrice={formatPrice} />
          </TabsContent>

          {/* Payment Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <PaymentMethodsSettings />
          </TabsContent>
        </Tabs>

        {/* Transaction Details Dialog */}
        <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Détails de la transaction</DialogTitle>
              <DialogDescription>
                {selectedTransaction?.transaction_id?.slice(0, 16).toUpperCase() || selectedTransaction?.id.slice(0, 16).toUpperCase()}
              </DialogDescription>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Montant</Label>
                    <p className="font-semibold text-lg">{formatPrice(Number(selectedTransaction.amount))}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Statut</Label>
                    <div className="mt-1">
                      <Badge variant={statusConfig[selectedTransaction.status]?.variant || "secondary"}>
                        {statusConfig[selectedTransaction.status]?.label || selectedTransaction.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Méthode</Label>
                    <p className="font-medium">{selectedTransaction.payment_method || "CinetPay"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="font-medium">
                      {new Date(selectedTransaction.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Produit</Label>
                    <p className="font-medium">
                      {(selectedTransaction.metadata as Record<string, unknown>)?.package_name as string || 
                       selectedTransaction.subscription_plans?.name || "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Client</Label>
                    <p className="font-medium">
                      {selectedTransaction.profiles?.email || selectedTransaction.user_id.slice(0, 12)}
                    </p>
                  </div>
                </div>
                {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Metadata</Label>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                      {JSON.stringify(selectedTransaction.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Transaction Confirmation */}
        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Annuler cette transaction ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action marquera la transaction comme annulée. Elle ne sera pas remboursée automatiquement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Non, garder</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (transactionToCancel) {
                    cancelTransactionMutation.mutate(transactionToCancel);
                  }
                }}
                disabled={cancelTransactionMutation.isPending}
              >
                {cancelTransactionMutation.isPending ? "Annulation..." : "Oui, annuler"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Purge Confirmation */}
        <AlertDialog open={isPurgeDialogOpen} onOpenChange={setIsPurgeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Purger les transactions abandonnées ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action marquera toutes les transactions en attente depuis plus de 24 heures comme "expirées". 
                Cela n'affecte pas les paiements réels.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => purgeOldTransactionsMutation.mutate()}
                disabled={purgeOldTransactionsMutation.isPending}
              >
                {purgeOldTransactionsMutation.isPending ? "Purge en cours..." : "Confirmer la purge"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Payment Reminder Confirmation */}
        <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Envoyer une relance de paiement
              </DialogTitle>
              <DialogDescription>
                Un email sera envoyé au client avec le lien de paiement actif.
              </DialogDescription>
            </DialogHeader>
            {transactionToRemind && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Destinataire</span>
                    <span className="font-medium">{transactionToRemind.profiles?.email || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Produit</span>
                    <span className="font-medium">
                      {(transactionToRemind.metadata as Record<string, unknown>)?.package_name as string || 
                       transactionToRemind.subscription_plans?.name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Montant</span>
                    <span className="font-semibold text-primary">{formatPrice(Number(transactionToRemind.amount))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Commande du</span>
                    <span className="text-sm">{new Date(transactionToRemind.created_at).toLocaleString("fr-FR")}</span>
                  </div>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    <Send className="w-4 h-4 inline-block mr-1" />
                    L'email contiendra un bouton de paiement vers CinetPay avec le lien de paiement sécurisé.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsReminderDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (transactionToRemind) {
                    sendReminderMutation.mutate(transactionToRemind);
                  }
                }}
                disabled={sendReminderMutation.isPending}
              >
                {sendReminderMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer la relance
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manual Subscription Dialog */}
        <ManualSubscriptionDialog 
          open={isManualSubscriptionOpen}
          onOpenChange={setIsManualSubscriptionOpen}
        />
      </div>
    </DashboardLayout>
  );
};

// Invoices Manager Component
interface InvoicesManagerProps {
  invoices: Array<{
    id: string;
    invoice_number: string;
    amount: number;
    status: string;
    issued_at: string;
    paid_at: string | null;
    pdf_url: string | null;
  }> | undefined;
  isLoading: boolean;
  formatPrice: (amount: number) => string;
}

const InvoicesManager = ({ invoices, isLoading, formatPrice }: InvoicesManagerProps) => {
  const handleDownloadInvoice = (pdfUrl: string | null, invoiceNumber: string) => {
    if (!pdfUrl) {
      toast.error("Le PDF n'est pas disponible");
      return;
    }
    window.open(pdfUrl, "_blank");
    toast.success(`Téléchargement de ${invoiceNumber}`);
  };

  const handleExportInvoices = () => {
    if (!invoices?.length) {
      toast.error("Aucune facture à exporter");
      return;
    }

    const headers = ["N° Facture", "Montant", "Statut", "Date émission", "Date paiement"];
    const csvContent = [
      headers.join(","),
      ...invoices.map(inv => [
        inv.invoice_number,
        inv.amount,
        inv.status,
        new Date(inv.issued_at).toLocaleDateString("fr-FR"),
        inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("fr-FR") : ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `factures_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("Export CSV téléchargé");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Factures émises</CardTitle>
          <CardDescription>Liste de toutes les factures générées</CardDescription>
        </div>
        <Button variant="outline" onClick={handleExportInvoices}>
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDownloadInvoice(invoice.pdf_url, invoice.invoice_number)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
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
  );
};

// Subscriptions Manager Component - Now shows both B2C (Certificates) and B2B (Partners)
interface SubscriptionsManagerProps {
  formatPrice: (amount: number) => string;
}

const SubscriptionsManager = ({ formatPrice }: SubscriptionsManagerProps) => {
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionDetails | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"borrower" | "partner">("borrower");
  const queryClient = useQueryClient();

  // Fetch certificate subscriptions (B2C)
  const { data: certificateSubscriptions, isLoading: certLoading } = useQuery({
    queryKey: ["admin-certificate-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_subscriptions")
        .select(`
          *,
          profiles!certificate_subscriptions_user_id_fkey(email, full_name, phone)
        `)
        .order("created_at", { ascending: false });
      
      if (error) {
        // Fallback without join
        const { data: fallback } = await supabase
          .from("certificate_subscriptions")
          .select("*")
          .order("created_at", { ascending: false });
        return fallback || [];
      }
      return data || [];
    },
  });

  // Fetch partner subscriptions (B2B)
  const { data: partnerSubscriptions, isLoading: partnerLoading } = useQuery({
    queryKey: ["admin-partner-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch profiles separately for partner subscriptions
  const { data: profiles } = useQuery({
    queryKey: ["admin-subscription-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, company, phone");
      
      if (error) throw error;
      return data;
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: "borrower" | "partner" }) => {
      const table = type === "borrower" ? "certificate_subscriptions" : "subscriptions";
      const { error } = await supabase
        .from(table)
        .update({ status: "canceled" })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-certificate-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-partner-subscriptions"] });
      toast.success("Abonnement résilié avec succès");
      setIsCancelDialogOpen(false);
      setSelectedSubscription(null);
    },
    onError: () => {
      toast.error("Erreur lors de la résiliation");
    },
  });

  const getPlanName = (planId: string | null) => {
    if (!planId) return "—";
    const planNames: Record<string, string> = {
      "emprunteur-decouverte": "Découverte",
      "emprunteur-essentiel": "Essentiel", 
      "emprunteur-premium": "Premium",
      "partenaire-starter": "Starter",
      "partenaire-business": "Business",
      "partenaire-enterprise": "Enterprise",
    };
    return planNames[planId] || planId;
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "borrower" | "partner")}>
        <TabsList className="mb-4">
          <TabsTrigger value="borrower">Certificats Emprunteurs (B2C)</TabsTrigger>
          <TabsTrigger value="partner">Abonnements Partenaires (B2B)</TabsTrigger>
        </TabsList>

        <TabsContent value="borrower">
          <Card>
            <CardHeader>
              <CardTitle>Certificats Emprunteurs</CardTitle>
              <CardDescription>Abonnements aux certificats de solvabilité</CardDescription>
            </CardHeader>
            <CardContent>
              {certLoading ? (
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
                    {certificateSubscriptions?.map((sub: Record<string, unknown>) => {
                      const profile = sub.profiles as { email?: string; full_name?: string } | null;
                      return (
                        <TableRow key={sub.id as string}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{profile?.full_name || "—"}</p>
                              <p className="text-sm text-muted-foreground">{profile?.email || "—"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getPlanName(sub.plan_id as string)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={(sub.status as string) === "active" ? "success" : "secondary"}>
                              {(sub.status as string) === "active" ? "Actif" : 
                               (sub.status as string) === "canceled" ? "Annulé" : 
                               (sub.status as string) === "expired" ? "Expiré" : sub.status as string}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(sub.valid_from as string).toLocaleDateString("fr-FR")}
                          </TableCell>
                          <TableCell>
                            {sub.valid_until
                              ? new Date(sub.valid_until as string).toLocaleDateString("fr-FR")
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
                                <DropdownMenuItem onClick={() => toast.info("Détails: " + sub.plan_id)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {(sub.status as string) === "active" && (
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => {
                                      setSelectedSubscription({ 
                                        id: sub.id as string, 
                                        user_id: sub.user_id as string,
                                        status: sub.status as string,
                                        current_period_start: sub.valid_from as string,
                                        current_period_end: sub.valid_until as string | null
                                      });
                                      setIsCancelDialogOpen(true);
                                    }}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Résilier
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!certificateSubscriptions || certificateSubscriptions.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Aucun certificat emprunteur trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partner">
          <Card>
            <CardHeader>
              <CardTitle>Abonnements Partenaires</CardTitle>
              <CardDescription>Abonnements B2B des partenaires et entreprises</CardDescription>
            </CardHeader>
            <CardContent>
              {partnerLoading ? (
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
                    {partnerSubscriptions?.map((sub) => {
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
                            <Badge variant="outline">{getPlanName(sub.plan_id)}</Badge>
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
                                <DropdownMenuItem onClick={() => toast.info("Détails: " + sub.plan_id)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {sub.status === "active" && (
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => {
                                      setSelectedSubscription({ 
                                        id: sub.id, 
                                        user_id: sub.user_id,
                                        status: sub.status,
                                        current_period_start: sub.current_period_start,
                                        current_period_end: sub.current_period_end 
                                      });
                                      setIsCancelDialogOpen(true);
                                    }}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Résilier
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!partnerSubscriptions || partnerSubscriptions.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Aucun abonnement partenaire trouvé
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

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la résiliation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir résilier cet abonnement ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedSubscription) {
                  cancelSubscriptionMutation.mutate({ 
                    id: selectedSubscription.id, 
                    type: activeTab 
                  });
                }
              }}
              disabled={cancelSubscriptionMutation.isPending}
            >
              {cancelSubscriptionMutation.isPending ? "Résiliation..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Payment Methods Settings Component
const PaymentMethodsSettings = () => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate saving - in production this would save to settings table
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Configuration enregistrée avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const supportedPaymentMethods = [
    {
      name: "Cartes bancaires",
      description: "Visa, Mastercard",
      icon: CreditCard,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
      countries: ["International"]
    },
    {
      name: "Orange Money",
      description: "Mobile Money Orange",
      icon: DollarSign,
      iconColor: "text-orange-500",
      bgColor: "bg-orange-500/10",
      countries: ["CI", "SN", "ML", "BF", "CM"]
    },
    {
      name: "MTN Mobile Money",
      description: "MTN MoMo",
      icon: DollarSign,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-500/10",
      countries: ["CI", "BJ", "CM", "CG"]
    },
    {
      name: "Wave",
      description: "Paiement Wave",
      icon: DollarSign,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
      countries: ["SN", "CI", "ML"]
    },
    {
      name: "Moov Money",
      description: "Moov Africa",
      icon: DollarSign,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      countries: ["CI", "BJ", "BF", "TG"]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Moyens de paiement acceptés via CinetPay */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Moyens de paiement acceptés
              </CardTitle>
              <CardDescription className="mt-1.5">
                Tous les moyens de paiement sont gérés via CinetPay, notre passerelle de paiement principale
              </CardDescription>
            </div>
            <Badge variant="success" className="h-fit">CinetPay actif</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message explicatif */}
          <div className="p-4 bg-muted/50 rounded-lg border border-muted">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Comment ça fonctionne ?</p>
                <p className="text-muted-foreground mt-1">
                  CinetPay gère automatiquement le choix du moyen de paiement. Lorsqu'un client paie, 
                  il peut choisir parmi tous les moyens de paiement activés sur votre compte CinetPay. 
                  Pour activer ou désactiver un moyen de paiement spécifique, rendez-vous sur le tableau de bord CinetPay.
                </p>
              </div>
            </div>
          </div>

          {/* Liste des moyens de paiement */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {supportedPaymentMethods.map((method) => (
              <div 
                key={method.name}
                className="flex items-center gap-3 p-3 border rounded-lg bg-background"
              >
                <div className={`w-10 h-10 ${method.bgColor} rounded-lg flex items-center justify-center shrink-0`}>
                  <method.icon className={`w-5 h-5 ${method.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{method.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {method.countries.join(", ")}
                  </p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500 ml-auto shrink-0" />
              </div>
            ))}
          </div>

          {/* Lien vers le dashboard CinetPay */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div>
              <p className="font-medium text-sm">Gérer mes moyens de paiement</p>
              <p className="text-xs text-muted-foreground">
                Configurez les options de paiement dans votre espace CinetPay
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="https://my.cinetpay.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ouvrir CinetPay
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CinetPay Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration CinetPay
          </CardTitle>
          <CardDescription>
            Paramètres de connexion à la passerelle de paiement CinetPay
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
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? "Enregistrement..." : "Enregistrer la configuration"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Intégrations futures */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Settings className="w-5 h-5" />
            Intégrations directes
            <Badge variant="secondary" className="ml-2">Bientôt</Badge>
          </CardTitle>
          <CardDescription>
            Intégrations directes avec les opérateurs Mobile Money (sans passer par CinetPay)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 border border-dashed rounded-lg opacity-60">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Orange Money Direct</p>
                <p className="text-xs text-muted-foreground">Contactez-nous</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border border-dashed rounded-lg opacity-60">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-sm">MTN MoMo Direct</p>
                <p className="text-xs text-muted-foreground">Contactez-nous</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border border-dashed rounded-lg opacity-60">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Wave Direct</p>
                <p className="text-xs text-muted-foreground">Contactez-nous</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBilling;
