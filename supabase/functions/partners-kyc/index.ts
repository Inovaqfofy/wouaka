import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface KycRequest {
  national_id: string
  full_name: string
  date_of_birth?: string
  phone_number?: string
  address?: string
  document_type?: 'cni' | 'passport' | 'carte_sejour'
  document_number?: string
}

async function validateApiKey(supabase: any, apiKey: string): Promise<{ valid: boolean; userId?: string; keyId?: string; permissions?: string[] }> {
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
    .select('id, user_id, permissions, is_active, expires_at')
    .eq('key_hash', keyHash)
    .single()

  if (error || !keyData || !keyData.is_active) {
    return { valid: false }
  }

  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    return { valid: false }
  }

  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyData.id)

  return {
    valid: true,
    userId: keyData.user_id,
    keyId: keyData.id,
    permissions: keyData.permissions || []
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
}) {
  await supabase.from('api_calls').insert({
    api_key_id: params.apiKeyId,
    user_id: params.userId,
    endpoint: params.endpoint,
    method: params.method,
    status_code: params.statusCode,
    request_body: params.requestBody,
    response_body: params.responseBody,
    processing_time_ms: params.processingTimeMs
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
    } catch (error) {
      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload,
        status_code: 0,
        response_body: (error as Error).message
      })
    }
  }
}

function performKycCheck(input: KycRequest): { 
  verified: boolean
  status: 'verified' | 'pending' | 'failed' | 'requires_review'
  checks: Record<string, { passed: boolean; message: string }>
  risk_flags: string[]
} {
  const checks: Record<string, { passed: boolean; message: string }> = {}
  const riskFlags: string[] = []

  // ID format validation
  const idValid = !!(input.national_id && input.national_id.length >= 8)
  checks.id_format = {
    passed: idValid,
    message: idValid ? 'ID format is valid' : 'Invalid ID format'
  }

  // Name validation
  const nameValid = !!(input.full_name && input.full_name.trim().split(' ').length >= 2)
  checks.name_format = {
    passed: nameValid,
    message: nameValid ? 'Name format is valid' : 'Full name must include first and last name'
  }

  // Phone validation (CEMAC/UEMOA format)
  const phoneValid = !input.phone_number || /^(\+?2[0-9]{2}|0)[0-9]{8,9}$/.test(input.phone_number)
  checks.phone_format = {
    passed: phoneValid,
    message: phoneValid ? 'Phone format is valid' : 'Invalid phone number format'
  }

  // Document validation
  if (input.document_type && input.document_number) {
    const docValid = input.document_number.length >= 6
    checks.document = {
      passed: docValid,
      message: docValid ? 'Document validated' : 'Invalid document number'
    }
  }

  // Age verification (simulated)
  if (input.date_of_birth) {
    const birthDate = new Date(input.date_of_birth)
    const age = (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    const ageValid = age >= 18 && age <= 100
    checks.age_verification = {
      passed: ageValid,
      message: ageValid ? 'Age verified (18+)' : 'Must be 18 years or older'
    }
    if (!ageValid) riskFlags.push('UNDERAGE_OR_INVALID_DOB')
  }

  // Calculate overall status
  const allPassed = Object.values(checks).every(c => c.passed)
  const anyFailed = Object.values(checks).some(c => !c.passed)

  let status: 'verified' | 'pending' | 'failed' | 'requires_review' = 'pending'
  if (allPassed && riskFlags.length === 0) {
    status = 'verified'
  } else if (anyFailed) {
    status = riskFlags.length > 0 ? 'failed' : 'requires_review'
  }

  return {
    verified: status === 'verified',
    status,
    checks,
    risk_flags: riskFlags
  }
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

  const keyValidation = await validateApiKey(supabase, apiKey || '')
  
  if (!keyValidation.valid) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired API key', code: 'INVALID_API_KEY' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!keyValidation.permissions?.includes('kyc')) {
    return new Response(
      JSON.stringify({ error: 'API key does not have permission for KYC endpoint', code: 'INSUFFICIENT_PERMISSIONS' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body: KycRequest = await req.json()
    
    if (!body.national_id || !body.full_name) {
      return new Response(
        JSON.stringify({ error: 'national_id and full_name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const kycResult = performKycCheck(body)
    
    const response = {
      success: true,
      data: {
        ...kycResult,
        kyc_id: crypto.randomUUID(),
        checked_at: new Date().toISOString()
      }
    }

    const processingTime = Date.now() - startTime

    await logApiCall(supabase, {
      apiKeyId: keyValidation.keyId!,
      userId: keyValidation.userId!,
      endpoint: '/partners/kyc',
      method: 'POST',
      statusCode: 200,
      requestBody: { ...body, national_id: '***REDACTED***' },
      responseBody: response,
      processingTimeMs: processingTime
    })

    // Trigger webhook based on KYC status
    const eventType = kycResult.verified ? 'kyc.verified' : 'kyc.failed'
    await triggerWebhooks(supabase, keyValidation.userId!, eventType, {
      kyc_id: response.data.kyc_id,
      status: kycResult.status,
      checked_at: response.data.checked_at
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
      endpoint: '/partners/kyc',
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
