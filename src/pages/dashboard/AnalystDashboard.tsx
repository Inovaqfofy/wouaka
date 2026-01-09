import { Link } from "react-router-dom";
import { 
  FileCheck, 
  BarChart3, 
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  AlertTriangle
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/cards/StatCard";
import { ScoreCard } from "@/components/cards/ScoreCard";
import { ScoreTrendChart, DataSourcePieChart } from "@/components/charts/ScoreChart";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalystStats, usePendingKyc, useAnalyzedScores } from "@/hooks/useAnalystStats";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const statusBadge = (status: string) => {
  const config = {
    pending: { variant: "warning" as const, label: "En attente" },
    in_progress: { variant: "secondary" as const, label: "En cours" },
    approved: { variant: "success" as const, label: "Approuvé" },
    rejected: { variant: "destructive" as const, label: "Rejeté" },
  };
  const c = config[status as keyof typeof config] || config.pending;
  return <Badge variant={c.variant}>{c.label}</Badge>;
};

const AnalystDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useAnalystStats();
  const { data: pendingKyc, isLoading: kycLoading } = usePendingKyc();
  const { data: recentScores, isLoading: scoresLoading } = useAnalyzedScores({ pageSize: 5 });

  const latestScore = recentScores?.scores[0];

  return (
    <DashboardLayout role="analyst" title="Tableau de bord Analyste">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="KYC à valider"
              value={stats?.pendingKyc?.toString() || "0"}
              icon={FileCheck}
              trend={{ value: 3, isPositive: false }}
              subtitle="en attente"
            />
            <StatCard
              title="Scores analysés"
              value={stats?.analyzedScores?.toString() || "0"}
              icon={BarChart3}
              subtitle="ce mois"
              variant="primary"
            />
            <StatCard
              title="Clients assignés"
              value={stats?.assignedClients?.toString() || "0"}
              icon={Users}
              subtitle="actifs"
            />
            <StatCard
              title="Temps moyen"
              value={stats?.avgProcessingTime || "—"}
              icon={Clock}
              trend={{ value: 15, isPositive: true }}
              subtitle="traitement KYC"
              variant="secondary"
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Pending KYC */}
        <Card className="card-premium lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              KYC en attente de validation
            </CardTitle>
            <Button size="sm" asChild>
              <Link to="/dashboard/analyst/kyc">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {kycLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <DataTable
                columns={[
                  { key: "id", header: "ID", render: (item) => (
                    <span className="font-mono text-sm">{(item.id as string).slice(0, 8).toUpperCase()}</span>
                  )},
                  { key: "name", header: "Nom complet" },
                  { key: "status", header: "Statut", render: (item) => statusBadge(item.status as string) },
                  { key: "riskFlags", header: "Alertes", render: (item) => {
                    const flags = item.riskFlags as string[];
                    return flags?.length > 0 ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {flags.length}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    );
                  }},
                  { key: "createdAt", header: "Soumis", render: (item) => (
                    <span className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(item.createdAt as string), { addSuffix: true, locale: fr })}
                    </span>
                  )},
                  { key: "actions", header: "", render: () => (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-success">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )},
                ]}
                data={pendingKyc?.slice(0, 5) || []}
              />
            )}
          </CardContent>
        </Card>

        {/* Score Preview */}
        <div className="space-y-6">
          {scoresLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <ScoreCard
              score={latestScore?.score || 0}
              grade={latestScore?.grade || "—"}
              reliability={latestScore?.confidence || 0}
              sourcesCount={6}
              trend="up"
              size="sm"
            />
          )}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="text-sm">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link to="/dashboard/analyst/kyc">
                  <FileCheck className="w-4 h-4" />
                  Nouvelle validation KYC
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link to="/dashboard/analyst/scores">
                  <BarChart3 className="w-4 h-4" />
                  Analyser un score
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link to="/dashboard/analyst/reports">
                  <FileText className="w-4 h-4" />
                  Générer un rapport
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <ScoreTrendChart title="Tendance des scores analysés" />
        <DataSourcePieChart title="Répartition des sources" />
      </div>

      {/* Recent Analysis */}
      <Card className="card-premium">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Analyses récentes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/analyst/scores">Voir tout</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {scoresLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={[
                { key: "id", header: "ID", render: (item) => (
                  <span className="font-mono text-sm">{(item.id as string).slice(0, 8).toUpperCase()}</span>
                )},
                { key: "name", header: "Entité" },
                { key: "score", header: "Score", render: (item) => (
                  <span className="font-semibold text-lg">{item.score as number || '—'}</span>
                )},
                { key: "grade", header: "Grade", render: (item) => (
                  <Badge variant="outline">{item.grade as string || '—'}</Badge>
                )},
                { key: "createdAt", header: "Date", render: (item) => (
                  <span className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(item.createdAt as string), { addSuffix: true, locale: fr })}
                  </span>
                )},
                { key: "actions", header: "", render: () => (
                  <Button variant="ghost" size="sm">Détails</Button>
                )},
              ]}
              data={recentScores?.scores || []}
            />
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AnalystDashboard;
