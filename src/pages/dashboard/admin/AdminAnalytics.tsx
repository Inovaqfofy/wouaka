import { useState, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Award,
  Building2,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Percent
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/pricing-plans";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#6366f1'];

const AdminAnalytics = () => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '12m'>('30d');

  // Calculer les dates selon la période
  const dateRange = useMemo(() => {
    const end = new Date();
    let start: Date;
    switch (period) {
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case '90d':
        start = subDays(end, 90);
        break;
      case '12m':
        start = subDays(end, 365);
        break;
    }
    return { start, end };
  }, [period]);

  // Fetch transactions pour les revenus
  const { data: transactions, isLoading: txLoading, refetch: refetchTx } = useQuery({
    queryKey: ["admin-analytics-transactions", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("id, amount, status, created_at, metadata, currency")
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString())
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch certificate subscriptions
  const { data: certSubs, isLoading: certLoading } = useQuery({
    queryKey: ["admin-analytics-cert-subs", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_subscriptions")
        .select("id, plan_id, amount_paid, status, created_at, valid_until")
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString())
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch partner subscriptions
  const { data: partnerSubs, isLoading: partnerLoading } = useQuery({
    queryKey: ["admin-analytics-partner-subs", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id, plan_id, status, created_at, current_period_end, canceled_at")
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString())
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch total active counts
  const { data: activeCounts } = useQuery({
    queryKey: ["admin-analytics-active-counts"],
    queryFn: async () => {
      const [certResult, partnerResult] = await Promise.all([
        supabase.from("certificate_subscriptions").select("id", { count: 'exact' }).eq("status", "active"),
        supabase.from("subscriptions").select("id", { count: 'exact' }).eq("status", "active"),
      ]);
      
      return {
        activeCertificates: certResult.count || 0,
        activePartners: partnerResult.count || 0,
      };
    },
  });

  // Calculs des métriques
  const metrics = useMemo(() => {
    const completedTx = transactions?.filter(t => t.status === 'completed') || [];
    const totalRevenue = completedTx.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Calculer les revenus de la période précédente pour comparaison
    const midPoint = new Date((dateRange.start.getTime() + dateRange.end.getTime()) / 2);
    const currentPeriodTx = completedTx.filter(t => new Date(t.created_at) >= midPoint);
    const previousPeriodTx = completedTx.filter(t => new Date(t.created_at) < midPoint);
    
    const currentRevenue = currentPeriodTx.reduce((sum, t) => sum + (t.amount || 0), 0);
    const previousRevenue = previousPeriodTx.reduce((sum, t) => sum + (t.amount || 0), 0);
    const revenueTrend = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Certificats
    const newCertificates = certSubs?.length || 0;
    const activeCerts = certSubs?.filter(c => c.status === 'active').length || 0;
    const certRevenue = certSubs?.reduce((sum, c) => sum + (c.amount_paid || 0), 0) || 0;

    // Partenaires
    const newPartners = partnerSubs?.length || 0;
    const activePartners = partnerSubs?.filter(p => p.status === 'active').length || 0;
    const churnedPartners = partnerSubs?.filter(p => p.canceled_at).length || 0;
    const churnRate = newPartners > 0 ? (churnedPartners / newPartners) * 100 : 0;

    // Conversion rate (transactions pending -> completed)
    const pendingTx = transactions?.filter(t => t.status === 'pending').length || 0;
    const completedCount = completedTx.length;
    const totalAttempts = pendingTx + completedCount;
    const conversionRate = totalAttempts > 0 ? (completedCount / totalAttempts) * 100 : 0;

    // Average order value
    const avgOrderValue = completedCount > 0 ? totalRevenue / completedCount : 0;

    return {
      totalRevenue,
      revenueTrend,
      newCertificates,
      activeCerts,
      certRevenue,
      newPartners,
      activePartners,
      churnRate,
      conversionRate,
      avgOrderValue,
      completedTransactions: completedCount,
    };
  }, [transactions, certSubs, partnerSubs, dateRange]);

  // Données pour le graphique de revenus par jour
  const revenueChartData = useMemo(() => {
    if (!transactions) return [];

    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    const dailyRevenue: Record<string, { date: string; certificats: number; partenaires: number; total: number }> = {};

    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      dailyRevenue[key] = { date: format(day, 'dd MMM', { locale: fr }), certificats: 0, partenaires: 0, total: 0 };
    });

    transactions.filter(t => t.status === 'completed').forEach(tx => {
      const key = format(parseISO(tx.created_at), 'yyyy-MM-dd');
      if (dailyRevenue[key]) {
        const isCertificate = tx.metadata && typeof tx.metadata === 'object' && 'type' in tx.metadata && 
          (tx.metadata as { type?: string }).type === 'certificate_subscription';
        
        if (isCertificate) {
          dailyRevenue[key].certificats += tx.amount || 0;
        } else {
          dailyRevenue[key].partenaires += tx.amount || 0;
        }
        dailyRevenue[key].total += tx.amount || 0;
      }
    });

    return Object.values(dailyRevenue);
  }, [transactions, dateRange]);

  // Données pour le graphique de répartition par plan
  const planDistribution = useMemo(() => {
    const planCounts: Record<string, { name: string; value: number; revenue: number }> = {};

    certSubs?.forEach(sub => {
      const planName = sub.plan_id === 'emprunteur-decouverte' ? 'Découverte' :
                       sub.plan_id === 'emprunteur-essentiel' ? 'Essentiel' :
                       sub.plan_id === 'emprunteur-premium' ? 'Premium' : sub.plan_id;
      
      if (!planCounts[planName]) {
        planCounts[planName] = { name: planName, value: 0, revenue: 0 };
      }
      planCounts[planName].value++;
      planCounts[planName].revenue += sub.amount_paid || 0;
    });

    return Object.values(planCounts).sort((a, b) => b.value - a.value);
  }, [certSubs]);

  // Données pour les conversions
  const conversionData = useMemo(() => {
    if (!transactions) return [];

    const statusCounts: Record<string, number> = {
      'Complétés': 0,
      'En attente': 0,
      'Échoués': 0,
      'Annulés': 0,
    };

    transactions.forEach(tx => {
      switch (tx.status) {
        case 'completed': statusCounts['Complétés']++; break;
        case 'pending': statusCounts['En attente']++; break;
        case 'failed': statusCounts['Échoués']++; break;
        case 'cancelled': statusCounts['Annulés']++; break;
      }
    });

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const isLoading = txLoading || certLoading || partnerLoading;

  const handleRefresh = () => {
    refetchTx();
  };

  return (
    <DashboardLayout role="admin" title="Analytics & Revenus">
      <div className="space-y-6">
        {/* Header avec période */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Tableau de bord analytique</h2>
            <p className="text-muted-foreground">
              Suivi des revenus, conversions et tendances
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={period} onValueChange={(v: typeof period) => setPeriod(v)}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">90 derniers jours</SelectItem>
                <SelectItem value="12m">12 derniers mois</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* KPIs principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenus totaux</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-32 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{formatPrice(metrics.totalRevenue)} FCFA</p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${metrics.revenueTrend >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <DollarSign className={`w-6 h-6 ${metrics.revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
              {!isLoading && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${metrics.revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.revenueTrend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  <span>{Math.abs(metrics.revenueTrend).toFixed(1)}% vs période précédente</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Nouveaux certificats</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{metrics.newCertificates}</p>
                  )}
                </div>
                <div className="p-3 rounded-full bg-secondary/20">
                  <Award className="w-6 h-6 text-secondary" />
                </div>
              </div>
              {!isLoading && (
                <p className="text-sm text-muted-foreground mt-2">
                  {formatPrice(metrics.certRevenue)} FCFA de revenus
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taux de conversion</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
                  )}
                </div>
                <div className="p-3 rounded-full bg-primary/20">
                  <Target className="w-6 h-6 text-primary" />
                </div>
              </div>
              {!isLoading && (
                <p className="text-sm text-muted-foreground mt-2">
                  {metrics.completedTransactions} transactions complétées
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Panier moyen</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{formatPrice(metrics.avgOrderValue)} FCFA</p>
                  )}
                </div>
                <div className="p-3 rounded-full bg-accent/20">
                  <BarChart3 className="w-6 h-6 text-accent-foreground" />
                </div>
              </div>
              {!isLoading && (
                <p className="text-sm text-muted-foreground mt-2">
                  Actifs: {activeCounts?.activeCertificates || 0} cert. / {activeCounts?.activePartners || 0} part.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique de revenus */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Évolution des revenus
              </CardTitle>
              <CardDescription>
                Revenus par jour segmentés par type de produit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorCert" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${formatPrice(value)} FCFA`, '']}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="certificats" 
                      name="Certificats (B2C)"
                      stroke="hsl(var(--secondary))" 
                      fillOpacity={1} 
                      fill="url(#colorCert)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="partenaires" 
                      name="Partenaires (B2B)"
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorPart)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Répartition par plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Répartition par plan
              </CardTitle>
              <CardDescription>
                Distribution des ventes de certificats
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : planDistribution.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Aucune donnée pour cette période
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {planDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props) => [
                        `${value} ventes (${formatPrice(props.payload.revenue)} FCFA)`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Statut des transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Funnel de conversion
              </CardTitle>
              <CardDescription>
                Statut des transactions de paiement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : conversionData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Aucune transaction pour cette période
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={conversionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" name="Transactions" radius={[0, 4, 4, 0]}>
                      {conversionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.name === 'Complétés' ? '#10b981' :
                            entry.name === 'En attente' ? '#f59e0b' :
                            entry.name === 'Échoués' ? '#ef4444' : '#6b7280'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Métriques additionnelles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-secondary" />
                Certificats actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeCounts?.activeCertificates || 0}</div>
              <p className="text-sm text-muted-foreground">
                Total des certificats en cours de validité
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Partenaires actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeCounts?.activePartners || 0}</div>
              <p className="text-sm text-muted-foreground">
                Abonnements partenaires en cours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                Taux de churn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.churnRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">
                Partenaires ayant annulé sur la période
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
