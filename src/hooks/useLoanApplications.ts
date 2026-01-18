import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export interface LoanApplication {
  id: string;
  product_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  national_id: string | null;
  identity_document_url: string | null;
  additional_documents: any[];
  score: number | null;
  score_grade: string | null;
  score_details: any;
  risk_level: string | null;
  kyc_status: string;
  kyc_identity_score: number | null;
  kyc_fraud_score: number | null;
  kyc_request_id: string | null;
  is_eligible: boolean | null;
  eligibility_reason: string | null;
  status: string;
  partner_notes: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  // Joined data
  product?: {
    name: string;
    min_score_required: number;
    min_amount: number | null;
    max_amount: number | null;
    provider_name: string;
  };
}

export interface CreateApplicationData {
  product_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  national_id?: string;
}

// Hook for partners to manage applications received
export function usePartnerApplications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const applicationsQuery = useQuery({
    queryKey: ['partner-applications', user?.id],
    queryFn: async () => {
      // First get partner's products
      const { data: products } = await supabase
        .from('marketplace_products')
        .select('id')
        .eq('provider_id', user?.id);

      if (!products || products.length === 0) return [];

      const productIds = products.map(p => p.id);

      // Then get applications for those products
      const { data, error } = await supabase
        .from('loan_applications')
        .select(`
          *,
          product:marketplace_products(name, min_score_required, min_amount, max_amount, provider_name)
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as LoanApplication[];
    },
    enabled: !!user?.id
  });

  // Update application status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updateData: any = {
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id
      };
      if (notes !== undefined) {
        updateData.partner_notes = notes;
      }

      const { data, error } = await supabase
        .from('loan_applications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['partner-applications'] });
      const statusLabels: Record<string, string> = {
        approved: "approuvée",
        rejected: "refusée",
        reviewing: "en cours d'examen"
      };
      toast({
        title: "Statut mis à jour",
        description: `La candidature a été ${statusLabels[variables.status] || "mise à jour"}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut: " + error.message,
        variant: "destructive",
      });
    }
  });

  return {
    applications: applicationsQuery.data || [],
    isLoading: applicationsQuery.isLoading,
    updateStatus
  };
}

// Hook for public marketplace - create applications
export function usePublicApplications() {
  const { toast } = useToast();

  const createApplication = useMutation({
    mutationFn: async (data: CreateApplicationData) => {
      const { data: result, error } = await supabase
        .from('loan_applications')
        .insert({
          ...data,
          status: 'pending',
          kyc_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Increment applications_count on the product
      const { data: currentProduct } = await supabase
        .from('marketplace_products')
        .select('applications_count')
        .eq('id', data.product_id)
        .single();

      await supabase
        .from('marketplace_products')
        .update({ applications_count: (currentProduct?.applications_count || 0) + 1 })
        .eq('id', data.product_id);

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Candidature enregistrée",
        description: "Vous allez maintenant passer la vérification d'identité.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de soumettre la candidature: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Update application with KYC/Score results
  const updateApplicationResults = useMutation({
    mutationFn: async ({ 
      id, 
      score, 
      score_grade,
      score_details,
      risk_level,
      kyc_status,
      kyc_identity_score,
      kyc_fraud_score,
      identity_document_url,
      additional_documents,
      is_eligible,
      eligibility_reason
    }: Partial<LoanApplication> & { id: string }) => {
      const { data, error } = await supabase
        .from('loan_applications')
        .update({
          score,
          score_grade,
          score_details,
          risk_level,
          kyc_status,
          kyc_identity_score,
          kyc_fraud_score,
          identity_document_url,
          additional_documents,
          is_eligible,
          eligibility_reason,
          status: is_eligible ? 'scored' : 'rejected'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  });

  return {
    createApplication,
    updateApplicationResults
  };
}

// Application status labels
export const APPLICATION_STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "success" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  kyc_in_progress: { label: "Vérification KYC", variant: "outline" },
  scored: { label: "Évalué", variant: "default" },
  reviewing: { label: "En examen", variant: "outline" },
  approved: { label: "Approuvé", variant: "success" },
  rejected: { label: "Refusé", variant: "destructive" },
  withdrawn: { label: "Retiré", variant: "secondary" },
};
