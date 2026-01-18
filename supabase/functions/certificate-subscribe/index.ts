import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuration des plans emprunteur - alignée avec pricing-plans.ts
const BORROWER_PLANS: Record<string, {
  name: string;
  price: number;
  validityDays: number;
  recertifications: number | null; // null = illimité
  smileIdLevel: 'none' | 'basic' | 'biometric';
}> = {
  "emprunteur-decouverte": {
    name: "Découverte",
    price: 1500,
    validityDays: 30,
    recertifications: 0,
    smileIdLevel: 'none'
  },
  "emprunteur-essentiel": {
    name: "Essentiel",
    price: 5000,
    validityDays: 90,
    recertifications: 1,
    smileIdLevel: 'basic'
  },
  "emprunteur-premium": {
    name: "Premium",
    price: 12000,
    validityDays: 365,
    recertifications: null, // illimité
    smileIdLevel: 'biometric'
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const cinetpayApiKey = Deno.env.get("CINETPAY_API_KEY");
    const cinetpaySiteId = Deno.env.get("CINETPAY_SITE_ID");

    if (!cinetpayApiKey || !cinetpaySiteId) {
      throw new Error("CinetPay configuration manquante");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer l'utilisateur depuis le token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Non authentifié");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Récupérer le plan demandé
    const { plan_id } = await req.json();
    const plan = BORROWER_PLANS[plan_id];

    if (!plan) {
      throw new Error("Plan invalide. Plans disponibles: " + Object.keys(BORROWER_PLANS).join(", "));
    }

    // Récupérer les infos du profil
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .single();

    // Générer un ID de transaction unique
    const transactionId = `WOK-CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calculer les dates de validité
    const validFrom = new Date();
    const validUntil = new Date(validFrom.getTime() + plan.validityDays * 24 * 60 * 60 * 1000);

    // Créer l'enregistrement de transaction
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: user.id,
        amount: plan.price,
        currency: "XOF",
        status: "pending",
        payment_method: "cinetpay",
        transaction_id: transactionId,
        metadata: {
          type: "certificate_subscription",
          plan_id,
          plan_name: plan.name,
          validity_days: plan.validityDays,
          recertifications_total: plan.recertifications,
          smile_id_level: plan.smileIdLevel,
          valid_from: validFrom.toISOString(),
          valid_until: validUntil.toISOString()
        }
      })
      .select()
      .single();

    if (txError) {
      console.error("Erreur création transaction:", txError);
      throw new Error("Erreur lors de la création de la transaction");
    }

    // Préparer les données client pour CinetPay
    const customerName = profile?.full_name || user.email?.split("@")[0] || "Client";
    const [firstName, ...rest] = customerName.split(" ").filter(Boolean);
    const surname = rest.join(" ") || firstName || customerName;

    const origin = req.headers.get("origin") || "";
    const returnUrl = `${origin || 'https://wouaka-creditscore.com'}/payment/confirmation?transaction_id=${transactionId}`;

    const cinetpayPayload = {
      apikey: cinetpayApiKey,
      site_id: parseInt(cinetpaySiteId, 10),
      transaction_id: transactionId,
      amount: parseInt(String(plan.price), 10),
      currency: "XOF",
      description: `Certificat ${plan.name} - Valide ${plan.validityDays} jours`,
      notify_url: `${supabaseUrl}/functions/v1/cinetpay-webhook`,
      return_url: returnUrl,
      channels: "ALL",
      metadata: JSON.stringify({
        user_id: user.id,
        type: "certificate_subscription",
        plan_id,
        plan_name: plan.name,
        validity_days: plan.validityDays,
        recertifications_total: plan.recertifications,
        smile_id_level: plan.smileIdLevel
      }),
      customer_name: firstName || customerName,
      customer_surname: surname,
      customer_email: profile?.email || user.email || "",
      customer_phone_number: profile?.phone || "",
      customer_address: "Abidjan",
      customer_city: "Abidjan",
      customer_country: "CI",
      customer_state: "CI",
      customer_zip_code: "00225",
      lang: "FR"
    };

    console.log("[Certificate Subscribe] Appel CinetPay pour plan:", plan_id);
    
    const cinetpayResponse = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cinetpayPayload)
    });

    const contentType = cinetpayResponse.headers.get("content-type") || "";
    const responseText = await cinetpayResponse.text();
    
    console.log("[Certificate Subscribe] CinetPay response status:", cinetpayResponse.status);

    if (!cinetpayResponse.ok) {
      console.error("[Certificate Subscribe] CinetPay HTTP error:", cinetpayResponse.status, responseText);
      throw new Error(`Erreur CinetPay: HTTP ${cinetpayResponse.status}`);
    }

    if (!contentType.includes("application/json")) {
      console.error("[Certificate Subscribe] CinetPay returned non-JSON:", responseText.substring(0, 200));
      throw new Error("CinetPay a retourné une réponse invalide");
    }

    let cinetpayData;
    try {
      cinetpayData = JSON.parse(responseText);
    } catch {
      console.error("[Certificate Subscribe] Failed to parse CinetPay response");
      throw new Error("Réponse CinetPay invalide");
    }

    if (cinetpayData.code !== "201") {
      console.error("[Certificate Subscribe] Erreur CinetPay:", cinetpayData);
      throw new Error(cinetpayData.message || "Erreur CinetPay");
    }

    // Mettre à jour la transaction avec le payment_token
    await supabase
      .from("payment_transactions")
      .update({
        metadata: {
          ...transaction.metadata,
          payment_token: cinetpayData.data.payment_token
        }
      })
      .eq("id", transaction.id);

    console.log("[Certificate Subscribe] Paiement initialisé avec succès:", transactionId);

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transactionId,
        payment_url: cinetpayData.data.payment_url,
        payment_token: cinetpayData.data.payment_token,
        plan: {
          id: plan_id,
          name: plan.name,
          validity_days: plan.validityDays,
          valid_until: validUntil.toISOString()
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[Certificate Subscribe] Erreur:", error);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
