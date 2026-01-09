import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Base feature weights for scoring algorithm
const BASE_FEATURE_WEIGHTS = {
  income_ratio: 0.14,
  payment_history: 0.14,
  mobile_money_activity: 0.12,
  sim_stability: 0.10,
  employment_stability: 0.10,
  business_formalization: 0.12,
  loan_burden: 0.08,
  regional_factor: 0.05,
  data_quality_bonus: 0.05,
  // New autonomous sources
  identity_verification: 0.05,
  behavioral_score: 0.05,
};

// Multipliers based on data source verification status - AUTONOMOUS HIERARCHY
const VERIFICATION_MULTIPLIERS = {
  rccm_scraped: 1.0,       // RCCM verified via public registry scraping
  ocr_deepseek: 0.90,      // Document analyzed with DeepSeek
  ocr_regex: 0.70,         // Document analyzed with regex fallback
  cross_validated: 0.85,   // Cross-validated data
  behavioral_positive: 0.80, // Positive behavioral signals
  declared: 0.55,          // User-declared data only
  behavioral_suspicious: 0.35, // Suspicious behavioral patterns
  missing: 0.30,           // No data available
};

interface EnrichmentData {
  sources?: Array<{
    source_type: string;
    provider: string;
    verification_status: 'verified' | 'simulated' | 'failed';
    confidence: number;
    data: any;
  }>;
  feature_adjustments?: Record<string, number>;
  overall_confidence?: number;
  is_demo?: boolean;
  // New autonomous data sources
  rccm_verification?: {
    verified: boolean;
    source: 'public_registry' | 'format_validated' | 'cache' | 'error';
    data?: {
      company_name?: string;
      registration_date?: string;
    };
    confidence: number;
  };
  document_extraction?: {
    full_name?: string;
    birth_date?: string;
    document_number?: string;
    expiry_date?: string;
    extraction_confidence: number;
    method: 'deepseek' | 'regex_fallback';
  };
  behavioral_assessment?: {
    score: number;
    flags: string[];
    details: Record<string, number>;
  };
  cross_validation?: {
    overallScore: number;
    isValid: boolean;
    flags: string[];
  };
}

// Calculate individual feature scores with enrichment data
function calculateFeatures(data: any, enrichment?: EnrichmentData) {
  const features: Record<string, number> = {};
  const sourceContributions: Record<string, { source: string; verified: boolean }> = {};
  
  // Get enriched data if available
  const enrichedMM = enrichment?.sources?.find(s => s.source_type === 'mobile_money')?.data;
  const enrichedTelecom = enrichment?.sources?.find(s => s.source_type === 'telecom')?.data;
  const enrichedRegistry = enrichment?.sources?.find(s => s.source_type === 'registry')?.data;
  const enrichedUtility = enrichment?.sources?.find(s => s.source_type === 'utility')?.data;
  
  // Income ratio (income vs expenses) - higher is better
  const incomeRatio = data.monthly_income > 0 
    ? Math.min((data.monthly_income - data.monthly_expenses) / data.monthly_income, 1)
    : 0;
  features.income_ratio = Math.max(0, incomeRatio);
  sourceContributions.income_ratio = { source: 'declared', verified: false };
  
  // Payment history score - USE ENRICHED DATA IF AVAILABLE
  if (enrichedUtility?.payment_history) {
    const ph = enrichedUtility.payment_history;
    const total = ph.last_12_months_on_time + ph.last_12_months_late + ph.last_12_months_missed;
    features.payment_history = total > 0 ? ph.last_12_months_on_time / total : 0.5;
    sourceContributions.payment_history = { source: 'utility_api', verified: true };
  } else {
    const totalPayments = (data.utility_payments_on_time || 0) + (data.utility_payments_late || 0);
    features.payment_history = totalPayments > 0 
      ? (data.utility_payments_on_time || 0) / totalPayments 
      : 0.5;
    sourceContributions.payment_history = { source: 'declared', verified: false };
  }
  
  // Mobile money activity - USE ENRICHED DATA IF AVAILABLE
  if (enrichedMM?.transaction_regularity_score !== undefined) {
    features.mobile_money_activity = enrichedMM.transaction_regularity_score / 100;
    sourceContributions.mobile_money_activity = { source: 'mobile_money_api', verified: true };
  } else {
    const mmTransactions = data.mobile_money_transactions || 0;
    const mmVolume = data.mobile_money_volume || 0;
    features.mobile_money_activity = Math.min(
      (mmTransactions / 50 * 0.5) + (Math.min(mmVolume, 500000) / 500000 * 0.5),
      1
    );
    sourceContributions.mobile_money_activity = { source: 'declared', verified: false };
  }
  
  // SIM stability - USE ENRICHED DATA IF AVAILABLE
  if (enrichedTelecom?.sim_age_months !== undefined) {
    features.sim_stability = Math.min(enrichedTelecom.sim_age_months / 36, 1);
    sourceContributions.sim_stability = { source: 'telecom_api', verified: true };
  } else {
    features.sim_stability = Math.min((data.sim_age_months || 0) / 36, 1);
    sourceContributions.sim_stability = { source: 'declared', verified: false };
  }
  
  // Employment stability - Enhanced with registry data
  const yearsWorking = data.years_in_business || 0;
  if (enrichedRegistry?.registration_date) {
    const regYear = new Date(enrichedRegistry.registration_date).getFullYear();
    const yearsRegistered = new Date().getFullYear() - regYear;
    features.employment_stability = Math.min(yearsRegistered / 10, 1);
    sourceContributions.employment_stability = { source: 'registry_api', verified: true };
  } else {
    features.employment_stability = Math.min(yearsWorking / 10, 1);
    sourceContributions.employment_stability = { source: 'declared', verified: false };
  }
  
  // Business formalization - PRIORITY: RCCM Scraping > Registry API > Declared
  if (enrichment?.rccm_verification?.verified) {
    features.business_formalization = 1.0;
    sourceContributions.business_formalization = { source: 'rccm_scraped', verified: true };
  } else if (enrichedRegistry?.is_valid !== undefined) {
    features.business_formalization = enrichedRegistry.is_valid && enrichedRegistry.status === 'active' ? 1 : 0.3;
    sourceContributions.business_formalization = { source: 'registry_api', verified: true };
  } else if (enrichment?.rccm_verification?.source === 'format_validated') {
    features.business_formalization = 0.6;
    sourceContributions.business_formalization = { source: 'format_validated', verified: false };
  } else {
    features.business_formalization = data.rccm_number ? 0.5 : 0.3;
    sourceContributions.business_formalization = { source: 'declared', verified: false };
  }
  
  // Loan burden (lower existing loans relative to income is better)
  const loanToIncome = data.monthly_income > 0 
    ? Math.min((data.existing_loans || 0) / (data.monthly_income * 12), 1)
    : 0.5;
  features.loan_burden = 1 - loanToIncome;
  sourceContributions.loan_burden = { source: 'declared', verified: false };
  
  // Regional economic factor
  const economicRegions: Record<string, number> = {
    'abidjan': 1.0, 'dakar': 0.95, 'lagos': 0.95, 'accra': 0.90,
    'cotonou': 0.85, 'lome': 0.85, 'bamako': 0.80, 'ouagadougou': 0.80,
    'niamey': 0.75, 'conakry': 0.75,
  };
  const city = (data.city || '').toLowerCase();
  features.regional_factor = economicRegions[city] || 0.7;
  sourceContributions.regional_factor = { source: 'system', verified: true };
  
  // NEW: Identity verification from OCR + DeepSeek
  if (enrichment?.document_extraction) {
    const docExtract = enrichment.document_extraction;
    const ocrConfidence = docExtract.extraction_confidence / 100;
    features.identity_verification = ocrConfidence;
    sourceContributions.identity_verification = { 
      source: docExtract.method === 'deepseek' ? 'ocr_deepseek' : 'ocr_regex', 
      verified: ocrConfidence >= 0.7 
    };
  } else {
    features.identity_verification = data.national_id ? 0.4 : 0.2;
    sourceContributions.identity_verification = { source: 'declared', verified: false };
  }
  
  // NEW: Behavioral score (from in-app signals)
  if (enrichment?.behavioral_assessment) {
    // Invert the score: 100 = suspicious → 0, 0 = normal → 1
    const behavioralScore = 1 - (enrichment.behavioral_assessment.score / 100);
    features.behavioral_score = behavioralScore;
    sourceContributions.behavioral_score = { 
      source: behavioralScore >= 0.7 ? 'behavioral_positive' : 'behavioral_suspicious', 
      verified: true 
    };
  } else {
    features.behavioral_score = 0.7; // Neutral default
    sourceContributions.behavioral_score = { source: 'missing', verified: false };
  }
  
  // NEW: Cross-validation bonus
  if (enrichment?.cross_validation?.isValid) {
    features.data_quality_bonus = enrichment.cross_validation.overallScore / 100;
    sourceContributions.data_quality_bonus = { source: 'cross_validated', verified: true };
  } else {
    // Data quality bonus - based on how many sources are verified
    const verifiedCount = Object.values(sourceContributions).filter(s => s.verified).length;
    features.data_quality_bonus = verifiedCount / Object.keys(sourceContributions).length;
    sourceContributions.data_quality_bonus = { source: 'calculated', verified: false };
  }
  
  return { features, sourceContributions };
}

// Calculate weighted score with dynamic weights based on verification
function calculateScore(
  features: Record<string, number>,
  sourceContributions: Record<string, { source: string; verified: boolean }>
): number {
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const [feature, baseWeight] of Object.entries(BASE_FEATURE_WEIGHTS)) {
    const contribution = sourceContributions[feature];
    const sourceType = contribution?.source as keyof typeof VERIFICATION_MULTIPLIERS;
    const multiplier = contribution?.verified 
      ? (VERIFICATION_MULTIPLIERS[sourceType] || 0.85)
      : VERIFICATION_MULTIPLIERS.declared;
    
    // Adjust weight based on verification status
    const adjustedWeight = baseWeight * (contribution?.verified ? 1.1 : 0.9);
    
    weightedSum += (features[feature] || 0) * adjustedWeight * multiplier;
    totalWeight += adjustedWeight;
  }
  
  // Normalize to 0-100 range
  const normalizedScore = (weightedSum / totalWeight) * 100;
  return Math.round(Math.max(0, Math.min(100, normalizedScore)));
}

// Calculate the 4 business sub-indicators
function calculateBusinessIndicators(
  features: Record<string, number>, 
  data: any,
  sourceContributions: Record<string, { source: string; verified: boolean }>
): {
  reliability: number;
  stability: number;
  short_term_risk: number;
  engagement_capacity: number;
} {
  // Apply verification bonus
  const verificationBonus = (source: string) => 
    sourceContributions[source]?.verified ? 1.1 : 1.0;

  // FIABILITÉ (Reliability)
  const reliability = Math.round(
    (features.payment_history * 0.45 * verificationBonus('payment_history') + 
     features.business_formalization * 0.30 * verificationBonus('business_formalization') +
     features.mobile_money_activity * 0.25 * verificationBonus('mobile_money_activity')) * 100
  );

  // STABILITÉ (Stability)
  const stability = Math.round(
    (features.sim_stability * 0.35 * verificationBonus('sim_stability') +
     features.employment_stability * 0.35 * verificationBonus('employment_stability') +
     features.regional_factor * 0.30) * 100
  );

  // RISQUE COURT TERME (Short-term risk) - 100 = low risk
  const latePaymentRatio = data.utility_payments_late || 0;
  const latePaymentPenalty = Math.min(latePaymentRatio * 5, 30);
  const loanBurdenPenalty = (1 - features.loan_burden) * 30;
  const incomeRatioPenalty = features.income_ratio < 0.2 ? 20 : 0;
  
  const short_term_risk = Math.round(
    Math.max(0, Math.min(100, 
      100 - latePaymentPenalty - loanBurdenPenalty - incomeRatioPenalty
    ))
  );

  // CAPACITÉ D'ENGAGEMENT (Engagement capacity)
  const engagement_capacity = Math.round(
    (features.income_ratio * 0.40 +
     features.loan_burden * 0.30 +
     features.mobile_money_activity * 0.30 * verificationBonus('mobile_money_activity')) * 100
  );

  return {
    reliability: Math.max(0, Math.min(100, reliability)),
    stability: Math.max(0, Math.min(100, stability)),
    short_term_risk: Math.max(0, Math.min(100, short_term_risk)),
    engagement_capacity: Math.max(0, Math.min(100, engagement_capacity)),
  };
}

// Determine risk category
function getRiskCategory(score: number): string {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 35) return 'poor';
  return 'very_poor';
}

// Get grade from score
function getGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  if (score >= 30) return 'D';
  return 'E';
}

// Calculate confidence based on data completeness AND verification
function calculateConfidence(
  data: any, 
  enrichment?: EnrichmentData,
  sourceContributions?: Record<string, { source: string; verified: boolean }>
): number {
  // Base confidence from data completeness
  const requiredFields = [
    'monthly_income', 'monthly_expenses', 'mobile_money_transactions',
    'sim_age_months', 'employment_type', 'city'
  ];
  const optionalFields = [
    'rccm_number', 'mobile_money_volume', 'utility_payments_on_time',
    'years_in_business', 'existing_loans', 'national_id', 'phone_number'
  ];
  
  let score = 0;
  requiredFields.forEach(field => {
    if (data[field] !== null && data[field] !== undefined && data[field] !== '') score += 8;
  });
  optionalFields.forEach(field => {
    if (data[field] !== null && data[field] !== undefined && data[field] !== '') score += 4;
  });
  
  // Add verification bonus
  if (sourceContributions) {
    const verifiedCount = Object.values(sourceContributions).filter(s => s.verified).length;
    score += verifiedCount * 5;
  }
  
  // Add enrichment confidence
  if (enrichment?.overall_confidence) {
    score = (score + enrichment.overall_confidence) / 2;
  }
  
  return Math.min(Math.round(score), 100);
}

// Build data quality summary
function buildDataQuality(
  enrichment?: EnrichmentData,
  sourceContributions?: Record<string, { source: string; verified: boolean }>
): {
  total_sources: number;
  verified_sources: number;
  declared_sources: number;
  simulated_sources: number;
  overall_data_confidence: number;
} {
  const verifiedCount = enrichment?.sources?.filter(s => s.verification_status === 'verified').length || 0;
  const simulatedCount = enrichment?.sources?.filter(s => s.verification_status === 'simulated').length || 0;
  const declaredCount = sourceContributions 
    ? Object.values(sourceContributions).filter(s => !s.verified).length 
    : 8;
  
  return {
    total_sources: verifiedCount + simulatedCount + declaredCount,
    verified_sources: verifiedCount,
    declared_sources: declaredCount,
    simulated_sources: simulatedCount,
    overall_data_confidence: enrichment?.overall_confidence || 55,
  };
}

// Build source breakdown
function buildSourceBreakdown(
  enrichment?: EnrichmentData,
  features?: Record<string, number>
): Array<{
  category: string;
  provider: string;
  display_name: string;
  verification_status: string;
  confidence_score: number;
  contribution_to_score: number;
}> {
  if (!enrichment?.sources) return [];
  
  return enrichment.sources
    .filter(s => s.verification_status !== 'failed')
    .map(source => ({
      category: source.source_type,
      provider: source.provider,
      display_name: source.data?.display_name || source.provider,
      verification_status: source.verification_status,
      confidence_score: source.confidence,
      contribution_to_score: Math.round(
        (BASE_FEATURE_WEIGHTS[source.source_type as keyof typeof BASE_FEATURE_WEIGHTS] || 0.1) * 100
      ),
    }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { enrichment_data, ...requestData } = await req.json();
    
    // Calculate features with enrichment
    const { features, sourceContributions } = calculateFeatures(requestData, enrichment_data);
    
    // Calculate main score with verification awareness
    const score = calculateScore(features, sourceContributions);
    const riskCategory = getRiskCategory(score);
    const grade = getGrade(score);
    const confidence = calculateConfidence(requestData, enrichment_data, sourceContributions);
    
    // Calculate the 4 business sub-indicators
    const businessIndicators = calculateBusinessIndicators(features, requestData, sourceContributions);
    
    // Build data quality info
    const dataQuality = buildDataQuality(enrichment_data, sourceContributions);
    const sourceBreakdown = buildSourceBreakdown(enrichment_data, features);
    
    // Generate feature importance (SHAP-like values)
    const featureImportance = Object.entries(features).map(([name, value]) => ({
      feature: name,
      value: Math.round(value * 100) / 100,
      weight: BASE_FEATURE_WEIGHTS[name as keyof typeof BASE_FEATURE_WEIGHTS] || 0,
      contribution: Math.round(value * (BASE_FEATURE_WEIGHTS[name as keyof typeof BASE_FEATURE_WEIGHTS] || 0) * 100),
      impact: value >= 0.7 ? 'positive' : value >= 0.4 ? 'neutral' : 'negative',
      verified: sourceContributions[name]?.verified || false,
      source: sourceContributions[name]?.source || 'unknown',
    })).sort((a, b) => b.contribution - a.contribution);

    // Use AI for explanations and recommendations
    let explanations: string[] = [];
    let recommendations: string[] = [];

    if (lovableApiKey) {
      try {
        const verifiedSourcesList = Object.entries(sourceContributions)
          .filter(([, v]) => v.verified)
          .map(([k]) => k)
          .join(', ');
        
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `Tu es un expert en analyse de crédit pour l'Afrique de l'Ouest (UEMOA). Tu dois fournir des explications claires et des recommandations personnalisées.
                
Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "explanations": ["explication 1", "explication 2", "explication 3"],
  "recommendations": ["recommandation 1", "recommandation 2", "recommandation 3"]
}

IMPORTANT: Mentionne les sources de données vérifiées quand elles renforcent le score.
Les explications doivent être claires et accessibles.
Les recommandations doivent être actionnables.`
              },
              {
                role: "user",
                content: `Analyse ce profil de crédit:
- Score: ${score}/100 (Grade: ${grade}, Catégorie: ${riskCategory})
- Confiance des données: ${confidence}%
- Sources vérifiées: ${verifiedSourcesList || 'Aucune (données déclaratives)'}
- Fiabilité: ${businessIndicators.reliability}/100
- Stabilité: ${businessIndicators.stability}/100
- Risque court terme: ${businessIndicators.short_term_risk}/100 (100 = faible risque)
- Capacité d'engagement: ${businessIndicators.engagement_capacity}/100
- Revenu mensuel: ${requestData.monthly_income} FCFA
- Volume Mobile Money: ${requestData.mobile_money_volume} FCFA
- RCCM: ${requestData.rccm_number ? 'Oui (vérifié: ' + (sourceContributions.business_formalization?.verified ? 'oui' : 'non') + ')' : 'Non'}

Facteurs clés (avec statut de vérification):
${featureImportance.slice(0, 5).map(f => `- ${f.feature}: ${f.value} (${f.impact}, ${f.verified ? 'vérifié' : 'déclaratif'})`).join('\n')}

Fournis 3 explications et 3 recommandations en français.`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          
          if (content) {
            try {
              let jsonStr = content;
              const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
              if (jsonMatch) {
                jsonStr = jsonMatch[1];
              }
              const parsed = JSON.parse(jsonStr);
              explanations = parsed.explanations || [];
              recommendations = parsed.recommendations || [];
            } catch (parseError) {
              console.error("Error parsing AI response:", parseError);
            }
          }
        }
      } catch (aiError) {
        console.error("AI error:", aiError);
      }
    }

    // Fallback explanations if AI fails
    if (explanations.length === 0) {
      explanations = generateFallbackExplanations(features, score, riskCategory, businessIndicators, sourceContributions);
    }
    if (recommendations.length === 0) {
      recommendations = generateFallbackRecommendations(features, riskCategory, businessIndicators, sourceContributions);
    }

    const processingTime = Date.now() - startTime;

    const result = {
      // Main score
      score,
      grade,
      risk_category: riskCategory,
      confidence,
      
      // 4 Business sub-indicators
      reliability: businessIndicators.reliability,
      stability: businessIndicators.stability,
      short_term_risk: businessIndicators.short_term_risk,
      engagement_capacity: businessIndicators.engagement_capacity,
      
      // Data quality (NEW)
      data_quality: dataQuality,
      source_breakdown: sourceBreakdown,
      
      // Explanations
      explanations,
      recommendations,
      feature_importance: featureImportance,
      
      // Metadata
      processing_time_ms: processingTime,
      model_version: "3.0.0-autonomous",
      calculated_at: new Date().toISOString(),
      is_demo: enrichment_data?.is_demo ?? true,
      
      // Autonomous sources status
      autonomous_sources: {
        rccm_scraped: enrichment_data?.rccm_verification?.verified ?? false,
        ocr_extracted: !!enrichment_data?.document_extraction,
        behavioral_analyzed: !!enrichment_data?.behavioral_assessment,
        cross_validated: enrichment_data?.cross_validation?.isValid ?? false,
      },
    };

    console.log(`Score calculated in ${processingTime}ms - Score: ${score}, Grade: ${grade}, Confidence: ${confidence}%, Verified sources: ${dataQuality.verified_sources + dataQuality.simulated_sources}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Score calculation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateFallbackExplanations(
  features: Record<string, number>, 
  score: number, 
  category: string,
  indicators: { reliability: number; stability: number; short_term_risk: number; engagement_capacity: number },
  sourceContributions: Record<string, { source: string; verified: boolean }>
): string[] {
  const explanations: string[] = [];
  const hasVerifiedSources = Object.values(sourceContributions).some(s => s.verified);
  
  if (hasVerifiedSources) {
    explanations.push("Votre score bénéficie de données vérifiées provenant de sources alternatives, ce qui renforce sa fiabilité.");
  }
  
  if (indicators.reliability >= 70) {
    explanations.push("Votre fiabilité est excellente grâce à un bon historique de paiements et une formalisation de votre activité.");
  } else if (indicators.reliability < 50) {
    explanations.push("Votre fiabilité peut être améliorée en régularisant vos paiements et en formalisant votre activité.");
  }
  
  if (indicators.stability >= 70) {
    explanations.push("Votre stabilité professionnelle et digitale renforce significativement votre profil.");
  } else if (indicators.stability < 50) {
    explanations.push("Une plus grande stabilité dans votre situation professionnelle améliorerait votre score.");
  }
  
  if (indicators.short_term_risk >= 70) {
    explanations.push("Votre risque à court terme est bien maîtrisé avec une bonne gestion de vos engagements.");
  }
  
  return explanations.slice(0, 3);
}

function generateFallbackRecommendations(
  features: Record<string, number>, 
  category: string,
  indicators: { reliability: number; stability: number; short_term_risk: number; engagement_capacity: number },
  sourceContributions: Record<string, { source: string; verified: boolean }>
): string[] {
  const recommendations: string[] = [];
  const hasVerifiedSources = Object.values(sourceContributions).some(s => s.verified);
  
  if (!hasVerifiedSources) {
    recommendations.push("Connectez vos comptes Mobile Money pour améliorer la confiance de votre score avec des données vérifiées.");
  }
  
  if (features.payment_history < 0.8) {
    recommendations.push("Privilégiez le paiement de vos factures à temps pour améliorer votre fiabilité.");
  }
  
  if (features.mobile_money_activity < 0.5) {
    recommendations.push("Augmentez votre utilisation du Mobile Money pour renforcer votre empreinte digitale.");
  }
  
  if (features.business_formalization < 0.5) {
    recommendations.push("L'enregistrement RCCM de votre activité améliorerait significativement votre score.");
  }
  
  if (features.income_ratio < 0.3) {
    recommendations.push("Optimisez votre ratio revenus/dépenses pour augmenter votre capacité d'engagement.");
  }
  
  if (indicators.short_term_risk < 60) {
    recommendations.push("Réduisez vos engagements à court terme pour diminuer votre niveau de risque.");
  }
  
  return recommendations.slice(0, 3);
}
