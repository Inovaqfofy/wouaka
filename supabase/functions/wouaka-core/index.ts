// ============================================
// WOUAKA CORE API - Edge Function
// Unified KYC + Scoring for UEMOA
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

interface CoreRequest {
  reference_id: string;
  
  // KYC
  kyc_level: 'basic' | 'enhanced' | 'advanced';
  national_id: string;
  full_name: string;
  date_of_birth: string;
  phone_number?: string;
  address?: string;
  country?: string;
  document_type?: string;
  document_number?: string;
  document_expiry?: string;
  selfie_match_score?: number;
  liveness_passed?: boolean;
  
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
  
  // Location
  region?: string;
  city?: string;
  
  // Consent
  consent_data_processing: boolean;
  consent_timestamp: string;
}

// ============================================
// KYC ENGINE (INLINE)
// ============================================

function performKycCheck(input: CoreRequest): {
  kyc_id: string;
  status: 'verified' | 'pending' | 'rejected' | 'requires_review';
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  checks: Record<string, { passed: boolean; message: string; confidence: number }>;
  fraud_indicators: { indicator: string; detected: boolean; confidence: number }[];
  processing_time_ms: number;
} {
  const startTime = Date.now();
  const checks: Record<string, { passed: boolean; message: string; confidence: number }> = {};
  
  // ID validation
  const idValid = input.national_id && input.national_id.length >= 6;
  checks.id_format = { passed: !!idValid, message: idValid ? 'ID valide' : 'ID invalide', confidence: idValid ? 85 : 20 };
  
  // Name validation
  const nameParts = (input.full_name || '').trim().split(/\s+/);
  const nameValid = nameParts.length >= 2;
  checks.name_format = { passed: nameValid, message: nameValid ? 'Nom complet' : 'Nom incomplet', confidence: nameValid ? 90 : 40 };
  
  // Age validation
  const birthDate = new Date(input.date_of_birth);
  const age = (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const ageValid = age >= 18 && age <= 100;
  checks.age = { passed: ageValid, message: ageValid ? 'Âge valide' : 'Âge invalide', confidence: ageValid ? 95 : 10 };
  
  // Phone validation
  const phonePattern = /^(\+?2[0-9]{2}|0)[0-9]{8,9}$/;
  const phoneValid = !input.phone_number || phonePattern.test(input.phone_number.replace(/\s/g, ''));
  checks.phone = { passed: phoneValid, message: phoneValid ? 'Téléphone valide' : 'Téléphone invalide', confidence: phoneValid ? 80 : 30 };
  
  // Document expiry
  if (input.document_expiry) {
    const expiry = new Date(input.document_expiry);
    const isExpired = expiry < new Date();
    checks.document_expiry = { passed: !isExpired, message: isExpired ? 'Document expiré' : 'Document valide', confidence: isExpired ? 95 : 90 };
  }
  
  // Selfie match
  if (input.selfie_match_score !== undefined) {
    const selfiePass = input.selfie_match_score >= 0.7;
    checks.selfie = { passed: selfiePass, message: selfiePass ? 'Selfie correspond' : 'Selfie non correspondant', confidence: Math.round(input.selfie_match_score * 100) };
  }
  
  // Fraud indicators
  const fraudIndicators: { indicator: string; detected: boolean; confidence: number }[] = [];
  
  // All same digits
  const allSame = /^(.)\1+$/.test(input.national_id || '');
  fraudIndicators.push({ indicator: 'ID chiffres identiques', detected: allSame, confidence: 95 });
  
  // Suspicious name
  const suspiciousNames = ['test', 'fake', 'xxx'];
  const hasSuspicious = suspiciousNames.some(s => (input.full_name || '').toLowerCase().includes(s));
  fraudIndicators.push({ indicator: 'Nom suspect', detected: hasSuspicious, confidence: 85 });
  
  // Calculate risk score
  let score = 0;
  let weight = 0;
  for (const check of Object.values(checks)) {
    score += (check.passed ? check.confidence : 100 - check.confidence);
    weight += 1;
  }
  
  let riskScore = weight > 0 ? score / weight : 50;
  
  // Apply fraud penalty
  for (const indicator of fraudIndicators) {
    if (indicator.detected) {
      riskScore -= indicator.confidence * 0.3;
    }
  }
  
  riskScore = Math.max(0, Math.min(100, riskScore));
  
  // Determine status
  const allPassed = Object.values(checks).every(c => c.passed);
  const criticalFraud = fraudIndicators.filter(f => f.detected && f.confidence > 80);
  
  let status: 'verified' | 'pending' | 'rejected' | 'requires_review';
  if (criticalFraud.length > 0) {
    status = 'rejected';
  } else if (riskScore >= 80 && allPassed) {
    status = 'verified';
  } else if (riskScore < 40) {
    status = 'rejected';
  } else {
    status = 'requires_review';
  }
  
  // Risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (riskScore >= 80) riskLevel = 'low';
  else if (riskScore >= 60) riskLevel = 'medium';
  else if (riskScore >= 40) riskLevel = 'high';
  else riskLevel = 'critical';
  
  return {
    kyc_id: crypto.randomUUID(),
    status,
    risk_score: Math.round(riskScore),
    risk_level: riskLevel,
    checks,
    fraud_indicators: fraudIndicators,
    processing_time_ms: Date.now() - startTime,
  };
}

// ============================================
// SCORING ENGINE (INLINE)
// ============================================

function calculateScore(input: CoreRequest, kycScore: number): {
  score_id: string;
  final_score: number;
  grade: string;
  risk_tier: string;
  confidence: number;
  sub_scores: Record<string, { score: number; confidence: number }>;
  credit_recommendation: {
    approved: boolean;
    max_amount: number;
    max_tenor_months: number;
    conditions: string[];
  };
  fraud_score: number;
  processing_time_ms: number;
} {
  const startTime = Date.now();
  
  // Calculate features
  const income = input.monthly_income || 0;
  const expenses = input.monthly_expenses || 0;
  const simAge = input.sim_age_months || 0;
  const isFormalized = !!input.rccm_number;
  
  const utilityOnTime = input.utility_payments_on_time || 0;
  const utilityLate = input.utility_payments_late || 0;
  const utilityTotal = utilityOnTime + utilityLate;
  const utilityRate = utilityTotal > 0 ? utilityOnTime / utilityTotal : 0.5;
  
  const momoIn = input.momo_total_in || 0;
  const momoOut = input.momo_total_out || 0;
  const momoDays = input.momo_period_days || 30;
  const momoVelocity = (input.momo_transaction_count || 0) / momoDays * 30;
  
  // Sub-scores
  const subScores: Record<string, { score: number; confidence: number }> = {};
  
  // Identity
  let idScore = 50;
  let idConf = 30;
  if (simAge > 0) { idScore += Math.min(30, simAge / 24 * 30); idConf += 30; }
  if (isFormalized) { idScore += 20; idConf += 30; }
  idScore = Math.max(0, Math.min(100, idScore + (kycScore - 50) * 0.3));
  subScores.identity = { score: Math.round(idScore), confidence: Math.min(100, idConf) };
  
  // Cashflow
  let cfScore = 50;
  let cfConf = 20;
  if (income > 0) { cfScore += 15; cfConf += 30; }
  if (income > expenses) { cfScore += 15; cfConf += 20; }
  if (momoVelocity > 5) { cfScore += 10; cfConf += 20; }
  subScores.cashflow = { score: Math.round(Math.min(100, cfScore)), confidence: Math.min(100, cfConf) };
  
  // Discipline
  let discScore = 50;
  let discConf = 20;
  if (utilityRate > 0.8) { discScore += 25; discConf += 40; }
  else if (utilityRate > 0.6) { discScore += 10; discConf += 30; }
  subScores.discipline = { score: Math.round(Math.min(100, discScore)), confidence: Math.min(100, discConf) };
  
  // Social
  let socScore = 40;
  let socConf = 20;
  if (input.tontine_participation) { socScore += 25; socConf += 30; }
  if (input.cooperative_member) { socScore += 15; socConf += 20; }
  if ((input.guarantor_count || 0) > 0) { socScore += 15; socConf += 20; }
  subScores.social = { score: Math.round(Math.min(100, socScore)), confidence: Math.min(100, socConf) };
  
  // Final score
  const weights = { identity: 0.25, cashflow: 0.30, discipline: 0.25, social: 0.20 };
  let finalScore = 0;
  let totalWeight = 0;
  let avgConf = 0;
  
  for (const [key, w] of Object.entries(weights)) {
    const sub = subScores[key];
    const adj = w * (sub.confidence / 100);
    finalScore += sub.score * adj;
    totalWeight += adj;
    avgConf += sub.confidence;
  }
  
  finalScore = totalWeight > 0 ? finalScore / totalWeight : 50;
  avgConf = avgConf / Object.keys(weights).length;
  
  // Fraud detection
  let fraudScore = 0;
  if (income > 0 && momoIn > 0) {
    const declaredMonthly = income;
    const momoMonthly = momoIn / momoDays * 30 * 0.7;
    if (declaredMonthly > momoMonthly * 2) fraudScore += 25;
  }
  if (income > 0 && expenses > income * 1.5) fraudScore += 15;
  
  finalScore = Math.max(0, finalScore - fraudScore * 0.4);
  finalScore = Math.round(finalScore);
  
  // Risk tier
  const tiers = [
    { tier: 'prime', grade: 'A+', min: 85, mult: 6, tenor: 36 },
    { tier: 'near_prime', grade: 'A', min: 75, mult: 5, tenor: 30 },
    { tier: 'standard_plus', grade: 'B+', min: 65, mult: 4, tenor: 24 },
    { tier: 'standard', grade: 'B', min: 55, mult: 3, tenor: 18 },
    { tier: 'subprime', grade: 'C', min: 45, mult: 2, tenor: 12 },
    { tier: 'high_risk', grade: 'D', min: 30, mult: 1.5, tenor: 6 },
    { tier: 'decline', grade: 'E', min: 0, mult: 0, tenor: 0 },
  ];
  
  const tier = tiers.find(t => finalScore >= t.min) || tiers[tiers.length - 1];
  
  const conditions: string[] = [];
  if (tier.tier === 'subprime' || tier.tier === 'high_risk') {
    conditions.push('Garanties requises');
    conditions.push('Suivi renforcé');
  }
  if (fraudScore > 15) {
    conditions.push('Vérification manuelle');
  }
  
  return {
    score_id: crypto.randomUUID(),
    final_score: finalScore,
    grade: tier.grade,
    risk_tier: tier.tier,
    confidence: Math.round(avgConf),
    sub_scores: subScores,
    credit_recommendation: {
      approved: tier.mult > 0,
      max_amount: Math.round(income * tier.mult),
      max_tenor_months: tier.tenor,
      conditions,
    },
    fraud_score: fraudScore,
    processing_time_ms: Date.now() - startTime,
  };
}

// ============================================
// COMBINED RISK
// ============================================

function calculateCombinedRisk(
  kycRiskScore: number,
  kycRiskLevel: string,
  creditScore: number,
  fraudScore: number
): {
  overall_risk: 'low' | 'medium' | 'high' | 'critical';
  recommendation: 'approve' | 'review' | 'reject';
  conditions: string[];
} {
  const kycRisk = 100 - kycRiskScore;
  const creditRisk = 100 - creditScore;
  
  const weightedRisk = kycRisk * 0.35 + creditRisk * 0.40 + fraudScore * 0.25;
  
  let overallRisk: 'low' | 'medium' | 'high' | 'critical';
  if (weightedRisk < 25) overallRisk = 'low';
  else if (weightedRisk < 50) overallRisk = 'medium';
  else if (weightedRisk < 75) overallRisk = 'high';
  else overallRisk = 'critical';
  
  let recommendation: 'approve' | 'review' | 'reject';
  const conditions: string[] = [];
  
  if (kycRiskLevel === 'critical' || fraudScore > 40) {
    recommendation = 'reject';
    conditions.push('Risque critique');
  } else if (kycRiskLevel === 'low' && creditScore >= 70 && fraudScore < 15) {
    recommendation = 'approve';
    conditions.push('Profil satisfaisant');
  } else {
    recommendation = 'review';
    if (kycRiskLevel === 'high') conditions.push('Vérification KYC requise');
    if (creditScore < 55) conditions.push('Score crédit faible');
    if (fraudScore >= 15) conditions.push('Alertes à investiguer');
  }
  
  return { overall_risk: overallRisk, recommendation, conditions };
}

// ============================================
// API KEY VALIDATION
// ============================================

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

  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyData.id);

  return { valid: true, userId: keyData.user_id, keyId: keyData.id, permissions: keyData.permissions || [], authType: 'api_key' };
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

async function logApiCall(supabase: any, params: any) {
  await supabase.from('api_calls').insert(params);
}

async function triggerWebhooks(supabase: any, userId: string, eventType: string, payload: any) {
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .contains('events', [eventType]);

  if (!webhooks?.length) return;

  for (const webhook of webhooks) {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': webhook.secret, 'X-Event-Type': eventType },
        body: JSON.stringify(payload),
      });
      await supabase.from('webhook_deliveries').insert({ webhook_id: webhook.id, event_type: eventType, payload, status_code: response.status, delivered_at: new Date().toISOString() });
    } catch (error) {
      await supabase.from('webhook_deliveries').insert({ webhook_id: webhook.id, event_type: eventType, payload, status_code: 0, response_body: (error as Error).message });
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
  const killSwitchStatus = await checkKillSwitch('kyc_processing', supabaseUrl, supabaseServiceKey);
  if (!killSwitchStatus.allowed) {
    console.warn('[Wouaka Core] Request blocked by Kill Switch:', killSwitchStatus.reason);
    await logBlockedRequest('kyc_processing', killSwitchStatus.reason || 'unknown', killSwitchStatus.message || '', req, supabaseUrl, supabaseServiceKey);
    return createBlockedResponse(killSwitchStatus);
  }
  // ========================================

  // Authenticate via API key OR JWT
  const authResult = await authenticate(supabase, req);

  if (!authResult.valid) {
    return new Response(JSON.stringify({ error: 'Authentication required', code: 'AUTH_REQUIRED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Check permissions (skip for JWT internal calls)
  if (authResult.authType === 'api_key') {
    if (!authResult.permissions?.includes('kyc') || !authResult.permissions?.includes('score')) {
      return new Response(JSON.stringify({ error: 'Requires both kyc and score permissions', code: 'INSUFFICIENT_PERMISSIONS' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  const keyValidation = authResult;

  try {
    const body: CoreRequest = await req.json();

    // Validate required
    if (!body.reference_id || !body.national_id || !body.full_name || !body.date_of_birth) {
      return new Response(JSON.stringify({ error: 'Missing required fields: reference_id, national_id, full_name, date_of_birth' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!body.consent_data_processing) {
      return new Response(JSON.stringify({ error: 'Consent required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Timeline
    const timeline: { step: string; timestamp: string; duration_ms?: number }[] = [];
    const requestId = crypto.randomUUID();
    
    // Save consent log
    await supabase.from('consent_logs').insert({
      user_id: keyValidation.userId,
      consent_type: 'data_processing',
      consent_given: true,
      consent_text: 'Processing KYC and scoring data',
      ip_address: req.headers.get('x-forwarded-for') || null,
      user_agent: req.headers.get('user-agent') || null,
    });
    
    // Step 1: KYC
    const kycStart = Date.now();
    const kycResult = performKycCheck(body);
    timeline.push({ step: 'kyc', timestamp: new Date().toISOString(), duration_ms: Date.now() - kycStart });

    // Save user identity to structured table
    const { data: identityData } = await supabase.from('user_identities').insert({
      user_id: keyValidation.userId,
      full_name: body.full_name,
      date_of_birth: body.date_of_birth,
      nationality: body.country || 'CI',
      document_type: body.document_type || 'cni',
      document_number: body.document_number || body.national_id,
      document_expiry: body.document_expiry || null,
      issuing_country: body.country || 'CI',
      ocr_confidence: kycResult.checks?.id_format?.confidence || null,
      verified: kycResult.status === 'verified',
      verified_at: kycResult.status === 'verified' ? new Date().toISOString() : null,
    }).select().single();

    // Save address if provided
    if (body.address || body.city || body.region) {
      await supabase.from('user_addresses').insert({
        user_id: keyValidation.userId,
        address_type: 'home',
        street_address: body.address || null,
        city: body.city || null,
        region: body.region || null,
        country: body.country || 'CI',
        is_current: true,
      });
    }

    // Step 2: Scoring (if KYC not rejected)
    let scoreResult = null;
    if (kycResult.status !== 'rejected') {
      const scoreStart = Date.now();
      scoreResult = calculateScore(body, kycResult.risk_score);
      timeline.push({ step: 'scoring', timestamp: new Date().toISOString(), duration_ms: Date.now() - scoreStart });

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
        for (let i = 0; i < body.guarantor_count; i++) {
          await supabase.from('user_guarantors').insert({
            user_id: keyValidation.userId,
            guarantor_name: `Garant ${i + 1}`,
            relationship: 'other',
          });
        }
      }

      // Save raw features
      const features = [
        { feature_id: 'monthly_income', category: 'financial', raw_value: body.monthly_income || 0 },
        { feature_id: 'monthly_expenses', category: 'financial', raw_value: body.monthly_expenses || 0 },
        { feature_id: 'sim_age_months', category: 'identity', raw_value: body.sim_age_months || 0 },
        { feature_id: 'utility_on_time', category: 'behavioral', raw_value: body.utility_payments_on_time || 0 },
        { feature_id: 'utility_late', category: 'behavioral', raw_value: body.utility_payments_late || 0 },
        { feature_id: 'momo_velocity', category: 'financial', raw_value: (body.momo_transaction_count || 0) / (body.momo_period_days || 30) * 30 },
      ];

      for (const feat of features) {
        await supabase.from('score_raw_features').insert({
          user_id: keyValidation.userId,
          feature_id: feat.feature_id,
          feature_name: feat.feature_id.replace(/_/g, ' '),
          category: feat.category,
          raw_value: feat.raw_value,
          source: 'api_input',
          confidence: 80,
          is_missing: feat.raw_value === 0,
        });
      }

      // Save score history
      await supabase.from('score_history').insert({
        user_id: keyValidation.userId,
        score_value: scoreResult.final_score,
        grade: scoreResult.grade,
        risk_tier: scoreResult.risk_tier,
        sub_scores: scoreResult.sub_scores,
        data_quality: scoreResult.confidence >= 70 ? 'good' : scoreResult.confidence >= 50 ? 'fair' : 'poor',
        data_sources_count: Object.keys(body).filter(k => body[k as keyof CoreRequest] !== undefined).length,
        trigger_event: 'api_request',
        model_version: 'v1.0.0',
      });
    }

    // Step 3: Combined risk
    const combinedRisk = calculateCombinedRisk(
      kycResult.risk_score,
      kycResult.risk_level,
      scoreResult?.final_score || 50,
      scoreResult?.fraud_score || 0
    );
    timeline.push({ step: 'decision', timestamp: new Date().toISOString() });

    // Save fraud analysis if relevant
    if (scoreResult && scoreResult.fraud_score > 0) {
      await supabase.from('behavior_anomalies').insert({
        user_id: keyValidation.userId,
        anomaly_type: 'fraud_detection',
        severity: scoreResult.fraud_score >= 30 ? 'high' : scoreResult.fraud_score >= 15 ? 'medium' : 'low',
        description: 'Anomalies détectées lors du scoring',
        observed_value: scoreResult.fraud_score,
        detection_method: 'w-score-engine',
      });
    }

    // Save to scoring_requests for backward compatibility
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
      mobile_money_transactions: body.momo_transaction_count,
      mobile_money_volume: (body.momo_total_in || 0) + (body.momo_total_out || 0),
      utility_payments_on_time: body.utility_payments_on_time,
      utility_payments_late: body.utility_payments_late,
      sim_age_months: body.sim_age_months,
      rccm_number: body.rccm_number,
      region: body.region,
      city: body.city,
      score: scoreResult?.final_score || null,
      grade: scoreResult?.grade || null,
      confidence: scoreResult?.confidence || null,
      risk_category: combinedRisk.overall_risk,
      reliability_score: scoreResult?.sub_scores?.identity?.score || null,
      stability_score: scoreResult?.sub_scores?.discipline?.score || null,
      engagement_capacity_score: scoreResult?.sub_scores?.social?.score || null,
      status: combinedRisk.recommendation === 'reject' ? 'rejected' : combinedRisk.recommendation === 'approve' ? 'completed' : 'pending',
      processing_time_ms: Date.now() - startTime,
      model_version: 'v1.0.0',
    }).select().single();

    const processingTime = Date.now() - startTime;

    const response = {
      success: true,
      data: {
        request_id: requestId,
        reference_id: body.reference_id,
        status: combinedRisk.recommendation === 'reject' ? 'rejected' : combinedRisk.recommendation === 'approve' ? 'completed' : 'pending_review',
        
        kyc: {
          kyc_id: kycResult.kyc_id,
          identity_id: identityData?.id || null,
          level: body.kyc_level || 'basic',
          status: kycResult.status,
          risk_score: kycResult.risk_score,
          risk_level: kycResult.risk_level,
          checks: kycResult.checks,
          fraud_indicators: kycResult.fraud_indicators,
        },
        
        score: scoreResult ? {
          score_id: scoreResult.score_id,
          final_score: scoreResult.final_score,
          grade: scoreResult.grade,
          risk_tier: scoreResult.risk_tier,
          confidence: scoreResult.confidence,
          sub_scores: scoreResult.sub_scores,
          credit_recommendation: scoreResult.credit_recommendation,
        } : null,
        
        combined_risk: {
          overall_risk: combinedRisk.overall_risk,
          recommendation: combinedRisk.recommendation,
          conditions: combinedRisk.conditions,
        },
        
        timeline,
        processing_time_ms: processingTime,
        version: '1.0.0',
        calculated_at: new Date().toISOString(),
      },
    };

    // Log
    await logApiCall(supabase, {
      api_key_id: keyValidation.keyId,
      user_id: keyValidation.userId,
      endpoint: '/wouaka-core',
      method: 'POST',
      status_code: 200,
      request_body: { reference_id: body.reference_id },
      response_body: { request_id: response.data.request_id, status: response.data.status },
      processing_time_ms: processingTime,
    });

    // Webhooks
    const events: string[] = [];
    if (kycResult.status === 'verified') events.push('kyc.verified');
    else if (kycResult.status === 'rejected') events.push('kyc.failed');
    if (scoreResult) events.push('score.calculated');
    if (combinedRisk.recommendation === 'approve') events.push('decision.approved');
    else if (combinedRisk.recommendation === 'reject') events.push('decision.rejected');
    else events.push('decision.pending_review');

    for (const evt of events) {
      await triggerWebhooks(supabase, keyValidation.userId!, evt, {
        request_id: response.data.request_id,
        reference_id: body.reference_id,
        event: evt,
        timestamp: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Processing-Time': `${processingTime}ms`, 'X-Request-ID': response.data.request_id },
    });

  } catch (error) {
    console.error('Wouaka Core Error:', error);
    return new Response(JSON.stringify({ error: 'Invalid request', details: (error as Error).message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
