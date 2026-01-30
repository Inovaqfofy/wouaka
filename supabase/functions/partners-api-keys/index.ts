import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateKeyRequest {
  name: string
  permissions?: string[]
  expires_in_days?: number
}

async function generateApiKey(): Promise<{ key: string; hash: string; prefix: string }> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  const key = 'wk_' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
  const prefix = key.substring(0, 12)

  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return { key, hash, prefix }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get the authorization header
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Authorization header required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify the user's JWT
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid authentication token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  const keyId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null

  try {
    let response: any
    let statusCode = 200

    // GET - List API keys
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, permissions, rate_limit, is_active, last_used_at, expires_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        response = { error: 'Failed to fetch API keys' }
        statusCode = 500
      } else {
        response = { success: true, data: data || [] }
      }
    }

    // POST - Create new API key
    else if (req.method === 'POST') {
      const body: CreateKeyRequest = await req.json()

      if (!body.name) {
        response = { error: 'name is required' }
        statusCode = 400
      } else {
        const { key, hash, prefix } = await generateApiKey()

        const expiresAt = body.expires_in_days 
          ? new Date(Date.now() + body.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
          : null

        const { data, error } = await supabase
          .from('api_keys')
          .insert({
            user_id: user.id,
            name: body.name,
            key_hash: hash,
            key_prefix: prefix,
            permissions: body.permissions || ['score', 'kyc', 'identity'],
            expires_at: expiresAt
          })
          .select('id, name, key_prefix, permissions, rate_limit, is_active, expires_at, created_at')
          .single()

        if (error) {
          response = { error: 'Failed to create API key', details: error.message }
          statusCode = 500
        } else {
          response = { 
            success: true, 
            data: { ...data, key },
            message: 'Save this key securely - it will not be shown again'
          }
          statusCode = 201
        }
      }
    }

    // POST with /rotate - Rotate API key
    else if (req.method === 'PUT' && keyId && keyId !== 'partners-api-keys') {
      // Check if this is a rotation request
      const body = await req.json().catch(() => ({}))
      
      if (body.rotate) {
        // Verify ownership
        const { data: existingKey } = await supabase
          .from('api_keys')
          .select('id, name, permissions, rate_limit, expires_at')
          .eq('id', keyId)
          .eq('user_id', user.id)
          .single()

        if (!existingKey) {
          response = { error: 'API key not found' }
          statusCode = 404
        } else {
          const { key, hash, prefix } = await generateApiKey()

          const { data, error } = await supabase
            .from('api_keys')
            .update({
              key_hash: hash,
              key_prefix: prefix,
              updated_at: new Date().toISOString()
            })
            .eq('id', keyId)
            .eq('user_id', user.id)
            .select('id, name, key_prefix, permissions, rate_limit, is_active, expires_at, created_at')
            .single()

          if (error) {
            response = { error: 'Failed to rotate API key' }
            statusCode = 500
          } else {
            response = { 
              success: true, 
              data: { ...data, key },
              message: 'API key rotated - save the new key securely'
            }
          }
        }
      } else {
        // Regular update (enable/disable)
        const updates: any = {}
        if (body.is_active !== undefined) updates.is_active = body.is_active
        if (body.name) updates.name = body.name
        if (body.permissions) updates.permissions = body.permissions

        const { data, error } = await supabase
          .from('api_keys')
          .update(updates)
          .eq('id', keyId)
          .eq('user_id', user.id)
          .select('id, name, key_prefix, permissions, rate_limit, is_active, expires_at, created_at')
          .single()

        if (error || !data) {
          response = { error: 'API key not found or update failed' }
          statusCode = 404
        } else {
          response = { success: true, data }
        }
      }
    }

    // DELETE - Delete API key
    else if (req.method === 'DELETE') {
      if (!keyId || keyId === 'partners-api-keys') {
        response = { error: 'API key ID is required' }
        statusCode = 400
      } else {
        const { error } = await supabase
          .from('api_keys')
          .delete()
          .eq('id', keyId)
          .eq('user_id', user.id)

        if (error) {
          response = { error: 'Failed to delete API key' }
          statusCode = 500
        } else {
          response = { success: true, message: 'API key deleted' }
        }
      }
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
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
