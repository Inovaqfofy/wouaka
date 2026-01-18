import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ShieldCheck, 
  Target, 
  FileCheck, 
  Calendar,
  TrendingUp,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TrustLevelBadge, TrustLevel } from "@/components/trust/TrustLevelBadge";

interface CertificatCardProps {
  score?: number;
  grade?: string;
  trustLevel: TrustLevel;
  certaintyCoefficient: number;
  proofCount: number;
  certificationDate?: Date;
  variant?: "compact" | "full";
  className?: string;
}

export const CertificatCard: React.FC<CertificatCardProps> = ({
  score,
  grade,
  trustLevel,
  certaintyCoefficient,
  proofCount,
  certificationDate,
  variant = "full",
  className,
}) => {
  const getCertaintyColor = (coefficient: number) => {
    if (coefficient >= 0.8) return "text-emerald-600";
    if (coefficient >= 0.6) return "text-blue-600";
    if (coefficient >= 0.4) return "text-amber-600";
    return "text-red-600";
  };

  const getCertaintyProgressColor = (coefficient: number) => {
    if (coefficient >= 0.8) return "bg-emerald-500";
    if (coefficient >= 0.6) return "bg-blue-500";
    if (coefficient >= 0.4) return "bg-amber-500";
    return "bg-red-500";
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      "A+": "bg-emerald-500",
      "A": "bg-emerald-500",
      "B": "bg-blue-500",
      "C": "bg-amber-500",
      "D": "bg-orange-500",
      "E": "bg-red-500",
    };
    return colors[grade] || "bg-muted";
  };

  if (variant === "compact") {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {score ? (
                <span className="text-lg font-bold text-primary">{score}</span>
              ) : (
                <ShieldCheck className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <TrustLevelBadge level={trustLevel} size="sm" />
              <p className="text-xs text-muted-foreground mt-1">
                {proofCount} preuves
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn("text-lg font-bold", getCertaintyColor(certaintyCoefficient))}>
              {Math.round(certaintyCoefficient * 100)}%
            </p>
            <p className="text-xs text-muted-foreground">certitude</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Certificat de Solvabilité</span>
            </div>
            <TrustLevelBadge level={trustLevel} size="lg" className="bg-white/20 border-white/30" />
          </div>
          {score && grade && (
            <div className="text-center">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl",
                getGradeColor(grade)
              )}>
                {score}
              </div>
              <Badge className="mt-2 bg-white/20 text-white border-0">
                Grade {grade}
              </Badge>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Coefficient de certitude */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Coefficient de Certitude</span>
            </div>
            <span className={cn("font-bold", getCertaintyColor(certaintyCoefficient))}>
              {Math.round(certaintyCoefficient * 100)}%
            </span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all", getCertaintyProgressColor(certaintyCoefficient))}
              style={{ width: `${certaintyCoefficient * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Basé sur {proofCount} sources de preuves vérifiées
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className="w-4 h-4 text-secondary" />
              <span className="text-xs text-muted-foreground">Preuves</span>
            </div>
            <p className="text-lg font-bold">{proofCount}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Fiabilité</span>
            </div>
            <p className="text-lg font-bold">
              {certaintyCoefficient >= 0.8 ? "Élevée" : 
               certaintyCoefficient >= 0.6 ? "Bonne" : 
               certaintyCoefficient >= 0.4 ? "Moyenne" : "Faible"}
            </p>
          </div>
        </div>

        {/* Certification date */}
        {certificationDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Calendar className="w-4 h-4" />
            <span>
              Certifié le {certificationDate.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificatCard;
