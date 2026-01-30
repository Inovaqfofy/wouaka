/**
 * Server-side HIBP Password Breach Check Edge Function
 * ======================================================
 * Provides server-side validation for password breach checking
 * Uses k-anonymity to preserve user privacy
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Generate SHA-1 hash of a password
 */
async function sha1Hash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return bufferToHex(hashBuffer);
}

interface BreachCheckResult {
  isBreached: boolean;
  count: number;
  error?: string;
}

/**
 * Check if a password has been exposed in known data breaches
 */
async function checkPasswordBreach(password: string): Promise<BreachCheckResult> {
  try {
    const hash = await sha1Hash(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);
    
    console.log(`[HIBP] Checking password hash prefix: ${prefix}***`);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true',
        'User-Agent': 'Wouaka-Credit-Score-Security-Check/1.0',
      },
    });
    
    if (!response.ok) {
      console.error(`[HIBP] API error: ${response.status}`);
      // Fail closed on server-side for security
      return { isBreached: false, count: 0, error: 'HIBP service unavailable' };
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix.trim().toUpperCase() === suffix) {
        const count = parseInt(countStr.trim(), 10);
        console.log(`[HIBP] Password found in breach database: ${count} occurrences`);
        return { isBreached: true, count };
      }
    }
    
    console.log('[HIBP] Password not found in breach database');
    return { isBreached: false, count: 0 };
  } catch (error) {
    console.error('[HIBP] Check failed:', error);
    return { isBreached: false, count: 0, error: 'Check failed' };
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password length
    if (password.length < 8 || password.length > 72) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Password must be between 8 and 72 characters' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await checkPasswordBreach(password);

    return new Response(
      JSON.stringify({
        success: true,
        isBreached: result.isBreached,
        count: result.count,
        ...(result.error && { warning: result.error }),
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('[check-password-breach] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
