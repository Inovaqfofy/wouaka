import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface KycRequest {
  id: string;
  partner_id: string;
  customer_profile_id: string | null;
  full_name: string;
  phone_number: string | null;
  national_id: string | null;
  status: 'pending' | 'processing' | 'verified' | 'review' | 'rejected';
  identity_score: number | null;
  fraud_score: number | null;
  documents_submitted: number;
  documents_verified: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical' | null;
  risk_flags: string[] | null;
  processing_time_ms: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface KycStats {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
  inReview: number;
  averageScore: number;
}

interface UseKycRequestsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export function useKycRequests(params: UseKycRequestsParams = {}) {
  const { user } = useAuth();
  const { page = 0, pageSize = 10, search = "", status = "all" } = params;

  return useQuery({
    queryKey: ['kyc-requests', user?.id, page, pageSize, search, status],
    queryFn: async () => {
      if (!user?.id) return { requests: [], totalCount: 0, totalPages: 0 };

      let query = supabase
        .from('kyc_requests')
        .select('*', { count: 'exact' })
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      // Apply search filter
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,phone_number.ilike.%${search}%,national_id.ilike.%${search}%`);
      }

      // Apply status filter
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Apply pagination
      const from = page * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        requests: (data || []) as KycRequest[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page
      };
    },
    enabled: !!user?.id
  });
}

export function useKycStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['kyc-stats', user?.id],
    queryFn: async (): Promise<KycStats> => {
      if (!user?.id) {
        return { total: 0, verified: 0, pending: 0, rejected: 0, inReview: 0, averageScore: 0 };
      }

      const { data, error } = await supabase
        .from('kyc_requests')
        .select('status, identity_score')
        .eq('partner_id', user.id);

      if (error) throw error;

      const requests = data || [];
      const verified = requests.filter(r => r.status === 'verified').length;
      const pending = requests.filter(r => r.status === 'pending' || r.status === 'processing').length;
      const rejected = requests.filter(r => r.status === 'rejected').length;
      const inReview = requests.filter(r => r.status === 'review').length;
      
      const scores = requests.filter(r => r.identity_score !== null).map(r => r.identity_score as number);
      const averageScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      return {
        total: requests.length,
        verified,
        pending,
        rejected,
        inReview,
        averageScore
      };
    },
    enabled: !!user?.id
  });
}

interface CreateKycRequestInput {
  full_name: string;
  phone_number?: string;
  national_id?: string;
  customer_profile_id?: string;
}

export function useCreateKycRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateKycRequestInput) => {
      if (!user?.id) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from('kyc_requests')
        .insert({
          partner_id: user.id,
          full_name: input.full_name,
          phone_number: input.phone_number || null,
          national_id: input.national_id || null,
          customer_profile_id: input.customer_profile_id || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-requests'] });
      queryClient.invalidateQueries({ queryKey: ['kyc-stats'] });
      toast.success("Vérification KYC lancée");
    },
    onError: (error) => {
      toast.error("Erreur lors du lancement de la vérification");
      console.error(error);
    }
  });
}

// Hook pour générer un lien de soumission de documents
export function useGenerateSubmissionLink() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { 
      client_name: string; 
      client_email?: string; 
      client_phone?: string;
      kyc_request_id?: string;
    }) => {
      if (!user?.id) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from('document_submission_tokens')
        .insert({
          partner_id: user.id,
          client_name: input.client_name,
          client_email: input.client_email || null,
          client_phone: input.client_phone || null,
          kyc_request_id: input.kyc_request_id || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission-tokens'] });
      toast.success("Lien de soumission généré");
    },
    onError: (error) => {
      toast.error("Erreur lors de la génération du lien");
      console.error(error);
    }
  });
}
