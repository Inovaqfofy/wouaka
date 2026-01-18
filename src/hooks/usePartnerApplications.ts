import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface PartnerApplication {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  status: string;
  score: number | null;
  score_grade: string | null;
  risk_level: string | null;
  created_at: string;
  reviewed_at: string | null;
  product_name: string;
  product_id: string;
  kyc_status: string | null;
}

export const usePartnerApplications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const applicationsQuery = useQuery({
    queryKey: ['partner-applications', user?.id],
    queryFn: async (): Promise<PartnerApplication[]> => {
      if (!user?.id) return [];

      // Get products owned by this partner
      const { data: products } = await supabase
        .from('marketplace_products')
        .select('id')
        .eq('provider_id', user.id);

      if (!products || products.length === 0) return [];

      const productIds = products.map(p => p.id);

      // Get applications for these products
      const { data, error } = await supabase
        .from('loan_applications')
        .select(`
          id,
          applicant_name,
          applicant_email,
          applicant_phone,
          status,
          score,
          score_grade,
          risk_level,
          created_at,
          reviewed_at,
          kyc_status,
          product_id,
          marketplace_products (
            name
          )
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        return [];
      }

      return (data || []).map(app => ({
        id: app.id,
        applicant_name: app.applicant_name,
        applicant_email: app.applicant_email,
        applicant_phone: app.applicant_phone,
        status: app.status || 'pending',
        score: app.score,
        score_grade: app.score_grade,
        risk_level: app.risk_level,
        created_at: app.created_at || new Date().toISOString(),
        reviewed_at: app.reviewed_at,
        kyc_status: app.kyc_status,
        product_id: app.product_id,
        product_name: (app.marketplace_products as { name: string } | null)?.name || 'Produit inconnu',
      }));
    },
    enabled: !!user?.id,
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from('loan_applications')
        .update({ 
          status, 
          partner_notes: notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-applications'] });
      toast({ title: "Candidature mise à jour" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  return {
    applications: applicationsQuery.data || [],
    isLoading: applicationsQuery.isLoading,
    updateApplication: updateApplicationMutation,
    stats: {
      total: applicationsQuery.data?.length || 0,
      pending: applicationsQuery.data?.filter(a => a.status === 'pending').length || 0,
      approved: applicationsQuery.data?.filter(a => a.status === 'approved').length || 0,
      rejected: applicationsQuery.data?.filter(a => a.status === 'rejected').length || 0,
    }
  };
};
