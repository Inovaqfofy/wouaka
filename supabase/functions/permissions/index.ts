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
  const action = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null

  try {
    let response: any
    let statusCode = 200

    // GET /permissions - List all permissions
    if (req.method === 'GET' && !action) {
      console.log('[Permissions] Fetching all permissions')
      
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource')
        .order('action')

      if (error) throw error
      response = { success: true, data }
    }

    // GET /permissions/my - Get current user's permissions
    else if (req.method === 'GET' && action === 'my') {
      console.log('[Permissions] Fetching permissions for user:', user.id)
      
      // Get user's role
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (roleError) {
        return new Response(
          JSON.stringify({ error: 'User role not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get permissions for this role
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission:permissions(*)')
        .eq('role', userRole.role)

      if (error) throw error

      const permissions = data?.map(rp => rp.permission).filter(Boolean) || []
      response = { 
        success: true, 
        data: {
          role: userRole.role,
          permissions
        }
      }
    }

    // GET /permissions/roles - Get all role permissions mapping
    else if (req.method === 'GET' && action === 'roles') {
      console.log('[Permissions] Fetching role permissions mapping')
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role, permission:permissions(*)')
        .order('role')

      if (error) throw error

      // Group by role
      const rolePermissions: Record<string, any[]> = {}
      for (const rp of data || []) {
        if (!rolePermissions[rp.role]) {
          rolePermissions[rp.role] = []
        }
        if (rp.permission) {
          rolePermissions[rp.role].push(rp.permission)
        }
      }

      response = { success: true, data: rolePermissions }
    }

    // GET /permissions/check - Check if user has permission
    else if (req.method === 'GET' && action === 'check') {
      const permission = url.searchParams.get('permission')
      
      if (!permission) {
        return new Response(
          JSON.stringify({ error: 'permission query param is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[Permissions] Checking permission:', permission, 'for user:', user.id)

      // Get user's role
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!userRole) {
        response = { success: true, has_permission: false, reason: 'No role assigned' }
      } else {
        // Check if role has this permission
        const { data: rolePermission } = await supabase
          .from('role_permissions')
          .select('id, permission:permissions!inner(name)')
          .eq('role', userRole.role)
          .eq('permissions.name', permission)
          .single()

        response = { 
          success: true, 
          has_permission: !!rolePermission,
          role: userRole.role
        }
      }
    }

    // POST /permissions - Create permission (admin only)
    else if (req.method === 'POST') {
      // Check if user is admin
      const { data: isAdmin } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'SUPER_ADMIN' 
      })

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const body = await req.json()
      console.log('[Permissions] Creating permission:', body)

      if (!body.name || !body.resource || !body.action) {
        return new Response(
          JSON.stringify({ error: 'name, resource, and action are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('permissions')
        .insert({
          name: body.name,
          description: body.description,
          resource: body.resource,
          action: body.action
        })
        .select()
        .single()

      if (error) throw error
      response = { success: true, data }
      statusCode = 201
    }

    // PUT /permissions/assign - Assign permission to role (admin only)
    else if (req.method === 'PUT' && action === 'assign') {
      // Check if user is admin
      const { data: isAdmin } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'SUPER_ADMIN' 
      })

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const body = await req.json()
      console.log('[Permissions] Assigning permission:', body)

      if (!body.role || !body.permission_id) {
        return new Response(
          JSON.stringify({ error: 'role and permission_id are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('role_permissions')
        .upsert({
          role: body.role,
          permission_id: body.permission_id
        }, { onConflict: 'role,permission_id' })
        .select('*, permission:permissions(*)')
        .single()

      if (error) throw error
      response = { success: true, data, message: 'Permission assigned to role' }
    }

    // DELETE /permissions/revoke - Revoke permission from role (admin only)
    else if (req.method === 'DELETE') {
      // Check if user is admin
      const { data: isAdmin } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'SUPER_ADMIN' 
      })

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const role = url.searchParams.get('role')
      const permissionId = url.searchParams.get('permission_id')

      if (!role || !permissionId) {
        return new Response(
          JSON.stringify({ error: 'role and permission_id query params are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[Permissions] Revoking permission:', permissionId, 'from role:', role)

      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role', role)
        .eq('permission_id', permissionId)

      if (error) throw error
      response = { success: true, message: 'Permission revoked from role' }
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
    console.error('[Permissions] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})