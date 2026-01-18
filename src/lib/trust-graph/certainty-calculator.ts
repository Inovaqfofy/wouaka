/**
 * WOUAKA Certainty Calculator
 * Applies data source certainty coefficients to scoring features
 */

import { supabase } from '@/integrations/supabase/client';

export interface DataSourceCertainty {
  sourceType: string;
  sourceName: string;
  baseCertainty: number;
  certifiedCertainty: number;
  certificationRequirements: string[];
}

export interface CertifiedDataPoint {
  featureId: string;
  featureName: string;
  value: number;
  sourceType: string;
  isCertified: boolean;
  certaintyCoefficient: number;
  weightedValue: number;
  certificationDetails?: string[];
}

// Default certainty coefficients (fallback if DB unavailable)
const DEFAULT_CERTAINTY: Record<string, DataSourceCertainty> = {
  declared: {
    sourceType: 'declared',
    sourceName: 'Données déclaratives',
    baseCertainty: 0.3,
    certifiedCertainty: 0.5,
    certificationRequirements: ['identity_verified'],
  },
  sms_parsed: {
    sourceType: 'sms_parsed',
    sourceName: 'SMS transactionnels parsés',
    baseCertainty: 0.7,
    certifiedCertainty: 0.9,
    certificationRequirements: ['phone_otp_verified', 'provider_detected'],
  },
  screenshot_ocr: {
    sourceType: 'screenshot_ocr',
    sourceName: 'Capture écran MoMo OCR',
    baseCertainty: 0.6,
    certifiedCertainty: 0.9,
    certificationRequirements: ['phone_otp_verified', 'tampering_check_passed', 'name_cross_validated'],
  },
  document_ocr: {
    sourceType: 'document_ocr',
    sourceName: 'Document scanné OCR',
    baseCertainty: 0.7,
    certifiedCertainty: 0.95,
    certificationRequirements: ['mrz_validated', 'forgery_check_passed'],
  },
  api_verified: {
    sourceType: 'api_verified',
    sourceName: 'API tierce vérifiée',
    baseCertainty: 0.95,
    certifiedCertainty: 1.0,
    certificationRequirements: [],
  },
  partner_feedback: {
    sourceType: 'partner_feedback',
    sourceName: 'Retour partenaire',
    baseCertainty: 0.8,
    certifiedCertainty: 0.95,
    certificationRequirements: ['loan_outcome_received'],
  },
  utility_sms: {
    sourceType: 'utility_sms',
    sourceName: 'SMS facture utilitaire',
    baseCertainty: 0.65,
    certifiedCertainty: 0.85,
    certificationRequirements: ['provider_shortcode_verified'],
  },
  tontine_attestation: {
    sourceType: 'tontine_attestation',
    sourceName: 'Attestation tontine',
    baseCertainty: 0.5,
    certifiedCertainty: 0.8,
    certificationRequirements: ['guarantor_verified'],
  },
};

let cachedCertaintyCoefficients: Record<string, DataSourceCertainty> | null = null;

/**
 * Load certainty coefficients from database
 */
export async function loadCertaintyCoefficients(): Promise<Record<string, DataSourceCertainty>> {
  if (cachedCertaintyCoefficients) {
    return cachedCertaintyCoefficients;
  }

  try {
    const { data, error } = await supabase
      .from('data_source_certainty')
      .select('*')
      .eq('is_active', true);

    if (error || !data || data.length === 0) {
      console.warn('Using default certainty coefficients');
      return DEFAULT_CERTAINTY;
    }

    const coefficients: Record<string, DataSourceCertainty> = {};
    for (const row of data) {
      coefficients[row.source_type] = {
        sourceType: row.source_type,
        sourceName: row.source_name,
        baseCertainty: row.base_certainty,
        certifiedCertainty: row.certified_certainty,
        certificationRequirements: row.certification_requirements as string[] || [],
      };
    }

    cachedCertaintyCoefficients = coefficients;
    return coefficients;
  } catch {
    return DEFAULT_CERTAINTY;
  }
}

/**
 * Get certainty coefficient for a data source
 */
export function getCertaintyCoefficient(
  sourceType: string,
  isCertified: boolean,
  coefficients: Record<string, DataSourceCertainty> = DEFAULT_CERTAINTY
): number {
  const source = coefficients[sourceType] || DEFAULT_CERTAINTY.declared;
  return isCertified ? source.certifiedCertainty : source.baseCertainty;
}

/**
 * Check if data meets certification requirements
 */
export function checkCertificationRequirements(
  sourceType: string,
  providedProofs: string[],
  coefficients: Record<string, DataSourceCertainty> = DEFAULT_CERTAINTY
): { isCertified: boolean; missingRequirements: string[] } {
  const source = coefficients[sourceType] || DEFAULT_CERTAINTY.declared;
  const requirements = source.certificationRequirements;
  
  const missingRequirements = requirements.filter(req => !providedProofs.includes(req));
  
  return {
    isCertified: missingRequirements.length === 0,
    missingRequirements,
  };
}

/**
 * Apply certainty weighting to a score feature
 */
export function applyFeatureCertainty(
  featureId: string,
  featureName: string,
  rawValue: number,
  sourceType: string,
  isCertified: boolean,
  coefficients: Record<string, DataSourceCertainty> = DEFAULT_CERTAINTY
): CertifiedDataPoint {
  const certainty = getCertaintyCoefficient(sourceType, isCertified, coefficients);
  
  return {
    featureId,
    featureName,
    value: rawValue,
    sourceType,
    isCertified,
    certaintyCoefficient: certainty,
    weightedValue: rawValue * certainty,
    certificationDetails: isCertified 
      ? ['Données certifiées'] 
      : [`Coefficient: ${Math.round(certainty * 100)}%`],
  };
}

/**
 * Calculate weighted average score with certainty
 */
export function calculateWeightedScore(
  dataPoints: CertifiedDataPoint[],
  featureWeights: Record<string, number>
): {
  rawScore: number;
  certifiedScore: number;
  overallCertainty: number;
  breakdown: Array<{
    feature: string;
    rawContribution: number;
    certifiedContribution: number;
    certainty: number;
  }>;
} {
  let rawTotal = 0;
  let certifiedTotal = 0;
  let weightTotal = 0;
  let certaintySum = 0;
  
  const breakdown: Array<{
    feature: string;
    rawContribution: number;
    certifiedContribution: number;
    certainty: number;
  }> = [];
  
  for (const dp of dataPoints) {
    const weight = featureWeights[dp.featureId] || 0;
    if (weight === 0) continue;
    
    const rawContribution = dp.value * weight;
    const certifiedContribution = dp.weightedValue * weight;
    
    rawTotal += rawContribution;
    certifiedTotal += certifiedContribution;
    weightTotal += weight;
    certaintySum += dp.certaintyCoefficient * weight;
    
    breakdown.push({
      feature: dp.featureName,
      rawContribution,
      certifiedContribution,
      certainty: dp.certaintyCoefficient,
    });
  }
  
  const overallCertainty = weightTotal > 0 ? certaintySum / weightTotal : 0;
  
  return {
    rawScore: weightTotal > 0 ? rawTotal / weightTotal : 0,
    certifiedScore: weightTotal > 0 ? certifiedTotal / weightTotal : 0,
    overallCertainty,
    breakdown,
  };
}

/**
 * Calculate trust level from phone trust score
 */
export function calculateTrustLevel(trustScore: number): string {
  if (trustScore >= 90) return 'gold';
  if (trustScore >= 70) return 'certified';
  if (trustScore >= 50) return 'verified';
  if (trustScore >= 20) return 'basic';
  return 'unverified';
}

/**
 * Calculate activity level from transaction count and recency
 */
export function calculateActivityLevel(
  transactionCount: number,
  lastActivityDate?: Date
): string {
  const now = new Date();
  const daysSinceLastActivity = lastActivityDate 
    ? Math.floor((now.getTime() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000))
    : 999;
  
  if (daysSinceLastActivity > 90) return 'dormant';
  if (transactionCount < 5) return 'low';
  if (transactionCount < 20) return 'medium';
  if (transactionCount < 50) return 'high';
  return 'very_high';
}
