/**
 * WOUAKA W-SCORE Certainty Integration
 * Applies data source certainty coefficients to scoring
 */

import { supabase } from '@/integrations/supabase/client';
import {
  loadCertaintyCoefficients,
  getCertaintyCoefficient,
  applyFeatureCertainty,
  calculateWeightedScore,
  type CertifiedDataPoint,
  type DataSourceCertainty,
} from '@/lib/trust-graph/certainty-calculator';
import type { WScoreResult, ScoreSubComponents } from './types';

export interface DataSourceMetadata {
  featureId: string;
  sourceType: 'declared' | 'sms_parsed' | 'screenshot_ocr' | 'document_ocr' | 'api_verified' | 'partner_feedback' | 'utility_sms' | 'tontine_attestation';
  isCertified: boolean;
  certificationProofs?: string[];
}

export interface CertifiedScoreResult extends WScoreResult {
  certainty_analysis: {
    overall_certainty: number;
    raw_score: number;
    certified_score: number;
    data_points: CertifiedDataPoint[];
    source_breakdown: Array<{
      source: string;
      count: number;
      avg_certainty: number;
    }>;
    recommendations: string[];
  };
}

// Feature to source type mapping
const FEATURE_SOURCE_MAP: Record<string, string> = {
  // Identity features
  sim_age_months: 'declared',
  address_stability_years: 'declared',
  business_age_years: 'document_ocr',
  is_formalized: 'document_ocr',
  document_verification_score: 'document_ocr',
  
  // Cashflow features
  monthly_income: 'sms_parsed',
  income_stability_index: 'sms_parsed',
  expense_to_income_ratio: 'sms_parsed',
  momo_velocity_30d: 'sms_parsed',
  momo_in_out_ratio: 'sms_parsed',
  average_balance: 'screenshot_ocr',
  cashflow_regularity: 'sms_parsed',
  
  // Behavioral features
  financial_literacy_score: 'declared',
  planning_horizon_score: 'declared',
  self_control_score: 'declared',
  response_consistency: 'declared',
  digital_engagement_score: 'declared',
  
  // Discipline features
  utility_payment_rate: 'utility_sms',
  utility_late_ratio: 'utility_sms',
  rent_payment_consistency: 'declared',
  savings_rate: 'sms_parsed',
  existing_debt_ratio: 'declared',
  
  // Social features
  tontine_participation_score: 'tontine_attestation',
  tontine_discipline_rate: 'tontine_attestation',
  cooperative_standing_score: 'declared',
  cooperative_loan_history: 'declared',
  guarantor_quality_score: 'declared',
  community_attestation_count: 'tontine_attestation',
  
  // Environmental features
  regional_risk_index: 'api_verified',
  infrastructure_score: 'api_verified',
  seasonal_adjustment: 'api_verified',
};

/**
 * Apply certainty coefficients to computed features
 */
export async function applyScoreCertainty(
  features: Record<string, number>,
  featureWeights: Record<string, number>,
  certificationStatus: Record<string, boolean> = {},
  phoneTrustScore?: number
): Promise<{
  certifiedDataPoints: CertifiedDataPoint[];
  overallCertainty: number;
  rawScore: number;
  certifiedScore: number;
  sourceBreakdown: Array<{ source: string; count: number; avg_certainty: number }>;
}> {
  const coefficients = await loadCertaintyCoefficients();
  const certifiedDataPoints: CertifiedDataPoint[] = [];
  
  // Apply certainty to each feature
  for (const [featureId, value] of Object.entries(features)) {
    const sourceType = FEATURE_SOURCE_MAP[featureId] || 'declared';
    const isCertified = certificationStatus[featureId] || false;
    
    // Boost certification based on phone trust score
    let effectiveCertified = isCertified;
    if (phoneTrustScore && phoneTrustScore >= 70) {
      // High phone trust = auto-certify SMS and screenshot data
      if (['sms_parsed', 'screenshot_ocr', 'utility_sms'].includes(sourceType)) {
        effectiveCertified = true;
      }
    }
    
    const certifiedPoint = applyFeatureCertainty(
      featureId,
      featureId.replace(/_/g, ' '),
      value,
      sourceType,
      effectiveCertified,
      coefficients
    );
    
    certifiedDataPoints.push(certifiedPoint);
  }
  
  // Calculate weighted scores
  const { rawScore, certifiedScore, overallCertainty } = calculateWeightedScore(
    certifiedDataPoints,
    featureWeights
  );
  
  // Group by source for breakdown
  const sourceGroups: Record<string, { count: number; totalCertainty: number }> = {};
  for (const dp of certifiedDataPoints) {
    if (!sourceGroups[dp.sourceType]) {
      sourceGroups[dp.sourceType] = { count: 0, totalCertainty: 0 };
    }
    sourceGroups[dp.sourceType].count++;
    sourceGroups[dp.sourceType].totalCertainty += dp.certaintyCoefficient;
  }
  
  const sourceBreakdown = Object.entries(sourceGroups).map(([source, data]) => ({
    source,
    count: data.count,
    avg_certainty: data.totalCertainty / data.count,
  }));
  
  return {
    certifiedDataPoints,
    overallCertainty,
    rawScore,
    certifiedScore,
    sourceBreakdown,
  };
}

/**
 * Get phone trust score for a user
 */
export async function getPhoneTrustScore(phoneNumber: string): Promise<number> {
  try {
    const { data } = await supabase.rpc('calculate_phone_trust_score', {
      p_phone_number: phoneNumber,
    });
    return data || 0;
  } catch {
    return 0;
  }
}

/**
 * Enhance W-SCORE result with certainty analysis
 */
export async function enhanceScoreWithCertainty(
  baseResult: WScoreResult,
  features: Record<string, number>,
  featureWeights: Record<string, number>,
  phoneNumber?: string
): Promise<CertifiedScoreResult> {
  // Get phone trust score if available
  const phoneTrustScore = phoneNumber ? await getPhoneTrustScore(phoneNumber) : 0;
  
  // Build certification status based on data sources used
  const certificationStatus: Record<string, boolean> = {};
  
  // Auto-certify based on data sources present in result
  for (const source of baseResult.data_sources_used) {
    if (source === 'mobile_money') {
      ['monthly_income', 'income_stability_index', 'momo_velocity_30d', 'momo_in_out_ratio'].forEach(f => {
        certificationStatus[f] = phoneTrustScore >= 50;
      });
    }
    if (source === 'utility_payments') {
      ['utility_payment_rate', 'utility_late_ratio'].forEach(f => {
        certificationStatus[f] = true;
      });
    }
    if (source === 'kyc') {
      ['document_verification_score', 'is_formalized', 'business_age_years'].forEach(f => {
        certificationStatus[f] = true;
      });
    }
  }
  
  // Apply certainty
  const certaintyAnalysis = await applyScoreCertainty(
    features,
    featureWeights,
    certificationStatus,
    phoneTrustScore
  );
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (certaintyAnalysis.overallCertainty < 0.5) {
    recommendations.push('Fournir des preuves SMS de transactions pour augmenter la certitude');
  }
  
  if (phoneTrustScore < 50) {
    recommendations.push('Compléter la vérification du numéro de téléphone');
  }
  
  const declaredSources = certaintyAnalysis.sourceBreakdown.filter(s => s.source === 'declared');
  if (declaredSources.length > 0 && declaredSources[0].count > 5) {
    recommendations.push('Trop de données déclaratives - fournir des justificatifs');
  }
  
  // Adjust final score based on certainty
  const certaintyPenalty = Math.max(0, (0.7 - certaintyAnalysis.overallCertainty) * 10);
  const adjustedScore = Math.max(0, Math.round(baseResult.final_score - certaintyPenalty));
  
  return {
    ...baseResult,
    final_score: adjustedScore,
    certainty_analysis: {
      overall_certainty: Math.round(certaintyAnalysis.overallCertainty * 100) / 100,
      raw_score: Math.round(certaintyAnalysis.rawScore),
      certified_score: Math.round(certaintyAnalysis.certifiedScore),
      data_points: certaintyAnalysis.certifiedDataPoints,
      source_breakdown: certaintyAnalysis.sourceBreakdown.map(s => ({
        ...s,
        avg_certainty: Math.round(s.avg_certainty * 100) / 100,
      })),
      recommendations,
    },
  };
}

/**
 * Get certainty coefficient label
 */
export function getCertaintyLabel(certainty: number): {
  label: string;
  color: string;
  description: string;
} {
  if (certainty >= 0.9) {
    return {
      label: 'Très élevée',
      color: 'text-green-600',
      description: 'Données vérifiées et certifiées',
    };
  }
  if (certainty >= 0.7) {
    return {
      label: 'Élevée',
      color: 'text-blue-600',
      description: 'Données extraites avec vérification partielle',
    };
  }
  if (certainty >= 0.5) {
    return {
      label: 'Moyenne',
      color: 'text-yellow-600',
      description: 'Données partiellement vérifiées',
    };
  }
  if (certainty >= 0.3) {
    return {
      label: 'Faible',
      color: 'text-orange-600',
      description: 'Données principalement déclaratives',
    };
  }
  return {
    label: 'Très faible',
    color: 'text-red-600',
    description: 'Données non vérifiées',
  };
}
