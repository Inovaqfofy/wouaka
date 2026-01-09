import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Auth check
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

  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  const resourceId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null
  const isPlans = url.pathname.includes('/plans')

  try {
    let response: any
    let statusCode = 200

    // GET /subscriptions/plans - List all plans
    if (req.method === 'GET' && isPlans) {
      console.log('[Subscriptions] Fetching plans')
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true })

      if (error) throw error
      response = { success: true, data }
    }

    // GET /subscriptions - Get user's subscription
    else if (req.method === 'GET' && !resourceId) {
      console.log('[Subscriptions] Fetching user subscription:', user.id)
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      response = { success: true, data: data || null }
    }

    // POST /subscriptions - Create subscription
    else if (req.method === 'POST') {
      const body = await req.json()
      console.log('[Subscriptions] Creating subscription:', body)

      if (!body.plan_id) {
        return new Response(
          JSON.stringify({ error: 'plan_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if plan exists
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', body.plan_id)
        .eq('is_active', true)
        .single()

      if (planError || !plan) {
        return new Response(
          JSON.stringify({ error: 'Plan not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate period end (1 month from now)
      const periodEnd = new Date()
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      const { data, error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: body.plan_id,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          metadata: body.metadata || {}
        }, { onConflict: 'user_id' })
        .select('*, plan:subscription_plans(*)')
        .single()

      if (error) throw error
      response = { success: true, data, message: 'Subscription created' }
      statusCode = 201
    }

    // PUT /subscriptions - Update subscription
    else if (req.method === 'PUT') {
      const body = await req.json()
      console.log('[Subscriptions] Updating subscription:', body)

      const updates: any = {}
      if (body.plan_id) updates.plan_id = body.plan_id
      if (body.metadata) updates.metadata = body.metadata

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('user_id', user.id)
        .select('*, plan:subscription_plans(*)')
        .single()

      if (error) throw error
      response = { success: true, data }
    }

    // DELETE /subscriptions - Cancel subscription
    else if (req.method === 'DELETE') {
      console.log('[Subscriptions] Canceling subscription for user:', user.id)
      
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          cancel_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      response = { success: true, message: 'Subscription canceled', data }
    }

    else {
      response = { error: 'Method not allowed' }
      statusCode = 405
    }

    return new Response(
      JSON.stringify(response),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Subscriptions] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})