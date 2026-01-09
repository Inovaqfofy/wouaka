import { Link } from "react-router-dom";
import { 
  Users, 
  FileCheck, 
  BarChart3, 
  AlertCircle,
  CheckCircle,
  DollarSign,
  Activity
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/cards/StatCard";
import { ScoreDistributionChart, MonthlyScoresChart, DataSourcePieChart } from "@/components/charts/ScoreChart";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats, useRecentKyc, useRecentScores } from "@/hooks/useAdminStats";

const statusBadge = (status: string) => {
  const variants: Record<string, { variant: "warning" | "success" | "destructive"; label: string }> = {
    pending: { variant: "warning", label: "En attente" },
    approved: { variant: "success", label: "Approuvé" },
    rejected: { variant: "destructive", label: "Rejeté" },
  };
  const config = variants[status] || variants.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const AdminDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: recentKyc, isLoading: kycLoading } = useRecentKyc(4);
  const { data: recentScores, isLoading: scoresLoading } = useRecentScores(3);

  const formatRevenue = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M FCFA`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K FCFA`;
    return `${amount} FCFA`;
  };

  return (
    <DashboardLayout role="admin" title="Tableau de bord Super Admin">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Utilisateurs actifs"
              value={String(stats?.activeUsers || 0)}
              icon={Users}
              trend={{ value: stats?.usersTrend || 0, isPositive: (stats?.usersTrend || 0) > 0 }}
              subtitle="vs mois dernier"
            />
            <StatCard
              title="Scores calculés"
              value={String(stats?.totalScores || 0)}
              icon={BarChart3}
              trend={{ value: Math.abs(stats?.scoresTrend || 0), isPositive: (stats?.scoresTrend || 0) > 0 }}
              subtitle="ce mois"
              variant="primary"
            />
            <StatCard
              title="KYC en attente"
              value={String(stats?.pendingKyc || 0)}
              icon={FileCheck}
              trend={{ value: Math.abs(stats?.kycTrend || 0), isPositive: (stats?.kycTrend || 0) < 0 }}
              subtitle="à valider"
            />
            <StatCard
              title="Revenus"
              value={formatRevenue(stats?.monthlyRevenue || 0)}
              icon={DollarSign}
              trend={{ value: stats?.revenueTrend || 0, isPositive: (stats?.revenueTrend || 0) > 0 }}
              subtitle="ce mois"
              variant="secondary"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <MonthlyScoresChart className="lg:col-span-2" />
        <DataSourcePieChart />
      </div>

      {/* Score Distribution */}
      <div className="mb-6">
        <ScoreDistributionChart />
      </div>

      {/* Tables Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent KYC */}
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">KYC récents</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/admin/kyc">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {kycLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <DataTable
                columns={[
                  { key: "id", header: "ID" },
                  { key: "name", header: "Nom" },
                  { key: "status", header: "Statut", render: (item) => statusBadge(item.status as string) },
                  { key: "date", header: "Date" },
                ]}
                data={(recentKyc || []) as unknown as Record<string, unknown>[]}
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Scores */}
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Scores récents</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/admin/scores">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {scoresLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <DataTable
                columns={[
                  { key: "entity", header: "Entité" },
                  { key: "score", header: "Score", render: (item) => (
                    <span className="font-semibold">{item.score as number}</span>
                  )},
                  { key: "grade", header: "Grade", render: (item) => (
                    <Badge variant="secondary">{item.grade as string}</Badge>
                  )},
                  { key: "date", header: "Date" },
                ]}
                data={(recentScores || []) as unknown as Record<string, unknown>[]}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="card-premium mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-5 h-5" />
            État du système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { name: "API Gateway", status: "operational", latency: "45ms" },
              { name: "Service Scoring", status: "operational", latency: "120ms" },
              { name: "Service KYC", status: "operational", latency: "85ms" },
              { name: "Base de données", status: "operational", latency: "12ms" },
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">{service.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{service.latency}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminDashboard;
