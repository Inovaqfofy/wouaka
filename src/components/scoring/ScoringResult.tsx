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
} from 'lucide-react';
import { ScoringResult as ScoringResultType, BUSINESS_INDICATORS, GRADE_LABELS } from '@/lib/scoring-types';
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

export function ScoringResult({ result, onReset }: ScoringResultProps) {
  const gradeInfo = GRADE_LABELS[result.grade] || GRADE_LABELS['C'];
  
  const indicators = [
    { key: 'reliability', value: result.reliability, ...BUSINESS_INDICATORS[0] },
    { key: 'stability', value: result.stability, ...BUSINESS_INDICATORS[1] },
    { key: 'short_term_risk', value: result.short_term_risk, ...BUSINESS_INDICATORS[2] },
    { key: 'engagement_capacity', value: result.engagement_capacity, ...BUSINESS_INDICATORS[3] },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Score Card */}
      <Card className="card-premium">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-3">
            <CardTitle className="text-2xl font-display">Résultat de l'Analyse</CardTitle>
            <Badge className={`${gradeInfo.bgColor} ${gradeInfo.color} text-lg font-bold px-3`}>
              {result.grade}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ScoreGauge
            score={result.score}
            riskCategory={result.risk_category}
            confidence={result.confidence}
          />
          
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

      {/* 4 Business Indicators */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-lg">Indicateurs Business</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {indicators.map((indicator, index) => {
              const Icon = indicatorIcons[indicator.key as keyof typeof indicatorIcons];
              return (
                <motion.div
                  key={indicator.key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-md ${getIndicatorColor(indicator.value)} bg-opacity-20`}>
                      <Icon className={`w-4 h-4 ${getIndicatorTextColor(indicator.value)}`} />
                    </div>
                    <span className="font-medium text-sm">{indicator.label}</span>
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
    </motion.div>
  );
}
