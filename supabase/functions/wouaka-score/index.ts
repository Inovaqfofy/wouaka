// ============================================
// W-SCORE API - Edge Function
// Sovereign Credit Scoring for UEMOA v5.3
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

// ============================================
// KILL SWITCH INTEGRATION
// ============================================

interface KillSwitchStatus {
  allowed: boolean
  reason?: string
  message?: string
  is_read_only?: boolean
}

async function checkKillSwitch(
  featureName: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<KillSwitchStatus> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data: lockdown, error: lockdownError } = await supabase
      .from('system_lockdown_state')
      .select('is_full_lockdown, is_read_only_mode, lockdown_message')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()

    if (lockdownError) {
      console.warn('[Kill Switch] Could not check lockdown state:', lockdownError.message)
      return { allowed: true }
    }

    if (lockdown?.is_full_lockdown) {
      return {
        allowed: false,
        reason: 'full_lockdown',
        message: lockdown.lockdown_message || 'Service temporairement suspendu pour maintenance de sécurité.',
        is_read_only: false
      }
    }

    const writeFeatures = ['external_api_scoring', 'kyc_processing', 'momo_sms_extraction', 'new_user_registration', 'payment_processing']

    if (lockdown?.is_read_only_mode && writeFeatures.includes(featureName)) {
      return {
        allowed: false,
        reason: 'read_only_mode',
        message: lockdown.lockdown_message || 'Mode lecture seule activé.',
        is_read_only: true
      }
    }

    const { data: feature, error: featureError } = await supabase
      .from('system_security_controls')
      .select('is_active, emergency_message')
      .eq('feature_name', featureName)
      .single()

    if (featureError) {
      return { allowed: true }
    }

    if (!feature.is_active) {
      return {
        allowed: false,
        reason: 'feature_disabled',
        message: feature.emergency_message || 'Fonctionnalité temporairement désactivée.',
        is_read_only: lockdown?.is_read_only_mode || false
      }
    }

    return { allowed: true, is_read_only: lockdown?.is_read_only_mode || false }
  } catch (error) {
    console.error('[Kill Switch] Error:', error)
    return { allowed: true }
  }
}

async function logBlockedRequest(
  featureName: string,
  blockReason: string,
  errorMessage: string,
  req: Request,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  try {
    const apiKeyHeader = req.headers.get('x-api-key') || ''
    const apiKeyPrefix = apiKeyHeader.startsWith('wk_') ? apiKeyHeader.slice(0, 12) : null

    await supabase.from('blocked_requests').insert({
      feature_name: featureName,
      endpoint: new URL(req.url).pathname,
      method: req.method,
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('cf-connecting-ip') || null,
      user_agent: req.headers.get('user-agent'),
      api_key_prefix: apiKeyPrefix,
      block_reason: blockReason,
      error_message: errorMessage,
      request_metadata: { origin: req.headers.get('origin'), referer: req.headers.get('referer') }
    })
  } catch (error) {
    console.error('[Kill Switch] Failed to log blocked request:', error)
  }
}

function createBlockedResponse(status: KillSwitchStatus): Response {
  return new Response(
    JSON.stringify({
      error: 'Service Temporarily Restricted',
      code: 'SERVICE_BLOCKED',
      reason: status.reason,
      message: status.message,
      is_read_only: status.is_read_only,
      retry_after: 300
    }),
    { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '300' } }
  )
}

// ============================================
// TYPES
// ============================================

interface ScoreRequest {
  // Identity
  full_name: string;
  national_id?: string;
  phone_number?: string;
  
  // Financial
  monthly_income?: number;
  monthly_expenses?: number;
  existing_loans?: number;
  employment_type?: 'formal' | 'informal' | 'self_employed' | 'unemployed';
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
  
  // Location
  region?: string;
  city?: string;
  
  // KYC score (if already verified)
  kyc_score?: number;
  
  // Identity verification bonus
  identity_verification_level?: 'basic' | 'enhanced' | 'smile_id_basic' | 'smile_id_enhanced' | 'smile_id_biometric';
  liveness_score?: number;
  face_match_score?: number;
  phone_verified?: boolean;
}

interface SubScore {
  score: number;
  confidence: number;
  factors: { name: string; value: number; weight: number }[];
}

// Data source tracking for transparency
type DataSourceStatus = 'verified' | 'declared' | 'partially_verified' | 'unverified';

interface DataSource {
  source_id: string;
  source_name: string;
  source_type: 'document' | 'api' | 'user_input' | 'ocr' | 'partner_attestation' | 'public_registry';
  status: DataSourceStatus;
  confidence: number;
  value: unknown;
}

interface DataTransparency {
  total_fields: number;
  verified_count: number;
  declared_count: number;
  verification_rate: number;
  overall_confidence: number;
  data_quality: 'high' | 'medium' | 'low' | 'insufficient';
  sources: DataSource[];
  warnings: string[];
}

interface ScoreResult {
  score_id: string;
  final_score: number;
  grade: string;
  risk_tier: string;
  confidence: number;
  data_quality: 'high' | 'medium' | 'low' | 'insufficient';
  
  // NEW: Data transparency section
  data_transparency: DataTransparency;
  
  sub_scores: {
    identity_stability: SubScore;
    cashflow_consistency: SubScore;
    behavioral_psychometric: SubScore;
    financial_discipline: SubScore;
    social_capital: SubScore;
    environmental_adjustment: SubScore;
  };
  
  credit_recommendation: {
    approved: boolean;
    max_amount: number;
    max_tenor_months: number;
    suggested_rate: number;
    conditions: string[];
    guarantees_required: string[];
  };
  
  explainability: {
    positive_factors: { factor: string; impact: number; description: string }[];
    negative_factors: { factor: string; impact: number; description: string }[];
    improvement_suggestions: { action: string; potential_gain: number }[];
  };
  
  fraud_analysis: {
    fraud_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    alerts: { type: string; severity: string; description: string }[];
  };
  
  processing_time_ms: number;
  model_version: string;
  calculated_at: string;
}

// ============================================
// RISK TIERS
// ============================================

const RISK_TIERS = [
  { tier: 'prime', grade: 'A+', min: 85, max: 100, multiplier: 6, tenor: 36, rate_adj: -3 },
  { tier: 'near_prime', grade: 'A', min: 75, max: 84, multiplier: 5, tenor: 30, rate_adj: -1 },
  { tier: 'standard_plus', grade: 'B+', min: 65, max: 74, multiplier: 4, tenor: 24, rate_adj: 0 },
  { tier: 'standard', grade: 'B', min: 55, max: 64, multiplier: 3, tenor: 18, rate_adj: 2 },
  { tier: 'subprime', grade: 'C', min: 45, max: 54, multiplier: 2, tenor: 12, rate_adj: 5 },
  { tier: 'high_risk', grade: 'D', min: 30, max: 44, multiplier: 1.5, tenor: 6, rate_adj: 10 },
  { tier: 'decline', grade: 'E', min: 0, max: 29, multiplier: 0, tenor: 0, rate_adj: 0 },
];

// ============================================
// FEATURE CALCULATION
// ============================================

function calculateFeatures(input: ScoreRequest): Record<string, number> {
  const features: Record<string, number> = {};
  
  // Identity features
  features.sim_age_months = input.sim_age_months || 0;
  features.is_formalized = input.rccm_number ? 1 : 0;
  features.years_in_business = input.years_in_business || 0;
  
  // Income features
  const income = input.monthly_income || 0;
  const expenses = input.monthly_expenses || 0;
  features.monthly_income = income;
  features.expense_to_income_ratio = income > 0 ? expenses / income : 1;
  features.savings_rate = income > 0 ? (income - expenses) / income : 0;
  
  // Debt features
  features.existing_debt_ratio = income > 0 ? (input.existing_loans || 0) / income : 0;
  
  // MoMo features
  const momoIn = input.momo_total_in || 0;
  const momoOut = input.momo_total_out || 0;
  const momoDays = input.momo_period_days || 30;
  features.momo_velocity_30d = (input.momo_transaction_count || 0) / momoDays * 30;
  features.momo_in_out_ratio = momoOut > 0 ? momoIn / momoOut : 1;
  
  // Utility features
  const onTime = input.utility_payments_on_time || 0;
  const late = input.utility_payments_late || 0;
  const total = onTime + late;
  features.utility_payment_rate = total > 0 ? onTime / total : 0.5;
  features.utility_late_ratio = total > 0 ? late / total : 0;
  
  // Social features
  features.tontine_participation_score = input.tontine_participation ? 70 : 0;
  features.tontine_discipline_rate = input.tontine_discipline_rate || 0;
  features.cooperative_member = input.cooperative_member ? 1 : 0;
  features.guarantor_count = input.guarantor_count || 0;
  
  return features;
}

// ============================================
// SUB-SCORE CALCULATION
// ============================================

function calculateSubScores(
  features: Record<string, number>, 
  kycScore?: number,
  verificationBonus?: { level: string; livenessScore?: number; faceMatchScore?: number; phoneVerified?: boolean }
): Record<string, SubScore> {
  const subScores: Record<string, SubScore> = {};
  
  // Identity & Stability
  const idFactors: SubScore['factors'] = [];
  let idScore = 50;
  let idConfidence = 0;
  
  if (features.sim_age_months > 0) {
    const simScore = Math.min(100, features.sim_age_months / 24 * 100);
    idFactors.push({ name: 'Âge SIM', value: simScore, weight: 0.2 });
    idScore += (simScore - 50) * 0.2;
    idConfidence += 20;
  }
  if (features.is_formalized) {
    idFactors.push({ name: 'Entreprise formalisée', value: 100, weight: 0.2 });
    idScore += 10;
    idConfidence += 20;
  }
  if (kycScore) {
    idFactors.push({ name: 'Score KYC', value: kycScore, weight: 0.2 });
    idScore += (kycScore - 50) * 0.2;
    idConfidence += 20;
  }
  
  // Identity verification bonus
  if (verificationBonus) {
    const verificationBonuses: Record<string, { scoreBonus: number; confidenceBonus: number }> = {
      'basic': { scoreBonus: 0, confidenceBonus: 5 },
      'enhanced': { scoreBonus: 5, confidenceBonus: 15 },
      'smile_id_basic': { scoreBonus: 10, confidenceBonus: 25 },
      'smile_id_enhanced': { scoreBonus: 15, confidenceBonus: 30 },
      'smile_id_biometric': { scoreBonus: 20, confidenceBonus: 35 },
    };
    
    const bonus = verificationBonuses[verificationBonus.level] || { scoreBonus: 0, confidenceBonus: 0 };
    
    if (bonus.scoreBonus > 0) {
      idFactors.push({ 
        name: `Vérification ${verificationBonus.level.replace(/_/g, ' ')}`, 
        value: 100, 
        weight: 0.3 
      });
      idScore += bonus.scoreBonus;
      idConfidence += bonus.confidenceBonus;
    }
    
    // Liveness score bonus
    if (verificationBonus.livenessScore && verificationBonus.livenessScore > 70) {
      const livenessBonus = Math.round((verificationBonus.livenessScore - 70) / 6); // 0-5 points
      idFactors.push({ name: 'Liveness Check', value: verificationBonus.livenessScore, weight: 0.1 });
      idScore += livenessBonus;
      idConfidence += 10;
    }
    
    // Face match score bonus
    if (verificationBonus.faceMatchScore && verificationBonus.faceMatchScore > 70) {
      const faceBonus = Math.round((verificationBonus.faceMatchScore - 70) / 6); // 0-5 points
      idFactors.push({ name: 'Face Match', value: verificationBonus.faceMatchScore, weight: 0.1 });
      idScore += faceBonus;
      idConfidence += 10;
    }
    
    // Phone verified bonus
    if (verificationBonus.phoneVerified) {
      idFactors.push({ name: 'Téléphone vérifié SMS', value: 100, weight: 0.1 });
      idScore += 3;
      idConfidence += 10;
    }
  }
  
  subScores.identity_stability = {
    score: Math.round(Math.max(0, Math.min(100, idScore))),
    confidence: Math.min(100, idConfidence),
    factors: idFactors,
  };
  
  // Cashflow Consistency
  const cfFactors: SubScore['factors'] = [];
  let cfScore = 50;
  let cfConfidence = 0;
  
  if (features.monthly_income > 0) {
    cfFactors.push({ name: 'Revenu mensuel', value: Math.min(100, features.monthly_income / 500000 * 100), weight: 0.3 });
    cfScore += 15;
    cfConfidence += 30;
  }
  if (features.expense_to_income_ratio < 1) {
    const ratioScore = (1 - features.expense_to_income_ratio) * 100;
    cfFactors.push({ name: 'Ratio dépenses/revenus', value: ratioScore, weight: 0.3 });
    cfScore += ratioScore * 0.2;
    cfConfidence += 30;
  }
  if (features.momo_velocity_30d > 0) {
    const veloScore = Math.min(100, features.momo_velocity_30d / 30 * 100);
    cfFactors.push({ name: 'Vélocité MoMo', value: veloScore, weight: 0.2 });
    cfScore += veloScore * 0.1;
    cfConfidence += 20;
  }
  
  subScores.cashflow_consistency = {
    score: Math.round(Math.max(0, Math.min(100, cfScore))),
    confidence: Math.min(100, cfConfidence),
    factors: cfFactors,
  };
  
  // Behavioral/Psychometric (limited without quiz)
  subScores.behavioral_psychometric = {
    score: 50,
    confidence: 20,
    factors: [{ name: 'Données comportementales', value: 50, weight: 1 }],
  };
  
  // Financial Discipline
  const fdFactors: SubScore['factors'] = [];
  let fdScore = 50;
  let fdConfidence = 0;
  
  if (features.utility_payment_rate > 0) {
    const utilScore = features.utility_payment_rate * 100;
    fdFactors.push({ name: 'Paiement factures', value: utilScore, weight: 0.4 });
    fdScore += (utilScore - 50) * 0.4;
    fdConfidence += 40;
  }
  if (features.savings_rate !== 0) {
    const savScore = Math.min(100, Math.max(0, (features.savings_rate + 0.5) * 100));
    fdFactors.push({ name: 'Taux épargne', value: savScore, weight: 0.3 });
    fdScore += (savScore - 50) * 0.3;
    fdConfidence += 30;
  }
  if (features.existing_debt_ratio >= 0) {
    const debtScore = Math.max(0, 100 - features.existing_debt_ratio * 100);
    fdFactors.push({ name: 'Ratio dette', value: debtScore, weight: 0.3 });
    fdScore += (debtScore - 50) * 0.3;
    fdConfidence += 30;
  }
  
  subScores.financial_discipline = {
    score: Math.round(Math.max(0, Math.min(100, fdScore))),
    confidence: Math.min(100, fdConfidence),
    factors: fdFactors,
  };
  
  // Social Capital
  const scFactors: SubScore['factors'] = [];
  let scScore = 40;
  let scConfidence = 0;
  
  if (features.tontine_participation_score > 0) {
    scFactors.push({ name: 'Participation tontine', value: features.tontine_participation_score, weight: 0.4 });
    scScore += 20;
    scConfidence += 40;
  }
  if (features.tontine_discipline_rate > 0) {
    const discScore = features.tontine_discipline_rate * 100;
    scFactors.push({ name: 'Discipline tontine', value: discScore, weight: 0.3 });
    scScore += discScore * 0.15;
    scConfidence += 30;
  }
  if (features.guarantor_count > 0) {
    const guarScore = Math.min(100, features.guarantor_count * 30);
    scFactors.push({ name: 'Garants', value: guarScore, weight: 0.3 });
    scScore += guarScore * 0.15;
    scConfidence += 30;
  }
  
  subScores.social_capital = {
    score: Math.round(Math.max(0, Math.min(100, scScore))),
    confidence: Math.min(100, scConfidence),
    factors: scFactors,
  };
  
  // Environmental Adjustment
  subScores.environmental_adjustment = {
    score: 50,
    confidence: 30,
    factors: [{ name: 'Contexte régional', value: 50, weight: 1 }],
  };
  
  return subScores;
}

// ============================================
// FRAUD DETECTION
// ============================================

function detectFraud(input: ScoreRequest, features: Record<string, number>): {
  fraud_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  alerts: { type: string; severity: string; description: string }[];
} {
  const alerts: { type: string; severity: string; description: string }[] = [];
  let fraudScore = 0;
  
  // Income inflation check
  if (input.monthly_income && input.momo_total_in) {
    const declaredMonthly = input.monthly_income;
    const momoMonthly = input.momo_total_in / (input.momo_period_days || 30) * 30 * 0.7;
    
    if (declaredMonthly > momoMonthly * 2) {
      alerts.push({
        type: 'income_inflation',
        severity: 'high',
        description: `Revenu déclaré ${Math.round(declaredMonthly / momoMonthly)}x supérieur aux flux MoMo`,
      });
      fraudScore += 25;
    }
  }
  
  // Expense ratio check
  if (features.expense_to_income_ratio > 1.5) {
    alerts.push({
      type: 'unsustainable_expenses',
      severity: 'warning',
      description: 'Dépenses déclarées dépassent les revenus',
    });
    fraudScore += 15;
  }
  
  // Very new SIM
  if (features.sim_age_months > 0 && features.sim_age_months < 3) {
    alerts.push({
      type: 'new_sim',
      severity: 'warning',
      description: 'SIM très récente - identité non établie',
    });
    fraudScore += 10;
  }
  
  // Debt ratio too high
  if (features.existing_debt_ratio > 0.5) {
    alerts.push({
      type: 'high_debt',
      severity: 'warning',
      description: 'Niveau dette élevé par rapport aux revenus',
    });
    fraudScore += 10;
  }
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (fraudScore >= 50) riskLevel = 'critical';
  else if (fraudScore >= 30) riskLevel = 'high';
  else if (fraudScore >= 15) riskLevel = 'medium';
  else riskLevel = 'low';
  
  return { fraud_score: fraudScore, risk_level: riskLevel, alerts };
}

// ============================================
// DATA TRANSPARENCY TRACKING
// ============================================

function trackDataSources(input: ScoreRequest): DataTransparency {
  const sources: DataSource[] = [];
  const warnings: string[] = [];

  // Track each data field and its verification status
  if (input.full_name) {
    sources.push({
      source_id: 'full_name',
      source_name: 'Nom complet',
      source_type: 'user_input',
      status: input.kyc_score && input.kyc_score >= 70 ? 'verified' : 'declared',
      confidence: input.kyc_score || 40,
      value: input.full_name,
    });
  }

  if (input.national_id) {
    sources.push({
      source_id: 'national_id',
      source_name: 'Numéro d\'identité',
      source_type: input.kyc_score ? 'document' : 'user_input',
      status: input.kyc_score && input.kyc_score >= 80 ? 'verified' : 'partially_verified',
      confidence: input.kyc_score || 50,
      value: '***' + (input.national_id.slice(-4) || ''),
    });
  }

  if (input.phone_number) {
    sources.push({
      source_id: 'phone',
      source_name: 'Téléphone',
      source_type: input.phone_verified ? 'api' : 'user_input',
      status: input.phone_verified ? 'verified' : 'declared',
      confidence: input.phone_verified ? 95 : 40,
      value: input.phone_number,
    });
  }

  if (input.monthly_income) {
    // Income is always declared unless we have MoMo data to cross-validate
    const hasMomoValidation = input.momo_total_in && input.momo_total_in > 0;
    sources.push({
      source_id: 'income',
      source_name: 'Revenu mensuel',
      source_type: hasMomoValidation ? 'ocr' : 'user_input',
      status: hasMomoValidation ? 'partially_verified' : 'declared',
      confidence: hasMomoValidation ? 60 : 35,
      value: input.monthly_income,
    });

    if (!hasMomoValidation) {
      warnings.push('Revenu non vérifié - basé sur déclaration');
    }
  }

  if (input.momo_total_in || input.momo_transaction_count) {
    sources.push({
      source_id: 'momo',
      source_name: 'Mobile Money',
      source_type: 'ocr',
      status: 'partially_verified',
      confidence: 65,
      value: `${input.momo_transaction_count || 0} transactions`,
    });
  }

  if (input.utility_payments_on_time !== undefined) {
    sources.push({
      source_id: 'utility',
      source_name: 'Paiements factures',
      source_type: 'user_input',
      status: 'declared',
      confidence: 40,
      value: `${input.utility_payments_on_time}/${(input.utility_payments_on_time || 0) + (input.utility_payments_late || 0)}`,
    });
  }

  if (input.tontine_participation) {
    sources.push({
      source_id: 'tontine',
      source_name: 'Participation tontine',
      source_type: 'user_input',
      status: 'declared',
      confidence: 35,
      value: `Discipline: ${Math.round((input.tontine_discipline_rate || 0) * 100)}%`,
    });
    warnings.push('Tontine non vérifiée - attestation partenaire recommandée');
  }

  if (input.rccm_number) {
    sources.push({
      source_id: 'rccm',
      source_name: 'RCCM',
      source_type: 'public_registry',
      status: 'partially_verified',
      confidence: 75,
      value: input.rccm_number,
    });
  }

  if (input.identity_verification_level) {
    const verificationConfidence = {
      'basic': 50,
      'enhanced': 70,
      'smile_id_basic': 80,
      'smile_id_enhanced': 85,
      'smile_id_biometric': 95,
    }[input.identity_verification_level] || 50;

    sources.push({
      source_id: 'kyc_verification',
      source_name: 'Vérification KYC',
      source_type: 'api',
      status: verificationConfidence >= 80 ? 'verified' : 'partially_verified',
      confidence: verificationConfidence,
      value: input.identity_verification_level,
    });
  }

  // Calculate summary
  const verified = sources.filter(s => s.status === 'verified').length;
  const declared = sources.filter(s => s.status === 'declared').length;
  const partial = sources.filter(s => s.status === 'partially_verified').length;
  
  const verificationRate = sources.length > 0 
    ? Math.round(((verified + partial * 0.5) / sources.length) * 100)
    : 0;
  
  const avgConfidence = sources.length > 0 
    ? Math.round(sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length)
    : 0;

  let dataQuality: 'high' | 'medium' | 'low' | 'insufficient';
  if (verificationRate >= 70 && avgConfidence >= 75) {
    dataQuality = 'high';
  } else if (verificationRate >= 40 && avgConfidence >= 50) {
    dataQuality = 'medium';
  } else if (verificationRate >= 20 || avgConfidence >= 30) {
    dataQuality = 'low';
  } else {
    dataQuality = 'insufficient';
  }

  if (verificationRate < 30) {
    warnings.push('Moins de 30% des données vérifiées - confiance réduite');
  }

  return {
    total_fields: sources.length,
    verified_count: verified,
    declared_count: declared,
    verification_rate: verificationRate,
    overall_confidence: avgConfidence,
    data_quality: dataQuality,
    sources,
    warnings,
  };
}

// ============================================
// CONFIDENCE COEFFICIENTS (Sovereign Proof Model)
// ============================================

const PROOF_COEFFICIENTS = {
  HARD: 1.0,    // Verified via OCR, SMS, official APIs
  SOFT: 0.7,   // USSD screenshots, attestations
  DECLARATIVE: 0.3,  // User input without proof
};

function getProofTypeFromSource(source: DataSource): 'hard' | 'soft' | 'declarative' {
  if (source.status === 'verified' && source.confidence >= 80) return 'hard';
  if (source.status === 'partially_verified' || source.status === 'verified') return 'soft';
  return 'declarative';
}

// ============================================
// MAIN SCORING FUNCTION
// ============================================

function calculateScore(input: ScoreRequest): ScoreResult {
  const startTime = Date.now();
  
  // Track data sources for transparency
  const dataTransparency = trackDataSources(input);
  
  // Calculate features
  const features = calculateFeatures(input);
  
  // Prepare verification bonus
  const verificationBonus = input.identity_verification_level ? {
    level: input.identity_verification_level,
    livenessScore: input.liveness_score,
    faceMatchScore: input.face_match_score,
    phoneVerified: input.phone_verified,
  } : undefined;
  
  // Calculate sub-scores with verification bonus
  const subScores = calculateSubScores(features, input.kyc_score, verificationBonus);
  
  // ============================================
  // APPLY CONFIDENCE COEFFICIENTS TO FINAL SCORE
  // ============================================
  
  // Calculate weighted average coefficient based on data sources
  let totalCoefficient = 0;
  let sourceCount = 0;
  
  for (const source of dataTransparency.sources) {
    const proofType = getProofTypeFromSource(source);
    const coefficient = PROOF_COEFFICIENTS[proofType === 'hard' ? 'HARD' : proofType === 'soft' ? 'SOFT' : 'DECLARATIVE'];
    totalCoefficient += coefficient;
    sourceCount++;
  }
  
  const avgCoefficient = sourceCount > 0 ? totalCoefficient / sourceCount : PROOF_COEFFICIENTS.DECLARATIVE;
  
  // Calculate final score with confidence-adjusted weights
  const weights = {
    identity_stability: 0.22,  // Increased from 0.20
    cashflow_consistency: 0.25,
    behavioral_psychometric: 0.08,  // Reduced - often missing data
    financial_discipline: 0.22,
    social_capital: 0.15,
    environmental_adjustment: 0.08,
  };
  
  let rawScore = 0;
  let totalWeight = 0;
  let avgConfidence = 0;
  
  for (const [key, weight] of Object.entries(weights)) {
    const subScore = subScores[key];
    const adjustedWeight = weight * (subScore.confidence / 100);
    rawScore += subScore.score * adjustedWeight;
    totalWeight += adjustedWeight;
    avgConfidence += subScore.confidence;
  }
  
  rawScore = totalWeight > 0 ? rawScore / totalWeight : 50;
  avgConfidence = avgConfidence / Object.keys(weights).length;
  
  // ============================================
  // PHONE TRUST IMPACT (Critical for Sovereignty)
  // ============================================
  
  // If phone is NOT verified, apply significant penalty
  if (!input.phone_verified) {
    rawScore = Math.max(30, rawScore - 15); // -15 points without phone verification
    dataTransparency.warnings.push('Téléphone non vérifié - score plafonné');
  }
  
  // If phone is verified, provide bonus
  if (input.phone_verified) {
    rawScore = Math.min(100, rawScore + 5); // +5 points with phone verification
  }
  
  // ============================================
  // APPLY PROOF COEFFICIENT PENALTY
  // ============================================
  
  // Scores based on mostly declarative data are capped
  if (avgCoefficient < 0.5) {
    // Mostly declarative data - cap score at 55
    rawScore = Math.min(55, rawScore);
    dataTransparency.warnings.push('Score limité: données majoritairement déclaratives');
  } else if (avgCoefficient < 0.7) {
    // Mixed data - soft cap at 70
    rawScore = Math.min(70, rawScore);
  }
  
  // Fraud analysis
  const fraudAnalysis = detectFraud(input, features);
  let finalScore = Math.max(0, rawScore - fraudAnalysis.fraud_score * 0.4);
  
  // Data quality determination
  const dataQuality = avgConfidence >= 70 && avgCoefficient >= 0.7 ? 'high' 
    : avgConfidence >= 50 && avgCoefficient >= 0.5 ? 'medium' 
    : avgConfidence >= 30 ? 'low' 
    : 'insufficient';
  
  // Apply additional data quality penalty
  if (dataQuality === 'low') finalScore = Math.max(30, finalScore - 5);
  if (dataQuality === 'insufficient') finalScore = Math.max(25, finalScore - 10);
  
  finalScore = Math.round(finalScore);
  
  // Get risk tier
  const tier = RISK_TIERS.find(t => finalScore >= t.min && finalScore <= t.max) || RISK_TIERS[RISK_TIERS.length - 1];
  
  // Credit recommendation
  const monthlyIncome = input.monthly_income || 0;
  const conditions: string[] = [];
  const guarantees: string[] = [];
  
  if (tier.tier === 'subprime' || tier.tier === 'high_risk') {
    conditions.push('Suivi renforcé obligatoire');
    guarantees.push('1-2 garants solvables requis');
  }
  if (fraudAnalysis.alerts.length > 0) {
    conditions.push('Vérification manuelle des alertes');
  }
  if (dataQuality === 'low' || dataQuality === 'insufficient') {
    conditions.push('Documents complémentaires requis');
  }
  
  // Explainability
  const positiveFactors: ScoreResult['explainability']['positive_factors'] = [];
  const negativeFactors: ScoreResult['explainability']['negative_factors'] = [];
  const improvements: ScoreResult['explainability']['improvement_suggestions'] = [];
  
  for (const [key, subScore] of Object.entries(subScores)) {
    if (subScore.score >= 70) {
      positiveFactors.push({
        factor: key,
        impact: (subScore.score - 70) / 10,
        description: `Bon score ${key}: ${subScore.score}%`,
      });
    } else if (subScore.score < 50) {
      negativeFactors.push({
        factor: key,
        impact: (50 - subScore.score) / 10,
        description: `Faible score ${key}: ${subScore.score}%`,
      });
    }
  }
  
  if (features.utility_payment_rate < 0.8) {
    improvements.push({ action: 'Payer les factures à temps', potential_gain: 10 });
  }
  if (!features.is_formalized) {
    improvements.push({ action: 'Formaliser l\'activité (RCCM)', potential_gain: 15 });
  }
  if (features.savings_rate < 0.1) {
    improvements.push({ action: 'Augmenter l\'épargne mensuelle', potential_gain: 8 });
  }
  
  const processingTime = Date.now() - startTime;
  
  return {
    score_id: crypto.randomUUID(),
    final_score: finalScore,
    grade: tier.grade,
    risk_tier: tier.tier,
    confidence: Math.round(avgConfidence),
    data_quality: dataTransparency.data_quality,
    data_transparency: dataTransparency,
    sub_scores: subScores as ScoreResult['sub_scores'],
    credit_recommendation: {
      approved: tier.multiplier > 0,
      max_amount: Math.round(monthlyIncome * tier.multiplier),
      max_tenor_months: tier.tenor,
      suggested_rate: 12 + tier.rate_adj,
      conditions,
      guarantees_required: guarantees,
    },
    explainability: {
      positive_factors: positiveFactors.slice(0, 5),
      negative_factors: negativeFactors.slice(0, 5),
      improvement_suggestions: improvements.slice(0, 4),
    },
    fraud_analysis: fraudAnalysis,
    processing_time_ms: processingTime,
    model_version: '5.3.0-sovereign',
    calculated_at: new Date().toISOString(),
  };
}

// ============================================
// AUTHENTICATION (API Key OR JWT)
// ============================================

interface AuthResult {
  valid: boolean;
  userId?: string;
  keyId?: string;
  permissions?: string[];
  authType?: 'api_key' | 'jwt';
}

async function validateApiKey(supabase: any, apiKey: string): Promise<AuthResult> {
  if (!apiKey || !apiKey.startsWith('wk_')) {
    return { valid: false };
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const { data: keyData, error } = await supabase
    .from('api_keys')
    .select('id, user_id, permissions, is_active, expires_at')
    .eq('key_hash', keyHash)
    .single();

  if (error || !keyData || !keyData.is_active) {
    return { valid: false };
  }

  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    return { valid: false };
  }

  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyData.id);

  return {
    valid: true,
    userId: keyData.user_id,
    keyId: keyData.id,
    permissions: keyData.permissions || [],
    authType: 'api_key',
  };
}

async function validateJwt(supabase: any, authHeader: string): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return { valid: false };
  }

  return {
    valid: true,
    userId: data.user.id,
    keyId: 'jwt-internal',
    permissions: ['kyc', 'score', 'identity', 'internal'],
    authType: 'jwt',
  };
}

async function authenticate(supabase: any, req: Request): Promise<AuthResult> {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    return validateApiKey(supabase, apiKey);
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    return validateJwt(supabase, authHeader);
  }

  return { valid: false };
}

async function logApiCall(supabase: any, params: {
  apiKeyId: string;
  userId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  requestBody?: any;
  responseBody?: any;
  processingTimeMs: number;
}) {
  await supabase.from('api_calls').insert({
    api_key_id: params.apiKeyId,
    user_id: params.userId,
    endpoint: params.endpoint,
    method: params.method,
    status_code: params.statusCode,
    request_body: params.requestBody,
    response_body: params.responseBody,
    processing_time_ms: params.processingTimeMs,
  });
}

async function triggerWebhooks(supabase: any, userId: string, eventType: string, payload: any) {
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .contains('events', [eventType]);

  if (!webhooks || webhooks.length === 0) return;

  for (const webhook of webhooks) {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret,
          'X-Event-Type': eventType,
        },
        body: JSON.stringify(payload),
      });

      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload,
        status_code: response.status,
        delivered_at: new Date().toISOString(),
      });
    } catch (error) {
      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload,
        status_code: 0,
        response_body: (error as Error).message,
      });
    }
  }
}

// ============================================
// HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ========== KILL SWITCH CHECK ==========
  const killSwitchStatus = await checkKillSwitch('external_api_scoring', supabaseUrl, supabaseServiceKey);
  if (!killSwitchStatus.allowed) {
    console.warn('[W-Score] Request blocked by Kill Switch:', killSwitchStatus.reason);
    await logBlockedRequest('external_api_scoring', killSwitchStatus.reason || 'unknown', killSwitchStatus.message || '', req, supabaseUrl, supabaseServiceKey);
    return createBlockedResponse(killSwitchStatus);
  }
  // ========================================

  // Authenticate via API key OR JWT
  const authResult = await authenticate(supabase, req);

  if (!authResult.valid) {
    return new Response(
      JSON.stringify({ error: 'Authentication required', code: 'AUTH_REQUIRED' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check permissions (skip for JWT internal calls)
  if (authResult.authType === 'api_key' && !authResult.permissions?.includes('score')) {
    return new Response(
      JSON.stringify({ error: 'API key does not have score permission', code: 'INSUFFICIENT_PERMISSIONS' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const keyValidation = authResult;

  try {
    const body: ScoreRequest = await req.json();

    if (!body.full_name) {
      return new Response(
        JSON.stringify({ error: 'full_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate score
    const scoreResult = calculateScore(body);

    // Save MoMo data if provided
    if (body.momo_total_in || body.momo_total_out || body.momo_transaction_count) {
      await supabase.from('user_momo_transactions').insert({
        user_id: keyValidation.userId,
        provider: 'other',
        phone_number: body.phone_number || null,
        period_start: new Date(Date.now() - (body.momo_period_days || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        total_in: body.momo_total_in || 0,
        total_out: body.momo_total_out || 0,
        transaction_count: body.momo_transaction_count || 0,
        velocity_30d: (body.momo_transaction_count || 0) / (body.momo_period_days || 30) * 30,
        source_type: 'api',
      });
    }

    // Save tontine data if provided
    if (body.tontine_participation) {
      await supabase.from('user_tontine_memberships').insert({
        user_id: keyValidation.userId,
        group_name: 'Déclaré via API',
        discipline_score: (body.tontine_discipline_rate || 0) * 100,
        verified: false,
      });
    }

    // Save cooperative data if provided
    if (body.cooperative_member) {
      await supabase.from('user_cooperative_memberships').insert({
        user_id: keyValidation.userId,
        cooperative_name: 'Déclaré via API',
        cooperative_type: 'other',
        verified: false,
      });
    }

    // Save guarantors if any
    if (body.guarantor_count && body.guarantor_count > 0) {
      for (let i = 0; i < Math.min(body.guarantor_count, 5); i++) {
        await supabase.from('user_guarantors').insert({
          user_id: keyValidation.userId,
          guarantor_name: `Garant ${i + 1}`,
          relationship: 'other',
        });
      }
    }

    // Save raw features
    const features = calculateFeatures(body);
    for (const [featureId, value] of Object.entries(features)) {
      await supabase.from('score_raw_features').insert({
        user_id: keyValidation.userId,
        feature_id: featureId,
        feature_name: featureId.replace(/_/g, ' '),
        category: featureId.includes('momo') || featureId.includes('income') ? 'financial' : 
                  featureId.includes('utility') || featureId.includes('tontine') ? 'behavioral' :
                  featureId.includes('sim') || featureId.includes('business') ? 'identity' : 'social',
        raw_value: value,
        source: 'api_input',
        confidence: 80,
        is_missing: value === 0,
      });
    }

    // Save score history
    await supabase.from('score_history').insert({
      user_id: keyValidation.userId,
      score_value: scoreResult.final_score,
      grade: scoreResult.grade,
      risk_tier: scoreResult.risk_tier,
      sub_scores: scoreResult.sub_scores,
      data_quality: scoreResult.data_quality,
      data_sources_count: Object.keys(body).filter(k => body[k as keyof ScoreRequest] !== undefined).length,
      trigger_event: 'api_request',
      model_version: scoreResult.model_version,
    });

    // Save fraud alerts if any
    if (scoreResult.fraud_analysis.alerts.length > 0) {
      for (const alert of scoreResult.fraud_analysis.alerts) {
        await supabase.from('behavior_anomalies').insert({
          user_id: keyValidation.userId,
          anomaly_type: alert.type,
          severity: alert.severity === 'high' ? 'high' : 'medium',
          description: alert.description,
          detection_method: 'w-score-engine',
        });
      }
    }

    // Save to scoring_requests with all enriched data
    const { data: scoringRequest } = await supabase.from('scoring_requests').insert({
      user_id: keyValidation.userId,
      full_name: body.full_name,
      national_id: body.national_id,
      phone_number: body.phone_number,
      monthly_income: body.monthly_income,
      monthly_expenses: body.monthly_expenses,
      existing_loans: body.existing_loans,
      employment_type: body.employment_type,
      years_in_business: body.years_in_business,
      sector: body.sector,
      sim_age_months: body.sim_age_months,
      rccm_number: body.rccm_number,
      region: body.region,
      city: body.city,
      utility_payments_on_time: body.utility_payments_on_time,
      utility_payments_late: body.utility_payments_late,
      mobile_money_transactions: body.momo_transaction_count,
      mobile_money_volume: (body.momo_total_in || 0) + (body.momo_total_out || 0),
      score: scoreResult.final_score,
      grade: scoreResult.grade,
      risk_category: scoreResult.risk_tier,
      confidence: scoreResult.confidence,
      reliability_score: scoreResult.sub_scores.identity_stability.score,
      stability_score: scoreResult.sub_scores.financial_discipline.score,
      engagement_capacity_score: scoreResult.sub_scores.social_capital.score,
      processing_time_ms: scoreResult.processing_time_ms,
      model_version: scoreResult.model_version,
      status: 'completed',
      // New enriched fields
      data_quality: scoreResult.data_quality,
      sub_scores: {
        identity: { name: 'Identité & Stabilité', value: scoreResult.sub_scores.identity_stability.score, weight: 0.20, factors: scoreResult.sub_scores.identity_stability.factors.map(f => f.name) },
        cashflow: { name: 'Cashflow', value: scoreResult.sub_scores.cashflow_consistency.score, weight: 0.25, factors: scoreResult.sub_scores.cashflow_consistency.factors.map(f => f.name) },
        behavior: { name: 'Comportement', value: scoreResult.sub_scores.behavioral_psychometric.score, weight: 0.10, factors: scoreResult.sub_scores.behavioral_psychometric.factors.map(f => f.name) },
        discipline: { name: 'Discipline Financière', value: scoreResult.sub_scores.financial_discipline.score, weight: 0.22, factors: scoreResult.sub_scores.financial_discipline.factors.map(f => f.name) },
        social: { name: 'Capital Social', value: scoreResult.sub_scores.social_capital.score, weight: 0.15, factors: scoreResult.sub_scores.social_capital.factors.map(f => f.name) },
        environment: { name: 'Environnement', value: scoreResult.sub_scores.environmental_adjustment.score, weight: 0.08, factors: scoreResult.sub_scores.environmental_adjustment.factors.map(f => f.name) },
      },
      positive_factors: scoreResult.explainability.positive_factors.map(f => ({
        name: f.factor.replace(/_/g, ' '),
        impact: 'positive',
        contribution: Math.round(f.impact * 10),
        description: f.description,
      })),
      negative_factors: scoreResult.explainability.negative_factors.map(f => ({
        name: f.factor.replace(/_/g, ' '),
        impact: 'negative',
        contribution: -Math.round(f.impact * 10),
        description: f.description,
      })),
      improvement_suggestions: scoreResult.explainability.improvement_suggestions.map(s => ({
        action: s.action,
        potential_gain: s.potential_gain,
        difficulty: s.potential_gain >= 15 ? 'hard' : s.potential_gain >= 8 ? 'medium' : 'easy',
        timeframe: s.potential_gain >= 15 ? '3-6 mois' : '1-3 mois',
      })),
      fraud_analysis: {
        fraud_score: scoreResult.fraud_analysis.fraud_score,
        risk_level: scoreResult.fraud_analysis.risk_level,
        alerts: scoreResult.fraud_analysis.alerts.map(a => ({
          rule: a.type,
          severity: a.severity === 'high' ? 'high' : a.severity === 'warning' ? 'medium' : 'low',
          triggered: true,
          description: a.description,
          score_impact: a.type === 'income_inflation' ? 25 : a.type === 'unsustainable_expenses' ? 15 : 10,
        })),
      },
      credit_recommendation: {
        decision: scoreResult.credit_recommendation.approved 
          ? (scoreResult.risk_tier === 'prime' || scoreResult.risk_tier === 'near_prime' ? 'approved' : 'manual_review')
          : 'rejected',
        max_amount: scoreResult.credit_recommendation.max_amount,
        max_duration_months: scoreResult.credit_recommendation.max_tenor_months,
        suggested_rate: scoreResult.credit_recommendation.suggested_rate,
        conditions: scoreResult.credit_recommendation.conditions,
        rationale: scoreResult.credit_recommendation.approved 
          ? `Score ${scoreResult.grade} (${scoreResult.final_score}/100) - Profil ${scoreResult.risk_tier}`
          : `Score insuffisant (${scoreResult.final_score}/100) - Risque ${scoreResult.risk_tier}`,
      },
    }).select().single();

    const response = {
      success: true,
      data: {
        ...scoreResult,
        scoring_request_id: scoringRequest?.id || null,
      },
    };

    const processingTime = Date.now() - startTime;

    await logApiCall(supabase, {
      apiKeyId: keyValidation.keyId!,
      userId: keyValidation.userId!,
      endpoint: '/wouaka-score',
      method: 'POST',
      statusCode: 200,
      requestBody: { ...body, national_id: body.national_id ? '***' : undefined },
      responseBody: { score_id: scoreResult.score_id, final_score: scoreResult.final_score },
      processingTimeMs: processingTime,
    });

    // Trigger webhook
    await triggerWebhooks(supabase, keyValidation.userId!, 'score.calculated', {
      score_id: scoreResult.score_id,
      scoring_request_id: scoringRequest?.id || null,
      final_score: scoreResult.final_score,
      grade: scoreResult.grade,
      risk_tier: scoreResult.risk_tier,
      calculated_at: scoreResult.calculated_at,
    });

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Processing-Time': `${processingTime}ms`,
          'X-Score-ID': scoreResult.score_id,
        },
      }
    );
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Wouaka Score Error:', error);

    await logApiCall(supabase, {
      apiKeyId: keyValidation.keyId!,
      userId: keyValidation.userId!,
      endpoint: '/wouaka-score',
      method: 'POST',
      statusCode: 400,
      responseBody: { error: (error as Error).message },
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({ error: 'Invalid request', details: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
