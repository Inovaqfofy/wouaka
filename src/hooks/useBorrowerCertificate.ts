import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { BORROWER_PLANS, getBorrowerPlanById } from '@/lib/pricing-plans';

export interface Certificate {
  id: string;
  user_id: string;
  plan_id: string;
  score: number | null;
  certainty_coefficient: number | null;
  trust_level: string | null;
  valid_from: string;
  valid_until: string;
  share_code: string | null;
  smile_id_level: string | null;
  smile_id_verification_id: string | null;
  proofs_snapshot: Record<string, unknown> | null;
  recertification_of: string | null;
  recertification_number: number | null;
  created_at: string;
  updated_at: string;
}

export interface CertificateSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  valid_from: string;
  valid_until: string;
  validity_days: number;
  recertifications_used: number | null;
  recertifications_total: number | null;
  current_certificate_id: string | null;
  smile_id_level: string | null;
  status: string | null;
  source: string | null;
  amount_paid: number;
  payment_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CertificateStatus {
  hasSubscription: boolean;
  hasActiveCertificate: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number;
  canRecertify: boolean;
  recertificationsRemaining: number | null;
  subscription: CertificateSubscription | null;
  certificate: Certificate | null;
  plan: ReturnType<typeof getBorrowerPlanById> | null;
}

// --- PREMIER HOOK : GESTION DES DONNÉES DU CERTIFICAT ---
export function useBorrowerCertificate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch active subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['certificate-subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('certificate_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('valid_until', new Date().toISOString())
        .order('valid_until', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as CertificateSubscription | null;
    },
    enabled: !!user?.id
  });

  // Fetch active certificate
  const { data: certificate, isLoading: certificateLoading } = useQuery({
    queryKey: ['active-certificate', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .gte('valid_until', new Date().toISOString())
        .order('valid_until', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Certificate | null;
    },
    enabled: !!user?.id
  });

  // Fetch certificate history
  const { data: certificateHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['certificate-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Certificate[];
    },
    enabled: !!user?.id
  });

  const getStatus = (): CertificateStatus => {
    const now = new Date();
    const validUntil = certificate ? new Date(certificate.valid_until) : null;
    const daysRemaining = validUntil 
      ? Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const recertificationsRemaining = subscription?.recertifications_total === null 
      ? null 
      : (subscription?.recertifications_total || 0) - (subscription?.recertifications_used || 0);

    const canRecertify = subscription 
      ? (recertificationsRemaining === null || recertificationsRemaining > 0)
      : false;

    const plan = subscription ? getBorrowerPlanById(subscription.plan_id) : null;

    return {
      hasSubscription: !!subscription,
      hasActiveCertificate: !!certificate && daysRemaining > 0,
      isExpired: !!certificate && daysRemaining <= 0,
      isExpiringSoon: daysRemaining > 0 && daysRemaining <= 7,
      daysRemaining: Math.max(0, daysRemaining),
      canRecertify,
      recertificationsRemaining,
      subscription,
      certificate,
      plan
    };
  };

  const recertify = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Non authentifié');
      const { data, error } = await supabase.functions.invoke('recertify-certificate', {
        body: {}
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Erreur de recertification');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-subscription', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['active-certificate', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['certificate-history', user?.id] });
      toast.success('Certificat recertifié avec succès');
    },
    onError: (error: Error) => {
      console.error('Erreur recertification:', error);
      toast.error(error.message || 'Erreur lors de la recertification');
    }
  });

  return {
    subscription,
    certificate,
    certificateHistory,
    status: getStatus(),
    isLoading: subscriptionLoading || certificateLoading,
    historyLoading,
    recertify: recertify.mutate,
    recertifyAsync: recertify.mutateAsync,
    isRecertifying: recertify.isPending,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-subscription', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['active-certificate', user?.id] });
    }
  };
}

// --- DEUXIÈME HOOK : GESTION DES PAIEMENTS VIA VPS ---
export function useCertificatePayment() {
  const { user } = useAuth();

  const initPayment = useMutation({
    mutationFn: async (planId: string) => {
      if (!user?.id) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        throw new Error('Non authentifié');
      }

      console.log('🚀 Initialisation du paiement VPS pour:', planId);

      // Appelle cinetpay-init sur votre VPS
      const { data, error } = await supabase.functions.invoke('cinetpay-init', {
        body: { 
          plan_id: planId,
          user_id: user.id 
        }
      });

      if (error) {
        console.error('❌ Erreur Edge Function:', error);
        throw new Error(`Erreur serveur: ${error.message}`);
      }

      const paymentUrl = data?.url || data?.payment_url;
      if (!paymentUrl) {
        throw new Error(data?.error || 'URL de paiement non reçue du serveur');
      }

      return data;
    },
    onSuccess: (data) => {
      const url = data?.url || data?.payment_url;
      toast.success('Redirection vers la plateforme de paiement...');
      setTimeout(() => {
        window.location.href = url;
      }, 1000);
    },
    onError: (error: any) => {
      console.error('❌ Erreur paiement:', error);
      toast.error(error.message || "Impossible d'initialiser le paiement.");
    }
  });

  const openPaymentPage = async (planId: string) => {
    try {
      await initPayment.mutateAsync(planId);
    } catch (error) {
      // Géré par onError
    }
  };

  return {
    initPayment: initPayment.mutate,
    initPaymentAsync: initPayment.mutateAsync,
    openPaymentPage,
    isLoading: initPayment.isPending
  };
}
