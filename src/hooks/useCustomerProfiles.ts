import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface CustomerProfile {
  id: string;
  externalReference: string;
  fullName: string | null;
  phoneNumber: string | null;
  nationalId: string | null;
  compositeScore: number | null;
  reliabilityScore: number | null;
  stabilityScore: number | null;
  riskScore: number | null;
  dataSources: string[];
  lastEnrichedAt: string | null;
  createdAt: string;
  updatedAt: string;
  kycStatus?: 'pending' | 'verified' | 'rejected' | null;
  evaluationsCount?: number;
}

export interface CreateCustomerProfileInput {
  externalReference: string;
  fullName?: string;
  phoneNumber?: string;
  nationalId?: string;
  email?: string;
  city?: string;
  country?: string;
}

export const useCustomerProfiles = (options?: { limit?: number }) => {
  const { user } = useAuth();
  const limit = options?.limit || 50;

  return useQuery({
    queryKey: ["customer-profiles", user?.id, limit],
    queryFn: async (): Promise<CustomerProfile[]> => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("partner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((p) => ({
        id: p.id,
        externalReference: p.external_reference,
        fullName: (p.identity_data as Record<string, unknown>)?.full_name as string || null,
        phoneNumber: (p.identity_data as Record<string, unknown>)?.phone_number as string || null,
        nationalId: (p.identity_data as Record<string, unknown>)?.national_id as string || null,
        compositeScore: p.composite_score,
        reliabilityScore: p.reliability_score,
        stabilityScore: p.stability_score,
        riskScore: p.risk_score,
        dataSources: p.data_sources || [],
        lastEnrichedAt: p.last_enriched_at,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        evaluationsCount: p.enrichment_count || 0,
      }));
    },
    enabled: !!user?.id,
  });
};

export const useCustomerProfilesPaginated = (options: {
  page: number;
  pageSize: number;
  search?: string;
}) => {
  const { user } = useAuth();
  const { page, pageSize, search } = options;

  return useQuery({
    queryKey: ["customer-profiles-paginated", user?.id, page, pageSize, search],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      let query = supabase
        .from("customer_profiles")
        .select("*", { count: "exact" })
        .eq("partner_id", user.id);

      // Apply search filter - search in JSONB identity_data
      if (search) {
        query = query.or(`external_reference.ilike.%${search}%`);
      }

      // Apply pagination
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const profiles: CustomerProfile[] = (data || []).map((p) => ({
        id: p.id,
        externalReference: p.external_reference,
        fullName: (p.identity_data as Record<string, unknown>)?.full_name as string || null,
        phoneNumber: (p.identity_data as Record<string, unknown>)?.phone_number as string || null,
        nationalId: (p.identity_data as Record<string, unknown>)?.national_id as string || null,
        compositeScore: p.composite_score,
        reliabilityScore: p.reliability_score,
        stabilityScore: p.stability_score,
        riskScore: p.risk_score,
        dataSources: p.data_sources || [],
        lastEnrichedAt: p.last_enriched_at,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        evaluationsCount: p.enrichment_count || 0,
      }));

      return {
        profiles,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
      };
    },
    enabled: !!user?.id,
  });
};

export const useCustomerProfile = (profileId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["customer-profile", profileId],
    queryFn: async (): Promise<CustomerProfile | null> => {
      if (!user?.id || !profileId) return null;

      const { data, error } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("id", profileId)
        .eq("partner_id", user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        id: data.id,
        externalReference: data.external_reference,
        fullName: (data.identity_data as Record<string, unknown>)?.full_name as string || null,
        phoneNumber: (data.identity_data as Record<string, unknown>)?.phone_number as string || null,
        nationalId: (data.identity_data as Record<string, unknown>)?.national_id as string || null,
        compositeScore: data.composite_score,
        reliabilityScore: data.reliability_score,
        stabilityScore: data.stability_score,
        riskScore: data.risk_score,
        dataSources: data.data_sources || [],
        lastEnrichedAt: data.last_enriched_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        evaluationsCount: data.enrichment_count || 0,
      };
    },
    enabled: !!user?.id && !!profileId,
  });
};

export const useCreateCustomerProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCustomerProfileInput) => {
      if (!user?.id) throw new Error("User not authenticated");

      const identityData = {
        full_name: input.fullName,
        phone_number: input.phoneNumber,
        national_id: input.nationalId,
        email: input.email,
        city: input.city,
        country: input.country || 'CI',
      };

      const { data, error } = await supabase
        .from("customer_profiles")
        .insert({
          partner_id: user.id,
          external_reference: input.externalReference,
          identity_data: identityData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["enterprise-stats"] });
      toast({
        title: "Client ajouté",
        description: "Le profil client a été créé avec succès.",
      });
    },
    onError: (error) => {
      console.error("Error creating customer profile:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du profil.",
        variant: "destructive",
      });
    },
  });
};

export const useClientStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data: profiles, error } = await supabase
        .from("customer_profiles")
        .select("composite_score, risk_score, enrichment_count, created_at")
        .eq("partner_id", user.id);

      if (error) throw error;

      const total = profiles?.length || 0;
      const scored = profiles?.filter(p => p.composite_score !== null).length || 0;
      const highRisk = profiles?.filter(p => (p.risk_score || 0) > 70).length || 0;
      const lowRisk = profiles?.filter(p => (p.risk_score || 0) <= 30 && p.risk_score !== null).length || 0;
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonth = profiles?.filter(p => new Date(p.created_at) >= startOfMonth).length || 0;

      return {
        totalClients: total,
        scoredClients: scored,
        highRiskClients: highRisk,
        lowRiskClients: lowRisk,
        newClientsThisMonth: thisMonth,
        totalEvaluations: profiles?.reduce((sum, p) => sum + (p.enrichment_count || 0), 0) || 0,
      };
    },
    enabled: !!user?.id,
  });
};
