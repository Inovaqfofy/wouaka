import { 
  CreditCard, 
  Download,
  FileText,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoices } from "@/hooks/useInvoices";
import { useSubscription } from "@/hooks/useSubscription";
import { useApiCalls } from "@/hooks/useApiCalls";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const ApiClientBilling = () => {
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { subscription, usage, plans, isLoading: subscriptionLoading } = useSubscription();
  const { stats } = useApiCalls();
  const navigate = useNavigate();

  const statusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500">Payé</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">En retard</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'XOF') => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
  };

  const isLoading = invoicesLoading || subscriptionLoading;

  // Calculate usage stats from real data
  const apiLimit = subscription?.plan?.limits?.api_calls_per_month || 10000;
  const apiUsed = stats.totalCalls || 0;
  const apiRemaining = Math.max(0, apiLimit - apiUsed);
  const daysUntilRenewal = subscription?.current_period_end 
    ? differenceInDays(new Date(subscription.current_period_end), new Date())
    : 0;

  return (
    <DashboardLayout role="api-client" title="Facturation">
      {/* Current Plan */}
      <Card className="card-premium mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Abonnement actuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : subscription?.plan ? (
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold">{subscription.plan.name}</h3>
                  <Badge variant="default" className="bg-green-500">
                    {subscription.status === 'active' ? 'Actif' : subscription.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  {subscription.plan.description || `${apiLimit.toLocaleString()} appels API / mois`}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Renouvellement: {subscription.current_period_end 
                      ? format(new Date(subscription.current_period_end), 'dd MMMM yyyy', { locale: fr })
                      : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(subscription.plan.price_monthly, subscription.plan.currency)}
                </div>
                <div className="text-sm text-muted-foreground">par mois</div>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/pricing')}>
                  Changer de plan
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <h3 className="font-medium mb-2">Aucun abonnement actif</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Souscrivez à un plan pour accéder à toutes les fonctionnalités
              </p>
              <Button onClick={() => navigate('/pricing')}>Voir les plans</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Summary - Real data */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{apiUsed.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Appels ce mois</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{apiRemaining.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Appels restants</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{daysUntilRenewal > 0 ? `${daysUntilRenewal} jours` : 'N/A'}</p>
              <p className="text-sm text-muted-foreground">Avant renouvellement</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Card className="card-premium">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Historique des factures
            </CardTitle>
            <CardDescription>
              Consultez et téléchargez vos factures
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h3 className="font-medium text-lg mb-2">Aucune facture</h3>
              <p className="text-sm">Vos factures apparaîtront ici après votre premier paiement</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Numéro</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Montant</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">{invoice.invoice_number}</span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {format(new Date(invoice.issued_at), 'dd MMMM yyyy', { locale: fr })}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(Number(invoice.amount), invoice.currency)}
                      </td>
                      <td className="py-3 px-4">
                        {statusBadge(invoice.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {invoice.pdf_url ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => window.open(invoice.pdf_url!, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                            PDF
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" disabled>
                            -
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Modes de paiement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <CreditCard className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">Mobile Money</p>
                <p className="text-sm text-muted-foreground">Orange Money, MTN MoMo, Wave</p>
              </div>
            </div>
            <Badge variant="outline">Par défaut</Badge>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ApiClientBilling;
