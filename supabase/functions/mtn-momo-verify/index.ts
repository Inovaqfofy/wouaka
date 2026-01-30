import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// MTN Mobile Money API Integration
// API Docs: https://momodeveloper.mtn.com/
// ============================================

interface MoMoVerifyRequest {
  phone_number: string;
  account_holder_consent: boolean;
  request_type: 'account_status' | 'transaction_history' | 'balance_info';
}

interface MoMoAccountInfo {
  is_active: boolean;
  account_holder_name?: string;
  account_status: 'active' | 'inactive' | 'suspended' | 'unknown';
}

interface MoMoTransactionSummary {
  last_30_days: {
    incoming_count: number;
    incoming_volume: number;
    outgoing_count: number;
    outgoing_volume: number;
    average_transaction: number;
  };
  last_90_days: {
    total_transactions: number;
    total_volume: number;
  };
  transaction_regularity_score: number;
}

// MTN MoMo API Base URLs
const SANDBOX_URL = "https://sandbox.momodeveloper.mtn.com";
const PRODUCTION_URL = "https://momodeveloper.mtn.com";

// Get OAuth Token from MTN MoMo
async function getMoMoAccessToken(): Promise<string | null> {
  const subscriptionKey = Deno.env.get("MTN_MOMO_SUBSCRIPTION_KEY");
  const apiUser = Deno.env.get("MTN_MOMO_API_USER");
  const apiKey = Deno.env.get("MTN_MOMO_API_KEY");
  const environment = Deno.env.get("MTN_MOMO_ENVIRONMENT") || "sandbox";

  if (!subscriptionKey || !apiUser || !apiKey) {
    console.log("[MTN MoMo] Missing API credentials");
    return null;
  }

  const baseUrl = environment === "production" ? PRODUCTION_URL : SANDBOX_URL;
  const authString = btoa(`${apiUser}:${apiKey}`);

  try {
    const response = await fetch(`${baseUrl}/collection/token/`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authString}`,
        "Ocp-Apim-Subscription-Key": subscriptionKey,
      },
    });

    if (!response.ok) {
      console.error("[MTN MoMo] Token request failed:", response.status);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("[MTN MoMo] Token error:", error);
    return null;
  }
}

// Verify account holder (KYC info)
async function verifyAccountHolder(phoneNumber: string, accessToken: string): Promise<MoMoAccountInfo | null> {
  const subscriptionKey = Deno.env.get("MTN_MOMO_SUBSCRIPTION_KEY");
  const environment = Deno.env.get("MTN_MOMO_ENVIRONMENT") || "sandbox";
  const baseUrl = environment === "production" ? PRODUCTION_URL : SANDBOX_URL;

  // Format phone number (remove + and spaces)
  const formattedPhone = phoneNumber.replace(/[\s+]/g, "");

  try {
    // Get Account Holder Info
    const response = await fetch(
      `${baseUrl}/collection/v1_0/accountholder/msisdn/${formattedPhone}/basicuserinfo`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "X-Target-Environment": environment,
          "Ocp-Apim-Subscription-Key": subscriptionKey!,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          is_active: false,
          account_status: 'unknown',
        };
      }
      console.error("[MTN MoMo] Account verify failed:", response.status);
      return null;
    }

    const data = await response.json();
    
    return {
      is_active: true,
      account_holder_name: data.name || data.given_name,
      account_status: 'active',
    };
  } catch (error) {
    console.error("[MTN MoMo] Account verify error:", error);
    return null;
  }
}

// Check if account is active (lightweight check)
async function checkAccountStatus(phoneNumber: string, accessToken: string): Promise<boolean> {
  const subscriptionKey = Deno.env.get("MTN_MOMO_SUBSCRIPTION_KEY");
  const environment = Deno.env.get("MTN_MOMO_ENVIRONMENT") || "sandbox";
  const baseUrl = environment === "production" ? PRODUCTION_URL : SANDBOX_URL;

  const formattedPhone = phoneNumber.replace(/[\s+]/g, "");

  try {
    const response = await fetch(
      `${baseUrl}/collection/v1_0/accountholder/msisdn/${formattedPhone}/active`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "X-Target-Environment": environment,
          "Ocp-Apim-Subscription-Key": subscriptionKey!,
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.result === true;
  } catch (error) {
    console.error("[MTN MoMo] Status check error:", error);
    return false;
  }
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const request: MoMoVerifyRequest = await req.json();
    const { phone_number, account_holder_consent, request_type = 'account_status' } = request;

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
          message: "L'utilisateur doit donner son consentement pour accéder aux données Mobile Money"
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[MTN MoMo] Verifying ${phone_number}, type: ${request_type}`);

    // Check if API credentials are configured
    const hasCredentials = Deno.env.get("MTN_MOMO_SUBSCRIPTION_KEY") && 
                          Deno.env.get("MTN_MOMO_API_USER") && 
                          Deno.env.get("MTN_MOMO_API_KEY");

    if (!hasCredentials) {
      console.log("[MTN MoMo] API credentials not configured");
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          source: "mtn_momo",
          status: "not_configured",
          message: "Clés API MTN MoMo non configurées. Veuillez ajouter MTN_MOMO_SUBSCRIPTION_KEY, MTN_MOMO_API_USER et MTN_MOMO_API_KEY.",
          data: null,
          processing_time_ms: Date.now() - startTime,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token
    const accessToken = await getMoMoAccessToken();

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          source: "mtn_momo",
          status: "auth_failed",
          message: "Impossible d'obtenir un token d'accès MTN MoMo. Vérifiez vos identifiants.",
          data: null,
          processing_time_ms: Date.now() - startTime,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let responseData: any = {};
    let verified = false;
    let confidence = 0;

    if (request_type === 'account_status') {
      // Simple active check
      const isActive = await checkAccountStatus(phone_number, accessToken);
      verified = isActive;
      confidence = isActive ? 70 : 0;
      responseData = {
        is_active: isActive,
        account_status: isActive ? 'active' : 'unknown',
      };
    } else {
      // Full account info
      const accountInfo = await verifyAccountHolder(phone_number, accessToken);
      if (accountInfo) {
        verified = accountInfo.is_active;
        confidence = accountInfo.is_active ? 85 : 0;
        responseData = accountInfo;
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`[MTN MoMo] Completed in ${processingTime}ms, verified: ${verified}`);

    return new Response(
      JSON.stringify({
        success: true,
        verified,
        source: "mtn_momo",
        provider: "MTN Mobile Money",
        status: verified ? "verified" : "not_found",
        confidence,
        data: responseData,
        processing_time_ms: processingTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[MTN MoMo] Error:", error);
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
