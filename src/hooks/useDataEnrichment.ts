import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { DataConsent } from '@/lib/enrichment-types';
import { useToast } from '@/hooks/use-toast';

interface EnrichedSource {
  source_type: string;
  provider: string;
  display_name: string;
  verification_status: 'verified' | 'simulated' | 'failed';
  confidence: number;
  processing_time_ms: number;
  data: any;
}

interface EnrichmentResult {
  success: boolean;
  sources: EnrichedSource[];
  feature_adjustments: Record<string, number>;
  overall_confidence: number;
  processing_time_ms: number;
  is_demo: boolean;
}

export function useDataEnrichment() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnrichmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const enrichData = async (
    phoneNumber: string,
    consent: DataConsent,
    rccmNumber?: string,
    nationalId?: string
  ): Promise<EnrichmentResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('data-enrich', {
        body: {
          phone_number: phoneNumber,
          consent: {
            mobile_money: consent.mobile_money_consent,
            telecom: consent.telecom_consent,
            registry: consent.registry_consent,
            utility: consent.utility_consent,
          },
          rccm_number: rccmNumber,
          national_id: nationalId,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Échec de l\'enrichissement');
      }

      setResult(data as EnrichmentResult);
      
      // Store consent in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('data_consents').insert({
          user_id: user.id,
          phone_number: phoneNumber,
          mobile_money_consent: consent.mobile_money_consent,
          telecom_consent: consent.telecom_consent,
          registry_consent: consent.registry_consent,
          utility_consent: consent.utility_consent,
          consent_given_at: new Date().toISOString(),
          consent_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      return data as EnrichmentResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'enrichissement';
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

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    enrichData,
    reset,
    loading,
    result,
    error,
  };
}
