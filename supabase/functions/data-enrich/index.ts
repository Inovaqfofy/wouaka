import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// Data Enrichment Orchestrator
// Collects and normalizes data from multiple sources
// ============================================

interface EnrichmentRequest {
  phone_number: string;
  consent: {
    mobile_money: boolean;
    telecom: boolean;
    registry: boolean;
    utility: boolean;
  };
  rccm_number?: string;
  national_id?: string;
}

interface EnrichedSource {
  source_type: string;
  provider: string;
  display_name: string;
  data: any;
  confidence: number;
  verification_status: 'verified' | 'simulated' | 'failed';
  processing_time_ms: number;
}

// Simulate Mobile Money data (will be replaced by real API)
async function enrichMobileMoney(phoneNumber: string): Promise<EnrichedSource[]> {
  const startTime = Date.now();
  
  // Determine profile based on phone number for consistent simulation
  const lastDigit = parseInt(phoneNumber.slice(-1)) || 5;
  const isExcellent = lastDigit >= 8;
  const isGood = lastDigit >= 5;
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
  
  const baseVolume = isExcellent ? 3500000 : isGood ? 1200000 : 280000;
  const baseTransactions = isExcellent ? 85 : isGood ? 45 : 12;
  
  return [{
    source_type: 'mobile_money',
    provider: 'mtn_momo_ci',
    display_name: 'MTN Mobile Money',
    data: {
      account_status: 'active',
      account_age_months: isExcellent ? 48 : isGood ? 28 : 8,
      last_30_days: {
        incoming_count: baseTransactions,
        incoming_volume: baseVolume,
        outgoing_count: Math.round(baseTransactions * 0.85),
        outgoing_volume: Math.round(baseVolume * 0.8),
        p2p_count: Math.round(baseTransactions * 0.4),
        merchant_payment_count: Math.round(baseTransactions * 0.3),
        bill_payment_count: Math.round(baseTransactions * 0.14),
        average_transaction_amount: Math.round(baseVolume / baseTransactions),
      },
      last_90_days: {
        incoming_volume: baseVolume * 2.9,
        outgoing_volume: baseVolume * 2.3,
        total_transactions: baseTransactions * 5,
      },
      average_balance: isExcellent ? 850000 : isGood ? 180000 : 45000,
      transaction_regularity_score: isExcellent ? 92 : isGood ? 75 : 48,
    },
    confidence: 85, // Simulated data gets 85% confidence
    verification_status: 'simulated',
    processing_time_ms: Date.now() - startTime,
  }];
}

// Simulate Telecom data
async function enrichTelecom(phoneNumber: string): Promise<EnrichedSource[]> {
  const startTime = Date.now();
  
  const lastDigit = parseInt(phoneNumber.slice(-1)) || 5;
  const isExcellent = lastDigit >= 8;
  const isGood = lastDigit >= 5;
  
  await new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 150));
  
  return [{
    source_type: 'telecom',
    provider: 'mtn_telecom_ci',
    display_name: 'MTN Télécom Data',
    data: {
      sim_age_months: isExcellent ? 72 : isGood ? 36 : 14,
      network_provider: 'MTN',
      account_type: isExcellent ? 'postpaid' : 'prepaid',
      recharge_pattern: {
        frequency: isExcellent ? 'monthly' : isGood ? 'weekly' : 'irregular',
        average_amount: isExcellent ? 50000 : isGood ? 5000 : 2000,
        consistency_score: isExcellent ? 95 : isGood ? 70 : 40,
      },
      usage_metrics: {
        avg_monthly_voice_minutes: isExcellent ? 450 : isGood ? 280 : 120,
        avg_monthly_data_mb: isExcellent ? 8500 : isGood ? 3500 : 1200,
        data_usage_trend: isGood ? 'stable' : 'increasing',
      },
      location_stability_score: isExcellent ? 88 : isGood ? 72 : 55,
      device_change_frequency: isExcellent ? 0.5 : isGood ? 1 : 2,
    },
    confidence: 80,
    verification_status: 'simulated',
    processing_time_ms: Date.now() - startTime,
  }];
}

// Simulate RCCM verification
async function enrichRegistry(rccmNumber?: string): Promise<EnrichedSource[]> {
  if (!rccmNumber) return [];
  
  const startTime = Date.now();
  
  await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300));
  
  // Validate RCCM format (CI-XXX-YYYY-X-NNNNN)
  const isValidFormat = /^CI-[A-Z]{3}-\d{4}-[A-Z]-\d{5}$/i.test(rccmNumber);
  
  if (!isValidFormat) {
    return [{
      source_type: 'registry',
      provider: 'rccm_ci',
      display_name: 'Registre du Commerce (RCCM)',
      data: { error: 'Format RCCM invalide' },
      confidence: 0,
      verification_status: 'failed',
      processing_time_ms: Date.now() - startTime,
    }];
  }
  
  // Extract year from RCCM for simulation
  const yearMatch = rccmNumber.match(/-(\d{4})-/);
  const year = yearMatch ? parseInt(yearMatch[1]) : 2020;
  const currentYear = new Date().getFullYear();
  const yearsActive = currentYear - year;
  
  return [{
    source_type: 'registry',
    provider: 'rccm_ci',
    display_name: 'Registre du Commerce (RCCM)',
    data: {
      is_valid: true,
      company_name: 'ENTREPRISE SIMULÉE SARL',
      rccm_number: rccmNumber.toUpperCase(),
      registration_date: `${year}-03-15`,
      activity_sector: 'Commerce général',
      legal_form: 'SARL',
      status: 'active',
      capital: yearsActive > 3 ? 5000000 : 1000000,
      currency: 'XOF',
      address: 'Plateau, Abidjan',
      city: 'Abidjan',
      last_declaration_date: `${currentYear - 1}-12-01`,
      directors_count: yearsActive > 3 ? 2 : 1,
    },
    confidence: 90, // High confidence for format-validated RCCM
    verification_status: 'simulated',
    processing_time_ms: Date.now() - startTime,
  }];
}

// Simulate utility data
async function enrichUtility(phoneNumber: string): Promise<EnrichedSource[]> {
  const startTime = Date.now();
  
  const lastDigit = parseInt(phoneNumber.slice(-1)) || 5;
  const isExcellent = lastDigit >= 8;
  const isGood = lastDigit >= 5;
  
  await new Promise(resolve => setTimeout(resolve, 350 + Math.random() * 200));
  
  return [{
    source_type: 'utility',
    provider: 'cie_ci',
    display_name: 'CIE Électricité',
    data: {
      utility_type: 'electricity',
      account_status: isExcellent || isGood ? 'active' : 'suspended',
      account_age_months: isExcellent ? 60 : isGood ? 24 : 12,
      payment_history: {
        last_12_months_on_time: isExcellent ? 11 : isGood ? 9 : 3,
        last_12_months_late: isExcellent ? 1 : isGood ? 3 : 5,
        last_12_months_missed: isExcellent ? 0 : isGood ? 0 : 4,
        average_days_to_payment: isExcellent ? 5 : isGood ? 12 : 35,
      },
      consumption_pattern: {
        average_monthly_amount: isExcellent ? 85000 : isGood ? 35000 : 25000,
        trend: isExcellent ? 'stable' : isGood ? 'stable' : 'decreasing',
      },
    },
    confidence: 75,
    verification_status: 'simulated',
    processing_time_ms: Date.now() - startTime,
  }];
}

// Calculate normalized scores from enriched data
function calculateEnrichmentScores(sources: EnrichedSource[]): {
  feature_adjustments: Record<string, number>;
  overall_confidence: number;
} {
  const adjustments: Record<string, number> = {};
  let totalConfidence = 0;
  let sourceCount = 0;
  
  for (const source of sources) {
    if (source.verification_status === 'failed') continue;
    
    totalConfidence += source.confidence;
    sourceCount++;
    
    const data = source.data;
    
    if (source.source_type === 'mobile_money' && data.transaction_regularity_score) {
      adjustments.mobile_money_activity = data.transaction_regularity_score / 100;
      adjustments.payment_history = Math.min(
        (data.last_30_days?.bill_payment_count || 0) / 15 + 0.3,
        1
      );
    }
    
    if (source.source_type === 'telecom' && data.sim_age_months) {
      adjustments.sim_stability = Math.min(data.sim_age_months / 36, 1);
      adjustments.location_stability = (data.location_stability_score || 50) / 100;
    }
    
    if (source.source_type === 'registry' && data.is_valid) {
      adjustments.business_formalization = 1.0;
      const yearsActive = (new Date().getFullYear() - 
        new Date(data.registration_date).getFullYear());
      adjustments.employment_stability = Math.min(yearsActive / 10, 1);
    }
    
    if (source.source_type === 'utility' && data.payment_history) {
      const onTime = data.payment_history.last_12_months_on_time || 0;
      const late = data.payment_history.last_12_months_late || 0;
      const total = onTime + late + (data.payment_history.last_12_months_missed || 0);
      if (total > 0) {
        adjustments.utility_payment_score = onTime / total;
      }
    }
  }
  
  return {
    feature_adjustments: adjustments,
    overall_confidence: sourceCount > 0 ? totalConfidence / sourceCount : 50,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: EnrichmentRequest = await req.json();
    const { phone_number, consent, rccm_number, national_id } = requestData;

    if (!phone_number) {
      return new Response(
        JSON.stringify({ error: "phone_number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting enrichment for ${phone_number}`);

    // Collect data from enabled sources in parallel
    const enrichmentPromises: Promise<EnrichedSource[]>[] = [];

    if (consent.mobile_money) {
      enrichmentPromises.push(enrichMobileMoney(phone_number));
    }
    if (consent.telecom) {
      enrichmentPromises.push(enrichTelecom(phone_number));
    }
    if (consent.registry && rccm_number) {
      enrichmentPromises.push(enrichRegistry(rccm_number));
    }
    if (consent.utility) {
      enrichmentPromises.push(enrichUtility(phone_number));
    }

    const results = await Promise.all(enrichmentPromises);
    const allSources = results.flat();

    // Calculate scores from enriched data
    const { feature_adjustments, overall_confidence } = calculateEnrichmentScores(allSources);

    const processingTime = Date.now() - startTime;

    console.log(`Enrichment completed in ${processingTime}ms - ${allSources.length} sources`);

    const response = {
      success: true,
      sources: allSources.map(s => ({
        source_type: s.source_type,
        provider: s.provider,
        display_name: s.display_name,
        verification_status: s.verification_status,
        confidence: s.confidence,
        processing_time_ms: s.processing_time_ms,
        data: s.data,
      })),
      feature_adjustments,
      overall_confidence,
      processing_time_ms: processingTime,
      is_demo: true, // Flag to indicate simulation mode
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Enrichment error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
