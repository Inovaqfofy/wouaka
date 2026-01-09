import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface AdminStats {
  activeUsers: number;
  usersTrend: number;
  totalScores: number;
  scoresTrend: number;
  pendingKyc: number;
  kycTrend: number;
  monthlyRevenue: number;
  revenueTrend: number;
}

export interface RecentKyc {
  id: string;
  name: string;
  status: string;
  date: string;
}

export interface RecentScore {
  id: string;
  entity: string;
  score: number;
  grade: string;
  date: string;
}

export interface UserWithRole {
  id: string;
  email: string;
  fullName: string | null;
  company: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const useAdminStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-stats", user?.id],
    queryFn: async (): Promise<AdminStats> => {
      // Get active users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get scoring requests this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const { count: thisMonthScores } = await supabase
        .from("scoring_requests")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      const { count: lastMonthScores } = await supabase
        .from("scoring_requests")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfLastMonth.toISOString())
        .lt("created_at", startOfMonth.toISOString());

      // Get pending KYC validations
      const { count: pendingKyc } = await supabase
        .from("kyc_validations")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get billing for revenue
      const { data: billingData } = await supabase
        .from("partner_billing")
        .select("total_amount")
        .gte("period_start", startOfMonth.toISOString())
        .eq("status", "paid");

      const monthlyRevenue = billingData?.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;

      const scoresTrend = lastMonthScores && lastMonthScores > 0
        ? Math.round(((thisMonthScores || 0) - lastMonthScores) / lastMonthScores * 100)
        : 0;

      return {
        activeUsers: usersCount || 0,
        usersTrend: 12, // TODO: Calculate real trend
        totalScores: thisMonthScores || 0,
        scoresTrend,
        pendingKyc: pendingKyc || 0,
        kycTrend: -5, // TODO: Calculate real trend
        monthlyRevenue,
        revenueTrend: 15, // TODO: Calculate real trend
      };
    },
    enabled: !!user?.id,
  });
};

export const useRecentKyc = (limit = 5) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recent-kyc", user?.id, limit],
    queryFn: async (): Promise<RecentKyc[]> => {
      const { data, error } = await supabase
        .from("kyc_validations")
        .select(`
          id,
          status,
          created_at,
          profiles!kyc_validations_user_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        // Fallback without join if foreign key doesn't exist
        const { data: fallbackData } = await supabase
          .from("kyc_validations")
          .select("id, user_id, status, created_at")
          .order("created_at", { ascending: false })
          .limit(limit);

        return (fallbackData || []).map((k) => ({
          id: k.id.slice(0, 8).toUpperCase(),
          name: "Utilisateur",
          status: k.status || "pending",
          date: new Date(k.created_at).toLocaleDateString("fr-FR"),
        }));
      }

      return (data || []).map((k) => ({
        id: k.id.slice(0, 8).toUpperCase(),
        name: (k.profiles as unknown as { full_name: string } | null)?.full_name || "Utilisateur",
        status: k.status || "pending",
        date: new Date(k.created_at).toLocaleDateString("fr-FR"),
      }));
    },
    enabled: !!user?.id,
  });
};

export const useRecentScores = (limit = 5) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recent-scores", user?.id, limit],
    queryFn: async (): Promise<RecentScore[]> => {
      const { data, error } = await supabase
        .from("scoring_requests")
        .select("id, company_name, full_name, score, grade, created_at")
        .eq("status", "completed")
        .not("score", "is", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((s) => ({
        id: s.id.slice(0, 8).toUpperCase(),
        entity: s.company_name || s.full_name || "Entité",
        score: s.score || 0,
        grade: s.grade || "N/A",
        date: new Date(s.created_at).toLocaleDateString("fr-FR"),
      }));
    },
    enabled: !!user?.id,
  });
};

export const useAllUsers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-users", user?.id],
    queryFn: async (): Promise<UserWithRole[]> => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, company, is_active, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const rolesMap = new Map((roles || []).map((r) => [r.user_id, r.role]));

      return (profiles || []).map((p) => ({
        id: p.id,
        email: p.email,
        fullName: p.full_name,
        company: p.company,
        role: rolesMap.get(p.id) || "ENTREPRISE",
        isActive: p.is_active ?? true,
        createdAt: new Date(p.created_at).toLocaleDateString("fr-FR"),
      }));
    },
    enabled: !!user?.id,
  });
};

export const useAllKycValidations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-kyc-validations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kyc_validations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useAllScores = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-scores", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scoring_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useAuditLogs = (limit = 50) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["audit-logs", user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export type AppRole = 'SUPER_ADMIN' | 'ANALYSTE' | 'ENTREPRISE' | 'API_CLIENT';

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole, granted_by: user?.id })
        .eq("user_id", userId);

      if (error) throw error;
      return { userId, newRole };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast.success(`Rôle mis à jour avec succès`);
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour du rôle");
      console.error(error);
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", userId);

      if (error) throw error;
      return { userId, isActive };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast.success(data.isActive ? "Utilisateur activé" : "Utilisateur désactivé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour du statut");
      console.error(error);
    },
  });
};
