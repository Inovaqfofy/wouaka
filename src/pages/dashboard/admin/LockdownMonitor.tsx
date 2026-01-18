import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Ban,
  Clock,
  Zap,
  Globe,
  Server,
  RefreshCw,
  Activity,
  TrendingUp,
  Eye,
  Lock,
  Radio,
  Wifi,
  WifiOff
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
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
  Cell
} from "recharts";

interface BlockedRequest {
  id: string;
  feature_name: string;
  endpoint: string | null;
  method: string | null;
  ip_address: string | null;
  api_key_prefix: string | null;
  block_reason: string;
  error_message: string | null;
  created_at: string;
}

interface FeatureStatus {
  feature_name: string;
  display_name: string;
  is_active: boolean;
  blocked_count: number;
}

interface LockdownState {
  is_full_lockdown: boolean;
  is_read_only_mode: boolean;
  lockdown_message: string;
  locked_at: string | null;
}

interface LiveStats {
  total_blocked: number;
  blocked_last_hour: number;
  blocked_last_5min: number;
  unique_ips: number;
  top_feature: string;
}

const CHART_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

const LockdownMonitor = () => {
  const [blockedRequests, setBlockedRequests] = useState<BlockedRequest[]>([]);
  const [features, setFeatures] = useState<FeatureStatus[]>([]);
  const [lockdown, setLockdown] = useState<LockdownState | null>(null);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [featureDistribution, setFeatureDistribution] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      // Get lockdown state
      const { data: lockdownData } = await supabase
        .from('system_lockdown_state')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();
      
      setLockdown(lockdownData);

      // Get feature status with blocked counts
      const { data: featuresData } = await supabase
        .from('system_security_controls')
        .select('*');

      if (featuresData) {
        const featuresWithCounts = await Promise.all(
          featuresData.map(async (f) => {
            const { count } = await supabase
              .from('blocked_requests')
              .select('*', { count: 'exact', head: true })
              .eq('feature_name', f.feature_name)
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
            
            return {
              feature_name: f.feature_name,
              display_name: f.display_name,
              is_active: f.is_active,
              blocked_count: count || 0
            };
          })
        );
        setFeatures(featuresWithCounts);

        // Feature distribution for pie chart
        const distribution = featuresWithCounts
          .filter(f => f.blocked_count > 0)
          .map(f => ({
            name: f.display_name,
            value: f.blocked_count
          }));
        setFeatureDistribution(distribution);
      }

      // Get recent blocked requests
      const { data: recentBlocked } = await supabase
        .from('blocked_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setBlockedRequests(recentBlocked || []);

      // Calculate live stats
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const { count: totalBlocked } = await supabase
        .from('blocked_requests')
        .select('*', { count: 'exact', head: true });

      const { count: blockedLastHour } = await supabase
        .from('blocked_requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', hourAgo.toISOString());

      const { count: blockedLast5Min } = await supabase
        .from('blocked_requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', fiveMinAgo.toISOString());

      const { data: uniqueIpsData } = await supabase
        .from('blocked_requests')
        .select('ip_address')
        .gte('created_at', hourAgo.toISOString());

      const uniqueIps = new Set(uniqueIpsData?.map(r => r.ip_address).filter(Boolean)).size;

      // Find top blocked feature
      const topFeature = features.reduce((max, f) => 
        f.blocked_count > (max?.blocked_count || 0) ? f : max, 
        features[0]
      );

      setLiveStats({
        total_blocked: totalBlocked || 0,
        blocked_last_hour: blockedLastHour || 0,
        blocked_last_5min: blockedLast5Min || 0,
        unique_ips: uniqueIps,
        top_feature: topFeature?.display_name || 'N/A'
      });

      // Generate chart data (blocked per 5min intervals for last hour)
      const chartPoints = [];
      for (let i = 12; i >= 0; i--) {
        const start = new Date(now.getTime() - (i + 1) * 5 * 60 * 1000);
        const end = new Date(now.getTime() - i * 5 * 60 * 1000);
        
        const { count } = await supabase
          .from('blocked_requests')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start.toISOString())
          .lt('created_at', end.toISOString());

        chartPoints.push({
          time: format(end, 'HH:mm'),
          blocked: count || 0
        });
      }
      setChartData(chartPoints);

    } catch (error) {
      console.error('Error fetching lockdown data:', error);
    } finally {
      setLoading(false);
    }
  }, [features]);

  // Set up realtime subscription
  useEffect(() => {
    fetchData();

    // Subscribe to realtime blocked_requests
    const channel = supabase
      .channel('lockdown-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blocked_requests'
        },
        (payload) => {
          const newRequest = payload.new as BlockedRequest;
          
          // Add to the list
          setBlockedRequests(prev => [newRequest, ...prev.slice(0, 49)]);
          
          // Update stats
          setLiveStats(prev => prev ? {
            ...prev,
            total_blocked: prev.total_blocked + 1,
            blocked_last_hour: prev.blocked_last_hour + 1,
            blocked_last_5min: prev.blocked_last_5min + 1
          } : null);

          // Update feature count
          setFeatures(prev => prev.map(f => 
            f.feature_name === newRequest.feature_name 
              ? { ...f, blocked_count: f.blocked_count + 1 }
              : f
          ));

          // Update chart (add to last point)
          setChartData(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1].blocked += 1;
            }
            return updated;
          });

          // Show toast for new blocked request
          toast({
            title: "🚫 Requête bloquée",
            description: `${newRequest.feature_name} depuis ${newRequest.ip_address || 'IP inconnue'}`,
            variant: "destructive"
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_lockdown_state'
        },
        () => {
          // Refresh lockdown state
          fetchData();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchData, toast]);

  const getBlockReasonBadge = (reason: string) => {
    switch (reason) {
      case 'full_lockdown':
        return <Badge variant="destructive"><Lock className="h-3 w-3 mr-1" />Full Lockdown</Badge>;
      case 'read_only_mode':
        return <Badge className="bg-yellow-500"><Eye className="h-3 w-3 mr-1" />Lecture Seule</Badge>;
      case 'feature_disabled':
        return <Badge variant="secondary"><Ban className="h-3 w-3 mr-1" />Service Désactivé</Badge>;
      default:
        return <Badge>{reason}</Badge>;
    }
  };

  const isSystemLocked = lockdown?.is_full_lockdown || lockdown?.is_read_only_mode;

  return (
    <DashboardLayout role="admin" title="Lockdown Monitor">
      <div className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-5 w-5 text-green-500 animate-pulse" />
                <span className="text-sm text-green-600 font-medium">Connexion temps réel active</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Connexion en cours...</span>
              </>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* System Status Banner */}
        {isSystemLocked && (
          <Alert variant={lockdown?.is_full_lockdown ? "destructive" : "default"} className={lockdown?.is_full_lockdown ? "border-destructive bg-destructive/10" : "border-yellow-500 bg-yellow-500/10"}>
            {lockdown?.is_full_lockdown ? (
              <ShieldAlert className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5 text-yellow-600" />
            )}
            <AlertTitle className="font-bold">
              {lockdown?.is_full_lockdown ? "🚨 FULL LOCKDOWN ACTIF" : "👁️ Mode Lecture Seule Actif"}
            </AlertTitle>
            <AlertDescription>
              {lockdown?.lockdown_message}
              {lockdown?.locked_at && (
                <span className="block text-sm mt-1 opacity-80">
                  Activé {formatDistanceToNow(new Date(lockdown.locked_at), { locale: fr, addSuffix: true })}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Live Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bloqué</p>
                  <p className="text-2xl font-bold text-destructive">{liveStats?.total_blocked || 0}</p>
                </div>
                <Ban className="h-8 w-8 text-destructive/30" />
              </div>
            </CardContent>
          </Card>

          <Card className={liveStats?.blocked_last_5min ? "border-destructive/50 bg-destructive/5" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">5 dernières min</p>
                  <p className="text-2xl font-bold">{liveStats?.blocked_last_5min || 0}</p>
                </div>
                <Radio className={`h-8 w-8 ${liveStats?.blocked_last_5min ? 'text-destructive animate-pulse' : 'text-muted-foreground/30'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dernière heure</p>
                  <p className="text-2xl font-bold">{liveStats?.blocked_last_hour || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">IPs Uniques</p>
                  <p className="text-2xl font-bold">{liveStats?.unique_ips || 0}</p>
                </div>
                <Globe className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Service le + touché</p>
                  <p className="text-lg font-bold truncate">{liveStats?.top_feature || 'N/A'}</p>
                </div>
                <Zap className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Blocked Requests Timeline */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Requêtes Bloquées (dernière heure)
              </CardTitle>
              <CardDescription>
                Évolution par intervalles de 5 minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="blocked" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--destructive))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Feature Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Par Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              {featureDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={featureDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {featureDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Aucune donnée
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Services Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              État des Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {features.map((feature) => (
                <div 
                  key={feature.feature_name}
                  className={`p-4 rounded-lg border text-center ${
                    !feature.is_active 
                      ? 'bg-destructive/10 border-destructive/30' 
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {feature.is_active ? (
                      <ShieldCheck className="h-6 w-6 text-green-500" />
                    ) : (
                      <ShieldAlert className="h-6 w-6 text-destructive" />
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{feature.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {feature.blocked_count} bloqué{feature.blocked_count > 1 ? 's' : ''} (24h)
                  </p>
                  {feature.blocked_count > 0 && (
                    <Progress 
                      value={Math.min(100, (feature.blocked_count / (liveStats?.total_blocked || 1)) * 100)} 
                      className="h-1 mt-2"
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-destructive animate-pulse" />
              Flux en Direct des Requêtes Bloquées
            </CardTitle>
            <CardDescription>
              Les 50 dernières tentatives bloquées par le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {blockedRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mb-4 opacity-30" />
                  <p>Aucune requête bloquée</p>
                  <p className="text-sm">Le système fonctionne normalement</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedRequests.map((req, index) => (
                    <div 
                      key={req.id}
                      className={`p-3 rounded-lg border bg-muted/20 ${
                        index === 0 ? 'animate-in fade-in slide-in-from-top-2 duration-300 border-destructive/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-medium">
                              {req.feature_name}
                            </span>
                            {getBlockReasonBadge(req.block_reason)}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            {req.endpoint && (
                              <span className="flex items-center gap-1">
                                <code className="bg-muted px-1 rounded">{req.method || 'POST'}</code>
                                {req.endpoint}
                              </span>
                            )}
                            {req.ip_address && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {req.ip_address}
                              </span>
                            )}
                            {req.api_key_prefix && (
                              <span className="font-mono">
                                {req.api_key_prefix}...
                              </span>
                            )}
                          </div>
                          {req.error_message && (
                            <p className="text-xs text-destructive mt-1">
                              {req.error_message}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(req.created_at), { locale: fr, addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LockdownMonitor;