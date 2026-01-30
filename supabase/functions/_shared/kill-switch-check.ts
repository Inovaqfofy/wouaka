import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface KillSwitchStatus {
  allowed: boolean
  reason?: string
  message?: string
  is_read_only?: boolean
}

/**
 * Check if a feature is allowed to execute based on kill switch settings.
 * Call this at the beginning of critical edge functions.
 */
export async function checkKillSwitch(
  featureName: string,
  supabaseUrl?: string,
  supabaseServiceKey?: string
): Promise<KillSwitchStatus> {
  const url = supabaseUrl || Deno.env.get('SUPABASE_URL')!
  const key = supabaseServiceKey || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(url, key)

  try {
    // Check global lockdown state first
    const { data: lockdown, error: lockdownError } = await supabase
      .from('system_lockdown_state')
      .select('is_full_lockdown, is_read_only_mode, lockdown_message')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()

    if (lockdownError) {
      console.warn('[Kill Switch] Could not check lockdown state:', lockdownError.message)
      // Fail open - allow if we can't check (to avoid breaking everything)
      return { allowed: true }
    }

    // Full lockdown blocks everything
    if (lockdown?.is_full_lockdown) {
      return {
        allowed: false,
        reason: 'full_lockdown',
        message: lockdown.lockdown_message || 'Service temporairement suspendu pour maintenance de sécurité.',
        is_read_only: false
      }
    }

    // Read-only mode blocks write operations
    const writeFeatures = [
      'external_api_scoring',
      'kyc_processing', 
      'momo_sms_extraction',
      'new_user_registration',
      'payment_processing'
    ]

    if (lockdown?.is_read_only_mode && writeFeatures.includes(featureName)) {
      return {
        allowed: false,
        reason: 'read_only_mode',
        message: lockdown.lockdown_message || 'Mode lecture seule activé. Aucune nouvelle donnée ne peut être traitée.',
        is_read_only: true
      }
    }

    // Check specific feature status
    const { data: feature, error: featureError } = await supabase
      .from('system_security_controls')
      .select('is_active, emergency_message')
      .eq('feature_name', featureName)
      .single()

    if (featureError) {
      console.warn('[Kill Switch] Feature not found:', featureName)
      // Unknown features are allowed by default
      return { allowed: true }
    }

    if (!feature.is_active) {
      return {
        allowed: false,
        reason: 'feature_disabled',
        message: feature.emergency_message || 'Fonctionnalité temporairement désactivée.',
        is_read_only: lockdown?.is_read_only_mode || false
      }
    }

    return { 
      allowed: true,
      is_read_only: lockdown?.is_read_only_mode || false
    }

  } catch (error) {
    console.error('[Kill Switch] Error checking status:', error)
    // Fail open to avoid breaking critical services
    return { allowed: true }
  }
}

/**
 * Create a 503 response for blocked features
 */
/**
 * Log a blocked request to the database for monitoring
 */
export async function logBlockedRequest(
  featureName: string,
  blockReason: string,
  errorMessage: string,
  req: Request,
  supabaseUrl?: string,
  supabaseServiceKey?: string
): Promise<void> {
  const url = supabaseUrl || Deno.env.get('SUPABASE_URL')!
  const key = supabaseServiceKey || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(url, key)

  try {
    const apiKeyHeader = req.headers.get('x-api-key') || ''
    const apiKeyPrefix = apiKeyHeader.startsWith('wk_') ? apiKeyHeader.slice(0, 12) : null

    await supabase.from('blocked_requests').insert({
      feature_name: featureName,
      endpoint: new URL(req.url).pathname,
      method: req.method,
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('cf-connecting-ip') || null,
      user_agent: req.headers.get('user-agent'),
      api_key_prefix: apiKeyPrefix,
      block_reason: blockReason,
      error_message: errorMessage,
      request_metadata: {
        origin: req.headers.get('origin'),
        referer: req.headers.get('referer')
      }
    })
  } catch (error) {
    console.error('[Kill Switch] Failed to log blocked request:', error)
  }
}

export function createBlockedResponse(
  status: KillSwitchStatus,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Service Temporarily Restricted',
      code: 'SERVICE_BLOCKED',
      reason: status.reason,
      message: status.message,
      is_read_only: status.is_read_only,
      retry_after: 300 // 5 minutes suggested retry
    }),
    {
      status: 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': '300'
      }
    }
  )
}