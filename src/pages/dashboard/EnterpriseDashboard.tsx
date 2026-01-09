import { Link } from "react-router-dom";
import { 
  FileCheck, 
  BarChart3, 
  Store,
  CreditCard,
  Plus,
  ArrowRight,
  CheckCircle,
  Loader2
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/cards/StatCard";
import { ScoreCard } from "@/components/cards/ScoreCard";
import { MonthlyScoresChart } from "@/components/charts/ScoreChart";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnterpriseStats, useScoreRequests } from "@/hooks/useEnterpriseStats";

const marketplaceProducts = [
  { name: "Crédit PME Express", provider: "Bank of Africa", rate: "8.5%", match: 92 },
  { name: "Micro-Finance Agricole", provider: "PAMECAS", rate: "12%", match: 85 },
  { name: "Leasing Équipement", provider: "Locafrique", rate: "10%", match: 78 },
];

const statusBadge = (status: string) => {
  if (status === "completed") return <Badge variant="success">Terminé</Badge>;
  if (status === "failed") return <Badge variant="destructive">Échoué</Badge>;
  return <Badge variant="warning">En cours</Badge>;
};

const EnterpriseDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useEnterpriseStats();
  const { data: recentScores, isLoading: scoresLoading } = useScoreRequests({ limit: 3 });

  return (
    <DashboardLayout role="enterprise" title="Tableau de bord Entreprise">
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
              title="Scores demandés"
              value={String(stats?.scoresRequested || 0)}
              icon={BarChart3}
              subtitle="ce mois"
            />
            <StatCard
              title="Score moyen"
              value={String(stats?.averageScore || 0)}
              icon={BarChart3}
              trend={stats?.scoreTrend ? { value: Math.abs(stats.scoreTrend), isPositive: stats.scoreTrend > 0 } : undefined}
              subtitle="vs mois dernier"
              variant="primary"
            />
            <StatCard
              title="Produits matchés"
              value={String(stats?.productsMatched || 0)}
              icon={Store}
              subtitle="disponibles"
            />
            <StatCard
              title="Crédits restants"
              value={String((stats?.creditsTotal || 50) - (stats?.creditsUsed || 0))}
              icon={CreditCard}
              subtitle={`sur ${stats?.creditsTotal || 50}`}
              variant="secondary"
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
      {/* Current Score Card */}
        {statsLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <ScoreCard
            score={stats?.averageScore || 0}
            grade={stats?.averageScore ? (stats.averageScore >= 70 ? "A" : stats.averageScore >= 50 ? "B" : "C") : "N/A"}
            reliability={Math.min(100, Math.round((stats?.completedRequests || 0) / Math.max(1, (stats?.scoresRequested || 1)) * 100))}
            sourcesCount={stats?.scoresRequested || 0}
            trend={stats?.scoreTrend && stats.scoreTrend > 0 ? "up" : stats?.scoreTrend && stats.scoreTrend < 0 ? "down" : "stable"}
          />
        )}

        {/* Quick Actions */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-between" size="lg" asChild>
              <Link to="/dashboard/enterprise/requests">
                <span className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Nouvelle demande de score
                </span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" size="lg" asChild>
              <Link to="/dashboard/enterprise/marketplace">
                <span className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Explorer la marketplace
                </span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" size="lg" asChild>
              <Link to="/kyc">
                <span className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Mettre à jour mon KYC
                </span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base">Mon abonnement</CardTitle>
            <CardDescription>Plan Business</CardDescription>
          </CardHeader>
          <CardContent>
          <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Crédits utilisés</span>
                <span className="font-semibold">
                  {statsLoading ? "..." : `${stats?.creditsUsed || 0} / ${stats?.creditsTotal || 50}`}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-secondary rounded-full transition-all" 
                  style={{ width: `${statsLoading ? 0 : Math.round(((stats?.creditsUsed || 0) / (stats?.creditsTotal || 50)) * 100)}%` }} 
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Renouvellement</span>
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle className="w-4 h-4" />
                  Actif
                </span>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dashboard/enterprise/billing">
                  Gérer l'abonnement
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <MonthlyScoresChart title="Évolution de mes scores" />
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Score Requests */}
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Mes demandes de score</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/enterprise/requests">Voir tout</Link>
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
                  { key: "subject", header: "Objet" },
                  { key: "score", header: "Score", render: (item) => 
                    (item.score as number | null) ? (
                      <span className="font-semibold">{item.score as number}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  },
                  { key: "status", header: "Statut", render: (item) => statusBadge(item.status as string) },
                  { key: "date", header: "Date" },
                ]}
                data={(recentScores || []) as unknown as Record<string, unknown>[]}
              />
            )}
          </CardContent>
        </Card>

        {/* Marketplace Recommendations */}
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Produits recommandés</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/enterprise/marketplace">Marketplace</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketplaceProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.provider} • {product.rate}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{product.match}% match</Badge>
                    <Button variant="link" size="sm" className="p-0 h-auto mt-1 block" asChild>
                      <Link to="/dashboard/enterprise/marketplace">
                        Voir détails
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EnterpriseDashboard;
