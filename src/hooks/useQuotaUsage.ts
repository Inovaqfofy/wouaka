import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface QuotaUsage {
  plan: {
    name: string;
    wScoreLimit: number;
    wKycLimit: number;
    apiCallsLimit: number;
  };
  usage: {
    wScoreUsed: number;
    wKycUsed: number;
    apiCallsUsed: number;
  };
  remaining: {
    wScore: number;
    wKyc: number;
    apiCalls: number;
  };
  percentages: {
    wScore: number;
    wKyc: number;
    apiCalls: number;
  };
  periodStart: string;
  periodEnd: string;
}

// Plan limits based on pricing page
const PLAN_LIMITS: Record<string, { wScore: number; wKyc: number; apiCalls: number }> = {
  free: { wScore: 50, wKyc: 10, apiCalls: 100 },
  starter: { wScore: 500, wKyc: 100, apiCalls: 5000 },
  pro: { wScore: 2000, wKyc: 500, apiCalls: 20000 },
  enterprise: { wScore: 10000, wKyc: 2000, apiCalls: 100000 },
};

export const useQuotaUsage = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quota-usage', user?.id],
    queryFn: async (): Promise<QuotaUsage> => {
      if (!user?.id) throw new Error("User not authenticated");

      // Get current subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_id, current_period_start, current_period_end')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      // Get plan details
      let planName = 'free';
      if (subscription?.plan_id) {
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('name')
          .eq('id', subscription.plan_id)
          .maybeSingle();
        planName = plan?.name?.toLowerCase() || 'free';
      }

      const limits = PLAN_LIMITS[planName] || PLAN_LIMITS.free;

      // Calculate period dates
      const now = new Date();
      const periodStart = subscription?.current_period_start || 
        new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = subscription?.current_period_end || 
        new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      // Count W-SCORE requests this period
      const { count: wScoreCount } = await supabase
        .from('scoring_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      // Count W-KYC requests this period
      const { count: wKycCount } = await supabase
        .from('kyc_requests')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', user.id)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      // Count API calls this period
      const { count: apiCount } = await supabase
        .from('api_calls')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      const wScoreUsed = wScoreCount || 0;
      const wKycUsed = wKycCount || 0;
      const apiCallsUsed = apiCount || 0;

      return {
        plan: {
          name: planName.charAt(0).toUpperCase() + planName.slice(1),
          wScoreLimit: limits.wScore,
          wKycLimit: limits.wKyc,
          apiCallsLimit: limits.apiCalls,
        },
        usage: {
          wScoreUsed,
          wKycUsed,
          apiCallsUsed,
        },
        remaining: {
          wScore: Math.max(0, limits.wScore - wScoreUsed),
          wKyc: Math.max(0, limits.wKyc - wKycUsed),
          apiCalls: Math.max(0, limits.apiCalls - apiCallsUsed),
        },
        percentages: {
          wScore: Math.min(100, (wScoreUsed / limits.wScore) * 100),
          wKyc: Math.min(100, (wKycUsed / limits.wKyc) * 100),
          apiCalls: Math.min(100, (apiCallsUsed / limits.apiCalls) * 100),
        },
        periodStart,
        periodEnd,
      };
    },
    enabled: !!user?.id,
  });
};
