import { Shield, ShieldCheck, Building2, User, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type CertificationLevel = 'self_declared' | 'institutional' | 'rejected';

interface CertificationBadgeProps {
  level: CertificationLevel;
  institutionName?: string;
  validationDate?: string;
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const levelConfig = {
  self_declared: {
    label: 'Auto-déclaré',
    sublabel: 'Non vérifié par une institution',
    icon: User,
    variant: 'secondary' as const,
    colorClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
    iconColor: 'text-amber-600 dark:text-amber-400',
    tooltip: 'Ce certificat a été généré par l\'emprunteur lui-même. Les preuves n\'ont pas été vérifiées par une institution financière.',
  },
  institutional: {
    label: 'Certifié',
    sublabel: 'Validé par institution',
    icon: Building2,
    variant: 'default' as const,
    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    tooltip: 'Ce certificat a été validé par une institution financière via l\'API Wouaka. Les preuves ont été auditées et le screening AML/PEP effectué.',
  },
  rejected: {
    label: 'Rejeté',
    sublabel: 'Non conforme',
    icon: AlertTriangle,
    variant: 'destructive' as const,
    colorClass: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
    iconColor: 'text-red-600 dark:text-red-400',
    tooltip: 'Ce certificat a été rejeté par une institution financière après vérification.',
  },
};

const sizeConfig = {
  sm: {
    badge: 'text-xs px-2 py-0.5',
    icon: 'w-3 h-3',
  },
  md: {
    badge: 'text-sm px-3 py-1',
    icon: 'w-4 h-4',
  },
  lg: {
    badge: 'text-base px-4 py-1.5',
    icon: 'w-5 h-5',
  },
};

export function CertificationBadge({
  level,
  institutionName,
  validationDate,
  className,
  showTooltip = true,
  size = 'md',
}: CertificationBadgeProps) {
  const config = levelConfig[level];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1.5 font-medium border',
        config.colorClass,
        sizes.badge,
        className
      )}
    >
      <Icon className={cn(sizes.icon, config.iconColor)} />
      <span>
        {level === 'institutional' && institutionName
          ? `Certifié par ${institutionName}`
          : config.label}
      </span>
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{config.sublabel}</p>
            <p className="text-xs text-muted-foreground">{config.tooltip}</p>
            {level === 'institutional' && validationDate && (
              <p className="text-xs text-muted-foreground">
                Validé le {new Date(validationDate).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Composant pour afficher la comparaison des badges
export function CertificationComparison({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
        <CertificationBadge level="self_declared" size="lg" showTooltip={false} />
        <div className="flex-1">
          <h4 className="font-medium">Certificat Auto-déclaré</h4>
          <ul className="mt-2 text-sm text-muted-foreground space-y-1">
            <li>• Score calculé par l'emprunteur</li>
            <li>• Preuves non vérifiées par une institution</li>
            <li>• Pas de screening AML/PEP</li>
            <li>• Valeur indicative uniquement</li>
          </ul>
        </div>
      </div>

      <div className="flex items-start gap-4 p-4 rounded-lg border bg-card border-emerald-200 dark:border-emerald-800">
        <CertificationBadge level="institutional" size="lg" showTooltip={false} />
        <div className="flex-1">
          <h4 className="font-medium text-emerald-700 dark:text-emerald-300">
            Certificat Institutionnel
          </h4>
          <ul className="mt-2 text-sm text-muted-foreground space-y-1">
            <li>✓ Validé via API Wouaka</li>
            <li>✓ Preuves auditées par l'institution</li>
            <li>✓ Screening AML/PEP effectué</li>
            <li>✓ Conformité BCEAO garantie</li>
            <li>✓ Valeur juridique opposable</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
