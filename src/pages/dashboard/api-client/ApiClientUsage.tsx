import { 
  BarChart3, 
  Activity, 
  Clock, 
  TrendingUp,
  Zap,
  Target
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/cards/StatCard";
import { MonthlyScoresChart } from "@/components/charts/ScoreChart";
import { useApiCalls } from "@/hooks/useApiCalls";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ApiClientUsage = () => {
  const { apiCalls, stats, isLoading } = useApiCalls();

  // Calculate endpoint distribution
  const endpointStats = apiCalls.reduce((acc, call) => {
    const endpoint = call.endpoint || 'unknown';
    acc[endpoint] = (acc[endpoint] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topEndpoints = Object.entries(endpointStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calculate method distribution
  const methodStats = apiCalls.reduce((acc, call) => {
    acc[call.method] = (acc[call.method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout role="api-client" title="Utilisation API">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total appels"
          value={isLoading ? "..." : stats.totalCalls.toLocaleString()}
          icon={Activity}
          trend={{ value: 18, isPositive: true }}
          subtitle="ce mois"
        />
        <StatCard
          title="Taux de succès"
          value={isLoading ? "..." : `${stats.successRate.toFixed(1)}%`}
          icon={Target}
          subtitle="dernières 24h"
          variant="primary"
        />
        <StatCard
          title="Latence moyenne"
          value={isLoading ? "..." : `${Math.round(stats.avgLatency)}ms`}
          icon={Clock}
          trend={{ value: 8, isPositive: true }}
          subtitle="optimisé"
        />
        <StatCard
          title="Appels aujourd'hui"
          value={isLoading ? "..." : stats.callsToday.toString()}
          icon={Zap}
          subtitle="en temps réel"
          variant="secondary"
        />
      </div>

      {/* Usage Chart */}
      <div className="mb-6">
        <MonthlyScoresChart title="Évolution des appels API" />
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Endpoints */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Endpoints les plus utilisés
            </CardTitle>
            <CardDescription>
              Distribution des appels par endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : topEndpoints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Aucune donnée disponible</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topEndpoints.map(([endpoint, count], index) => {
                  const percentage = (count / apiCalls.length) * 100;
                  return (
                    <div key={endpoint} className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {endpoint}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Method Distribution */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Répartition par méthode
            </CardTitle>
            <CardDescription>
              Types de requêtes HTTP utilisées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : Object.keys(methodStats).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Aucune donnée disponible</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(methodStats).map(([method, count]) => {
                  const colors: Record<string, string> = {
                    GET: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                    POST: 'bg-green-500/10 text-green-500 border-green-500/20',
                    PUT: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
                    DELETE: 'bg-red-500/10 text-red-500 border-red-500/20',
                    PATCH: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
                  };
                  return (
                    <div 
                      key={method} 
                      className={`p-4 rounded-xl border ${colors[method] || 'bg-muted/50 border-transparent'}`}
                    >
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm font-medium">{method}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quota Info */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Quota mensuel</h3>
              <p className="text-sm text-muted-foreground">
                Votre plan actuel vous permet 10,000 appels API par mois
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {stats.totalCalls.toLocaleString()} / 10,000
              </div>
              <div className="text-sm text-muted-foreground">
                {((stats.totalCalls / 10000) * 100).toFixed(1)}% utilisé
              </div>
            </div>
          </div>
          <div className="mt-4 h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min((stats.totalCalls / 10000) * 100, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ApiClientUsage;
