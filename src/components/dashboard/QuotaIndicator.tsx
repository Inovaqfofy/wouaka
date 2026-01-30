import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, FileCheck, Zap, AlertTriangle, Infinity } from "lucide-react";
import { useQuotaUsage, formatLimit } from "@/hooks/useQuotaUsage";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface QuotaIndicatorProps {
  compact?: boolean;
}

export const QuotaIndicator = ({ compact = false }: QuotaIndicatorProps) => {
  const { data: quota, isLoading } = useQuotaUsage();

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 75) return "bg-orange-500";
    return "bg-primary";
  };

  const getAlertLevel = (percentage: number) => {
    if (percentage >= 90) return "destructive";
    if (percentage >= 75) return "warning";
    return null;
  };

  if (isLoading) {
    return compact ? (
      <Skeleton className="h-20 w-full" />
    ) : (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!quota) return null;

  // Construire les items de quota depuis la source unique (useQuotaUsage)
  const quotaItems = [
    {
      label: "Scoring Crédit",
      used: quota.usage.scoresUsed,
      limit: quota.plan.limits.scores_per_month,
      remaining: quota.remaining.scores,
      percentage: quota.percentages.scores,
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      key: 'scores' as const,
    },
    {
      label: "Vérification Identité",
      used: quota.usage.kycUsed,
      limit: quota.plan.limits.kyc_per_month,
      remaining: quota.remaining.kyc,
      percentage: quota.percentages.kyc,
      icon: FileCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      key: 'kyc' as const,
    },
    {
      label: "Appels API",
      used: quota.usage.apiCallsUsed,
      limit: quota.plan.limits.api_calls_per_month,
      remaining: quota.remaining.apiCalls,
      percentage: quota.percentages.apiCalls,
      icon: Zap,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      key: 'apiCalls' as const,
    },
  ];

  const hasWarning = !quota.isUnlimited && quotaItems.some(item => item.percentage >= 75);

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Quotas</span>
          <Badge variant="outline">{quota.plan.name}</Badge>
        </div>
        {quotaItems.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">
                {item.used.toLocaleString('fr-FR')} / {formatLimit(item.limit)}
              </span>
            </div>
            {item.limit !== -1 && (
              <Progress 
                value={item.percentage} 
                className={cn("h-1.5", getProgressColor(item.percentage))}
              />
            )}
            {item.limit === -1 && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Infinity className="w-3 h-3" />
                <span>Illimité</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Utilisation des Quotas
              {hasWarning && (
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              )}
            </CardTitle>
            <CardDescription>
              Plan {quota.plan.name} • Période en cours
            </CardDescription>
          </div>
          {quota.plan.slug !== 'partenaire-enterprise' && (
            <Link to="/dashboard/partner/billing">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Upgrade
              </Badge>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quotaItems.map((item) => {
            const Icon = item.icon;
            const alertLevel = item.limit !== -1 ? getAlertLevel(item.percentage) : null;
            const isUnlimited = item.limit === -1;
            
            return (
              <div 
                key={item.label}
                className={cn(
                  "p-4 rounded-lg border",
                  alertLevel === "destructive" && "border-destructive/50 bg-destructive/5",
                  alertLevel === "warning" && "border-orange-500/50 bg-orange-50",
                  isUnlimited && "border-green-500/30 bg-green-50/50"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-2 rounded-lg", item.bgColor)}>
                    <Icon className={cn("w-4 h-4", item.color)} />
                  </div>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.used.toLocaleString('fr-FR')} / {formatLimit(item.limit)}
                    </p>
                  </div>
                </div>
                
                {!isUnlimited && (
                  <>
                    <Progress 
                      value={item.percentage} 
                      className="h-2"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {item.remaining.toLocaleString('fr-FR')} restants
                      </span>
                      <span className={cn(
                        "text-xs font-medium",
                        item.percentage >= 90 && "text-destructive",
                        item.percentage >= 75 && item.percentage < 90 && "text-orange-600"
                      )}>
                        {item.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </>
                )}
                
                {isUnlimited && (
                  <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                    <Infinity className="w-4 h-4" />
                    <span>Illimité</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
