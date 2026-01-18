import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProfileData {
  fullName?: string;
  phone?: string;
  nationalId?: string;
  dateOfBirth?: string;
  address?: string;
  income?: number;
  employmentType?: string;
  
  // Mobile Money data
  mobileMoneyBalance?: number;
  mobileMoneyTransactions?: {
    type: string;
    amount: number;
    date?: string;
  }[];
  
  // Screenshot analysis
  screenshotConfidence?: number;
  tamperingProbability?: number;
  
  // Behavioral signals
  sessionDuration?: number;
  hesitationPatterns?: string[];
  deviceFingerprint?: string;
  ipAddress?: string;
  
  // Document verification
  documentType?: string;
  documentOcrConfidence?: number;
  mrzValid?: boolean;
  faceMatchScore?: number;
  livenessScore?: number;
}

interface AnomalyDetectionResult {
  anomalies: Anomaly[];
  fraudProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  recommendations: string[];
}

interface Anomaly {
  type: string;
  field: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileData, requestId }: { profileData: ProfileData; requestId?: string } = await req.json();
    
    if (!profileData) {
      throw new Error('Profile data is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`[AI Fraud Detector] Analyzing profile${requestId ? ` for request ${requestId}` : ''}`);

    // Build the analysis prompt
    const systemPrompt = `Tu es un expert en détection de fraude spécialisé dans les marchés financiers d'Afrique de l'Ouest (zone UEMOA).

Ton rôle est d'analyser les profils utilisateurs et de détecter les anomalies qui pourraient indiquer une fraude.

Types de fraude courants dans la région:
1. Usurpation d'identité (documents falsifiés)
2. Inflation des revenus
3. Screenshots Mobile Money manipulés
4. Fausses attestations de tontine
5. Adresses fictives
6. Numéros de téléphone temporaires/jetables
7. Manipulation comportementale (hésitations suspectes)

Retourne TOUJOURS une analyse structurée avec:
- Les anomalies détectées
- La probabilité de fraude (0-100)
- Le niveau de risque
- Une explication claire
- Des recommandations`;

    const userPrompt = `Analyse ce profil utilisateur et détecte les anomalies potentielles:

DONNÉES DU PROFIL:
${JSON.stringify(profileData, null, 2)}

RÈGLES D'ANALYSE:
1. Vérifie la cohérence des données (nom/ID/téléphone)
2. Analyse les patterns de transactions Mobile Money
3. Évalue la qualité des documents (OCR, MRZ)
4. Détecte les comportements suspects (hésitations, temps de session)
5. Vérifie la cohérence géographique (IP vs adresse déclarée)
6. Analyse le niveau de revenus vs transactions

Retourne l'analyse au format JSON structuré.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'detect_anomalies',
              description: 'Détecte les anomalies dans un profil utilisateur',
              parameters: {
                type: 'object',
                properties: {
                  anomalies: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { 
                          type: 'string',
                          enum: ['identity_mismatch', 'income_inflation', 'document_tampering', 'behavioral_anomaly', 'geographic_inconsistency', 'transaction_pattern', 'device_anomaly']
                        },
                        field: { type: 'string' },
                        severity: { type: 'string', enum: ['low', 'medium', 'high'] },
                        description: { type: 'string' },
                        confidence: { type: 'number' }
                      },
                      required: ['type', 'field', 'severity', 'description', 'confidence']
                    }
                  },
                  fraudProbability: { type: 'number', minimum: 0, maximum: 100 },
                  riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                  explanation: { type: 'string' },
                  recommendations: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['anomalies', 'fraudProbability', 'riskLevel', 'explanation', 'recommendations']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'detect_anomalies' } }
      }),
    });

    if (!response.ok) {
      const status = response.status;
      
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const errorText = await response.text();
      console.error('[AI Fraud Detector] AI gateway error:', status, errorText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiResponse = await response.json();
    
    // Extract the tool call result
    let result: AnomalyDetectionResult;
    
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error('[AI Fraud Detector] Failed to parse tool call arguments');
        result = getDefaultResult(profileData);
      }
    } else {
      // Fallback: try to extract from content
      const content = aiResponse.choices?.[0]?.message?.content;
      if (content) {
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
          } else {
            result = getDefaultResult(profileData);
          }
        } catch {
          result = getDefaultResult(profileData);
        }
      } else {
        result = getDefaultResult(profileData);
      }
    }

    // Validate and normalize result
    result = normalizeResult(result);

    console.log(`[AI Fraud Detector] Analysis complete: ${result.riskLevel} risk, ${result.fraudProbability}% probability, ${result.anomalies.length} anomalies`);

    return new Response(
      JSON.stringify({
        success: true,
        requestId,
        result,
        analyzedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI Fraud Detector] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getDefaultResult(profileData: ProfileData): AnomalyDetectionResult {
  const anomalies: Anomaly[] = [];
  let fraudProbability = 10;

  // Rule-based fallback analysis
  if (profileData.tamperingProbability && profileData.tamperingProbability > 0.5) {
    anomalies.push({
      type: 'document_tampering',
      field: 'screenshot',
      severity: 'high',
      description: 'Probabilité élevée de manipulation de capture d\'écran',
      confidence: profileData.tamperingProbability
    });
    fraudProbability += 30;
  }

  if (profileData.documentOcrConfidence && profileData.documentOcrConfidence < 60) {
    anomalies.push({
      type: 'document_tampering',
      field: 'document',
      severity: 'medium',
      description: 'Faible confiance OCR sur le document',
      confidence: (100 - profileData.documentOcrConfidence) / 100
    });
    fraudProbability += 15;
  }

  if (profileData.mrzValid === false) {
    anomalies.push({
      type: 'identity_mismatch',
      field: 'mrz',
      severity: 'high',
      description: 'Zone MRZ invalide ou incohérente',
      confidence: 0.9
    });
    fraudProbability += 25;
  }

  if (profileData.faceMatchScore && profileData.faceMatchScore < 0.6) {
    anomalies.push({
      type: 'identity_mismatch',
      field: 'face',
      severity: 'high',
      description: 'Faible correspondance faciale',
      confidence: 1 - profileData.faceMatchScore
    });
    fraudProbability += 20;
  }

  if (profileData.livenessScore && profileData.livenessScore < 0.7) {
    anomalies.push({
      type: 'identity_mismatch',
      field: 'liveness',
      severity: 'medium',
      description: 'Score de vivacité insuffisant',
      confidence: 1 - profileData.livenessScore
    });
    fraudProbability += 15;
  }

  // Determine risk level
  let riskLevel: AnomalyDetectionResult['riskLevel'];
  if (fraudProbability >= 70) riskLevel = 'critical';
  else if (fraudProbability >= 50) riskLevel = 'high';
  else if (fraudProbability >= 25) riskLevel = 'medium';
  else riskLevel = 'low';

  return {
    anomalies,
    fraudProbability: Math.min(100, fraudProbability),
    riskLevel,
    explanation: `Analyse basée sur ${anomalies.length} anomalie(s) détectée(s) via règles automatiques.`,
    recommendations: anomalies.length > 0 
      ? ['Vérification manuelle recommandée', 'Demander des documents supplémentaires']
      : ['Profil acceptable pour traitement automatique']
  };
}

function normalizeResult(result: AnomalyDetectionResult): AnomalyDetectionResult {
  return {
    anomalies: (result.anomalies || []).map(a => ({
      type: a.type || 'unknown',
      field: a.field || 'unknown',
      severity: a.severity || 'low',
      description: a.description || '',
      confidence: typeof a.confidence === 'number' ? Math.min(1, Math.max(0, a.confidence)) : 0.5
    })),
    fraudProbability: typeof result.fraudProbability === 'number' 
      ? Math.min(100, Math.max(0, result.fraudProbability)) 
      : 10,
    riskLevel: ['low', 'medium', 'high', 'critical'].includes(result.riskLevel) 
      ? result.riskLevel 
      : 'low',
    explanation: result.explanation || 'Analyse terminée.',
    recommendations: Array.isArray(result.recommendations) 
      ? result.recommendations 
      : ['Aucune recommandation spécifique']
  };
}
