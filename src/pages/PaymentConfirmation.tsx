import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Loader2, ArrowRight, Receipt, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PublicLayout } from '@/components/layout/PublicLayout';

interface TransactionDetails {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  plan: {
    name: string;
    description: string | null;
  } | null;
}

const PaymentConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(10);

  const transactionId = searchParams.get('transaction_id') || searchParams.get('cpm_trans_id');

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) {
        setIsLoading(false);
        return;
      }

      // Poll for transaction status (webhook might take a moment)
      const maxAttempts = 10;
      let attempts = 0;

      const poll = async () => {
        const { data, error } = await supabase
          .from('payment_transactions')
          .select('*, plan:subscription_plans(name, description)')
          .eq('transaction_id', transactionId)
          .single();

        if (error) {
          console.error('Error fetching transaction:', error);
          setIsLoading(false);
          return;
        }

        if (data) {
          const planData = data.plan as { name: string; description: string | null } | null;
          setTransaction({
            ...data,
            plan: planData
          });

          // If still pending and we haven't exceeded attempts, poll again
          if (data.status === 'pending' && attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 2000);
          } else {
            setIsLoading(false);
          }
        }
      };

      await poll();
    };

    fetchTransaction();
  }, [transactionId]);

  // Auto-redirect countdown for successful payments
  useEffect(() => {
    if (transaction?.status === 'completed' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (transaction?.status === 'completed' && countdown === 0) {
      navigate('/dashboard/enterprise/billing');
    }
  }, [transaction?.status, countdown, navigate]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          badge: 'bg-green-500',
          title: 'Paiement réussi !',
          description: 'Votre abonnement a été activé avec succès.'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          badge: 'bg-red-500',
          title: 'Paiement échoué',
          description: 'Le paiement n\'a pas pu être traité.'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border',
          badge: 'bg-muted-foreground',
          title: 'Paiement annulé',
          description: 'Vous avez annulé le paiement.'
        };
      default:
        return {
          icon: Clock,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/20',
          badge: 'bg-amber-500',
          title: 'Paiement en cours',
          description: 'Votre paiement est en cours de traitement...'
        };
    }
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Vérification de votre paiement...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!transactionId || !transaction) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <CardTitle>Transaction introuvable</CardTitle>
              <CardDescription>
                Aucune transaction correspondante n'a été trouvée.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate('/dashboard/enterprise/billing')}>
                Retour à la facturation
              </Button>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  const config = getStatusConfig(transaction.status);
  const StatusIcon = config.icon;

  return (
    <PublicLayout>
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <Card className={`max-w-lg w-full ${config.borderColor} border-2`}>
          <CardHeader className="text-center pb-4">
            <div className={`mx-auto w-20 h-20 rounded-full ${config.bgColor} flex items-center justify-center mb-4`}>
              <StatusIcon className={`h-10 w-10 ${config.color}`} />
            </div>
            <CardTitle className="text-2xl">{config.title}</CardTitle>
            <CardDescription className="text-base">
              {config.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Transaction Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Transaction
                </span>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  {transaction.transaction_id}
                </code>
              </div>

              {transaction.plan && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Abonnement
                  </span>
                  <Badge variant="secondary">{transaction.plan.name}</Badge>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </span>
                <span className="text-sm">
                  {format(new Date(transaction.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </span>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Montant total</span>
                  <span className="text-xl font-bold text-primary">
                    {transaction.amount.toLocaleString()} {transaction.currency}
                  </span>
                </div>
              </div>

              {transaction.payment_method && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Méthode</span>
                  <span className="capitalize">{transaction.payment_method}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {transaction.status === 'completed' && (
                <>
                  <div className="text-center text-sm text-muted-foreground">
                    Redirection automatique dans <span className="font-bold text-primary">{countdown}s</span>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/dashboard/enterprise/billing')}
                  >
                    Accéder à mon tableau de bord
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}

              {transaction.status === 'pending' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.reload()}
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualiser le statut
                </Button>
              )}

              {(transaction.status === 'failed' || transaction.status === 'cancelled') && (
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/dashboard/enterprise/billing')}
                  >
                    Réessayer le paiement
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/contact')}
                  >
                    Contacter le support
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default PaymentConfirmation;
