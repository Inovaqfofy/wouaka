/**
 * WOUAKA Core Hook
 * React hook for unified KYC + Scoring using the @wouaka/sdk
 * 
 * WOUAKA CORE provides a single API call that combines identity verification
 * and credit scoring for a complete assessment.
 * 
 * @example
 * ```tsx
 * const { processCore, result, isLoading, error } = useWouakaCore();
 * 
 * const handleProcess = async () => {
 *   const result = await processCore({
 *     reference_id: 'client-123',
 *     full_name: 'Kouassi Jean',
 *     phone_number: '+22507XXXXXXXX',
 *     // ... other fields
 *   });
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import { useWouakaSdk } from './useWouakaSdk';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { parseWouakaSdkError, type WouakaSdkError } from '@/lib/wouaka-sdk-client';

// Core request type combining KYC + Score inputs
export interface CoreRequest {
  reference_id: string;
  kyc_level?: 'basic' | 'enhanced' | 'full';
  national_id: string;
  full_name: string;
  date_of_birth?: string;
  phone_number: string;
  country?: string;
  city?: string;
  address?: string;
  // Financial
  monthly_income?: number;
  monthly_expenses?: number;
  existing_loans?: number;
  employment_type?: string;
  years_in_business?: number;
  sector?: string;
  // Mobile Money
  momo_total_in?: number;
  momo_total_out?: number;
  momo_transaction_count?: number;
  momo_period_days?: number;
  // Utility
  utility_payments_on_time?: number;
  utility_payments_late?: number;
  // Social
  tontine_participation?: boolean;
  tontine_discipline_rate?: number;
  cooperative_member?: boolean;
  guarantor_count?: number;
  // Telecom
  sim_age_months?: number;
  // Business
  rccm_number?: string;
  // Consent
  consent_data_processing?: boolean;
  consent_timestamp?: string;
}

// Core response combining KYC + Score results
export interface CoreResponse {
  request_id: string;
  reference_id: string;
  status: 'success' | 'partial' | 'failed';
  processing_time_ms: number;
  // KYC results
  kyc: {
    status: 'verified' | 'pending' | 'rejected';
    identity_score: number;
    fraud_score: number;
    risk_level: 'low' | 'medium' | 'high';
    checks: Array<{ name: string; passed: boolean; message?: string }>;
    fraud_indicators: Array<{ type: string; detected: boolean; severity?: string }>;
  };
  // Score results
  score: {
    final_score: number;
    grade: string;
    risk_tier: string;
    confidence: number;
    sub_scores: Record<string, number>;
    credit_recommendation: {
      approved: boolean;
      max_amount: number;
      max_tenor_months: number;
      conditions: string[];
    };
  };
  // Combined assessment
  combined_risk_level: 'low' | 'medium' | 'high' | 'critical';
  combined_risk_score: number;
  decision: 'approve' | 'review' | 'decline';
  explainability: {
    positive_factors: string[];
    negative_factors: string[];
    improvement_suggestions: string[];
  };
}

interface UseWouakaCoreResult {
  /** Process a complete KYC + Score assessment */
  processCore: (request: CoreRequest) => Promise<CoreResponse | null>;
  /** Current result */
  result: CoreResponse | null;
  /** Whether a request is in progress */
  isLoading: boolean;
  /** Error from the last request */
  error: WouakaSdkError | null;
  /** Reset the hook state */
  reset: () => void;
}

interface UseWouakaCoreOptions {
  /** Persist results to database */
  persistToDatabase?: boolean;
  /** Show toast notifications */
  showToasts?: boolean;
}

/**
 * Hook for WOUAKA Core operations (unified KYC + Score)
 */
export function useWouakaCore(options: UseWouakaCoreOptions = {}): UseWouakaCoreResult {
  const { persistToDatabase = true, showToasts = true } = options;
  const { client, isReady } = useWouakaSdk();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [result, setResult] = useState<CoreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<WouakaSdkError | null>(null);

  /**
   * Process a complete assessment using the SDK
   */
  const processCore = useCallback(async (request: CoreRequest): Promise<CoreResponse | null> => {
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
      // The SDK doesn't have a direct core method yet, so we call the edge function
      // This will be updated when the SDK adds core support
      const { data: coreResult, error: fnError } = await supabase.functions.invoke('wouaka-core', {
        body: {
          ...request,
          consent_data_processing: true,
          consent_timestamp: new Date().toISOString(),
        },
      });

      if (fnError) throw fnError;

      // Normalize the response
      const normalizedResult: CoreResponse = {
        request_id: coreResult.request_id || crypto.randomUUID(),
        reference_id: request.reference_id,
        status: coreResult.status || 'success',
        processing_time_ms: coreResult.processing_time_ms || 0,
        kyc: {
          status: coreResult.kyc?.status || 'pending',
          identity_score: coreResult.kyc?.risk_score ? 100 - coreResult.kyc.risk_score : 50,
          fraud_score: coreResult.kyc?.fraud_indicators?.filter((i: any) => i.detected).length * 20 || 0,
          risk_level: coreResult.kyc?.risk_level || 'medium',
          checks: coreResult.kyc?.checks || [],
          fraud_indicators: coreResult.kyc?.fraud_indicators || [],
        },
        score: {
          final_score: coreResult.score?.final_score || 0,
          grade: coreResult.score?.grade || 'C',
          risk_tier: coreResult.score?.risk_tier || 'standard',
          confidence: coreResult.score?.confidence || 50,
          sub_scores: coreResult.score?.sub_scores || {},
          credit_recommendation: coreResult.score?.credit_recommendation || {
            approved: false,
            max_amount: 0,
            max_tenor_months: 0,
            conditions: [],
          },
        },
        combined_risk_level: coreResult.combined_risk_level || 'medium',
        combined_risk_score: coreResult.combined_risk_score || 50,
        decision: coreResult.decision || 'review',
        explainability: {
          positive_factors: coreResult.explainability?.positive_factors || [],
          negative_factors: coreResult.explainability?.negative_factors || [],
          improvement_suggestions: coreResult.explainability?.improvement_suggestions || [],
        },
      };

      setResult(normalizedResult);

      // Persist to database if enabled
      if (persistToDatabase && user?.id) {
        // Save KYC request
        await supabase.from('kyc_requests').insert({
          partner_id: user.id,
          full_name: request.full_name,
          phone_number: request.phone_number,
          national_id: request.national_id,
          status: normalizedResult.kyc.status,
          identity_score: normalizedResult.kyc.identity_score,
          fraud_score: normalizedResult.kyc.fraud_score,
          risk_level: normalizedResult.kyc.risk_level,
          processing_time_ms: normalizedResult.processing_time_ms,
          kyc_level: request.kyc_level || 'basic',
        });

        // Save scoring request
        await supabase.from('scoring_requests').insert({
          user_id: user.id,
          full_name: request.full_name,
          phone_number: request.phone_number,
          national_id: request.national_id,
          monthly_income: request.monthly_income,
          employment_type: request.employment_type,
          city: request.city,
          score: normalizedResult.score.final_score,
          grade: normalizedResult.score.grade,
          risk_category: normalizedResult.score.risk_tier,
          confidence: normalizedResult.score.confidence,
          status: 'completed',
          processing_time_ms: normalizedResult.processing_time_ms,
        });
      }

      if (showToasts) {
        const isApproved = normalizedResult.decision === 'approve';
        toast({
          variant: isApproved ? 'default' : undefined,
          title: isApproved ? 'Évaluation positive' : 'Évaluation terminée',
          description: `Score: ${normalizedResult.score.final_score}/100 | KYC: ${normalizedResult.kyc.status}`,
        });
      }

      return normalizedResult;
    } catch (err) {
      const parsedError = parseWouakaSdkError(err);
      setError(parsedError);
      
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Erreur d\'évaluation',
          description: parsedError.message,
        });
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [client, isReady, user?.id, persistToDatabase, showToasts, toast]);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    processCore,
    result,
    isLoading,
    error,
    reset,
  };
}

export default useWouakaCore;
