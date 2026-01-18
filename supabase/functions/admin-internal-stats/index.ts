/**
 * ============================================
 * HONEY POT EDGE FUNCTION
 * admin-internal-stats
 * ============================================
 * 
 * This function serves as a security trap (honeypot).
 * It appears to contain sensitive internal statistics
 * but is actually designed to detect and log malicious access attempts.
 * 
 * Any access without the secret header triggers:
 * 1. IP ban (24h)
 * 2. SMS alert to Super Admin
 * 3. Security alert logged
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-token',
}

// The secret header that legitimate internal tools would know
const HONEYPOT_SECRET_HEADER = 'x-internal-token'
const HONEYPOT_SECRET_VALUE = 'wouaka-internal-2026-secure-access'

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get request info
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('cf-connecting-ip') ||
                   req.headers.get('x-real-ip') ||
                   'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const secretHeader = req.headers.get(HONEYPOT_SECRET_HEADER)

  console.log(`[HONEYPOT] Access attempt from IP: ${clientIP}, UA: ${userAgent}`)

  // Check if legitimate access (should never happen in normal use)
  if (secretHeader === HONEYPOT_SECRET_VALUE) {
    console.log('[HONEYPOT] Legitimate access with secret header')
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Honeypot working correctly',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // === TRAP TRIGGERED ===
  console.error(`[HONEYPOT] 🚨 TRAP TRIGGERED! IP: ${clientIP}`)

  try {
    // 1. Log security alert
    const { data: alertData, error: alertError } = await supabase
      .from('security_alerts')
      .insert({
        alert_type: 'honeypot_triggered',
        severity: 'critical',
        source_ip: clientIP,
        user_agent: userAgent,
        endpoint: '/admin-internal-stats',
        payload: {
          method: req.method,
          url: req.url,
          headers: Object.fromEntries(
            [...req.headers.entries()]
              .filter(([key]) => !key.toLowerCase().includes('authorization'))
          ),
          triggered_at: new Date().toISOString()
        },
        action_taken: 'ip_banned'
      })
      .select()
      .single()

    if (alertError) {
      console.error('[HONEYPOT] Failed to log alert:', alertError)
    } else {
      console.log('[HONEYPOT] Alert logged:', alertData?.id)
    }

    // 2. Ban the IP (24 hours)
    const { data: banData, error: banError } = await supabase
      .from('blacklisted_ips')
      .insert({
        ip_address: clientIP,
        reason: 'Honeypot access attempt - Suspected reconnaissance/attack',
        banned_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        banned_by: 'system',
        trigger_endpoint: '/admin-internal-stats',
        trigger_details: {
          user_agent: userAgent,
          alert_id: alertData?.id
        }
      })
      .select()
      .single()

    if (banError) {
      console.error('[HONEYPOT] Failed to ban IP:', banError)
    } else {
      console.log('[HONEYPOT] IP banned:', banData?.id)
    }

    // 3. Send SMS alert to Super Admin
    const adminPhone = Deno.env.get('SECURITY_ALERT_PHONE')
    if (adminPhone) {
      try {
        // Use the existing sms-otp-send function infrastructure
        const africastalkingUsername = Deno.env.get('AFRICASTALKING_USERNAME')
        const africastalkingApiKey = Deno.env.get('AFRICASTALKING_API_KEY')
        
        if (africastalkingUsername && africastalkingApiKey) {
          const smsMessage = `🚨 ALERTE WOUAKA: Honeypot déclenché!\nIP: ${clientIP}\nUA: ${userAgent.substring(0, 50)}\nHeure: ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' })}`
          
          const formData = new URLSearchParams()
          formData.append('username', africastalkingUsername)
          formData.append('to', adminPhone)
          formData.append('message', smsMessage)
          formData.append('from', 'WOUAKA')
          
          const smsResponse = await fetch('https://api.africastalking.com/version1/messaging', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
              'apiKey': africastalkingApiKey,
            },
            body: formData.toString()
          })
          
          if (smsResponse.ok) {
            console.log('[HONEYPOT] SMS alert sent to admin')
          } else {
            console.error('[HONEYPOT] SMS send failed:', await smsResponse.text())
          }
        }
      } catch (smsError) {
        console.error('[HONEYPOT] SMS error:', smsError)
      }
    }

    // 4. Log to audit_logs
    await supabase.from('audit_logs').insert({
      action: 'honeypot_triggered',
      entity_type: 'security',
      entity_id: alertData?.id,
      ip_address: clientIP,
      user_agent: userAgent,
      metadata: {
        ban_duration_hours: 24,
        sms_sent: !!adminPhone
      }
    })

  } catch (error) {
    console.error('[HONEYPOT] Error in trap handling:', error)
  }

  // Return a fake "forbidden" response to not reveal it's a honeypot
  // Delay response to slow down attackers
  await new Promise(resolve => setTimeout(resolve, 2000))

  return new Response(
    JSON.stringify({
      error: 'Forbidden',
      message: 'Access denied. This incident has been logged.'
    }),
    { 
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
})