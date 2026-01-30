import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Interface normalisée pour les limites de plan
 * SOURCE UNIQUE DE VÉRITÉ - récupérée depuis subscription_plans.limits
 */
export interface PlanLimits {
  scores_per_month: number;
  kyc_per_month: number;
  api_calls_per_month: number;
  dossiers_per_month?: number;
}

export interface QuotaUsage {
  plan: {
    id: string;
    name: string;
    slug: string;
    limits: PlanLimits;
  };
  usage: {
    scoresUsed: number;
    kycUsed: number;
    apiCallsUsed: number;
  };
  remaining: {
    scores: number;
    kyc: number;
    apiCalls: number;
  };
  percentages: {
    scores: number;
    kyc: number;
    apiCalls: number;
  };
  periodStart: string;
  periodEnd: string;
  isUnlimited: boolean;
}

// Limites par défaut si aucun plan n'est trouvé (plan gratuit implicite)
const DEFAULT_LIMITS: PlanLimits = {
  scores_per_month: 5,
  kyc_per_month: 2,
  api_calls_per_month: 50,
  dossiers_per_month: 5,
};

/**
 * Hook centralisé pour récupérer l'usage des quotas
 * Récupère TOUTES les données depuis la base de données
 * Aucune constante hardcodée - la DB est la source unique de vérité
 */
export const useQuotaUsage = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quota-usage', user?.id],
    queryFn: async (): Promise<QuotaUsage> => {
      if (!user?.id) throw new Error("User not authenticated");

      // 1. Récupérer l'abonnement actif avec le plan
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          plan_id,
          current_period_start,
          current_period_end,
          status,
          plan:subscription_plans (
            id,
            name,
            slug,
            limits
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        console.error('Error fetching subscription:', subError);
      }

      // 2. Extraire les limites du plan depuis la base
      let planLimits: PlanLimits = DEFAULT_LIMITS;
      let planInfo = {
        id: 'free',
        name: 'Gratuit',
        slug: 'free',
        limits: DEFAULT_LIMITS,
      };

      if (subscription?.plan) {
        const dbLimits = subscription.plan.limits as Record<string, number> | null;
        
        planLimits = {
          scores_per_month: dbLimits?.scores_per_month ?? DEFAULT_LIMITS.scores_per_month,
          kyc_per_month: dbLimits?.kyc_per_month ?? DEFAULT_LIMITS.kyc_per_month,
          api_calls_per_month: dbLimits?.api_calls_per_month ?? DEFAULT_LIMITS.api_calls_per_month,
          dossiers_per_month: dbLimits?.dossiers_per_month,
        };

        planInfo = {
          id: subscription.plan.id,
          name: subscription.plan.name,
          slug: subscription.plan.slug,
          limits: planLimits,
        };
      }

      // 3. Calculer les dates de période
      const now = new Date();
      const periodStart = subscription?.current_period_start || 
        new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = subscription?.current_period_end || 
        new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      // 4. Compter l'usage réel depuis la base
      const [scoresResult, kycResult, apiResult] = await Promise.all([
        // Scoring requests
        supabase
          .from('scoring_requests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd),
        
        // KYC requests
        supabase
          .from('kyc_requests')
          .select('*', { count: 'exact', head: true })
          .eq('partner_id', user.id)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd),
        
        // API calls
        supabase
          .from('api_calls')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd),
      ]);

      const scoresUsed = scoresResult.count || 0;
      const kycUsed = kycResult.count || 0;
      const apiCallsUsed = apiResult.count || 0;

      // 5. Vérifier si le plan est illimité (-1 signifie illimité)
      const isUnlimited = planLimits.scores_per_month === -1;

      // 6. Calculer les valeurs restantes et pourcentages
      const calculateRemaining = (used: number, limit: number): number => {
        if (limit === -1) return Infinity; // Illimité
        return Math.max(0, limit - used);
      };

      const calculatePercentage = (used: number, limit: number): number => {
        if (limit === -1) return 0; // Illimité = toujours 0%
        if (limit === 0) return 100;
        return Math.min(100, (used / limit) * 100);
      };

      return {
        plan: planInfo,
        usage: {
          scoresUsed,
          kycUsed,
          apiCallsUsed,
        },
        remaining: {
          scores: calculateRemaining(scoresUsed, planLimits.scores_per_month),
          kyc: calculateRemaining(kycUsed, planLimits.kyc_per_month),
          apiCalls: calculateRemaining(apiCallsUsed, planLimits.api_calls_per_month),
        },
        percentages: {
          scores: calculatePercentage(scoresUsed, planLimits.scores_per_month),
          kyc: calculatePercentage(kycUsed, planLimits.kyc_per_month),
          apiCalls: calculatePercentage(apiCallsUsed, planLimits.api_calls_per_month),
        },
        periodStart,
        periodEnd,
        isUnlimited,
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 secondes
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook helper pour formater l'affichage des limites
 */
export const formatLimit = (limit: number): string => {
  if (limit === -1) return "Illimité";
  return limit.toLocaleString('fr-FR');
};

/**
 * Hook helper pour déterminer le niveau d'alerte basé sur le pourcentage
 */
export const getQuotaAlertLevel = (percentage: number): 'safe' | 'warning' | 'critical' => {
  if (percentage >= 90) return 'critical';
  if (percentage >= 75) return 'warning';
  return 'safe';
};
