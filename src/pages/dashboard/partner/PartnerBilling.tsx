import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CreditCard, 
  Download,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  Fingerprint,
  ArrowUpRight,
  Smartphone,
  Zap,
  AlertTriangle
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useInvoices } from "@/hooks/useInvoices";
import { useCinetPay } from "@/hooks/useCinetPay";
import { useTrialSubscription } from "@/hooks/useTrialSubscription";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { PRICING_PLANS, PARTNER_PLANS, getPlanById } from "@/lib/pricing-plans";

const PartnerBilling = () => {
  const { subscription, usage, isLoading: subLoading } = useSubscription();
  const { invoices, isLoading: invLoading } = useInvoices();
  const { openPaymentPage, isLoading: paymentLoading } = useCinetPay();
  const { isTrialing, trialDaysLeft, isExpired, isLoading: trialLoading } = useTrialSubscription();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Payée</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">En retard</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Essai</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get current plan info
  const currentPlanSlug = (subscription?.plan as any)?.slug || subscription?.plan?.name?.toLowerCase() || 'starter';
  const currentPlanId = currentPlanSlug;
  const currentPlan = getPlanById(currentPlanId) || PRICING_PLANS[0];
  
  const planName = subscription?.plan?.name || 'Starter';
  const planPrice = subscription?.plan?.price_monthly || 0;
  const scoresLimit = subscription?.plan?.limits?.scores_per_month || currentPlan.quotas.wscore || 25;
  const kycLimit = subscription?.plan?.limits?.kyc_per_month || currentPlan.quotas.wkyc || 10;
  const currentPeriodEnd = subscription?.current_period_end;

  const scoresUsed = usage?.scoresUsed || 0;
  const kycUsed = usage?.kycUsed || 0;
  const scoresPercent = scoresLimit ? Math.min((scoresUsed / scoresLimit) * 100, 100) : 0;
  const kycPercent = kycLimit ? Math.min((kycUsed / kycLimit) * 100, 100) : 0;

  const handleUpgrade = async (plan: typeof PRICING_PLANS[0]) => {
    if (plan.price) {
      await openPaymentPage({
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
      });
    }
  };

  // Get paid plans only (exclude trial)
  const paidPlans = PARTNER_PLANS.filter(p => !p.isTrial && !p.isCustom);

  return (
    <DashboardLayout role="partner" title="Facturation">
      <div className="space-y-6">
        {/* Trial Alert */}
        {isTrialing && !isExpired && (
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-700 dark:text-blue-400">
              Période d'essai - {trialDaysLeft} jours restants
            </AlertTitle>
            <AlertDescription className="text-blue-600 dark:text-blue-300">
              Passez à un plan payant avant la fin de votre essai pour continuer à utiliser l'API sans interruption.
            </AlertDescription>
          </Alert>
        )}

        {isExpired && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Essai expiré</AlertTitle>
            <AlertDescription>
              Votre période d'essai est terminée. Choisissez un plan ci-dessous pour continuer.
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Mon Abonnement
            </CardTitle>
            <CardDescription>Votre plan actuel et vos quotas mensuels</CardDescription>
          </CardHeader>
          <CardContent>
            {subLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Plan */}
                <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl">
                    <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-xl">{planName}</h3>
                      <p className="text-3xl font-bold mt-2">
                        {planPrice > 0 ? (
                          <>{formatCurrency(planPrice)}<span className="text-sm font-normal text-muted-foreground">/mois</span></>
                        ) : (
                          <span className="text-green-600">Gratuit</span>
                        )}
                      </p>
                    </div>
                    {getStatusBadge(subscription?.status || 'active')}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Renouvellement : {currentPeriodEnd 
                      ? format(new Date(currentPeriodEnd), 'dd MMMM yyyy', { locale: fr })
                      : '1er du mois prochain'}</span>
                  </div>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link to="/pricing">
                      Changer de plan
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>

                {/* Usage */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Consommation du mois</h4>
                  
                  {/* W-SCORE Usage */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-secondary" />
                        <span className="font-medium">W-SCORE</span>
                      </div>
                      <span className="text-sm font-semibold">{scoresUsed}/{scoresLimit}</span>
                    </div>
                    <Progress value={scoresPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {scoresPercent >= 80 && <span className="text-amber-600">Quota bientôt atteint • </span>}
                      {scoresLimit - scoresUsed} évaluations restantes
                    </p>
                  </div>

                  {/* W-KYC Usage */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-primary" />
                        <span className="font-medium">W-KYC</span>
                      </div>
                      <span className="text-sm font-semibold">{kycUsed}/{kycLimit}</span>
                    </div>
                    <Progress value={kycPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {kycPercent >= 80 && <span className="text-amber-600">Quota bientôt atteint • </span>}
                      {kycLimit - kycUsed} vérifications restantes
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade Options - Show prominently for trial users */}
        {(isTrialing || isExpired || currentPlanId !== 'partenaire-enterprise') && (
          <Card className={isTrialing || isExpired ? "border-primary shadow-md" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                {isTrialing || isExpired ? "Passez à un plan payant" : "Augmenter vos quotas"}
              </CardTitle>
              <CardDescription>
                {isTrialing || isExpired 
                  ? "Continuez à utiliser l'API après votre essai"
                  : "Passez au plan supérieur pour plus de dossiers"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {paidPlans.map((plan) => (
                  <div key={plan.id} className={`p-4 border rounded-lg flex items-center justify-between ${plan.popular ? "border-primary bg-primary/5" : ""}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{plan.name}</h4>
                        {plan.popular && <Badge variant="secondary">Recommandé</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {plan.quotas.dossiers} dossiers / mois
                      </p>
                      <p className="font-bold mt-1">{plan.priceDisplay} {plan.currency}{plan.period}</p>
                    </div>
                    <Button 
                      onClick={() => handleUpgrade({
                        ...plan,
                        quotas: { wscore: plan.quotas.dossiers, wkyc: plan.quotas.dossiers ? Math.floor(plan.quotas.dossiers / 2) : null }
                      })}
                      disabled={paymentLoading}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {isTrialing ? "Activer" : "Upgrader"}
                    </Button>
                  </div>
                ))}
                
                {/* Enterprise option */}
                <div className="p-4 border rounded-lg flex items-center justify-between bg-muted/30">
                  <div>
                    <h4 className="font-semibold">Enterprise</h4>
                    <p className="text-sm text-muted-foreground">Quotas personnalisés illimités</p>
                    <p className="font-bold mt-1">Sur mesure</p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/contact">Contacter</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Historique des Paiements</CardTitle>
              <CardDescription>Consultez et téléchargez vos factures</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {invLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !invoices || invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
                <p className="text-muted-foreground">
                  Vos factures apparaîtront ici après votre premier paiement
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div 
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(invoice.issued_at), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold">{formatCurrency(invoice.amount)}</p>
                      {getStatusBadge(invoice.status)}
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Moyens de Paiement
            </CardTitle>
            <CardDescription>Paiements sécurisés via CinetPay</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-orange-600">OM</span>
                </div>
                <p className="text-sm font-medium">Orange Money</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-yellow-700">MTN</span>
                </div>
                <p className="text-sm font-medium">MTN MoMo</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-blue-600">W</span>
                </div>
                <p className="text-sm font-medium">Wave</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-sm font-medium">Carte bancaire</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Les paiements sont traités de manière sécurisée par notre partenaire CinetPay
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PartnerBilling;
