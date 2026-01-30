import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { AppRole } from "@/lib/roles";

export interface AdminStats {
  activeUsers: number;
  usersTrend: number;
  totalCertificates: number;
  certificatesTrend: number;
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

export interface RecentCertificate {
  id: string;
  holder: string;
  certitude: number;
  trustLevel: string;
  plan: string;
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
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Get active users count this month
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get users created this month vs last month for trend
      const { count: usersThisMonth } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      const { count: usersLastMonth } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfLastMonth.toISOString())
        .lt("created_at", startOfMonth.toISOString());

      // Get certificates this month
      const { count: thisMonthCertificates } = await supabase
        .from("certificates")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      const { count: lastMonthCertificates } = await supabase
        .from("certificates")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfLastMonth.toISOString())
        .lt("created_at", startOfMonth.toISOString());

      // Get pending KYC validations this month vs last month
      const { count: pendingKyc } = await supabase
        .from("kyc_validations")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: kycThisMonth } = await supabase
        .from("kyc_validations")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      const { count: kycLastMonth } = await supabase
        .from("kyc_validations")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfLastMonth.toISOString())
        .lt("created_at", startOfMonth.toISOString());

      // Get billing for revenue this month
      const { data: billingThisMonth } = await supabase
        .from("partner_billing")
        .select("total_amount")
        .gte("period_start", startOfMonth.toISOString())
        .eq("status", "paid");

      const { data: billingLastMonth } = await supabase
        .from("partner_billing")
        .select("total_amount")
        .gte("period_start", startOfLastMonth.toISOString())
        .lt("period_start", startOfMonth.toISOString())
        .eq("status", "paid");

      const monthlyRevenue = billingThisMonth?.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;
      const lastMonthRevenue = billingLastMonth?.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;

      // Calculate trends
      const calculateTrend = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const certificatesTrend = calculateTrend(thisMonthCertificates || 0, lastMonthCertificates || 0);
      const usersTrend = calculateTrend(usersThisMonth || 0, usersLastMonth || 0);
      const kycTrend = calculateTrend(kycThisMonth || 0, kycLastMonth || 0);
      const revenueTrend = calculateTrend(monthlyRevenue, lastMonthRevenue);

      return {
        activeUsers: usersCount || 0,
        usersTrend,
        totalCertificates: thisMonthCertificates || 0,
        certificatesTrend,
        pendingKyc: pendingKyc || 0,
        kycTrend,
        monthlyRevenue,
        revenueTrend,
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

export const useRecentCertificates = (limit = 5) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recent-certificates", user?.id, limit],
    queryFn: async (): Promise<RecentCertificate[]> => {
      const { data, error } = await supabase
        .from("certificates")
        .select(`
          id, 
          share_code, 
          certainty_coefficient, 
          trust_level, 
          plan_id, 
          created_at,
          user_id,
          profiles!certificates_user_id_fkey(full_name, phone)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        // Fallback without join
        const { data: fallbackData } = await supabase
          .from("certificates")
          .select("id, share_code, certainty_coefficient, trust_level, plan_id, created_at")
          .order("created_at", { ascending: false })
          .limit(limit);

        return (fallbackData || []).map((c) => ({
          id: c.share_code || c.id.slice(0, 8).toUpperCase(),
          holder: "Titulaire",
          certitude: Math.round(c.certainty_coefficient || 0),
          trustLevel: c.trust_level || "bronze",
          plan: c.plan_id?.replace("emprunteur-", "") || "découverte",
          date: new Date(c.created_at).toLocaleDateString("fr-FR"),
        }));
      }

      return (data || []).map((c) => ({
        id: c.share_code || c.id.slice(0, 8).toUpperCase(),
        holder: (c.profiles as unknown as { full_name: string } | null)?.full_name || "Titulaire",
        certitude: Math.round(c.certainty_coefficient || 0),
        trustLevel: c.trust_level || "bronze",
        plan: c.plan_id?.replace("emprunteur-", "") || "découverte",
        date: new Date(c.created_at).toLocaleDateString("fr-FR"),
      }));
    },
    enabled: !!user?.id,
  });
};

// Legacy alias for backward compatibility
export const useRecentScores = useRecentCertificates;

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
        role: rolesMap.get(p.id) || "PARTENAIRE",
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

export const useAllCertificates = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-certificates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select(`
          *,
          profiles!certificates_user_id_fkey(full_name, phone)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        // Fallback without join
        const { data: fallbackData } = await supabase
          .from("certificates")
          .select("*")
          .order("created_at", { ascending: false });
        return fallbackData || [];
      }
      return data || [];
    },
    enabled: !!user?.id,
  });
};

// Legacy alias for backward compatibility
export const useAllScores = useAllCertificates;

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

// AppRole is now imported from @/lib/roles

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
