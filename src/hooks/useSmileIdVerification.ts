import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VerificationType } from '@/lib/verification-pricing';
import { toast } from 'sonner';

export interface PremiumVerification {
  id: string;
  user_id: string | null;
  partner_id: string | null;
  customer_profile_id: string | null;
  verification_type: string;
  amount: number;
  currency: string;
  payment_status: string;
  payment_transaction_id: string | null;
  verification_status: string;
  smile_job_id: string | null;
  verification_result: Record<string, unknown> | null;
  identity_data: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
}

export function useSmileIdVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initiate payment for premium verification
  const initiatePayment = useCallback(async (
    verificationType: VerificationType,
    identityData: {
      fullName: string;
      nationalId: string;
      phoneNumber: string;
      dateOfBirth?: string;
      country?: string;
    },
    customerProfileId?: string
  ) => {
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

      return data;
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setError(err.message || 'Erreur lors de l\'initiation du paiement');
      toast.error('Erreur', { description: err.message });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get verification status
  const getVerificationStatus = useCallback(async (verificationId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('premium_verifications')
        .select('*')
        .eq('id', verificationId)
        .single();

      if (queryError) throw queryError;

      return data as PremiumVerification;
    } catch (err: any) {
      console.error('Get verification status error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // List partner verifications
  const listVerifications = useCallback(async (limit = 50) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('premium_verifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (queryError) throw queryError;

      return data as PremiumVerification[];
    } catch (err: any) {
      console.error('List verifications error:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if verification is complete (for polling)
  const pollVerificationStatus = useCallback(async (
    verificationId: string,
    onComplete: (verification: PremiumVerification) => void,
    maxAttempts = 60,
    intervalMs = 5000
  ) => {
    let attempts = 0;

    const poll = async () => {
      attempts++;
      
      const verification = await getVerificationStatus(verificationId);
      
      if (!verification) {
        if (attempts < maxAttempts) {
          setTimeout(poll, intervalMs);
        }
        return;
      }

      if (verification.verification_status === 'completed' || 
          verification.verification_status === 'failed') {
        onComplete(verification);
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, intervalMs);
      } else {
        setError('Timeout en attendant la vérification');
        toast.error('Timeout', {
          description: 'La vérification prend plus de temps que prévu',
        });
      }
    };

    poll();
  }, [getVerificationStatus]);

  return {
    loading,
    error,
    initiatePayment,
    getVerificationStatus,
    listVerifications,
    pollVerificationStatus,
  };
}
