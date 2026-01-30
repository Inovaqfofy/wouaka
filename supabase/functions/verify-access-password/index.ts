import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();

    if (!password) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Password required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client with service role for password verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all valid passwords
    const { data: passwords, error: queryError } = await supabase
      .from('access_passwords')
      .select('id, password_hash, used_count')
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);

    if (queryError) {
      console.error('Query error:', queryError);
      throw queryError;
    }

    if (!passwords || passwords.length === 0) {
      return new Response(
        JSON.stringify({ valid: false, error: 'No passwords configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify each password hash using the DB function
    for (const pwd of passwords) {
      const { data: match, error: matchError } = await supabase.rpc('check_password_hash', {
        input_password: password,
        stored_hash: pwd.password_hash
      });

      if (matchError) {
        console.error('Match error:', matchError);
        continue;
      }

      if (match) {
        // Update usage stats
        await supabase
          .from('access_passwords')
          .update({ 
            used_count: (pwd.used_count || 0) + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', pwd.id);

        console.log('Password verified successfully');
        return new Response(
          JSON.stringify({ valid: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('No matching password found');
    return new Response(
      JSON.stringify({ valid: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
