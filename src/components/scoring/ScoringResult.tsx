import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Lightbulb,
  Target,
  RefreshCw,
  Download,
  Share2,
  Shield,
  TrendingUp,
  AlertTriangle,
  Wallet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Database,
  CreditCard,
  Clock,
  ShieldAlert,
  Scale,
  Lock,
  Eye,
  Sparkles,
  Banknote,
  Calendar,
  TrendingDown,
  XCircle,
  Info,
} from 'lucide-react';
import { ScoringResult as ScoringResultType, BUSINESS_INDICATORS, GRADE_LABELS, SubScore } from '@/lib/scoring-types';
import { ScoreGauge } from './ScoreGauge';

interface ScoringResultProps {
  result: ScoringResultType;
  onReset: () => void;
}

const indicatorIcons = {
  reliability: Shield,
  stability: TrendingUp,
  short_term_risk: AlertTriangle,
  engagement_capacity: Wallet,
};

const getIndicatorColor = (value: number) => {
  if (value >= 70) return 'bg-green-500';
  if (value >= 50) return 'bg-yellow-500';
  if (value >= 30) return 'bg-orange-500';
  return 'bg-red-500';
};

const getIndicatorTextColor = (value: number) => {
  if (value >= 70) return 'text-green-600';
  if (value >= 50) return 'text-yellow-600';
  if (value >= 30) return 'text-orange-600';
  return 'text-red-600';
};

const getSourceLabel = (source: string): string => {
  const labels: Record<string, string> = {
    rccm_scraped: 'Registre RCCM',
    deepseek_analyzed: 'IA DeepSeek',
    ocr_verified: 'OCR Document',
    cross_validated: 'Cross-validation',
    system: 'Données système',
    declared: 'Déclaratif',
    user_declared: 'Déclaratif',
    unavailable: 'Non disponible',
    mtn_momo: 'MTN MoMo',
    orange_money: 'Orange Money',
    wave: 'Wave',
  };
  return labels[source] || source;
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-600 text-white';
    case 'high': return 'bg-red-500 text-white';
    case 'medium': return 'bg-orange-500 text-white';
    case 'low': return 'bg-yellow-500 text-black';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getRiskLevelColor = (level: string) => {
  switch (level) {
    case 'critical': return 'text-red-600';
    case 'high': return 'text-red-500';
    case 'medium': return 'text-orange-500';
    case 'low': return 'text-green-500';
    default: return 'text-muted-foreground';
  }
};

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    identity: 'Identité',
    financial: 'Finances',
    behavioral: 'Comportement',
    business: 'Entreprise',
    crossval: 'Cross-validation',
  };
  return labels[category] || category;
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    identity: 'bg-purple-100 text-purple-700 border-purple-300',
    financial: 'bg-blue-100 text-blue-700 border-blue-300',
    behavioral: 'bg-amber-100 text-amber-700 border-amber-300',
    business: 'bg-teal-100 text-teal-700 border-teal-300',
    crossval: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  };
  return colors[category] || 'bg-muted text-muted-foreground';
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'XOF',
    maximumFractionDigits: 0 
  }).format(amount);
};

export function ScoringResult({ result, onReset }: ScoringResultProps) {
  const gradeInfo = GRADE_LABELS[result.grade] || GRADE_LABELS['C'];
  const transparency = result.data_transparency;
  const creditReco = result.credit_recommendations;
  const fraudAnalysis = result.fraud_analysis;
  const compliance = result.compliance;
  
  const indicators = [
    { key: 'reliability', value: result.reliability, ...BUSINESS_INDICATORS[0] },
    { key: 'stability', value: result.stability, ...BUSINESS_INDICATORS[1] },
    { key: 'short_term_risk', value: result.short_term_risk, ...BUSINESS_INDICATORS[2] },
    { key: 'engagement_capacity', value: result.engagement_capacity, ...BUSINESS_INDICATORS[3] },
  ];

  const hasHighRiskFraud = fraudAnalysis?.alerts?.some(a => a.severity === 'high' || a.severity === 'critical');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Score Card */}
      <Card className="card-premium overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <CardHeader className="text-center pb-2 relative">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <CardTitle className="text-2xl font-display">Résultat de l'Analyse</CardTitle>
            <Badge className={`${gradeInfo.bgColor} ${gradeInfo.color} text-lg font-bold px-3`}>
              {result.grade}
            </Badge>
            {result.is_real && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                RÉEL
              </Badge>
            )}
            {hasHighRiskFraud && (
              <Badge variant="destructive" className="animate-pulse">
                <ShieldAlert className="w-3 h-3 mr-1" />
                ALERTE FRAUDE
              </Badge>
            )}
          </div>
          {result.risk_description && (
            <p className="text-sm text-muted-foreground mt-2">{result.risk_description}</p>
          )}
        </CardHeader>
        <CardContent className="pt-6 relative">
          <ScoreGauge
            score={result.score}
            riskCategory={result.risk_category}
            confidence={result.confidence}
          />
          
          {/* Model Version & Processing Time */}
          <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {result.model_version}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {result.processing_time_ms}ms
            </span>
          </div>
          
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="outline" size="sm" onClick={onReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Nouvelle analyse
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Credit Recommendations - NEW v5.0 */}
      {creditReco && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-premium border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Recommandations Crédit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Max Loan Amount */}
                <div className="p-4 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      Montant max estimé
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(creditReco.estimated_max_loan)}
                  </p>
                  <p className="text-xs text-emerald-600/70 mt-1">
                    Basé sur {creditReco.max_amount_multiplier}x le revenu mensuel
                  </p>
                </div>

                {/* Max Tenor */}
                <div className="p-4 rounded-lg bg-blue-100/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Durée max recommandée
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {creditReco.max_tenor_months} mois
                  </p>
                  <p className="text-xs text-blue-600/70 mt-1">
                    Tenor adapté au profil de risque
                  </p>
                </div>

                {/* Multiplier */}
                <div className="p-4 rounded-lg bg-purple-100/50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                      Multiplicateur
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    {creditReco.max_amount_multiplier}x
                  </p>
                  <p className="text-xs text-purple-600/70 mt-1">
                    Coefficient d'éligibilité
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 6 Sub-Scores - NEW v5.2 */}
      {result.sub_scores && result.sub_scores.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12 }}
        >
          <Card className="card-premium border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-indigo-600" />
                Analyse Multi-Dimensionnelle v5.2
                <Badge variant="outline" className="ml-auto text-xs">
                  {result.sub_scores.length} sous-scores
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {result.sub_scores.map((subScore, index) => {
                  const scoreColor = subScore.score >= 70 ? 'text-green-600' : 
                                     subScore.score >= 50 ? 'text-yellow-600' : 
                                     subScore.score >= 30 ? 'text-orange-600' : 'text-red-600';
                  const bgColor = subScore.score >= 70 ? 'bg-green-50 dark:bg-green-950/30 border-green-200' : 
                                  subScore.score >= 50 ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200' : 
                                  subScore.score >= 30 ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200' : 
                                  'bg-red-50 dark:bg-red-950/30 border-red-200';
                  
                  return (
                    <motion.div
                      key={subScore.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className={`p-4 rounded-lg border ${bgColor}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{subScore.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(subScore.weight * 100)}%
                        </Badge>
                      </div>
                      <div className="flex items-end gap-2 mb-2">
                        <span className={`text-2xl font-bold ${scoreColor}`}>
                          {subScore.score}
                        </span>
                        <span className="text-xs text-muted-foreground mb-1">/100</span>
                      </div>
                      <Progress value={subScore.score} className="h-2 mb-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {subScore.features_used.length} indicateur(s)
                        </span>
                        <span className={`text-xs ${
                          subScore.confidence >= 70 ? 'text-green-600' : 
                          subScore.confidence >= 50 ? 'text-yellow-600' : 'text-orange-600'
                        }`}>
                          Conf: {subScore.confidence}%
                        </span>
                      </div>
                      {subScore.explanation && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {subScore.explanation}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Fraud Analysis - Enhanced v5.2 */}
      {fraudAnalysis && (fraudAnalysis.alerts.length > 0 || fraudAnalysis.total_penalty > 0) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className={`card-premium border-2 ${
            hasHighRiskFraud 
              ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20' 
              : 'border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className={`w-5 h-5 ${hasHighRiskFraud ? 'text-red-600' : 'text-orange-600'}`} />
                Analyse Anti-Fraude v5.2
                <Badge className={`ml-auto ${getRiskLevelColor(fraudAnalysis.risk_level)} bg-transparent`}>
                  Risque: {fraudAnalysis.risk_level.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-red-600">-{fraudAnalysis.total_penalty}</p>
                  <p className="text-xs text-muted-foreground">Pénalité totale</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{fraudAnalysis.alerts.length}</p>
                  <p className="text-xs text-muted-foreground">Alertes</p>
                </div>
                {fraudAnalysis.cross_validation_score !== undefined && (
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className={`text-2xl font-bold ${
                      fraudAnalysis.cross_validation_score >= 80 ? 'text-green-600' :
                      fraudAnalysis.cross_validation_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{fraudAnalysis.cross_validation_score}%</p>
                    <p className="text-xs text-muted-foreground">Cross-validation</p>
                  </div>
                )}
                {fraudAnalysis.categories_triggered && fraudAnalysis.categories_triggered.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold">{fraudAnalysis.categories_triggered.length}</p>
                    <p className="text-xs text-muted-foreground">Catégories</p>
                  </div>
                )}
              </div>

              {/* Categories Triggered */}
              {fraudAnalysis.categories_triggered && fraudAnalysis.categories_triggered.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {fraudAnalysis.categories_triggered.map(cat => (
                    <Badge key={cat} variant="outline" className={getCategoryColor(cat)}>
                      {getCategoryLabel(cat)}
                    </Badge>
                  ))}
                </div>
              )}
              
              {fraudAnalysis.alerts.length > 0 ? (
                <div className="space-y-2">
                  {fraudAnalysis.alerts.map((alert, idx) => (
                    <motion.div
                      key={`${alert.rule_id}-${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * idx }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-card border"
                    >
                      <Badge className={`shrink-0 ${getSeverityColor(alert.severity)}`}>
                        {alert.severity === 'critical' ? <XCircle className="w-3 h-3 mr-1" /> : 
                         alert.severity === 'high' ? <AlertTriangle className="w-3 h-3 mr-1" /> :
                         <AlertCircle className="w-3 h-3 mr-1" />}
                        {alert.severity}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Pénalité: -{alert.penalty} pts
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {alert.rule_id.replace(/_/g, ' ')}
                          </span>
                          {alert.category && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <Badge variant="outline" className="text-[10px] py-0 h-4">
                                {getCategoryLabel(alert.category)}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Aucune alerte de fraude détectée</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Data Transparency Card */}
      {transparency && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="card-premium border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="w-5 h-5 text-primary" />
                Transparence des Données
                <Eye className="w-4 h-4 text-muted-foreground ml-auto" />
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {transparency.confidence_explanation}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Verified Sources */}
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800 dark:text-green-300">
                      Sources Vérifiées ({transparency.verified_count})
                    </span>
                  </div>
                  {transparency.verified_sources.length > 0 ? (
                    <ul className="space-y-2">
                      {transparency.verified_sources.slice(0, 5).map((source, idx) => (
                        <li key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-green-700 dark:text-green-400 capitalize">
                            {source.feature.replace(/_/g, ' ')}
                          </span>
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
                            {getSourceLabel(source.source)} ({source.confidence}%)
                          </Badge>
                        </li>
                      ))}
                      {transparency.verified_sources.length > 5 && (
                        <li className="text-xs text-green-600">
                          +{transparency.verified_sources.length - 5} autres sources
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-green-600/70 dark:text-green-400/70 italic">
                      Aucune source vérifiée. Ajoutez des documents ou un RCCM.
                    </p>
                  )}
                </div>

                {/* Declared Sources */}
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800 dark:text-yellow-300">
                      Données Déclaratives ({transparency.declared_count})
                    </span>
                  </div>
                  {transparency.declared_sources.length > 0 ? (
                    <ul className="space-y-1">
                      {transparency.declared_sources.slice(0, 6).map((source, idx) => (
                        <li key={idx} className="text-sm text-yellow-700 dark:text-yellow-400 capitalize flex items-center gap-2">
                          <FileText className="w-3 h-3 shrink-0" />
                          {source.replace(/_/g, ' ')}
                        </li>
                      ))}
                      {transparency.declared_sources.length > 6 && (
                        <li className="text-xs text-yellow-600">
                          +{transparency.declared_sources.length - 6} autres
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-yellow-600/70 dark:text-yellow-400/70 italic">
                      Toutes les données sont vérifiées !
                    </p>
                  )}
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Confiance globale</span>
                  <span className={`text-sm font-bold ${
                    result.confidence >= 70 ? 'text-green-600' : 
                    result.confidence >= 50 ? 'text-yellow-600' : 'text-orange-600'
                  }`}>
                    {result.confidence}%
                  </span>
                </div>
                <Progress value={result.confidence} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {transparency.total_features && `${transparency.total_features} caractéristiques analysées • `}
                  Plus vous ajoutez de sources vérifiables, plus la confiance augmente.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 4 Business Indicators */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-lg">Indicateurs Business</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {indicators.map((indicator, index) => {
              const Icon = indicatorIcons[indicator.key as keyof typeof indicatorIcons];
              const isVerified = transparency?.verified_sources.some(
                s => s.feature === indicator.key || 
                     (indicator.key === 'reliability' && s.feature === 'business_formalization') ||
                     (indicator.key === 'stability' && s.feature === 'employment_stability')
              );
              
              return (
                <motion.div
                  key={indicator.key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className={`p-4 rounded-lg border bg-card hover:shadow-md transition-shadow ${
                    isVerified ? 'ring-2 ring-green-200 dark:ring-green-800' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-md ${getIndicatorColor(indicator.value)} bg-opacity-20`}>
                      <Icon className={`w-4 h-4 ${getIndicatorTextColor(indicator.value)}`} />
                    </div>
                    <span className="font-medium text-sm">{indicator.label}</span>
                    {isVerified && (
                      <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-end justify-between">
                      <span className={`text-2xl font-bold ${getIndicatorTextColor(indicator.value)}`}>
                        {indicator.value}
                      </span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                    <Progress 
                      value={indicator.value} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">{indicator.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Explanations & Recommendations */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Explanations */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Explications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.explanations.map((explanation, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-start gap-3"
                >
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    {index + 1}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{explanation}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-primary" />
              Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.recommendations.map((recommendation, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-start gap-3"
                >
                  <Badge className="mt-0.5 shrink-0 bg-primary">
                    {index + 1}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{recommendation}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Feature Importance */}
      {result.feature_importance && result.feature_importance.length > 0 && (
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Contribution des Facteurs
              <Badge variant="outline" className="ml-auto text-xs font-normal">
                {result.feature_importance.filter(f => f.verified).length} vérifiés / {result.feature_importance.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.feature_importance.slice(0, 8).map((feature, index) => {
                const isVerified = feature.verified === true;
                const contributionPct = Math.abs(feature.contribution * 100);
                
                return (
                  <motion.div
                    key={feature.feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      isVerified ? 'bg-green-50/50 dark:bg-green-950/20' : 'bg-muted/30'
                    }`}
                  >
                    <div className="w-36 flex items-center gap-1">
                      <span className="text-sm capitalize truncate">
                        {feature.feature.replace(/_/g, ' ')}
                      </span>
                      {isVerified && (
                        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Progress 
                        value={feature.value * 100} 
                        className="h-2"
                      />
                    </div>
                    <div className="w-16 text-right">
                      <Badge 
                        variant={feature.impact === 'positive' ? 'default' : feature.impact === 'neutral' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {Math.round(feature.value * 100)}%
                      </Badge>
                    </div>
                    <div className="w-24 text-right">
                      <span className={`text-xs ${isVerified ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                        {isVerified ? getSourceLabel(feature.source || '') : 'Déclaré'}
                      </span>
                    </div>
                    <div className="w-12 text-right">
                      <span className="text-xs text-muted-foreground">
                        {feature.confidence}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* UEMOA Compliance Footer */}
      {compliance && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-lg bg-muted/30 border"
        >
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-5 h-5 text-primary" />
            <span className="font-medium">Conformité UEMOA</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {compliance.consent_tracked && (
              <Badge variant="outline" className="text-xs">
                <Lock className="w-3 h-3 mr-1" /> Consentement
              </Badge>
            )}
            {compliance.explainable && (
              <Badge variant="outline" className="text-xs">
                <Info className="w-3 h-3 mr-1" /> Explicable
              </Badge>
            )}
            {compliance.non_discriminatory && (
              <Badge variant="outline" className="text-xs">
                <Scale className="w-3 h-3 mr-1" /> Non-discriminatoire
              </Badge>
            )}
            {compliance.data_minimization && (
              <Badge variant="outline" className="text-xs">
                <Database className="w-3 h-3 mr-1" /> Minimisation
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" /> Rétention: {compliance.retention_policy}
            </Badge>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
