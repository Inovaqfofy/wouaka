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
  const category = url.searchParams.get('category')
  const key = url.searchParams.get('key')

  try {
    let response: any
    let statusCode = 200

    // GET /settings - Get all user settings
    if (req.method === 'GET') {
      console.log('[Settings] Fetching settings for user:', user.id, 'category:', category)
      
      let query = supabase
        .from('settings')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('category')
        .order('key')

      if (category) {
        query = query.eq('category', category)
      }
      if (key) {
        query = query.eq('key', key)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform to a more usable format
      const settingsMap: Record<string, Record<string, any>> = {}
      for (const setting of data || []) {
        if (!settingsMap[setting.category]) {
          settingsMap[setting.category] = {}
        }
        settingsMap[setting.category][setting.key] = {
          value: setting.value,
          is_system: setting.is_system,
          updated_at: setting.updated_at
        }
      }

      response = { success: true, data: settingsMap }
    }

    // POST /settings - Create or update setting
    else if (req.method === 'POST') {
      const body = await req.json()
      console.log('[Settings] Creating/updating setting:', body)

      if (!body.category || !body.key) {
        return new Response(
          JSON.stringify({ error: 'category and key are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('settings')
        .upsert({
          user_id: user.id,
          category: body.category,
          key: body.key,
          value: body.value || {},
          is_system: false
        }, { onConflict: 'user_id,category,key' })
        .select()
        .single()

      if (error) throw error
      response = { success: true, data }
      statusCode = 201
    }

    // PUT /settings - Bulk update settings
    else if (req.method === 'PUT') {
      const body = await req.json()
      console.log('[Settings] Bulk updating settings:', Object.keys(body))

      const updates: any[] = []
      for (const [category, settings] of Object.entries(body)) {
        for (const [key, value] of Object.entries(settings as Record<string, any>)) {
          updates.push({
            user_id: user.id,
            category,
            key,
            value: typeof value === 'object' ? value : { value },
            is_system: false
          })
        }
      }

      const { data, error } = await supabase
        .from('settings')
        .upsert(updates, { onConflict: 'user_id,category,key' })
        .select()

      if (error) throw error
      response = { success: true, data, message: `${updates.length} settings updated` }
    }

    // DELETE /settings - Delete a setting
    else if (req.method === 'DELETE') {
      if (!category || !key) {
        return new Response(
          JSON.stringify({ error: 'category and key query params are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[Settings] Deleting setting:', category, key)

      const { error } = await supabase
        .from('settings')
        .delete()
        .eq('user_id', user.id)
        .eq('category', category)
        .eq('key', key)
        .eq('is_system', false)

      if (error) throw error
      response = { success: true, message: 'Setting deleted' }
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
    console.error('[Settings] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})