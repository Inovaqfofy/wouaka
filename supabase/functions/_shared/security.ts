/**
 * WOUAKA Shared Security Module
 * ================================
 * Provides: Rate Limiting, Input Validation, PII Redaction,
 * SSRF Protection, HMAC Webhook Signatures
 */

// ============================================
// 1. RATE LIMITING
// ============================================

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  limit: number
}

export async function checkRateLimit(
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
    console.error('[RATE LIMIT] Error checking:', error)
    // SECURITY: Fail closed - deny requests when rate limit check fails to prevent abuse
    return { 
      allowed: false, 
      remaining: 0, 
      resetAt: new Date(Date.now() + windowMinutes * 60 * 1000), 
      limit 
    }
  }
  
  const currentCount = count || 0
  const remaining = Math.max(0, limit - currentCount)
  const resetAt = new Date(Date.now() + windowMinutes * 60 * 1000)
  
  return {
    allowed: currentCount < limit,
    remaining,
    resetAt,
    limit
  }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  }
}

// ============================================
// 2. INPUT VALIDATION
// ============================================

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

export function validateScoreInput(input: any): ValidationResult {
  const errors: ValidationError[] = []
  const sanitized: Record<string, any> = {}
  
  // Required fields validation
  if (!input || typeof input !== 'object') {
    errors.push({ field: 'body', message: 'Request body must be a valid JSON object', code: 'INVALID_BODY' })
    return { valid: false, errors, sanitized }
  }
  
  // Name validation
  if (input.full_name !== undefined) {
    if (typeof input.full_name !== 'string') {
      errors.push({ field: 'full_name', message: 'Full name must be a string', code: 'INVALID_TYPE' })
    } else if (input.full_name.trim().length < 2) {
      errors.push({ field: 'full_name', message: 'Full name must have at least 2 characters', code: 'TOO_SHORT' })
    } else if (input.full_name.length > 200) {
      errors.push({ field: 'full_name', message: 'Full name must not exceed 200 characters', code: 'TOO_LONG' })
    } else {
      sanitized.full_name = input.full_name.trim()
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
  
  // Phone number validation
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
  
  // Numeric fields validation (must be non-negative)
  const numericFields = [
    'monthly_income', 'monthly_expenses', 'existing_loans',
    'mobile_money_volume', 'mobile_money_transactions', 'sim_age_months',
    'years_in_business', 'utility_payments_on_time', 'utility_payments_late',
    'tontine_participation', 'professional_references'
  ]
  
  for (const field of numericFields) {
    if (input[field] !== undefined) {
      const value = Number(input[field])
      if (isNaN(value)) {
        errors.push({ field, message: `${field} must be a number`, code: 'INVALID_TYPE' })
      } else if (value < 0) {
        errors.push({ field, message: `${field} cannot be negative`, code: 'NEGATIVE_VALUE' })
      } else if (!isFinite(value)) {
        errors.push({ field, message: `${field} must be a finite number`, code: 'INVALID_VALUE' })
      } else {
        sanitized[field] = value
      }
    }
  }
  
  // String fields (employment_type, sector, region, city)
  const stringFields = ['employment_type', 'sector', 'region', 'city', 'company_name', 'rccm_number']
  for (const field of stringFields) {
    if (input[field] !== undefined) {
      if (typeof input[field] !== 'string') {
        errors.push({ field, message: `${field} must be a string`, code: 'INVALID_TYPE' })
      } else {
        sanitized[field] = input[field].trim()
      }
    }
  }
  
  return { valid: errors.length === 0, errors, sanitized }
}

export function validateKycInput(input: any): ValidationResult {
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

// ============================================
// 3. PII REDACTION
// ============================================

export function redactPII(data: any, fieldsToRedact: string[] = [
  'national_id', 'phone_number', 'full_name', 'email', 
  'address', 'document_number', 'date_of_birth'
]): any {
  if (!data) return data
  
  if (typeof data === 'string') {
    return data
  }
  
  if (Array.isArray(data)) {
    return data.map(item => redactPII(item, fieldsToRedact))
  }
  
  if (typeof data === 'object') {
    const redacted: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(data)) {
      if (fieldsToRedact.includes(key.toLowerCase())) {
        if (typeof value === 'string') {
          if (value.length <= 4) {
            redacted[key] = '***REDACTED***'
          } else {
            // Keep first 2 and last 2 characters
            redacted[key] = value.slice(0, 2) + '***' + value.slice(-2)
          }
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
// 4. SSRF PROTECTION
// ============================================

const BLOCKED_IP_PATTERNS = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private class A
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // Private class B
  /^192\.168\./,               // Private class C
  /^169\.254\./,               // Link-local
  /^0\./,                      // Invalid
  /^fc00:/i,                   // IPv6 private
  /^fe80:/i,                   // IPv6 link-local
  /^::1$/,                     // IPv6 loopback
  /^localhost$/i,              // Localhost hostname
]

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254',           // AWS/GCP metadata
  'metadata.google.internal',   // GCP metadata
  'metadata',                   // Azure metadata
]

export function validateWebhookUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString)
    
    // Only HTTPS allowed
    if (url.protocol !== 'https:') {
      return { valid: false, error: 'Webhook URL must use HTTPS protocol' }
    }
    
    // Check blocked hosts
    const hostname = url.hostname.toLowerCase()
    if (BLOCKED_HOSTS.includes(hostname)) {
      return { valid: false, error: 'Webhook URL points to a blocked host' }
    }
    
    // Check IP patterns
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Webhook URL points to a private or reserved IP address' }
      }
    }
    
    // Check for suspicious ports
    if (url.port && !['443', '8443'].includes(url.port)) {
      return { valid: false, error: 'Webhook URL uses a non-standard port' }
    }
    
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}

// ============================================
// 5. HMAC WEBHOOK SIGNATURE
// ============================================

export async function generateWebhookSignature(
  payload: string,
  secret: string,
  timestamp: number
): Promise<string> {
  const encoder = new TextEncoder()
  const signatureData = `${timestamp}.${payload}`
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signatureData))
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return `v1=${signatureHex}`
}

export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: number,
  toleranceSeconds: number = 300
): Promise<boolean> {
  // Check timestamp freshness (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return false
  }
  
  const expectedSignature = await generateWebhookSignature(payload, secret, timestamp)
  return signature === expectedSignature
}

export async function createWebhookDeliveryHeaders(
  payload: string,
  secret: string,
  eventType: string
): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await generateWebhookSignature(payload, secret, timestamp)
  
  return {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature,
    'X-Webhook-Timestamp': timestamp.toString(),
    'X-Event-Type': eventType
  }
}

// ============================================
// 6. ERROR RESPONSES (OBFUSCATED)
// ============================================

/**
 * SECURITY: Obfuscated error messages to prevent algorithm probing
 * Internal codes are mapped to generic user-facing messages
 */
const OBFUSCATED_ERRORS: Record<string, string> = {
  'INCOME_TOO_LOW': 'Critères de certification non atteints',
  'DEBT_RATIO_EXCEEDED': 'Critères de certification non atteints',
  'INSUFFICIENT_HISTORY': 'Critères de certification non atteints',
  'LOW_STABILITY_SCORE': 'Critères de certification non atteints',
  'FAILED_IDENTITY_CHECK': 'Vérification requise',
  'SUSPICIOUS_PATTERN': 'Vérification requise',
  'VELOCITY_BREACH': 'Requête temporairement indisponible',
  'IP_BANNED': 'Accès refusé',
  'BOT_DETECTED': 'Accès refusé',
  'EMULATOR_DETECTED': 'Appareil non compatible',
}

export function obfuscateErrorMessage(internalCode: string, isProduction: boolean = true): string {
  if (!isProduction) {
    return internalCode // Show real errors in dev
  }
  return OBFUSCATED_ERRORS[internalCode] || 'Une erreur est survenue'
}

export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: any,
  corsHeaders: Record<string, string> = {},
  obfuscate: boolean = true
): Response {
  // Obfuscate sensitive error codes in production
  const safeMessage = obfuscate ? obfuscateErrorMessage(code) || message : message
  const safeCode = obfuscate ? 'REQUEST_FAILED' : code
  
  return new Response(
    JSON.stringify({
      success: false,
      error: { 
        code: safeCode, 
        message: safeMessage,
        // Only include details in non-production or if not sensitive
        ...(obfuscate ? {} : { details })
      }
    }),
    { 
      status, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  )
}

export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please retry after the reset time.',
        reset_at: result.resetAt.toISOString(),
        limit: result.limit
      }
    }),
    { 
      status: 429, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        ...rateLimitHeaders(result),
        'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString()
      } 
    }
  )
}

export function createValidationErrorResponse(
  errors: ValidationError[],
  corsHeaders: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors
      }
    }),
    { 
      status: 400, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  )
}

// ============================================
// 7. IP & BOT DETECTION
// ============================================

/**
 * Check if IP is blacklisted
 */
export async function isIPBlacklisted(
  supabase: any,
  ipAddress: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('blacklisted_ips')
    .select('id')
    .eq('ip_address', ipAddress)
    .eq('is_active', true)
    .or('banned_until.is.null,banned_until.gt.now()')
    .limit(1)
  
  if (error) {
    console.error('[SECURITY] IP check error:', error)
    return false // Fail open
  }
  
  return data && data.length > 0
}

/**
 * Detect automated browser User-Agents
 */
export function detectBotUserAgent(userAgent: string | null): {
  isBot: boolean
  botType?: string
  confidence: number
} {
  if (!userAgent) {
    return { isBot: true, botType: 'missing_ua', confidence: 60 }
  }
  
  const ua = userAgent.toLowerCase()
  
  // High confidence bot patterns
  const highConfidenceBots = [
    { pattern: /puppeteer/i, type: 'puppeteer' },
    { pattern: /headless/i, type: 'headless_browser' },
    { pattern: /phantomjs/i, type: 'phantomjs' },
    { pattern: /selenium/i, type: 'selenium' },
    { pattern: /webdriver/i, type: 'webdriver' },
    { pattern: /chrome-lighthouse/i, type: 'lighthouse' },
  ]
  
  for (const bot of highConfidenceBots) {
    if (bot.pattern.test(ua)) {
      return { isBot: true, botType: bot.type, confidence: 95 }
    }
  }
  
  // Medium confidence bot patterns (legitimate scrapers/bots)
  const mediumConfidenceBots = [
    { pattern: /googlebot/i, type: 'googlebot' },
    { pattern: /bingbot/i, type: 'bingbot' },
    { pattern: /yandexbot/i, type: 'yandexbot' },
    { pattern: /baiduspider/i, type: 'baiduspider' },
    { pattern: /facebookexternalhit/i, type: 'facebook' },
    { pattern: /twitterbot/i, type: 'twitter' },
    { pattern: /linkedinbot/i, type: 'linkedin' },
    { pattern: /slackbot/i, type: 'slack' },
  ]
  
  for (const bot of mediumConfidenceBots) {
    if (bot.pattern.test(ua)) {
      return { isBot: true, botType: bot.type, confidence: 80 }
    }
  }
  
  // Scripting libraries (could be legitimate API calls)
  const scriptingPatterns = [
    { pattern: /python-requests/i, type: 'python_requests' },
    { pattern: /axios/i, type: 'axios' },
    { pattern: /node-fetch/i, type: 'node_fetch' },
    { pattern: /curl/i, type: 'curl' },
    { pattern: /wget/i, type: 'wget' },
    { pattern: /scrapy/i, type: 'scrapy' },
    { pattern: /httpie/i, type: 'httpie' },
  ]
  
  for (const script of scriptingPatterns) {
    if (script.pattern.test(ua)) {
      return { isBot: true, botType: script.type, confidence: 70 }
    }
  }
  
  // Check for suspicious patterns
  if (ua.length < 20) {
    return { isBot: true, botType: 'short_ua', confidence: 50 }
  }
  
  return { isBot: false, confidence: 0 }
}

/**
 * Log security event and optionally ban IP
 */
export async function logSecurityEvent(
  supabase: any,
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: {
    ip?: string
    userAgent?: string
    userId?: string
    apiKeyId?: string
    endpoint?: string
    payload?: any
  },
  banIP: boolean = false,
  banDurationHours: number = 24
): Promise<void> {
  try {
    // Log the security alert
    await supabase.from('security_alerts').insert({
      alert_type: eventType,
      severity,
      source_ip: details.ip,
      user_agent: details.userAgent,
      user_id: details.userId,
      api_key_id: details.apiKeyId,
      endpoint: details.endpoint,
      payload: details.payload,
      action_taken: banIP ? 'ip_banned' : 'logged'
    })
    
    // Ban IP if requested
    if (banIP && details.ip) {
      await supabase.from('blacklisted_ips').insert({
        ip_address: details.ip,
        reason: `Auto-banned: ${eventType}`,
        banned_until: banDurationHours 
          ? new Date(Date.now() + banDurationHours * 60 * 60 * 1000).toISOString()
          : null,
        banned_by: 'system',
        trigger_endpoint: details.endpoint,
        trigger_details: { event_type: eventType, severity }
      })
    }
  } catch (error) {
    console.error('[SECURITY] Failed to log event:', error)
  }
}
