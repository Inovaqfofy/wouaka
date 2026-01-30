import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  checkRateLimit,
  rateLimitHeaders,
  validateScoreInput,
  redactPII,
  createRateLimitResponse,
  createValidationErrorResponse,
  createWebhookDeliveryHeaders,
  validateWebhookUrl
} from '../_shared/security.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

// ============================================
// WOUAKA PARTNERS API - SOVEREIGN SCORING v5.2
// Full-featured credit scoring for API clients
// ============================================

interface ScoreRequest {
  national_id?: string
  phone_number?: string
  full_name?: string
  monthly_income?: number
  monthly_expenses?: number
  existing_loans?: number
  mobile_money_volume?: number
  mobile_money_transactions?: number
  sim_age_months?: number
  employment_type?: string
  sector?: string
  region?: string
  city?: string
  company_name?: string
  rccm_number?: string
  years_in_business?: number
  utility_payments_on_time?: number
  utility_payments_late?: number
  tontine_participation?: number
  professional_references?: number
}

// Risk tiers
interface RiskTier {
  tier: string
  grade: string
  description: string
  max_loan_multiplier: number
  max_tenor_months: number
  interest_adjustment: number
}

const RISK_TIERS: RiskTier[] = [
  { tier: 'prime', grade: 'A+', description: 'Profil excellent', max_loan_multiplier: 5, max_tenor_months: 36, interest_adjustment: -2 },
  { tier: 'near_prime', grade: 'A', description: 'Bon profil', max_loan_multiplier: 4, max_tenor_months: 24, interest_adjustment: 0 },
  { tier: 'standard', grade: 'B', description: 'Profil moyen', max_loan_multiplier: 3, max_tenor_months: 18, interest_adjustment: 2 },
  { tier: 'subprime', grade: 'C', description: 'Profil à risque', max_loan_multiplier: 2, max_tenor_months: 12, interest_adjustment: 5 },
  { tier: 'high_risk', grade: 'D', description: 'Risque élevé', max_loan_multiplier: 1, max_tenor_months: 6, interest_adjustment: 10 },
  { tier: 'decline', grade: 'E', description: 'Non éligible', max_loan_multiplier: 0, max_tenor_months: 0, interest_adjustment: 0 },
]

// Economic zones
const ECONOMIC_ZONES: Record<string, { factor: number; tier: string; infrastructure: number }> = {
  'abidjan': { factor: 1.0, tier: 'metro', infrastructure: 0.95 },
  'dakar': { factor: 0.95, tier: 'metro', infrastructure: 0.90 },
  'cotonou': { factor: 0.85, tier: 'metro', infrastructure: 0.80 },
  'bamako': { factor: 0.80, tier: 'metro', infrastructure: 0.70 },
  'lome': { factor: 0.80, tier: 'metro', infrastructure: 0.75 },
  'ouagadougou': { factor: 0.75, tier: 'metro', infrastructure: 0.70 },
  'niamey': { factor: 0.65, tier: 'metro', infrastructure: 0.60 },
}

const DEFAULT_ZONE = { factor: 0.55, tier: 'rural', infrastructure: 0.40 }

// ============================================
// API KEY VALIDATION
// ============================================
async function validateApiKey(supabase: any, apiKey: string): Promise<{ valid: boolean; userId?: string; keyId?: string; permissions?: string[]; rateLimit?: number }> {
  if (!apiKey || !apiKey.startsWith('wk_')) {
    return { valid: false }
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(apiKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  const { data: keyData, error } = await supabase
    .from('api_keys')
    .select('id, user_id, permissions, is_active, expires_at, rate_limit')
    .eq('key_hash', keyHash)
    .single()

  if (error || !keyData) return { valid: false }
  if (!keyData.is_active) return { valid: false }
  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) return { valid: false }

  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyData.id)

  return { 
    valid: true, 
    userId: keyData.user_id, 
    keyId: keyData.id, 
    permissions: keyData.permissions || ['score'],
    rateLimit: keyData.rate_limit || 1000
  }
}

// ============================================
// LOGGING & WEBHOOKS
// ============================================
async function logApiCall(supabase: any, params: {
  apiKeyId: string
  userId: string
  endpoint: string
  method: string
  statusCode: number
  requestBody?: any
  responseBody?: any
  processingTimeMs: number
  ipAddress?: string
  userAgent?: string
}) {
  // SECURITY: Redact PII before logging
  const redactedRequest = redactPII(params.requestBody)
  const redactedResponse = redactPII(params.responseBody)
  
  await supabase.from('api_calls').insert({
    api_key_id: params.apiKeyId,
    user_id: params.userId,
    endpoint: params.endpoint,
    method: params.method,
    status_code: params.statusCode,
    request_body: redactedRequest,
    response_body: redactedResponse,
    processing_time_ms: params.processingTimeMs,
    ip_address: params.ipAddress,
    user_agent: params.userAgent
  })
}

async function triggerWebhooks(supabase: any, userId: string, eventType: string, payload: any) {
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .contains('events', [eventType])

  if (!webhooks || webhooks.length === 0) return

  for (const webhook of webhooks) {
    try {
      // SECURITY: Validate webhook URL against SSRF
      const urlValidation = validateWebhookUrl(webhook.url)
      if (!urlValidation.valid) {
        console.warn(`[WEBHOOK] SSRF blocked for ${webhook.id}: ${urlValidation.error}`)
        await supabase.from('webhook_deliveries').insert({
          webhook_id: webhook.id,
          event_type: eventType,
          payload: redactPII(payload),
          status_code: 0,
          response_body: `SSRF Protection: ${urlValidation.error}`
        })
        continue
      }
      
      // SECURITY: Use HMAC signature instead of sending secret in plain text
      const payloadString = JSON.stringify(payload)
      const secureHeaders = await createWebhookDeliveryHeaders(payloadString, webhook.secret, eventType)
      
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: secureHeaders,
        body: payloadString
      })

      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload: redactPII(payload),
        status_code: response.status,
        delivered_at: new Date().toISOString()
      })

      await supabase.from('webhooks').update({ last_triggered_at: new Date().toISOString(), failure_count: 0 }).eq('id', webhook.id)
    } catch (error) {
      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload: redactPII(payload),
        status_code: 0,
        response_body: (error as Error).message
      })
      await supabase.from('webhooks').update({ failure_count: webhook.failure_count + 1 }).eq('id', webhook.id)
    }
  }
}

// ============================================
// SOVEREIGN SCORING ENGINE v5.2
// ============================================
function calculateSovereignScore(input: ScoreRequest): {
  score: number
  grade: string
  risk_tier: RiskTier
  confidence: number
  sub_scores: Record<string, any>
  business_indicators: Record<string, number>
  fraud_analysis: { alerts: any[]; total_penalty: number; risk_level: string }
  credit_recommendation: Record<string, any>
  feature_importance: Record<string, number>
  explanations: string[]
  recommendations: string[]
} {
  const features: Record<string, { value: number; verified: boolean; confidence: number }> = {}
  
  // ============================================
  // A) FINANCIAL FEATURES
  // ============================================
  
  // Income stability
  if (input.monthly_income && input.monthly_income > 0) {
    const stabilityBonus = Math.min((input.years_in_business || 0) * 0.06, 0.3)
    features.income_stability_index = { value: Math.min(0.5 + stabilityBonus, 1), verified: false, confidence: 40 }
  } else {
    features.income_stability_index = { value: 0.3, verified: false, confidence: 20 }
  }
  
  // Expense ratio
  if (input.monthly_income && input.monthly_expenses) {
    const ratio = input.monthly_expenses / input.monthly_income
    features.expense_to_income_ratio = { value: Math.max(0, Math.min(1, 1 - ratio)), verified: false, confidence: 40 }
  } else {
    features.expense_to_income_ratio = { value: 0.5, verified: false, confidence: 20 }
  }
  
  // Savings rate
  const savingsRatio = input.monthly_income && input.monthly_income > 0
    ? Math.max(0, (input.monthly_income - (input.monthly_expenses || 0)) / input.monthly_income)
    : 0
  features.savings_rate = { value: Math.min(savingsRatio * 2, 1), verified: false, confidence: 35 }
  
  // MoMo velocity
  const mmTx = input.mobile_money_transactions || 0
  features.momo_velocity_score = { value: Math.min(mmTx / 100, 0.9), verified: false, confidence: 35 }
  
  // Debt ratio
  const dti = input.monthly_income && input.monthly_income > 0
    ? (input.existing_loans || 0) / (input.monthly_income * 12)
    : 0
  features.debt_to_income_ratio = { value: Math.max(0, 1 - Math.min(dti / 3, 1)), verified: false, confidence: 40 }
  
  // ============================================
  // B) PAYMENT HISTORY FEATURES
  // ============================================
  
  const totalPayments = (input.utility_payments_on_time || 0) + (input.utility_payments_late || 0)
  features.utility_payment_discipline = {
    value: totalPayments > 0 ? (input.utility_payments_on_time || 0) / totalPayments : 0.5,
    verified: false,
    confidence: 45
  }
  
  // Tontine discipline
  if (input.tontine_participation) {
    features.tontine_discipline = { value: Math.min(input.tontine_participation / 5, 1), verified: false, confidence: 45 }
    features.tontine_network_score = { value: Math.min(input.tontine_participation / 3, 0.9), verified: false, confidence: 45 }
  } else {
    features.tontine_discipline = { value: 0, verified: false, confidence: 0 }
    features.tontine_network_score = { value: 0, verified: false, confidence: 0 }
  }
  
  // ============================================
  // C) IDENTITY & STABILITY FEATURES
  // ============================================
  
  features.document_verification_score = {
    value: input.national_id ? 0.4 : 0.1,
    verified: false,
    confidence: input.national_id ? 35 : 10
  }
  
  const simAgeMonths = input.sim_age_months || 0
  features.sim_age_score = { value: Math.min(Math.log(simAgeMonths + 1) / Math.log(37), 1), verified: false, confidence: 40 }
  
  features.business_formalization_score = {
    value: input.rccm_number ? 0.7 : (input.employment_type === 'business_owner' ? 0.3 : 0.2),
    verified: !!input.rccm_number,
    confidence: input.rccm_number ? 70 : 25
  }
  
  // ============================================
  // D) DIGITAL & SOCIAL FEATURES
  // ============================================
  
  features.digital_engagement_score = { value: Math.min(mmTx / 50, 0.9), verified: false, confidence: 35 }
  
  features.guarantor_quality_score = {
    value: input.professional_references ? Math.min(input.professional_references / 3, 1) : 0.3,
    verified: false,
    confidence: 40
  }
  
  // ============================================
  // E) ENVIRONMENTAL FEATURES
  // ============================================
  
  const city = (input.city || '').toLowerCase().replace(/[\s-]/g, '_')
  const zone = ECONOMIC_ZONES[city] || DEFAULT_ZONE
  features.economic_zone_factor = { value: zone.factor, verified: true, confidence: 90 }
  features.infrastructure_access_score = { value: zone.infrastructure, verified: true, confidence: 85 }
  
  // ============================================
  // CALCULATE 6 SUB-SCORES
  // ============================================
  const subScoreDefinitions = [
    { id: 'identity_stability', name: 'Identité & Stabilité', weight: 0.20, features: ['document_verification_score', 'sim_age_score', 'business_formalization_score'] },
    { id: 'cashflow_consistency', name: 'Flux de Trésorerie', weight: 0.25, features: ['income_stability_index', 'expense_to_income_ratio', 'momo_velocity_score', 'savings_rate'] },
    { id: 'behavioral_psychometric', name: 'Comportement', weight: 0.15, features: ['digital_engagement_score'] },
    { id: 'financial_discipline', name: 'Discipline Financière', weight: 0.20, features: ['utility_payment_discipline', 'tontine_discipline', 'debt_to_income_ratio'] },
    { id: 'social_capital', name: 'Capital Social', weight: 0.12, features: ['tontine_network_score', 'guarantor_quality_score'] },
    { id: 'environmental_adjustment', name: 'Environnement', weight: 0.08, features: ['economic_zone_factor', 'infrastructure_access_score'] },
  ]
  
  const subScores: Record<string, any> = {}
  
  for (const def of subScoreDefinitions) {
    let sum = 0
    let count = 0
    let totalConfidence = 0
    const usedFeatures: string[] = []
    
    for (const fId of def.features) {
      const f = features[fId]
      if (f && f.confidence > 0) {
        sum += f.value * 100
        count++
        totalConfidence += f.confidence
        usedFeatures.push(fId)
      }
    }
    
    const score = count > 0 ? Math.round(sum / count) : 50
    const confidence = count > 0 ? Math.round(totalConfidence / count) : 30
    
    subScores[def.id] = {
      id: def.id,
      name: def.name,
      score,
      weight: def.weight,
      features_used: usedFeatures,
      confidence,
      explanation: `Score ${score >= 70 ? 'bon' : score >= 50 ? 'moyen' : 'faible'} basé sur ${usedFeatures.length} indicateur(s).`
    }
  }
  
  // ============================================
  // FRAUD DETECTION
  // ============================================
  const fraudAlerts: any[] = []
  let fraudPenalty = 0
  
  // SIM age check
  if (simAgeMonths < 3) {
    fraudAlerts.push({ rule_id: 'sim_recent', message: 'Numéro téléphone récent', penalty: simAgeMonths < 1 ? 20 : 10, severity: simAgeMonths < 1 ? 'high' : 'medium', category: 'behavioral' })
    fraudPenalty += simAgeMonths < 1 ? 20 : 10
  }
  
  // Income vs expenses
  if (input.monthly_income && input.monthly_expenses && input.monthly_expenses > input.monthly_income * 1.5) {
    fraudAlerts.push({ rule_id: 'negative_savings', message: 'Dépenses excessives par rapport aux revenus', penalty: 15, severity: 'high', category: 'financial' })
    fraudPenalty += 15
  }
  
  // Sector income check
  if (input.monthly_income && input.sector) {
    const sectorMax: Record<string, number> = { agriculture: 2000000, commerce: 5000000, services: 3000000 }
    const max = sectorMax[input.sector.toLowerCase()] || 5000000
    if (input.monthly_income > max * 2) {
      fraudAlerts.push({ rule_id: 'income_sector_mismatch', message: `Revenu élevé pour secteur ${input.sector}`, penalty: 15, severity: 'medium', category: 'financial' })
      fraudPenalty += 15
    }
  }
  
  // ============================================
  // CALCULATE FINAL SCORE
  // ============================================
  let weightedSum = 0
  let totalWeight = 0
  
  for (const def of subScoreDefinitions) {
    const subScore = subScores[def.id]
    const adjustedWeight = def.weight * (subScore.confidence / 100)
    weightedSum += subScore.score * adjustedWeight
    totalWeight += adjustedWeight
  }
  
  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 50
  const finalScore = Math.round(Math.max(0, Math.min(100, rawScore - fraudPenalty)))
  
  // Get risk tier
  const riskTier = RISK_TIERS.find(t => 
    (t.grade === 'A+' && finalScore >= 85) ||
    (t.grade === 'A' && finalScore >= 70 && finalScore < 85) ||
    (t.grade === 'B' && finalScore >= 55 && finalScore < 70) ||
    (t.grade === 'C' && finalScore >= 40 && finalScore < 55) ||
    (t.grade === 'D' && finalScore >= 25 && finalScore < 40) ||
    (t.grade === 'E' && finalScore < 25)
  ) || RISK_TIERS[RISK_TIERS.length - 1]
  
  // Business indicators
  const businessIndicators = {
    reliability: Math.round(((features.utility_payment_discipline?.value || 0.5) * 0.35 + (features.document_verification_score?.value || 0.3) * 0.30 + (features.business_formalization_score?.value || 0.2) * 0.35) * 100),
    stability: Math.round(((features.sim_age_score?.value || 0.3) * 0.25 + (features.business_formalization_score?.value || 0.3) * 0.40 + (features.economic_zone_factor?.value || 0.5) * 0.35) * 100),
    short_term_risk: Math.round(Math.max(0, Math.min(100, 100 - ((1 - (features.debt_to_income_ratio?.value || 0.5)) * 30 + (1 - (features.utility_payment_discipline?.value || 0.5)) * 25)))),
    engagement_capacity: Math.round(((features.expense_to_income_ratio?.value || 0.5) * 0.40 + (features.debt_to_income_ratio?.value || 0.5) * 0.35 + (features.digital_engagement_score?.value || 0.4) * 0.25) * 100),
  }
  
  // Credit recommendation
  const approved = finalScore >= 25 && fraudPenalty < 40
  const maxAmount = approved ? (input.monthly_income || 0) * riskTier.max_loan_multiplier : 0
  const conditions: string[] = []
  if (fraudPenalty > 0) conditions.push(`Alertes fraude (-${fraudPenalty} pts)`)
  if (finalScore < 55) conditions.push('Garanties supplémentaires requises')
  if (finalScore < 40) conditions.push('Co-signature obligatoire')
  
  // Confidence
  const verifiedCount = Object.values(features).filter(f => f.verified).length
  const avgConfidence = Object.values(features).reduce((sum, f) => sum + f.confidence, 0) / Object.keys(features).length
  const confidence = Math.round(avgConfidence)
  
  // Feature importance
  const featureImportance: Record<string, number> = {}
  for (const [fId, f] of Object.entries(features)) {
    featureImportance[fId] = Math.round(f.value * f.confidence)
  }
  
  // Explanations
  const explanations: string[] = []
  if (verifiedCount === 0) {
    explanations.push('Score basé sur données déclaratives uniquement')
  } else {
    explanations.push(`${verifiedCount} source(s) vérifiée(s)`)
  }
  if (finalScore >= 70) explanations.push('Bon profil de crédit')
  else if (finalScore >= 50) explanations.push('Profil moyen, amélioration possible')
  else explanations.push('Profil à risque, données supplémentaires recommandées')
  
  // Recommendations
  const recommendations: string[] = []
  if (!input.rccm_number) recommendations.push('Fournir un numéro RCCM (+10-15 pts)')
  if (!input.national_id) recommendations.push('Fournir une pièce d\'identité (+5-10 pts)')
  if ((input.mobile_money_transactions || 0) < 20) recommendations.push('Utiliser Mobile Money plus régulièrement')
  recommendations.push('Connecter les comptes MoMo pour vérification automatique')
  
  return {
    score: finalScore,
    grade: riskTier.grade,
    risk_tier: riskTier,
    confidence,
    sub_scores: subScores,
    business_indicators: businessIndicators,
    fraud_analysis: {
      alerts: fraudAlerts,
      total_penalty: fraudPenalty,
      risk_level: fraudPenalty >= 40 ? 'critical' : fraudPenalty >= 20 ? 'high' : fraudPenalty > 0 ? 'medium' : 'low'
    },
    credit_recommendation: {
      approved,
      max_amount: Math.round(maxAmount),
      max_tenor_months: riskTier.max_tenor_months,
      suggested_rate_adjustment: riskTier.interest_adjustment,
      conditions
    },
    feature_importance: featureImportance,
    explanations,
    recommendations
  }
}

// ============================================
// MAIN HANDLER
// ============================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const apiKey = req.headers.get('x-api-key')
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip')
  const userAgent = req.headers.get('user-agent')

  const keyValidation = await validateApiKey(supabase, apiKey || '')
  
  if (!keyValidation.valid) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired API key', code: 'INVALID_API_KEY' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!keyValidation.permissions?.includes('score')) {
    return new Response(
      JSON.stringify({ error: 'API key does not have permission for score endpoint', code: 'INSUFFICIENT_PERMISSIONS' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Rate limiting using api_keys.rate_limit
  const rateLimit = await checkRateLimit(supabase, keyValidation.keyId!, keyValidation.rateLimit || 1000, 60)
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded', 
        code: 'RATE_LIMIT_EXCEEDED',
        reset_at: rateLimit.resetAt.toISOString()
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          ...rateLimitHeaders(rateLimit),
          'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
        } 
      }
    )
  }

  try {
    const body: ScoreRequest = await req.json()
    
    console.log(`[PARTNERS SCORE v5.2] Request from ${keyValidation.userId} for ${body.full_name || 'Unknown'}`)
    
    const result = calculateSovereignScore(body)
    
    const response = {
      success: true,
      data: {
        // Main score
        score: result.score,
        grade: result.grade,
        risk_category: result.risk_tier.tier,
        risk_description: result.risk_tier.description,
        confidence: result.confidence,
        
        // Sub-scores (6 layers)
        sub_scores: Object.values(result.sub_scores),
        
        // Business indicators
        reliability: result.business_indicators.reliability,
        stability: result.business_indicators.stability,
        short_term_risk: result.business_indicators.short_term_risk,
        engagement_capacity: result.business_indicators.engagement_capacity,
        
        // Credit recommendation
        credit_recommendation: result.credit_recommendation,
        
        // Fraud analysis
        fraud_analysis: result.fraud_analysis,
        
        // Explainability
        explanations: result.explanations,
        recommendations: result.recommendations,
        feature_importance: result.feature_importance,
        
        // Metadata
        model_version: '5.2.0-sovereign-api',
        calculated_at: new Date().toISOString()
      }
    }

    const processingTime = Date.now() - startTime

    await logApiCall(supabase, {
      apiKeyId: keyValidation.keyId!,
      userId: keyValidation.userId!,
      endpoint: '/partners/score',
      method: 'POST',
      statusCode: 200,
      requestBody: redactPII(body),
      responseBody: response,
      processingTimeMs: processingTime,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined
    })

    await triggerWebhooks(supabase, keyValidation.userId!, 'score.calculated', {
      score: result.score,
      grade: result.grade,
      risk_category: result.risk_tier.tier,
      confidence: result.confidence,
      calculated_at: response.data.calculated_at
    })

    console.log(`[PARTNERS SCORE v5.2] Complete: Score=${result.score} Grade=${result.grade} Time=${processingTime}ms`)

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Processing-Time': `${processingTime}ms`,
          'X-Model-Version': '5.2.0'
        } 
      }
    )
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    await logApiCall(supabase, {
      apiKeyId: keyValidation.keyId!,
      userId: keyValidation.userId!,
      endpoint: '/partners/score',
      method: 'POST',
      statusCode: 400,
      responseBody: { error: (error as Error).message },
      processingTimeMs: processingTime
    })

    return new Response(
      JSON.stringify({ error: 'Invalid request body', details: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
