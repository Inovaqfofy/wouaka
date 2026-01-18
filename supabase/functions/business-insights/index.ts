import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BusinessInsightsRequest {
  business_name: string;
  phone_number: string;
  sector: string;
  location: string;
  rccm_number?: string;
  years_in_business?: number;
  monthly_revenue?: number;
}

interface BusinessInsightsResponse {
  business_score: number;
  risk_level: 'low' | 'moderate' | 'high';
  commercial_reliability: number;
  activity_stability: number;
  digital_presence: number;
  declaration_coherence: number;
  estimated_age_months: number;
  continuity_index: number;
  fraud_risk_index: number;
  grade: string;
  processing_time_ms: number;
  request_id: string;
}

// Sector risk weights
const SECTOR_RISK_WEIGHTS: Record<string, number> = {
  agriculture: 1.1,
  commerce: 1.0,
  services: 0.95,
  technology: 0.9,
  finance: 0.85,
  construction: 1.15,
  transport: 1.05,
  education: 0.8,
  health: 0.85,
  other: 1.0,
};

// Analyze business name coherence
function analyzeBusinessName(name: string, sector: string): number {
  let score = 60;

  // Length check
  if (name.length >= 5 && name.length <= 100) score += 10;
  
  // Proper formatting
  if (/^[A-Z]/.test(name)) score += 5;
  
  // Contains legal entity indicators
  if (/SARL|SA|SAS|SUARL|GIE|ETS|Ets/i.test(name)) score += 15;
  
  // Contains sector-related keywords
  const sectorKeywords: Record<string, string[]> = {
    agriculture: ['agri', 'farm', 'culture', 'élevage', 'plantation'],
    commerce: ['trading', 'commerce', 'négoce', 'import', 'export', 'distribution'],
    services: ['service', 'conseil', 'consulting', 'expertise'],
    technology: ['tech', 'digital', 'soft', 'info', 'data', 'cyber'],
    finance: ['finance', 'invest', 'crédit', 'banque', 'assurance'],
    construction: ['btp', 'construct', 'bâtiment', 'immo'],
    transport: ['transport', 'logist', 'transit', 'freight'],
    education: ['école', 'formation', 'institut', 'académie'],
    health: ['santé', 'pharma', 'médic', 'clinic', 'hôpital'],
  };
  
  const keywords = sectorKeywords[sector] || [];
  if (keywords.some(kw => name.toLowerCase().includes(kw))) score += 10;

  return Math.min(100, score);
}

// Analyze RCCM if provided
function analyzeRCCM(rccm: string | undefined): { score: number; estimatedAgeMonths: number } {
  if (!rccm) {
    return { score: 50, estimatedAgeMonths: 12 }; // Default for unverified
  }

  let score = 70;
  let estimatedAgeMonths = 24;

  // Basic format validation (CI-ABJ-2020-B-12345 format)
  const rccmPattern = /^[A-Z]{2}-[A-Z]{3}-\d{4}-[A-Z]-\d+$/;
  if (rccmPattern.test(rccm.toUpperCase())) {
    score += 20;
    
    // Extract year
    const yearMatch = rccm.match(/\d{4}/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      const currentYear = new Date().getFullYear();
      estimatedAgeMonths = (currentYear - year) * 12;
      
      // Older businesses get higher scores
      if (estimatedAgeMonths >= 60) score += 10; // 5+ years
      else if (estimatedAgeMonths >= 36) score += 5; // 3+ years
    }
  } else {
    // Partial format match
    if (/\d{4}/.test(rccm)) {
      score += 10;
      const yearMatch = rccm.match(/\d{4}/);
      if (yearMatch) {
        const year = parseInt(yearMatch[0]);
        estimatedAgeMonths = (new Date().getFullYear() - year) * 12;
      }
    }
  }

  return { score: Math.min(100, score), estimatedAgeMonths: Math.max(1, estimatedAgeMonths) };
}

// Simulate digital presence analysis
function analyzeDigitalPresence(businessName: string, phoneNumber: string): number {
  const hash = `${businessName}${phoneNumber}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Base score
  let score = 50;
  
  // Simulate web presence
  if (hash % 3 === 0) score += 20; // Has website
  if (hash % 5 === 0) score += 15; // Has social media
  if (hash % 7 === 0) score += 10; // Has reviews
  
  // Phone number activity (simulated)
  score += (hash % 20);
  
  return Math.min(100, score);
}

// Calculate commercial reliability
function calculateCommercialReliability(
  nameScore: number,
  rccmScore: number,
  digitalScore: number,
  sector: string
): number {
  const sectorWeight = SECTOR_RISK_WEIGHTS[sector] || 1.0;
  
  const baseScore = (nameScore * 0.25 + rccmScore * 0.45 + digitalScore * 0.30);
  const adjustedScore = baseScore / sectorWeight;
  
  return Math.round(Math.min(100, adjustedScore));
}

// Calculate activity stability
function calculateActivityStability(
  estimatedAgeMonths: number,
  yearsInBusiness: number | undefined,
  monthlyRevenue: number | undefined
): number {
  let score = 40;
  
  // Age factor
  const ageYears = yearsInBusiness || (estimatedAgeMonths / 12);
  if (ageYears >= 5) score += 30;
  else if (ageYears >= 3) score += 20;
  else if (ageYears >= 1) score += 10;
  
  // Revenue factor (if provided)
  if (monthlyRevenue) {
    if (monthlyRevenue >= 10000000) score += 20; // 10M+ FCFA
    else if (monthlyRevenue >= 5000000) score += 15;
    else if (monthlyRevenue >= 1000000) score += 10;
    else score += 5;
  } else {
    score += 10; // Default bonus for not having negative signals
  }
  
  return Math.min(100, score);
}

// Calculate declaration coherence
function calculateDeclarationCoherence(data: BusinessInsightsRequest, rccmAnalysis: ReturnType<typeof analyzeRCCM>): number {
  let score = 70;
  
  // Check if declared years match RCCM estimate
  if (data.years_in_business) {
    const declaredMonths = data.years_in_business * 12;
    const difference = Math.abs(declaredMonths - rccmAnalysis.estimatedAgeMonths);
    
    if (difference <= 12) score += 20; // Within 1 year
    else if (difference <= 24) score += 10; // Within 2 years
    else if (difference > 48) score -= 20; // Major discrepancy
  } else {
    score += 10; // No contradiction possible
  }
  
  // Check sector-location coherence (simulated)
  const hash = `${data.sector}${data.location}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  if (hash % 4 !== 0) score += 10; // Usually coherent

  return Math.min(100, Math.max(0, score));
}

// Calculate fraud risk index
function calculateFraudRiskIndex(
  declarationCoherence: number,
  rccmScore: number,
  digitalPresence: number
): number {
  // Inverse relationship - higher coherence = lower fraud risk
  const riskScore = 100 - ((declarationCoherence * 0.4 + rccmScore * 0.35 + digitalPresence * 0.25));
  return Math.round(Math.max(0, Math.min(100, riskScore)));
}

// Calculate continuity index
function calculateContinuityIndex(activityStability: number, estimatedAgeMonths: number): number {
  const ageScore = Math.min(100, (estimatedAgeMonths / 60) * 100); // Max at 5 years
  return Math.round((activityStability * 0.6 + ageScore * 0.4));
}

// Calculate final business score
function calculateBusinessScore(
  commercialReliability: number,
  activityStability: number,
  digitalPresence: number,
  declarationCoherence: number
): number {
  return Math.round(
    commercialReliability * 0.30 +
    activityStability * 0.25 +
    digitalPresence * 0.20 +
    declarationCoherence * 0.25
  );
}

// Get grade from score
function getGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  if (score >= 30) return 'D';
  return 'E';
}

// Get risk level
function getRiskLevel(score: number): 'low' | 'moderate' | 'high' {
  if (score >= 65) return 'low';
  if (score >= 40) return 'moderate';
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
  if (!permissions.includes('business') && !permissions.includes('score')) {
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
    const body: BusinessInsightsRequest = await req.json();
    
    // Validate required fields
    if (!body.business_name || !body.phone_number || !body.sector || !body.location) {
      return new Response(
        JSON.stringify({ error: 'business_name, phone_number, sector, and location are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform analysis
    const nameScore = analyzeBusinessName(body.business_name, body.sector);
    const rccmAnalysis = analyzeRCCM(body.rccm_number);
    const digitalPresence = analyzeDigitalPresence(body.business_name, body.phone_number);
    
    const commercialReliability = calculateCommercialReliability(nameScore, rccmAnalysis.score, digitalPresence, body.sector);
    const activityStability = calculateActivityStability(rccmAnalysis.estimatedAgeMonths, body.years_in_business, body.monthly_revenue);
    const declarationCoherence = calculateDeclarationCoherence(body, rccmAnalysis);
    const fraudRiskIndex = calculateFraudRiskIndex(declarationCoherence, rccmAnalysis.score, digitalPresence);
    const continuityIndex = calculateContinuityIndex(activityStability, rccmAnalysis.estimatedAgeMonths);
    
    const businessScore = calculateBusinessScore(commercialReliability, activityStability, digitalPresence, declarationCoherence);
    const grade = getGrade(businessScore);
    const riskLevel = getRiskLevel(businessScore);

    const processingTime = Date.now() - startTime;

    // Log API call
    await supabase.from('api_calls').insert({
      user_id: keyValidation.partnerId,
      api_key_id: keyValidation.keyId,
      endpoint: '/business-insights',
      method: 'POST',
      status_code: 200,
      processing_time_ms: processingTime,
      request_body: { business_name: body.business_name, sector: body.sector, location: body.location },
      response_body: { business_score: businessScore, risk_level: riskLevel, grade },
    });

    const response: BusinessInsightsResponse = {
      business_score: businessScore,
      risk_level: riskLevel,
      commercial_reliability: commercialReliability,
      activity_stability: activityStability,
      digital_presence: digitalPresence,
      declaration_coherence: declarationCoherence,
      estimated_age_months: rccmAnalysis.estimatedAgeMonths,
      continuity_index: continuityIndex,
      fraud_risk_index: fraudRiskIndex,
      grade,
      processing_time_ms: processingTime,
      request_id: crypto.randomUUID(),
    };

    console.log(`BusinessInsights completed in ${processingTime}ms - Score: ${businessScore}, Grade: ${grade}, Risk: ${riskLevel}`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('BusinessInsights error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
