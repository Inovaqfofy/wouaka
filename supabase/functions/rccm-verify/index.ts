import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as cheerio from "https://esm.sh/cheerio@1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RCCMVerificationResult {
  verified: boolean;
  source: 'public_registry' | 'format_validated' | 'cache' | 'error';
  data?: {
    company_name?: string;
    registration_date?: string;
    formality_type?: string;
    jurisdiction?: string;
  };
  confidence: number;
  cached?: boolean;
  error?: string;
}

// RCCM format validation for Côte d'Ivoire
function validateRCCMFormat(rccm: string): boolean {
  // Format: CI-ABJ-XXXX-X-XXXXX or similar variations
  const patterns = [
    /^CI-[A-Z]{3}-\d{4}-[A-Z]-\d{5}$/i,
    /^[A-Z]{2}-[A-Z]{3}-\d{4,}$/i,
    /^\d{4,}-[A-Z]{3}$/i,
  ];
  return patterns.some(p => p.test(rccm.trim()));
}

// Scrape the Tribunal de Commerce website
async function scrapeRCCM(rccmNumber: string): Promise<RCCMVerificationResult> {
  try {
    const url = `https://tribunalcommerceabidjan.ci/rc?rccm=${encodeURIComponent(rccmNumber)}`;
    
    console.log(`Scraping RCCM: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
    });

    if (!response.ok) {
      console.error(`HTTP error: ${response.status}`);
      return {
        verified: false,
        source: 'error',
        confidence: 0,
        error: `HTTP ${response.status}`,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try to extract data from the page
    // Note: This is based on typical structure, may need adjustment
    const companyName = $('td:contains("Dénomination"), td:contains("Raison sociale")')
      .next('td').text().trim() || 
      $('table tr').filter((_, el) => $(el).text().includes('Dénomination'))
        .find('td').last().text().trim();

    const registrationDate = $('td:contains("Date")')
      .next('td').text().trim() ||
      $('table tr').filter((_, el) => $(el).text().includes('Date'))
        .find('td').last().text().trim();

    const formalityType = $('td:contains("Formalité"), td:contains("Type")')
      .next('td').text().trim();

    // Check if we found any data
    const hasData = !!(companyName || registrationDate);
    
    if (hasData) {
      return {
        verified: true,
        source: 'public_registry',
        data: {
          company_name: companyName || undefined,
          registration_date: registrationDate || undefined,
          formality_type: formalityType || undefined,
          jurisdiction: 'Tribunal de Commerce d\'Abidjan',
        },
        confidence: companyName ? 95 : 70,
      };
    }

    // No data found, but format might be valid
    if (validateRCCMFormat(rccmNumber)) {
      return {
        verified: false,
        source: 'format_validated',
        confidence: 40,
        error: 'RCCM non trouvé dans le registre public',
      };
    }

    return {
      verified: false,
      source: 'error',
      confidence: 0,
      error: 'Format RCCM invalide',
    };

  } catch (error) {
    console.error('Scraping error:', error);
    
    // Fallback to format validation
    if (validateRCCMFormat(rccmNumber)) {
      return {
        verified: false,
        source: 'format_validated',
        confidence: 30,
        error: 'Registre public inaccessible, format validé uniquement',
      };
    }

    return {
      verified: false,
      source: 'error',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Erreur de scraping',
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rccm_number, skip_cache = false } = await req.json();

    if (!rccm_number) {
      return new Response(
        JSON.stringify({ error: 'rccm_number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first (24h TTL)
    if (!skip_cache) {
      const { data: cached } = await supabase
        .from('data_enrichments')
        .select('*')
        .eq('source_type', 'rccm_registry')
        .eq('source_provider', 'tribunal_commerce_abidjan')
        .contains('raw_data', { rccm_number })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (cached) {
        console.log('Returning cached RCCM result');
        return new Response(
          JSON.stringify({
            ...cached.normalized_data,
            cached: true,
            cached_at: cached.created_at,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const startTime = Date.now();
    const result = await scrapeRCCM(rccm_number);
    const processingTime = Date.now() - startTime;

    // Store result in cache
    await supabase.from('data_enrichments').insert({
      source_type: 'rccm_registry',
      source_provider: 'tribunal_commerce_abidjan',
      raw_data: { rccm_number, result },
      normalized_data: result,
      confidence_score: result.confidence,
      verification_status: result.verified ? 'verified' : 'unverified',
      processing_time_ms: processingTime,
      is_simulated: false,
    });

    return new Response(
      JSON.stringify({
        ...result,
        processing_time_ms: processingTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('RCCM verify error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
