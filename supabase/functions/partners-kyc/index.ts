// ============================================
// PARTNERS KYC API - Secured
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

// ============================================
// INLINE SECURITY MODULE (shared logic)
// ============================================

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  limit: number
}

async function checkRateLimit(
  supabase: any,
  apiKeyId: string,
  limit: number = 1000,
  windowMinutes: number = 60
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000)
  
  const { count, error } = await supabase
    .from('api_calls')
    .select('*', { count: 'exact', head: true })
    .eq('api_key_id', apiKeyId)
    .gte('created_at', windowStart.toISOString())
  
  if (error) {
    console.error('[RATE LIMIT] Error:', error)
    return { allowed: true, remaining: limit, resetAt: new Date(Date.now() + windowMinutes * 60 * 1000), limit }
  }
  
  const currentCount = count || 0
  const remaining = Math.max(0, limit - currentCount)
  
  return {
    allowed: currentCount < limit,
    remaining,
    resetAt: new Date(Date.now() + windowMinutes * 60 * 1000),
    limit
  }
}

function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  }
}

interface ValidationError {
  field: string
  message: string
  code: string
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  sanitized: Record<string, any>
}

function validateKycInput(input: any): ValidationResult {
  const errors: ValidationError[] = []
  const sanitized: Record<string, any> = {}
  
  if (!input || typeof input !== 'object') {
    errors.push({ field: 'body', message: 'Request body must be a valid JSON object', code: 'INVALID_BODY' })
    return { valid: false, errors, sanitized }
  }
  
  // Required fields
  if (!input.national_id || typeof input.national_id !== 'string' || input.national_id.trim().length < 5) {
    errors.push({ field: 'national_id', message: 'national_id is required and must have at least 5 characters', code: 'REQUIRED' })
  } else {
    sanitized.national_id = input.national_id.trim()
  }
  
  if (!input.full_name || typeof input.full_name !== 'string' || input.full_name.trim().length < 2) {
    errors.push({ field: 'full_name', message: 'full_name is required and must have at least 2 characters', code: 'REQUIRED' })
  } else {
    sanitized.full_name = input.full_name.trim()
  }
  
  // Optional fields
  if (input.date_of_birth !== undefined) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(input.date_of_birth)) {
      errors.push({ field: 'date_of_birth', message: 'date_of_birth must be in YYYY-MM-DD format', code: 'INVALID_FORMAT' })
    } else {
      const date = new Date(input.date_of_birth)
      if (isNaN(date.getTime())) {
        errors.push({ field: 'date_of_birth', message: 'Invalid date', code: 'INVALID_DATE' })
      } else {
        sanitized.date_of_birth = input.date_of_birth
      }
    }
  }
  
  if (input.phone_number !== undefined) {
    const phoneRegex = /^(\+?[0-9]{1,4})?[0-9]{8,15}$/
    const cleanPhone = String(input.phone_number).replace(/[\s-]/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      errors.push({ field: 'phone_number', message: 'Invalid phone number format', code: 'INVALID_FORMAT' })
    } else {
      sanitized.phone_number = cleanPhone
    }
  }
  
  if (input.document_type !== undefined) {
    const validTypes = ['cni', 'passport', 'carte_sejour']
    if (!validTypes.includes(input.document_type)) {
      errors.push({ field: 'document_type', message: `document_type must be one of: ${validTypes.join(', ')}`, code: 'INVALID_ENUM' })
    } else {
      sanitized.document_type = input.document_type
    }
  }
  
  if (input.address !== undefined) {
    sanitized.address = String(input.address).trim()
  }
  
  if (input.document_number !== undefined) {
    sanitized.document_number = String(input.document_number).trim()
  }
  
  return { valid: errors.length === 0, errors, sanitized }
}

function redactPII(data: any, fieldsToRedact: string[] = [
  'national_id', 'phone_number', 'full_name', 'email', 
  'address', 'document_number', 'date_of_birth'
]): any {
  if (!data) return data
  if (typeof data === 'string') return data
  if (Array.isArray(data)) return data.map(item => redactPII(item, fieldsToRedact))
  
  if (typeof data === 'object') {
    const redacted: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      if (fieldsToRedact.includes(key.toLowerCase())) {
        if (typeof value === 'string' && value.length > 4) {
          redacted[key] = value.slice(0, 2) + '***' + value.slice(-2)
        } else {
          redacted[key] = '***REDACTED***'
        }
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = redactPII(value, fieldsToRedact)
      } else {
        redacted[key] = value
      }
    }
    return redacted
  }
  return data
}

const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', 'metadata.google.internal']

function validateWebhookUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString)
    if (url.protocol !== 'https:') return { valid: false, error: 'HTTPS required' }
    if (BLOCKED_HOSTS.includes(url.hostname.toLowerCase())) return { valid: false, error: 'Blocked host' }
    if (/^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(url.hostname)) {
      return { valid: false, error: 'Private IP not allowed' }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL' }
  }
}

async function generateWebhookSignature(payload: string, secret: string, timestamp: number): Promise<string> {
  const encoder = new TextEncoder()
  const signatureData = `${timestamp}.${payload}`
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signatureData))
  const signatureHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `v1=${signatureHex}`
}

// ============================================
// KYC REQUEST TYPES
// ============================================

interface KycRequest {
  national_id: string
  full_name: string
  date_of_birth?: string
  phone_number?: string
  address?: string
  document_type?: 'cni' | 'passport' | 'carte_sejour'
  document_number?: string
}

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
    permissions: keyData.permissions || [],
    rateLimit: keyData.rate_limit || 1000
  }
}

// ============================================
// API LOGGING
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
}) {
  await supabase.from('api_calls').insert({
    api_key_id: params.apiKeyId,
    user_id: params.userId,
    endpoint: params.endpoint,
    method: params.method,
    status_code: params.statusCode,
    request_body: redactPII(params.requestBody),
    response_body: params.responseBody,
    processing_time_ms: params.processingTimeMs
  })
}

// ============================================
// WEBHOOK DELIVERY (with HMAC + SSRF protection)
// ============================================

async function triggerWebhooks(supabase: any, userId: string, eventType: string, payload: any) {
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .contains('events', [eventType])

  if (!webhooks || webhooks.length === 0) return

  for (const webhook of webhooks) {
    // SSRF Protection
    const urlValidation = validateWebhookUrl(webhook.url)
    if (!urlValidation.valid) {
      console.error(`[WEBHOOK] SSRF blocked: ${webhook.url} - ${urlValidation.error}`)
      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload,
        status_code: 0,
        response_body: `SSRF blocked: ${urlValidation.error}`
      })
      continue
    }

    try {
      const payloadString = JSON.stringify(payload)
      const timestamp = Math.floor(Date.now() / 1000)
      const signature = await generateWebhookSignature(payloadString, webhook.secret, timestamp)

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': timestamp.toString(),
          'X-Event-Type': eventType
        },
        body: payloadString
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

// ============================================
// KYC CHECK LOGIC
// ============================================

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

  // Age verification
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

  const keyValidation = await validateApiKey(supabase, apiKey || '')
  
  if (!keyValidation.valid) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'INVALID_API_KEY', message: 'Invalid or expired API key' } }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!keyValidation.permissions?.includes('kyc')) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'API key does not have permission for KYC endpoint' } }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Rate limiting using api_keys.rate_limit
  const rateLimit = await checkRateLimit(supabase, keyValidation.keyId!, keyValidation.rateLimit || 1000, 60)
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: { 
          code: 'RATE_LIMIT_EXCEEDED', 
          message: 'Too many requests. Please retry after the reset time.',
          reset_at: rateLimit.resetAt.toISOString()
        } 
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
    const body = await req.json()
    
    // Input validation
    const validation = validateKycInput(body)
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Request validation failed',
            details: validation.errors 
          } 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const kycResult = performKycCheck(validation.sanitized as KycRequest)
    
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
      requestBody: body,
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
          'X-Processing-Time': `${processingTime}ms`,
          ...rateLimitHeaders(rateLimit)
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
      JSON.stringify({ success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid request body', details: (error as Error).message } }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
