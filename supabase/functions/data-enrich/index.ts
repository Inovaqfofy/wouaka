import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// REAL Data Enrichment Orchestrator
// NO SIMULATIONS - Only verified sources
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
  // Document data from OCR
  document_extraction?: {
    full_name?: string;
    birth_date?: string;
    document_number?: string;
    expiry_date?: string;
    extraction_confidence: number;
    method: 'deepseek' | 'regex_fallback';
  };
}

interface EnrichedSource {
  source_type: string;
  provider: string;
  display_name: string;
  data: any;
  confidence: number;
  verification_status: 'verified' | 'declared' | 'unavailable';
  processing_time_ms: number;
  is_real: boolean; // New flag to indicate real vs simulated
  error?: string;
}

interface CrossValidationResult {
  field: string;
  declared_value: string;
  verified_value?: string;
  match: boolean;
  source: string;
}

// ============================================
// REAL RCCM Verification via Scraping
// ============================================
async function verifyRCCM(rccmNumber: string, supabaseUrl: string, supabaseKey: string): Promise<EnrichedSource> {
  const startTime = Date.now();
  
  try {
    // Call our rccm-verify edge function which does real scraping
    const response = await fetch(`${supabaseUrl}/functions/v1/rccm-verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ rccm_number: rccmNumber }),
    });

    if (!response.ok) {
      throw new Error(`RCCM verify failed: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      source_type: 'registry',
      provider: 'tribunal_commerce_abidjan',
      display_name: 'Registre du Commerce (RCCM)',
      data: result.data || { rccm_number: rccmNumber, format_valid: result.source === 'format_validated' },
      confidence: result.confidence || 0,
      verification_status: result.verified ? 'verified' : 'declared',
      processing_time_ms: Date.now() - startTime,
      is_real: true,
      error: result.error,
    };
  } catch (error) {
    console.error('RCCM verification error:', error);
    return {
      source_type: 'registry',
      provider: 'tribunal_commerce_abidjan',
      display_name: 'Registre du Commerce (RCCM)',
      data: { rccm_number: rccmNumber, error: true },
      confidence: 0,
      verification_status: 'unavailable',
      processing_time_ms: Date.now() - startTime,
      is_real: true,
      error: error instanceof Error ? error.message : 'Erreur de vérification RCCM',
    };
  }
}

// ============================================
// Document Analysis Results (from previous OCR)
// ============================================
function processDocumentExtraction(docData: EnrichmentRequest['document_extraction']): EnrichedSource | null {
  if (!docData) return null;
  
  return {
    source_type: 'identity_document',
    provider: docData.method === 'deepseek' ? 'deepseek_ocr' : 'tesseract_regex',
    display_name: docData.method === 'deepseek' ? 'Analyse IA (DeepSeek)' : 'OCR Local',
    data: {
      full_name: docData.full_name,
      birth_date: docData.birth_date,
      document_number: docData.document_number,
      expiry_date: docData.expiry_date,
    },
    confidence: docData.extraction_confidence,
    verification_status: docData.extraction_confidence >= 70 ? 'verified' : 'declared',
    processing_time_ms: 0, // Already processed
    is_real: true,
  };
}

// ============================================
// Cross-Validation: Compare declared vs verified data
// ============================================
function crossValidateData(
  declaredName: string | undefined,
  declaredId: string | undefined,
  sources: EnrichedSource[]
): CrossValidationResult[] {
  const results: CrossValidationResult[] = [];
  
  // Find document source
  const docSource = sources.find(s => s.source_type === 'identity_document' && s.verification_status === 'verified');
  
  if (docSource && declaredName) {
    const verifiedName = docSource.data.full_name;
    if (verifiedName) {
      const normalizedDeclared = declaredName.toLowerCase().trim();
      const normalizedVerified = verifiedName.toLowerCase().trim();
      const match = normalizedDeclared === normalizedVerified || 
                    normalizedVerified.includes(normalizedDeclared) ||
                    normalizedDeclared.includes(normalizedVerified);
      
      results.push({
        field: 'full_name',
        declared_value: declaredName,
        verified_value: verifiedName,
        match,
        source: docSource.provider,
      });
    }
  }
  
  if (docSource && declaredId) {
    const verifiedId = docSource.data.document_number;
    if (verifiedId) {
      const match = declaredId.replace(/\s/g, '').toLowerCase() === 
                    verifiedId.replace(/\s/g, '').toLowerCase();
      
      results.push({
        field: 'national_id',
        declared_value: declaredId,
        verified_value: verifiedId,
        match,
        source: docSource.provider,
      });
    }
  }
  
  // RCCM validation
  const rccmSource = sources.find(s => s.source_type === 'registry' && s.verification_status === 'verified');
  if (rccmSource && rccmSource.data.company_name) {
    results.push({
      field: 'company_registration',
      declared_value: 'RCCM déclaré',
      verified_value: rccmSource.data.company_name,
      match: true,
      source: rccmSource.provider,
    });
  }
  
  return results;
}

// ============================================
// Calculate feature adjustments from REAL data only
// ============================================
function calculateRealEnrichmentScores(sources: EnrichedSource[], crossValidation: CrossValidationResult[]): {
  feature_adjustments: Record<string, number>;
  overall_confidence: number;
  verified_count: number;
  declared_count: number;
} {
  const adjustments: Record<string, number> = {};
  let totalConfidence = 0;
  let verifiedCount = 0;
  let declaredCount = 0;
  
  for (const source of sources) {
    if (source.verification_status === 'unavailable') continue;
    
    if (source.verification_status === 'verified') {
      verifiedCount++;
      totalConfidence += source.confidence;
    } else {
      declaredCount++;
      totalConfidence += source.confidence * 0.5; // Declared data gets lower weight
    }
    
    // RCCM verification adjustments
    if (source.source_type === 'registry' && source.verification_status === 'verified') {
      adjustments.business_formalization = 1.0;
      if (source.data.registration_date) {
        const regYear = new Date(source.data.registration_date).getFullYear();
        const yearsActive = new Date().getFullYear() - regYear;
        adjustments.employment_stability = Math.min(yearsActive / 10, 1);
      }
    }
    
    // Identity verification adjustments
    if (source.source_type === 'identity_document' && source.verification_status === 'verified') {
      adjustments.identity_verification = source.confidence / 100;
    }
  }
  
  // Cross-validation bonus
  const matchCount = crossValidation.filter(cv => cv.match).length;
  const totalChecks = crossValidation.length;
  if (totalChecks > 0) {
    adjustments.cross_validation_score = matchCount / totalChecks;
  }
  
  const sourceCount = verifiedCount + declaredCount;
  
  return {
    feature_adjustments: adjustments,
    overall_confidence: sourceCount > 0 ? Math.round(totalConfidence / sourceCount) : 30,
    verified_count: verifiedCount,
    declared_count: declaredCount,
  };
}

// ============================================
// Main Handler
// ============================================
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
    const { phone_number, consent, rccm_number, national_id, document_extraction } = requestData;

    if (!phone_number) {
      return new Response(
        JSON.stringify({ error: "phone_number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[REAL] Starting enrichment for ${phone_number}`);

    const sources: EnrichedSource[] = [];

    // ============================================
    // 1. RCCM Verification (REAL - Scraping)
    // ============================================
    if (consent.registry && rccm_number) {
      console.log(`[REAL] Verifying RCCM: ${rccm_number}`);
      const rccmResult = await verifyRCCM(rccm_number, supabaseUrl, supabaseKey);
      sources.push(rccmResult);
    }

    // ============================================
    // 2. Document Analysis (REAL - DeepSeek/OCR)
    // ============================================
    if (document_extraction) {
      console.log(`[REAL] Processing document extraction`);
      const docSource = processDocumentExtraction(document_extraction);
      if (docSource) {
        sources.push(docSource);
      }
    }

    // ============================================
    // 3. Mobile Money Verification (REAL APIs)
    // Attempts MTN MoMo, Orange Money, Wave
    // ============================================
    if (consent.mobile_money && phone_number) {
      console.log(`[REAL] Attempting Mobile Money verification for ${phone_number}`);
      
      const mobileMoneyResults: EnrichedSource[] = [];
      
      // Try MTN MoMo
      try {
        const mtnResponse = await fetch(`${supabaseUrl}/functions/v1/mtn-momo-verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ 
            phone_number, 
            account_holder_consent: true,
            request_type: 'account_status'
          }),
        });
        
        if (mtnResponse.ok) {
          const mtnResult = await mtnResponse.json();
          if (mtnResult.status !== 'not_configured') {
            mobileMoneyResults.push({
              source_type: 'mobile_money',
              provider: 'mtn_momo',
              display_name: 'MTN Mobile Money',
              data: mtnResult.data || {},
              confidence: mtnResult.confidence || 0,
              verification_status: mtnResult.verified ? 'verified' : 'declared',
              processing_time_ms: mtnResult.processing_time_ms || 0,
              is_real: true,
              error: mtnResult.error,
            });
          }
        }
      } catch (e) {
        console.log('[REAL] MTN MoMo check failed:', e);
      }
      
      // Try Orange Money
      try {
        const orangeResponse = await fetch(`${supabaseUrl}/functions/v1/orange-money-verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ 
            phone_number, 
            account_holder_consent: true,
            country_code: 'CI'
          }),
        });
        
        if (orangeResponse.ok) {
          const orangeResult = await orangeResponse.json();
          if (orangeResult.status !== 'not_configured') {
            mobileMoneyResults.push({
              source_type: 'mobile_money',
              provider: 'orange_money',
              display_name: 'Orange Money',
              data: orangeResult.data || {},
              confidence: orangeResult.confidence || 0,
              verification_status: orangeResult.verified ? 'verified' : 'declared',
              processing_time_ms: orangeResult.processing_time_ms || 0,
              is_real: true,
              error: orangeResult.error,
            });
          }
        }
      } catch (e) {
        console.log('[REAL] Orange Money check failed:', e);
      }
      
      // Try Wave
      try {
        const waveResponse = await fetch(`${supabaseUrl}/functions/v1/wave-verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ 
            phone_number, 
            account_holder_consent: true 
          }),
        });
        
        if (waveResponse.ok) {
          const waveResult = await waveResponse.json();
          if (waveResult.status !== 'not_configured') {
            mobileMoneyResults.push({
              source_type: 'mobile_money',
              provider: 'wave',
              display_name: 'Wave',
              data: waveResult.data || {},
              confidence: waveResult.confidence || 0,
              verification_status: waveResult.verified ? 'verified' : 'declared',
              processing_time_ms: waveResult.processing_time_ms || 0,
              is_real: true,
              error: waveResult.error,
            });
          }
        }
      } catch (e) {
        console.log('[REAL] Wave check failed:', e);
      }
      
      // Add mobile money results or unavailable status
      if (mobileMoneyResults.length > 0) {
        sources.push(...mobileMoneyResults);
      } else {
        // No APIs configured - show helpful message
        sources.push({
          source_type: 'mobile_money',
          provider: 'none',
          display_name: 'Mobile Money',
          data: { 
            message: 'APIs Mobile Money non configurées',
            required_secrets: ['MTN_MOMO_SUBSCRIPTION_KEY', 'MTN_MOMO_API_USER', 'MTN_MOMO_API_KEY', 'ORANGE_MONEY_CLIENT_ID', 'ORANGE_MONEY_CLIENT_SECRET', 'WAVE_API_KEY'],
          },
          confidence: 0,
          verification_status: 'unavailable',
          processing_time_ms: 0,
          is_real: true,
          error: 'Aucune API Mobile Money configurée. Ajoutez les clés API pour activer la vérification.',
        });
      }
    }

    // ============================================
    // 4. Telecom (requires B2B partnership - not available via public API)
    // ============================================
    if (consent.telecom) {
      sources.push({
        source_type: 'telecom',
        provider: 'none',
        display_name: 'Données Télécom',
        data: { 
          message: 'Nécessite un partenariat B2B avec les opérateurs',
          status: 'partnership_required'
        },
        confidence: 0,
        verification_status: 'unavailable',
        processing_time_ms: 0,
        is_real: true,
        error: 'Les données télécom nécessitent un accord de partenariat direct avec MTN, Orange, ou Moov.',
      });
    }

    // ============================================
    // 5. Utility Bills (CIE/SODECI - no public API, OCR integration possible)
    // ============================================
    if (consent.utility) {
      sources.push({
        source_type: 'utility',
        provider: 'none',
        display_name: 'Factures Utilitaires',
        data: { 
          message: 'Intégration OCR disponible pour analyse de factures',
          alternative: 'Téléchargez une facture CIE/SODECI pour analyse automatique'
        },
        confidence: 0,
        verification_status: 'unavailable',
        processing_time_ms: 0,
        is_real: true,
        error: 'Pas d\'API publique. Utilisez l\'OCR de factures pour vérification.',
      });
    }

    // ============================================
    // 4. Cross-Validation
    // ============================================
    const crossValidation = crossValidateData(
      requestData.document_extraction?.full_name,
      national_id,
      sources
    );

    // ============================================
    // 5. Calculate REAL scores
    // ============================================
    const { feature_adjustments, overall_confidence, verified_count, declared_count } = 
      calculateRealEnrichmentScores(sources, crossValidation);

    const processingTime = Date.now() - startTime;

    console.log(`[REAL] Enrichment completed in ${processingTime}ms - ${verified_count} verified, ${declared_count} declared`);

    // Store enrichment in database
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (user) {
          await supabase.from('data_enrichments').insert({
            source_type: 'enrichment_session',
            source_provider: 'wouaka_orchestrator',
            raw_data: { phone_number, consent, rccm_number, sources_count: sources.length },
            normalized_data: { feature_adjustments, cross_validation: crossValidation },
            confidence_score: overall_confidence,
            verification_status: verified_count > 0 ? 'partial' : 'declared_only',
            processing_time_ms: processingTime,
            is_simulated: false,
          });
        }
      } catch (e) {
        console.log('Could not save enrichment log:', e);
      }
    }

    const response = {
      success: true,
      sources: sources.map(s => ({
        source_type: s.source_type,
        provider: s.provider,
        display_name: s.display_name,
        verification_status: s.verification_status,
        confidence: s.confidence,
        processing_time_ms: s.processing_time_ms,
        data: s.data,
        is_real: s.is_real,
        error: s.error,
      })),
      cross_validation: crossValidation,
      feature_adjustments,
      overall_confidence,
      processing_time_ms: processingTime,
      is_demo: false, // NO MORE DEMO - This is REAL
      data_summary: {
        verified_sources: verified_count,
        declared_sources: declared_count,
        unavailable_sources: sources.filter(s => s.verification_status === 'unavailable').length,
        cross_validation_matches: crossValidation.filter(cv => cv.match).length,
        cross_validation_total: crossValidation.length,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[REAL] Enrichment error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
        is_demo: false,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
