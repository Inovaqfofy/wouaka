import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { ProofStatus } from "@/components/trust/ProofProgressIndicator";

export function useBorrowerProofStatus() {
  const { user, profile } = useAuth();

  const { data: proofStatus, isLoading, refetch } = useQuery({
    queryKey: ['borrower-proof-status', user?.id],
    queryFn: async (): Promise<ProofStatus> => {
      if (!user?.id) {
        return {
          otpVerified: false,
          ussdUploaded: false,
          smsAnalyzed: false,
          documentsVerified: false,
          guarantorAdded: false,
        };
      }

      // Use Promise.all for parallel queries with correct column names
      const queries = await Promise.allSettled([
        // Check USSD screenshots with validation_status = 'validated'
        supabase
          .from('ussd_screenshot_validations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('validation_status', 'validated'),
        // Check SMS analyzed (any analysis exists)
        supabase
          .from('sms_analyses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        // Check documents verified OR pending with good OCR confidence
        supabase
          .from('kyc_documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .or('status.eq.verified,ocr_confidence.gte.70'),
        // Check guarantor with identity_verified = true
        supabase
          .from('user_guarantors')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('identity_verified', true),
      ]);

      // Extract counts safely from Promise.allSettled results
      const getCount = (result: PromiseSettledResult<any>): number => {
        if (result.status === 'fulfilled' && result.value?.count != null) {
          return result.value.count;
        }
        return 0;
      };

      const [ussdResult, smsResult, docResult, guarantorResult] = queries;

      return {
        otpVerified: !!profile?.phone,
        ussdUploaded: getCount(ussdResult) > 0,
        smsAnalyzed: getCount(smsResult) > 0,
        documentsVerified: getCount(docResult) > 0,
        guarantorAdded: getCount(guarantorResult) > 0,
      };
    },
    enabled: !!user?.id,
  });

  return {
    proofStatus: proofStatus || {
      otpVerified: !!profile?.phone,
      ussdUploaded: false,
      smsAnalyzed: false,
      documentsVerified: false,
      guarantorAdded: false,
    },
    isLoading,
    refetch,
  };
}
