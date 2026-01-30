import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  User,
  Phone,
  MapPin,
  Shield,
  BarChart3,
  Lightbulb,
  Wallet,
  Heart,
  Users,
  Leaf,
  Fingerprint,
  Target,
  AlertCircle,
  Info,
  DollarSign,
  Calendar,
  Percent,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Zap
} from "lucide-react";

interface SubScore {
  name: string;
  value: number;
  weight: number;
  confidence?: number;
  factors?: string[];
}

interface Factor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  contribution: number;
  description?: string;
}

interface FraudAlert {
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggered: boolean;
  description?: string;
  score_impact?: number;
}

interface ImprovementSuggestion {
  action: string;
  potential_gain: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeframe?: string;
}

interface CreditRecommendation {
  decision: 'approved' | 'manual_review' | 'rejected';
  max_amount?: number;
  max_duration_months?: number;
  suggested_rate?: number;
  conditions?: string[];
  rationale?: string;
}

const PartnerEvaluationDetail = () => {
  const { evaluationId } = useParams();

  // Fetch scoring request details
  const { data: evaluation, isLoading } = useQuery({
    queryKey: ['evaluation-detail', evaluationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scoring_requests')
        .select(`
          *,
          customer_profiles (
            id,
            external_reference,
            identity_data,
            data_sources,
            composite_score,
            reliability_score,
            stability_score,
            risk_score
          )
        `)
        .eq('id', evaluationId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!evaluationId,
  });

  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'bg-muted text-muted-foreground';
    switch (grade.toUpperCase()) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B':
        return 'bg-blue-100 text-blue-800';
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'D':
        return 'bg-orange-100 text-orange-800';
      case 'E':
      case 'F':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskColor = (risk: string | null) => {
    switch (risk?.toLowerCase()) {
      case 'low':
      case 'very_low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
      case 'very_high':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getSubScoreIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('identit')) return <Fingerprint className="w-5 h-5" />;
    if (lowerName.includes('cashflow') || lowerName.includes('financ')) return <Wallet className="w-5 h-5" />;
    if (lowerName.includes('behavior') || lowerName.includes('comport')) return <Heart className="w-5 h-5" />;
    if (lowerName.includes('discipl')) return <Target className="w-5 h-5" />;
    if (lowerName.includes('social') || lowerName.includes('capital')) return <Users className="w-5 h-5" />;
    if (lowerName.includes('environ')) return <Leaf className="w-5 h-5" />;
    return <BarChart3 className="w-5 h-5" />;
  };

  const getSubScoreColor = (value: number) => {
    if (value >= 70) return 'text-green-600';
    if (value >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Badge className="bg-green-100 text-green-800">Facile</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Moyen</Badge>;
      case 'hard':
        return <Badge className="bg-red-100 text-red-800">Difficile</Badge>;
      default:
        return <Badge variant="outline">{difficulty}</Badge>;
    }
  };

  // Parse sub_scores JSONB
  const subScores: SubScore[] = evaluation?.sub_scores 
    ? (Array.isArray(evaluation.sub_scores) 
        ? (evaluation.sub_scores as unknown as SubScore[])
        : Object.entries(evaluation.sub_scores as Record<string, unknown>).map(([name, data]) => ({
            name,
            value: 0,
            weight: 1,
            ...(typeof data === 'object' && data !== null ? data as object : {})
          })) as SubScore[])
    : [];

  // Parse positive and negative factors
  const positiveFactors: Factor[] = evaluation?.positive_factors 
    ? (Array.isArray(evaluation.positive_factors) 
        ? (evaluation.positive_factors as unknown as Factor[])
        : [])
    : [];

  const negativeFactors: Factor[] = evaluation?.negative_factors 
    ? (Array.isArray(evaluation.negative_factors) 
        ? (evaluation.negative_factors as unknown as Factor[])
        : [])
    : [];

  // Parse fraud_analysis JSONB
  const fraudAnalysis = evaluation?.fraud_analysis as { alerts?: FraudAlert[], overall_score?: number, risk_level?: string } | null;
  const fraudAlerts: FraudAlert[] = fraudAnalysis?.alerts || [];

  // Parse improvement_suggestions JSONB
  const improvementSuggestions: ImprovementSuggestion[] = evaluation?.improvement_suggestions 
    ? (Array.isArray(evaluation.improvement_suggestions) 
        ? (evaluation.improvement_suggestions as unknown as ImprovementSuggestion[])
        : [])
    : [];

  // Parse credit_recommendation JSONB
  const creditRecommendation: CreditRecommendation | null = evaluation?.credit_recommendation 
    ? (typeof evaluation.credit_recommendation === 'object' && !Array.isArray(evaluation.credit_recommendation)
        ? (evaluation.credit_recommendation as unknown as CreditRecommendation)
        : null)
    : null;

  // Data quality indicator
  const dataQuality = evaluation?.data_quality || 'unknown';

  // Build default factors if none provided
  const displayedPositiveFactors = positiveFactors.length > 0 ? positiveFactors : [
    ...(evaluation?.score && evaluation.score >= 70 ? [{ name: "Bon score global", impact: 'positive' as const, contribution: 20, description: "Score supérieur à la moyenne" }] : []),
    ...(evaluation?.confidence && evaluation.confidence >= 70 ? [{ name: "Haute confiance", impact: 'positive' as const, contribution: 15, description: "Données fiables et vérifiées" }] : []),
  ];

  const displayedNegativeFactors = negativeFactors.length > 0 ? negativeFactors : [
    ...(evaluation?.risk_category === 'high' || evaluation?.risk_category === 'very_high' ? [{ name: "Niveau de risque élevé", impact: 'negative' as const, contribution: -20, description: "Profil à risque détecté" }] : []),
  ];

  // Build default sub-scores from evaluation data
  const displayedSubScores: SubScore[] = subScores.length > 0 ? subScores : [
    { name: "Identité", value: evaluation?.engagement_capacity_score || 50, weight: 0.15 },
    { name: "Cashflow", value: evaluation?.score ? Math.round(evaluation.score * 0.8 / 10) : 0, weight: 0.25 },
    { name: "Comportement", value: evaluation?.confidence || 50, weight: 0.20 },
    { name: "Discipline de paiement", value: evaluation?.score ? Math.round(evaluation.score * 0.7 / 10) : 0, weight: 0.20 },
    { name: "Capital social", value: evaluation?.score ? Math.round(evaluation.score * 0.5 / 10) : 0, weight: 0.10 },
    { name: "Environnement", value: evaluation?.score ? Math.round(evaluation.score * 0.6 / 10) : 0, weight: 0.10 },
  ].filter(s => s.value > 0);

  // Build default recommendation if none provided
  const displayedRecommendation: CreditRecommendation = creditRecommendation || {
    decision: evaluation?.risk_category === 'low' || evaluation?.risk_category === 'very_low' 
      ? 'approved' 
      : evaluation?.risk_category === 'medium' 
        ? 'manual_review' 
        : 'rejected',
    max_amount: evaluation?.score ? Math.round(evaluation.score * 10000) : undefined,
    max_duration_months: evaluation?.score && evaluation.score >= 55 ? 12 : 6,
    suggested_rate: evaluation?.risk_category === 'low' ? 12 : evaluation?.risk_category === 'medium' ? 18 : 24,
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2"><CheckCircle className="w-4 h-4 mr-2" />Approuvé</Badge>;
      case 'manual_review':
        return <Badge className="bg-yellow-100 text-yellow-800 text-lg px-4 py-2"><AlertCircle className="w-4 h-4 mr-2" />Examen manuel</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-lg px-4 py-2"><AlertTriangle className="w-4 h-4 mr-2" />Refusé</Badge>;
      default:
        return <Badge variant="outline">{decision}</Badge>;
    }
  };

  const getDataQualityBadge = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'high':
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800">Excellente</Badge>;
      case 'medium':
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800">Bonne</Badge>;
      case 'low':
      case 'fair':
        return <Badge className="bg-yellow-100 text-yellow-800">Moyenne</Badge>;
      case 'poor':
        return <Badge className="bg-red-100 text-red-800">Faible</Badge>;
      default:
        return <Badge variant="outline">{quality}</Badge>;
    }
  };

  return (
    <DashboardLayout role="partner" title="Détail de l'Évaluation">
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link to="/dashboard/partner/evaluations">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux évaluations
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          </div>
        ) : !evaluation ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Évaluation non trouvée</h3>
              <p className="text-muted-foreground">
                Cette évaluation n'existe pas ou vous n'y avez pas accès.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Header Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        Évaluation #{evaluation.id.slice(0, 8)}
                      </h2>
                      <p className="text-muted-foreground">
                        {format(new Date(evaluation.created_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant={evaluation.status === 'completed' ? 'default' : 'secondary'}>
                          {evaluation.status === 'completed' ? (
                            <><CheckCircle className="w-3 h-3 mr-1" />Terminée</>
                          ) : (
                            <><Clock className="w-3 h-3 mr-1" />En cours</>
                          )}
                        </Badge>
                        {getDataQualityBadge(dataQuality)}
                        {evaluation.processing_time_ms && (
                          <Badge variant="outline">
                            {evaluation.processing_time_ms}ms
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Score Crédit</p>
                    <p className="text-5xl font-bold text-primary">
                      {evaluation.score || '--'}
                    </p>
                    <Badge className={`mt-2 ${getGradeColor(evaluation.grade)}`}>
                      Grade {evaluation.grade || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{evaluation.score || '--'}</p>
                      <p className="text-sm text-muted-foreground">Score Global</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{evaluation.grade || '--'}</p>
                      <p className="text-sm text-muted-foreground">Grade</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0A3D2C]/10 rounded-lg">
                      <Shield className="w-5 h-5 text-[#0A3D2C]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{evaluation.confidence ? `${evaluation.confidence}%` : '--'}</p>
                      <p className="text-sm text-muted-foreground">Confiance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${evaluation.risk_category === 'low' || evaluation.risk_category === 'very_low' ? 'bg-green-100' : evaluation.risk_category === 'medium' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                      <AlertTriangle className={`w-5 h-5 ${getRiskColor(evaluation.risk_category)}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold capitalize ${getRiskColor(evaluation.risk_category)}`}>
                        {evaluation.risk_category ? evaluation.risk_category.replace('_', ' ') : '--'}
                      </p>
                      <p className="text-sm text-muted-foreground">Risque</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sub-Scores Detail */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Décomposition du Score (6 Axes)
                </CardTitle>
                <CardDescription>
                  Analyse détaillée des composantes du score
                </CardDescription>
              </CardHeader>
              <CardContent>
                {displayedSubScores.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayedSubScores.map((subScore, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${subScore.value >= 70 ? 'bg-green-100' : subScore.value >= 50 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                              {getSubScoreIcon(subScore.name)}
                            </div>
                            <div>
                              <p className="font-semibold">{subScore.name}</p>
                              <p className="text-sm text-muted-foreground">Poids: {(subScore.weight * 100).toFixed(0)}%</p>
                            </div>
                          </div>
                          <p className={`text-2xl font-bold ${getSubScoreColor(subScore.value)}`}>
                            {subScore.value}
                          </p>
                        </div>
                        <Progress 
                          value={subScore.value} 
                          className="h-2"
                        />
                        {subScore.factors && (subScore.factors as string[]).length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {(subScore.factors as string[]).map((factor, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun sous-score détaillé disponible</p>
                    <p className="text-sm mt-1">Les sous-scores seront affichés après traitement complet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations du Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Référence</p>
                      <p className="font-medium">
                        {(evaluation.customer_profiles as Record<string, unknown>)?.external_reference as string || evaluation.id.slice(0, 12)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Téléphone</p>
                      <p className="font-medium">{evaluation.phone_number || '--'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Localisation</p>
                      <p className="font-medium">{evaluation.city || 'CI'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Positive Factors */}
            {displayedPositiveFactors.length > 0 && (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <ThumbsUp className="w-5 h-5" />
                    Facteurs Positifs
                  </CardTitle>
                  <CardDescription>
                    Éléments contribuant positivement au score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {displayedPositiveFactors.map((factor, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50"
                      >
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">{factor.name}</p>
                            {factor.description && (
                              <p className="text-sm text-green-600">{factor.description}</p>
                            )}
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          +{factor.contribution} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Negative Factors */}
            {displayedNegativeFactors.length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <ThumbsDown className="w-5 h-5" />
                    Facteurs Négatifs
                  </CardTitle>
                  <CardDescription>
                    Éléments impactant négativement le score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {displayedNegativeFactors.map((factor, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50"
                      >
                        <div className="flex items-center gap-3">
                          <TrendingDown className="w-5 h-5 text-red-600" />
                          <div>
                            <p className="font-medium text-red-800">{factor.name}</p>
                            {factor.description && (
                              <p className="text-sm text-red-600">{factor.description}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="destructive">
                          {factor.contribution} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fraud Analysis */}
            {fraudAlerts.filter(a => a.triggered).length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <ShieldAlert className="w-5 h-5" />
                    Alertes Fraude
                  </CardTitle>
                  <CardDescription>
                    Signaux d'alerte détectés lors de l'analyse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fraudAlerts.filter(a => a.triggered).map((alert, index) => (
                      <div 
                        key={index}
                        className={`p-4 border rounded-lg ${
                          alert.severity === 'critical' ? 'bg-red-100 border-red-300' :
                          alert.severity === 'high' ? 'bg-orange-100 border-orange-300' :
                          alert.severity === 'medium' ? 'bg-yellow-100 border-yellow-300' :
                          'bg-blue-100 border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 mt-0.5" />
                            <div>
                              <p className="font-medium">{alert.rule}</p>
                              {alert.description && (
                                <p className="text-sm mt-1">{alert.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              alert.severity === 'critical' || alert.severity === 'high' 
                                ? 'destructive' 
                                : 'secondary'
                            }>
                              {alert.severity === 'critical' ? 'Critique' :
                               alert.severity === 'high' ? 'Élevé' :
                               alert.severity === 'medium' ? 'Moyen' : 'Faible'}
                            </Badge>
                            {alert.score_impact && (
                              <p className="text-sm mt-1 flex items-center gap-1 justify-end text-red-600">
                                <TrendingDown className="w-3 h-3" />
                                -{alert.score_impact} pts
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Credit Recommendation */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Recommandation de Crédit
                </CardTitle>
                <CardDescription>
                  Décision algorithmique basée sur l'analyse complète
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 text-center">
                  {getDecisionBadge(displayedRecommendation.decision)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <DollarSign className="w-6 h-6 mx-auto text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Montant max suggéré</p>
                    <p className="text-xl font-bold">
                      {displayedRecommendation.max_amount 
                        ? `${displayedRecommendation.max_amount.toLocaleString()} FCFA` 
                        : '--'}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <Calendar className="w-6 h-6 mx-auto text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Durée max suggérée</p>
                    <p className="text-xl font-bold">
                      {displayedRecommendation.max_duration_months 
                        ? `${displayedRecommendation.max_duration_months} mois` 
                        : '--'}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <Percent className="w-6 h-6 mx-auto text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Taux suggéré</p>
                    <p className="text-xl font-bold">
                      {displayedRecommendation.suggested_rate 
                        ? `${displayedRecommendation.suggested_rate}%` 
                        : '--'}
                    </p>
                  </div>
                </div>

                {displayedRecommendation.conditions && displayedRecommendation.conditions.length > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="font-medium text-yellow-800 mb-2">Conditions requises:</p>
                    <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                      {displayedRecommendation.conditions.map((condition, i) => (
                        <li key={i}>{condition}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {displayedRecommendation.rationale && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="font-medium mb-2">Justification:</p>
                    <p className="text-sm text-muted-foreground">{displayedRecommendation.rationale}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Improvement Suggestions */}
            {improvementSuggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Suggestions d'Amélioration
                  </CardTitle>
                  <CardDescription>
                    Actions pour améliorer le score du client
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {improvementSuggestions.map((suggestion, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <Lightbulb className="w-4 h-4 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium">{suggestion.action}</p>
                            {suggestion.timeframe && (
                              <p className="text-sm text-muted-foreground">Délai: {suggestion.timeframe}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getDifficultyBadge(suggestion.difficulty)}
                          <Badge className="bg-green-100 text-green-800">
                            +{suggestion.potential_gain} pts
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recalculer
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger PDF
                </Button>
                {evaluation.customer_profiles && (
                  <Button variant="outline" asChild>
                    <Link to={`/dashboard/partner/clients/${(evaluation.customer_profiles as Record<string, unknown>).id}`}>
                      <User className="w-4 h-4 mr-2" />
                      Voir le client
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PartnerEvaluationDetail;
