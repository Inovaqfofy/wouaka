import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useAnalystStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analyst-stats', user?.id],
    queryFn: async () => {
      // Fetch pending KYC count (assigned to analyst or unassigned)
      const { count: pendingKyc } = await supabase
        .from('kyc_validations')
        .select('*', { count: 'exact', head: true })
        .or(`status.eq.pending,status.eq.in_progress`)
        .or(`assigned_analyst.eq.${user?.id},assigned_analyst.is.null`);

      // Fetch analyzed scores this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: analyzedScores } = await supabase
        .from('scoring_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      // Fetch assigned clients count
      const { count: assignedClients } = await supabase
        .from('customer_profiles')
        .select('*', { count: 'exact', head: true });

      // Calculate average processing time (mock for now)
      const avgProcessingTime = '4.2h';

      return {
        pendingKyc: pendingKyc || 0,
        analyzedScores: analyzedScores || 0,
        assignedClients: assignedClients || 0,
        avgProcessingTime,
      };
    },
    enabled: !!user,
  });
}

export function usePendingKyc() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-kyc', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_validations')
        .select(`
          id,
          user_id,
          status,
          created_at,
          overall_score,
          risk_flags,
          identity_verified,
          address_verified,
          documents_complete,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .or('status.eq.pending,status.eq.in_progress')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data?.map(kyc => ({
        id: kyc.id,
        userId: kyc.user_id,
        name: (kyc.profiles as { full_name?: string })?.full_name || 'N/A',
        email: (kyc.profiles as { email?: string })?.email || 'N/A',
        status: kyc.status,
        createdAt: kyc.created_at,
        score: kyc.overall_score,
        riskFlags: kyc.risk_flags || [],
        identityVerified: kyc.identity_verified,
        addressVerified: kyc.address_verified,
        documentsComplete: kyc.documents_complete,
      })) || [];
    },
    enabled: !!user,
  });
}

export function useAnalyzedScores(options?: { page?: number; pageSize?: number; search?: string }) {
  const { user } = useAuth();
  const page = options?.page || 0;
  const pageSize = options?.pageSize || 10;
  const search = options?.search || '';

  return useQuery({
    queryKey: ['analyzed-scores', user?.id, page, pageSize, search],
    queryFn: async () => {
      let query = supabase
        .from('scoring_requests')
        .select('*', { count: 'exact' })
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,national_id.ilike.%${search}%,company_name.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      return {
        scores: data?.map(s => ({
          id: s.id,
          name: s.full_name || s.company_name || 'N/A',
          score: s.score,
          grade: s.grade,
          riskCategory: s.risk_category,
          confidence: s.confidence,
          createdAt: s.created_at,
          processingTime: s.processing_time_ms,
        })) || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    enabled: !!user,
  });
}

export function useClientProfiles(options?: { page?: number; pageSize?: number; search?: string }) {
  const { user } = useAuth();
  const page = options?.page || 0;
  const pageSize = options?.pageSize || 10;
  const search = options?.search || '';

  return useQuery({
    queryKey: ['client-profiles', user?.id, page, pageSize, search],
    queryFn: async () => {
      let query = supabase
        .from('customer_profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('external_reference', `%${search}%`);
      }

      const { data, error, count } = await query
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      return {
        clients: data?.map(c => ({
          id: c.id,
          reference: c.external_reference,
          compositeScore: c.composite_score,
          reliabilityScore: c.reliability_score,
          stabilityScore: c.stability_score,
          riskScore: c.risk_score,
          engagementCapacity: c.engagement_capacity,
          dataSources: c.data_sources || [],
          enrichmentCount: c.enrichment_count,
          lastEnrichedAt: c.last_enriched_at,
          createdAt: c.created_at,
        })) || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    enabled: !!user,
  });
}
