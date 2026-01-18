import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { ProofStatus } from "@/components/trust/ProofProgressIndicator";

export function useBorrowerProofStatus() {
  const { user, profile } = useAuth();

  const { data: proofStatus, isLoading } = useQuery({
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

      // Use Promise.all for parallel queries
      const queries = await Promise.all([
        // Check USSD screenshots uploaded
        (supabase as any)
          .from('ussd_screenshot_validations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_validated', true),
        // Check SMS analyzed
        (supabase as any)
          .from('sms_analyses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        // Check documents verified
        (supabase as any)
          .from('kyc_documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'verified'),
        // Check guarantor added
        (supabase as any)
          .from('user_guarantors')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_verified', true),
      ]);

      const [ussdResult, smsResult, docResult, guarantorResult] = queries;

      return {
        otpVerified: !!profile?.phone,
        ussdUploaded: (ussdResult.count || 0) > 0,
        smsAnalyzed: (smsResult.count || 0) > 0,
        documentsVerified: (docResult.count || 0) > 0,
        guarantorAdded: (guarantorResult.count || 0) > 0,
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
  };
}
