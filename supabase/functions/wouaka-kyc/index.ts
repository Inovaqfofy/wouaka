// ============================================
// W-KYC API - Edge Function
// Sovereign KYC System for UEMOA
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

// ============================================
// TYPES
// ============================================

type KycLevel = 'basic' | 'enhanced' | 'advanced';
type KycDocumentType = 'cni' | 'passport' | 'carte_sejour' | 'proof_of_address' | 'utility_bill' | 'bank_statement';
type Country = 'SN' | 'CI' | 'ML' | 'BF' | 'TG' | 'BJ' | 'NE' | 'GW';

interface KycRequest {
  level: KycLevel;
  national_id: string;
  full_name: string;
  date_of_birth: string;
  phone_number?: string;
  address?: string;
  country?: Country;
  document_type?: KycDocumentType;
  document_number?: string;
  document_expiry?: string;
  selfie_match_score?: number;
  liveness_passed?: boolean;
  ocr_data?: Record<string, unknown>;
  device_info?: {
    device_id?: string;
    device_type?: string;
    os?: string;
  };
}

interface KycRiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  weight: number;
}

interface VerificationPerformed {
  name: string;
  status: 'passed' | 'failed' | 'pending' | 'skipped';
  confidence: number;
  details: string;
}

interface FraudIndicatorResult {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  score_impact: number;
  detected: boolean;
  confidence: number;
}

interface KycResult {
  kyc_id: string;
  level: KycLevel;
  status: 'verified' | 'pending' | 'rejected' | 'requires_review' | 'documents_required';
  identity_score: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: KycRiskFactor[];
  risk_flags: string[];
  fraud_score: number;
  fraud_indicators: FraudIndicatorResult[];
  verifications_performed: VerificationPerformed[];
  verified_identity: {
    full_name: string;
    date_of_birth: string;
    document_number?: string;
    country?: string;
  };
  checks: Record<string, { passed: boolean; message: string; confidence: number }>;
  documents_required: string[];
  documents_submitted: number;
  documents_verified: number;
  processing_time_ms: number;
  checked_at: string;
  manual_review_required: boolean;
  rejection_reason?: string;
  explainability: {
    score_breakdown: { component: string; points: number; max_points: number; description: string }[];
    positive_factors: { factor: string; impact: number; description: string }[];
    negative_factors: { factor: string; impact: number; description: string }[];
  };
}

// ============================================
// KYC LEVEL CONFIGS
// ============================================

const KYC_LEVEL_CONFIGS = {
  basic: {
    requires_selfie: true,
    requires_liveness: false,
    requires_address: false,
    auto_approve_threshold: 85,
    min_document_confidence: 60,
  },
  enhanced: {
    requires_selfie: true,
    requires_liveness: true,
    requires_address: true,
    auto_approve_threshold: 80,
    min_document_confidence: 70,
  },
  advanced: {
    requires_selfie: true,
    requires_liveness: true,
    requires_address: true,
    auto_approve_threshold: 90,
    min_document_confidence: 80,
  },
};

// ============================================
// UEMOA ID PATTERNS
// ============================================

const UEMOA_ID_PATTERNS: Record<Country, { pattern: RegExp; name: string }> = {
  SN: { pattern: /^[0-9]{13}$/, name: 'CNI Sénégalaise' },
  CI: { pattern: /^C[0-9]{9}$|^[0-9]{9}$/, name: 'CNI Ivoirienne' },
  ML: { pattern: /^[0-9]{10,12}$/, name: 'CNI Malienne' },
  BF: { pattern: /^[A-Z][0-9]{7,9}$/, name: 'CNI Burkinabè' },
  TG: { pattern: /^[0-9]{8,10}$/, name: 'CNI Togolaise' },
  BJ: { pattern: /^[0-9]{10,12}$/, name: 'CNI Béninoise' },
  NE: { pattern: /^[0-9]{8,10}$/, name: 'CNI Nigérienne' },
  GW: { pattern: /^[0-9]{8,11}$/, name: 'BI Guinéenne' },
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================

function validateIdFormat(nationalId: string, country?: Country): { valid: boolean; confidence: number; message: string } {
  if (!nationalId || nationalId.length < 6) {
    return { valid: false, confidence: 0, message: 'ID trop court' };
  }

  if (country && UEMOA_ID_PATTERNS[country]) {
    const { pattern, name } = UEMOA_ID_PATTERNS[country];
    const matches = pattern.test(nationalId);
    return {
      valid: matches,
      confidence: matches ? 90 : 40,
      message: matches ? `Format ${name} valide` : `Format ${name} non conforme`,
    };
  }

  // Generic validation
  const hasValidChars = /^[A-Z0-9]{6,15}$/i.test(nationalId);
  return {
    valid: hasValidChars,
    confidence: hasValidChars ? 70 : 30,
    message: hasValidChars ? 'Format ID acceptable' : 'Format ID invalide',
  };
}

function validateName(fullName: string): { valid: boolean; confidence: number; message: string } {
  if (!fullName || fullName.trim().length < 3) {
    return { valid: false, confidence: 0, message: 'Nom trop court' };
  }

  const nameParts = fullName.trim().split(/\s+/);
  const hasMultipleParts = nameParts.length >= 2;
  const hasValidChars = /^[A-Za-zÀ-ÿ\s'-]+$/.test(fullName);

  return {
    valid: hasMultipleParts && hasValidChars,
    confidence: hasMultipleParts ? 85 : 50,
    message: hasMultipleParts ? 'Nom complet valide' : 'Nom et prénom requis',
  };
}

function validateAge(dateOfBirth: string): { valid: boolean; confidence: number; message: string; age?: number } {
  if (!dateOfBirth) {
    return { valid: false, confidence: 0, message: 'Date de naissance requise' };
  }

  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) {
    return { valid: false, confidence: 0, message: 'Date de naissance invalide' };
  }

  const age = (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  if (age < 18) {
    return { valid: false, confidence: 95, message: 'Doit avoir 18 ans ou plus', age: Math.floor(age) };
  }
  if (age > 100) {
    return { valid: false, confidence: 80, message: 'Âge improbable', age: Math.floor(age) };
  }

  return { valid: true, confidence: 90, message: 'Âge vérifié (18+)', age: Math.floor(age) };
}

function validatePhone(phoneNumber?: string): { valid: boolean; confidence: number; message: string } {
  if (!phoneNumber) {
    return { valid: true, confidence: 50, message: 'Téléphone non fourni' };
  }

  // UEMOA phone patterns
  const uemoaPattern = /^(\+?2[0-9]{2}|0)[0-9]{8,9}$/;
  const matches = uemoaPattern.test(phoneNumber.replace(/\s/g, ''));

  return {
    valid: matches,
    confidence: matches ? 85 : 40,
    message: matches ? 'Format téléphone UEMOA valide' : 'Format téléphone non conforme',
  };
}

function validateDocumentExpiry(expiryDate?: string): { valid: boolean; confidence: number; message: string } {
  if (!expiryDate) {
    return { valid: true, confidence: 60, message: 'Date expiration non fournie' };
  }

  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) {
    return { valid: false, confidence: 0, message: 'Date expiration invalide' };
  }

  const now = new Date();
  const monthsUntilExpiry = (expiry.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000);

  if (monthsUntilExpiry < 0) {
    return { valid: false, confidence: 95, message: 'Document expiré' };
  }
  if (monthsUntilExpiry < 3) {
    return { valid: true, confidence: 70, message: 'Document expire bientôt' };
  }

  return { valid: true, confidence: 90, message: 'Document valide' };
}

// ============================================
// FRAUD DETECTION
// ============================================

function detectFraudIndicators(input: KycRequest): FraudIndicatorResult[] {
  const indicators: FraudIndicatorResult[] = [];

  // Check for suspicious patterns
  const idStr = input.national_id || '';
  
  // All same digits
  const allSameDigits = /^(.)\1+$/.test(idStr);
  indicators.push({
    type: 'id_same_digits',
    severity: 'high',
    description: 'Numéro ID contient uniquement des chiffres identiques',
    score_impact: 25,
    detected: allSameDigits,
    confidence: 95,
  });

  // Sequential digits
  const sequential = '0123456789'.includes(idStr) || '9876543210'.includes(idStr);
  indicators.push({
    type: 'id_sequential',
    severity: 'high',
    description: 'Numéro ID séquentiel détecté',
    score_impact: 20,
    detected: sequential && idStr.length >= 5,
    confidence: 90,
  });

  // Name contains suspicious patterns
  const nameStr = input.full_name || '';
  const suspiciousNames = ['test', 'fake', 'xxx', 'aaa', 'admin'];
  const hasSuspiciousName = suspiciousNames.some(s => nameStr.toLowerCase().includes(s));
  indicators.push({
    type: 'suspicious_name',
    severity: 'medium',
    description: 'Nom contient des motifs suspects (test, fake, etc.)',
    score_impact: 15,
    detected: hasSuspiciousName,
    confidence: 85,
  });

  // Very low selfie match
  if (input.selfie_match_score !== undefined) {
    indicators.push({
      type: 'selfie_mismatch',
      severity: input.selfie_match_score < 0.3 ? 'critical' : 'high',
      description: 'Correspondance faciale insuffisante entre selfie et document',
      score_impact: input.selfie_match_score < 0.3 ? 30 : 20,
      detected: input.selfie_match_score < 0.5,
      confidence: input.selfie_match_score < 0.3 ? 95 : 75,
    });
  }

  // Liveness failed
  if (input.liveness_passed !== undefined) {
    indicators.push({
      type: 'liveness_failed',
      severity: 'high',
      description: 'Échec de la détection de vivacité - possible utilisation de photo',
      score_impact: 25,
      detected: !input.liveness_passed,
      confidence: 90,
    });
  }

  return indicators;
}

// ============================================
// RISK SCORING
// ============================================

function calculateKycRiskScore(
  checks: Record<string, { passed: boolean; message: string; confidence: number }>,
  fraudIndicators: FraudIndicatorResult[],
  level: KycLevel
): { score: number; risk_level: 'low' | 'medium' | 'high' | 'critical'; risk_factors: KycRiskFactor[] } {
  const riskFactors: KycRiskFactor[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  // Score from checks
  const checkWeights: Record<string, number> = {
    id_format: 0.25,
    name_format: 0.15,
    age_verification: 0.20,
    phone_format: 0.10,
    document_expiry: 0.15,
    selfie_match: 0.10,
    liveness: 0.05,
  };

  for (const [checkName, check] of Object.entries(checks)) {
    const weight = checkWeights[checkName] || 0.1;
    totalScore += (check.passed ? check.confidence : 100 - check.confidence) * weight;
    totalWeight += weight;

    if (!check.passed) {
      riskFactors.push({
        factor: checkName,
        severity: check.confidence > 70 ? 'high' : check.confidence > 40 ? 'medium' : 'low',
        description: check.message,
        weight,
      });
    }
  }

  // Penalty for fraud indicators
  let fraudPenalty = 0;
  for (const indicator of fraudIndicators) {
    if (indicator.detected) {
      fraudPenalty += indicator.confidence * 0.3;
      riskFactors.push({
        factor: indicator.type,
        severity: indicator.severity,
        description: indicator.description,
        weight: 0.2,
      });
    }
  }

  const baseScore = totalWeight > 0 ? totalScore / totalWeight : 50;
  const finalScore = Math.max(0, Math.min(100, baseScore - fraudPenalty));

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (finalScore >= 80) riskLevel = 'low';
  else if (finalScore >= 60) riskLevel = 'medium';
  else if (finalScore >= 40) riskLevel = 'high';
  else riskLevel = 'critical';

  return { score: Math.round(finalScore), risk_level: riskLevel, risk_factors: riskFactors };
}

// ============================================
// MAIN KYC FUNCTION
// ============================================

function performKycCheck(input: KycRequest): KycResult {
  const startTime = Date.now();
  const config = KYC_LEVEL_CONFIGS[input.level];
  const checks: Record<string, { passed: boolean; message: string; confidence: number }> = {};

  // Run all checks
  const idCheck = validateIdFormat(input.national_id, input.country);
  checks.id_format = { passed: idCheck.valid, message: idCheck.message, confidence: idCheck.confidence };

  const nameCheck = validateName(input.full_name);
  checks.name_format = { passed: nameCheck.valid, message: nameCheck.message, confidence: nameCheck.confidence };

  const ageCheck = validateAge(input.date_of_birth);
  checks.age_verification = { passed: ageCheck.valid, message: ageCheck.message, confidence: ageCheck.confidence };

  const phoneCheck = validatePhone(input.phone_number);
  checks.phone_format = { passed: phoneCheck.valid, message: phoneCheck.message, confidence: phoneCheck.confidence };

  const expiryCheck = validateDocumentExpiry(input.document_expiry);
  checks.document_expiry = { passed: expiryCheck.valid, message: expiryCheck.message, confidence: expiryCheck.confidence };

  // Selfie check if provided
  if (input.selfie_match_score !== undefined) {
    const selfiePass = input.selfie_match_score >= 0.7;
    checks.selfie_match = {
      passed: selfiePass,
      message: selfiePass ? 'Correspondance faciale confirmée' : 'Correspondance faciale insuffisante',
      confidence: Math.round(input.selfie_match_score * 100),
    };
  }

  // Liveness check if required
  if (config.requires_liveness && input.liveness_passed !== undefined) {
    checks.liveness = {
      passed: input.liveness_passed,
      message: input.liveness_passed ? 'Vivacité confirmée' : 'Échec détection vivacité',
      confidence: input.liveness_passed ? 90 : 20,
    };
  }

  // Detect fraud indicators
  const fraudIndicators = detectFraudIndicators(input);

  // Calculate risk score
  const riskResult = calculateKycRiskScore(checks, fraudIndicators, input.level);

  // Determine status
  const criticalFraud = fraudIndicators.filter(f => f.detected && f.confidence > 80);
  const allChecksPassed = Object.values(checks).every(c => c.passed);

  let status: KycResult['status'];
  let manualReviewRequired = false;
  let rejectionReason: string | undefined;

  // Determine documents required based on level
  const documentsRequired: string[] = [];
  if (input.level === 'enhanced' || input.level === 'advanced') {
    if (!input.document_number) documentsRequired.push('CNI ou Passeport');
    if (config.requires_address && !input.address) documentsRequired.push('Justificatif de domicile');
  }
  if (input.level === 'advanced') {
    if (input.selfie_match_score === undefined) documentsRequired.push('Selfie');
  }

  // Check if documents are missing
  if (documentsRequired.length > 0 && (input.level === 'enhanced' || input.level === 'advanced')) {
    status = 'documents_required';
    manualReviewRequired = true;
  } else if (criticalFraud.length > 0) {
    status = 'rejected';
    rejectionReason = `Fraude détectée: ${criticalFraud.map(f => f.description).join(', ')}`;
  } else if (riskResult.score >= config.auto_approve_threshold && allChecksPassed) {
    status = 'verified';
  } else if (riskResult.risk_level === 'critical') {
    status = 'rejected';
    rejectionReason = 'Score de risque trop élevé';
  } else if (riskResult.risk_level === 'high' || !allChecksPassed) {
    status = 'requires_review';
    manualReviewRequired = true;
  } else {
    status = 'pending';
    manualReviewRequired = true;
  }

  const processingTime = Date.now() - startTime;

  // Build verifications performed
  const verificationsPerformed: VerificationPerformed[] = Object.entries(checks).map(([name, check]) => ({
    name: name.replace(/_/g, ' '),
    status: check.passed ? 'passed' : 'failed',
    confidence: check.confidence,
    details: check.message,
  }));

  // Calculate identity score (0-100)
  const identityScore = Math.round(
    (checks.id_format?.passed ? 30 : 0) +
    (checks.name_format?.passed ? 20 : 0) +
    (checks.age_verification?.passed ? 20 : 0) +
    (checks.phone_format?.passed ? 15 : 0) +
    (checks.document_expiry?.passed ? 15 : 0)
  );

  // Calculate fraud score (0-100, higher = more fraudulent)
  const fraudScore = fraudIndicators
    .filter(f => f.detected)
    .reduce((sum, f) => sum + f.score_impact, 0);

  // Build risk flags
  const riskFlags = riskResult.risk_factors.map(f => f.description);

  // Build score breakdown for explainability
  const scoreBreakdown = [
    { component: 'Format ID', points: checks.id_format?.passed ? 30 : 0, max_points: 30, description: checks.id_format?.message || '' },
    { component: 'Format Nom', points: checks.name_format?.passed ? 20 : 0, max_points: 20, description: checks.name_format?.message || '' },
    { component: 'Vérification Âge', points: checks.age_verification?.passed ? 20 : 0, max_points: 20, description: checks.age_verification?.message || '' },
    { component: 'Format Téléphone', points: checks.phone_format?.passed ? 15 : 0, max_points: 15, description: checks.phone_format?.message || '' },
    { component: 'Validité Document', points: checks.document_expiry?.passed ? 15 : 0, max_points: 15, description: checks.document_expiry?.message || '' },
  ];

  // Build positive/negative factors
  const positiveFactors = Object.entries(checks)
    .filter(([_, check]) => check.passed)
    .map(([name, check]) => ({
      factor: name.replace(/_/g, ' '),
      impact: Math.round(check.confidence * 0.3),
      description: check.message,
    }));

  const negativeFactors = [
    ...Object.entries(checks)
      .filter(([_, check]) => !check.passed)
      .map(([name, check]) => ({
        factor: name.replace(/_/g, ' '),
        impact: -Math.round((100 - check.confidence) * 0.2),
        description: check.message,
      })),
    ...fraudIndicators
      .filter(f => f.detected)
      .map(f => ({
        factor: f.type,
        impact: -f.score_impact,
        description: f.description,
      })),
  ];

  return {
    kyc_id: crypto.randomUUID(),
    level: input.level,
    status,
    identity_score: identityScore,
    risk_score: riskResult.score,
    risk_level: riskResult.risk_level,
    risk_factors: riskResult.risk_factors,
    risk_flags: riskFlags,
    fraud_score: Math.min(100, fraudScore),
    fraud_indicators: fraudIndicators,
    verifications_performed: verificationsPerformed,
    verified_identity: {
      full_name: input.full_name,
      date_of_birth: input.date_of_birth,
      document_number: input.document_number,
      country: input.country,
    },
    checks,
    documents_required: documentsRequired,
    documents_submitted: input.document_number ? 1 : 0,
    documents_verified: input.document_number && checks.id_format?.passed ? 1 : 0,
    processing_time_ms: processingTime,
    checked_at: new Date().toISOString(),
    manual_review_required: manualReviewRequired,
    rejection_reason: rejectionReason,
    explainability: {
      score_breakdown: scoreBreakdown,
      positive_factors: positiveFactors,
      negative_factors: negativeFactors,
    },
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
  // First try API key
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    return validateApiKey(supabase, apiKey);
  }

  // Then try JWT
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    return validateJwt(supabase, authHeader);
  }

  return { valid: false };
}

// ============================================
// LOGGING
// ============================================

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

  // Authenticate via API key OR JWT
  const authResult = await authenticate(supabase, req);

  if (!authResult.valid) {
    return new Response(
      JSON.stringify({ error: 'Authentication required', code: 'AUTH_REQUIRED' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check permissions (skip for JWT internal calls)
  if (authResult.authType === 'api_key' && !authResult.permissions?.includes('kyc')) {
    return new Response(
      JSON.stringify({ error: 'API key does not have KYC permission', code: 'INSUFFICIENT_PERMISSIONS' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const keyValidation = authResult;

  try {
    const body: KycRequest = await req.json();

    // Validate required fields
    if (!body.national_id || !body.full_name || !body.date_of_birth) {
      return new Response(
        JSON.stringify({ error: 'national_id, full_name, and date_of_birth are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default level
    if (!body.level) {
      body.level = 'basic';
    }

    // Perform KYC check
    const kycResult = performKycCheck(body);

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
      ocr_confidence: body.ocr_data ? 75 : null,
      verified: kycResult.status === 'verified',
      verified_at: kycResult.status === 'verified' ? new Date().toISOString() : null,
    }).select().single();

    // Save device info if provided
    if (body.device_info) {
      await supabase.from('user_devices').insert({
        user_id: keyValidation.userId,
        device_id: body.device_info.device_id || null,
        device_type: body.device_info.device_type || 'mobile',
        os: body.device_info.os || null,
        is_primary: true,
      });
    }

    // Save address if provided
    if (body.address) {
      await supabase.from('user_addresses').insert({
        user_id: keyValidation.userId,
        address_type: 'home',
        street_address: body.address,
        country: body.country || 'CI',
        is_current: true,
      });
    }

    // Save selfie/liveness results if available
    if (body.selfie_match_score !== undefined || body.liveness_passed !== undefined) {
      await supabase.from('user_selfie_liveness').insert({
        user_id: keyValidation.userId,
        face_match_score: body.selfie_match_score || null,
        is_face_match: body.selfie_match_score ? body.selfie_match_score >= 0.7 : false,
        is_live: body.liveness_passed || false,
        liveness_method: body.liveness_passed ? 'passive' : null,
        checks_passed: kycResult.fraud_indicators.filter(f => !f.detected).map(f => f.type),
        checks_failed: kycResult.fraud_indicators.filter(f => f.detected).map(f => f.type),
      });
    }

    // Save fraud indicators to document_fraud_analysis
    for (const indicator of kycResult.fraud_indicators.filter(f => f.detected)) {
      await supabase.from('document_fraud_analysis').insert({
        user_id: keyValidation.userId,
        check_type: 'fraud_indicator',
        check_name: indicator.type,
        passed: false,
        confidence: indicator.confidence,
        fraud_probability: indicator.confidence / 100,
        forgery_indicators: [{ type: indicator.type, confidence: indicator.confidence, details: indicator.description }],
      });
    }

    // Save identity fraud risk if high risk
    if (kycResult.risk_level === 'high' || kycResult.risk_level === 'critical') {
      await supabase.from('identity_fraud_risk').insert({
        user_id: keyValidation.userId,
        identity_id: identityData?.id || null,
        risk_type: 'kyc_risk',
        risk_level: kycResult.risk_level,
        indicators: kycResult.risk_factors.map(f => ({ type: f.factor, weight: f.weight, details: f.description })),
        overall_risk_score: 100 - kycResult.risk_score,
        investigation_status: kycResult.manual_review_required ? 'pending' : null,
      });
    }

    const response = {
      success: true,
      data: {
        ...kycResult,
        identity_id: identityData?.id || null,
      },
    };

    const processingTime = Date.now() - startTime;

    // Log API call
    await logApiCall(supabase, {
      apiKeyId: keyValidation.keyId!,
      userId: keyValidation.userId!,
      endpoint: '/wouaka-kyc',
      method: 'POST',
      statusCode: 200,
      requestBody: { ...body, national_id: '***REDACTED***' },
      responseBody: { kyc_id: kycResult.kyc_id, status: kycResult.status },
      processingTimeMs: processingTime,
    });

    // Trigger webhooks
    const eventType = kycResult.status === 'verified' ? 'kyc.verified' : 
                      kycResult.status === 'rejected' ? 'kyc.failed' : 'kyc.requires_review';
    await triggerWebhooks(supabase, keyValidation.userId!, eventType, {
      kyc_id: kycResult.kyc_id,
      identity_id: identityData?.id || null,
      status: kycResult.status,
      risk_score: kycResult.risk_score,
      checked_at: kycResult.checked_at,
    });

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Processing-Time': `${processingTime}ms`,
          'X-KYC-ID': kycResult.kyc_id,
        },
      }
    );
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Wouaka KYC Error:', error);

    await logApiCall(supabase, {
      apiKeyId: keyValidation.keyId!,
      userId: keyValidation.userId!,
      endpoint: '/wouaka-kyc',
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
