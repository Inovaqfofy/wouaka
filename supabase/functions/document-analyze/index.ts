import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentAnalysisRequest {
  ocr_text: string;
  document_type: 'cni' | 'passport' | 'permis' | 'justificatif_domicile' | 'releve_bancaire' | 'unknown';
  ocr_confidence?: number;
}

interface ExtractedDocumentData {
  document_type: string;
  full_name?: string;
  birth_date?: string;
  document_number?: string;
  expiry_date?: string;
  issuing_country?: string;
  address?: string;
  extraction_confidence: number;
  raw_fields: Record<string, string>;
}

const EXTRACTION_PROMPTS: Record<string, string> = {
  cni: `Tu es un expert en extraction d'informations de Cartes Nationales d'Identité africaines.
Analyse ce texte extrait par OCR d'une CNI et retourne UNIQUEMENT un JSON valide avec ces champs:
{
  "document_type": "cni",
  "full_name": "nom complet trouvé",
  "birth_date": "date au format YYYY-MM-DD si trouvée",
  "document_number": "numéro de la carte",
  "expiry_date": "date d'expiration au format YYYY-MM-DD si trouvée",
  "issuing_country": "pays émetteur",
  "extraction_confidence": nombre entre 0 et 100
}
Retourne SEULEMENT le JSON, aucun texte avant ou après.`,

  passport: `Tu es un expert en extraction d'informations de passeports.
Analyse ce texte extrait par OCR d'un passeport et retourne UNIQUEMENT un JSON valide avec ces champs:
{
  "document_type": "passport",
  "full_name": "nom complet trouvé",
  "birth_date": "date au format YYYY-MM-DD si trouvée",
  "document_number": "numéro du passeport",
  "expiry_date": "date d'expiration au format YYYY-MM-DD si trouvée",
  "issuing_country": "pays émetteur",
  "extraction_confidence": nombre entre 0 et 100
}
Retourne SEULEMENT le JSON, aucun texte avant ou après.`,

  justificatif_domicile: `Tu es un expert en extraction d'informations de justificatifs de domicile (factures, relevés).
Analyse ce texte extrait par OCR et retourne UNIQUEMENT un JSON valide avec ces champs:
{
  "document_type": "justificatif_domicile",
  "full_name": "nom du titulaire",
  "address": "adresse complète",
  "document_date": "date du document au format YYYY-MM-DD",
  "provider": "fournisseur (CIE, SODECI, Orange, etc.)",
  "extraction_confidence": nombre entre 0 et 100
}
Retourne SEULEMENT le JSON, aucun texte avant ou après.`,

  releve_bancaire: `Tu es un expert en extraction d'informations de relevés bancaires.
Analyse ce texte extrait par OCR et retourne UNIQUEMENT un JSON valide avec ces champs:
{
  "document_type": "releve_bancaire",
  "full_name": "nom du titulaire du compte",
  "bank_name": "nom de la banque",
  "account_number": "numéro de compte (partiellement masqué si long)",
  "period": "période couverte",
  "extraction_confidence": nombre entre 0 et 100
}
Retourne SEULEMENT le JSON, aucun texte avant ou après.`,

  unknown: `Tu es un expert en extraction d'informations de documents administratifs.
Analyse ce texte extrait par OCR et retourne UNIQUEMENT un JSON valide avec les informations que tu peux identifier:
{
  "document_type": "type détecté (cni, passport, facture, etc.)",
  "full_name": "nom si trouvé",
  "date": "date principale si trouvée",
  "key_info": "information principale extraite",
  "extraction_confidence": nombre entre 0 et 100
}
Retourne SEULEMENT le JSON, aucun texte avant ou après.`,
};

async function analyzeWithDeepSeek(ocrText: string, documentType: string): Promise<ExtractedDocumentData> {
  const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
  
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const systemPrompt = EXTRACTION_PROMPTS[documentType] || EXTRACTION_PROMPTS.unknown;

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Texte OCR à analyser:\n\n${ocrText}` },
      ],
      temperature: 0.1, // Low temperature for consistent extraction
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('DeepSeek API error:', response.status, errorText);
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from DeepSeek');
  }

  // Parse JSON from response
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      document_type: parsed.document_type || documentType,
      full_name: parsed.full_name,
      birth_date: parsed.birth_date,
      document_number: parsed.document_number,
      expiry_date: parsed.expiry_date,
      issuing_country: parsed.issuing_country,
      address: parsed.address,
      extraction_confidence: parsed.extraction_confidence || 50,
      raw_fields: parsed,
    };
  } catch (parseError) {
    console.error('JSON parse error:', parseError, 'Content:', content);
    throw new Error('Failed to parse DeepSeek response as JSON');
  }
}

// Fallback: simple regex-based extraction
function extractWithRegex(ocrText: string, documentType: string): ExtractedDocumentData {
  const text = ocrText.toUpperCase();
  const raw_fields: Record<string, string> = {};
  
  // Try to find common patterns
  const namePatterns = [
    /NOM\s*[:\s]+([A-Z\s]+)/i,
    /SURNAME\s*[:\s]+([A-Z\s]+)/i,
    /PRÉNOM\s*[:\s]+([A-Z\s]+)/i,
  ];
  
  const datePatterns = [
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/g,
    /(\d{4}[\/\-]\d{2}[\/\-]\d{2})/g,
  ];
  
  const docNumberPatterns = [
    /N[°O]\s*[:\s]*([A-Z0-9\-]+)/i,
    /([A-Z]{2}\d{6,})/,
  ];

  let full_name: string | undefined;
  let birth_date: string | undefined;
  let document_number: string | undefined;

  for (const pattern of namePatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      full_name = match[1].trim();
      raw_fields.name_source = match[0];
      break;
    }
  }

  for (const pattern of datePatterns) {
    const matches = ocrText.match(pattern);
    if (matches && matches.length > 0) {
      birth_date = matches[0];
      raw_fields.date_source = matches[0];
      break;
    }
  }

  for (const pattern of docNumberPatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      document_number = match[1];
      raw_fields.doc_number_source = match[0];
      break;
    }
  }

  return {
    document_type: documentType,
    full_name,
    birth_date,
    document_number,
    extraction_confidence: full_name ? 40 : 20,
    raw_fields,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ocr_text, document_type, ocr_confidence }: DocumentAnalysisRequest = await req.json();

    if (!ocr_text) {
      return new Response(
        JSON.stringify({ error: 'ocr_text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();
    let result: ExtractedDocumentData;
    let usedFallback = false;

    try {
      // Try DeepSeek first
      result = await analyzeWithDeepSeek(ocr_text, document_type || 'unknown');
    } catch (deepseekError) {
      console.error('DeepSeek failed, using regex fallback:', deepseekError);
      // Fallback to regex extraction
      result = extractWithRegex(ocr_text, document_type || 'unknown');
      usedFallback = true;
    }

    const processingTime = Date.now() - startTime;

    // Adjust confidence based on OCR quality
    if (ocr_confidence) {
      result.extraction_confidence = Math.round(
        result.extraction_confidence * (ocr_confidence / 100)
      );
    }

    // Store in data_enrichments
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('data_enrichments').insert({
      source_type: 'document_ocr',
      source_provider: usedFallback ? 'regex_fallback' : 'deepseek',
      raw_data: { ocr_text, document_type, ocr_confidence },
      normalized_data: result,
      confidence_score: result.extraction_confidence,
      verification_status: result.extraction_confidence >= 70 ? 'verified' : 'pending',
      processing_time_ms: processingTime,
      is_simulated: false,
    });

    return new Response(
      JSON.stringify({
        ...result,
        processing_time_ms: processingTime,
        method: usedFallback ? 'regex_fallback' : 'deepseek',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Document analyze error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
