// ============================================
// ⚠️ DEPRECATED - DO NOT USE
// ============================================
// This function has been deprecated in favor of the unified
// W-SCORE ENGINE in /wouaka-core and /wouaka-score.
//
// The Sovereign Proof-based model (Mobile Trust) requires:
// - phone_trust_scores verification
// - score_raw_features as data source
// - is_certified flag check before scoring
//
// For new integrations, use:
// - /wouaka-core (full KYC + Score pipeline)
// - /wouaka-score (score only with data transparency)
//
// This endpoint will be removed in v2.0.0
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * @deprecated Use /wouaka-core or /wouaka-score instead
 * This function is maintained for backward compatibility only.
 * It will return a deprecation warning in the response.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Log deprecation warning
  console.warn('[DEPRECATED] calculate-score called - redirect to wouaka-core');

  try {
    const body = await req.json();
    
    // Check if user has Mobile Trust certification
    let phoneTrustScore = 0;
    let isCertified = false;
    
    if (body.phone_number || body.user_id) {
      const { data: phoneTrust } = await supabase
        .from('phone_trust_scores')
        .select('trust_score, otp_verified, ussd_verification_confidence, identity_cross_validated')
        .eq(body.user_id ? 'user_id' : 'phone_number', body.user_id || body.phone_number)
        .single();
      
      if (phoneTrust) {
        phoneTrustScore = phoneTrust.trust_score || 0;
        isCertified = phoneTrust.otp_verified && 
                      (phoneTrust.ussd_verification_confidence || 0) >= 70 &&
                      phoneTrust.identity_cross_validated;
      }
    }

    // Apply sovereign proof penalty for uncertified users
    const sovereignPenalty = isCertified ? 0 : 15;
    const dataQualityMultiplier = isCertified ? 1.0 : 0.7;

    // Simplified scoring with Mobile Trust integration
    const income = body.monthly_income || 0;
    const expenses = body.monthly_expenses || 0;
    const simAge = body.sim_age_months || 0;
    
    // Base score calculation
    let baseScore = 50;
    
    // Income factor
    if (income > 0) {
      const incomeScore = Math.min(20, income / 100000 * 20);
      baseScore += incomeScore;
    }
    
    // Expense ratio
    if (income > 0 && expenses > 0) {
      const ratio = expenses / income;
      if (ratio < 0.6) baseScore += 10;
      else if (ratio < 0.8) baseScore += 5;
      else if (ratio > 1.0) baseScore -= 10;
    }
    
    // SIM age (identity proxy)
    if (simAge > 24) baseScore += 10;
    else if (simAge > 12) baseScore += 5;
    else if (simAge < 3) baseScore -= 5;
    
    // Phone Trust Score integration (NEW)
    baseScore += (phoneTrustScore / 100) * 15;
    
    // Apply sovereign penalty for uncertified data
    baseScore = (baseScore - sovereignPenalty) * dataQualityMultiplier;
    baseScore = Math.round(Math.max(0, Math.min(100, baseScore)));

    // Determine grade
    let grade: string;
    let riskTier: string;
    if (baseScore >= 85) { grade = 'A+'; riskTier = 'prime'; }
    else if (baseScore >= 70) { grade = 'A'; riskTier = 'near_prime'; }
    else if (baseScore >= 55) { grade = 'B'; riskTier = 'standard'; }
    else if (baseScore >= 40) { grade = 'C'; riskTier = 'subprime'; }
    else if (baseScore >= 25) { grade = 'D'; riskTier = 'high_risk'; }
    else { grade = 'E'; riskTier = 'decline'; }

    const response = {
      success: true,
      deprecated: true,
      deprecation_notice: 'This endpoint is deprecated. Use /wouaka-core for full pipeline or /wouaka-score for scoring.',
      migration_guide: 'https://docs.wouaka.com/api/migration-v2',
      data: {
        score: baseScore,
        grade,
        risk_tier: riskTier,
        confidence: isCertified ? 85 : 45,
        data_quality: isCertified ? 'certified' : 'declared',
        phone_trust_score: phoneTrustScore,
        is_certified: isCertified,
        sovereign_penalty_applied: sovereignPenalty,
        warnings: isCertified ? [] : [
          'Données non certifiées - score pénalisé de 15 points',
          'Recommandation: Compléter la certification Mobile Trust',
        ],
        calculated_at: new Date().toISOString(),
      },
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Deprecation-Warning': 'This endpoint is deprecated. Use /wouaka-core instead.',
        } 
      }
    );

  } catch (error) {
    console.error('Calculate Score Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request', 
        deprecated: true,
        message: 'Use /wouaka-core instead',
        details: (error as Error).message 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
