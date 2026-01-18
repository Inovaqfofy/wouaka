import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Shield, 
  CheckCircle2, 
  Loader2,
  ExternalLink,
  AlertCircle,
  Clock,
  Receipt
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  VERIFICATION_PRICES, 
  VerificationType,
  formatPrice 
} from '@/lib/verification-pricing';
import { toast } from 'sonner';

interface SmileIdPaymentFlowProps {
  verificationType: VerificationType;
  customerProfileId?: string;
  identityData: {
    fullName: string;
    nationalId: string;
    phoneNumber: string;
    dateOfBirth?: string;
    country?: string;
  };
  onPaymentComplete: (verificationId: string) => void;
  onCancel: () => void;
}

export function SmileIdPaymentFlow({
  verificationType,
  customerProfileId,
  identityData,
  onPaymentComplete,
  onCancel,
}: SmileIdPaymentFlowProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const config = VERIFICATION_PRICES[verificationType];

  const initiatePayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('smile-id-init', {
        body: {
          verificationType,
          customerProfileId,
          identityData,
          returnUrl: `${window.location.origin}/dashboard/partner/kyc/verification-complete`,
        },
      });
      
      if (invokeError) throw invokeError;
      
      if (data?.paymentUrl) {
        // Redirect to CinetPay
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setError(err.message || 'Erreur lors de l\'initiation du paiement');
      toast.error('Erreur de paiement', {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle>Vérification Premium</CardTitle>
        </div>
        <CardDescription>
          Vérification officielle avec Smile ID
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Verification type info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{config.label}</span>
            <Badge className="text-lg px-3">{formatPrice(config.price)}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Temps estimé: {config.estimatedTime}</span>
          </div>
        </div>
        
        {/* Features */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Inclus dans cette vérification:</h4>
          <ul className="space-y-2">
            {config.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        
        <Separator />
        
        {/* Customer info summary */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Informations à vérifier:</h4>
          <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
            <p><span className="text-muted-foreground">Nom:</span> {identityData.fullName}</p>
            <p><span className="text-muted-foreground">CNI/NNI:</span> {identityData.nationalId}</p>
            <p><span className="text-muted-foreground">Téléphone:</span> {identityData.phoneNumber}</p>
            {identityData.country && (
              <p><span className="text-muted-foreground">Pays:</span> {identityData.country}</p>
            )}
          </div>
        </div>
        
        {/* Payment info */}
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertTitle>Paiement sécurisé</AlertTitle>
          <AlertDescription>
            Vous serez redirigé vers CinetPay pour effectuer le paiement de manière sécurisée.
            La vérification démarrera automatiquement après confirmation du paiement.
          </AlertDescription>
        </Alert>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-3">
        <Button variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
          Annuler
        </Button>
        <Button onClick={initiatePayment} disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirection...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Payer {formatPrice(config.price)}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
