import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-signature',
};

interface OutcomePayload {
  scoring_request_id: string;
  outcome: {
    decision: 'approved' | 'rejected';
    loan_amount?: number;
    tenor_months?: number;
    interest_rate?: number;
    disbursement_date?: string;
    
    // Post-maturity data (optional)
    repayment_status?: 'pending' | 'on_time' | 'late_30' | 'late_60' | 'late_90' | 'default' | 'early_repayment';
    total_repaid?: number;
    days_late_avg?: number;
    maturity_date?: string;
    outcome_date?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Authenticate via API key
    const apiKey = req.headers.get('x-api-key');
    const signature = req.headers.get('x-signature');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the API key for lookup
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Find the API key and partner
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('id, user_id, permissions, is_active')
      .eq('key_hash', keyHash)
      .single();

    if (keyError || !apiKeyData) {
      console.error('[Partner Outcome] Invalid API key');
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!apiKeyData.is_active) {
      return new Response(
        JSON.stringify({ error: 'API key is inactive' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const partnerId = apiKeyData.user_id;
    
    // Parse request body
    const body: OutcomePayload = await req.json();
    
    // Validate required fields
    if (!body.scoring_request_id || !body.outcome) {
      return new Response(
        JSON.stringify({ error: 'scoring_request_id and outcome are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['approved', 'rejected'].includes(body.outcome.decision)) {
      return new Response(
        JSON.stringify({ error: 'Invalid decision. Must be approved or rejected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Partner Outcome] Processing outcome for scoring request ${body.scoring_request_id}`);

    // Verify the scoring request belongs to this partner
    const { data: scoringRequest, error: srError } = await supabase
      .from('scoring_requests')
      .select('id, partner_id, user_id, result, grade, risk_category, customer_profile_id')
      .eq('id', body.scoring_request_id)
      .single();

    if (srError || !scoringRequest) {
      console.error('[Partner Outcome] Scoring request not found:', body.scoring_request_id);
      return new Response(
        JSON.stringify({ error: 'Scoring request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (scoringRequest.partner_id !== partnerId) {
      console.error('[Partner Outcome] Scoring request does not belong to this partner');
      return new Response(
        JSON.stringify({ error: 'Access denied to this scoring request' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if outcome already exists
    const { data: existingOutcome } = await supabase
      .from('loan_outcomes')
      .select('id, repayment_status')
      .eq('scoring_request_id', body.scoring_request_id)
      .single();

    const outcomeData = {
      scoring_request_id: body.scoring_request_id,
      partner_id: partnerId,
      customer_profile_id: scoringRequest.customer_profile_id,
      loan_granted: body.outcome.decision === 'approved',
      loan_amount: body.outcome.loan_amount,
      loan_tenor_months: body.outcome.tenor_months,
      interest_rate: body.outcome.interest_rate,
      score_at_decision: scoringRequest.result,
      grade_at_decision: scoringRequest.grade,
      risk_level_at_decision: scoringRequest.risk_category,
      repayment_status: body.outcome.repayment_status || 'pending',
      total_repaid: body.outcome.total_repaid || 0,
      days_late_avg: body.outcome.days_late_avg || 0,
      disbursement_date: body.outcome.disbursement_date,
      maturity_date: body.outcome.maturity_date,
      outcome_date: body.outcome.outcome_date,
      outcome_reported_by: partnerId,
      decision_date: new Date().toISOString()
    };

    let result;
    if (existingOutcome) {
      // Update existing outcome
      const { data, error } = await supabase
        .from('loan_outcomes')
        .update({
          ...outcomeData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingOutcome.id)
        .select()
        .single();

      if (error) throw error;
      result = { ...data, updated: true };
      
      console.log(`[Partner Outcome] Updated outcome ${existingOutcome.id}`);
    } else {
      // Create new outcome
      const { data, error } = await supabase
        .from('loan_outcomes')
        .insert(outcomeData)
        .select()
        .single();

      if (error) throw error;
      result = { ...data, created: true };
      
      console.log(`[Partner Outcome] Created outcome ${data.id}`);
    }

    // Update API key last used
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyData.id);

    // Log the API call
    await supabase
      .from('api_calls')
      .insert({
        api_key_id: apiKeyData.id,
        user_id: partnerId,
        endpoint: '/partner-outcome',
        method: 'POST',
        status_code: 200,
        request_body: { scoring_request_id: body.scoring_request_id, decision: body.outcome.decision },
        response_body: { success: true, outcome_id: result.id },
        processing_time_ms: 0
      });

    // Calculate discount for outcome sharing (incentive)
    const { count: outcomesCount } = await supabase
      .from('loan_outcomes')
      .select('id', { count: 'exact', head: true })
      .eq('partner_id', partnerId)
      .neq('repayment_status', 'pending');

    const sharingRate = Math.min((outcomesCount || 0) / 100, 1);
    const discountPercentage = Math.round(sharingRate * 30); // Up to 30% discount

    return new Response(
      JSON.stringify({
        success: true,
        outcome_id: result.id,
        status: existingOutcome ? 'updated' : 'created',
        incentive: {
          outcomes_shared: outcomesCount || 0,
          discount_percentage: discountPercentage,
          message: discountPercentage > 0 
            ? `Merci! Vous bénéficiez d'une réduction de ${discountPercentage}% sur vos requêtes.`
            : 'Partagez plus d\'outcomes pour bénéficier de réductions.'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Partner Outcome] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
