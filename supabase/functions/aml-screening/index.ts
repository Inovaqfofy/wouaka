/**
 * Edge Function: AML Screening (Anti-Money Laundering)
 * 
 * Effectue le screening contre les listes de sanctions et détecte les PEP.
 * Intégré au workflow KYC pour le module LBC/FT.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// =====================================================
// JARO-WINKLER ALGORITHM
// =====================================================

function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions / 2) / matches) /
    3
  );
}

function jaroWinklerSimilarity(s1: string, s2: string, prefixScale = 0.1): number {
  const jaroScore = jaroSimilarity(s1, s2);
  let prefixLength = 0;
  const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));
  
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) prefixLength++;
    else break;
  }

  return jaroScore + prefixLength * prefixScale * (1 - jaroScore);
}

function normalizeName(name: string): string {
  if (!name) return '';
  
  let normalized = name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ');

  const variations: Record<string, string> = {
    'oumar': 'omar', 'mamadou': 'mamadu', 'amadou': 'amadu',
    'abdoulaye': 'abdulaye', 'moussa': 'musa', 'issa': 'isa',
    'seydou': 'seidou', 'ibrahima': 'ibrahim', 'ousmane': 'usman',
    'diallo': 'dialo', 'traore': 'traor', 'coulibaly': 'kulibali',
    'kone': 'kon', 'cisse': 'cis', 'toure': 'tur',
    'camara': 'kamara', 'diarra': 'diara', 'keita': 'keyta'
  };

  const words = normalized.split(' ');
  return words.map(word => variations[word] || word).join(' ');
}

async function hashSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// =====================================================
// PEP CATEGORIES
// =====================================================

const PEP_CATEGORIES = [
  { code: 'HEAD_STATE', name: 'Chef d\'État', weight: 50, keywords: ['president', 'chef etat', 'premier ministre'] },
  { code: 'MINISTER', name: 'Ministre', weight: 40, keywords: ['ministre', 'secretaire etat'] },
  { code: 'PARLIAMENT', name: 'Député/Sénateur', weight: 35, keywords: ['depute', 'senateur', 'parlement'] },
  { code: 'JUDICIARY', name: 'Magistrat', weight: 35, keywords: ['magistrat', 'juge', 'procureur'] },
  { code: 'CENTRAL_BANK', name: 'Banque Centrale', weight: 45, keywords: ['bceao', 'banque centrale', 'gouverneur'] },
  { code: 'MILITARY', name: 'Militaire', weight: 40, keywords: ['general', 'colonel', 'commandant', 'armee'] },
  { code: 'DIPLOMAT', name: 'Diplomate', weight: 30, keywords: ['ambassadeur', 'consul', 'diplomate'] },
  { code: 'SOE_DIRECTOR', name: 'Dirigeant Public', weight: 35, keywords: ['directeur general', 'dg', 'pca', 'regie financiere', 'impots', 'douanes', 'tresor'] },
  { code: 'PARTY_LEADER', name: 'Parti Politique', weight: 30, keywords: ['president parti', 'secretaire general parti'] },
  { code: 'INTL_ORG', name: 'Organisation Int.', weight: 25, keywords: ['onu', 'ua', 'cedeao', 'uemoa', 'bad'] }
];

// =====================================================
// TYPES
// =====================================================

interface ScreeningRequest {
  full_name: string;
  date_of_birth?: string;
  national_id?: string;
  occupation?: string;
  employer?: string;
  kyc_request_id?: string;
  partner_id?: string;
  document_image_url?: string;
}

interface SanctionMatch {
  entry_id: string;
  list_source: string;
  matched_name: string;
  match_score: number;
  match_type: string;
  sanction_type: string[];
  reason?: string;
  reference_url?: string;
}

interface PEPResult {
  is_pep: boolean;
  category_code: string | null;
  category_name: string | null;
  risk_increase: number;
  matched_keywords: string[];
}

// =====================================================
// MAIN HANDLER
// =====================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Parse request
    const body: ScreeningRequest = await req.json();
    
    if (!body.full_name) {
      return new Response(
        JSON.stringify({ error: 'full_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AML] Starting screening for: ${body.full_name.substring(0, 3)}***`);

    // Get auth context
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Hash data for compliance logging
    const fullNameHash = await hashSHA256(body.full_name);
    const dobHash = body.date_of_birth ? await hashSHA256(body.date_of_birth) : null;
    const nationalIdHash = body.national_id ? await hashSHA256(body.national_id) : null;

    // Normalize name for matching
    const normalizedName = normalizeName(body.full_name);

    // =====================================================
    // 1. SANCTIONS SCREENING
    // =====================================================
    
    // Query sanctions list from database with fuzzy matching
    const { data: sanctionsEntries, error: sanctionsError } = await supabase
      .from('sanctions_list_entries')
      .select('*')
      .eq('is_active', true);

    if (sanctionsError) {
      console.error('[AML] Error fetching sanctions:', sanctionsError);
    }

    const sanctionMatches: SanctionMatch[] = [];
    const matchThreshold = 0.85;

    if (sanctionsEntries && sanctionsEntries.length > 0) {
      for (const entry of sanctionsEntries) {
        const normalizedEntryName = normalizeName(entry.full_name);
        const nameScore = jaroWinklerSimilarity(normalizedName, normalizedEntryName);

        if (nameScore >= matchThreshold) {
          sanctionMatches.push({
            entry_id: entry.id,
            list_source: entry.list_source,
            matched_name: entry.full_name,
            match_score: Math.round(nameScore * 100),
            match_type: nameScore === 1.0 ? 'exact' : 'fuzzy',
            sanction_type: entry.sanction_type || [],
            reason: entry.reason,
            reference_url: entry.reference_url
          });
          continue;
        }

        // Check aliases
        if (entry.aliases && Array.isArray(entry.aliases)) {
          for (const alias of entry.aliases) {
            const aliasScore = jaroWinklerSimilarity(normalizedName, normalizeName(alias));
            if (aliasScore >= matchThreshold) {
              sanctionMatches.push({
                entry_id: entry.id,
                list_source: entry.list_source,
                matched_name: alias,
                match_score: Math.round(aliasScore * 100),
                match_type: 'alias',
                sanction_type: entry.sanction_type || [],
                reason: entry.reason,
                reference_url: entry.reference_url
              });
              break;
            }
          }
        }

        // Check national ID
        if (body.national_id && entry.national_id) {
          const idNorm = body.national_id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const entryIdNorm = entry.national_id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (idNorm === entryIdNorm) {
            sanctionMatches.push({
              entry_id: entry.id,
              list_source: entry.list_source,
              matched_name: entry.full_name,
              match_score: 100,
              match_type: 'national_id',
              sanction_type: entry.sanction_type || [],
              reason: entry.reason,
              reference_url: entry.reference_url
            });
          }
        }
      }
    }

    // Sort by score
    sanctionMatches.sort((a, b) => b.match_score - a.match_score);

    console.log(`[AML] Sanctions screening: ${sanctionMatches.length} matches found`);

    // =====================================================
    // 2. PEP DETECTION
    // =====================================================
    
    let pepResult: PEPResult = {
      is_pep: false,
      category_code: null,
      category_name: null,
      risk_increase: 0,
      matched_keywords: []
    };

    if (body.occupation || body.employer) {
      const combinedText = normalizeName(`${body.occupation || ''} ${body.employer || ''}`);
      
      // First check database categories
      const { data: dbCategories } = await supabase
        .from('pep_categories')
        .select('*')
        .eq('is_active', true);

      const categoriesToCheck = dbCategories && dbCategories.length > 0 
        ? dbCategories.map(c => ({
            code: c.category_code,
            name: c.category_name,
            weight: c.risk_weight,
            keywords: c.keywords || []
          }))
        : PEP_CATEGORIES;

      for (const category of categoriesToCheck) {
        const matchedKeywords: string[] = [];
        
        for (const keyword of category.keywords) {
          if (combinedText.includes(normalizeName(keyword))) {
            matchedKeywords.push(keyword);
          }
        }

        if (matchedKeywords.length > 0) {
          pepResult = {
            is_pep: true,
            category_code: category.code,
            category_name: category.name,
            risk_increase: category.weight,
            matched_keywords: matchedKeywords
          };
          break;
        }
      }
    }

    console.log(`[AML] PEP detection: ${pepResult.is_pep ? pepResult.category_name : 'Not PEP'}`);

    // =====================================================
    // 3. DETERMINE STATUS
    // =====================================================
    
    let screeningStatus: 'clear' | 'potential_match' | 'confirmed_match' = 'clear';
    
    if (sanctionMatches.length > 0) {
      const maxScore = Math.max(...sanctionMatches.map(m => m.match_score));
      screeningStatus = maxScore >= 95 ? 'confirmed_match' : 'potential_match';
    }

    // =====================================================
    // 4. SAVE SCREENING RESULT
    // =====================================================
    
    const processingTimeMs = Math.round(performance.now() - startTime);

    const { data: screening, error: insertError } = await supabase
      .from('aml_screenings')
      .insert({
        kyc_request_id: body.kyc_request_id || null,
        user_id: userId,
        partner_id: body.partner_id || userId,
        full_name_hash: fullNameHash,
        dob_hash: dobHash,
        national_id_hash: nationalIdHash,
        screening_status: screeningStatus,
        match_score: sanctionMatches.length > 0 ? sanctionMatches[0].match_score : null,
        match_type: sanctionMatches.map(m => m.list_source),
        matches: sanctionMatches,
        pep_detected: pepResult.is_pep,
        pep_category: pepResult.category_code,
        pep_risk_increase: pepResult.risk_increase,
        processing_time_ms: processingTimeMs
      })
      .select()
      .single();

    if (insertError) {
      console.error('[AML] Error saving screening:', insertError);
    }

    // =====================================================
    // 5. CREATE INVESTIGATION IF MATCH FOUND
    // =====================================================
    
    if (screeningStatus !== 'clear' && screening) {
      const priority = screeningStatus === 'confirmed_match' ? 'critical' : 'high';
      
      await supabase.from('aml_investigations').insert({
        screening_id: screening.id,
        kyc_request_id: body.kyc_request_id,
        status: 'pending',
        priority,
        document_image_url: body.document_image_url
      });

      console.log(`[AML] Investigation created with priority: ${priority}`);
    }

    // =====================================================
    // 6. LOG FOR COMPLIANCE (ANONYMIZED)
    // =====================================================
    
    await supabase.from('compliance_logs').insert({
      log_type: 'screening',
      subject_hash: fullNameHash,
      result_code: screeningStatus,
      risk_level: screeningStatus === 'clear' ? 'low' : 
                  screeningStatus === 'potential_match' ? 'medium' : 'high',
      match_count: sanctionMatches.length,
      partner_id: body.partner_id || userId,
      performed_by: userId,
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || null,
      processing_reference: screening?.id
    });

    // =====================================================
    // 7. RESPONSE
    // =====================================================
    
    const response = {
      screening_id: screening?.id,
      status: screeningStatus,
      sanctions: {
        matches_count: sanctionMatches.length,
        matches: sanctionMatches.slice(0, 5), // Limit to top 5
        highest_score: sanctionMatches.length > 0 ? sanctionMatches[0].match_score : 0
      },
      pep: pepResult,
      risk_adjustment: {
        base_increase: screeningStatus === 'confirmed_match' ? 50 : 
                       screeningStatus === 'potential_match' ? 30 : 0,
        pep_increase: pepResult.risk_increase,
        total_increase: (screeningStatus === 'confirmed_match' ? 50 : 
                        screeningStatus === 'potential_match' ? 30 : 0) + 
                        pepResult.risk_increase
      },
      requires_investigation: screeningStatus !== 'clear',
      processing_time_ms: processingTimeMs,
      created_at: new Date().toISOString()
    };

    console.log(`[AML] Screening completed in ${processingTimeMs}ms - Status: ${screeningStatus}`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Screening-ID': screening?.id || '',
          'X-Processing-Time': processingTimeMs.toString()
        } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AML] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
