import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface KycHealthMetrics {
  totalDocuments: number;
  validatedDocuments: number;
  rejectedDocuments: number;
  successRate: number;
  rejectionRate: number;
  isAlert: boolean; // true if rejection rate > 20%
  trend: { date: string; validated: number; rejected: number }[];
}

export interface ScoringMetrics {
  totalScores: number;
  averageScore: number;
  averageConfidence: number;
  distribution: { range: string; count: number; percentage: number }[];
  recentScores: { date: string; score: number; confidence: number }[];
}

export interface MobileTrustMetrics {
  totalUsers: number;
  ussdCniCorrelationSuccess: number;
  smsAnalyzed: number;
  phoneVerified: number;
  successRate: number;
}

export interface EdgeFunctionMetrics {
  functionName: string;
  avgLatency: number;
  callCount: number;
  successRate: number;
  lastCall: string | null;
}

export interface EmailLogMetrics {
  total: number;
  delivered: number;
  failed: number;
  pending: number;
  byTemplate: { template: string; count: number; successRate: number }[];
}

export interface OcrError {
  id: string;
  documentId: string | null;
  errorType: string;
  details: string;
  createdAt: string;
  imageUrl: string | null;
  checkType: string;
}

export interface UserInvestigation {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
  kycStatus: string | null;
  scoreValue: number | null;
  scoreConfidence: number | null;
  certificateId: string | null;
  trustLevel: string | null;
}

// Hook for KYC Health metrics
export const useKycHealthMetrics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["monitoring-kyc-health", user?.id],
    queryFn: async (): Promise<KycHealthMetrics> => {
      // Get KYC documents stats using correct column 'status'
      const { data: documents } = await supabase
        .from("kyc_documents")
        .select("id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      const totalDocuments = documents?.length || 0;
      const validatedDocuments = documents?.filter(d => 
        d.status === "verified" || d.status === "approved" || d.status === "validated"
      ).length || 0;
      const rejectedDocuments = documents?.filter(d => 
        d.status === "rejected" || d.status === "failed"
      ).length || 0;

      const successRate = totalDocuments > 0 
        ? Math.round((validatedDocuments / totalDocuments) * 100) 
        : 100;
      const rejectionRate = totalDocuments > 0 
        ? Math.round((rejectedDocuments / totalDocuments) * 100) 
        : 0;

      // Build 7-day trend
      const trend: { date: string; validated: number; rejected: number }[] = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().slice(0, 10);
        const dayDocs = documents?.filter(d => d.created_at.startsWith(dateStr)) || [];
        trend.push({
          date: date.toLocaleDateString("fr-FR", { weekday: "short" }),
          validated: dayDocs.filter(d => 
            d.status === "verified" || d.status === "approved" || d.status === "validated"
          ).length,
          rejected: dayDocs.filter(d => 
            d.status === "rejected" || d.status === "failed"
          ).length,
        });
      }

      return {
        totalDocuments,
        validatedDocuments,
        rejectedDocuments,
        successRate,
        rejectionRate,
        isAlert: rejectionRate > 20,
        trend,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30s
  });
};

// Hook for Scoring precision metrics
export const useScoringMetrics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["monitoring-scoring-metrics", user?.id],
    queryFn: async (): Promise<ScoringMetrics> => {
      const { data: scores } = await supabase
        .from("scoring_requests")
        .select("id, score, confidence, created_at")
        .not("score", "is", null)
        .order("created_at", { ascending: false })
        .limit(500);

      const totalScores = scores?.length || 0;
      const validScores = scores?.filter(s => s.score !== null) || [];
      
      const averageScore = validScores.length > 0
        ? Math.round(validScores.reduce((sum, s) => sum + (s.score || 0), 0) / validScores.length)
        : 0;
      
      const averageConfidence = validScores.length > 0
        ? Math.round(validScores.reduce((sum, s) => sum + (s.confidence || 0), 0) / validScores.length)
        : 0;

      // Score distribution
      const ranges = [
        { min: 0, max: 299, label: "0-299 (Très faible)" },
        { min: 300, max: 499, label: "300-499 (Faible)" },
        { min: 500, max: 649, label: "500-649 (Moyen)" },
        { min: 650, max: 749, label: "650-749 (Bon)" },
        { min: 750, max: 850, label: "750-850 (Excellent)" },
      ];

      const distribution = ranges.map(r => {
        const count = validScores.filter(s => s.score! >= r.min && s.score! <= r.max).length;
        return {
          range: r.label,
          count,
          percentage: totalScores > 0 ? Math.round((count / totalScores) * 100) : 0,
        };
      });

      // Recent 10 scores
      const recentScores = validScores.slice(0, 10).map(s => ({
        date: new Date(s.created_at).toLocaleDateString("fr-FR"),
        score: s.score || 0,
        confidence: s.confidence || 0,
      }));

      return {
        totalScores,
        averageScore,
        averageConfidence,
        distribution,
        recentScores,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
};

// Hook for Mobile Trust metrics
export const useMobileTrustMetrics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["monitoring-mobile-trust", user?.id],
    queryFn: async (): Promise<MobileTrustMetrics> => {
      // Get phone trust scores from correct table
      const { data: phoneTrust } = await supabase
        .from("phone_trust_scores")
        .select("id, trust_score, identity_cross_validated, otp_verified, ussd_screenshot_uploaded")
        .limit(500);

      // Get SMS analyses
      const { data: smsAnalyses } = await supabase
        .from("sms_analyses")
        .select("id, is_validated")
        .limit(500);

      // Get phone verifications (using verified_at to determine if verified)
      const { data: phoneVerifications } = await supabase
        .from("phone_verifications")
        .select("id, verified_at")
        .limit(500);

      const totalUsers = phoneTrust?.length || 0;
      const ussdCniCorrelationSuccess = phoneTrust?.filter(p => p.identity_cross_validated === true).length || 0;
      const smsAnalyzed = smsAnalyses?.length || 0;
      const phoneVerified = phoneVerifications?.filter(p => p.verified_at !== null).length || 0;

      const successRate = totalUsers > 0 
        ? Math.round((ussdCniCorrelationSuccess / totalUsers) * 100) 
        : 0;

      return {
        totalUsers,
        ussdCniCorrelationSuccess,
        smsAnalyzed,
        phoneVerified,
        successRate,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
};

// Hook for Edge Function metrics
export const useEdgeFunctionMetrics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["monitoring-edge-functions", user?.id],
    queryFn: async (): Promise<EdgeFunctionMetrics[]> => {
      const { data: apiCalls } = await supabase
        .from("api_calls")
        .select("endpoint, processing_time_ms, status_code, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      // Group by function name
      const functionMap: Record<string, { calls: number; totalLatency: number; successCount: number; lastCall: string | null }> = {};
      
      const keyFunctions = ["wouaka-core", "aml-screening", "calculate-score", "document-analyze", "wouaka-kyc", "wouaka-score"];
      
      (apiCalls || []).forEach(call => {
        const endpoint = call.endpoint.replace("/functions/v1/", "");
        const funcName = keyFunctions.find(f => endpoint.includes(f)) || endpoint.split("/")[0];
        
        if (!functionMap[funcName]) {
          functionMap[funcName] = { calls: 0, totalLatency: 0, successCount: 0, lastCall: null };
        }
        functionMap[funcName].calls++;
        functionMap[funcName].totalLatency += call.processing_time_ms || 0;
        if (call.status_code >= 200 && call.status_code < 300) {
          functionMap[funcName].successCount++;
        }
        if (!functionMap[funcName].lastCall) {
          functionMap[funcName].lastCall = call.created_at;
        }
      });

      return Object.entries(functionMap)
        .map(([functionName, data]) => ({
          functionName,
          avgLatency: data.calls > 0 ? Math.round(data.totalLatency / data.calls) : 0,
          callCount: data.calls,
          successRate: data.calls > 0 ? Math.round((data.successCount / data.calls) * 100) : 100,
          lastCall: data.lastCall,
        }))
        .sort((a, b) => b.callCount - a.callCount)
        .slice(0, 10);
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
};

// Hook for Email Log metrics
export const useEmailLogMetrics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["monitoring-email-logs", user?.id],
    queryFn: async (): Promise<EmailLogMetrics> => {
      const { data: emailLogs } = await supabase
        .from("email_logs")
        .select("id, template, status, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      const total = emailLogs?.length || 0;
      const delivered = emailLogs?.filter(e => e.status === "sent" || e.status === "delivered").length || 0;
      const failed = emailLogs?.filter(e => e.status === "failed" || e.status === "error" || e.status === "bounced").length || 0;
      const pending = emailLogs?.filter(e => e.status === "pending").length || 0;

      // Group by template
      const templateMap: Record<string, { total: number; success: number }> = {};
      (emailLogs || []).forEach(log => {
        if (!templateMap[log.template]) {
          templateMap[log.template] = { total: 0, success: 0 };
        }
        templateMap[log.template].total++;
        if (log.status === "sent" || log.status === "delivered") {
          templateMap[log.template].success++;
        }
      });

      const byTemplate = Object.entries(templateMap).map(([template, data]) => ({
        template,
        count: data.total,
        successRate: data.total > 0 ? Math.round((data.success / data.total) * 100) : 100,
      }));

      return {
        total,
        delivered,
        failed,
        pending,
        byTemplate,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
};

// Hook for OCR Errors
export const useOcrErrors = (limit = 10) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["monitoring-ocr-errors", user?.id, limit],
    queryFn: async (): Promise<OcrError[]> => {
      const { data: fraudAnalysis } = await supabase
        .from("document_fraud_analysis")
        .select("id, document_id, check_type, details, passed, created_at")
        .eq("passed", false)
        .order("created_at", { ascending: false })
        .limit(limit);

      return (fraudAnalysis || []).map(a => ({
        id: a.id,
        documentId: a.document_id,
        errorType: a.check_type,
        details: a.details || "Échec de la vérification",
        createdAt: new Date(a.created_at || "").toLocaleString("fr-FR"),
        imageUrl: null, // Would need to fetch from storage
        checkType: a.check_type,
      }));
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });
};

// Hook for User Investigation search
export const useUserInvestigation = (searchQuery: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-investigation", user?.id, searchQuery],
    queryFn: async (): Promise<UserInvestigation[]> => {
      if (!searchQuery || searchQuery.length < 3) return [];

      // Search by email, phone or name
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, phone, created_at")
        .or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(20);

      if (!profiles || profiles.length === 0) return [];

      const userIds = profiles.map(p => p.id);

      // Get KYC status
      const { data: kycValidations } = await supabase
        .from("kyc_validations")
        .select("user_id, status")
        .in("user_id", userIds);

      // Get latest scores
      const { data: scoringRequests } = await supabase
        .from("scoring_requests")
        .select("user_id, score, confidence")
        .in("user_id", userIds)
        .order("created_at", { ascending: false });

      // Get certificates
      const { data: certificates } = await supabase
        .from("certificates")
        .select("user_id, id, trust_level")
        .in("user_id", userIds);

      const kycMap = new Map(kycValidations?.map(k => [k.user_id, k.status]));
      const scoreMap = new Map(scoringRequests?.map(s => [s.user_id, { score: s.score, confidence: s.confidence }]));
      const certMap = new Map(certificates?.map(c => [c.user_id, { id: c.id, trustLevel: c.trust_level }]));

      return profiles.map(p => ({
        id: p.id,
        email: p.email,
        fullName: p.full_name,
        phone: p.phone ? `****${p.phone.slice(-4)}` : null, // Mask phone
        createdAt: new Date(p.created_at).toLocaleDateString("fr-FR"),
        kycStatus: kycMap.get(p.id) || null,
        scoreValue: scoreMap.get(p.id)?.score || null,
        scoreConfidence: scoreMap.get(p.id)?.confidence || null,
        certificateId: certMap.get(p.id)?.id || null,
        trustLevel: certMap.get(p.id)?.trustLevel || null,
      }));
    },
    enabled: !!user?.id && searchQuery.length >= 3,
  });
};
