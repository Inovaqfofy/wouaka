import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PrecheckRequest {
  phone_number: string;
  full_name: string;
}

interface PrecheckResponse {
  status: 'reliable' | 'evaluate' | 'risky';
  quick_score: number;
  sim_stability: 'low' | 'medium' | 'high';
  processing_time_ms: number;
  request_id: string;
}

// Simulate SIM data analysis (in production, integrate with telecom APIs)
function analyzeSIMData(phoneNumber: string): { ageMonths: number; activityScore: number; stabilityIndex: number } {
  // Hash-based simulation for consistent results per phone number
  const hash = phoneNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return {
    ageMonths: (hash % 60) + 6, // 6-66 months
    activityScore: (hash % 40) + 60, // 60-100
    stabilityIndex: (hash % 30) + 70, // 70-100
  };
}

// Analyze name coherence
function analyzeNameCoherence(fullName: string): number {
  const parts = fullName.trim().split(/\s+/);
  let score = 50;
  
  // More name parts = more credible
  if (parts.length >= 2) score += 20;
  if (parts.length >= 3) score += 10;
  
  // Check for proper capitalization
  const hasProperCaps = parts.every(p => p.charAt(0) === p.charAt(0).toUpperCase());
  if (hasProperCaps) score += 10;
  
  // Reasonable name length
  if (fullName.length >= 5 && fullName.length <= 50) score += 10;
  
  return Math.min(100, score);
}

// Calculate quick score based on available signals
function calculateQuickScore(simData: ReturnType<typeof analyzeSIMData>, nameScore: number): number {
  const weights = {
    simAge: 0.25,
    activity: 0.25,
    stability: 0.30,
    nameCoherence: 0.20,
  };
  
  // Normalize SIM age (0-100 scale, 24+ months = 100)
  const simAgeNormalized = Math.min(100, (simData.ageMonths / 24) * 100);
  
  const score = 
    simAgeNormalized * weights.simAge +
    simData.activityScore * weights.activity +
    simData.stabilityIndex * weights.stability +
    nameScore * weights.nameCoherence;
  
  return Math.round(score);
}

// Determine status based on score
function determineStatus(score: number): 'reliable' | 'evaluate' | 'risky' {
  if (score >= 70) return 'reliable';
  if (score >= 45) return 'evaluate';
  return 'risky';
}

// Determine SIM stability level
function determineSIMStability(simData: ReturnType<typeof analyzeSIMData>): 'low' | 'medium' | 'high' {
  const avgScore = (simData.ageMonths >= 12 ? 100 : simData.ageMonths * 8.33) * 0.4 +
                   simData.stabilityIndex * 0.6;
  
  if (avgScore >= 80) return 'high';
  if (avgScore >= 50) return 'medium';
  return 'low';
}

// Validate API key and get partner info
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

  // Check if precheck permission exists
  const permissions = keyData.permissions || ['score', 'kyc', 'identity'];
  if (!permissions.includes('precheck') && !permissions.includes('score')) {
    return { valid: false };
  }

  // Update last used
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyData.id);

  return { valid: true, partnerId: keyData.user_id, keyId: keyData.id };
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
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
    const body: PrecheckRequest = await req.json();
    
    // Validate input
    if (!body.phone_number || !body.full_name) {
      return new Response(
        JSON.stringify({ error: 'phone_number and full_name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean phone number
    const cleanPhone = body.phone_number.replace(/\D/g, '');
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform quick analysis
    const simData = analyzeSIMData(cleanPhone);
    const nameScore = analyzeNameCoherence(body.full_name);
    const quickScore = calculateQuickScore(simData, nameScore);
    const status = determineStatus(quickScore);
    const simStability = determineSIMStability(simData);
    
    const processingTime = Date.now() - startTime;

    // Save to database
    const { data: savedRequest, error: saveError } = await supabase
      .from('precheck_requests')
      .insert({
        partner_id: keyValidation.partnerId,
        api_key_id: keyValidation.keyId,
        phone_number: cleanPhone,
        full_name: body.full_name,
        status,
        quick_score: quickScore,
        sim_stability: simStability,
        processing_time_ms: processingTime,
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('Error saving precheck:', saveError);
    }

    // Log API call
    await supabase.from('api_calls').insert({
      user_id: keyValidation.partnerId,
      api_key_id: keyValidation.keyId,
      endpoint: '/precheck',
      method: 'POST',
      status_code: 200,
      processing_time_ms: processingTime,
      request_body: { phone_number: '***', full_name: body.full_name.substring(0, 3) + '***' },
      response_body: { status, quick_score: quickScore },
    });

    const response: PrecheckResponse = {
      status,
      quick_score: quickScore,
      sim_stability: simStability,
      processing_time_ms: processingTime,
      request_id: savedRequest?.id || 'unknown',
    };

    console.log(`Precheck completed in ${processingTime}ms - Score: ${quickScore}, Status: ${status}`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Precheck error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
