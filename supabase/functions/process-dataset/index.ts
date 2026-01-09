import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedRow {
  full_name?: string;
  phone_number?: string;
  national_id?: string;
  rccm_number?: string;
  company_name?: string;
  city?: string;
  region?: string;
  sector?: string;
  employment_type?: string;
  monthly_income?: number;
  monthly_expenses?: number;
  existing_loans?: number;
  mobile_money_volume?: number;
  mobile_money_transactions?: number;
  sim_age_months?: number;
  utility_payments_on_time?: number;
  utility_payments_late?: number;
  years_in_business?: number;
}

// Feature weights for scoring
const FEATURE_WEIGHTS = {
  income_ratio: 0.20,
  payment_history: 0.18,
  mobile_money_activity: 0.15,
  sim_stability: 0.12,
  employment_stability: 0.12,
  business_formalization: 0.10,
  loan_burden: 0.08,
  regional_factor: 0.05,
};

function calculateFeatures(input: ParsedRow) {
  const income = input.monthly_income || 0;
  const expenses = input.monthly_expenses || 0;
  const loans = input.existing_loans || 0;
  const mobileVolume = input.mobile_money_volume || 0;
  const mobileTx = input.mobile_money_transactions || 0;
  const simAge = input.sim_age_months || 0;
  const utilityOnTime = input.utility_payments_on_time || 0;
  const utilityLate = input.utility_payments_late || 0;
  const yearsInBusiness = input.years_in_business || 0;

  // Calculate features (0-1 scale)
  const income_ratio = income > 0 ? Math.min((income - expenses) / income, 1) : 0;
  const totalPayments = utilityOnTime + utilityLate;
  const payment_history = totalPayments > 0 ? utilityOnTime / totalPayments : 0.5;
  const mobile_money_activity = Math.min(mobileTx / 100, 1) * 0.5 + Math.min(mobileVolume / 1000000, 1) * 0.5;
  const sim_stability = Math.min(simAge / 60, 1);
  
  let employment_stability = 0.5;
  if (input.employment_type === 'cdi') employment_stability = 1;
  else if (input.employment_type === 'cdd') employment_stability = 0.7;
  else if (input.employment_type === 'freelance') employment_stability = 0.5;
  else if (input.employment_type === 'informal') employment_stability = 0.3;
  
  const business_formalization = input.rccm_number ? 1 : (yearsInBusiness > 2 ? 0.5 : 0.2);
  const loan_burden = income > 0 ? Math.max(0, 1 - (loans / income) * 2) : 0.5;
  const regional_factor = 0.7; // Default regional factor

  return {
    income_ratio,
    payment_history,
    mobile_money_activity,
    sim_stability,
    employment_stability,
    business_formalization,
    loan_burden,
    regional_factor,
  };
}

function calculateScore(features: Record<string, number>): number {
  let weightedSum = 0;
  for (const [feature, weight] of Object.entries(FEATURE_WEIGHTS)) {
    weightedSum += (features[feature] || 0) * weight;
  }
  // Scale to 0-100 range
  return Math.round(weightedSum * 100);
}

// Score scale: 0-100
function getRiskCategory(score: number): string {
  if (score >= 80) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 30) return 'poor';
  return 'very_poor';
}

function calculateConfidence(input: ParsedRow): number {
  let fieldsProvided = 0;
  let totalFields = 10;
  
  if (input.monthly_income) fieldsProvided++;
  if (input.monthly_expenses) fieldsProvided++;
  if (input.mobile_money_volume) fieldsProvided++;
  if (input.mobile_money_transactions) fieldsProvided++;
  if (input.sim_age_months) fieldsProvided++;
  if (input.utility_payments_on_time !== undefined) fieldsProvided++;
  if (input.employment_type) fieldsProvided++;
  if (input.rccm_number || input.years_in_business) fieldsProvided++;
  if (input.national_id) fieldsProvided++;
  if (input.phone_number) fieldsProvided++;
  
  return Math.round((fieldsProvided / totalFields) * 100);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, dataset_id, rows } = await req.json();

    if (action === 'process') {
      // Process dataset rows and calculate scores
      if (!dataset_id) {
        return new Response(
          JSON.stringify({ error: 'dataset_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get unprocessed rows
      const { data: unprocessedRows, error: fetchError } = await supabase
        .from('dataset_rows')
        .select('*')
        .eq('dataset_id', dataset_id)
        .is('processed_at', null)
        .order('row_number')
        .limit(50); // Process in batches

      if (fetchError) throw fetchError;

      const results = [];
      let processed = 0;

      for (const row of unprocessedRows || []) {
        try {
          const input = row.data as ParsedRow;
          const features = calculateFeatures(input);
          const score = calculateScore(features);
          const risk_category = getRiskCategory(score);
          const confidence = calculateConfidence(input);

          // Update the row with score
          const { error: updateError } = await supabase
            .from('dataset_rows')
            .update({
              score,
              risk_category,
              confidence,
              processed_at: new Date().toISOString(),
            })
            .eq('id', row.id);

          if (updateError) throw updateError;

          results.push({
            row_number: row.row_number,
            score,
            risk_category,
            confidence,
          });
          processed++;
        } catch (err: unknown) {
          // Log error for this row
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          await supabase
            .from('dataset_rows')
            .update({
              error_message: errorMessage,
              processed_at: new Date().toISOString(),
            })
            .eq('id', row.id);
        }
      }

      // Update dataset progress
      const { data: datasetData } = await supabase
        .from('datasets')
        .select('row_count, scores_calculated')
        .eq('id', dataset_id)
        .single();

      if (datasetData) {
        const newScoresCalculated = (datasetData.scores_calculated || 0) + processed;
        const progress = Math.round((newScoresCalculated / datasetData.row_count) * 100);
        
        await supabase
          .from('datasets')
          .update({
            scores_calculated: newScoresCalculated,
            processing_progress: progress,
            status: progress >= 100 ? 'completed' : 'processing',
          })
          .eq('id', dataset_id);
      }

      // Check if there are more rows to process
      const { count: remainingCount } = await supabase
        .from('dataset_rows')
        .select('*', { count: 'exact', head: true })
        .eq('dataset_id', dataset_id)
        .is('processed_at', null);

      return new Response(
        JSON.stringify({
          processed,
          results,
          has_more: (remainingCount || 0) > 0,
          remaining: remainingCount,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'import') {
      // Import rows into dataset
      if (!dataset_id || !rows || !Array.isArray(rows)) {
        return new Response(
          JSON.stringify({ error: 'dataset_id and rows array required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const rowsToInsert = rows.map((data: Record<string, unknown>, index: number) => ({
        dataset_id,
        row_number: index + 1,
        data,
      }));

      const { error: insertError } = await supabase
        .from('dataset_rows')
        .insert(rowsToInsert);

      if (insertError) throw insertError;

      // Update dataset row count
      await supabase
        .from('datasets')
        .update({
          row_count: rows.length,
          status: 'processing',
        })
        .eq('id', dataset_id);

      return new Response(
        JSON.stringify({
          success: true,
          imported: rows.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "import" or "process"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Dataset processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
