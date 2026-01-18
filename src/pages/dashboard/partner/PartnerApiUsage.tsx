import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  TrendingUp,
  Clock,
  Zap
} from "lucide-react";
import { useApiCalls } from "@/hooks/useApiCalls";

const PartnerApiUsage = () => {
  const { apiCalls, isLoading } = useApiCalls();

  // Calculate stats
  const totalCalls = apiCalls?.length || 0;
  const successCalls = apiCalls?.filter(c => c.status_code >= 200 && c.status_code < 300).length || 0;
  const successRate = totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0;
  const avgLatency = apiCalls && apiCalls.length > 0 
    ? Math.round(apiCalls.reduce((sum, c) => sum + (c.processing_time_ms || 0), 0) / apiCalls.length)
    : 0;

  // Quota info (placeholder)
  const quota = {
    used: totalCalls,
    total: 10000,
    percentage: Math.min((totalCalls / 10000) * 100, 100)
  };

  // Top endpoints
  const endpointCounts = apiCalls?.reduce((acc, call) => {
    acc[call.endpoint] = (acc[call.endpoint] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const topEndpoints = Object.entries(endpointCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <DashboardLayout role="partner" title="Utilisation API">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{totalCalls.toLocaleString()}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Total appels</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{successRate}%</p>
                  )}
                  <p className="text-sm text-muted-foreground">Taux de succès</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-blue-600">{avgLatency}ms</p>
                  )}
                  <p className="text-sm text-muted-foreground">Latence moyenne</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-yellow-600">
                      {apiCalls?.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length || 0}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quota Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Quota Mensuel</CardTitle>
              <CardDescription>Utilisation de votre quota d'appels API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{quota.used.toLocaleString()} appels utilisés</span>
                    <span>{quota.total.toLocaleString()} total</span>
                  </div>
                  <Progress value={quota.percentage} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {Math.round(quota.percentage)}% de votre quota utilisé
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    <strong>Renouvellement:</strong> 1er du mois prochain
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Restant: {(quota.total - quota.used).toLocaleString()} appels
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle>Endpoints les Plus Utilisés</CardTitle>
              <CardDescription>Top 5 des endpoints les plus appelés</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : topEndpoints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune donnée disponible
                </div>
              ) : (
                <div className="space-y-3">
                  {topEndpoints.map(([endpoint, count], index) => (
                    <div key={endpoint} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <code className="text-sm font-mono">{endpoint}</code>
                      </div>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Method Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution par Méthode HTTP</CardTitle>
            <CardDescription>Répartition des appels par méthode</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['GET', 'POST', 'PUT', 'DELETE'].map((method) => {
                  const count = apiCalls?.filter(c => c.method === method).length || 0;
                  const percentage = totalCalls > 0 ? Math.round((count / totalCalls) * 100) : 0;
                  return (
                    <div key={method} className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm font-mono text-muted-foreground">{method}</p>
                      <p className="text-xs text-muted-foreground">{percentage}%</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PartnerApiUsage;
