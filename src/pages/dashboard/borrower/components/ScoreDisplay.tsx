import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Calculator, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { TrustLevelBadge } from "@/components/trust";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ScoreDisplayProps {
  isLoading: boolean;
  score: number | undefined;
  trustLevel: string;
  certaintyCoefficient: number;
  certificate: {
    created_at: string;
  } | null;
  hasSubscription: boolean;
}

export function ScoreDisplay({
  isLoading,
  score,
  trustLevel,
  certaintyCoefficient,
  certificate,
  hasSubscription,
}: ScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'border-emerald-500 text-emerald-600';
    if (score >= 55) return 'border-amber-500 text-amber-600';
    return 'border-red-500 text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Skeleton className="w-48 h-48 rounded-full" />
      </div>
    );
  }

  if (score) {
    return (
      <div className="flex flex-col items-center">
        <div className={`w-40 h-40 rounded-full border-8 flex items-center justify-center ${getScoreColor(score)}`}>
          <div className="text-center">
            <span className="text-4xl font-bold">{score}</span>
            <p className="text-xs text-muted-foreground">/100</p>
          </div>
        </div>
        <div className="mt-4 text-center space-y-2">
          <TrustLevelBadge level={trustLevel as any} size="lg" />
          
          {/* Certainty Coefficient Display */}
          <div className="flex items-center justify-center gap-2 p-3 bg-secondary/10 rounded-lg">
            <Target className="w-5 h-5 text-secondary" />
            <span className="text-sm font-medium">Coefficient de certitude :</span>
            <Badge variant="secondary" className="text-lg font-bold">
              {Math.round(certaintyCoefficient * 100)}%
            </Badge>
          </div>
          
          {certificate && (
            <p className="text-sm text-muted-foreground">
              Certificat créé le {format(new Date(certificate.created_at), 'dd MMM yyyy', { locale: fr })}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="text-center py-12">
        <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Obtenez votre certificat</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-4">
          Choisissez un plan pour obtenir votre certificat de solvabilité avec partage illimité vers les institutions financières.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link to="/pricing">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Choisir un plan
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <Calculator className="w-12 h-12 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Générer votre certificat</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-4">
        Vous avez un abonnement actif. Fournissez vos preuves pour générer votre certificat.
      </p>
      <Button asChild>
        <Link to="/dashboard/borrower/documents">
          Fournir mes preuves
        </Link>
      </Button>
    </div>
  );
}
