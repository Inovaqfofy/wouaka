import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CreateScoringRequestInput {
  fullName: string;
  phoneNumber: string;
  nationalId?: string;
  companyName?: string;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  city?: string;
  region?: string;
  sector?: string;
  employmentType?: string;
}

export function useCreateScoringRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateScoringRequestInput) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('scoring_requests')
        .insert({
          user_id: user.id,
          full_name: input.fullName,
          phone_number: input.phoneNumber,
          national_id: input.nationalId || null,
          company_name: input.companyName || null,
          monthly_income: input.monthlyIncome || null,
          monthly_expenses: input.monthlyExpenses || null,
          city: input.city || null,
          region: input.region || null,
          sector: input.sector || null,
          employment_type: input.employmentType || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Demande créée',
        description: 'Votre demande de score a été soumise avec succès. Vous recevrez une notification une fois le traitement terminé.',
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['score-requests'] });
      queryClient.invalidateQueries({ queryKey: ['enterprise-stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la demande. Veuillez réessayer.',
        variant: 'destructive',
      });
      console.error('Error creating scoring request:', error);
    },
  });
}
