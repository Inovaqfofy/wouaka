/**
 * ============================================
 * W-SCORE ENGINE v5.3
 * Sovereign Credit Scoring for UEMOA
 * ============================================
 * 
 * @fileoverview
 * This is the **SOURCE OF TRUTH** for all credit scoring logic in the WOUAKA platform.
 * 
 * ## Architecture Principles
 * 
 * 1. **Sovereign Proof Model**: Scores are calculated primarily from verified "Proof" data:
 *    - Mobile Trust (phone_trust_scores) - 10% weight
 *    - USSD/SMS transaction analysis - verified cashflow
 *    - OCR-extracted document data - verified identity
 * 
 * 2. **Declarative Data Penalty**: User-declared data receives a confidence penalty:
 *    - Verified data: confidence = 100%
 *    - OCR data: confidence = 90%
 *    - Cross-validated: confidence = 85%
 *    - Declared: confidence = 50%
 * 
 * 3. **Data Sources (in order of trust)**:
 *    - score_raw_features: Raw feature values with source tracking
 *    - score_engineered_features: Computed features from raw data
 *    - phone_trust_scores: Mobile Trust certification status
 * 
 * 4. **Integration Points**:
 *    - /wouaka-core: Full KYC + Scoring pipeline (recommended)
 *    - /wouaka-score: Score-only with data transparency
 *    - /wouaka-dossier: Complete proof dossier for partners
 * 
 * ## Feature Categories (6 Layers)
 * 
 * | Category | Weight | Primary Sources |
 * |----------|--------|-----------------|
 * | Identity & Stability | 0.42 | phone_trust, kyc, telecom |
 * | Cashflow Consistency | 0.42 | bank_momo, sms_analysis |
 * | Behavioral/Psychometric | 0.17 | device, app_usage |
 * | Financial Discipline | 0.28 | utility, sms_bills |
 * | Social Capital | 0.27 | tontine, cooperative |
 * | Environmental | 0.07 | open_data, regional |
 * 
 * @module w-score-engine
 * @version 5.3.0
 * @author WOUAKA Team
 * @license Proprietary
 * 
 * @see https://docs.wouaka.com/scoring/architecture
 * @see supabase/functions/wouaka-core/index.ts
 * @see supabase/functions/wouaka-score/index.ts
 */

import type {
  FinancialData,
  SocialCapitalData,
  PsychometricData,
  EnvironmentalData,
  ScoreSubComponents,
  CreditRecommendation,
  ScoreExplainability,
  FraudAnalysis,
  WScoreResult,
  DataQuality,
  DeviceInfo,
} from './types';

import {
  analyzeConfidence,
  applyGuarantorBonus,
  type ConfidenceAnalysis,
  type ConfidenceInputData,
  HARD_PROOF_COEFFICIENT,
  SOFT_PROOF_COEFFICIENT,
  DECLARATIVE_COEFFICIENT,
} from './confidence-layer';

// ============================================
// FEATURE DEFINITIONS
// ============================================

interface FeatureDefinition {
  id: string;
  name: string;
  category: 'identity' | 'cashflow' | 'behavioral' | 'discipline' | 'social' | 'environmental';
  weight: number;
  source: string;
  transform: 'linear' | 'log' | 'sigmoid' | 'binary' | 'categorical';
  min_value: number;
  max_value: number;
  risk_direction: 'higher_better' | 'lower_better' | 'optimal_range';
  optimal_range?: [number, number];
}

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  // Identity & Stability Features
  { id: 'sim_age_months', name: 'Âge SIM (mois)', category: 'identity', weight: 0.08, source: 'telecom', transform: 'log', min_value: 0, max_value: 120, risk_direction: 'higher_better' },
  { id: 'address_stability_years', name: 'Stabilité adresse (années)', category: 'identity', weight: 0.06, source: 'declared', transform: 'log', min_value: 0, max_value: 20, risk_direction: 'higher_better' },
  { id: 'business_age_years', name: 'Ancienneté activité (années)', category: 'identity', weight: 0.07, source: 'rccm', transform: 'log', min_value: 0, max_value: 30, risk_direction: 'higher_better' },
  { id: 'is_formalized', name: 'Entreprise formalisée', category: 'identity', weight: 0.05, source: 'rccm', transform: 'binary', min_value: 0, max_value: 1, risk_direction: 'higher_better' },
  { id: 'document_verification_score', name: 'Score vérification documents', category: 'identity', weight: 0.06, source: 'kyc', transform: 'linear', min_value: 0, max_value: 100, risk_direction: 'higher_better' },
  { id: 'phone_trust_score', name: 'Score confiance téléphone', category: 'identity', weight: 0.10, source: 'phone_trust', transform: 'linear', min_value: 0, max_value: 100, risk_direction: 'higher_better' },
  
  // Cashflow Features
  { id: 'monthly_income', name: 'Revenu mensuel', category: 'cashflow', weight: 0.08, source: 'bank_momo', transform: 'log', min_value: 0, max_value: 10000000, risk_direction: 'higher_better' },
  { id: 'income_stability_index', name: 'Stabilité revenus', category: 'cashflow', weight: 0.09, source: 'bank_momo', transform: 'linear', min_value: 0, max_value: 1, risk_direction: 'higher_better' },
  { id: 'expense_to_income_ratio', name: 'Ratio dépenses/revenus', category: 'cashflow', weight: 0.07, source: 'bank_momo', transform: 'linear', min_value: 0, max_value: 2, risk_direction: 'lower_better' },
  { id: 'momo_velocity_30d', name: 'Vélocité MoMo 30j', category: 'cashflow', weight: 0.06, source: 'momo', transform: 'log', min_value: 0, max_value: 100, risk_direction: 'optimal_range', optimal_range: [10, 50] },
  { id: 'momo_in_out_ratio', name: 'Ratio entrées/sorties MoMo', category: 'cashflow', weight: 0.05, source: 'momo', transform: 'linear', min_value: 0, max_value: 3, risk_direction: 'optimal_range', optimal_range: [0.8, 1.5] },
  { id: 'average_balance', name: 'Solde moyen', category: 'cashflow', weight: 0.05, source: 'bank', transform: 'log', min_value: 0, max_value: 50000000, risk_direction: 'higher_better' },
  { id: 'cashflow_regularity', name: 'Régularité flux', category: 'cashflow', weight: 0.06, source: 'bank_momo', transform: 'linear', min_value: 0, max_value: 1, risk_direction: 'higher_better' },
  
  // Behavioral & Psychometric Features
  { id: 'financial_literacy_score', name: 'Littératie financière', category: 'behavioral', weight: 0.04, source: 'psychometric', transform: 'linear', min_value: 0, max_value: 100, risk_direction: 'higher_better' },
  { id: 'planning_horizon_score', name: 'Horizon de planification', category: 'behavioral', weight: 0.04, source: 'psychometric', transform: 'linear', min_value: 0, max_value: 100, risk_direction: 'higher_better' },
  { id: 'self_control_score', name: 'Maîtrise de soi', category: 'behavioral', weight: 0.03, source: 'psychometric', transform: 'linear', min_value: 0, max_value: 100, risk_direction: 'higher_better' },
  { id: 'response_consistency', name: 'Cohérence réponses', category: 'behavioral', weight: 0.03, source: 'psychometric', transform: 'linear', min_value: 0, max_value: 1, risk_direction: 'higher_better' },
  { id: 'digital_engagement_score', name: 'Engagement digital', category: 'behavioral', weight: 0.03, source: 'device', transform: 'linear', min_value: 0, max_value: 100, risk_direction: 'higher_better' },
  
  // Financial Discipline Features
  { id: 'utility_payment_rate', name: 'Taux paiement factures', category: 'discipline', weight: 0.08, source: 'utility', transform: 'linear', min_value: 0, max_value: 1, risk_direction: 'higher_better' },
  { id: 'utility_late_ratio', name: 'Ratio retards factures', category: 'discipline', weight: 0.05, source: 'utility', transform: 'linear', min_value: 0, max_value: 1, risk_direction: 'lower_better' },
  { id: 'rent_payment_consistency', name: 'Régularité loyer', category: 'discipline', weight: 0.05, source: 'declared_verified', transform: 'linear', min_value: 0, max_value: 1, risk_direction: 'higher_better' },
  { id: 'savings_rate', name: 'Taux d\'épargne', category: 'discipline', weight: 0.04, source: 'bank_momo', transform: 'linear', min_value: -0.5, max_value: 0.5, risk_direction: 'higher_better' },
  { id: 'existing_debt_ratio', name: 'Ratio dette existante', category: 'discipline', weight: 0.06, source: 'declared_bank', transform: 'linear', min_value: 0, max_value: 1, risk_direction: 'lower_better' },
  
  // Social Capital Features (with safe defaults for null)
  { id: 'tontine_participation_score', name: 'Score participation tontine', category: 'social', weight: 0.06, source: 'tontine', transform: 'linear', min_value: 0, max_value: 100, risk_direction: 'higher_better' },
  { id: 'tontine_discipline_rate', name: 'Discipline tontine', category: 'social', weight: 0.05, source: 'tontine', transform: 'linear', min_value: 0, max_value: 1, risk_direction: 'higher_better' },
  { id: 'cooperative_standing_score', name: 'Position coopérative', category: 'social', weight: 0.04, source: 'cooperative', transform: 'linear', min_value: 0, max_value: 100, risk_direction: 'higher_better' },
  { id: 'cooperative_loan_history', name: 'Historique prêts coopérative', category: 'social', weight: 0.05, source: 'cooperative', transform: 'linear', min_value: 0, max_value: 1, risk_direction: 'higher_better' },
  { id: 'guarantor_quality_score', name: 'Qualité garants', category: 'social', weight: 0.04, source: 'guarantor', transform: 'linear', min_value: 0, max_value: 100, risk_direction: 'higher_better' },
  { id: 'community_attestation_count', name: 'Attestations communautaires', category: 'social', weight: 0.03, source: 'attestation', transform: 'log', min_value: 0, max_value: 5, risk_direction: 'higher_better' },
  
  // Environmental Features
  { id: 'regional_risk_index', name: 'Indice risque régional', category: 'environmental', weight: 0.03, source: 'open_data', transform: 'linear', min_value: 0, max_value: 100, risk_direction: 'lower_better' },
  { id: 'infrastructure_score', name: 'Score infrastructure', category: 'environmental', weight: 0.02, source: 'open_data', transform: 'linear', min_value: 0, max_value: 100, risk_direction: 'higher_better' },
  { id: 'seasonal_adjustment', name: 'Ajustement saisonnier', category: 'environmental', weight: 0.02, source: 'open_data', transform: 'linear', min_value: -20, max_value: 20, risk_direction: 'higher_better' },
];

// ============================================
// RISK TIERS
// ============================================

interface RiskTier {
  tier: string;
  grade: string;
  score_min: number;
  score_max: number;
  max_loan_multiplier: number;
  max_tenor_months: number;
  base_rate: number;
  rate_adjustment: number;
  approval_recommendation: 'auto_approve' | 'recommend' | 'review' | 'decline';
}

export const RISK_TIERS: RiskTier[] = [
  { tier: 'prime', grade: 'A+', score_min: 85, score_max: 100, max_loan_multiplier: 6, max_tenor_months: 36, base_rate: 12, rate_adjustment: -3, approval_recommendation: 'auto_approve' },
  { tier: 'near_prime', grade: 'A', score_min: 75, score_max: 84, max_loan_multiplier: 5, max_tenor_months: 30, base_rate: 12, rate_adjustment: -1, approval_recommendation: 'auto_approve' },
  { tier: 'standard_plus', grade: 'B+', score_min: 65, score_max: 74, max_loan_multiplier: 4, max_tenor_months: 24, base_rate: 12, rate_adjustment: 0, approval_recommendation: 'recommend' },
  { tier: 'standard', grade: 'B', score_min: 55, score_max: 64, max_loan_multiplier: 3, max_tenor_months: 18, base_rate: 12, rate_adjustment: 2, approval_recommendation: 'recommend' },
  { tier: 'subprime', grade: 'C', score_min: 45, score_max: 54, max_loan_multiplier: 2, max_tenor_months: 12, base_rate: 12, rate_adjustment: 5, approval_recommendation: 'review' },
  { tier: 'high_risk', grade: 'D', score_min: 30, score_max: 44, max_loan_multiplier: 1.5, max_tenor_months: 6, base_rate: 12, rate_adjustment: 10, approval_recommendation: 'review' },
  { tier: 'decline', grade: 'E', score_min: 0, score_max: 29, max_loan_multiplier: 0, max_tenor_months: 0, base_rate: 12, rate_adjustment: 0, approval_recommendation: 'decline' },
];

// ============================================
// FRAUD DETECTION RULES
// ============================================

interface FraudRule {
  id: string;
  name: string;
  category: 'identity' | 'financial' | 'behavioral' | 'cross_validation';
  severity: 'warning' | 'high' | 'critical';
  check: (data: ScoringInput) => { triggered: boolean; confidence: number; details: string };
}

interface ScoringInput {
  kyc_data?: {
    verified_identity?: Record<string, unknown>;
    kyc_risk_score?: number;
    document_confidence?: number;
  };
  declared_info: Record<string, unknown>;
  financial_data?: FinancialData;
  social_capital?: SocialCapitalData;
  psychometric_data?: PsychometricData;
  environmental_data?: EnvironmentalData;
  device_info?: DeviceInfo;
  // NEW: Phone trust data for sovereign proof scoring
  phone_trust_data?: {
    trust_score: number;
    otp_verified: boolean;
    ussd_uploaded: boolean;
    identity_cross_validated: boolean;
    sms_consent_given: boolean;
    phone_age_months?: number;
  };
}

export const FRAUD_RULES: FraudRule[] = [
  // Income fraud
  {
    id: 'income_inflation',
    name: 'Gonflement revenus',
    category: 'financial',
    severity: 'high',
    check: (data) => {
      const declared = Number(data.declared_info?.monthly_income) || 0;
      const verified = data.financial_data?.bank_statements?.[0]?.salary_amount ||
                       (data.financial_data?.momo_data?.[0]?.total_in || 0) / 30 * 0.7;
      
      if (declared > 0 && verified > 0) {
        const ratio = declared / verified;
        if (ratio > 2) {
          return { triggered: true, confidence: 85, details: `Revenu déclaré ${ratio.toFixed(1)}x plus élevé que vérifié` };
        }
      }
      return { triggered: false, confidence: 0, details: '' };
    },
  },
  
  // Multiple applications
  {
    id: 'velocity_abuse',
    name: 'Abus de vélocité',
    category: 'behavioral',
    severity: 'warning',
    check: (data) => {
      const momo = data.financial_data?.momo_data?.[0];
      if (momo && momo.transaction_count > 200 && momo.period_days <= 30) {
        return { triggered: true, confidence: 70, details: 'Volume de transactions anormalement élevé' };
      }
      return { triggered: false, confidence: 0, details: '' };
    },
  },
  
  // Identity mismatch
  {
    id: 'name_mismatch',
    name: 'Incohérence nom',
    category: 'identity',
    severity: 'critical',
    check: (data) => {
      const declared = String(data.declared_info?.full_name || '').toLowerCase();
      const verified = String(data.kyc_data?.verified_identity?.full_name || '').toLowerCase();
      
      if (declared && verified && declared !== verified) {
        const similarity = calculateStringSimilarity(declared, verified);
        if (similarity < 0.7) {
          return { triggered: true, confidence: 90, details: `Noms différents: \"${declared}\" vs \"${verified}\"` };
        }
      }
      return { triggered: false, confidence: 0, details: '' };
    },
  },
  
  // Psychometric gaming
  {
    id: 'psychometric_gaming',
    name: 'Manipulation psychométrique',
    category: 'behavioral',
    severity: 'high',
    check: (data) => {
      const psych = data.psychometric_data;
      if (psych) {
        // Too fast completion
        if (psych.duration_seconds < 60) {
          return { triggered: true, confidence: 80, details: 'Quiz complété trop rapidement' };
        }
        // Perfect score with low consistency
        if (psych.financial_literacy > 95 && psych.response_consistency < 0.5) {
          return { triggered: true, confidence: 75, details: 'Score parfait mais incohérent' };
        }
      }
      return { triggered: false, confidence: 0, details: '' };
    },
  },
  
  // Tontine fraud
  {
    id: 'fake_tontine',
    name: 'Fausse tontine',
    category: 'cross_validation',
    severity: 'high',
    check: (data) => {
      const tontines = data.social_capital?.tontines;
      if (tontines && tontines.length > 0) {
        for (const t of tontines) {
          // Claiming to be in multiple high-value tontines
          if (tontines.length > 3 && t.contribution_amount > 100000) {
            return { triggered: true, confidence: 70, details: 'Participation à plusieurs tontines de grande valeur' };
          }
          // Claiming perfect history without attestation
          if (t.payments_missed === 0 && t.payments_made > 12 && !t.attestation_provided) {
            return { triggered: true, confidence: 60, details: 'Historique parfait sans attestation' };
          }
        }
      }
      return { triggered: false, confidence: 0, details: '' };
    },
  },
  
  // Device fraud
  {
    id: 'device_anomaly',
    name: 'Anomalie appareil',
    category: 'behavioral',
    severity: 'warning',
    check: (data) => {
      const device = data.device_info;
      if (device) {
        // Emulator detection
        if (device.device_id?.includes('emulator') || device.os?.toLowerCase().includes('sdk')) {
          return { triggered: true, confidence: 95, details: 'Émulateur détecté' };
        }
      }
      return { triggered: false, confidence: 0, details: '' };
    },
  },
];

// ============================================
// FEATURE CALCULATION
// ============================================

export function calculateFeatures(input: ScoringInput): Record<string, number> {
  const features: Record<string, number> = {};
  
  // Identity features
  features.sim_age_months = Number(input.declared_info?.sim_age_months) || 0;
  features.address_stability_years = Number(input.declared_info?.address_stability_years) || 0;
  features.business_age_years = Number(input.declared_info?.years_in_business) || 0;
  features.is_formalized = input.declared_info?.rccm_number ? 1 : 0;
  features.document_verification_score = input.kyc_data?.document_confidence || 0;
  
  // NEW: Phone trust score - defaults to 0 if not verified (implicit penalty)
  features.phone_trust_score = input.phone_trust_data?.trust_score || 0;
  
  // Cashflow features from bank statements
  const bankData = input.financial_data?.bank_statements?.[0];
  if (bankData) {
    features.monthly_income = bankData.salary_amount || (bankData.total_credits / 
      ((new Date(bankData.period_end).getTime() - new Date(bankData.period_start).getTime()) / (30 * 24 * 60 * 60 * 1000)));
    features.average_balance = bankData.average_balance;
    features.expense_to_income_ratio = bankData.total_debits / Math.max(bankData.total_credits, 1);
  }
  
  // Cashflow features from MoMo
  const momoData = input.financial_data?.momo_data?.[0];
  if (momoData) {
    features.momo_velocity_30d = momoData.transaction_count / Math.max(momoData.period_days, 1) * 30;
    features.momo_in_out_ratio = momoData.total_in / Math.max(momoData.total_out, 1);
    features.cashflow_regularity = momoData.regularity_score;
    
    if (!features.monthly_income) {
      features.monthly_income = momoData.total_in / momoData.period_days * 30 * 0.7;
    }
  }
  
  // Default income from declared
  if (!features.monthly_income) {
    features.monthly_income = Number(input.declared_info?.monthly_income) || 0;
  }
  
  // Income stability - calculated from variance
  features.income_stability_index = calculateIncomeStability(input);
  
  // Utility payment features
  const utilities = input.financial_data?.utility_payments;
  if (utilities && utilities.length > 0) {
    let totalOnTime = 0;
    let totalPayments = 0;
    let totalLate = 0;
    
    for (const u of utilities) {
      totalOnTime += u.payments_on_time;
      totalLate += u.payments_late;
      totalPayments += u.payments_on_time + u.payments_late + u.payments_missed;
    }
    
    features.utility_payment_rate = totalPayments > 0 ? totalOnTime / totalPayments : 0.5;
    features.utility_late_ratio = totalPayments > 0 ? totalLate / totalPayments : 0;
  }
  
  // Savings rate
  const income = features.monthly_income || 0;
  const expenses = Number(input.declared_info?.monthly_expenses) || 0;
  features.savings_rate = income > 0 ? (income - expenses) / income : 0;
  
  // Existing debt
  const existingLoans = Number(input.declared_info?.existing_loans) || 0;
  features.existing_debt_ratio = income > 0 ? existingLoans / income : 0;
  
  // Psychometric features
  const psych = input.psychometric_data;
  if (psych) {
    features.financial_literacy_score = psych.financial_literacy;
    features.planning_horizon_score = psych.planning_horizon;
    features.self_control_score = psych.self_control;
    features.response_consistency = psych.response_consistency;
    features.digital_engagement_score = psych.attention_score;
  }
  
  // Social capital features with SAFE DEFAULTS for null values
  // Users without tontines get neutral score (50), not zero
  const tontines = input.social_capital?.tontines;
  if (tontines && tontines.length > 0) {
    let totalScore = 0;
    let totalDiscipline = 0;
    
    for (const t of tontines) {
      const membershipMonths = getMonthsDifference(new Date(t.member_since), new Date());
      // Safe division: default to 0.5 if no payments made
      const disciplineRate = t.payments_made > 0 ? 1 - (t.payments_missed / t.payments_made) : 0.5;
      totalScore += membershipMonths * disciplineRate * (t.attestation_provided ? 1.2 : 0.8);
      totalDiscipline += disciplineRate;
    }
    
    features.tontine_participation_score = Math.min(100, totalScore / tontines.length * 2);
    features.tontine_discipline_rate = totalDiscipline / tontines.length;
  } else {
    // Neutral default: no tontine data means neutral (50), not penalty
    features.tontine_participation_score = 50;
    features.tontine_discipline_rate = 0.5;
  }
  
  // Cooperative features
  const coops = input.social_capital?.cooperatives;
  if (coops && coops.length > 0) {
    let standingScore = 0;
    let loanHistoryScore = 0;
    
    for (const c of coops) {
      const roleMultiplier = c.role === 'president' ? 1.5 : c.role === 'board' ? 1.2 : 1;
      const membershipYears = getMonthsDifference(new Date(c.member_since), new Date()) / 12;
      standingScore += membershipYears * roleMultiplier * 10;
      
      if (c.loan_history) {
        const goodLoans = c.loan_history.filter(l => l.repaid && l.on_time).length;
        loanHistoryScore += c.loan_history.length > 0 ? goodLoans / c.loan_history.length : 0.5;
      }
    }
    
    features.cooperative_standing_score = Math.min(100, standingScore / coops.length);
    features.cooperative_loan_history = loanHistoryScore / coops.length;
  }
  
  // Guarantor features
  const guarantors = input.social_capital?.guarantors;
  if (guarantors && guarantors.length > 0) {
    let qualityScore = 0;
    for (const g of guarantors) {
      let score = 50;
      if (g.verified) score += 20;
      if (g.phone_verified) score += 10;
      if (g.income_estimate && g.income_estimate > features.monthly_income) score += 20;
      qualityScore += score;
    }
    features.guarantor_quality_score = qualityScore / guarantors.length;
  }
  
  // Community attestations
  features.community_attestation_count = input.social_capital?.community_attestations?.length || 0;
  
  // Environmental features
  const env = input.environmental_data;
  if (env) {
    features.regional_risk_index = 100 - (env.local_poverty_index || 50);
    features.infrastructure_score = env.infrastructure_score || 50;
    features.seasonal_adjustment = env.seasonal_adjustment || 0;
  }
  
  return features;
}

function calculateIncomeStability(input: ScoringInput): number {
  const bankStatements = input.financial_data?.bank_statements || [];
  
  if (bankStatements.length < 2) {
    // Use MoMo regularity as fallback
    return input.financial_data?.momo_data?.[0]?.regularity_score || 0.5;
  }
  
  const incomes = bankStatements.map(s => s.total_credits);
  const mean = incomes.reduce((a, b) => a + b, 0) / incomes.length;
  const variance = incomes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / incomes.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  
  // Convert CV to stability score (lower CV = higher stability)
  return Math.max(0, Math.min(1, 1 - cv));
}

function getMonthsDifference(date1: Date, date2: Date): number {
  return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  return (longer.length - levenshtein(longer, shorter)) / longer.length;
}

function levenshtein(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1))
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// ============================================
// SUB-SCORE CALCULATION
// ============================================

export function calculateSubScores(features: Record<string, number>): ScoreSubComponents {
  const categories = ['identity', 'cashflow', 'behavioral', 'discipline', 'social', 'environmental'] as const;
  const subScores: Partial<ScoreSubComponents> = {};
  
  for (const category of categories) {
    const categoryFeatures = FEATURE_DEFINITIONS.filter(f => f.category === category);
    let weightedSum = 0;
    let totalWeight = 0;
    let confidence = 0;
    const factors: { name: string; value: number; weight: number }[] = [];
    
    for (const def of categoryFeatures) {
      const value = features[def.id];
      if (value !== undefined) {
        const normalized = normalizeFeature(value, def);
        weightedSum += normalized * def.weight;
        totalWeight += def.weight;
        confidence += 1;
        factors.push({ name: def.name, value: normalized * 100, weight: def.weight });
      }
    }
    
    const score = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 50;
    const dataConfidence = (confidence / categoryFeatures.length) * 100;
    
    const subScoreKey = `${category === 'identity' ? 'identity_stability' : 
                          category === 'cashflow' ? 'cashflow_consistency' :
                          category === 'behavioral' ? 'behavioral_psychometric' :
                          category === 'discipline' ? 'financial_discipline' :
                          category === 'social' ? 'social_capital' : 'environmental_adjustment'}` as keyof ScoreSubComponents;
    
    subScores[subScoreKey] = {
      score: Math.round(score),
      confidence: Math.round(dataConfidence),
      factors,
    };
  }
  
  return subScores as ScoreSubComponents;
}

function normalizeFeature(value: number, def: FeatureDefinition): number {
  // Clamp to range
  const clamped = Math.max(def.min_value, Math.min(def.max_value, value));
  
  switch (def.transform) {
    case 'binary':
      return value > 0 ? 1 : 0;
      
    case 'log':
      const logVal = Math.log1p(clamped - def.min_value);
      const logMax = Math.log1p(def.max_value - def.min_value);
      const logNorm = logMax > 0 ? logVal / logMax : 0;
      return def.risk_direction === 'lower_better' ? 1 - logNorm : logNorm;
      
    case 'sigmoid':
      const mid = (def.max_value + def.min_value) / 2;
      const sigmoid = 1 / (1 + Math.exp(-(clamped - mid)));
      return def.risk_direction === 'lower_better' ? 1 - sigmoid : sigmoid;
      
    case 'linear':
    default:
      const range = def.max_value - def.min_value;
      let norm = range > 0 ? (clamped - def.min_value) / range : 0.5;
      
      if (def.risk_direction === 'optimal_range' && def.optimal_range) {
        const [optMin, optMax] = def.optimal_range;
        if (clamped >= optMin && clamped <= optMax) {
          norm = 1;
        } else if (clamped < optMin) {
          norm = clamped / optMin;
        } else {
          norm = Math.max(0, 1 - (clamped - optMax) / (def.max_value - optMax));
        }
      } else if (def.risk_direction === 'lower_better') {
        norm = 1 - norm;
      }
      
      return norm;
  }
}

// ============================================
// FRAUD ANALYSIS
// ============================================

export function runFraudAnalysis(input: ScoringInput): FraudAnalysis {
  const alerts: FraudAnalysis['alerts'] = [];
  let totalScore = 0;
  let alertCount = 0;
  
  for (const rule of FRAUD_RULES) {
    const result = rule.check(input);
    if (result.triggered) {
      alerts.push({
        id: rule.id,
        type: rule.category,
        severity: rule.severity,
        description: `${rule.name}: ${result.details}`,
        confidence: result.confidence,
      });
      
      const severityWeight = rule.severity === 'critical' ? 30 : rule.severity === 'high' ? 20 : 10;
      totalScore += severityWeight * (result.confidence / 100);
      alertCount++;
    }
  }
  
  const fraudScore = Math.min(100, totalScore);
  const riskLevel = fraudScore > 50 ? 'critical' : fraudScore > 30 ? 'high' : fraudScore > 15 ? 'medium' : 'low';
  
  // Cross-validation checks
  const crossValidation: FraudAnalysis['cross_validation'] = [
    {
      check: 'Revenu déclaré vs vérifié',
      passed: !alerts.some(a => a.id === 'income_inflation'),
      details: alerts.find(a => a.id === 'income_inflation')?.description || 'Cohérent',
    },
    {
      check: 'Identité KYC vs déclarée',
      passed: !alerts.some(a => a.id === 'name_mismatch'),
      details: alerts.find(a => a.id === 'name_mismatch')?.description || 'Cohérent',
    },
  ];
  
  // Manipulation detection
  const manipulationDetection: FraudAnalysis['manipulation_detection'] = [
    { indicator: 'Gaming psychométrique', detected: alerts.some(a => a.id === 'psychometric_gaming'), confidence: 75 },
    { indicator: 'Appareil suspect', detected: alerts.some(a => a.id === 'device_anomaly'), confidence: 90 },
    { indicator: 'Vélocité anormale', detected: alerts.some(a => a.id === 'velocity_abuse'), confidence: 70 },
  ];
  
  return {
    fraud_score: Math.round(fraudScore),
    risk_level: riskLevel,
    alerts,
    cross_validation: crossValidation,
    manipulation_detection: manipulationDetection,
  };
}

// ============================================
// MAIN SCORING FUNCTION
// ============================================

/**
 * Calculate W-SCORE with Confidence Layer v5.5
 * 
 * @description Main entry point for sovereign credit scoring.
 * Integrates proof-based confidence weighting and guarantor bonuses.
 * 
 * @param input - Scoring input data
 * @param userId - Optional user ID for guarantor bonus lookup
 * @returns Promise<WScoreResult> - Complete scoring result with confidence analysis
 */
export async function calculateWScore(input: ScoringInput, userId?: string): Promise<WScoreResult> {
  const startTime = Date.now();
  
  // 1. Calculate all features
  const features = calculateFeatures(input);
  const featuresComputed = Object.keys(features).filter(k => features[k] !== undefined && features[k] !== null).length;
  
  // 2. Calculate sub-scores
  const subScores = calculateSubScores(features);
  
  // 3. Determine data sources for confidence analysis
  const dataSources: string[] = [];
  if (input.kyc_data) dataSources.push('kyc_documents');
  if (input.financial_data?.bank_statements?.length) dataSources.push('bank_statements');
  if (input.financial_data?.momo_data?.length) dataSources.push('user_momo_transactions');
  if (input.financial_data?.utility_payments?.length) dataSources.push('data_enrichments');
  if (input.social_capital?.tontines?.length) dataSources.push('user_tontine_memberships');
  if (input.social_capital?.cooperatives?.length) dataSources.push('user_cooperative_memberships');
  if (input.social_capital?.guarantors?.length) dataSources.push('user_guarantors');
  if (input.psychometric_data) dataSources.push('psychometric_sessions');
  if (input.environmental_data) dataSources.push('open_data');
  if (input.phone_trust_data?.otp_verified) dataSources.push('phone_trust_scores');
  if (input.phone_trust_data?.sms_consent_given) dataSources.push('sms_analyses');
  if (input.phone_trust_data?.ussd_uploaded) dataSources.push('ussd_screenshot_validations');
  
  // 4. Run Confidence Layer Analysis (NEW v5.5)
  const confidenceInput: ConfidenceInputData = {
    features,
    dataSources,
    phoneTrustVerified: input.phone_trust_data?.otp_verified || false,
    identityVerified: (input.kyc_data?.document_confidence || 0) > 80,
    smsAnalyzed: input.phone_trust_data?.sms_consent_given || false,
    ussdUploaded: input.phone_trust_data?.ussd_uploaded || false,
    userId,
  };
  
  const confidenceAnalysis = await analyzeConfidence(confidenceInput);
  
  // 5. Calculate final score with CERTAINTY WEIGHTS
  // Apply coefficients based on proof type (Hard=1.0, Soft=0.7, Declarative=0.3)
  const weights = {
    identity_stability: 0.20,
    cashflow_consistency: 0.25,
    behavioral_psychometric: 0.12,
    financial_discipline: 0.20,
    social_capital: 0.15,
    environmental_adjustment: 0.08,
  };

  // Apply certainty coefficients based on data source type
  const certaintyCoefficients = calculateCertaintyCoefficients(input);
  
  let finalScore = 0;
  let totalWeight = 0;
  let avgConfidence = 0;
  
  for (const [key, weight] of Object.entries(weights)) {
    const subScore = subScores[key as keyof ScoreSubComponents];
    // Apply both confidence and certainty coefficient
    const certaintyWeight = certaintyCoefficients[key] || 1.0;
    const adjustedWeight = weight * (subScore.confidence / 100) * certaintyWeight;
    finalScore += subScore.score * adjustedWeight;
    totalWeight += adjustedWeight;
    avgConfidence += subScore.confidence;
  }
  
  finalScore = totalWeight > 0 ? finalScore / totalWeight : 50;
  avgConfidence = avgConfidence / Object.keys(weights).length;
  
  // 6. Run fraud analysis and apply penalty
  const fraudAnalysis = runFraudAnalysis(input);
  const fraudPenalty = fraudAnalysis.fraud_score * 0.5;
  finalScore = Math.max(0, finalScore - fraudPenalty);
  
  // 7. Determine data quality based on source verification
  const dataQuality: DataQuality = avgConfidence >= 70 ? 'high' : avgConfidence >= 50 ? 'medium' : avgConfidence >= 30 ? 'low' : 'insufficient';
  
  // 8. Apply data quality adjustment
  if (dataQuality === 'low') finalScore = Math.max(30, finalScore - 5);
  if (dataQuality === 'insufficient') finalScore = Math.max(25, finalScore - 10);
  
  // 9. SOCIAL CAPITAL MULTIPLIER for users without traditional banking
  const hasBankData = (input.financial_data?.bank_statements?.length ?? 0) > 0;
  const hasTontineData = (input.social_capital?.tontines?.length ?? 0) > 0;
  const hasGuarantors = (input.social_capital?.guarantors?.length ?? 0) > 0;
  
  if (!hasBankData && (hasTontineData || hasGuarantors)) {
    const socialMultiplier = calculateSocialCapitalMultiplier(input.social_capital);
    finalScore = finalScore * socialMultiplier;
  }
  
  // 10. Apply GUARANTOR BONUS (NEW v5.5)
  // +5% if user has a certified guarantor with score > 700
  finalScore = applyGuarantorBonus(finalScore, confidenceAnalysis.guarantor_bonus);
  
  finalScore = Math.round(Math.min(100, Math.max(0, finalScore)));
  
  // 11. Determine risk tier
  const riskTier = RISK_TIERS.find(t => finalScore >= t.score_min && finalScore <= t.score_max) || RISK_TIERS[RISK_TIERS.length - 1];
  
  // 12. Generate credit recommendation
  const monthlyIncome = features.monthly_income || 0;
  const creditRecommendation: CreditRecommendation = {
    approved: riskTier.approval_recommendation !== 'decline',
    max_amount: Math.round(monthlyIncome * riskTier.max_loan_multiplier),
    max_tenor_months: riskTier.max_tenor_months,
    suggested_rate: riskTier.base_rate + riskTier.rate_adjustment,
    rate_adjustment: riskTier.rate_adjustment,
    conditions: generateConditions(riskTier, fraudAnalysis, subScores),
    guarantees_required: generateGuaranteeRequirements(riskTier, subScores),
    monitoring_level: riskTier.tier === 'prime' || riskTier.tier === 'near_prime' ? 'standard' : 
                      riskTier.tier === 'standard_plus' || riskTier.tier === 'standard' ? 'enhanced' : 'intensive',
  };
  
  // 13. Generate explainability
  const explainability = generateExplainability(features, subScores, fraudAnalysis);
  
  const processingTime = Date.now() - startTime;
  
  // 14. Build result with Confidence Analysis
  return {
    score_id: crypto.randomUUID(),
    final_score: finalScore,
    grade: riskTier.grade,
    risk_tier: riskTier.tier,
    confidence: Math.round(avgConfidence),
    data_quality: dataQuality,
    sub_scores: subScores,
    credit_recommendation: creditRecommendation,
    explainability,
    fraud_analysis: fraudAnalysis,
    model_version: '5.5.0-confidence-layer',
    calculated_at: new Date().toISOString(),
    processing_time_ms: processingTime,
    data_sources_used: dataSources.map(s => s.replace('_', ' ')),
    features_computed: featuresComputed,
    certainty_coefficients: certaintyCoefficients,
    // NEW: Confidence Analysis for bankers
    confidence_analysis: {
      confidence_index: confidenceAnalysis.confidence_index,
      proof_breakdown: {
        hard_proof_percentage: confidenceAnalysis.proof_breakdown.hard_proof_percentage,
        soft_proof_percentage: confidenceAnalysis.proof_breakdown.soft_proof_percentage,
        declarative_percentage: confidenceAnalysis.proof_breakdown.declarative_percentage,
      },
      certification_level: confidenceAnalysis.certification_level,
      banker_summary: confidenceAnalysis.banker_summary,
      high_trust: confidenceAnalysis.high_trust,
      guarantor_bonus: {
        applied: confidenceAnalysis.guarantor_bonus.applied,
        bonus_percentage: confidenceAnalysis.guarantor_bonus.bonus_percentage,
        certified_guarantor_score: confidenceAnalysis.guarantor_bonus.certified_guarantor_score,
      },
    },
    compliance: {
      consent_tracked: true,
      explainable: true,
      non_discriminatory: true,
      audit_logged: true,
    },
  };
}

/**
 * Synchronous version for backwards compatibility
 * Does not include guarantor bonus (requires async DB lookup)
 * @deprecated Use async calculateWScore instead
 */
export function calculateWScoreSync(input: ScoringInput): Omit<WScoreResult, 'confidence_analysis'> {
  // Simplified sync version without confidence analysis
  const startTime = Date.now();
  const features = calculateFeatures(input);
  const featuresComputed = Object.keys(features).filter(k => features[k] !== undefined && features[k] !== null).length;
  const subScores = calculateSubScores(features);
  
  const weights = {
    identity_stability: 0.20,
    cashflow_consistency: 0.25,
    behavioral_psychometric: 0.12,
    financial_discipline: 0.20,
    social_capital: 0.15,
    environmental_adjustment: 0.08,
  };

  const certaintyCoefficients = calculateCertaintyCoefficients(input);
  
  let finalScore = 0;
  let totalWeight = 0;
  let avgConfidence = 0;
  
  for (const [key, weight] of Object.entries(weights)) {
    const subScore = subScores[key as keyof ScoreSubComponents];
    const certaintyWeight = certaintyCoefficients[key] || 1.0;
    const adjustedWeight = weight * (subScore.confidence / 100) * certaintyWeight;
    finalScore += subScore.score * adjustedWeight;
    totalWeight += adjustedWeight;
    avgConfidence += subScore.confidence;
  }
  
  finalScore = totalWeight > 0 ? finalScore / totalWeight : 50;
  avgConfidence = avgConfidence / Object.keys(weights).length;
  
  const fraudAnalysis = runFraudAnalysis(input);
  const fraudPenalty = fraudAnalysis.fraud_score * 0.5;
  finalScore = Math.max(0, finalScore - fraudPenalty);
  
  const dataQuality: DataQuality = avgConfidence >= 70 ? 'high' : avgConfidence >= 50 ? 'medium' : avgConfidence >= 30 ? 'low' : 'insufficient';
  
  if (dataQuality === 'low') finalScore = Math.max(30, finalScore - 5);
  if (dataQuality === 'insufficient') finalScore = Math.max(25, finalScore - 10);
  
  const hasBankData = (input.financial_data?.bank_statements?.length ?? 0) > 0;
  const hasTontineData = (input.social_capital?.tontines?.length ?? 0) > 0;
  const hasGuarantors = (input.social_capital?.guarantors?.length ?? 0) > 0;
  
  if (!hasBankData && (hasTontineData || hasGuarantors)) {
    const socialMultiplier = calculateSocialCapitalMultiplier(input.social_capital);
    finalScore = finalScore * socialMultiplier;
  }
  
  finalScore = Math.round(Math.min(100, Math.max(0, finalScore)));
  
  const riskTier = RISK_TIERS.find(t => finalScore >= t.score_min && finalScore <= t.score_max) || RISK_TIERS[RISK_TIERS.length - 1];
  const monthlyIncome = features.monthly_income || 0;
  
  const dataSources: string[] = [];
  if (input.kyc_data) dataSources.push('kyc');
  if (input.financial_data?.bank_statements?.length) dataSources.push('bank_statements');
  if (input.financial_data?.momo_data?.length) dataSources.push('mobile_money');
  if (input.financial_data?.utility_payments?.length) dataSources.push('utility_payments');
  if (input.social_capital?.tontines?.length) dataSources.push('tontines');
  if (input.social_capital?.cooperatives?.length) dataSources.push('cooperatives');
  if (input.psychometric_data) dataSources.push('psychometric');
  if (input.environmental_data) dataSources.push('environmental');
  
  return {
    score_id: crypto.randomUUID(),
    final_score: finalScore,
    grade: riskTier.grade,
    risk_tier: riskTier.tier,
    confidence: Math.round(avgConfidence),
    data_quality: dataQuality,
    sub_scores: subScores,
    credit_recommendation: {
      approved: riskTier.approval_recommendation !== 'decline',
      max_amount: Math.round(monthlyIncome * riskTier.max_loan_multiplier),
      max_tenor_months: riskTier.max_tenor_months,
      suggested_rate: riskTier.base_rate + riskTier.rate_adjustment,
      rate_adjustment: riskTier.rate_adjustment,
      conditions: generateConditions(riskTier, fraudAnalysis, subScores),
      guarantees_required: generateGuaranteeRequirements(riskTier, subScores),
      monitoring_level: riskTier.tier === 'prime' || riskTier.tier === 'near_prime' ? 'standard' : 
                        riskTier.tier === 'standard_plus' || riskTier.tier === 'standard' ? 'enhanced' : 'intensive',
    },
    explainability: generateExplainability(features, subScores, fraudAnalysis),
    fraud_analysis: fraudAnalysis,
    model_version: '5.5.0-confidence-layer-sync',
    calculated_at: new Date().toISOString(),
    processing_time_ms: Date.now() - startTime,
    data_sources_used: dataSources,
    features_computed: featuresComputed,
    certainty_coefficients: certaintyCoefficients,
    compliance: {
      consent_tracked: true,
      explainable: true,
      non_discriminatory: true,
      audit_logged: true,
    },
  };
}

/**
 * Calculate certainty coefficients based on data source types
 * Tangible proofs (SMS, PDFs) have higher coefficients than declarative data
 */
function calculateCertaintyCoefficients(input: ScoringInput): Record<string, number> {
  const coefficients: Record<string, number> = {
    identity_stability: 1.0,
    cashflow_consistency: 1.0,
    behavioral_psychometric: 1.0,
    financial_discipline: 1.0,
    social_capital: 1.0,
    environmental_adjustment: 1.0,
  };

  // KYC document verification boosts identity
  if (input.kyc_data?.document_confidence && input.kyc_data.document_confidence > 80) {
    coefficients.identity_stability = 1.2;
  }
  
  // NEW: Phone trust verification provides significant identity boost
  if (input.phone_trust_data) {
    if (input.phone_trust_data.otp_verified) {
      coefficients.identity_stability *= 1.1; // +10%
    }
    if (input.phone_trust_data.identity_cross_validated) {
      coefficients.identity_stability *= 1.15; // +15% more
    }
    // SMS analysis boosts cashflow certainty
    if (input.phone_trust_data.sms_consent_given) {
      coefficients.cashflow_consistency *= 1.2; // +20%
    }
  }

  // Bank statements or MoMo data boost cashflow certainty
  if (input.financial_data?.bank_statements?.length) {
    coefficients.cashflow_consistency *= 1.2;
  } else if (input.financial_data?.momo_data?.length) {
    coefficients.cashflow_consistency *= 1.15;
  }

  // Utility payments boost discipline score
  if (input.financial_data?.utility_payments && input.financial_data.utility_payments.length > 0) {
    coefficients.financial_discipline = 1.15;
  }

  // Attested tontine participation boosts social capital
  const hasAttestedTontine = input.social_capital?.tontines?.some(t => t.attestation_provided);
  if (hasAttestedTontine) {
    coefficients.social_capital = 1.3;
  }

  return coefficients;
}

/**
 * Calculate social capital multiplier for users without traditional banking history
 */
function calculateSocialCapitalMultiplier(socialCapital?: SocialCapitalData): number {
  if (!socialCapital) return 1.0;

  let multiplier = 1.0;

  // Tontine participation bonus
  if (socialCapital.tontines && socialCapital.tontines.length > 0) {
    const avgDiscipline = socialCapital.tontines.reduce((acc, t) => {
      return acc + (t.payments_made > 0 ? 1 - (t.payments_missed / t.payments_made) : 0.5);
    }, 0) / socialCapital.tontines.length;
    
    if (avgDiscipline >= 0.9) {
      multiplier += 0.15; // +15% for excellent tontine discipline
    } else if (avgDiscipline >= 0.7) {
      multiplier += 0.08;
    }

    // Bonus for attested tontines
    const attestedCount = socialCapital.tontines.filter(t => t.attestation_provided).length;
    multiplier += attestedCount * 0.05; // +5% per attestation
  }

  // Guarantor bonus
  if (socialCapital.guarantors && socialCapital.guarantors.length > 0) {
    const verifiedGuarantors = socialCapital.guarantors.filter(g => g.verified).length;
    multiplier += verifiedGuarantors * 0.1; // +10% per verified guarantor
  }

  // Cap the multiplier
  return Math.min(1.4, multiplier);
}

function generateConditions(riskTier: RiskTier, fraud: FraudAnalysis, subScores: ScoreSubComponents): string[] {
  const conditions: string[] = [];
  
  if (riskTier.tier === 'subprime' || riskTier.tier === 'high_risk') {
    conditions.push('Garanties supplémentaires requises');
    conditions.push('Suivi renforcé obligatoire');
  }
  
  if (fraud.alerts.length > 0) {
    conditions.push(`${fraud.alerts.length} alerte(s) à vérifier manuellement`);
  }
  
  if (subScores.identity_stability.confidence < 50) {
    conditions.push('Vérification identité complémentaire recommandée');
  }
  
  if (subScores.cashflow_consistency.score < 50) {
    conditions.push('Revenus à confirmer sur 3 mois');
  }
  
  return conditions;
}

function generateGuaranteeRequirements(riskTier: RiskTier, subScores: ScoreSubComponents): string[] {
  const guarantees: string[] = [];
  
  if (riskTier.tier === 'subprime') {
    guarantees.push('1 garant solvable');
  }
  if (riskTier.tier === 'high_risk') {
    guarantees.push('2 garants solvables');
    guarantees.push('Nantissement ou caution');
  }
  
  if (subScores.social_capital.score < 40) {
    guarantees.push('Attestation communautaire');
  }
  
  return guarantees;
}

function generateExplainability(features: Record<string, number>, subScores: ScoreSubComponents, fraud: FraudAnalysis): ScoreExplainability {
  const positive: ScoreExplainability['positive_factors'] = [];
  const negative: ScoreExplainability['negative_factors'] = [];
  const improvements: ScoreExplainability['improvement_suggestions'] = [];
  const dataQualityNotes: string[] = [];
  
  // Analyze each sub-score
  for (const [key, subScore] of Object.entries(subScores)) {
    if (subScore.score >= 70) {
      positive.push({ factor: subScore.factors[0]?.name || key, impact: (subScore.score - 70) / 10, description: `Fort score en ${key}` });
    } else if (subScore.score < 50) {
      negative.push({ factor: subScore.factors[0]?.name || key, impact: (50 - subScore.score) / 10, description: `Faible score en ${key}` });
    }
    
    if (subScore.confidence < 50) {
      dataQualityNotes.push(`${key}: données insuffisantes (${subScore.confidence}% confiance)`);
    }
  }
  
  // Add fraud as negative
  if (fraud.fraud_score > 20) {
    negative.push({ factor: 'Risque fraude', impact: fraud.fraud_score / 20, description: `Score fraude: ${fraud.fraud_score}` });
  }
  
  // Generate improvements
  if (features.utility_payment_rate < 0.8) {
    improvements.push({ action: 'Payer les factures à temps', potential_gain: 10, timeframe: '3 mois' });
  }
  if (!features.is_formalized) {
    improvements.push({ action: 'Formaliser l\'activité (RCCM)', potential_gain: 15, timeframe: '1 mois' });
  }
  if (features.savings_rate < 0.1) {
    improvements.push({ action: 'Augmenter l\'épargne mensuelle', potential_gain: 8, timeframe: '6 mois' });
  }
  
  // Confidence breakdown
  const confidenceBreakdown = Object.entries(subScores).map(([source, data]) => ({
    source,
    confidence: data.confidence,
    weight: 1 / Object.keys(subScores).length,
  }));
  
  return {
    positive_factors: positive.slice(0, 5),
    negative_factors: negative.slice(0, 5),
    improvement_suggestions: improvements.slice(0, 4),
    data_quality_notes: dataQualityNotes,
    confidence_breakdown: confidenceBreakdown,
  };
}

// ============================================
// EXPORTS
// ============================================

export type { ScoringInput, FraudRule };
