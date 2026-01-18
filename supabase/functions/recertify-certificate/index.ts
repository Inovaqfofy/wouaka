import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    // Récupérer les nouvelles preuves (optionnel)
    const body = await req.json().catch(() => ({}));
    const { proofs_snapshot } = body;

    // Vérifier l'abonnement actif
    const { data: subscription, error: subError } = await supabase
      .from("certificate_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("valid_until", new Date().toISOString())
      .order("valid_until", { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      throw new Error("Aucun abonnement actif trouvé. Veuillez souscrire à un plan.");
    }

    // Vérifier les recertifications disponibles
    const canRecertify = subscription.recertifications_total === null || 
      (subscription.recertifications_total - subscription.recertifications_used) > 0;

    if (!canRecertify) {
      throw new Error("Vous n'avez plus de recertifications disponibles sur votre abonnement actuel.");
    }

    // Récupérer le certificat actuel pour le lier
    const { data: currentCert } = await supabase
      .from("certificates")
      .select("id, recertification_number")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Récupérer le score actuel (vous pouvez adapter cette logique)
    const { data: scoreData } = await supabase
      .from("scoring_requests")
      .select("score, confidence")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Récupérer le phone trust score pour le coefficient de certitude
    const { data: phoneTrust } = await supabase
      .from("phone_trust_scores")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    // Calculer le coefficient de certitude basé sur les preuves
    let certaintyCoefficient = 0.3; // Base
    if (phoneTrust) {
      if (phoneTrust.otp_verified) certaintyCoefficient += 0.15;
      if (phoneTrust.ussd_verification_confidence >= 70) certaintyCoefficient += 0.20;
      if (phoneTrust.identity_cross_validated) certaintyCoefficient += 0.25;
      if (phoneTrust.sms_consent_given && phoneTrust.sms_transactions_count >= 20) certaintyCoefficient += 0.10;
    }
    certaintyCoefficient = Math.min(1, certaintyCoefficient);

    // Déterminer le niveau de confiance
    let trustLevel = 'insufficient';
    if (certaintyCoefficient >= 0.85) trustLevel = 'certified';
    else if (certaintyCoefficient >= 0.70) trustLevel = 'strong';
    else if (certaintyCoefficient >= 0.50) trustLevel = 'verified';
    else if (certaintyCoefficient >= 0.30) trustLevel = 'basic';

    // Générer un code de partage unique
    const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Créer le nouveau certificat
    const { data: newCertificate, error: certError } = await supabase
      .from("certificates")
      .insert({
        user_id: user.id,
        plan_id: subscription.plan_id,
        score: scoreData?.score || null,
        certainty_coefficient: certaintyCoefficient,
        trust_level: trustLevel,
        proofs_snapshot: proofs_snapshot || {},
        valid_from: new Date().toISOString(),
        valid_until: subscription.valid_until,
        recertification_of: currentCert?.id || null,
        recertification_number: (currentCert?.recertification_number || 0) + 1,
        smile_id_level: subscription.smile_id_level,
        share_code: shareCode
      })
      .select()
      .single();

    if (certError) {
      console.error("[Recertify] Erreur création certificat:", certError);
      throw new Error("Erreur lors de la création du certificat");
    }

    // Consommer une recertification si ce n'est pas illimité
    if (subscription.recertifications_total !== null) {
      await supabase
        .from("certificate_subscriptions")
        .update({
          recertifications_used: subscription.recertifications_used + 1,
          current_certificate_id: newCertificate.id
        })
        .eq("id", subscription.id);
    } else {
      await supabase
        .from("certificate_subscriptions")
        .update({ current_certificate_id: newCertificate.id })
        .eq("id", subscription.id);
    }

    // Notifier l'utilisateur
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Recertification réussie",
      message: `Votre certificat a été recertifié. Nouveau code de partage: ${shareCode}`,
      type: "success",
      action_url: "/dashboard/borrower/score"
    });

    console.log("[Recertify] Certificat créé:", newCertificate.id);

    // Calculer les recertifications restantes
    const recertificationsRemaining = subscription.recertifications_total === null 
      ? -1 // illimité
      : subscription.recertifications_total - subscription.recertifications_used - 1;

    return new Response(
      JSON.stringify({
        success: true,
        certificate: {
          id: newCertificate.id,
          score: newCertificate.score,
          certainty_coefficient: newCertificate.certainty_coefficient,
          trust_level: newCertificate.trust_level,
          valid_until: newCertificate.valid_until,
          share_code: newCertificate.share_code,
          recertification_number: newCertificate.recertification_number
        },
        recertifications_remaining: recertificationsRemaining
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[Recertify] Erreur:", error);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
