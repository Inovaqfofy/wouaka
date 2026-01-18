import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Smartphone,
  Signal,
  Building2,
  Lightbulb,
  UserCheck,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  Ban,
  FileText,
} from 'lucide-react';
import type { 
  DataSourceType, 
  VerificationStatus, 
} from '@/lib/enrichment-types';

const ICONS: Record<DataSourceType, React.ElementType> = {
  mobile_money: Smartphone,
  telecom: Signal,
  registry: Building2,
  utility: Lightbulb,
  identity: UserCheck,
};

const STATUS_ICONS: Record<VerificationStatus, React.ElementType> = {
  verified: Check,
  pending: Clock,
  failed: AlertCircle,
  simulated: Sparkles,
  unavailable: Ban,
  declared: FileText,
};

const STATUS_COLORS: Record<VerificationStatus, string> = {
  verified: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  simulated: 'bg-blue-100 text-blue-700 border-blue-200',
  unavailable: 'bg-gray-100 text-gray-500 border-gray-200',
  declared: 'bg-orange-100 text-orange-700 border-orange-200',
};

interface DataSourceIndicatorProps {
  sources: Array<{
    type: DataSourceType;
    provider: string;
    displayName: string;
    status: VerificationStatus;
    confidence: number;
    contribution: number;
  }>;
  compact?: boolean;
}

export function DataSourceIndicator({ sources, compact = false }: DataSourceIndicatorProps) {
  const verifiedCount = sources.filter(s => s.status === 'verified').length;
  const totalConfidence = sources.reduce((acc, s) => acc + s.confidence * s.contribution, 0) / 
    Math.max(sources.reduce((acc, s) => acc + s.contribution, 0), 1);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {sources.map((source, idx) => {
          const Icon = ICONS[source.type];
          const StatusIcon = STATUS_ICONS[source.status];
          
          return (
            <motion.div
              key={`${source.type}-${source.provider}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative p-2 rounded-lg border ${STATUS_COLORS[source.status]}`}
              title={`${source.displayName}: ${source.status}`}
            >
              <Icon className="w-4 h-4" />
              <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-background">
                <StatusIcon className="w-2.5 h-2.5" />
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">Sources de Données</h4>
          <Badge variant="secondary" className="text-xs">
            {sources.length} sources
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Confiance globale:</span>
          <Badge className={totalConfidence >= 70 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
            {Math.round(totalConfidence)}%
          </Badge>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {sources.map((source, idx) => {
          const Icon = ICONS[source.type];
          const StatusIcon = STATUS_ICONS[source.status];
          
          return (
            <motion.div
              key={`${source.type}-${source.provider}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-3 rounded-lg border ${STATUS_COLORS[source.status]}`}
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-background/50">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{source.displayName}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <StatusIcon className="w-3 h-3" />
                      <span className="text-xs capitalize">
                        {source.status === 'simulated' ? 'Démo' : 
                         source.status === 'verified' ? 'Vérifié' : 
                         source.status === 'declared' ? 'Déclaratif' :
                         source.status === 'unavailable' ? 'Non dispo' :
                         source.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Confiance</span>
                      <span className="font-medium">{source.confidence}%</span>
                    </div>
                    <Progress value={source.confidence} className="h-1.5" />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Contribution: {Math.round(source.contribution * 100)}%
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t">
        {(['verified', 'declared', 'unavailable', 'simulated', 'pending', 'failed'] as VerificationStatus[]).map((status) => {
          const StatusIcon = STATUS_ICONS[status];
          const count = sources.filter(s => s.status === status).length;
          if (count === 0) return null;
          
          const statusLabels: Record<VerificationStatus, string> = {
            verified: 'Vérifié',
            declared: 'Déclaratif',
            unavailable: 'Non disponible',
            simulated: 'Simulé',
            pending: 'En attente',
            failed: 'Échec',
          };
          
          return (
            <div key={status} className="flex items-center gap-1.5 text-xs">
              <div className={`p-1 rounded ${STATUS_COLORS[status]}`}>
                <StatusIcon className="w-3 h-3" />
              </div>
              <span>{statusLabels[status]}</span>
              <span className="text-muted-foreground">({count})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
