/**
 * ============================================
 * WOUAKA CONFIDENCE LAYER v1.0
 * Sovereign Proof-Based Data Certification
 * ============================================
 * 
 * @fileoverview
 * This module implements the Confidence Layer that weights each score
 * based on the origin of the proof data.
 * 
 * ## Source Coefficients
 * 
 * | Type | Coefficient | Description |
 * |------|-------------|-------------|
 * | Hard Proof | 1.0 | OCR certifié (CNI), SMS transactionnels, APIs factures |
 * | Soft Proof | 0.7 | Captures USSD, attestations communautaires |
 * | Declarative | 0.3 | Données saisies manuellement sans document |
 * 
 * ## Confidence Index Calculation
 * 
 * - Identity + Phone + SMS verified = >90
 * - KYC documentary only = ~60
 * - Declarative only = <30
 * 
 * @module confidence-layer
 * @version 1.0.0
 * @author WOUAKA Team
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// SOURCE COEFFICIENT CONSTANTS
// ============================================

/**
 * Preuve Hard (Coeff 1.0)
 * - OCR certifié (CNI)
 * - SMS transactionnels analysés (sms_analyses)
 * - APIs factures (CIE/Senelec/SODECI)
 */
export const HARD_PROOF_COEFFICIENT = 1.0;

/**
 * Preuve Soft (Coeff 0.7)
 * - Captures d'écran USSD (ussd_screenshot_validations)
 * - Attestations communautaires
 */
export const SOFT_PROOF_COEFFICIENT = 0.7;

/**
 * Déclaratif (Coeff 0.3)
 * - Données saisies manuellement sans document
 */
export const DECLARATIVE_COEFFICIENT = 0.3;

// ============================================
// TYPE DEFINITIONS
// ============================================

export type ProofType = 'hard' | 'soft' | 'declarative';

export interface DataSourceProof {
  featureId: string;
  proofType: ProofType;
  sourceTable: string;
  isCertified: boolean;
  coefficient: number;
  details?: string;
}

export interface ConfidenceAnalysis {
  /** Global confidence index (0-100) */
  confidence_index: number;
  
  /** Breakdown by proof type */
  proof_breakdown: {
    hard_proof_count: number;
    hard_proof_percentage: number;
    soft_proof_count: number;
    soft_proof_percentage: number;
    declarative_count: number;
    declarative_percentage: number;
  };
  
  /** Features with their proof types */
  feature_proofs: DataSourceProof[];
  
  /** Certification status */
  certification_level: 'gold' | 'certified' | 'verified' | 'basic' | 'unverified';
  
  /** Explanation for bankers */
  banker_summary: string;
  
  /** Whether the score can be trusted "les yeux fermés" */
  high_trust: boolean;
  
  /** Guarantor bonus applied */
  guarantor_bonus: {
    applied: boolean;
    bonus_percentage: number;
    certified_guarantor_id?: string;
    certified_guarantor_score?: number;
  };
}

export interface GuarantorCheck {
  hasQualifiedGuarantor: boolean;
  guarantorProfileId?: string;
  guarantorScore?: number;
  bonusPercentage: number;
}

// ============================================
// FEATURE TO SOURCE MAPPING
// ============================================

/**
 * Maps feature IDs to their source tables and proof types
 */
const FEATURE_SOURCE_MAP: Record<string, { table: string; proofType: ProofType }> = {
  // Hard Proof Sources (1.0)
  document_verification_score: { table: 'kyc_documents', proofType: 'hard' },
  phone_trust_score: { table: 'phone_trust_scores', proofType: 'hard' },
  monthly_income: { table: 'sms_analyses', proofType: 'hard' }, // If from SMS
  income_stability_index: { table: 'user_momo_transactions', proofType: 'hard' },
  momo_velocity_30d: { table: 'user_momo_transactions', proofType: 'hard' },
  momo_in_out_ratio: { table: 'user_momo_transactions', proofType: 'hard' },
  cashflow_regularity: { table: 'user_momo_transactions', proofType: 'hard' },
  utility_payment_rate: { table: 'data_enrichments', proofType: 'hard' }, // From utility APIs
  utility_late_ratio: { table: 'data_enrichments', proofType: 'hard' },
  
  // Soft Proof Sources (0.7)
  average_balance: { table: 'ussd_screenshot_validations', proofType: 'soft' },
  tontine_participation_score: { table: 'user_tontine_memberships', proofType: 'soft' },
  tontine_discipline_rate: { table: 'user_tontine_memberships', proofType: 'soft' },
  cooperative_standing_score: { table: 'user_cooperative_memberships', proofType: 'soft' },
  cooperative_loan_history: { table: 'user_cooperative_memberships', proofType: 'soft' },
  community_attestation_count: { table: 'community_attestations', proofType: 'soft' },
  guarantor_quality_score: { table: 'user_guarantors', proofType: 'soft' },
  
  // Declarative Sources (0.3)
  sim_age_months: { table: 'profiles', proofType: 'declarative' },
  address_stability_years: { table: 'user_addresses', proofType: 'declarative' },
  business_age_years: { table: 'profiles', proofType: 'declarative' },
  is_formalized: { table: 'profiles', proofType: 'declarative' },
  savings_rate: { table: 'declared', proofType: 'declarative' },
  existing_debt_ratio: { table: 'declared', proofType: 'declarative' },
  expense_to_income_ratio: { table: 'declared', proofType: 'declarative' },
  rent_payment_consistency: { table: 'declared', proofType: 'declarative' },
  
  // Psychometric (Soft since it's behavioral)
  financial_literacy_score: { table: 'psychometric_sessions', proofType: 'soft' },
  planning_horizon_score: { table: 'psychometric_sessions', proofType: 'soft' },
  self_control_score: { table: 'psychometric_sessions', proofType: 'soft' },
  response_consistency: { table: 'psychometric_sessions', proofType: 'soft' },
  digital_engagement_score: { table: 'device_analysis', proofType: 'soft' },
  
  // Environmental (Open data = Soft)
  regional_risk_index: { table: 'open_data', proofType: 'soft' },
  infrastructure_score: { table: 'open_data', proofType: 'soft' },
  seasonal_adjustment: { table: 'open_data', proofType: 'soft' },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get coefficient for a proof type
 */
export function getProofCoefficient(proofType: ProofType): number {
  switch (proofType) {
    case 'hard': return HARD_PROOF_COEFFICIENT;
    case 'soft': return SOFT_PROOF_COEFFICIENT;
    case 'declarative': return DECLARATIVE_COEFFICIENT;
  }
}

/**
 * Determine proof type based on available data sources
 */
export function determineProofType(
  featureId: string,
  availableSources: string[]
): { proofType: ProofType; isCertified: boolean } {
  const mapping = FEATURE_SOURCE_MAP[featureId];
  
  if (!mapping) {
    return { proofType: 'declarative', isCertified: false };
  }
  
  // Check if we have certified data from the expected source
  const isCertified = availableSources.includes(mapping.table);
  
  // If no certified source, downgrade to declarative
  if (!isCertified && mapping.proofType !== 'declarative') {
    return { proofType: 'declarative', isCertified: false };
  }
  
  return { proofType: mapping.proofType, isCertified };
}

/**
 * Check if user has a certified guarantor with score > 700
 * Returns bonus percentage (5%) if qualified
 * 
 * Note: Guarantors in user_guarantors table are identified by phone_number.
 * We look up if that phone is associated with a certified profile.
 */
export async function checkCertifiedGuarantor(userId: string): Promise<GuarantorCheck> {
  try {
    // Query verified guarantors for this user
    const { data: guarantors, error: gError } = await supabase
      .from('user_guarantors')
      .select('id, guarantor_name, phone_number, identity_verified, quality_score')
      .eq('user_id', userId)
      .eq('identity_verified', true);
    
    if (gError || !guarantors || guarantors.length === 0) {
      return { hasQualifiedGuarantor: false, bonusPercentage: 0 };
    }
    
    // Check each verified guarantor for certification status via phone_trust_scores
    for (const guarantor of guarantors) {
      if (!guarantor.phone_number) continue;
      
      // Look up if this phone has a high trust score and associated profile
      const { data: phoneTrust } = await supabase
        .from('phone_trust_scores')
        .select('user_id, trust_score')
        .eq('phone_number', guarantor.phone_number)
        .gte('trust_score', 70) // 70+ on 0-100 = 700+ on 0-1000 scale
        .order('trust_score', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (phoneTrust && phoneTrust.trust_score >= 70) {
        // Check if guarantor has a valid certificate
        const { data: certificate } = await supabase
          .from('certificates')
          .select('id, score, trust_level')
          .eq('user_id', phoneTrust.user_id)
          .eq('validation_status', 'valid')
          .gte('valid_until', new Date().toISOString())
          .order('score', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (certificate && certificate.score && certificate.score >= 70) {
          return {
            hasQualifiedGuarantor: true,
            guarantorProfileId: phoneTrust.user_id,
            guarantorScore: certificate.score * 10, // Convert to 0-1000 scale
            bonusPercentage: 5, // 5% bonus as specified
          };
        }
        
        // Even without certificate, high phone trust score qualifies
        return {
          hasQualifiedGuarantor: true,
          guarantorProfileId: phoneTrust.user_id,
          guarantorScore: phoneTrust.trust_score * 10,
          bonusPercentage: 5,
        };
      }
    }
    
    return { hasQualifiedGuarantor: false, bonusPercentage: 0 };
  } catch {
    return { hasQualifiedGuarantor: false, bonusPercentage: 0 };
  }
}

/**
 * Calculate certification level based on confidence index
 */
export function calculateCertificationLevel(
  confidenceIndex: number
): 'gold' | 'certified' | 'verified' | 'basic' | 'unverified' {
  if (confidenceIndex >= 90) return 'gold';
  if (confidenceIndex >= 70) return 'certified';
  if (confidenceIndex >= 50) return 'verified';
  if (confidenceIndex >= 30) return 'basic';
  return 'unverified';
}

/**
 * Generate banker-friendly summary
 */
export function generateBankerSummary(analysis: Omit<ConfidenceAnalysis, 'banker_summary'>): string {
  const { confidence_index, certification_level, proof_breakdown, guarantor_bonus } = analysis;
  
  const parts: string[] = [];
  
  // Main confidence statement
  if (confidence_index >= 90) {
    parts.push(`✅ Score calculé avec ${proof_breakdown.hard_proof_percentage}% de données certifiées.`);
    parts.push('Prêt approuvable "les yeux fermés".');
  } else if (confidence_index >= 70) {
    parts.push(`✔️ Score basé sur ${proof_breakdown.hard_proof_percentage + proof_breakdown.soft_proof_percentage}% de preuves vérifiables.`);
    parts.push('Confiance élevée, vérification minimale recommandée.');
  } else if (confidence_index >= 50) {
    parts.push(`⚠️ ${proof_breakdown.declarative_percentage}% de données déclaratives.`);
    parts.push('Demander des justificatifs supplémentaires.');
  } else {
    parts.push(`🔴 Score majoritairement déclaratif (${proof_breakdown.declarative_percentage}%).`);
    parts.push('Exiger documentation complète avant décision.');
  }
  
  // Guarantor bonus
  if (guarantor_bonus.applied) {
    parts.push(`🏆 Bonus capital social: +${guarantor_bonus.bonus_percentage}% (garant certifié score ${guarantor_bonus.certified_guarantor_score}).`);
  }
  
  // Certification level
  parts.push(`Niveau de certification: ${certification_level.toUpperCase()}.`);
  
  return parts.join(' ');
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

export interface ConfidenceInputData {
  features: Record<string, number>;
  dataSources: string[];
  phoneTrustVerified: boolean;
  identityVerified: boolean;
  smsAnalyzed: boolean;
  ussdUploaded: boolean;
  userId?: string;
}

/**
 * Analyze features and calculate confidence index
 */
export async function analyzeConfidence(
  input: ConfidenceInputData
): Promise<ConfidenceAnalysis> {
  const featureProofs: DataSourceProof[] = [];
  let hardCount = 0;
  let softCount = 0;
  let declarativeCount = 0;
  
  // Analyze each feature
  for (const [featureId, value] of Object.entries(input.features)) {
    if (value === undefined || value === null) continue;
    
    const { proofType, isCertified } = determineProofType(featureId, input.dataSources);
    const coefficient = getProofCoefficient(proofType);
    
    // Upgrade proof type based on verified data
    let finalProofType = proofType;
    
    // If feature comes from SMS and SMS is verified, it's hard proof
    if (featureId.includes('income') && input.smsAnalyzed && input.phoneTrustVerified) {
      finalProofType = 'hard';
    }
    
    // If feature comes from USSD and phone is verified, it's soft proof (not declarative)
    if (featureId.includes('balance') && input.ussdUploaded && input.phoneTrustVerified) {
      finalProofType = 'soft';
    }
    
    const mapping = FEATURE_SOURCE_MAP[featureId];
    featureProofs.push({
      featureId,
      proofType: finalProofType,
      sourceTable: mapping?.table || 'declared',
      isCertified,
      coefficient: getProofCoefficient(finalProofType),
      details: `Valeur: ${value.toFixed(2)}`,
    });
    
    // Count by type
    switch (finalProofType) {
      case 'hard': hardCount++; break;
      case 'soft': softCount++; break;
      case 'declarative': declarativeCount++; break;
    }
  }
  
  const total = hardCount + softCount + declarativeCount;
  const hardPercentage = total > 0 ? Math.round((hardCount / total) * 100) : 0;
  const softPercentage = total > 0 ? Math.round((softCount / total) * 100) : 0;
  const declarativePercentage = total > 0 ? Math.round((declarativeCount / total) * 100) : 0;
  
  // Calculate confidence index (0-100)
  // Formula: (hard * 1.0 + soft * 0.7 + declarative * 0.3) / total * 100
  const weightedSum = (hardCount * HARD_PROOF_COEFFICIENT) + 
                      (softCount * SOFT_PROOF_COEFFICIENT) + 
                      (declarativeCount * DECLARATIVE_COEFFICIENT);
  let confidenceIndex = total > 0 ? Math.round((weightedSum / total) * 100) : 0;
  
  // Bonus for full verification path
  if (input.identityVerified && input.phoneTrustVerified && input.smsAnalyzed) {
    confidenceIndex = Math.min(100, confidenceIndex + 15);
  } else if (input.identityVerified && input.phoneTrustVerified) {
    confidenceIndex = Math.min(100, confidenceIndex + 10);
  } else if (input.identityVerified) {
    confidenceIndex = Math.min(100, confidenceIndex + 5);
  }
  
  // Check for certified guarantor bonus
  let guarantorBonus: ConfidenceAnalysis['guarantor_bonus'] = {
    applied: false,
    bonus_percentage: 0,
  };
  
  if (input.userId) {
    const guarantorCheck = await checkCertifiedGuarantor(input.userId);
    if (guarantorCheck.hasQualifiedGuarantor) {
      guarantorBonus = {
        applied: true,
        bonus_percentage: guarantorCheck.bonusPercentage,
        certified_guarantor_id: guarantorCheck.guarantorProfileId,
        certified_guarantor_score: guarantorCheck.guarantorScore,
      };
    }
  }
  
  const certificationLevel = calculateCertificationLevel(confidenceIndex);
  const highTrust = confidenceIndex >= 90;
  
  const analysis: Omit<ConfidenceAnalysis, 'banker_summary'> = {
    confidence_index: confidenceIndex,
    proof_breakdown: {
      hard_proof_count: hardCount,
      hard_proof_percentage: hardPercentage,
      soft_proof_count: softCount,
      soft_proof_percentage: softPercentage,
      declarative_count: declarativeCount,
      declarative_percentage: declarativePercentage,
    },
    feature_proofs: featureProofs,
    certification_level: certificationLevel,
    high_trust: highTrust,
    guarantor_bonus: guarantorBonus,
  };
  
  return {
    ...analysis,
    banker_summary: generateBankerSummary(analysis),
  };
}

/**
 * Apply confidence-weighted coefficients to features
 * Returns adjusted feature values and overall certainty
 */
export function applyConfidenceWeights(
  features: Record<string, number>,
  featureProofs: DataSourceProof[]
): {
  weightedFeatures: Record<string, number>;
  averageCertainty: number;
} {
  const proofMap = new Map(featureProofs.map(p => [p.featureId, p]));
  const weightedFeatures: Record<string, number> = {};
  let totalCoefficient = 0;
  let count = 0;
  
  for (const [featureId, value] of Object.entries(features)) {
    if (value === undefined || value === null) continue;
    
    const proof = proofMap.get(featureId);
    const coefficient = proof?.coefficient || DECLARATIVE_COEFFICIENT;
    
    weightedFeatures[featureId] = value * coefficient;
    totalCoefficient += coefficient;
    count++;
  }
  
  return {
    weightedFeatures,
    averageCertainty: count > 0 ? Math.round((totalCoefficient / count) * 100) : 0,
  };
}

/**
 * Apply guarantor bonus to final score
 * @param score Current score (0-100)
 * @param guarantorBonus Guarantor bonus info
 * @returns Adjusted score with bonus applied
 */
export function applyGuarantorBonus(
  score: number,
  guarantorBonus: ConfidenceAnalysis['guarantor_bonus']
): number {
  if (!guarantorBonus.applied) return score;
  
  const bonusMultiplier = 1 + (guarantorBonus.bonus_percentage / 100);
  return Math.min(100, Math.round(score * bonusMultiplier));
}
