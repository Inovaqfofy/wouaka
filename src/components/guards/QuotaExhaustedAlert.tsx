import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, Calendar, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type QuotaType = 'scores' | 'kyc' | 'api';

interface QuotaInfo {
  used: number;
  limit: number;
  percentage: number;
}

interface QuotaExhaustedAlertProps {
  quotaType: QuotaType;
  quotaInfo: QuotaInfo;
  renewalDate?: string;
  title?: string;
  description?: string;
  className?: string;
}

const quotaLabels: Record<QuotaType, { label: string; icon: typeof Zap }> = {
  scores: { label: 'Scoring', icon: TrendingUp },
  kyc: { label: 'Vérifications KYC', icon: Zap },
  api: { label: 'Appels API', icon: Zap },
};

export function QuotaExhaustedAlert({
  quotaType,
  quotaInfo,
  renewalDate,
  title,
  description,
  className,
}: QuotaExhaustedAlertProps) {
  const navigate = useNavigate();
  const config = quotaLabels[quotaType];
  const Icon = config.icon;

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const isExhausted = quotaInfo.used >= quotaInfo.limit && quotaInfo.limit !== -1;
  const isNearLimit = quotaInfo.percentage >= 80 && !isExhausted;

  const formatNumber = (n: number) => {
    if (n === -1) return '∞';
    return n.toLocaleString('fr-FR');
  };

  return (
    <div className={cn(
      "flex items-center justify-center min-h-[400px] p-6",
      className
    )}>
      <Card className={cn(
        "max-w-md w-full",
        isExhausted 
          ? "border-destructive/30 bg-gradient-to-b from-background to-destructive/5"
          : "border-accent/30 bg-gradient-to-b from-background to-accent/5"
      )}>
        <CardHeader className="text-center pb-4">
          <div className={cn(
            "mx-auto mb-4 p-3 rounded-full w-fit",
            isExhausted ? "bg-destructive/10" : "bg-accent/10"
          )}>
            <AlertTriangle className={cn(
              "h-8 w-8",
              isExhausted ? "text-destructive" : "text-accent-foreground"
            )} />
          </div>
          <Badge 
            variant={isExhausted ? "destructive" : "secondary"}
            className="mx-auto mb-2"
          >
            {isExhausted ? 'Quota épuisé' : 'Quota presque atteint'}
          </Badge>
          <CardTitle className="text-xl">
            {title || `Quota ${config.label} ${isExhausted ? 'épuisé' : 'bientôt atteint'}`}
          </CardTitle>
          <CardDescription>
            {description || (
              isExhausted 
                ? `Vous avez utilisé tous vos ${config.label.toLowerCase()} pour ce mois.`
                : `Vous approchez de la limite de vos ${config.label.toLowerCase()}.`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage display */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{config.label}</span>
              </div>
              <span className="text-sm font-mono">
                {formatNumber(quotaInfo.used)} / {formatNumber(quotaInfo.limit)}
              </span>
            </div>
            <Progress 
              value={Math.min(quotaInfo.percentage, 100)} 
              className={cn(
                "h-3",
                isExhausted && "[&>div]:bg-destructive"
              )}
            />
          </div>

          {/* Renewal info */}
          {renewalDate && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Renouvellement le <span className="font-medium text-foreground">{renewalDate}</span>
              </p>
            </div>
          )}

          {/* CTAs */}
          <div className="space-y-3 pt-2">
            <Button 
              onClick={handleUpgrade} 
              className="w-full"
              size="lg"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Passer au plan supérieur
            </Button>
            
            {!isExhausted && (
              <p className="text-xs text-center text-muted-foreground">
                Il vous reste {formatNumber(quotaInfo.limit - quotaInfo.used)} {config.label.toLowerCase()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
