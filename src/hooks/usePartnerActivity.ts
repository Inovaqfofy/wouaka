import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export interface ActivityItem {
  id: string;
  action: string;
  type: 'application' | 'kyc' | 'score' | 'api' | 'client';
  time: string;
  relativeTime: string;
}

export const usePartnerActivity = (limit = 10) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['partner-activity', user?.id, limit],
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!user?.id) return [];

      const activities: ActivityItem[] = [];

      // Get recent KYC requests
      const { data: kycData } = await supabase
        .from('kyc_requests')
        .select('id, full_name, status, created_at')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      kycData?.forEach(kyc => {
        const statusText = kyc.status === 'completed' ? 'validé' : 
                          kyc.status === 'rejected' ? 'rejeté' : 'créé';
        activities.push({
          id: `kyc-${kyc.id}`,
          action: `KYC ${statusText} - ${kyc.full_name}`,
          type: 'kyc',
          time: kyc.created_at,
          relativeTime: formatDistanceToNow(new Date(kyc.created_at), { addSuffix: true, locale: fr }),
        });
      });

      // Get recent scoring requests
      const { data: scoreData } = await supabase
        .from('scoring_requests')
        .select('id, score, grade, created_at, customer_profiles(external_reference)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      scoreData?.forEach(score => {
        const ref = (score.customer_profiles as { external_reference?: string } | null)?.external_reference || score.id.slice(0, 8);
        activities.push({
          id: `score-${score.id}`,
          action: `Score calculé (${score.score || '--'}) - ${ref}`,
          type: 'score',
          time: score.created_at,
          relativeTime: formatDistanceToNow(new Date(score.created_at), { addSuffix: true, locale: fr }),
        });
      });

      // Get recent API calls
      const { data: apiData } = await supabase
        .from('api_calls')
        .select('id, endpoint, method, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      apiData?.forEach(api => {
        activities.push({
          id: `api-${api.id}`,
          action: `Appel API ${api.method} ${api.endpoint}`,
          type: 'api',
          time: api.created_at,
          relativeTime: formatDistanceToNow(new Date(api.created_at), { addSuffix: true, locale: fr }),
        });
      });

      // Get recent customer profiles
      const { data: clientData } = await supabase
        .from('customer_profiles')
        .select('id, external_reference, created_at')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      clientData?.forEach(client => {
        activities.push({
          id: `client-${client.id}`,
          action: `Nouveau client - ${client.external_reference}`,
          type: 'client',
          time: client.created_at,
          relativeTime: formatDistanceToNow(new Date(client.created_at), { addSuffix: true, locale: fr }),
        });
      });

      // Sort all by time and limit
      return activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, limit);
    },
    enabled: !!user?.id,
  });
};
