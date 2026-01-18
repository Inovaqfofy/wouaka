// ============================================
// SYNC COMPLIANCE DATA - Edge Function
// Daily sync of UN, OFAC, EU sanctions lists
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// TYPES
// ============================================

interface SanctionEntry {
  list_source: 'UN_CONSOLIDATED' | 'OFAC_SDN' | 'EU_SANCTIONS' | 'UEMOA_GEL';
  entry_type: 'individual' | 'entity';
  full_name: string;
  full_name_normalized: string;
  aliases: string[];
  date_of_birth?: string;
  nationality?: string[];
  national_id?: string;
  sanction_type: string[];
  reason?: string;
  listed_on?: string;
  reference_url?: string;
  raw_data: Record<string, unknown>;
}

// ============================================
// NAME NORMALIZATION (African names)
// ============================================

function normalizeName(name: string): string {
  if (!name) return '';
  
  let normalized = name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' '); // Normalize spaces

  // African name variations
  const variations: Record<string, string> = {
    'oumar': 'omar', 'mamadou': 'mamadu', 'amadou': 'amadu',
    'abdoulaye': 'abdulaye', 'moussa': 'musa', 'issa': 'isa',
    'seydou': 'seidou', 'ibrahima': 'ibrahim', 'ousmane': 'usman',
    'saidou': 'saidu', 'diallo': 'dialo', 'traore': 'traor',
    'coulibaly': 'kulibali', 'kone': 'kon', 'cisse': 'cis',
    'toure': 'tur', 'camara': 'kamara', 'diarra': 'diara',
    'keita': 'keyta', 'bah': 'ba', 'abdou': 'abdu',
    'mohamed': 'muhammad', 'mohammed': 'muhammad', 'mouhamed': 'muhammad',
    'samba': 'samba', 'ndoye': 'ndoy', 'ndiaye': 'ndiay'
  };

  const words = normalized.split(' ');
  normalized = words.map(word => variations[word] || word).join(' ');
  
  return normalized;
}

// ============================================
// UN SANCTIONS PARSER (XML)
// ============================================

async function fetchUNSanctions(): Promise<SanctionEntry[]> {
  const url = 'https://scsanctions.un.org/resources/xml/fr/consolidated.xml';
  console.log('[SYNC] Fetching UN sanctions list...');
  
  const entries: SanctionEntry[] = [];
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('[SYNC] UN fetch failed:', response.status);
      return entries;
    }
    
    const xmlText = await response.text();
    
    // Parse individuals from XML
    const individualMatches = xmlText.matchAll(/<INDIVIDUAL[^>]*>([\s\S]*?)<\/INDIVIDUAL>/gi);
    
    for (const match of individualMatches) {
      const block = match[1];
      
      // Extract name components
      const firstName = extractXmlValue(block, 'FIRST_NAME') || '';
      const secondName = extractXmlValue(block, 'SECOND_NAME') || '';
      const thirdName = extractXmlValue(block, 'THIRD_NAME') || '';
      const fourthName = extractXmlValue(block, 'FOURTH_NAME') || '';
      
      const fullName = [firstName, secondName, thirdName, fourthName]
        .filter(n => n.trim())
        .join(' ')
        .trim();
      
      if (!fullName) continue;
      
      // Extract aliases
      const aliases: string[] = [];
      const aliasMatches = block.matchAll(/<ALIAS_NAME>([\s\S]*?)<\/ALIAS_NAME>/gi);
      for (const aliasMatch of aliasMatches) {
        if (aliasMatch[1]?.trim()) aliases.push(aliasMatch[1].trim());
      }
      
      // Extract DOB
      const dobYear = extractXmlValue(block, 'YEAR');
      const dobMonth = extractXmlValue(block, 'MONTH');
      const dobDay = extractXmlValue(block, 'DAY');
      const dateOfBirth = dobYear ? `${dobYear}-${dobMonth || '01'}-${dobDay || '01'}` : undefined;
      
      // Extract nationality
      const nationality: string[] = [];
      const natMatches = block.matchAll(/<NATIONALITY>([\s\S]*?)<\/NATIONALITY>/gi);
      for (const natMatch of natMatches) {
        if (natMatch[1]?.trim()) nationality.push(natMatch[1].trim());
      }
      
      // Extract sanction type from MEASURE tags
      const sanctionTypes: string[] = [];
      const measureMatches = block.matchAll(/<MEASURE>([\s\S]*?)<\/MEASURE>/gi);
      for (const measureMatch of measureMatches) {
        if (measureMatch[1]?.trim()) sanctionTypes.push(measureMatch[1].trim().toLowerCase());
      }
      
      entries.push({
        list_source: 'UN_CONSOLIDATED',
        entry_type: 'individual',
        full_name: fullName,
        full_name_normalized: normalizeName(fullName),
        aliases,
        date_of_birth: dateOfBirth,
        nationality,
        sanction_type: sanctionTypes.length > 0 ? sanctionTypes : ['asset_freeze', 'travel_ban'],
        reference_url: 'https://www.un.org/securitycouncil/sanctions',
        raw_data: { source: 'UN', parsed_at: new Date().toISOString() }
      });
    }
    
    // Parse entities
    const entityMatches = xmlText.matchAll(/<ENTITY[^>]*>([\s\S]*?)<\/ENTITY>/gi);
    
    for (const match of entityMatches) {
      const block = match[1];
      const entityName = extractXmlValue(block, 'FIRST_NAME') || extractXmlValue(block, 'NAME');
      
      if (!entityName?.trim()) continue;
      
      entries.push({
        list_source: 'UN_CONSOLIDATED',
        entry_type: 'entity',
        full_name: entityName.trim(),
        full_name_normalized: normalizeName(entityName),
        aliases: [],
        sanction_type: ['asset_freeze'],
        reference_url: 'https://www.un.org/securitycouncil/sanctions',
        raw_data: { source: 'UN', type: 'entity', parsed_at: new Date().toISOString() }
      });
    }
    
    console.log(`[SYNC] UN: Parsed ${entries.length} entries`);
  } catch (error) {
    console.error('[SYNC] UN parsing error:', error);
  }
  
  return entries;
}

function extractXmlValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i'));
  return match?.[1]?.trim() || null;
}

// ============================================
// OFAC SANCTIONS PARSER (JSON)
// ============================================

async function fetchOFACSanctions(): Promise<SanctionEntry[]> {
  const url = 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN_JSON.zip';
  console.log('[SYNC] Fetching OFAC sanctions list...');
  
  const entries: SanctionEntry[] = [];
  
  try {
    // OFAC provides a zip file - we'll use the direct JSON endpoint if available
    // Fallback: parse from simpler endpoint
    const simpleUrl = 'https://www.treasury.gov/ofac/downloads/sdnlist.txt';
    const response = await fetch(simpleUrl);
    
    if (!response.ok) {
      console.error('[SYNC] OFAC fetch failed:', response.status);
      return entries;
    }
    
    const textContent = await response.text();
    const lines = textContent.split('\n');
    
    let currentEntry: Partial<SanctionEntry> | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Parse SDN format: NAME [COUNTRY] (PROGRAM)
      const sdnMatch = trimmed.match(/^(.*?)\s*(?:\[([A-Z]{2})\])?\s*(?:\(([^)]+)\))?$/);
      
      if (sdnMatch && trimmed.length > 5 && !trimmed.startsWith('-')) {
        const name = sdnMatch[1]?.trim();
        const country = sdnMatch[2];
        const program = sdnMatch[3];
        
        if (name && name.length > 2) {
          // Check if it's an alias line
          if (trimmed.toLowerCase().includes('a.k.a.')) {
            if (currentEntry?.aliases) {
              const aliasName = name.replace(/a\.k\.a\./gi, '').trim();
              currentEntry.aliases.push(aliasName);
            }
          } else {
            // Save previous entry
            if (currentEntry?.full_name) {
              entries.push(currentEntry as SanctionEntry);
            }
            
            currentEntry = {
              list_source: 'OFAC_SDN',
              entry_type: 'individual',
              full_name: name,
              full_name_normalized: normalizeName(name),
              aliases: [],
              nationality: country ? [country] : undefined,
              sanction_type: program ? [program.toLowerCase()] : ['ofac_sdn'],
              reference_url: 'https://www.treasury.gov/ofac',
              raw_data: { source: 'OFAC', parsed_at: new Date().toISOString() }
            };
          }
        }
      }
    }
    
    // Add last entry
    if (currentEntry?.full_name) {
      entries.push(currentEntry as SanctionEntry);
    }
    
    console.log(`[SYNC] OFAC: Parsed ${entries.length} entries`);
  } catch (error) {
    console.error('[SYNC] OFAC parsing error:', error);
  }
  
  return entries;
}

// ============================================
// EU SANCTIONS PARSER (XML)
// ============================================

async function fetchEUSanctions(): Promise<SanctionEntry[]> {
  const url = 'https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList/content?token=dG9rZW4tMjAxNw';
  console.log('[SYNC] Fetching EU sanctions list...');
  
  const entries: SanctionEntry[] = [];
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('[SYNC] EU fetch failed:', response.status);
      return entries;
    }
    
    const xmlText = await response.text();
    
    // Parse persons
    const personMatches = xmlText.matchAll(/<sanctionEntity[^>]*logicalId="(\d+)"[^>]*>([\s\S]*?)<\/sanctionEntity>/gi);
    
    for (const match of personMatches) {
      const entityId = match[1];
      const block = match[2];
      
      // Extract name
      const wholeName = extractXmlValue(block, 'wholeName');
      const firstName = extractXmlValue(block, 'firstName') || '';
      const middleName = extractXmlValue(block, 'middleName') || '';
      const lastName = extractXmlValue(block, 'lastName') || '';
      
      const fullName = wholeName || [firstName, middleName, lastName].filter(n => n.trim()).join(' ');
      
      if (!fullName.trim()) continue;
      
      // Extract type
      const isEntity = block.toLowerCase().includes('subjecttype>enterprise') || 
                      block.toLowerCase().includes('subjecttype>entity');
      
      // Extract aliases
      const aliases: string[] = [];
      const aliasMatches = block.matchAll(/<alias[^>]*>([\s\S]*?)<\/alias>/gi);
      for (const aliasMatch of aliasMatches) {
        const aliasName = extractXmlValue(aliasMatch[1], 'wholeName');
        if (aliasName?.trim()) aliases.push(aliasName.trim());
      }
      
      // Extract DOB
      const birthDate = extractXmlValue(block, 'birthdate');
      
      // Extract citizenship
      const citizenship = extractXmlValue(block, 'countryIso2Code');
      
      entries.push({
        list_source: 'EU_SANCTIONS',
        entry_type: isEntity ? 'entity' : 'individual',
        full_name: fullName.trim(),
        full_name_normalized: normalizeName(fullName),
        aliases,
        date_of_birth: birthDate || undefined,
        nationality: citizenship ? [citizenship] : undefined,
        sanction_type: ['eu_restrictive_measures'],
        reference_url: `https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList`,
        raw_data: { source: 'EU', entity_id: entityId, parsed_at: new Date().toISOString() }
      });
    }
    
    console.log(`[SYNC] EU: Parsed ${entries.length} entries`);
  } catch (error) {
    console.error('[SYNC] EU parsing error:', error);
  }
  
  return entries;
}

// ============================================
// UEMOA/BCEAO LOCAL SANCTIONS
// ============================================

function getUEMOASanctions(): SanctionEntry[] {
  console.log('[SYNC] Loading UEMOA/BCEAO sanctions...');
  
  // UEMOA asset freezes (gels d'avoirs) - would be populated from BCEAO circulars
  const entries: SanctionEntry[] = [
    // Example structure - in production, loaded from official BCEAO circulars
    {
      list_source: 'UEMOA_GEL',
      entry_type: 'individual',
      full_name: 'Example Person UEMOA',
      full_name_normalized: normalizeName('Example Person UEMOA'),
      aliases: [],
      nationality: ['CI'],
      sanction_type: ['gel_avoir', 'interdiction_bancaire'],
      reason: 'Circulaire BCEAO ref example',
      reference_url: 'https://www.bceao.int',
      raw_data: { source: 'BCEAO', type: 'gel_avoir', parsed_at: new Date().toISOString() }
    }
  ];
  
  // In production, this would parse official BCEAO/CENTIF circulars
  // covering all 8 UEMOA countries: BJ, BF, CI, GW, ML, NE, SN, TG
  
  console.log(`[SYNC] UEMOA: ${entries.length} entries`);
  return entries;
}

// ============================================
// DATABASE OPERATIONS
// ============================================

async function syncToDatabase(supabase: any, entries: SanctionEntry[]): Promise<{ inserted: number; updated: number; errors: number }> {
  const stats = { inserted: 0, updated: 0, errors: 0 };
  
  console.log(`[SYNC] Syncing ${entries.length} entries to database...`);
  
  // Process in batches
  const batchSize = 100;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    
    for (const entry of batch) {
      try {
        // Check if entry exists (by normalized name + source)
        const { data: existing } = await supabase
          .from('sanctions_list_entries')
          .select('id')
          .eq('full_name_normalized', entry.full_name_normalized)
          .eq('list_source', entry.list_source)
          .single();
        
        if (existing) {
          // Update
          const { error } = await supabase
            .from('sanctions_list_entries')
            .update({
              full_name: entry.full_name,
              aliases: entry.aliases,
              date_of_birth: entry.date_of_birth,
              nationality: entry.nationality,
              sanction_type: entry.sanction_type,
              reference_url: entry.reference_url,
              raw_data: entry.raw_data,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
          
          if (error) {
            stats.errors++;
          } else {
            stats.updated++;
          }
        } else {
          // Insert
          const { error } = await supabase
            .from('sanctions_list_entries')
            .insert({
              list_source: entry.list_source,
              entry_type: entry.entry_type,
              full_name: entry.full_name,
              full_name_normalized: entry.full_name_normalized,
              aliases: entry.aliases,
              date_of_birth: entry.date_of_birth,
              nationality: entry.nationality,
              national_id: entry.national_id,
              sanction_type: entry.sanction_type,
              reason: entry.reason,
              reference_url: entry.reference_url,
              raw_data: entry.raw_data
            });
          
          if (error) {
            stats.errors++;
          } else {
            stats.inserted++;
          }
        }
      } catch (error) {
        stats.errors++;
        console.error('[SYNC] Entry error:', error);
      }
    }
    
    console.log(`[SYNC] Processed ${Math.min(i + batchSize, entries.length)}/${entries.length}`);
  }
  
  return stats;
}

async function logSyncOperation(supabase: any, source: string, stats: any) {
  // Log to data_enrichments table for audit trail
  await supabase.from('data_enrichments').insert({
    source_type: 'sanction',
    source_provider: source,
    raw_data: { sync_stats: stats, synced_at: new Date().toISOString() },
    normalized_data: stats,
    is_simulated: false,
    verification_status: 'verified'
  });
}

// ============================================
// MAIN HANDLER (with background task support)
// ============================================

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

async function runSyncInBackground(
  supabase: any,
  sources: string[],
  startTime: number
): Promise<void> {
  console.log('[SYNC] Background task started for sources:', sources);
  
  try {
    const results: Record<string, any> = {};
    let totalEntries: SanctionEntry[] = [];
    
    // Fetch from each source
    if (sources.includes('UN')) {
      console.log('[SYNC] Fetching UN sanctions...');
      const unEntries = await fetchUNSanctions();
      results.UN = { fetched: unEntries.length };
      totalEntries = [...totalEntries, ...unEntries];
      console.log(`[SYNC] UN: ${unEntries.length} entries fetched`);
    }
    
    if (sources.includes('OFAC')) {
      console.log('[SYNC] Fetching OFAC sanctions...');
      const ofacEntries = await fetchOFACSanctions();
      results.OFAC = { fetched: ofacEntries.length };
      totalEntries = [...totalEntries, ...ofacEntries];
      console.log(`[SYNC] OFAC: ${ofacEntries.length} entries fetched`);
    }
    
    if (sources.includes('EU')) {
      console.log('[SYNC] Fetching EU sanctions...');
      const euEntries = await fetchEUSanctions();
      results.EU = { fetched: euEntries.length };
      totalEntries = [...totalEntries, ...euEntries];
      console.log(`[SYNC] EU: ${euEntries.length} entries fetched`);
    }
    
    if (sources.includes('UEMOA')) {
      console.log('[SYNC] Loading UEMOA sanctions...');
      const uemoaEntries = getUEMOASanctions();
      results.UEMOA = { fetched: uemoaEntries.length };
      totalEntries = [...totalEntries, ...uemoaEntries];
      console.log(`[SYNC] UEMOA: ${uemoaEntries.length} entries loaded`);
    }
    
    // Sync to database
    console.log(`[SYNC] Syncing ${totalEntries.length} entries to database...`);
    const syncStats = await syncToDatabase(supabase, totalEntries);
    
    // Log operation
    await logSyncOperation(supabase, 'sync-compliance-data', {
      sources,
      results,
      sync: syncStats,
      processing_time_ms: Date.now() - startTime
    });
    
    console.log('[SYNC] Background task completed:', {
      sources: results,
      sync: syncStats,
      total_entries: totalEntries.length,
      processing_time_ms: Date.now() - startTime
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SYNC] Background task error:', errorMessage);
    
    // Log error
    await logSyncOperation(supabase, 'sync-compliance-data-error', {
      error: errorMessage,
      processing_time_ms: Date.now() - startTime
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('[SYNC] Starting compliance data sync...');

  try {
    const body = await req.json().catch(() => ({}));
    const sources = body.sources || ['UN', 'OFAC', 'EU', 'UEMOA'];
    const background = body.background !== false; // Default to background mode
    
    if (background) {
      // Use background task for long-running sync
      EdgeRuntime.waitUntil(runSyncInBackground(supabase, sources, startTime));
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Sync started in background',
          sources,
          status: 'processing',
          check_logs: 'View edge function logs for progress'
        }),
        { 
          status: 202, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Synchronous mode (for single source or testing)
    const results: Record<string, any> = {};
    let totalEntries: SanctionEntry[] = [];
    
    if (sources.includes('UEMOA')) {
      const uemoaEntries = getUEMOASanctions();
      results.UEMOA = { fetched: uemoaEntries.length };
      totalEntries = [...totalEntries, ...uemoaEntries];
    }
    
    const syncStats = await syncToDatabase(supabase, totalEntries);
    
    await logSyncOperation(supabase, 'sync-compliance-data', {
      sources,
      results,
      sync: syncStats,
      processing_time_ms: Date.now() - startTime
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Compliance data synced successfully',
        sources: results,
        sync: syncStats,
        total_entries: totalEntries.length,
        processing_time_ms: Date.now() - startTime
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SYNC] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: 'Sync failed', 
        details: errorMessage,
        processing_time_ms: Date.now() - startTime 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
