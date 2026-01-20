/**
 * WOUAKA KYC Hook
 * React hook for identity verification using the @wouaka/sdk
 * 
 * @example
 * ```tsx
 * const { verifyIdentity, result, isLoading, error } = useWouakaKyc();
 * 
 * const handleVerify = async () => {
 *   const result = await verifyIdentity({
 *     level: 'enhanced',
 *     national_id: 'CI123456789',
 *     full_name: 'Kouassi Jean',
 *   });
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import type { KycRequest, KycResponse } from '@wouaka/sdk';
import { useWouakaSdk } from './useWouakaSdk';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { parseWouakaSdkError, type WouakaSdkError } from '@/lib/wouaka-sdk-client';

interface UseWouakaKycResult {
  /** Verify an identity */
  verifyIdentity: (request: KycRequest) => Promise<KycResponse | null>;
  /** Get a KYC verification by ID */
  getVerification: (verificationId: string) => Promise<KycResponse | null>;
  /** List recent verifications */
  listVerifications: (limit?: number) => Promise<KycResponse[]>;
  /** Current verification result */
  result: KycResponse | null;
  /** Whether a request is in progress */
  isLoading: boolean;
  /** Error from the last request */
  error: WouakaSdkError | null;
  /** Reset the hook state */
  reset: () => void;
}

interface UseWouakaKycOptions {
  /** Persist verifications to database */
  persistToDatabase?: boolean;
  /** Show toast notifications */
  showToasts?: boolean;
}

/**
 * Hook for WOUAKA KYC operations
 */
export function useWouakaKyc(options: UseWouakaKycOptions = {}): UseWouakaKycResult {
  const { persistToDatabase = true, showToasts = true } = options;
  const { client, isReady } = useWouakaSdk();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [result, setResult] = useState<KycResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<WouakaSdkError | null>(null);

  /**
   * Verify an identity using the SDK
   */
  const verifyIdentity = useCallback(async (request: KycRequest): Promise<KycResponse | null> => {
    if (!client || !isReady) {
      const err: WouakaSdkError = { type: 'UNKNOWN_ERROR', message: 'SDK non initialisé' };
      setError(err);
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: err.message,
        });
      }
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the SDK
      const kycResponse = await client.kyc.verify(request);
      
      setResult(kycResponse);

      // Persist to database if enabled
      if (persistToDatabase && user?.id) {
        await supabase.from('kyc_requests').insert({
          partner_id: user.id,
          full_name: request.full_name,
          phone_number: request.phone_number,
          national_id: request.national_id,
          status: kycResponse.status === 'verified' ? 'verified' : 
                  kycResponse.status === 'rejected' ? 'rejected' : 'pending',
          identity_score: kycResponse.identity_score,
          fraud_score: kycResponse.fraud_score,
          risk_level: kycResponse.risk_level,
          risk_flags: kycResponse.checks?.filter(c => !c.passed).map(c => c.name) || [],
          processing_time_ms: kycResponse.processing_time_ms,
          kyc_level: request.level,
          documents_submitted: request.documents?.length || 0,
          documents_verified: kycResponse.checks?.filter(c => c.passed).length || 0,
          verifications_performed: kycResponse.checks || [],
          fraud_indicators: kycResponse.fraud_indicators || [],
        });
      }

      if (showToasts) {
        const isVerified = kycResponse.status === 'verified';
        toast({
          variant: isVerified ? 'default' : 'destructive',
          title: isVerified ? 'Identité vérifiée' : 'Vérification échouée',
          description: isVerified 
            ? `Score d'identité: ${kycResponse.identity_score}%`
            : kycResponse.rejection_reason || 'Vérification refusée',
        });
      }

      return kycResponse;
    } catch (err) {
      const parsedError = parseWouakaSdkError(err);
      setError(parsedError);
      
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Erreur de vérification',
          description: parsedError.message,
        });
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [client, isReady, user?.id, persistToDatabase, showToasts, toast]);

  /**
   * Get a verification by ID
   */
  const getVerification = useCallback(async (verificationId: string): Promise<KycResponse | null> => {
    if (!client || !isReady) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const verification = await client.kyc.get(verificationId);
      setResult(verification);
      return verification;
    } catch (err) {
      const parsedError = parseWouakaSdkError(err);
      setError(parsedError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [client, isReady]);

  /**
   * List recent verifications
   */
  const listVerifications = useCallback(async (limit = 10): Promise<KycResponse[]> => {
    if (!client || !isReady) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const verifications = await client.kyc.list({ limit });
      return verifications.data || [];
    } catch (err) {
      const parsedError = parseWouakaSdkError(err);
      setError(parsedError);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [client, isReady]);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    verifyIdentity,
    getVerification,
    listVerifications,
    result,
    isLoading,
    error,
    reset,
  };
}

export default useWouakaKyc;
