import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

// ============================================
// SSRF PROTECTION - Complete validation
// ============================================

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  // AWS metadata endpoints
  '169.254.169.254',
  '169.254.170.2',
  // GCP metadata
  'metadata.google.internal',
  'metadata.goog',
  // Azure metadata
  '169.254.169.254',
  // Kubernetes
  'kubernetes.default',
  'kubernetes.default.svc',
  // Docker
  'host.docker.internal',
  'gateway.docker.internal',
]

const BLOCKED_IP_PATTERNS = [
  /^127\./,                          // Loopback
  /^10\./,                           // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[01])\./,   // Private Class B
  /^192\.168\./,                     // Private Class C
  /^169\.254\./,                     // Link-local
  /^0\./,                            // Current network
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // Carrier-grade NAT
  /^192\.0\.0\./,                    // IETF Protocol
  /^192\.0\.2\./,                    // TEST-NET-1
  /^198\.51\.100\./,                 // TEST-NET-2
  /^203\.0\.113\./,                  // TEST-NET-3
  /^224\./,                          // Multicast
  /^240\./,                          // Reserved
  /^255\./,                          // Broadcast
  /^fc[0-9a-f]{2}:/i,                // IPv6 Unique Local
  /^fd[0-9a-f]{2}:/i,                // IPv6 Unique Local
  /^fe80:/i,                         // IPv6 Link-Local
]

function validateWebhookUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString)
    
    // Only allow HTTPS
    if (url.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTPS URLs are allowed' }
    }
    
    // Block known dangerous hosts
    const hostname = url.hostname.toLowerCase()
    if (BLOCKED_HOSTS.includes(hostname)) {
      return { valid: false, error: 'Blocked host: access to internal services is not allowed' }
    }
    
    // Block metadata endpoints by path
    if (url.pathname.includes('/latest/meta-data') || 
        url.pathname.includes('/metadata/') ||
        url.pathname.includes('/computeMetadata/')) {
      return { valid: false, error: 'Access to cloud metadata endpoints is not allowed' }
    }
    
    // Block private IP ranges
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Private/internal IP addresses are not allowed' }
      }
    }
    
    // Block .local and .internal domains
    if (hostname.endsWith('.local') || 
        hostname.endsWith('.internal') || 
        hostname.endsWith('.localhost')) {
      return { valid: false, error: 'Local/internal domain names are not allowed' }
    }
    
    // Block numeric localhost variations
    if (/^(127|0|10|172\.(1[6-9]|2\d|3[01])|192\.168)\./.test(hostname)) {
      return { valid: false, error: 'Private IP addresses are not allowed' }
    }
    
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}

// ============================================
// TYPES
// ============================================

interface WebhookCreateRequest {
  name: string
  url: string
  events: string[]
}

interface WebhookUpdateRequest {
  name?: string
  url?: string
  events?: string[]
  is_active?: boolean
}

// ============================================
// API KEY VALIDATION
// ============================================

async function validateApiKey(supabase: any, apiKey: string): Promise<{ valid: boolean; userId?: string; keyId?: string; rateLimit?: number }> {
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
    .select('id, user_id, is_active, expires_at, rate_limit')
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
    rateLimit: keyData.rate_limit || 1000
  }
}

// ============================================
// RATE LIMITING
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
  limit: number,
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
    // Fail open - allow request but log the error
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
    request_body: params.requestBody,
    response_body: params.responseBody,
    processing_time_ms: params.processingTimeMs
  })
}

function generateWebhookSecret(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return 'whsec_' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

const VALID_EVENTS = [
  'score.calculated',
  'score.updated',
  'kyc.verified',
  'kyc.failed',
  'kyc.pending',
  'identity.found',
  'identity.not_found',
  'api_key.created',
  'api_key.rotated',
  'api_key.expired',
  // Événements d'abonnement et trial
  'subscription.created',
  'subscription.updated',
  'subscription.canceled',
  'trial.started',
  'trial.expiring',
  'trial.expired'
]

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  const webhookId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null

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

  const userId = keyValidation.userId!
  const keyId = keyValidation.keyId!
  const rateLimit = keyValidation.rateLimit || 1000

  // Rate limiting using api_keys.rate_limit
  const rateLimitResult = await checkRateLimit(supabase, keyId, rateLimit)
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded', 
        code: 'RATE_LIMIT_EXCEEDED',
        reset_at: rateLimitResult.resetAt.toISOString()
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          ...rateLimitHeaders(rateLimitResult),
          'Retry-After': Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000).toString()
        } 
      }
    )
  }

  try {
    let response: any
    let statusCode = 200

    // GET - List webhooks or get specific webhook
    if (req.method === 'GET') {
      if (webhookId && webhookId !== 'partners-webhooks') {
        const { data, error } = await supabase
          .from('webhooks')
          .select('id, name, url, events, is_active, last_triggered_at, failure_count, created_at')
          .eq('id', webhookId)
          .eq('user_id', userId)
          .single()

        if (error || !data) {
          response = { error: 'Webhook not found' }
          statusCode = 404
        } else {
          response = { success: true, data }
        }
      } else {
        const { data, error } = await supabase
          .from('webhooks')
          .select('id, name, url, events, is_active, last_triggered_at, failure_count, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) {
          response = { error: 'Failed to fetch webhooks' }
          statusCode = 500
        } else {
          response = { 
            success: true, 
            data: data || [],
            available_events: VALID_EVENTS
          }
        }
      }
    }

    // POST - Create new webhook
    else if (req.method === 'POST') {
      const body: WebhookCreateRequest = await req.json()

      if (!body.name || !body.url || !body.events || body.events.length === 0) {
        response = { error: 'name, url, and events are required' }
        statusCode = 400
      } else {
        // SSRF Protection - validate URL
        const urlValidation = validateWebhookUrl(body.url)
        if (!urlValidation.valid) {
          response = { 
            error: 'Invalid webhook URL', 
            code: 'SSRF_BLOCKED',
            details: urlValidation.error 
          }
          statusCode = 400
        } else {
          // Validate events
          const invalidEvents = body.events.filter(e => !VALID_EVENTS.includes(e))
          if (invalidEvents.length > 0) {
            response = { 
              error: `Invalid events: ${invalidEvents.join(', ')}`,
              valid_events: VALID_EVENTS 
            }
            statusCode = 400
          }

          if (statusCode === 200) {
            const secret = generateWebhookSecret()

            const { data, error } = await supabase
              .from('webhooks')
              .insert({
                user_id: userId,
                name: body.name,
                url: body.url,
                events: body.events,
                secret
              })
              .select('id, name, url, events, is_active, created_at')
              .single()

            if (error) {
              response = { error: 'Failed to create webhook', details: error.message }
              statusCode = 500
            } else {
              response = { 
                success: true, 
                data: { ...data, secret },
                message: 'Save the secret securely - it will not be shown again'
              }
              statusCode = 201
            }
          }
        }
      }
    }

    // PUT/PATCH - Update webhook
    else if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!webhookId || webhookId === 'partners-webhooks') {
        response = { error: 'Webhook ID is required' }
        statusCode = 400
      } else {
        const body: WebhookUpdateRequest = await req.json()
        
        const updates: any = {}
        if (body.name !== undefined) updates.name = body.name
        if (body.url !== undefined) {
          // SSRF Protection - validate URL on update
          const urlValidation = validateWebhookUrl(body.url)
          if (!urlValidation.valid) {
            response = { 
              error: 'Invalid webhook URL', 
              code: 'SSRF_BLOCKED',
              details: urlValidation.error 
            }
            statusCode = 400
          } else {
            updates.url = body.url
          }
        }
        if (body.events !== undefined && statusCode === 200) {
          const invalidEvents = body.events.filter(e => !VALID_EVENTS.includes(e))
          if (invalidEvents.length > 0) {
            response = { error: `Invalid events: ${invalidEvents.join(', ')}` }
            statusCode = 400
          } else {
            updates.events = body.events
          }
        }
        if (body.is_active !== undefined) updates.is_active = body.is_active

        if (statusCode === 200 && Object.keys(updates).length > 0) {
          const { data, error } = await supabase
            .from('webhooks')
            .update(updates)
            .eq('id', webhookId)
            .eq('user_id', userId)
            .select('id, name, url, events, is_active, last_triggered_at, failure_count, created_at')
            .single()

          if (error || !data) {
            response = { error: 'Webhook not found or update failed' }
            statusCode = 404
          } else {
            response = { success: true, data }
          }
        }
      }
    }

    // DELETE - Delete webhook
    else if (req.method === 'DELETE') {
      if (!webhookId || webhookId === 'partners-webhooks') {
        response = { error: 'Webhook ID is required' }
        statusCode = 400
      } else {
        const { error } = await supabase
          .from('webhooks')
          .delete()
          .eq('id', webhookId)
          .eq('user_id', userId)

        if (error) {
          response = { error: 'Failed to delete webhook' }
          statusCode = 500
        } else {
          response = { success: true, message: 'Webhook deleted' }
        }
      }
    }

    else {
      response = { error: 'Method not allowed' }
      statusCode = 405
    }

    const processingTime = Date.now() - startTime

    await logApiCall(supabase, {
      apiKeyId: keyId,
      userId,
      endpoint: '/partners/webhooks',
      method: req.method,
      statusCode,
      responseBody: response,
      processingTimeMs: processingTime
    })

    return new Response(
      JSON.stringify(response),
      { 
        status: statusCode, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Processing-Time': `${processingTime}ms`,
          ...rateLimitHeaders(rateLimitResult)
        } 
      }
    )
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    await logApiCall(supabase, {
      apiKeyId: keyId,
      userId,
      endpoint: '/partners/webhooks',
      method: req.method,
      statusCode: 500,
      responseBody: { error: (error as Error).message },
      processingTimeMs: processingTime
    })

    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
