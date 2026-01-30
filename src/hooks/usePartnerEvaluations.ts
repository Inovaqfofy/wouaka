import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PartnerEvaluation {
  id: string;
  clientRef: string;
  clientName: string | null;
  score: number | null;
  grade: string | null;
  riskCategory: string | null;
  confidence: number | null;
  status: string;
  date: string;
  processingTime: number | null;
  customerProfileId: string | null;
  consentActive: boolean;
  consentExpiresAt: string | null;
}

export const usePartnerEvaluations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['partner-evaluations', user?.id],
    queryFn: async (): Promise<PartnerEvaluation[]> => {
      if (!user?.id) return [];

      // Join with data_consents to filter by active consent
      const { data, error } = await supabase
        .from('scoring_requests')
        .select(`
          id,
          score,
          grade,
          risk_category,
          confidence,
          status,
          created_at,
          processing_time_ms,
          customer_profile_id,
          customer_profiles (
            external_reference,
            identity_data
          ),
          data_consents!scoring_requests_consent_id_fkey (
            id,
            consent_expires_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching evaluations:', error);
        return [];
      }

      const now = new Date().toISOString();

      return (data || []).map(ev => {
        const profile = ev.customer_profiles as { external_reference?: string; identity_data?: { full_name?: string } } | null;
        const consent = ev.data_consents as { id?: string; consent_expires_at?: string } | null;
        const consentActive = consent?.consent_expires_at ? consent.consent_expires_at > now : true;
        
        return {
          id: ev.id,
          clientRef: profile?.external_reference || ev.id.slice(0, 8),
          clientName: profile?.identity_data?.full_name || null,
          score: ev.score,
          grade: ev.grade,
          riskCategory: ev.risk_category,
          confidence: ev.confidence,
          status: ev.status || 'pending',
          date: ev.created_at,
          processingTime: ev.processing_time_ms,
          customerProfileId: ev.customer_profile_id,
          consentActive,
          consentExpiresAt: consent?.consent_expires_at || null,
        };
      });
    },
    enabled: !!user?.id,
  });
};

export const usePartnerEvaluationStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['partner-evaluation-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, avgScore: 0, thisMonth: 0, pending: 0 };

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Get all evaluations
      const { data: all } = await supabase
        .from('scoring_requests')
        .select('score, status, created_at')
        .eq('user_id', user.id);

      if (!all) return { total: 0, avgScore: 0, thisMonth: 0, pending: 0 };

      const scores = all.filter(e => e.score !== null).map(e => e.score as number);
      const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      const thisMonth = all.filter(e => e.created_at >= monthStart).length;
      const pending = all.filter(e => e.status === 'pending' || e.status === 'processing').length;

      return {
        total: all.length,
        avgScore,
        thisMonth,
        pending,
      };
    },
    enabled: !!user?.id,
  });
};
