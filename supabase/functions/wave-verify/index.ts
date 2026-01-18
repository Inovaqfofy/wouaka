import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// Wave Money API Integration
// API Docs: https://developers.wave.com/
// Wave is popular in Senegal, Côte d'Ivoire, Mali
// ============================================

interface WaveVerifyRequest {
  phone_number: string;
  account_holder_consent: boolean;
}

interface WaveAccountInfo {
  is_active: boolean;
  account_holder_name?: string;
  account_status: 'active' | 'inactive' | 'suspended' | 'unknown';
}

const WAVE_API_URL = "https://api.wave.com/v1";

// Get Wave Access Token
async function getWaveAccessToken(): Promise<string | null> {
  const apiKey = Deno.env.get("WAVE_API_KEY");

  if (!apiKey) {
    console.log("[Wave] Missing API key");
    return null;
  }

  // Wave uses direct API key authentication
  return apiKey;
}

// Verify Wave account
async function verifyWaveAccount(phoneNumber: string, apiKey: string): Promise<WaveAccountInfo | null> {
  // Format phone number
  const formattedPhone = phoneNumber.replace(/[\s+\-]/g, "");

  try {
    // Wave API endpoint for account verification
    const response = await fetch(`${WAVE_API_URL}/accounts/lookup`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: formattedPhone,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          is_active: false,
          account_status: 'unknown',
        };
      }
      console.error("[Wave] Account lookup failed:", response.status);
      return null;
    }

    const data = await response.json();
    
    return {
      is_active: data.account_exists === true,
      account_holder_name: data.name,
      account_status: data.account_exists ? 'active' : 'inactive',
    };
  } catch (error) {
    console.error("[Wave] Account lookup error:", error);
    return null;
  }
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const request: WaveVerifyRequest = await req.json();
    const { phone_number, account_holder_consent } = request;

    if (!phone_number) {
      return new Response(
        JSON.stringify({ error: "phone_number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!account_holder_consent) {
      return new Response(
        JSON.stringify({ 
          error: "account_holder_consent is required",
          message: "L'utilisateur doit donner son consentement pour accéder aux données Wave"
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Wave] Verifying ${phone_number}`);

    // Check if API key is configured
    const apiKey = Deno.env.get("WAVE_API_KEY");

    if (!apiKey) {
      console.log("[Wave] API key not configured");
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          source: "wave",
          status: "not_configured",
          message: "Clé API Wave non configurée. Veuillez ajouter WAVE_API_KEY.",
          data: null,
          processing_time_ms: Date.now() - startTime,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify account
    const accountInfo = await verifyWaveAccount(phone_number, apiKey);
    
    let verified = false;
    let confidence = 0;
    let responseData: any = {};

    if (accountInfo) {
      verified = accountInfo.is_active;
      confidence = accountInfo.is_active ? 80 : 0;
      responseData = accountInfo;
    }

    const processingTime = Date.now() - startTime;
    console.log(`[Wave] Completed in ${processingTime}ms, verified: ${verified}`);

    return new Response(
      JSON.stringify({
        success: true,
        verified,
        source: "wave",
        provider: "Wave",
        status: verified ? "verified" : "not_found",
        confidence,
        data: responseData,
        processing_time_ms: processingTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Wave] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : "Unknown error",
        processing_time_ms: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
