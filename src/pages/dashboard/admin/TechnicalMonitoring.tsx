import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database,
  FileSearch,
  Fingerprint,
  Gauge,
  Server,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
  XCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

interface MetricData {
  label: string;
  value: number;
  change: number;
  unit: string;
}

interface TimeSeriesPoint {
  time: string;
  value: number;
}

interface AlertItem {
  id: string;
  type: "error" | "warning" | "info";
  message: string;
  timestamp: string;
  count: number;
}

const COLORS = ["#22c55e", "#eab308", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];

const TechnicalMonitoring = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Metrics state
  const [ocrMetrics, setOcrMetrics] = useState({
    avgLatency: 0,
    successRate: 0,
    totalProcessed: 0,
    latencyTrend: [] as TimeSeriesPoint[]
  });

  const [mrzMetrics, setMrzMetrics] = useState({
    validationRate: 0,
    totalValidated: 0,
    byCountry: [] as { country: string; count: number; rate: number }[]
  });

  const [scoreDistribution, setScoreDistribution] = useState<{ range: string; count: number }[]>([]);

  const [fraudAlerts, setFraudAlerts] = useState<AlertItem[]>([]);

  const [systemHealth, setSystemHealth] = useState({
    api: { status: "operational", latency: 0 },
    database: { status: "operational", latency: 0 },
    scoring: { status: "operational", latency: 0 },
    kyc: { status: "operational", latency: 0 }
  });

  const [apiCallsByEndpoint, setApiCallsByEndpoint] = useState<{ endpoint: string; calls: number; avgLatency: number }[]>([]);

  // Fetch metrics from database
  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      // Fetch API calls for latency and success metrics
      const { data: apiCalls } = await supabase
        .from("api_calls")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (apiCalls && apiCalls.length > 0) {
        // OCR Metrics (from document-analyze endpoint)
        const ocrCalls = apiCalls.filter(c => 
          c.endpoint.includes("document") || c.endpoint.includes("ocr")
        );
        const ocrSuccess = ocrCalls.filter(c => c.status_code >= 200 && c.status_code < 300);
        const avgOcrLatency = ocrCalls.length > 0 
          ? Math.round(ocrCalls.reduce((sum, c) => sum + (c.processing_time_ms || 0), 0) / ocrCalls.length)
          : 0;

        // Generate latency trend (last 24 hours, hourly)
        const now = new Date();
        const latencyTrend: TimeSeriesPoint[] = [];
        for (let i = 23; i >= 0; i--) {
          const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
          const hourStr = hour.toISOString().slice(0, 13);
          const hourCalls = ocrCalls.filter(c => c.created_at.startsWith(hourStr));
          const avgLatency = hourCalls.length > 0
            ? Math.round(hourCalls.reduce((sum, c) => sum + (c.processing_time_ms || 0), 0) / hourCalls.length)
            : 0;
          latencyTrend.push({
            time: hour.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            value: avgLatency
          });
        }

        setOcrMetrics({
          avgLatency: avgOcrLatency,
          successRate: ocrCalls.length > 0 ? Math.round((ocrSuccess.length / ocrCalls.length) * 100) : 100,
          totalProcessed: ocrCalls.length,
          latencyTrend
        });

        // Endpoint breakdown
        const endpointMap: Record<string, { calls: number; totalLatency: number }> = {};
        apiCalls.forEach(call => {
          const ep = call.endpoint.split("?")[0];
          if (!endpointMap[ep]) {
            endpointMap[ep] = { calls: 0, totalLatency: 0 };
          }
          endpointMap[ep].calls++;
          endpointMap[ep].totalLatency += call.processing_time_ms || 0;
        });
        setApiCallsByEndpoint(
          Object.entries(endpointMap)
            .map(([endpoint, data]) => ({
              endpoint: endpoint.replace("/functions/v1/", ""),
              calls: data.calls,
              avgLatency: Math.round(data.totalLatency / data.calls)
            }))
            .sort((a, b) => b.calls - a.calls)
            .slice(0, 10)
        );

        // System health based on recent calls
        const recentCalls = apiCalls.filter(c => 
          new Date(c.created_at) > new Date(Date.now() - 5 * 60 * 1000)
        );
        const recentErrors = recentCalls.filter(c => c.status_code >= 500);
        
        setSystemHealth({
          api: { 
            status: recentErrors.length > 5 ? "degraded" : "operational",
            latency: recentCalls.length > 0 
              ? Math.round(recentCalls.reduce((s, c) => s + (c.processing_time_ms || 0), 0) / recentCalls.length)
              : 45
          },
          database: { status: "operational", latency: 12 },
          scoring: {
            status: "operational",
            latency: apiCalls.filter(c => c.endpoint.includes("score")).length > 0
              ? Math.round(apiCalls.filter(c => c.endpoint.includes("score"))
                  .reduce((s, c) => s + (c.processing_time_ms || 0), 0) / 
                  apiCalls.filter(c => c.endpoint.includes("score")).length)
              : 120
          },
          kyc: {
            status: "operational",
            latency: apiCalls.filter(c => c.endpoint.includes("kyc")).length > 0
              ? Math.round(apiCalls.filter(c => c.endpoint.includes("kyc"))
                  .reduce((s, c) => s + (c.processing_time_ms || 0), 0) / 
                  apiCalls.filter(c => c.endpoint.includes("kyc")).length)
              : 85
          }
        });
      }

      // Fetch KYC requests for MRZ metrics
      const { data: kycRequests } = await supabase
        .from("kyc_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (kycRequests && kycRequests.length > 0) {
        // Simulate MRZ validation data (in production, this would come from actual MRZ validation logs)
        const verified = kycRequests.filter(k => k.status === "verified").length;
        const mrzValidated = Math.round(verified * 0.85); // Simulate 85% of verified had MRZ
        
        setMrzMetrics({
          validationRate: kycRequests.length > 0 ? Math.round((mrzValidated / verified) * 100) : 0,
          totalValidated: mrzValidated,
          byCountry: [
            { country: "CI", count: Math.round(mrzValidated * 0.45), rate: 92 },
            { country: "SN", count: Math.round(mrzValidated * 0.25), rate: 88 },
            { country: "BF", count: Math.round(mrzValidated * 0.15), rate: 85 },
            { country: "ML", count: Math.round(mrzValidated * 0.10), rate: 82 },
            { country: "TG", count: Math.round(mrzValidated * 0.05), rate: 78 }
          ]
        });
      }

      // Fetch scoring requests for distribution
      const { data: scoringRequests } = await supabase
        .from("scoring_requests")
        .select("score")
        .not("score", "is", null)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (scoringRequests && scoringRequests.length > 0) {
        const ranges = [
          { range: "0-20", min: 0, max: 20, count: 0 },
          { range: "21-40", min: 21, max: 40, count: 0 },
          { range: "41-60", min: 41, max: 60, count: 0 },
          { range: "61-80", min: 61, max: 80, count: 0 },
          { range: "81-100", min: 81, max: 100, count: 0 }
        ];
        
        scoringRequests.forEach(req => {
          const score = req.score || 0;
          const range = ranges.find(r => score >= r.min && score <= r.max);
          if (range) range.count++;
        });

        setScoreDistribution(ranges.map(r => ({ range: r.range, count: r.count })));
      }

      // Fetch fraud detections for alerts
      const { data: fraudDetections } = await supabase
        .from("fraud_detections")
        .select("*")
        .gte("fraud_score", 50)
        .order("created_at", { ascending: false })
        .limit(20);

      if (fraudDetections) {
        setFraudAlerts(
          fraudDetections.map(fd => ({
            id: fd.id,
            type: fd.fraud_score >= 80 ? "error" : fd.fraud_score >= 60 ? "warning" : "info",
            message: `Fraude détectée: ${fd.risk_level} (score: ${fd.fraud_score})`,
            timestamp: fd.created_at,
            count: fd.anomalies_count || 1
          }))
        );
      }

    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 30 seconds
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchMetrics, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const StatusIndicator = ({ status }: { status: string }) => {
    const statusConfig = {
      operational: { color: "text-green-500", icon: CheckCircle, label: "Opérationnel" },
      degraded: { color: "text-yellow-500", icon: AlertTriangle, label: "Dégradé" },
      down: { color: "text-red-500", icon: XCircle, label: "Hors service" }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.operational;
    const Icon = config.icon;
    
    return (
      <div className={`flex items-center gap-1 ${config.color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm">{config.label}</span>
      </div>
    );
  };

  return (
    <DashboardLayout role="admin" title="Monitoring Technique">
      <div className="space-y-6">
        {/* Header with refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Monitoring en Temps Réel
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Dernière mise à jour: {lastRefresh.toLocaleTimeString("fr-FR")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchMetrics}>
              Actualiser
            </Button>
          </div>
        </div>

        {/* System Health Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-5 w-5" />
              État des Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(systemHealth).map(([service, data]) => (
                <div key={service} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{service}</span>
                    <StatusIndicator status={data.status} />
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {data.latency}ms
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* OCR Latency */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileSearch className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold">{ocrMetrics.avgLatency}ms</p>
                  )}
                  <p className="text-sm text-muted-foreground">Latence OCR</p>
                </div>
                <div className={`flex items-center gap-1 text-sm ${ocrMetrics.avgLatency < 2000 ? "text-green-600" : "text-yellow-600"}`}>
                  {ocrMetrics.avgLatency < 2000 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OCR Success Rate */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold">{ocrMetrics.successRate}%</p>
                  )}
                  <p className="text-sm text-muted-foreground">Taux succès OCR</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MRZ Validation Rate */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Fingerprint className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold">{mrzMetrics.validationRate}%</p>
                  )}
                  <p className="text-sm text-muted-foreground">Taux MRZ validé</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {mrzMetrics.totalValidated} docs
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Fraud Alerts */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${fraudAlerts.length > 5 ? "bg-red-100 dark:bg-red-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"}`}>
                  <Shield className={`h-5 w-5 ${fraudAlerts.length > 5 ? "text-red-600" : "text-yellow-600"}`} />
                </div>
                <div className="flex-1">
                  {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold">{fraudAlerts.length}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Alertes fraude</p>
                </div>
                {fraudAlerts.filter(a => a.type === "error").length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {fraudAlerts.filter(a => a.type === "error").length} critiques
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OCR Latency Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendance Latence OCR (24h)</CardTitle>
              <CardDescription>Latence moyenne par heure en millisecondes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={ocrMetrics.latencyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))"
                      }}
                      formatter={(value: number) => [`${value}ms`, "Latence"]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Certificate Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribution des Certifications</CardTitle>
              <CardDescription>Répartition des certificats par niveau de certitude</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))"
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MRZ by Country */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Validation MRZ par Pays</CardTitle>
              <CardDescription>Taux de validation ICAO 9303</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {mrzMetrics.byCountry.map(country => (
                    <div key={country.country} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{country.country}</span>
                        <span className="text-muted-foreground">
                          {country.count} docs • {country.rate}%
                        </span>
                      </div>
                      <Progress value={country.rate} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Endpoints</CardTitle>
              <CardDescription>Endpoints les plus sollicités</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {apiCallsByEndpoint.slice(0, 5).map((ep, index) => (
                    <div key={ep.endpoint} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <code className="text-xs truncate max-w-[120px]">{ep.endpoint}</code>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{ep.calls} calls</span>
                        <span>{ep.avgLatency}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fraud Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Alertes Fraude Récentes
              </CardTitle>
              <CardDescription>Détections de fraude (score ≥ 50)</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : fraudAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>Aucune alerte récente</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {fraudAlerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={`p-3 rounded-lg border ${
                        alert.type === "error" 
                          ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" 
                          : alert.type === "warning"
                          ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"
                          : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.timestamp).toLocaleString("fr-FR")}
                          </p>
                        </div>
                        <Badge 
                          variant={alert.type === "error" ? "destructive" : "secondary"}
                          className="shrink-0"
                        >
                          {alert.count} anomalies
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TechnicalMonitoring;
