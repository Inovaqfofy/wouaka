import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScoringInputData, ScoringResult } from '@/lib/scoring-types';
import { useToast } from '@/hooks/use-toast';

export function useScoring() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const calculateScore = async (data: ScoringInputData, enrichmentData?: any): Promise<ScoringResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'calculate-score',
        {
          body: { ...data, enrichment_data: enrichmentData },
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (functionData.error) {
        if (functionData.error.includes('Rate limit')) {
          toast({
            variant: 'destructive',
            title: 'Limite atteinte',
            description: 'Trop de requêtes. Veuillez réessayer dans quelques instants.',
          });
        }
        throw new Error(functionData.error);
      }

      // Ensure all fields are present with defaults for backward compatibility
      const normalizedResult: ScoringResult = {
        score: functionData.score,
        grade: functionData.grade || getGradeFromScore(functionData.score),
        risk_category: functionData.risk_category,
        confidence: functionData.confidence,
        reliability: functionData.reliability ?? 0,
        stability: functionData.stability ?? 0,
        short_term_risk: functionData.short_term_risk ?? 0,
        engagement_capacity: functionData.engagement_capacity ?? 0,
        explanations: functionData.explanations || [],
        recommendations: functionData.recommendations || [],
        feature_importance: functionData.feature_importance || [],
        processing_time_ms: functionData.processing_time_ms,
        model_version: functionData.model_version,
        calculated_at: functionData.calculated_at,
      };

      setResult(normalizedResult);

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('scoring_requests').insert([{
          user_id: user.id,
          full_name: data.full_name,
          national_id: data.national_id,
          phone_number: data.phone_number,
          company_name: data.company_name,
          rccm_number: data.rccm_number,
          employment_type: data.employment_type,
          years_in_business: data.years_in_business,
          sector: data.sector,
          monthly_income: data.monthly_income,
          monthly_expenses: data.monthly_expenses,
          existing_loans: data.existing_loans,
          mobile_money_volume: data.mobile_money_volume,
          sim_age_months: data.sim_age_months,
          mobile_money_transactions: data.mobile_money_transactions,
          utility_payments_on_time: data.utility_payments_on_time,
          utility_payments_late: data.utility_payments_late,
          region: data.region,
          city: data.city,
          score: normalizedResult.score,
          grade: normalizedResult.grade,
          risk_category: normalizedResult.risk_category,
          confidence: normalizedResult.confidence,
          reliability_score: normalizedResult.reliability,
          stability_score: normalizedResult.stability,
          short_term_risk: normalizedResult.short_term_risk,
          engagement_capacity_score: normalizedResult.engagement_capacity,
          explanations: JSON.parse(JSON.stringify(normalizedResult.explanations)),
          recommendations: JSON.parse(JSON.stringify(normalizedResult.recommendations)),
          feature_importance: JSON.parse(JSON.stringify(normalizedResult.feature_importance)),
          processing_time_ms: normalizedResult.processing_time_ms,
          model_version: normalizedResult.model_version,
          status: 'completed',
        }]);
      }

      return normalizedResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du calcul du score';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: message,
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resetResult = () => {
    setResult(null);
    setError(null);
  };

  return {
    calculateScore,
    resetResult,
    loading,
    result,
    error,
  };
}

// Helper function to get grade from score
function getGradeFromScore(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  if (score >= 30) return 'D';
  return 'E';
}
