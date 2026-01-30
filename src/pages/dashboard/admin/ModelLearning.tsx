import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  RefreshCcw, 
  GitBranch,
  Beaker,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { analyzeFeaturePerformance, type FeaturePerformance } from '@/lib/learning/weight-adjuster';
import { getActiveModelVersion, listModelVersions, type ModelVersion } from '@/lib/learning/model-versioner';
import { listExperiments, type ABExperiment } from '@/lib/learning/ab-testing';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface LearningMetrics {
  totalOutcomes: number;
  outcomesThisMonth: number;
  defaultRate: number;
  modelAuc: number;
  modelGini: number;
  retrainingRecommended: boolean;
  retrainingReason?: string;
}

export default function ModelLearning() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
  const [featurePerformances, setFeaturePerformances] = useState<FeaturePerformance[]>([]);
  const [activeModel, setActiveModel] = useState<ModelVersion | null>(null);
  const [modelVersions, setModelVersions] = useState<ModelVersion[]>([]);
  const [experiments, setExperiments] = useState<ABExperiment[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [
        active,
        { versions },
        exps,
        { data: outcomes },
        { data: monthlyOutcomes }
      ] = await Promise.all([
        getActiveModelVersion(),
        listModelVersions({ limit: 10 }),
        listExperiments({ limit: 5 }),
        supabase.from('loan_outcomes').select('repayment_status', { count: 'exact' }),
        supabase.from('loan_outcomes')
          .select('repayment_status')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      setActiveModel(active);
      setModelVersions(versions);
      setExperiments(exps);

      // Calculate metrics
      const totalOutcomes = outcomes?.length || 0;
      const defaults = outcomes?.filter(o => o.repayment_status === 'default' || o.repayment_status === 'late_90').length || 0;
      const defaultRate = totalOutcomes > 0 ? (defaults / totalOutcomes) * 100 : 0;

      setMetrics({
        totalOutcomes,
        outcomesThisMonth: monthlyOutcomes?.length || 0,
        defaultRate,
        modelAuc: active?.validationAuc || 0.72,
        modelGini: active?.validationGini || 0.44,
        retrainingRecommended: totalOutcomes > 500 && defaultRate > 15,
        retrainingReason: defaultRate > 15 ? 'Taux de défaut élevé' : undefined
      });

      // Load feature performances if we have enough data
      if (totalOutcomes >= 100) {
        const result = await analyzeFeaturePerformance(100);
        setFeaturePerformances(result.featurePerformances);
      }
    } catch (error) {
      console.error('Error loading learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeFeaturePerformance(50);
      setFeaturePerformances(result.featurePerformances);
    } catch (error) {
      console.error('Error analyzing features:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getDriftBadge = (severity: FeaturePerformance['driftSeverity']) => {
    const variants = {
      none: { variant: 'outline' as const, label: 'Stable' },
      minor: { variant: 'secondary' as const, label: 'Mineur' },
      moderate: { variant: 'default' as const, label: 'Modéré' },
      major: { variant: 'destructive' as const, label: 'Majeur' },
      critical: { variant: 'destructive' as const, label: 'Critique' }
    };
    const config = variants[severity];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTrendIcon = (current: number, suggested: number) => {
    const diff = suggested - current;
    if (Math.abs(diff) < 0.01) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (diff > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    return <ArrowDownRight className="h-4 w-4 text-red-500" />;
  };

  // Prepare chart data
  const featureRadarData = featurePerformances.map(f => ({
    feature: f.featureName.substring(0, 15),
    'Poids actuel': f.currentWeight * 100,
    'Poids suggéré': f.suggestedWeight * 100,
    'Pouvoir prédictif': f.predictivePower * 100
  }));

  const outcomesTrendData = [
    { month: 'Sep', outcomes: 45, defaults: 5 },
    { month: 'Oct', outcomes: 78, defaults: 8 },
    { month: 'Nov', outcomes: 112, defaults: 11 },
    { month: 'Dec', outcomes: 156, defaults: 14 },
    { month: 'Jan', outcomes: metrics?.outcomesThisMonth || 0, defaults: Math.round((metrics?.outcomesThisMonth || 0) * (metrics?.defaultRate || 0) / 100) }
  ];

  if (loading) {
    return (
      <DashboardLayout role="admin" title="Apprentissage du Modèle">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" title="Apprentissage du Modèle">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Self-Learning Engine
            </h1>
            <p className="text-muted-foreground">
              Modèle actif: {activeModel?.version || 'v5.0.0'} • 
              {metrics?.totalOutcomes || 0} outcomes collectés
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={handleAnalyze} disabled={analyzing}>
              <Target className="h-4 w-4 mr-2" />
              {analyzing ? 'Analyse...' : 'Analyser Features'}
            </Button>
          </div>
        </div>

        {/* Retraining Alert */}
        {metrics?.retrainingRecommended && (
          <Card className="border-orange-500/50 bg-orange-500/10">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Réentraînement recommandé</p>
                  <p className="text-sm text-muted-foreground">{metrics.retrainingReason}</p>
                </div>
              </div>
              <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500/10">
                Créer nouvelle version
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Outcomes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalOutcomes || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{metrics?.outcomesThisMonth || 0} ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taux de Défaut
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {metrics?.defaultRate?.toFixed(1) || 0}%
                {(metrics?.defaultRate || 0) > 15 ? (
                  <TrendingUp className="h-5 w-5 text-red-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-green-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Cible: &lt;10%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                AUC Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.modelAuc?.toFixed(2) || 'N/A'}</div>
              <Progress value={(metrics?.modelAuc || 0) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gini Coefficient
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.modelGini?.toFixed(2) || 'N/A'}</div>
              <Progress value={(metrics?.modelGini || 0) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="features" className="space-y-4">
          <TabsList>
            <TabsTrigger value="features">
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance Features
            </TabsTrigger>
            <TabsTrigger value="versions">
              <GitBranch className="h-4 w-4 mr-2" />
              Versions
            </TabsTrigger>
            <TabsTrigger value="experiments">
              <Beaker className="h-4 w-4 mr-2" />
              A/B Tests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Feature Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribution des Poids</CardTitle>
                  <CardDescription>Comparaison poids actuels vs suggérés</CardDescription>
                </CardHeader>
                <CardContent>
                  {featurePerformances.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={featureRadarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="feature" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 30]} />
                        <Radar name="Poids actuel" dataKey="Poids actuel" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                        <Radar name="Poids suggéré" dataKey="Poids suggéré" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.3} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Pas assez de données pour l'analyse
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Outcomes Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Évolution des Outcomes</CardTitle>
                  <CardDescription>Volume et défauts par mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={outcomesTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="outcomes" name="Outcomes" fill="hsl(var(--primary))" />
                      <Bar dataKey="defaults" name="Défauts" fill="hsl(var(--destructive))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Feature Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Analyse des Features</CardTitle>
                <CardDescription>Performance et recommandations d'ajustement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {featurePerformances.length > 0 ? (
                    featurePerformances.map((fp) => (
                      <div key={fp.featureId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{fp.featureName}</span>
                            {getDriftBadge(fp.driftSeverity)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {fp.adjustmentReason || 'Aucun ajustement nécessaire'}
                          </p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="text-muted-foreground">Poids actuel</div>
                            <div className="font-medium">{(fp.currentWeight * 100).toFixed(1)}%</div>
                          </div>
                          <div className="flex items-center">
                            {getTrendIcon(fp.currentWeight, fp.suggestedWeight)}
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">Suggéré</div>
                            <div className="font-medium">{(fp.suggestedWeight * 100).toFixed(1)}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">Pouvoir prédictif</div>
                            <div className="font-medium">{(fp.predictivePower * 100).toFixed(0)}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">Confiance</div>
                            <Progress value={fp.adjustmentConfidence * 100} className="w-16 h-2" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Cliquez sur "Analyser Features" pour calculer les performances</p>
                      <p className="text-sm">Minimum 100 outcomes requis</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="versions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Versions</CardTitle>
                <CardDescription>Évolution du modèle de scoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modelVersions.map((version) => (
                    <div 
                      key={version.id} 
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        version.isActive ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{version.version}</span>
                            {version.isActive && (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Actif
                              </Badge>
                            )}
                            <Badge variant="outline">{version.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{version.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="text-muted-foreground">AUC</div>
                          <div className="font-medium">{version.validationAuc?.toFixed(2) || 'N/A'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">Gini</div>
                          <div className="font-medium">{version.validationGini?.toFixed(2) || 'N/A'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">Échantillon</div>
                          <div className="font-medium">{version.trainingSampleSize || 0}</div>
                        </div>
                        <div className="text-center text-muted-foreground">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {new Date(version.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {modelVersions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune version de modèle disponible</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experiments" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Expériences A/B</CardTitle>
                  <CardDescription>Tests de nouvelles configurations</CardDescription>
                </div>
                <Button>
                  <Beaker className="h-4 w-4 mr-2" />
                  Nouvelle expérience
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {experiments.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{exp.name}</span>
                          <Badge variant={
                            exp.status === 'running' ? 'default' :
                            exp.status === 'completed' ? 'secondary' :
                            'outline'
                          }>
                            {exp.status}
                          </Badge>
                          {exp.winner && (
                            <Badge variant={exp.winner === 'treatment' ? 'default' : 'secondary'}>
                              Gagnant: {exp.winner}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{exp.hypothesis}</p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="text-muted-foreground">Split</div>
                          <div className="font-medium">{Math.round(exp.trafficSplit * 100)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">Contrôle</div>
                          <div className="font-medium">{exp.controlRequests}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">Traitement</div>
                          <div className="font-medium">{exp.treatmentRequests}</div>
                        </div>
                        {exp.statisticalSignificance && (
                          <div className="text-center">
                            <div className="text-muted-foreground">Signif.</div>
                            <div className="font-medium">{exp.statisticalSignificance.toFixed(0)}%</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {experiments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Beaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune expérience A/B en cours</p>
                      <p className="text-sm">Créez une expérience pour tester de nouvelles configurations</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
