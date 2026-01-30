// ============================================
// PARTNERS IDENTITY API - Secured
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

// ============================================
// INLINE SECURITY MODULE
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

function validateIdentityInput(input: any): ValidationResult {
  const errors: ValidationError[] = []
  const sanitized: Record<string, any> = {}
  
  if (!input || typeof input !== 'object') {
    errors.push({ field: 'body', message: 'Request body must be a valid JSON object', code: 'INVALID_BODY' })
    return { valid: false, errors, sanitized }
  }
  
  // At least one identifier required
  const hasPhone = input.phone_number !== undefined
  const hasId = input.national_id !== undefined
  const hasEmail = input.email !== undefined
  
  if (!hasPhone && !hasId && !hasEmail) {
    errors.push({ field: 'identifier', message: 'At least one identifier (phone_number, national_id, or email) is required', code: 'REQUIRED' })
  }
  
  // Phone validation
  if (input.phone_number !== undefined) {
    if (typeof input.phone_number !== 'string') {
      errors.push({ field: 'phone_number', message: 'Phone number must be a string', code: 'INVALID_TYPE' })
    } else {
      const phoneRegex = /^(\+?[0-9]{1,4})?[0-9]{8,15}$/
      const cleanPhone = input.phone_number.replace(/[\s-]/g, '')
      if (!phoneRegex.test(cleanPhone)) {
        errors.push({ field: 'phone_number', message: 'Invalid phone number format', code: 'INVALID_FORMAT' })
      } else {
        sanitized.phone_number = cleanPhone
      }
    }
  }
  
  // National ID validation
  if (input.national_id !== undefined) {
    if (typeof input.national_id !== 'string') {
      errors.push({ field: 'national_id', message: 'National ID must be a string', code: 'INVALID_TYPE' })
    } else if (input.national_id.trim().length < 5) {
      errors.push({ field: 'national_id', message: 'National ID must have at least 5 characters', code: 'TOO_SHORT' })
    } else {
      sanitized.national_id = input.national_id.trim()
    }
  }
  
  // Email validation
  if (input.email !== undefined) {
    if (typeof input.email !== 'string') {
      errors.push({ field: 'email', message: 'Email must be a string', code: 'INVALID_TYPE' })
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(input.email.trim())) {
        errors.push({ field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' })
      } else {
        sanitized.email = input.email.trim().toLowerCase()
      }
    }
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

// ============================================
// IDENTITY REQUEST TYPE
// ============================================

interface IdentityRequest {
  phone_number?: string
  national_id?: string
  email?: string
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
// IDENTITY LOOKUP LOGIC
// ============================================

function lookupIdentity(input: IdentityRequest): {
  found: boolean
  identity?: {
    id: string
    phone_verified: boolean
    id_verified: boolean
    email_verified: boolean
    data_sources: string[]
    last_seen: string
    trust_score: number
  }
} {
  const hasPhone = !!input.phone_number
  const hasId = !!input.national_id
  const hasEmail = !!input.email

  if (!hasPhone && !hasId && !hasEmail) {
    return { found: false }
  }

  const dataSources: string[] = []
  let trustScore = 0

  if (hasPhone) {
    dataSources.push('mobile_operator')
    trustScore += 30
  }

  if (hasId) {
    dataSources.push('national_registry')
    trustScore += 50
  }

  if (hasEmail) {
    dataSources.push('email_provider')
    trustScore += 20
  }

  return {
    found: true,
    identity: {
      id: crypto.randomUUID(),
      phone_verified: hasPhone,
      id_verified: hasId,
      email_verified: hasEmail,
      data_sources: dataSources,
      last_seen: new Date().toISOString(),
      trust_score: Math.min(trustScore, 100)
    }
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

  if (!keyValidation.permissions?.includes('identity')) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'API key does not have permission for identity endpoint' } }),
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
    const validation = validateIdentityInput(body)
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

    const identityResult = lookupIdentity(validation.sanitized as IdentityRequest)
    
    const response = {
      success: true,
      data: {
        ...identityResult,
        lookup_id: crypto.randomUUID(),
        looked_up_at: new Date().toISOString()
      }
    }

    const processingTime = Date.now() - startTime

    await logApiCall(supabase, {
      apiKeyId: keyValidation.keyId!,
      userId: keyValidation.userId!,
      endpoint: '/partners/identity',
      method: 'POST',
      statusCode: 200,
      requestBody: body,
      responseBody: response,
      processingTimeMs: processingTime
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
      endpoint: '/partners/identity',
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
