/**
 * useScoring Hook
 * Wrapper around useWouakaScore for backward compatibility
 * Now uses the official @wouaka/sdk
 */

import { useCallback } from 'react';
import { useWouakaScore } from './useWouakaScore';
import { ScoringInputData, ScoringResult } from '@/lib/scoring-types';

export function useScoring() {
  const { 
    calculateScore: sdkCalculateScore, 
    result: sdkResult, 
    isLoading, 
    error: sdkError,
    reset: sdkReset 
  } = useWouakaScore({ persistToDatabase: true, showToasts: true });

  const calculateScore = useCallback(async (
    data: ScoringInputData, 
    enrichmentData?: any
  ): Promise<ScoringResult | null> => {
    // Map legacy input format to SDK format
    const sdkRequest = {
      full_name: data.full_name,
      phone_number: data.phone_number,
      national_id: data.national_id,
      company_name: data.company_name,
      rccm_number: data.rccm_number,
      employment_type: data.employment_type,
      years_in_business: data.years_in_business,
      sector: data.sector,
      monthly_income: data.monthly_income,
      monthly_expenses: data.monthly_expenses,
      existing_loans: data.existing_loans,
      mobile_money: {
        total_in: data.mobile_money_volume,
        transaction_count: data.mobile_money_transactions,
      },
      telecom: {
        sim_age_months: data.sim_age_months,
      },
      utility: {
        payments_on_time: data.utility_payments_on_time,
        payments_late: data.utility_payments_late,
      },
      location: {
        city: data.city,
        region: data.region,
      },
      enrichment_data: enrichmentData,
    };

    const response = await sdkCalculateScore(sdkRequest);
    
    if (!response) return null;

    // Map SDK response to legacy ScoringResult format
    const normalizedResult: ScoringResult = {
      score: response.score,
      grade: response.grade || getGradeFromScore(response.score),
      risk_category: response.risk_category,
      confidence: response.confidence,
      reliability: response.sub_scores?.identity_stability ?? 0,
      stability: response.sub_scores?.financial_discipline ?? 0,
      short_term_risk: response.sub_scores?.behavioral_risk ?? 0,
      engagement_capacity: response.sub_scores?.social_capital ?? 0,
      explanations: response.factors?.positive || [],
      recommendations: response.credit_recommendation?.conditions || [],
      feature_importance: response.factors?.negative || [],
      processing_time_ms: response.processing_time_ms,
      model_version: response.model_version,
      calculated_at: response.created_at || new Date().toISOString(),
    };

    return normalizedResult;
  }, [sdkCalculateScore]);

  const resetResult = useCallback(() => {
    sdkReset();
  }, [sdkReset]);

  // Map SDK result to legacy format for existing consumers
  const result: ScoringResult | null = sdkResult ? {
    score: sdkResult.score,
    grade: sdkResult.grade || getGradeFromScore(sdkResult.score),
    risk_category: sdkResult.risk_category,
    confidence: sdkResult.confidence,
    reliability: sdkResult.sub_scores?.identity_stability ?? 0,
    stability: sdkResult.sub_scores?.financial_discipline ?? 0,
    short_term_risk: sdkResult.sub_scores?.behavioral_risk ?? 0,
    engagement_capacity: sdkResult.sub_scores?.social_capital ?? 0,
    explanations: sdkResult.factors?.positive || [],
    recommendations: sdkResult.credit_recommendation?.conditions || [],
    feature_importance: sdkResult.factors?.negative || [],
    processing_time_ms: sdkResult.processing_time_ms,
    model_version: sdkResult.model_version,
    calculated_at: sdkResult.created_at || new Date().toISOString(),
  } : null;

  return {
    calculateScore,
    resetResult,
    loading: isLoading,
    result,
    error: sdkError?.message || null,
  };
}

// Helper function to get grade from score
function getGradeFromScore(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  if (score >= 30) return 'D';
  return 'E';
}
