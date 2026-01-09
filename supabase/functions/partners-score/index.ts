import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

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
}

async function validateApiKey(supabase: any, apiKey: string): Promise<{ valid: boolean; userId?: string; keyId?: string; permissions?: string[] }> {
  if (!apiKey || !apiKey.startsWith('wk_')) {
    return { valid: false }
  }

  // Hash the API key for lookup
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

  if (error || !keyData) {
    return { valid: false }
  }

  if (!keyData.is_active) {
    return { valid: false }
  }

  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    return { valid: false }
  }

  // Update last used
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyData.id)

  return {
    valid: true,
    userId: keyData.user_id,
    keyId: keyData.id,
    permissions: keyData.permissions || ['score']
  }
}

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
  await supabase.from('api_calls').insert({
    api_key_id: params.apiKeyId,
    user_id: params.userId,
    endpoint: params.endpoint,
    method: params.method,
    status_code: params.statusCode,
    request_body: params.requestBody,
    response_body: params.responseBody,
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
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret,
          'X-Event-Type': eventType
        },
        body: JSON.stringify(payload)
      })

      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload,
        status_code: response.status,
        delivered_at: new Date().toISOString()
      })

      await supabase
        .from('webhooks')
        .update({ last_triggered_at: new Date().toISOString(), failure_count: 0 })
        .eq('id', webhook.id)
    } catch (error) {
      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload,
        status_code: 0,
        response_body: (error as Error).message
      })

      await supabase
        .from('webhooks')
        .update({ failure_count: webhook.failure_count + 1 })
        .eq('id', webhook.id)
    }
  }
}

function calculateScore(input: ScoreRequest): { score: number; riskCategory: string; confidence: number; featureImportance: Record<string, number> } {
  const features: Record<string, number> = {}
  
  // Income ratio
  if (input.monthly_income && input.monthly_expenses) {
    features.income_ratio = Math.min(input.monthly_income / Math.max(input.monthly_expenses, 1), 3) / 3
  } else {
    features.income_ratio = 0.5
  }
  
  // Payment history
  const totalPayments = (input.utility_payments_on_time || 0) + (input.utility_payments_late || 0)
  features.payment_history = totalPayments > 0 
    ? (input.utility_payments_on_time || 0) / totalPayments 
    : 0.5
  
  // Mobile money activity
  features.mobile_money_activity = Math.min((input.mobile_money_transactions || 0) / 100, 1)
  
  // SIM stability
  features.sim_stability = Math.min((input.sim_age_months || 0) / 60, 1)
  
  // Employment stability
  const employmentScores: Record<string, number> = {
    'fonctionnaire': 1.0,
    'salarie_prive': 0.85,
    'entrepreneur': 0.75,
    'commercant': 0.7,
    'agriculteur': 0.65,
    'informel': 0.5,
    'sans_emploi': 0.2
  }
  features.employment_stability = employmentScores[input.employment_type || ''] || 0.5
  
  // Business formalization
  features.business_formalization = input.rccm_number ? 1 : 0.3
  
  // Loan burden
  const loanRatio = input.monthly_income 
    ? (input.existing_loans || 0) / input.monthly_income 
    : 0.5
  features.loan_burden = Math.max(1 - loanRatio, 0)

  // Calculate weighted score
  const weights = {
    income_ratio: 0.25,
    payment_history: 0.20,
    mobile_money_activity: 0.15,
    sim_stability: 0.10,
    employment_stability: 0.15,
    business_formalization: 0.10,
    loan_burden: 0.05
  }

  let weightedSum = 0
  const featureImportance: Record<string, number> = {}
  
  for (const [feature, weight] of Object.entries(weights)) {
    const value = features[feature] || 0.5
    const contribution = value * weight
    weightedSum += contribution
    featureImportance[feature] = Math.round(contribution * 100)
  }

  // Scale to 0-100 range
  const score = Math.round(weightedSum * 100)
  
  let riskCategory = 'very_poor'
  if (score >= 80) riskCategory = 'excellent'
  else if (score >= 70) riskCategory = 'good'
  else if (score >= 50) riskCategory = 'fair'
  else if (score >= 30) riskCategory = 'poor'

  // Calculate confidence based on data completeness
  const dataPoints = [
    input.monthly_income,
    input.monthly_expenses,
    input.mobile_money_transactions,
    input.sim_age_months,
    input.employment_type,
    input.utility_payments_on_time
  ].filter(Boolean).length
  const confidence = Math.round((dataPoints / 6) * 100)

  return { score, riskCategory, confidence, featureImportance }
}

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

  // Validate API key
  const keyValidation = await validateApiKey(supabase, apiKey || '')
  
  if (!keyValidation.valid) {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid or expired API key',
        code: 'INVALID_API_KEY'
      }),
      { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  if (!keyValidation.permissions?.includes('score')) {
    return new Response(
      JSON.stringify({ 
        error: 'API key does not have permission for score endpoint',
        code: 'INSUFFICIENT_PERMISSIONS'
      }),
      { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    const body: ScoreRequest = await req.json()
    
    // Calculate score
    const { score, riskCategory, confidence, featureImportance } = calculateScore(body)
    
    const response = {
      success: true,
      data: {
        score,
        risk_category: riskCategory,
        confidence,
        feature_importance: featureImportance,
        model_version: '1.0.0',
        calculated_at: new Date().toISOString()
      }
    }

    const processingTime = Date.now() - startTime

    // Log API call
    await logApiCall(supabase, {
      apiKeyId: keyValidation.keyId!,
      userId: keyValidation.userId!,
      endpoint: '/partners/score',
      method: 'POST',
      statusCode: 200,
      requestBody: body,
      responseBody: response,
      processingTimeMs: processingTime,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined
    })

    // Trigger webhooks
    await triggerWebhooks(supabase, keyValidation.userId!, 'score.calculated', {
      score,
      risk_category: riskCategory,
      confidence,
      calculated_at: response.data.calculated_at
    })

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Processing-Time': `${processingTime}ms`
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
      JSON.stringify({ 
        error: 'Invalid request body',
        details: (error as Error).message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
