import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface EnterpriseStats {
  scoresRequested: number;
  averageScore: number;
  scoreTrend: number;
  productsMatched: number;
  creditsUsed: number;
  creditsTotal: number;
  pendingRequests: number;
  completedRequests: number;
}

export interface ScoreRequest {
  id: string;
  subject: string;
  score: number | null;
  status: string;
  date: string;
  type: string;
  fullName: string | null;
  companyName: string | null;
  grade: string | null;
}

export const useEnterpriseStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["enterprise-stats", user?.id],
    queryFn: async (): Promise<EnterpriseStats> => {
      if (!user?.id) throw new Error("User not authenticated");

      // Get scoring requests for this user
      const { data: requests, error: requestsError } = await supabase
        .from("scoring_requests")
        .select("score, status, created_at")
        .eq("user_id", user.id);

      if (requestsError) throw requestsError;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const thisMonthRequests = requests?.filter(
        (r) => new Date(r.created_at) >= startOfMonth
      ) || [];
      
      const lastMonthRequests = requests?.filter(
        (r) => new Date(r.created_at) >= startOfLastMonth && new Date(r.created_at) < startOfMonth
      ) || [];

      const completedRequests = requests?.filter((r) => r.status === "completed") || [];
      const scores = completedRequests.map((r) => r.score).filter((s): s is number => s !== null);
      
      const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
        : 0;

      const lastMonthCompleted = lastMonthRequests.filter((r) => r.status === "completed");
      const lastMonthScores = lastMonthCompleted.map((r) => r.score).filter((s): s is number => s !== null);
      const lastMonthAvg = lastMonthScores.length > 0 
        ? Math.round(lastMonthScores.reduce((a, b) => a + b, 0) / lastMonthScores.length) 
        : 0;

      const scoreTrend = lastMonthAvg > 0 ? Math.round(((avgScore - lastMonthAvg) / lastMonthAvg) * 100) : 0;

      // Get subscription info for credits
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      const limits = (subscription?.subscription_plans?.limits as { scores?: number } | null) || {};
      const creditsTotal = limits.scores || 50;
      const creditsUsed = thisMonthRequests.length;

      return {
        scoresRequested: thisMonthRequests.length,
        averageScore: avgScore,
        scoreTrend,
        productsMatched: 12, // TODO: Connect to marketplace matching logic
        creditsUsed,
        creditsTotal,
        pendingRequests: requests?.filter((r) => r.status === "pending").length || 0,
        completedRequests: completedRequests.length,
      };
    },
    enabled: !!user?.id,
  });
};

export const useScoreRequests = (options?: { limit?: number }) => {
  const { user } = useAuth();
  const limit = options?.limit || 50;

  return useQuery({
    queryKey: ["score-requests", user?.id, limit],
    queryFn: async (): Promise<ScoreRequest[]> => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("scoring_requests")
        .select("id, full_name, company_name, score, status, created_at, grade, sector")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((r) => ({
        id: r.id,
        subject: r.company_name || r.full_name || "Demande de score",
        score: r.score,
        status: r.status || "pending",
        date: new Date(r.created_at).toLocaleDateString("fr-FR"),
        type: r.sector || "credit",
        fullName: r.full_name,
        companyName: r.company_name,
        grade: r.grade,
      }));
    },
    enabled: !!user?.id,
  });
};

export const useScoreRequestsPaginated = (options: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
}) => {
  const { user } = useAuth();
  const { page, pageSize, search, status } = options;

  return useQuery({
    queryKey: ["score-requests-paginated", user?.id, page, pageSize, search, status],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      let query = supabase
        .from("scoring_requests")
        .select("id, full_name, company_name, score, status, created_at, grade, sector", { count: "exact" })
        .eq("user_id", user.id);

      // Apply search filter
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,company_name.ilike.%${search}%`);
      }

      // Apply status filter
      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      // Apply pagination
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const requests: ScoreRequest[] = (data || []).map((r) => ({
        id: r.id,
        subject: r.company_name || r.full_name || "Demande de score",
        score: r.score,
        status: r.status || "pending",
        date: new Date(r.created_at).toLocaleDateString("fr-FR"),
        type: r.sector || "credit",
        fullName: r.full_name,
        companyName: r.company_name,
        grade: r.grade,
      }));

      return {
        requests,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
      };
    },
    enabled: !!user?.id,
  });
};
