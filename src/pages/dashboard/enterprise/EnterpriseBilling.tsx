import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  CreditCard, 
  Download, 
  CheckCircle,
  Calendar,
  Zap,
  ArrowUp,
  Star,
  Loader2,
  ExternalLink,
  FileText
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
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
import { useSubscription } from "@/hooks/useSubscription";
import { useCinetPay } from "@/hooks/useCinetPay";
import { useInvoices } from "@/hooks/useInvoices";
import { formatPrice, PRICING_PLANS } from "@/lib/pricing-plans";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

const EnterpriseBilling = () => {
  const { user } = useAuth();
  const { plans, subscription, usage, isLoading, subscribe, isSubscribing } = useSubscription();
  const { openPaymentPage, isLoading: isPaymentLoading } = useCinetPay();
  const { invoices, downloadInvoice, isDownloading } = useInvoices();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [confirmDialog, setConfirmDialog] = useState<{ 
    open: boolean; 
    planId: string; 
    planName: string; 
    price: number;
    dbPlanId: string;
  }>({
    open: false,
    planId: '',
    planName: '',
    price: 0,
    dbPlanId: ''
  });

  // Fetch payment transactions for invoice history
  const { data: transactions = [] } = useQuery({
    queryKey: ['payment-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Check for payment completion on return
  useEffect(() => {
    const payment = searchParams.get('payment');
    const transactionId = searchParams.get('transaction_id');
    
    if (payment === 'complete' && transactionId) {
      toast.success('Paiement en cours de traitement...');
      // Clear the URL params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Map DB plans to display format
  const displayPlans = PRICING_PLANS.map(staticPlan => {
    const dbPlan = plans.find(p => p.name.toLowerCase() === staticPlan.id.toLowerCase() || p.name === staticPlan.name);
    return {
      ...staticPlan,
      dbId: dbPlan?.id || null,
      dbPrice: dbPlan?.price_monthly || staticPlan.price,
      limits: dbPlan?.limits || { scores_per_month: staticPlan.credits || 0, api_calls_per_month: 0 }
    };
  });

  const currentDbPlan = subscription?.plan;
  const currentStaticPlan = currentDbPlan 
    ? displayPlans.find(p => p.dbId === currentDbPlan.id) 
    : null;

  const creditsTotal = currentDbPlan?.limits?.scores_per_month || currentStaticPlan?.credits || 0;
  const creditsUsed = usage.scoresUsed;
  const usagePercentage = creditsTotal > 0 ? Math.min((creditsUsed / creditsTotal) * 100, 100) : 0;

  const nextBilling = subscription?.current_period_end 
    ? format(new Date(subscription.current_period_end), "d MMMM yyyy", { locale: fr })
    : "Non défini";

  const handlePlanChange = (planId: string, planName: string, price: number, dbPlanId: string) => {
    if (price === 0 || planId === 'enterprise') {
      // Enterprise plan - contact us
      window.location.href = '/contact';
      return;
    }
    setConfirmDialog({ open: true, planId, planName, price, dbPlanId });
  };

  const confirmPlanChange = async () => {
    const { planName, price, dbPlanId } = confirmDialog;
    setConfirmDialog({ open: false, planId: '', planName: '', price: 0, dbPlanId: '' });
    
    // Start CinetPay payment flow
    await openPaymentPage({
      planId: dbPlanId,
      planName: planName,
      amount: price
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Payée</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échouée</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Annulée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="enterprise" title="Facturation">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="enterprise" title="Facturation">
      <div className="space-y-6">
        {/* Current Plan */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 card-premium">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Abonnement actuel</CardTitle>
                  <CardDescription>
                    {currentStaticPlan ? `Plan ${currentStaticPlan.name}` : "Aucun abonnement actif"}
                  </CardDescription>
                </div>
                {subscription?.status === 'active' && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Actif
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentStaticPlan ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      {currentStaticPlan.price ? `${formatPrice(currentStaticPlan.price)} FCFA` : currentStaticPlan.priceDisplay}
                    </span>
                    {currentStaticPlan.period && (
                      <span className="text-muted-foreground">/ mois</span>
                    )}
                  </div>

                  {creditsTotal > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Crédits utilisés ce mois</span>
                        <span className="font-medium">{creditsUsed} / {creditsTotal}</span>
                      </div>
                      <Progress value={usagePercentage} className="h-2" />
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Prochain renouvellement : <strong>{nextBilling}</strong></span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t">
                    {currentStaticPlan.features.slice(0, 5).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Vous n'avez pas encore d'abonnement actif.</p>
                  <p className="text-sm text-muted-foreground">Choisissez un plan ci-dessous pour commencer.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mode de paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                <div className="w-12 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">CinetPay</p>
                  <p className="text-sm text-muted-foreground">Mobile Money & Cartes</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Paiements sécurisés via Orange Money, MTN Money, Wave, Moov Money et cartes bancaires
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Options */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-secondary" />
              <CardTitle>Changer de plan</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              {displayPlans.map((plan, index) => {
                const isCurrent = currentDbPlan?.id === plan.dbId;
                const currentIndex = displayPlans.findIndex(p => p.dbId === currentDbPlan?.id);
                const isUpgrade = !isCurrent && index > currentIndex && currentIndex >= 0;
                const isEnterprise = plan.isCustom;
                
                return (
                  <div 
                    key={plan.id}
                    className={`p-6 rounded-xl border-2 transition-all relative ${
                      isCurrent 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          <Star className="w-3 h-3 mr-1" />
                          Recommandé
                        </Badge>
                      </div>
                    )}
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <div className="mt-2 mb-4">
                      {plan.price ? (
                        <>
                          <span className="text-2xl font-bold">{plan.priceDisplay}</span>
                          <span className="text-muted-foreground"> FCFA/mois</span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold">{plan.priceDisplay}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {plan.creditsDisplay}
                    </p>
                    {isCurrent ? (
                      <Badge className="w-full justify-center">Plan actuel</Badge>
                    ) : (
                      <Button 
                        variant={isUpgrade ? "default" : "outline"} 
                        className="w-full"
                        onClick={() => handlePlanChange(plan.id, plan.name, plan.price || 0, plan.dbId || '')}
                        disabled={isPaymentLoading || isSubscribing}
                      >
                        {isPaymentLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isEnterprise ? (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Nous contacter
                          </>
                        ) : isUpgrade ? (
                          <>
                            <ArrowUp className="w-4 h-4 mr-2" />
                            Upgrade
                          </>
                        ) : (
                          "Changer"
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle>Mes factures</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {invoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium font-mono text-sm">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.issued_at), "d MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {invoice.metadata?.plan_name || 'Abonnement Wouaka'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(invoice.amount)} {invoice.currency}
                      </TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === 'paid' ? 'success' : 'secondary'}>
                          {invoice.status === 'paid' ? 'Payée' : invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadInvoice(invoice.id)}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune facture pour le moment</p>
                <p className="text-sm mt-1">Vos factures apparaîtront ici après votre premier paiement</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium font-mono text-xs">
                        {transaction.transaction_id}
                      </TableCell>
                      <TableCell>
                        {format(new Date(transaction.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell>{formatPrice(transaction.amount)} FCFA</TableCell>
                      <TableCell>
                        {transaction.payment_method || '-'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune transaction pour le moment
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le paiement</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de souscrire au plan <strong>{confirmDialog.planName}</strong> pour <strong>{formatPrice(confirmDialog.price)} FCFA/mois</strong>.
              <br /><br />
              Vous serez redirigé vers CinetPay pour effectuer le paiement de manière sécurisée via Mobile Money ou carte bancaire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPlanChange} disabled={isPaymentLoading}>
              {isPaymentLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Procéder au paiement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default EnterpriseBilling;
