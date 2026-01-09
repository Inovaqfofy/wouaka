import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface InitPaymentParams {
  planId: string;
  planName: string;
  amount: number;
}

interface PaymentResponse {
  success: boolean;
  transaction_id: string;
  payment_url: string;
  payment_token: string;
}

export const useCinetPay = () => {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const initializePayment = async (params: InitPaymentParams): Promise<PaymentResponse | null> => {
    if (!user) {
      toast.error('Vous devez être connecté pour effectuer un paiement');
      return null;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return null;
      }

      // Get user's name from profile or email
      const nameParts = (profile?.full_name || user.email || 'Client').split(' ');
      const customerName = nameParts[0] || 'Client';
      const customerSurname = nameParts.slice(1).join(' ') || customerName;

      const response = await supabase.functions.invoke('cinetpay-init', {
        body: {
          plan_id: params.planId,
          plan_name: params.planName,
          amount: params.amount,
          customer_name: customerName,
          customer_surname: customerSurname,
          customer_email: user.email,
          customer_phone_number: profile?.phone || ''
        }
      });

      if (response.error) {
        console.error('[CinetPay] Error:', response.error);
        toast.error('Erreur lors de l\'initialisation du paiement');
        return null;
      }

      const data = response.data as PaymentResponse;

      if (data.success && data.payment_url) {
        return data;
      } else {
        toast.error('Erreur lors de la création du paiement');
        return null;
      }

    } catch (error) {
      console.error('[CinetPay] Error:', error);
      toast.error('Erreur lors du paiement');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const openPaymentPage = async (params: InitPaymentParams) => {
    const result = await initializePayment(params);
    
    if (result?.payment_url) {
      // Open CinetPay payment page in new tab or redirect
      window.location.href = result.payment_url;
    }
  };

  return {
    initializePayment,
    openPaymentPage,
    isLoading
  };
};
