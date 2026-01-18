import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface TrialStatus {
  isTrialing: boolean;
  trialDaysLeft: number;
  trialEndDate: string | null;
  isExpired: boolean;
  canStartTrial: boolean;
}

/**
 * Hook pour gérer l'essai gratuit des partenaires
 */
export function useTrialSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer le status du trial
  const trialQuery = useQuery({
    queryKey: ["trial-status", user?.id],
    queryFn: async (): Promise<TrialStatus> => {
      if (!user?.id) throw new Error("Non authentifié");

      // Récupérer l'abonnement actuel
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("status, trial_start, trial_end, plan_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // Aucun abonnement = peut démarrer un trial
      if (!subscription) {
        return {
          isTrialing: false,
          trialDaysLeft: 0,
          trialEndDate: null,
          isExpired: false,
          canStartTrial: true,
        };
      }

      const isTrialing = subscription.status === "trialing";
      const trialEnd = subscription.trial_end
        ? new Date(subscription.trial_end)
        : null;
      const now = new Date();

      const trialDaysLeft = trialEnd
        ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000))
        : 0;

      const isExpired = isTrialing && trialDaysLeft <= 0;

      return {
        isTrialing,
        trialDaysLeft,
        trialEndDate: subscription.trial_end,
        isExpired,
        canStartTrial: false, // Déjà un abonnement
      };
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });

  // Démarrer un essai gratuit
  const startTrial = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Non authentifié");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscriptions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_trial: true,
          }),
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Erreur lors de l'activation de l'essai");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trial-status"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Essai gratuit activé ! Vous avez 14 jours pour tester l'API.");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Convertir le trial en abonnement payant
  const convertTrial = useMutation({
    mutationFn: async (planId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Non authentifié");
      }

      // Récupérer l'UUID du plan
      const { data: plan } = await supabase
        .from("subscription_plans")
        .select("id")
        .eq("slug", planId)
        .single();

      if (!plan) {
        throw new Error("Plan non trouvé");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscriptions`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan_id: plan.id,
            metadata: { converted_from_trial: true },
          }),
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Erreur lors de la conversion");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trial-status"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Abonnement activé avec succès !");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    ...trialQuery.data,
    isLoading: trialQuery.isLoading,
    isError: trialQuery.isError,
    startTrial: startTrial.mutate,
    isStartingTrial: startTrial.isPending,
    convertTrial: convertTrial.mutate,
    isConverting: convertTrial.isPending,
    refetch: trialQuery.refetch,
  };
}
