import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// Orange Money API Integration
// API Docs: https://developer.orange.com/
// ============================================

interface OrangeMoneyRequest {
  phone_number: string;
  account_holder_consent: boolean;
  country_code: string; // CI, SN, ML, BF, etc.
}

interface OrangeAccountInfo {
  is_active: boolean;
  account_holder_name?: string;
  account_status: 'active' | 'inactive' | 'suspended' | 'unknown';
  account_type?: string;
}

// Orange Money API URLs per country
const ORANGE_API_URLS: Record<string, string> = {
  CI: "https://api.orange.com/orange-money-webpay/ci/v1",
  SN: "https://api.orange.com/orange-money-webpay/sn/v1",
  ML: "https://api.orange.com/orange-money-webpay/ml/v1",
  BF: "https://api.orange.com/orange-money-webpay/bf/v1",
  CM: "https://api.orange.com/orange-money-webpay/cm/v1",
};

// Get OAuth Token from Orange
async function getOrangeAccessToken(): Promise<string | null> {
  const clientId = Deno.env.get("ORANGE_MONEY_CLIENT_ID");
  const clientSecret = Deno.env.get("ORANGE_MONEY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    console.log("[Orange Money] Missing API credentials");
    return null;
  }

  const authString = btoa(`${clientId}:${clientSecret}`);

  try {
    const response = await fetch("https://api.orange.com/oauth/v3/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      console.error("[Orange Money] Token request failed:", response.status);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("[Orange Money] Token error:", error);
    return null;
  }
}

// Check wallet eligibility (verify account exists)
async function checkWalletEligibility(
  phoneNumber: string, 
  countryCode: string,
  accessToken: string
): Promise<OrangeAccountInfo | null> {
  const baseUrl = ORANGE_API_URLS[countryCode] || ORANGE_API_URLS.CI;
  
  // Format phone number for Orange API
  const formattedPhone = phoneNumber.replace(/[\s+\-]/g, "");

  try {
    // Orange Money uses the "webpayment" endpoint to check account
    // In production, you'd use the partner API for account verification
    const response = await fetch(`${baseUrl}/eligibility`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        msisdn: formattedPhone,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          is_active: false,
          account_status: 'unknown',
        };
      }
      console.error("[Orange Money] Eligibility check failed:", response.status);
      return null;
    }

    const data = await response.json();
    
    return {
      is_active: data.eligible === true || data.status === 'active',
      account_holder_name: data.name || data.subscriber_name,
      account_status: data.eligible ? 'active' : 'inactive',
      account_type: data.wallet_type,
    };
  } catch (error) {
    console.error("[Orange Money] Eligibility error:", error);
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
    const request: OrangeMoneyRequest = await req.json();
    const { phone_number, account_holder_consent, country_code = 'CI' } = request;

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
          message: "L'utilisateur doit donner son consentement pour accéder aux données Orange Money"
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Orange Money] Verifying ${phone_number} in ${country_code}`);

    // Check if API credentials are configured
    const hasCredentials = Deno.env.get("ORANGE_MONEY_CLIENT_ID") && 
                          Deno.env.get("ORANGE_MONEY_CLIENT_SECRET");

    if (!hasCredentials) {
      console.log("[Orange Money] API credentials not configured");
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          source: "orange_money",
          status: "not_configured",
          message: "Clés API Orange Money non configurées. Veuillez ajouter ORANGE_MONEY_CLIENT_ID et ORANGE_MONEY_CLIENT_SECRET.",
          data: null,
          processing_time_ms: Date.now() - startTime,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token
    const accessToken = await getOrangeAccessToken();

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          source: "orange_money",
          status: "auth_failed",
          message: "Impossible d'obtenir un token d'accès Orange Money. Vérifiez vos identifiants.",
          data: null,
          processing_time_ms: Date.now() - startTime,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check wallet eligibility
    const accountInfo = await checkWalletEligibility(phone_number, country_code, accessToken);
    
    let verified = false;
    let confidence = 0;
    let responseData: any = {};

    if (accountInfo) {
      verified = accountInfo.is_active;
      confidence = accountInfo.is_active ? 80 : 0;
      responseData = accountInfo;
    }

    const processingTime = Date.now() - startTime;
    console.log(`[Orange Money] Completed in ${processingTime}ms, verified: ${verified}`);

    return new Response(
      JSON.stringify({
        success: true,
        verified,
        source: "orange_money",
        provider: "Orange Money",
        country: country_code,
        status: verified ? "verified" : "not_found",
        confidence,
        data: responseData,
        processing_time_ms: processingTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Orange Money] Error:", error);
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
