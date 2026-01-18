import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  currency: string;
  features: string[];
  limits: {
    scores_per_month: number;
    kyc_per_month: number;
    api_calls_per_month: number;
  };
  is_active: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: string;
  current_period_start: string;
  current_period_end: string | null;
  canceled_at: string | null;
  plan?: SubscriptionPlan;
}

export interface SubscriptionUsage {
  scoresUsed: number;
  kycUsed: number;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch available plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : [],
        limits: plan.limits as { scores_per_month: number; kyc_per_month: number; api_calls_per_month: number } || { scores_per_month: 0, kyc_per_month: 0, api_calls_per_month: 0 }
      })) as SubscriptionPlan[];
    },
  });

  // Fetch user's current subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      
      if (data && data.plan) {
        const planData = data.plan;
        const subscription: Subscription = {
          id: data.id,
          user_id: data.user_id,
          plan_id: data.plan_id,
          status: data.status,
          current_period_start: data.current_period_start,
          current_period_end: data.current_period_end,
          canceled_at: data.canceled_at,
          plan: {
            id: planData.id,
            name: planData.name,
            description: planData.description,
            price_monthly: planData.price_monthly,
            price_yearly: planData.price_yearly,
            currency: planData.currency,
            features: Array.isArray(planData.features) ? planData.features as string[] : [],
            limits: (planData.limits as { scores_per_month: number; kyc_per_month: number; api_calls_per_month: number }) || { scores_per_month: 0, kyc_per_month: 0, api_calls_per_month: 0 },
            is_active: planData.is_active ?? true
          }
        };
        return subscription;
      }
      
      if (data) {
        return {
          id: data.id,
          user_id: data.user_id,
          plan_id: data.plan_id,
          status: data.status,
          current_period_start: data.current_period_start,
          current_period_end: data.current_period_end,
          canceled_at: data.canceled_at,
        } as Subscription;
      }
      
      return null;
    },
    enabled: !!user?.id,
  });

  // Fetch usage (scoring requests + KYC requests count for current month)
  const { data: usage = { scoresUsed: 0, kycUsed: 0 } } = useQuery({
    queryKey: ['subscription-usage', user?.id],
    queryFn: async (): Promise<SubscriptionUsage> => {
      if (!user?.id) return { scoresUsed: 0, kycUsed: 0 };

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Fetch scoring requests count
      const { count: scoresCount, error: scoresError } = await supabase
        .from('scoring_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (scoresError) throw scoresError;

      // Fetch KYC requests count
      const { count: kycCount, error: kycError } = await supabase
        .from('kyc_requests')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (kycError) throw kycError;
      
      return { 
        scoresUsed: scoresCount || 0,
        kycUsed: kycCount || 0
      };
    },
    enabled: !!user?.id,
  });

  // Subscribe to a plan
  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      // Check if user already has a subscription
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing subscription
        const { data, error } = await supabase
          .from('subscriptions')
          .update({
            plan_id: planId,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
            canceled_at: null,
          })
          .eq('user_id', user.id)
          .select('*, plan:subscription_plans(*)')
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new subscription
        const { data, error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_id: planId,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .select('*, plan:subscription_plans(*)')
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      const planName = plans.find(p => p.id === data.plan_id)?.name || 'le plan';
      toast.success(`Abonnement ${planName} activé avec succès !`);
    },
    onError: (error) => {
      console.error('Subscription error:', error);
      toast.error("Erreur lors du changement d'abonnement");
    },
  });

  // Cancel subscription
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Abonnement annulé');
    },
    onError: (error) => {
      console.error('Cancel error:', error);
      toast.error("Erreur lors de l'annulation");
    },
  });

  return {
    plans,
    subscription,
    usage,
    isLoading: plansLoading || subscriptionLoading,
    subscribe: subscribeMutation.mutate,
    isSubscribing: subscribeMutation.isPending,
    cancel: cancelMutation.mutate,
    isCanceling: cancelMutation.isPending,
  };
};
