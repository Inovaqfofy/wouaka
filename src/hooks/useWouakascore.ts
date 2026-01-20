/**
 * WOUAKA Score Hook
 * React hook for credit scoring using the @wouaka/sdk
 * 
 * @example
 * ```tsx
 * const { calculateScore, result, isLoading, error } = useWouakaScore();
 * 
 * const handleSubmit = async (data) => {
 *   const score = await calculateScore({
 *     phone_number: '+22507XXXXXXXX',
 *     full_name: 'Kouassi Jean',
 *     monthly_income: 500000,
 *   });
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import type { ScoreRequest, ScoreResponse } from '@wouaka/sdk';
import { useWouakaSdk } from './useWouakaSdk';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { parseWouakaSdkError, type WouakaSdkError } from '@/lib/wouaka-sdk-client';

interface UseWouakaScoreResult {
  /** Calculate a credit score */
  calculateScore: (request: ScoreRequest) => Promise<ScoreResponse | null>;
  /** Get a score by ID */
  getScore: (scoreId: string) => Promise<ScoreResponse | null>;
  /** List recent scores */
  listScores: (limit?: number) => Promise<ScoreResponse[]>;
  /** Current score result */
  result: ScoreResponse | null;
  /** Whether a request is in progress */
  isLoading: boolean;
  /** Error from the last request */
  error: WouakaSdkError | null;
  /** Reset the hook state */
  reset: () => void;
}

interface UseWouakaScoreOptions {
  /** Persist scores to database */
  persistToDatabase?: boolean;
  /** Show toast notifications */
  showToasts?: boolean;
}

/**
 * Hook for WOUAKA credit scoring operations
 */
export function useWouakaScore(options: UseWouakaScoreOptions = {}): UseWouakaScoreResult {
  const { persistToDatabase = true, showToasts = true } = options;
  const { client, isReady } = useWouakaSdk();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<WouakaSdkError | null>(null);

  /**
   * Calculate a credit score using the SDK
   */
  const calculateScore = useCallback(async (request: ScoreRequest): Promise<ScoreResponse | null> => {
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
      const scoreResponse = await client.scores.calculate(request);
      
      setResult(scoreResponse);

      // Persist to database if enabled
      if (persistToDatabase && user?.id) {
        await supabase.from('scoring_requests').insert({
          user_id: user.id,
          full_name: request.full_name,
          national_id: request.national_id,
          phone_number: request.phone_number,
          company_name: request.company_name,
          employment_type: request.employment_type,
          years_in_business: request.years_in_business,
          sector: request.sector,
          monthly_income: request.monthly_income,
          monthly_expenses: request.monthly_expenses,
          existing_loans: request.existing_loans,
          mobile_money_volume: request.mobile_money?.total_in,
          sim_age_months: request.telecom?.sim_age_months,
          city: request.location?.city,
          region: request.location?.region,
          score: scoreResponse.score,
          grade: scoreResponse.grade,
          risk_category: scoreResponse.risk_category,
          confidence: scoreResponse.confidence,
          reliability_score: scoreResponse.sub_scores?.identity_stability,
          stability_score: scoreResponse.sub_scores?.financial_discipline,
          engagement_capacity_score: scoreResponse.sub_scores?.social_capital,
          explanations: scoreResponse.factors?.positive || [],
          recommendations: scoreResponse.credit_recommendation?.conditions || [],
          processing_time_ms: scoreResponse.processing_time_ms,
          model_version: scoreResponse.model_version,
          status: 'completed',
        });
      }

      if (showToasts) {
        toast({
          title: 'Score calculé',
          description: `Score: ${scoreResponse.score}/100 (${scoreResponse.grade})`,
        });
      }

      return scoreResponse;
    } catch (err) {
      const parsedError = parseWouakaSdkError(err);
      setError(parsedError);
      
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Erreur de calcul',
          description: parsedError.message,
        });
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [client, isReady, user?.id, persistToDatabase, showToasts, toast]);

  /**
   * Get a score by ID
   */
  const getScore = useCallback(async (scoreId: string): Promise<ScoreResponse | null> => {
    if (!client || !isReady) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const score = await client.scores.get(scoreId);
      setResult(score);
      return score;
    } catch (err) {
      const parsedError = parseWouakaSdkError(err);
      setError(parsedError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [client, isReady]);

  /**
   * List recent scores
   */
  const listScores = useCallback(async (limit = 10): Promise<ScoreResponse[]> => {
    if (!client || !isReady) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const scores = await client.scores.list({ limit });
      return scores.data || [];
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
    calculateScore,
    getScore,
    listScores,
    result,
    isLoading,
    error,
    reset,
  };
}

export default useWouakaScore;
