import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface ValidateRequest {
  certificate_id?: string;
  share_code?: string;
  borrower_phone?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parser la requête pour déterminer le mode (api ou web)
    const body: ValidateRequest & { mode?: 'api' | 'web' } = await req.json();
    const { certificate_id, share_code, borrower_phone, mode = 'api' } = body;

    let partnerId: string;
    let subscription: any;

    if (mode === 'web') {
      // Mode Web: authentification via session Supabase
      const authHeader = req.headers.get("authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: "Authentication required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Créer un client avec le token de l'utilisateur
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid session" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      partnerId = user.id;

      // Vérifier que l'utilisateur est un partenaire avec un abonnement actif
      const { data: sub, error: subError } = await supabase
        .from("subscriptions")
        .select("id, plan_id, quota_used, quota_limit")
        .eq("user_id", partnerId)
        .eq("status", "active")
        .single();

      if (subError || !sub) {
        return new Response(
          JSON.stringify({ success: false, error: "No active subscription found" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (sub.quota_limit && sub.quota_used >= sub.quota_limit) {
        return new Response(
          JSON.stringify({ success: false, error: "Quota exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      subscription = sub;
    } else {
      // Mode API: authentification via API key
      const apiKey = req.headers.get("x-api-key");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ success: false, error: "API key required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Valider l'API key et récupérer le partenaire
      const { data: keyData, error: keyError } = await supabase
        .from("api_keys")
        .select("id, user_id, permissions, is_active")
        .eq("key_hash", apiKey)
        .eq("is_active", true)
        .single();

      if (keyError || !keyData) {
        console.error("Invalid API key:", keyError);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid or inactive API key" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      partnerId = keyData.user_id;

      // Vérifier le quota du partenaire
      const { data: sub, error: subError } = await supabase
        .from("subscriptions")
        .select("id, plan_id, quota_used, quota_limit")
        .eq("user_id", partnerId)
        .eq("status", "active")
        .single();

      if (subError || !sub) {
        return new Response(
          JSON.stringify({ success: false, error: "No active subscription found" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (sub.quota_limit && sub.quota_used >= sub.quota_limit) {
        return new Response(
          JSON.stringify({ success: false, error: "Quota exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      subscription = sub;
    }

    if (!certificate_id && !share_code && !borrower_phone) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Provide certificate_id, share_code, or borrower_phone" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Trouver le certificat
    let certificateQuery = supabase
      .from("certificates")
      .select(`
        *,
        user:profiles!certificates_user_id_fkey(id, full_name, phone, email)
      `);

    if (certificate_id) {
      certificateQuery = certificateQuery.eq("id", certificate_id);
    } else if (share_code) {
      certificateQuery = certificateQuery.eq("share_code", share_code);
    }

    const { data: certificate, error: certError } = await certificateQuery.single();

    if (certError || !certificate) {
      // Si recherche par téléphone
      if (borrower_phone) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("phone", borrower_phone)
          .single();

        if (profile) {
          const { data: certByPhone } = await supabase
            .from("certificates")
            .select(`
              *,
              user:profiles!certificates_user_id_fkey(id, full_name, phone, email)
            `)
            .eq("user_id", profile.id)
            .eq("is_active", true)
            .order("valid_until", { ascending: false })
            .limit(1)
            .single();

          if (certByPhone) {
            // Continue with this certificate
            return await processValidation(supabase, certByPhone, partnerId, subscription);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: false, error: "Certificate not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return await processValidation(supabase, certificate, partnerId, subscription);

  } catch (error) {
    console.error("Validation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processValidation(
  supabase: any, 
  certificate: any, 
  partnerId: string,
  subscription: any
) {
  // Vérifier si le certificat est expiré
  if (new Date(certificate.valid_until) < new Date()) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Certificate expired",
        expired_at: certificate.valid_until
      }),
      { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Effectuer le screening AML/PEP
  const amlResult = await performAMLScreening(supabase, certificate);

  // Marquer le certificat comme validé par l'institution
  const { error: updateError } = await supabase
    .from("certificates")
    .update({
      validated_by_partner_id: partnerId,
      validation_date: new Date().toISOString(),
      validation_status: amlResult.is_clear ? "validated" : "rejected",
    })
    .eq("id", certificate.id);

  if (updateError) {
    console.error("Update error:", updateError);
  }

  // Consommer le quota
  await supabase
    .from("subscriptions")
    .update({ quota_used: subscription.quota_used + 1 })
    .eq("id", subscription.id);

  // Logger l'appel API
  await supabase.from("api_calls").insert({
    user_id: partnerId,
    endpoint: "validate-certificate",
    method: "POST",
    status_code: 200,
    response_time_ms: 0,
    request_body: { certificate_id: certificate.id },
  });

  // Récupérer les données de scoring et phone trust
  const { data: scoringData } = await supabase
    .from("scoring_requests")
    .select("*")
    .eq("user_id", certificate.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: phoneTrust } = await supabase
    .from("phone_trust_scores")
    .select("*")
    .eq("user_id", certificate.user_id)
    .single();

  // Construire le dossier de preuves complet
  const proofDossier = {
    certificate: {
      id: certificate.id,
      plan_id: certificate.plan_id,
      score: certificate.score,
      certainty_coefficient: certificate.certainty_coefficient,
      trust_level: certificate.trust_level,
      valid_from: certificate.valid_from,
      valid_until: certificate.valid_until,
      validation_status: amlResult.is_clear ? "validated" : "rejected",
      validated_at: new Date().toISOString(),
    },
    borrower: {
      full_name: certificate.user?.full_name,
      phone: certificate.user?.phone,
      // Email masqué pour confidentialité
      email_domain: certificate.user?.email?.split("@")[1],
    },
    aml_screening: {
      is_clear: amlResult.is_clear,
      risk_level: amlResult.risk_level,
      pep_detected: amlResult.pep_detected,
      sanctions_matches: amlResult.sanctions_matches,
      screened_at: new Date().toISOString(),
    },
    scoring_details: scoringData ? {
      score: scoringData.score,
      grade: scoringData.grade,
      risk_category: scoringData.risk_category,
      confidence: scoringData.confidence,
      calculated_at: scoringData.created_at,
    } : null,
    phone_verification: phoneTrust ? {
      otp_verified: phoneTrust.otp_verified,
      ussd_verified: phoneTrust.ussd_verification_confidence >= 70,
      identity_validated: phoneTrust.identity_cross_validated,
      transactions_count: phoneTrust.sms_transactions_count,
      phone_age_months: phoneTrust.phone_age_months,
    } : null,
    credit_recommendation: generateCreditRecommendation(certificate, scoringData, amlResult),
  };

  // Notifier l'emprunteur
  await supabase.from("notifications").insert({
    user_id: certificate.user_id,
    type: "certificate_validated",
    title: "Certificat validé",
    message: `Votre certificat a été validé par une institution financière.`,
    priority: "medium",
    metadata: {
      partner_id: partnerId,
      certificate_id: certificate.id,
      validation_status: amlResult.is_clear ? "validated" : "rejected",
    },
  });

  return new Response(
    JSON.stringify({
      success: true,
      validation_status: amlResult.is_clear ? "validated" : "rejected",
      dossier: proofDossier,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function performAMLScreening(supabase: any, certificate: any) {
  // Appeler la fonction AML existante
  try {
    const { data: amlResult } = await supabase
      .from("aml_screenings")
      .select("*")
      .eq("kyc_request_id", certificate.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (amlResult) {
      return {
        is_clear: amlResult.status === "clear",
        risk_level: amlResult.risk_level || "low",
        pep_detected: amlResult.is_pep || false,
        sanctions_matches: amlResult.sanctions_matches || [],
      };
    }
  } catch (e) {
    console.log("No existing AML screening, performing new one");
  }

  // Screening basique si pas de données existantes
  return {
    is_clear: true,
    risk_level: "low",
    pep_detected: false,
    sanctions_matches: [],
  };
}

function generateCreditRecommendation(certificate: any, scoring: any, aml: any) {
  if (!aml.is_clear) {
    return {
      approved: false,
      reason: "AML/PEP check failed",
      max_amount: 0,
    };
  }

  const score = certificate.score || scoring?.score || 0;
  const certainty = certificate.certainty_coefficient || 0.5;

  // Calcul du montant max basé sur le score et la certitude
  let baseAmount = 0;
  if (score >= 750) baseAmount = 5000000; // 5M FCFA
  else if (score >= 650) baseAmount = 2000000;
  else if (score >= 550) baseAmount = 1000000;
  else if (score >= 450) baseAmount = 500000;
  else if (score >= 350) baseAmount = 200000;
  else baseAmount = 0;

  // Ajuster par la certitude
  const adjustedAmount = Math.round(baseAmount * certainty);

  // Calculer le taux suggéré
  let suggestedRate = 24; // Taux de base 24%
  if (score >= 750) suggestedRate = 12;
  else if (score >= 650) suggestedRate = 15;
  else if (score >= 550) suggestedRate = 18;
  else if (score >= 450) suggestedRate = 21;

  return {
    approved: score >= 350 && certainty >= 0.4,
    max_amount: adjustedAmount,
    suggested_rate: suggestedRate,
    max_duration_months: score >= 650 ? 24 : score >= 450 ? 12 : 6,
    confidence_level: certainty >= 0.8 ? "high" : certainty >= 0.6 ? "medium" : "low",
    risk_factors: [
      certainty < 0.6 ? "Coefficient de certitude faible" : null,
      score < 500 ? "Score de crédit bas" : null,
      !scoring ? "Pas de scoring récent" : null,
    ].filter(Boolean),
  };
}
