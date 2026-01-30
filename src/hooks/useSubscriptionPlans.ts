import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BorrowerPlan, PartnerPlan } from "@/lib/pricing-plans";

// Type étendu avec UUID de la base
export interface DBBorrowerPlan extends BorrowerPlan {
  uuid?: string;
}

export interface DBPartnerPlan extends PartnerPlan {
  uuid?: string;
}

interface SyncPlansResponse {
  success: boolean;
  plans?: (DBBorrowerPlan | DBPartnerPlan)[];
  plan?: Record<string, unknown>;
  error?: string;
  message?: string;
}

/**
 * Hook pour récupérer et gérer les plans depuis la base de données
 */
export function useSubscriptionPlans(planType?: 'borrower' | 'partner') {
  const queryClient = useQueryClient();

  // Récupérer les plans depuis l'edge function
  const plansQuery = useQuery({
    queryKey: ["subscription-plans", planType],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Non authentifié");
      }

      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-plans`);
      url.searchParams.set("action", "list");
      if (planType) {
        url.searchParams.set("type", planType);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      const data: SyncPlansResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Erreur lors de la récupération des plans");
      }

      return data.plans || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mettre à jour un plan
  const updatePlan = useMutation({
    mutationFn: async ({ slug, planType, updates }: { 
      slug: string; 
      planType: 'borrower' | 'partner'; 
      updates: Partial<BorrowerPlan | PartnerPlan>;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Non authentifié");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-plans`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ slug, planType, ...updates }),
        }
      );

      const data: SyncPlansResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      return data.plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Plan mis à jour avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Créer un nouveau plan
  const createPlan = useMutation({
    mutationFn: async ({ planType, planData }: { 
      planType: 'borrower' | 'partner'; 
      planData: Partial<BorrowerPlan | PartnerPlan>;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Non authentifié");
      }

      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-plans`);
      url.searchParams.set("action", "create");

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType, ...planData }),
      });

      const data: SyncPlansResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      return data.plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Plan créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Désactiver un plan
  const deletePlan = useMutation({
    mutationFn: async (slug: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Non authentifié");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-plans`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ slug }),
        }
      );

      const data: SyncPlansResponse = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Erreur lors de la désactivation");
      }

      return data.message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Plan désactivé");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    plans: plansQuery.data || [],
    isLoading: plansQuery.isLoading,
    isError: plansQuery.isError,
    error: plansQuery.error,
    refetch: plansQuery.refetch,
    updatePlan,
    createPlan,
    deletePlan,
  };
}

/**
 * Hook séparé pour les plans emprunteur
 */
export function useBorrowerPlans() {
  const { plans, ...rest } = useSubscriptionPlans('borrower');
  return {
    plans: plans as DBBorrowerPlan[],
    ...rest,
  };
}

/**
 * Hook séparé pour les plans partenaire
 */
export function usePartnerPlans() {
  const { plans, ...rest } = useSubscriptionPlans('partner');
  return {
    plans: plans as DBPartnerPlan[],
    ...rest,
  };
}
