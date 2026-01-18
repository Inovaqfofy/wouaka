import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface ClientProfile {
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
  enrichmentCount: number;
  lastEnrichedAt: string | null;
  createdAt: string;
  identityData: Record<string, unknown> | null;
}

export interface ClientEvaluation {
  id: string;
  type: 'score' | 'kyc';
  score: number | null;
  grade: string | null;
  status: string;
  createdAt: string;
}

export const useClientProfile = (clientId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-profile', clientId],
    queryFn: async (): Promise<ClientProfile | null> => {
      if (!clientId || !user?.id) return null;

      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', clientId)
        .eq('partner_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching client profile:', error);
        return null;
      }

      const identityData = data.identity_data as Record<string, unknown> | null;

      return {
        id: data.id,
        externalReference: data.external_reference,
        fullName: identityData?.full_name as string | null || null,
        phoneNumber: identityData?.phone_number as string | null || null,
        nationalId: identityData?.national_id as string | null || null,
        compositeScore: data.composite_score,
        reliabilityScore: data.reliability_score,
        stabilityScore: data.stability_score,
        riskScore: data.risk_score,
        dataSources: data.data_sources || [],
        enrichmentCount: data.enrichment_count || 0,
        lastEnrichedAt: data.last_enriched_at,
        createdAt: data.created_at,
        identityData,
      };
    },
    enabled: !!clientId && !!user?.id,
  });
};

export const useClientEvaluations = (clientId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-evaluations', clientId],
    queryFn: async (): Promise<ClientEvaluation[]> => {
      if (!clientId || !user?.id) return [];

      const evaluations: ClientEvaluation[] = [];

      // Get scoring requests
      const { data: scores } = await supabase
        .from('scoring_requests')
        .select('id, score, grade, status, created_at')
        .eq('customer_profile_id', clientId)
        .order('created_at', { ascending: false });

      scores?.forEach(s => {
        evaluations.push({
          id: s.id,
          type: 'score',
          score: s.score,
          grade: s.grade,
          status: s.status || 'completed',
          createdAt: s.created_at,
        });
      });

      // Get KYC requests
      const { data: kycs } = await supabase
        .from('kyc_requests')
        .select('id, identity_score, status, created_at')
        .eq('customer_profile_id', clientId)
        .order('created_at', { ascending: false });

      kycs?.forEach(k => {
        evaluations.push({
          id: k.id,
          type: 'kyc',
          score: k.identity_score,
          grade: null,
          status: k.status || 'pending',
          createdAt: k.created_at,
        });
      });

      return evaluations.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!clientId && !!user?.id,
  });
};

export const useClientActions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const recalculateScore = useMutation({
    mutationFn: async (clientId: string) => {
      // Call the calculate-score edge function
      const { data, error } = await supabase.functions.invoke('calculate-score', {
        body: { customer_profile_id: clientId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, clientId) => {
      queryClient.invalidateQueries({ queryKey: ['client-profile', clientId] });
      queryClient.invalidateQueries({ queryKey: ['client-evaluations', clientId] });
      toast({ title: "Score recalculé avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const requestKyc = useMutation({
    mutationFn: async ({ clientId, fullName, phoneNumber, nationalId }: { 
      clientId: string; 
      fullName: string; 
      phoneNumber?: string;
      nationalId?: string;
    }) => {
      const { data, error } = await supabase
        .from('kyc_requests')
        .insert({
          partner_id: user?.id,
          customer_profile_id: clientId,
          full_name: fullName,
          phone_number: phoneNumber,
          national_id: nationalId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-evaluations', variables.clientId] });
      toast({ title: "Demande KYC créée" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const enrichData = useMutation({
    mutationFn: async (clientId: string) => {
      const { data, error } = await supabase.functions.invoke('data-enrich', {
        body: { customer_profile_id: clientId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, clientId) => {
      queryClient.invalidateQueries({ queryKey: ['client-profile', clientId] });
      toast({ title: "Données enrichies avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  return {
    recalculateScore,
    requestKyc,
    enrichData,
  };
};
