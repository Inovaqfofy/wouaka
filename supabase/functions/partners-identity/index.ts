import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface IdentityRequest {
  phone_number?: string
  national_id?: string
  email?: string
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
  // Simulate identity lookup from multiple data sources
  const hasPhone = !!input.phone_number
  const hasId = !!input.national_id
  const hasEmail = !!input.email

  if (!hasPhone && !hasId && !hasEmail) {
    return { found: false }
  }

  // Simulate finding identity in database
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

  if (!keyValidation.permissions?.includes('identity')) {
    return new Response(
      JSON.stringify({ error: 'API key does not have permission for identity endpoint', code: 'INSUFFICIENT_PERMISSIONS' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body: IdentityRequest = await req.json()
    
    if (!body.phone_number && !body.national_id && !body.email) {
      return new Response(
        JSON.stringify({ error: 'At least one identifier (phone_number, national_id, or email) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const identityResult = lookupIdentity(body)
    
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
      requestBody: { 
        phone_number: body.phone_number ? '***REDACTED***' : undefined,
        national_id: body.national_id ? '***REDACTED***' : undefined,
        email: body.email ? '***REDACTED***' : undefined
      },
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
          'X-Processing-Time': `${processingTime}ms`
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
      JSON.stringify({ error: 'Invalid request body', details: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
