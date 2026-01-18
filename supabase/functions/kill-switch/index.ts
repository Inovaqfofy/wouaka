import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FeatureStatus {
  feature_name: string
  is_active: boolean
  emergency_message: string
}

interface LockdownState {
  is_full_lockdown: boolean
  is_read_only_mode: boolean
  lockdown_message: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Auth check - SUPER_ADMIN only
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Authorization required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify SUPER_ADMIN role
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'SUPER_ADMIN')
    .single()

  if (!userRole) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  try {
    // GET - Fetch current status
    if (req.method === 'GET') {
      const { data: features } = await supabase
        .from('system_security_controls')
        .select('*')
        .order('feature_name')

      const { data: lockdown } = await supabase
        .from('system_lockdown_state')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single()

      const { data: recentActions } = await supabase
        .from('emergency_actions_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            features,
            lockdown,
            recent_actions: recentActions
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST - Execute action
    if (req.method === 'POST') {
      const body = await req.json()

      switch (action) {
        case 'toggle_feature': {
          const { feature_name, is_active, emergency_message } = body

          const { error } = await supabase
            .from('system_security_controls')
            .update({
              is_active,
              emergency_message: emergency_message || undefined,
              last_toggled_at: new Date().toISOString(),
              toggled_by: user.id
            })
            .eq('feature_name', feature_name)

          if (error) throw error

          // Log the action
          await supabase.from('emergency_actions_log').insert({
            action_type: is_active ? 'feature_enable' : 'feature_disable',
            feature_name,
            performed_by: user.id,
            auto_triggered: false,
            details: { emergency_message }
          })

          return new Response(
            JSON.stringify({ success: true, message: `Feature ${feature_name} ${is_active ? 'enabled' : 'disabled'}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'full_lockdown': {
          const { enable, lockdown_message, lockdown_reason } = body

          const { error } = await supabase
            .from('system_lockdown_state')
            .update({
              is_full_lockdown: enable,
              is_read_only_mode: false, // Full lockdown supersedes read-only
              lockdown_message: lockdown_message || 'Maintenance de sécurité en cours.',
              lockdown_reason,
              locked_at: enable ? new Date().toISOString() : null,
              locked_by: enable ? user.id : null,
              auto_triggered: false
            })
            .eq('id', '00000000-0000-0000-0000-000000000001')

          if (error) throw error

          // Log the action
          await supabase.from('emergency_actions_log').insert({
            action_type: enable ? 'lockdown' : 'unlock',
            performed_by: user.id,
            auto_triggered: false,
            trigger_reason: lockdown_reason,
            details: { lockdown_message }
          })

          // Send SMS alert to Super Admin
          const alertPhone = Deno.env.get('SECURITY_ALERT_PHONE')
          if (alertPhone) {
            try {
              await supabase.functions.invoke('sms-otp-send', {
                body: {
                  phone_number: alertPhone,
                  purpose: 'transaction',
                  allow_fallback: true,
                  custom_message: enable 
                    ? `🚨 ALERTE WOUAKA: FULL LOCKDOWN activé par admin. Raison: ${lockdown_reason || 'Non spécifiée'}`
                    : `✅ WOUAKA: Lockdown désactivé. Services rétablis.`
                }
              })
            } catch (smsError) {
              console.error('SMS alert failed:', smsError)
            }
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: enable ? 'Full lockdown activated' : 'Lockdown disabled' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'read_only_mode': {
          const { enable, lockdown_message } = body

          const { error } = await supabase
            .from('system_lockdown_state')
            .update({
              is_read_only_mode: enable,
              lockdown_message: lockdown_message || 'Mode lecture seule activé.',
              locked_at: enable ? new Date().toISOString() : null,
              locked_by: enable ? user.id : null,
              auto_triggered: false
            })
            .eq('id', '00000000-0000-0000-0000-000000000001')

          if (error) throw error

          // Log the action
          await supabase.from('emergency_actions_log').insert({
            action_type: enable ? 'read_only_enable' : 'read_only_disable',
            performed_by: user.id,
            auto_triggered: false,
            details: { lockdown_message }
          })

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: enable ? 'Read-only mode activated' : 'Read-only mode disabled' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'integrity_check': {
          const timeWindow = body.time_window_minutes || 10

          // Run the integrity check function
          const { data: checkResult, error } = await supabase.rpc('run_integrity_check', {
            p_time_window_minutes: timeWindow
          })

          if (error) throw error

          // Log the check
          await supabase.from('emergency_actions_log').insert({
            action_type: 'integrity_check',
            performed_by: user.id,
            auto_triggered: false,
            integrity_check_result: checkResult,
            details: { time_window_minutes: timeWindow }
          })

          return new Response(
            JSON.stringify({ 
              success: true, 
              check_result: checkResult,
              can_unlock: checkResult.passed
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'update_message': {
          const { feature_name, emergency_message, global_message } = body

          if (global_message !== undefined) {
            await supabase
              .from('system_lockdown_state')
              .update({ lockdown_message: global_message })
              .eq('id', '00000000-0000-0000-0000-000000000001')
          }

          if (feature_name && emergency_message !== undefined) {
            await supabase
              .from('system_security_controls')
              .update({ emergency_message })
              .eq('feature_name', feature_name)
          }

          return new Response(
            JSON.stringify({ success: true, message: 'Message updated' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        default:
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Kill Switch] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})