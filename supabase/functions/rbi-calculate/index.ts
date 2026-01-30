import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RBIRequest {
  phone_number: string;
  full_name: string;
  sim_age_months?: number;
  utility_payments_on_time?: number;
  utility_payments_late?: number;
  mobile_money_transactions?: number;
  mobile_money_volume?: number;
}

interface RBIResponse {
  rbi_score: number;
  risk_category: 'low' | 'medium' | 'high';
  regularity_factor: number;
  stability_factor: number;
  digital_behavior: number;
  continuity_factor: number;
  confidence: number;
  processing_time_ms: number;
  request_id: string;
}

// Calculate regularity factor (0-10)
function calculateRegularityFactor(data: RBIRequest): number {
  let score = 5; // Base score

  // Utility payments regularity
  const onTime = data.utility_payments_on_time || 0;
  const late = data.utility_payments_late || 0;
  const totalPayments = onTime + late;

  if (totalPayments > 0) {
    const onTimeRatio = onTime / totalPayments;
    score += onTimeRatio * 3; // Up to +3 for perfect payment history
    
    // Penalty for late payments
    if (late > 5) score -= 1;
    if (late > 10) score -= 1;
  } else {
    // No payment history available - simulate based on phone
    const hash = data.phone_number.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    score += (hash % 30) / 10; // 0-3 bonus
  }

  // Mobile money transaction regularity
  const txCount = data.mobile_money_transactions || 0;
  if (txCount >= 50) score += 1.5;
  else if (txCount >= 20) score += 1;
  else if (txCount >= 10) score += 0.5;

  return Math.min(10, Math.max(0, Math.round(score * 10) / 10));
}

// Calculate stability factor (0-10)
function calculateStabilityFactor(data: RBIRequest): number {
  let score = 4; // Base score

  // SIM age stability
  const simAge = data.sim_age_months || 0;
  if (simAge >= 36) score += 3; // 3+ years
  else if (simAge >= 24) score += 2.5;
  else if (simAge >= 12) score += 2;
  else if (simAge >= 6) score += 1;
  else score += 0.5;

  // Mobile money volume stability (indicates regular income)
  const volume = data.mobile_money_volume || 0;
  if (volume >= 5000000) score += 2; // 5M+ FCFA
  else if (volume >= 2000000) score += 1.5;
  else if (volume >= 500000) score += 1;
  else if (volume >= 100000) score += 0.5;

  // Name stability indicator (simulated)
  const nameParts = data.full_name.trim().split(/\s+/);
  if (nameParts.length >= 3) score += 0.5; // Full name suggests stability

  return Math.min(10, Math.max(0, Math.round(score * 10) / 10));
}

// Calculate digital behavior factor (0-10)
function calculateDigitalBehavior(data: RBIRequest): number {
  let score = 5; // Base score

  // Mobile money activity
  const txCount = data.mobile_money_transactions || 0;
  const volume = data.mobile_money_volume || 0;

  // Transaction frequency bonus
  if (txCount >= 100) score += 2;
  else if (txCount >= 50) score += 1.5;
  else if (txCount >= 20) score += 1;
  else if (txCount >= 5) score += 0.5;

  // Average transaction size
  if (txCount > 0 && volume > 0) {
    const avgTx = volume / txCount;
    if (avgTx >= 100000) score += 1.5; // High-value transactions
    else if (avgTx >= 50000) score += 1;
    else if (avgTx >= 10000) score += 0.5;
  }

  // SIM usage indicates digital engagement
  const simAge = data.sim_age_months || 0;
  if (simAge >= 12 && txCount >= 10) score += 1;

  return Math.min(10, Math.max(0, Math.round(score * 10) / 10));
}

// Calculate continuity factor (0-10)
function calculateContinuityFactor(data: RBIRequest): number {
  let score = 5; // Base score

  // Long-term SIM usage
  const simAge = data.sim_age_months || 0;
  if (simAge >= 48) score += 2.5; // 4+ years
  else if (simAge >= 36) score += 2;
  else if (simAge >= 24) score += 1.5;
  else if (simAge >= 12) score += 1;

  // Consistent payment behavior
  const onTime = data.utility_payments_on_time || 0;
  const late = data.utility_payments_late || 0;
  
  if (onTime >= 12 && late <= 2) score += 2; // Excellent history
  else if (onTime >= 6 && late <= 3) score += 1;
  
  // Continuous mobile money usage
  const txCount = data.mobile_money_transactions || 0;
  if (txCount >= 30 && simAge >= 12) score += 0.5; // Active over time

  return Math.min(10, Math.max(0, Math.round(score * 10) / 10));
}

// Calculate confidence based on data availability
function calculateConfidence(data: RBIRequest): number {
  let dataPoints = 2; // phone + name always present
  let maxPoints = 7;

  if (data.sim_age_months !== undefined) dataPoints++;
  if (data.utility_payments_on_time !== undefined) dataPoints++;
  if (data.utility_payments_late !== undefined) dataPoints++;
  if (data.mobile_money_transactions !== undefined) dataPoints++;
  if (data.mobile_money_volume !== undefined) dataPoints++;

  return Math.round((dataPoints / maxPoints) * 100);
}

// Calculate final RBI score (0-10)
function calculateRBIScore(
  regularity: number,
  stability: number,
  digital: number,
  continuity: number
): number {
  const weights = {
    regularity: 0.30,
    stability: 0.25,
    digital: 0.20,
    continuity: 0.25,
  };

  const score = 
    regularity * weights.regularity +
    stability * weights.stability +
    digital * weights.digital +
    continuity * weights.continuity;

  return Math.round(score * 10) / 10;
}

// Get risk category
function getRiskCategory(score: number): 'low' | 'medium' | 'high' {
  if (score >= 7) return 'low';
  if (score >= 4) return 'medium';
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
  if (!permissions.includes('rbi') && !permissions.includes('score')) {
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
    const body: RBIRequest = await req.json();
    
    // Validate required fields
    if (!body.phone_number || !body.full_name) {
      return new Response(
        JSON.stringify({ error: 'phone_number and full_name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate factors
    const regularityFactor = calculateRegularityFactor(body);
    const stabilityFactor = calculateStabilityFactor(body);
    const digitalBehavior = calculateDigitalBehavior(body);
    const continuityFactor = calculateContinuityFactor(body);
    const confidence = calculateConfidence(body);
    
    const rbiScore = calculateRBIScore(regularityFactor, stabilityFactor, digitalBehavior, continuityFactor);
    const riskCategory = getRiskCategory(rbiScore);

    const processingTime = Date.now() - startTime;

    // Log API call
    await supabase.from('api_calls').insert({
      user_id: keyValidation.partnerId,
      api_key_id: keyValidation.keyId,
      endpoint: '/rbi-calculate',
      method: 'POST',
      status_code: 200,
      processing_time_ms: processingTime,
      request_body: { phone_number: '***', full_name: body.full_name.substring(0, 3) + '***' },
      response_body: { rbi_score: rbiScore, risk_category: riskCategory },
    });

    const response: RBIResponse = {
      rbi_score: rbiScore,
      risk_category: riskCategory,
      regularity_factor: regularityFactor,
      stability_factor: stabilityFactor,
      digital_behavior: digitalBehavior,
      continuity_factor: continuityFactor,
      confidence,
      processing_time_ms: processingTime,
      request_id: crypto.randomUUID(),
    };

    console.log(`RBI calculated in ${processingTime}ms - Score: ${rbiScore}/10, Risk: ${riskCategory}, Confidence: ${confidence}%`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('RBI calculation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
