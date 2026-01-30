import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export interface PartnerOffer {
  id: string;
  provider_id: string | null;
  name: string;
  provider_name: string;
  description: string | null;
  category: string;
  interest_rate: number | null;
  min_amount: number | null;
  max_amount: number | null;
  currency: string;
  duration_min_months: number | null;
  duration_max_months: number | null;
  min_score_required: number;
  countries: string[];
  features: string[] | null;
  requirements: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  status: string;
  views_count: number;
  applications_count: number;
  submitted_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOfferData {
  name: string;
  description?: string;
  category: string;
  interest_rate?: number;
  min_amount?: number;
  max_amount?: number;
  duration_min_months?: number;
  duration_max_months?: number;
  min_score_required: number;
  countries?: string[];
  features?: string[];
  requirements?: string[];
}

export function usePartnerOffers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch partner's own offers
  const offersQuery = useQuery({
    queryKey: ['partner-offers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('provider_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as PartnerOffer[];
    },
    enabled: !!user?.id
  });

  // Create new offer
  const createOffer = useMutation({
    mutationFn: async (offerData: CreateOfferData) => {
      // Get profile for provider_name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      const providerName = profile?.full_name || 'Partenaire';

      const { data, error } = await supabase
        .from('marketplace_products')
        .insert({
          ...offerData,
          provider_id: user?.id,
          provider_name: providerName,
          currency: 'XOF',
          status: 'draft',
          is_active: false,
          is_featured: false,
          views_count: 0,
          applications_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data as PartnerOffer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-offers'] });
      toast({
        title: "Offre créée",
        description: "Votre offre a été créée en tant que brouillon.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'offre: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Update offer
  const updateOffer = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<PartnerOffer> & { id: string }) => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .update(updateData)
        .eq('id', id)
        .eq('provider_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data as PartnerOffer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-offers'] });
      toast({
        title: "Offre mise à jour",
        description: "Les modifications ont été enregistrées.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'offre: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Submit offer for review
  const submitOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .update({
          status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .eq('provider_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data as PartnerOffer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-offers'] });
      toast({
        title: "Offre soumise",
        description: "Votre offre a été soumise pour validation par l'équipe Wouaka.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de soumettre l'offre: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Delete offer
  const deleteOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', offerId)
        .eq('provider_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-offers'] });
      toast({
        title: "Offre supprimée",
        description: "L'offre a été supprimée définitivement.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'offre: " + error.message,
        variant: "destructive",
      });
    }
  });

  return {
    offers: offersQuery.data || [],
    isLoading: offersQuery.isLoading,
    createOffer,
    updateOffer,
    submitOffer,
    deleteOffer
  };
}

// Categories for offers
export const OFFER_CATEGORIES = [
  { value: "credit", label: "Crédit classique" },
  { value: "microfinance", label: "Microfinance" },
  { value: "leasing", label: "Leasing / Location" },
  { value: "trade", label: "Import/Export" },
  { value: "insurance", label: "Assurance" },
  { value: "savings", label: "Épargne" },
];

// Status labels
export const OFFER_STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "success" | "destructive" | "outline" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  pending: { label: "En attente de validation", variant: "outline" },
  published: { label: "Publiée", variant: "success" },
  suspended: { label: "Suspendue", variant: "destructive" },
};

// Helper to format amount
export function formatAmount(amount: number | null): string {
  if (amount === null) return '-';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

// Helper to format duration
export function formatDuration(minMonths: number | null, maxMonths: number | null): string {
  if (minMonths === null && maxMonths === null) return '-';
  if (minMonths === maxMonths) return `${minMonths} mois`;
  return `${minMonths || 0}-${maxMonths || 0} mois`;
}
