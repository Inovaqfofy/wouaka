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
  AlertTriangle,
  Infinity
} from "lucide-react";
import { useQuotaUsage, formatLimit } from "@/hooks/useQuotaUsage";
import { useInvoices } from "@/hooks/useInvoices";
import { useCinetPay } from "@/hooks/useCinetPay";
import { useTrialSubscription } from "@/hooks/useTrialSubscription";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { PARTNER_PLANS } from "@/lib/pricing-plans";

const PartnerBilling = () => {
  // SOURCE UNIQUE DE VÉRITÉ : useQuotaUsage récupère tout depuis la base de données
  const { data: quota, isLoading: quotaLoading } = useQuotaUsage();
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
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Actif</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Utiliser les données de quota centralisées
  const planName = quota?.plan.name || 'Gratuit';
  const planSlug = quota?.plan.slug || 'free';
  const scoresLimit = quota?.plan.limits.scores_per_month || 0;
  const kycLimit = quota?.plan.limits.kyc_per_month || 0;
  const isUnlimited = quota?.isUnlimited || false;

  const scoresUsed = quota?.usage.scoresUsed || 0;
  const kycUsed = quota?.usage.kycUsed || 0;
  const scoresPercent = quota?.percentages.scores || 0;
  const kycPercent = quota?.percentages.kyc || 0;

  // Récupérer le prix depuis PARTNER_PLANS (pour affichage seulement)
  const partnerPlan = PARTNER_PLANS.find(p => p.id === planSlug);
  const planPrice = partnerPlan?.price || 0;

  const handleUpgrade = async (plan: typeof PARTNER_PLANS[0]) => {
    if (plan.price) {
      await openPaymentPage({
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
      });
    }
  };

  // Get paid plans only (exclude trial and custom)
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
            {quotaLoading ? (
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
                    {getStatusBadge(isTrialing ? 'trialing' : 'active')}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Renouvellement : {quota?.periodEnd 
                      ? format(new Date(quota.periodEnd), 'dd MMMM yyyy', { locale: fr })
                      : '1er du mois prochain'}</span>
                  </div>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link to="/pricing">
                      Changer de plan
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>

                {/* Usage - Données centralisées depuis useQuotaUsage */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Consommation du mois</h4>
                  
                  {/* Scoring Crédit Usage */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">Scoring Crédit</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {scoresUsed.toLocaleString('fr-FR')} / {formatLimit(scoresLimit)}
                      </span>
                    </div>
                    {!isUnlimited ? (
                      <>
                        <Progress value={scoresPercent} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {scoresPercent >= 80 && <span className="text-amber-600">Quota bientôt atteint • </span>}
                          {quota?.remaining.scores.toLocaleString('fr-FR')} évaluations restantes
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-sm text-green-600 font-medium mt-1">
                        <Infinity className="w-4 h-4" />
                        <span>Illimité</span>
                      </div>
                    )}
                  </div>

                  {/* Vérification Identité Usage */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Vérification Identité</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {kycUsed.toLocaleString('fr-FR')} / {formatLimit(kycLimit)}
                      </span>
                    </div>
                    {!isUnlimited ? (
                      <>
                        <Progress value={kycPercent} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {kycPercent >= 80 && <span className="text-amber-600">Quota bientôt atteint • </span>}
                          {quota?.remaining.kyc.toLocaleString('fr-FR')} vérifications restantes
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-sm text-green-600 font-medium mt-1">
                        <Infinity className="w-4 h-4" />
                        <span>Illimité</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade Options - Show prominently for trial users */}
        {(isTrialing || isExpired || planSlug !== 'partenaire-enterprise') && (
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
                        {plan.quotas.dossiers ? `${plan.quotas.dossiers} dossiers / mois` : 'Illimité'}
                      </p>
                      <p className="font-bold mt-1">{plan.priceDisplay} {plan.currency}{plan.period}</p>
                    </div>
                    <Button 
                      onClick={() => handleUpgrade(plan)}
                      disabled={paymentLoading || planSlug === plan.id}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {planSlug === plan.id ? "Actuel" : isTrialing ? "Activer" : "Upgrader"}
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
