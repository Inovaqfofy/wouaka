import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Type definitions for plans
interface BorrowerPlanInput {
  slug: string;
  name: string;
  description: string;
  price: number;
  validityDays: number;
  recertifications: number | null;
  smileIdLevel: 'none' | 'basic' | 'biometric';
  maxFreeShares: number | null;
  sharePrice: number;
  features: string[];
  highlight?: string;
  popular: boolean;
}

interface PartnerPlanInput {
  slug: string;
  name: string;
  description: string;
  price: number | null;
  period: string;
  quotas: { dossiers: number | null };
  features: string[];
  notIncluded: string[];
  cta: string;
  popular: boolean;
  isCustom: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth: Vérifier que l'utilisateur est admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Non authentifié");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Vérifier le rôle admin (SUPER_ADMIN en majuscules dans la DB)
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = userRoles?.some(r => 
      r.role === 'SUPER_ADMIN' || r.role === 'admin' || r.role === 'super_admin'
    );
    if (!isAdmin) {
      throw new Error("Accès réservé aux administrateurs");
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    // ===== LIST: Récupérer tous les plans depuis la DB =====
    if (req.method === "GET" && action === "list") {
      const planType = url.searchParams.get("type"); // 'borrower' | 'partner' | null
      
      let query = supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price_monthly", { ascending: true });

      if (planType) {
        query = query.eq("plan_type", planType);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transformer les données pour correspondre au format frontend
      const plans = data.map(plan => {
        if (plan.plan_type === 'borrower') {
          return {
            id: plan.slug,
            uuid: plan.id,
            name: plan.name,
            description: plan.description,
            price: plan.price_monthly,
            priceDisplay: new Intl.NumberFormat("fr-FR").format(plan.price_monthly),
            currency: plan.currency,
            validityDays: plan.validity_days,
            recertifications: plan.recertifications,
            smileIdIncluded: plan.smile_id_level || 'none',
            maxFreeShares: plan.max_free_shares,
            sharePrice: plan.share_price || 0,
            features: plan.features || [],
            highlight: plan.highlight,
            popular: plan.popular || false,
          };
        } else {
          return {
            id: plan.slug,
            uuid: plan.id,
            name: plan.name,
            description: plan.description,
            price: plan.price_monthly || null,
            priceDisplay: plan.price_monthly ? new Intl.NumberFormat("fr-FR").format(plan.price_monthly) : "Sur mesure",
            currency: plan.currency,
            period: plan.period || "/mois",
            quotas: plan.quotas || { dossiers: null },
            features: plan.features || [],
            notIncluded: plan.not_included || [],
            cta: plan.cta || "Sélectionner",
            popular: plan.popular || false,
            isCustom: plan.is_custom || false,
          };
        }
      });

      return new Response(
        JSON.stringify({ success: true, plans }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== UPDATE: Mettre à jour un plan =====
    if (req.method === "PUT" || req.method === "PATCH") {
      const body = await req.json();
      const { slug, planType, ...updates } = body;

      if (!slug) {
        throw new Error("Slug du plan requis");
      }

      console.log("[Sync Plans] Updating plan:", slug, updates);

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Mapper les champs selon le type
      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price_monthly = updates.price;
      if (updates.features) updateData.features = updates.features;
      if (updates.popular !== undefined) updateData.popular = updates.popular;

      if (planType === 'borrower') {
        if (updates.validityDays) updateData.validity_days = updates.validityDays;
        if (updates.recertifications !== undefined) updateData.recertifications = updates.recertifications;
        if (updates.smileIdLevel) updateData.smile_id_level = updates.smileIdLevel;
        if (updates.maxFreeShares !== undefined) updateData.max_free_shares = updates.maxFreeShares;
        if (updates.sharePrice !== undefined) updateData.share_price = updates.sharePrice;
        if (updates.highlight !== undefined) updateData.highlight = updates.highlight;
      } else {
        if (updates.quotas) updateData.quotas = updates.quotas;
        if (updates.notIncluded) updateData.not_included = updates.notIncluded;
        if (updates.cta) updateData.cta = updates.cta;
        if (updates.isCustom !== undefined) updateData.is_custom = updates.isCustom;
        if (updates.period) updateData.period = updates.period;
      }

      const { data, error } = await supabase
        .from("subscription_plans")
        .update(updateData)
        .eq("slug", slug)
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "plan_updated",
        entity_type: "subscription_plan",
        entity_id: data.id,
        details: { slug, updates },
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
      });

      return new Response(
        JSON.stringify({ success: true, plan: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== CREATE: Créer un nouveau plan =====
    if (req.method === "POST" && action === "create") {
      const body = await req.json();
      const { planType, ...planData } = body as { planType: 'borrower' | 'partner' } & (BorrowerPlanInput | PartnerPlanInput);

      if (!planType || !planData.slug || !planData.name) {
        throw new Error("Type, slug et nom du plan requis");
      }

      console.log("[Sync Plans] Creating plan:", planData.slug, planType);

      const insertData: Record<string, unknown> = {
        slug: planData.slug,
        name: planData.name,
        description: planData.description || "",
        currency: "FCFA",
        plan_type: planType,
        features: planData.features || [],
        popular: planData.popular || false,
        is_active: true,
      };

      if (planType === 'borrower') {
        const borrowerData = planData as BorrowerPlanInput;
        insertData.price_monthly = borrowerData.price;
        insertData.price_yearly = borrowerData.price;
        insertData.validity_days = borrowerData.validityDays;
        insertData.recertifications = borrowerData.recertifications;
        insertData.smile_id_level = borrowerData.smileIdLevel || 'none';
        insertData.max_free_shares = borrowerData.maxFreeShares;
        insertData.share_price = borrowerData.sharePrice || 0;
        insertData.highlight = borrowerData.highlight;
      } else {
        const partnerData = planData as PartnerPlanInput;
        insertData.price_monthly = partnerData.price || 0;
        insertData.price_yearly = (partnerData.price || 0) * 10;
        insertData.period = partnerData.period || "/mois";
        insertData.quotas = partnerData.quotas || {};
        insertData.not_included = partnerData.notIncluded || [];
        insertData.cta = partnerData.cta || "Sélectionner";
        insertData.is_custom = partnerData.isCustom || false;
        insertData.limits = { dossiers_per_month: partnerData.quotas?.dossiers || -1 };
      }

      const { data, error } = await supabase
        .from("subscription_plans")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "plan_created",
        entity_type: "subscription_plan",
        entity_id: data.id,
        details: { planType, planData },
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
      });

      return new Response(
        JSON.stringify({ success: true, plan: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== DELETE: Désactiver un plan =====
    if (req.method === "DELETE") {
      const { slug } = await req.json();

      if (!slug) {
        throw new Error("Slug du plan requis");
      }

      // Vérifier si des abonnements actifs utilisent ce plan
      const { data: activeSubscriptions } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("plan_id", slug)
        .eq("status", "active")
        .limit(1);

      const { data: activeCertSubs } = await supabase
        .from("certificate_subscriptions")
        .select("id")
        .eq("plan_id", slug)
        .eq("status", "active")
        .limit(1);

      if ((activeSubscriptions?.length || 0) > 0 || (activeCertSubs?.length || 0) > 0) {
        throw new Error("Ce plan a des abonnements actifs. Désactivez-le plutôt que de le supprimer.");
      }

      console.log("[Sync Plans] Disabling plan:", slug);

      const { data, error } = await supabase
        .from("subscription_plans")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("slug", slug)
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "plan_disabled",
        entity_type: "subscription_plan",
        entity_id: data.id,
        details: { slug },
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
      });

      return new Response(
        JSON.stringify({ success: true, message: "Plan désactivé" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Action non supportée: ${action}`);

  } catch (error: unknown) {
    console.error("[Sync Plans] Erreur:", error);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
