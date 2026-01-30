import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  XCircle, 
  Shield, 
  FileCheck, 
  Database,
  TrendingUp,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  DataSourceInfo, 
  VerifiedDataSummary, 
  STATUS_LABELS, 
  STATUS_COLORS,
  QUALITY_LABELS,
  QUALITY_COLORS
} from '@/lib/data-verification-types';

interface DataTransparencyCardProps {
  summary: VerifiedDataSummary;
  showDetails?: boolean;
  compact?: boolean;
}

const statusIcons = {
  verified: CheckCircle,
  declared: HelpCircle,
  partially_verified: AlertCircle,
  unverified: XCircle,
};

export function DataTransparencyCard({ 
  summary, 
  showDetails = true,
  compact = false 
}: DataTransparencyCardProps) {
  const QualityIcon = summary.data_quality === 'high' ? Shield : 
                       summary.data_quality === 'medium' ? FileCheck : 
                       summary.data_quality === 'low' ? AlertCircle : XCircle;

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <QualityIcon className={`h-5 w-5 ${QUALITY_COLORS[summary.data_quality]}`} />
          <span className="text-sm font-medium">{QUALITY_LABELS[summary.data_quality]}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
            {summary.verified_count} vérifiés
          </Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">
            {summary.declared_count} déclarés
          </Badge>
        </div>
        <div className="flex-1">
          <Progress value={summary.verification_rate} className="h-2" />
        </div>
        <span className="text-sm text-muted-foreground">
          {summary.verification_rate}% vérifié
        </span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <span>Transparence des Données</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium ${QUALITY_COLORS[summary.data_quality]} bg-opacity-10`}>
                  <QualityIcon className="h-4 w-4" />
                  {QUALITY_LABELS[summary.data_quality]}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  La qualité des données est basée sur le taux de vérification ({summary.verification_rate}%) 
                  et la confiance moyenne ({summary.overall_confidence}%)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-2 rounded-lg bg-green-50"
          >
            <div className="text-2xl font-bold text-green-600">{summary.verified_count}</div>
            <div className="text-xs text-green-700">Vérifiés</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center p-2 rounded-lg bg-blue-50"
          >
            <div className="text-2xl font-bold text-blue-600">{summary.partially_verified_count}</div>
            <div className="text-xs text-blue-700">Partiels</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-2 rounded-lg bg-amber-50"
          >
            <div className="text-2xl font-bold text-amber-600">{summary.declared_count}</div>
            <div className="text-xs text-amber-700">Déclarés</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center p-2 rounded-lg bg-muted"
          >
            <div className="text-2xl font-bold text-muted-foreground">{summary.total_fields}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </motion.div>
        </div>

        {/* Verification rate bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taux de vérification</span>
            <span className="font-medium">{summary.verification_rate}%</span>
          </div>
          <div className="relative h-3 rounded-full bg-muted overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${summary.verification_rate}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
            />
          </div>
        </div>

        {/* Confidence indicator */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm">Confiance globale</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${
              summary.overall_confidence >= 70 ? 'text-green-600' :
              summary.overall_confidence >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {summary.overall_confidence}%
            </span>
          </div>
        </div>

        {/* Warnings */}
        {summary.warnings.length > 0 && (
          <div className="space-y-2">
            {summary.warnings.map((warning, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2 p-2 bg-amber-50 rounded text-sm text-amber-800"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{warning}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detailed sources */}
        {showDetails && summary.sources.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>Détail des sources ({summary.sources.length})</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {summary.sources.map((source, index) => (
                <SourceRow key={source.source_id || index} source={source} />
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="pt-2 border-t">
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Vérifié = Document/API confirmé</span>
            </div>
            <div className="flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-amber-600" />
              <span>Déclaré = Saisie utilisateur</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SourceRow({ source }: { source: DataSourceInfo }) {
  const StatusIcon = statusIcons[source.status];
  
  return (
    <div className={`flex items-center justify-between p-2 rounded text-sm ${
      source.status === 'verified' ? 'bg-green-50/50' :
      source.status === 'partially_verified' ? 'bg-blue-50/50' :
      source.status === 'declared' ? 'bg-amber-50/50' : 'bg-red-50/50'
    }`}>
      <div className="flex items-center gap-2">
        <StatusIcon className={`h-4 w-4 ${
          source.status === 'verified' ? 'text-green-600' :
          source.status === 'partially_verified' ? 'text-blue-600' :
          source.status === 'declared' ? 'text-amber-600' : 'text-red-600'
        }`} />
        <span className="font-medium">{source.source_name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={STATUS_COLORS[source.status]}>
          {STATUS_LABELS[source.status]}
        </Badge>
        <span className="text-muted-foreground">{source.confidence}%</span>
      </div>
    </div>
  );
}

export default DataTransparencyCard;
