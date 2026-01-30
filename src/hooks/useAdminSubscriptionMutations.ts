import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type PaymentMethod = "check" | "bank_transfer" | "promo" | "cash" | "other";
export type SubscriptionType = "borrower" | "partner";

export interface ManualSubscriptionParams {
  userId: string;
  type: SubscriptionType;
  planId: string;
  planSlug: string;
  planName: string;
  amount: number;
  customEndDate?: Date;
  customValidityDays?: number;
  customLimits?: {
    recertifications?: number;
    maxFreeShares?: number;
    dossiers?: number;
  };
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  adminNote?: string;
  sendConfirmationEmail?: boolean;
}

export interface UpdateSubscriptionQuotasParams {
  subscriptionId: string;
  type: SubscriptionType;
  newEndDate?: Date;
  additionalQuotas?: {
    recertifications?: number;
    maxFreeShares?: number;
    dossiers?: number;
  };
  adminNote?: string;
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  check: "Chèque",
  bank_transfer: "Virement bancaire",
  promo: "Offre promotionnelle",
  cash: "Espèces",
  other: "Autre",
};

export const useCreateManualSubscription = () => {
  const queryClient = useQueryClient();
  const { user: adminUser } = useAuth();

  return useMutation({
    mutationFn: async (params: ManualSubscriptionParams) => {
      if (!adminUser?.id) throw new Error("Admin non authentifié");

      const metadata = {
        granted_by: adminUser.id,
        grant_type: "manual",
        payment_method: params.paymentMethod,
        payment_method_label: PAYMENT_METHOD_LABELS[params.paymentMethod],
        payment_reference: params.paymentReference || null,
        admin_note: params.adminNote || null,
        created_at: new Date().toISOString(),
      };

      let subscriptionId: string;
      const now = new Date();

      if (params.type === "borrower") {
        // For borrower: use certificate_subscriptions
        const validityDays = params.customValidityDays || 30;
        const validUntil = params.customEndDate || new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
          .from("certificate_subscriptions")
          .insert({
            user_id: params.userId,
            plan_id: params.planSlug,
            validity_days: validityDays,
            valid_from: now.toISOString(),
            valid_until: validUntil.toISOString(),
            amount_paid: params.amount,
            recertifications_total: params.customLimits?.recertifications ?? null,
            recertifications_used: 0,
            max_free_shares: params.customLimits?.maxFreeShares ?? null,
            shares_used: 0,
            status: "active",
            source: "manual_grant",
            payment_transaction_id: null,
          })
          .select("id")
          .single();

        if (error) throw error;
        subscriptionId = data.id;

        // Update subscription with metadata (via separate update since metadata might not be a column)
        // Instead we'll log this in audit_logs
      } else {
        // For partner: use subscriptions table
        const periodEnd = params.customEndDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Get plan UUID from subscription_plans
        const { data: planData } = await supabase
          .from("subscription_plans")
          .select("id")
          .eq("slug", params.planSlug)
          .single();

        const planUuid = planData?.id || params.planId;

        const { data, error } = await supabase
          .from("subscriptions")
          .insert({
            user_id: params.userId,
            plan_id: planUuid,
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            metadata: metadata,
          })
          .select("id")
          .single();

        if (error) throw error;
        subscriptionId = data.id;
      }

      // Create audit log entry (non-blocking - don't fail if this fails)
      const { error: auditError } = await supabase.from("audit_logs").insert({
        user_id: adminUser.id,
        action: "manual_subscription_grant",
        entity_type: params.type === "borrower" ? "certificate_subscription" : "subscription",
        entity_id: subscriptionId,
        new_values: {
          target_user_id: params.userId,
          plan_id: params.planId,
          plan_slug: params.planSlug,
          plan_name: params.planName,
          amount: params.amount,
          payment_method: params.paymentMethod,
          payment_reference: params.paymentReference,
          custom_limits: params.customLimits,
          valid_until: params.customEndDate?.toISOString(),
        },
        metadata: {
          admin_note: params.adminNote,
          grant_type: "manual",
        },
      });

      if (auditError) {
        console.warn("Audit log creation failed (non-blocking):", auditError);
      }

      // Create invoice if amount > 0 (non-blocking - don't fail if this fails)
      if (params.amount > 0) {
        // Generate invoice number
        const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
        const randomSuffix = Math.floor(Math.random() * 99999).toString().padStart(5, "0");
        const invoiceNumber = `WOK-${yearMonth}-${randomSuffix}`;

        const { error: invoiceError } = await supabase.from("invoices").insert({
          user_id: params.userId,
          invoice_number: invoiceNumber,
          amount: params.amount,
          currency: "XOF",
          status: "paid",
          issued_at: now.toISOString(),
          paid_at: now.toISOString(),
          metadata: {
            plan_name: params.planName,
            payment_method: params.paymentMethod,
            payment_reference: params.paymentReference,
            granted_by: adminUser.id,
            manual_grant: true,
          },
        });

        if (invoiceError) {
          console.warn("Invoice creation failed (non-blocking):", invoiceError);
        }
      }

      // Send confirmation email if requested
      if (params.sendConfirmationEmail) {
        try {
          // Get user email
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", params.userId)
            .single();

          if (userProfile?.email) {
            await supabase.functions.invoke("send-automated-email", {
              body: {
                template: "subscription_activated",
                to: userProfile.email,
                data: {
                  fullName: userProfile.full_name || "Cher utilisateur",
                  planName: params.planName,
                  validUntil: params.customEndDate?.toLocaleDateString("fr-FR") || 
                    new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR"),
                  paymentMethod: PAYMENT_METHOD_LABELS[params.paymentMethod],
                },
                trigger_source: "admin_manual_grant",
              },
            });
          }
        } catch (emailError) {
          console.warn("Failed to send confirmation email:", emailError);
        }
      }

      return { subscriptionId, type: params.type };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      toast.success("Forfait attribué avec succès");
    },
    onError: (error: Error) => {
      console.error("Manual subscription error:", error);
      toast.error(`Erreur: ${error.message}`);
    },
  });
};

export const useUpdateSubscriptionQuotas = () => {
  const queryClient = useQueryClient();
  const { user: adminUser } = useAuth();

  return useMutation({
    mutationFn: async (params: UpdateSubscriptionQuotasParams) => {
      if (!adminUser?.id) throw new Error("Admin non authentifié");

      const updates: Record<string, unknown> = {};

      if (params.type === "borrower") {
        if (params.newEndDate) {
          updates.valid_until = params.newEndDate.toISOString();
        }
        if (params.additionalQuotas?.recertifications !== undefined) {
          // Get current value and add
          const { data: current } = await supabase
            .from("certificate_subscriptions")
            .select("recertifications_total")
            .eq("id", params.subscriptionId)
            .single();
          
          updates.recertifications_total = (current?.recertifications_total || 0) + params.additionalQuotas.recertifications;
        }
        if (params.additionalQuotas?.maxFreeShares !== undefined) {
          const { data: current } = await supabase
            .from("certificate_subscriptions")
            .select("max_free_shares")
            .eq("id", params.subscriptionId)
            .single();
          
          updates.max_free_shares = (current?.max_free_shares || 0) + params.additionalQuotas.maxFreeShares;
        }

        const { error } = await supabase
          .from("certificate_subscriptions")
          .update(updates)
          .eq("id", params.subscriptionId);

        if (error) throw error;
      } else {
        if (params.newEndDate) {
          updates.current_period_end = params.newEndDate.toISOString();
        }

        // For partner subscriptions, update metadata to reflect additional quotas
        if (params.additionalQuotas) {
          const { data: current } = await supabase
            .from("subscriptions")
            .select("metadata")
            .eq("id", params.subscriptionId)
            .single();

          const currentMetadata = (current?.metadata as Record<string, unknown>) || {};
          const currentBonusQuotas = (currentMetadata.bonus_quotas as Record<string, number>) || {};

          updates.metadata = {
            ...currentMetadata,
            bonus_quotas: {
              dossiers: (currentBonusQuotas.dossiers || 0) + (params.additionalQuotas.dossiers || 0),
            },
            last_quota_update: new Date().toISOString(),
            updated_by: adminUser.id,
          };
        }

        const { error } = await supabase
          .from("subscriptions")
          .update(updates)
          .eq("id", params.subscriptionId);

        if (error) throw error;
      }

      // Create audit log
      await supabase.from("audit_logs").insert({
        user_id: adminUser.id,
        action: "subscription_quotas_updated",
        entity_type: params.type === "borrower" ? "certificate_subscription" : "subscription",
        entity_id: params.subscriptionId,
        new_values: {
          new_end_date: params.newEndDate?.toISOString(),
          additional_quotas: params.additionalQuotas,
        },
        metadata: {
          admin_note: params.adminNote,
        },
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast.success("Quotas mis à jour avec succès");
    },
    onError: (error: Error) => {
      console.error("Update quotas error:", error);
      toast.error(`Erreur: ${error.message}`);
    },
  });
};
