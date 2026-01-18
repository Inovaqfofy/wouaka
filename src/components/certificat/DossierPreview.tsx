import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileCheck, 
  Clock, 
  ArrowRight,
  Target,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TrustLevelBadge, TrustLevel } from "@/components/trust/TrustLevelBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DossierPreviewProps {
  id: string;
  clientName: string;
  clientRef?: string;
  trustLevel: TrustLevel;
  score?: number;
  grade?: string;
  certaintyCoefficient: number;
  proofCount: number;
  status: "pending" | "verified" | "requires_review" | "rejected" | "expired";
  consentStatus: "active" | "expired" | "revoked";
  createdAt: Date;
  onView?: (id: string) => void;
  onViewProofs?: (id: string) => void;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "En attente", variant: "outline", icon: Clock },
  verified: { label: "Vérifié", variant: "default", icon: ShieldCheck },
  requires_review: { label: "Revue requise", variant: "secondary", icon: AlertTriangle },
  rejected: { label: "Rejeté", variant: "destructive", icon: AlertTriangle },
  expired: { label: "Expiré", variant: "outline", icon: Clock },
};

const consentStatusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Consentement actif", className: "text-emerald-600" },
  expired: { label: "Consentement expiré", className: "text-amber-600" },
  revoked: { label: "Consentement révoqué", className: "text-red-600" },
};

export const DossierPreview: React.FC<DossierPreviewProps> = ({
  id,
  clientName,
  clientRef,
  trustLevel,
  score,
  grade,
  certaintyCoefficient,
  proofCount,
  status,
  consentStatus,
  createdAt,
  onView,
  onViewProofs,
  className,
}) => {
  const statusInfo = statusConfig[status];
  const consentInfo = consentStatusConfig[consentStatus];
  const StatusIcon = statusInfo.icon;

  const getCertaintyColor = (coefficient: number) => {
    if (coefficient >= 0.8) return "text-emerald-600";
    if (coefficient >= 0.6) return "text-blue-600";
    if (coefficient >= 0.4) return "text-amber-600";
    return "text-red-600";
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      "A+": "bg-emerald-500 text-white",
      "A": "bg-emerald-500 text-white",
      "B": "bg-blue-500 text-white",
      "C": "bg-amber-500 text-white",
      "D": "bg-orange-500 text-white",
      "E": "bg-red-500 text-white",
    };
    return colors[grade] || "bg-muted";
  };

  return (
    <Card className={cn("p-4 hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start gap-4">
        {/* Score/Grade indicator */}
        <div className="flex-shrink-0">
          {score && grade ? (
            <div className={cn(
              "w-14 h-14 rounded-xl flex flex-col items-center justify-center",
              getGradeColor(grade)
            )}>
              <span className="text-lg font-bold">{score}</span>
              <span className="text-xs opacity-80">{grade}</span>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold truncate">{clientName}</h3>
              {clientRef && (
                <p className="text-xs text-muted-foreground">Réf: {clientRef}</p>
              )}
            </div>
            <Badge variant={statusInfo.variant} className="flex-shrink-0 gap-1">
              <StatusIcon className="w-3 h-3" />
              {statusInfo.label}
            </Badge>
          </div>

          <div className="flex items-center gap-4 mb-3">
            <TrustLevelBadge level={trustLevel} size="sm" />
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-muted-foreground" />
              <span className={cn("text-sm font-medium", getCertaintyColor(certaintyCoefficient))}>
                {Math.round(certaintyCoefficient * 100)}%
              </span>
              <span className="text-xs text-muted-foreground">certitude</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {proofCount} preuves
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{format(createdAt, "d MMM yyyy", { locale: fr })}</span>
              <span className={consentInfo.className}>{consentInfo.label}</span>
            </div>
            
            <div className="flex gap-2">
              {onViewProofs && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onViewProofs(id)}
                  className="text-xs h-7"
                >
                  Voir preuves
                </Button>
              )}
              {onView && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onView(id)}
                  className="text-xs h-7 gap-1"
                >
                  Détails
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DossierPreview;
