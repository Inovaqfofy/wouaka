import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FraudShieldRequest {
  phone_number: string;
  full_name: string;
  national_id?: string;
  email?: string;
  date_of_birth?: string;
  address?: string;
}

interface FraudFlag {
  code: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface FraudShieldResponse {
  fraud_score: number;
  risk_level: 'low' | 'moderate' | 'high';
  flags: FraudFlag[];
  anomalies_detected: number;
  identity_coherence: number;
  behavior_coherence: number;
  processing_time_ms: number;
  request_id: string;
}

// Check for identity inconsistencies
function checkIdentityCoherence(data: FraudShieldRequest): { score: number; flags: FraudFlag[] } {
  const flags: FraudFlag[] = [];
  let score = 100;

  // Check name format
  const nameParts = data.full_name.trim().split(/\s+/);
  if (nameParts.length < 2) {
    flags.push({ code: 'NAME_TOO_SHORT', severity: 'medium', description: 'Nom incomplet détecté' });
    score -= 15;
  }

  // Check for suspicious characters in name
  if (/[0-9@#$%^&*()!]/.test(data.full_name)) {
    flags.push({ code: 'NAME_INVALID_CHARS', severity: 'high', description: 'Caractères invalides dans le nom' });
    score -= 25;
  }

  // Check phone number format (UEMOA)
  const cleanPhone = data.phone_number.replace(/\D/g, '');
  if (cleanPhone.length < 8) {
    flags.push({ code: 'PHONE_TOO_SHORT', severity: 'high', description: 'Numéro de téléphone trop court' });
    score -= 20;
  }

  // Check for test/fake patterns
  if (/^(0{8,}|1{8,}|12345|00000)/.test(cleanPhone)) {
    flags.push({ code: 'PHONE_SUSPICIOUS_PATTERN', severity: 'high', description: 'Pattern de numéro suspect' });
    score -= 30;
  }

  // Check national ID if provided
  if (data.national_id) {
    if (data.national_id.length < 5) {
      flags.push({ code: 'ID_TOO_SHORT', severity: 'medium', description: 'Numéro d\'identité trop court' });
      score -= 15;
    }
    if (/^(0{5,}|X{5,}|TEST|FAKE)/i.test(data.national_id)) {
      flags.push({ code: 'ID_SUSPICIOUS', severity: 'high', description: 'Numéro d\'identité suspect' });
      score -= 25;
    }
  }

  // Check date of birth if provided
  if (data.date_of_birth) {
    const dob = new Date(data.date_of_birth);
    const now = new Date();
    const age = (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    if (age < 18) {
      flags.push({ code: 'AGE_UNDER_18', severity: 'high', description: 'Âge inférieur à 18 ans' });
      score -= 30;
    } else if (age > 100) {
      flags.push({ code: 'AGE_UNREALISTIC', severity: 'high', description: 'Âge irréaliste' });
      score -= 25;
    }
  }

  // Check email if provided
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      flags.push({ code: 'EMAIL_INVALID', severity: 'medium', description: 'Format email invalide' });
      score -= 10;
    }
    // Check for disposable email domains
    const disposableDomains = ['tempmail', 'guerrillamail', 'throwaway', 'mailinator', 'yopmail'];
    if (disposableDomains.some(d => data.email!.toLowerCase().includes(d))) {
      flags.push({ code: 'EMAIL_DISPOSABLE', severity: 'high', description: 'Email jetable détecté' });
      score -= 20;
    }
  }

  return { score: Math.max(0, score), flags };
}

// Check for behavioral anomalies (simulated)
function checkBehaviorCoherence(data: FraudShieldRequest): { score: number; flags: FraudFlag[] } {
  const flags: FraudFlag[] = [];
  let score = 100;

  // Hash-based simulation for consistent results
  const dataStr = `${data.phone_number}${data.full_name}`;
  const hash = dataStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Simulate velocity check (multiple requests in short time)
  if (hash % 20 === 0) {
    flags.push({ code: 'VELOCITY_HIGH', severity: 'medium', description: 'Activité récente élevée' });
    score -= 15;
  }

  // Simulate device/location coherence
  if (hash % 25 === 0) {
    flags.push({ code: 'LOCATION_MISMATCH', severity: 'low', description: 'Incohérence géographique mineure' });
    score -= 10;
  }

  // Simulate digital footprint check
  if (hash % 30 === 0) {
    flags.push({ code: 'DIGITAL_FOOTPRINT_LOW', severity: 'low', description: 'Empreinte numérique faible' });
    score -= 5;
  }

  return { score: Math.max(0, score), flags };
}

// Check for duplications (simulated)
function checkDuplications(data: FraudShieldRequest): { flags: FraudFlag[]; penalty: number } {
  const flags: FraudFlag[] = [];
  let penalty = 0;

  // In production, this would check against existing records
  const hash = `${data.phone_number}${data.national_id || ''}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  if (hash % 50 === 0) {
    flags.push({ code: 'PHONE_DUPLICATE_SUSPECTED', severity: 'high', description: 'Numéro potentiellement lié à un autre profil' });
    penalty += 20;
  }

  if (data.national_id && hash % 40 === 0) {
    flags.push({ code: 'ID_DUPLICATE_SUSPECTED', severity: 'high', description: 'Identité potentiellement dupliquée' });
    penalty += 25;
  }

  return { flags, penalty };
}

// Calculate final fraud score
function calculateFraudScore(identityScore: number, behaviorScore: number, duplicationPenalty: number): number {
  // Lower score = higher fraud risk
  // We invert it so higher score = higher fraud risk (more intuitive)
  const combinedScore = (identityScore * 0.5 + behaviorScore * 0.5) - duplicationPenalty;
  const fraudScore = Math.max(0, Math.min(100, 100 - combinedScore));
  return Math.round(fraudScore);
}

// Determine risk level
function determineRiskLevel(fraudScore: number): 'low' | 'moderate' | 'high' {
  if (fraudScore <= 25) return 'low';
  if (fraudScore <= 55) return 'moderate';
  return 'high';
}

// Validate API key
async function validateApiKey(supabase: any, apiKey: string): Promise<{ valid: boolean; partnerId?: string; keyId?: string }> {
  if (!apiKey || !apiKey.startsWith('wk_')) {
    return { valid: false };
  }

  const prefix = apiKey.substring(0, 10);
  
  const { data: keyData, error } = await supabase
    .from('api_keys')
    .select('id, user_id, is_active, permissions')
    .eq('key_prefix', prefix)
    .eq('is_active', true)
    .single();

  if (error || !keyData) {
    return { valid: false };
  }

  const permissions = keyData.permissions || ['score', 'kyc', 'identity'];
  if (!permissions.includes('fraud') && !permissions.includes('score')) {
    return { valid: false };
  }

  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyData.id);

  return { valid: true, partnerId: keyData.user_id, keyId: keyData.id };
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate API key
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = authHeader.replace('Bearer ', '');
    
    const keyValidation = await validateApiKey(supabase, apiKey);
    if (!keyValidation.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const body: FraudShieldRequest = await req.json();
    
    // Validate required fields
    if (!body.phone_number || !body.full_name) {
      return new Response(
        JSON.stringify({ error: 'phone_number and full_name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform fraud analysis
    const identityCheck = checkIdentityCoherence(body);
    const behaviorCheck = checkBehaviorCoherence(body);
    const duplicationCheck = checkDuplications(body);

    const allFlags = [...identityCheck.flags, ...behaviorCheck.flags, ...duplicationCheck.flags];
    const fraudScore = calculateFraudScore(identityCheck.score, behaviorCheck.score, duplicationCheck.penalty);
    const riskLevel = determineRiskLevel(fraudScore);

    const processingTime = Date.now() - startTime;

    // Save to database
    const { data: savedDetection, error: saveError } = await supabase
      .from('fraud_detections')
      .insert({
        partner_id: keyValidation.partnerId,
        phone_number: body.phone_number.replace(/\D/g, ''),
        full_name: body.full_name,
        national_id: body.national_id,
        fraud_score: fraudScore,
        risk_level: riskLevel,
        flags: allFlags,
        anomalies_count: allFlags.length,
        identity_coherence: identityCheck.score,
        behavior_coherence: behaviorCheck.score,
        processing_time_ms: processingTime,
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('Error saving fraud detection:', saveError);
    }

    // Log API call
    await supabase.from('api_calls').insert({
      user_id: keyValidation.partnerId,
      api_key_id: keyValidation.keyId,
      endpoint: '/fraud-shield',
      method: 'POST',
      status_code: 200,
      processing_time_ms: processingTime,
      request_body: { phone_number: '***', full_name: body.full_name.substring(0, 3) + '***' },
      response_body: { fraud_score: fraudScore, risk_level: riskLevel },
    });

    const response: FraudShieldResponse = {
      fraud_score: fraudScore,
      risk_level: riskLevel,
      flags: allFlags,
      anomalies_detected: allFlags.length,
      identity_coherence: identityCheck.score,
      behavior_coherence: behaviorCheck.score,
      processing_time_ms: processingTime,
      request_id: savedDetection?.id || 'unknown',
    };

    console.log(`FraudShield completed in ${processingTime}ms - Score: ${fraudScore}, Risk: ${riskLevel}, Flags: ${allFlags.length}`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('FraudShield error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
