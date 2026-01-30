import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, 
  MessageSquare, 
  FileCheck, 
  Users, 
  Camera,
  Check,
  ArrowRight,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export interface ProofStatus {
  otpVerified: boolean;
  ussdUploaded: boolean;
  smsAnalyzed: boolean;
  documentsVerified: boolean;
  guarantorAdded: boolean;
}

interface ProofStep {
  id: keyof ProofStatus;
  label: string;
  description: string;
  icon: React.ElementType;
  points: number;
  action?: {
    label: string;
    href: string;
    param?: string;
  };
}

const PROOF_STEPS: ProofStep[] = [
  {
    id: "otpVerified",
    label: "Numéro certifié",
    description: "Vérification OTP de votre numéro de téléphone",
    icon: Smartphone,
    points: 15,
    action: { label: "Certifier", href: "/dashboard/borrower/profile", param: "action=verify-phone" },
  },
  {
    id: "ussdUploaded",
    label: "Profil Mobile Money",
    description: "Capture d'écran de votre profil USSD",
    icon: Camera,
    points: 20,
    action: { label: "Capturer", href: "/dashboard/borrower/documents", param: "action=upload-ussd" },
  },
  {
    id: "smsAnalyzed",
    label: "SMS analysés",
    description: "Analyse locale de vos transactions SMS",
    icon: MessageSquare,
    points: 25,
    action: { label: "Analyser", href: "/dashboard/borrower/documents", param: "action=analyze-sms" },
  },
  {
    id: "documentsVerified",
    label: "Documents vérifiés",
    description: "CNI/Passeport vérifié par OCR",
    icon: FileCheck,
    points: 25,
    action: { label: "Vérifier", href: "/dashboard/borrower/documents", param: "action=upload-identity" },
  },
  {
    id: "guarantorAdded",
    label: "Garant ajouté",
    description: "Un garant a certifié votre profil",
    icon: Users,
    points: 15,
    action: { label: "Ajouter", href: "/dashboard/borrower/profile", param: "action=add-guarantor" },
  },
];

interface ProofProgressIndicatorProps {
  proofStatus: ProofStatus;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
  onActionClick?: (stepId: keyof ProofStatus) => void;
}

export const ProofProgressIndicator: React.FC<ProofProgressIndicatorProps> = ({
  proofStatus,
  showActions = true,
  compact = false,
  className,
  onActionClick,
}) => {
  const navigate = useNavigate();
  const completedSteps = PROOF_STEPS.filter(step => proofStatus[step.id]);
  const totalPoints = PROOF_STEPS.reduce((acc, step) => acc + step.points, 0);
  const earnedPoints = completedSteps.reduce((acc, step) => acc + step.points, 0);
  const progressPercent = (earnedPoints / totalPoints) * 100;

  const nextStep = PROOF_STEPS.find(step => !proofStatus[step.id]);

  const handleActionClick = (step: ProofStep) => {
    if (onActionClick) {
      onActionClick(step.id);
    } else if (step.action) {
      const url = step.action.param 
        ? `${step.action.href}?${step.action.param}` 
        : step.action.href;
      navigate(url);
    }
  };

  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Preuves fournies</span>
          <span className="font-semibold">{completedSteps.length}/{PROOF_STEPS.length}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="flex items-center gap-2">
          {PROOF_STEPS.map((step) => {
            const isComplete = proofStatus[step.id];
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  isComplete 
                    ? "bg-emerald-100 dark:bg-emerald-900/30" 
                    : "bg-muted"
                )}
                title={step.label}
              >
                {isComplete ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Icon className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Mes Preuves</CardTitle>
          </div>
          <Badge variant="secondary">
            {earnedPoints}/{totalPoints} points
          </Badge>
        </div>
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Niveau de confiance</span>
            <span className="font-semibold">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {PROOF_STEPS.map((step) => {
          const isComplete = proofStatus[step.id];
          const Icon = step.icon;
          
          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                isComplete 
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" 
                  : "bg-muted/30 border-border"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  isComplete 
                    ? "bg-emerald-100 dark:bg-emerald-900/50" 
                    : "bg-muted"
                )}
              >
                {isComplete ? (
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Icon className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium text-sm",
                    isComplete ? "text-emerald-800 dark:text-emerald-300" : "text-foreground"
                  )}>
                    {step.label}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    +{step.points} pts
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>

              {showActions && !isComplete && step.action && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleActionClick(step)}
                  className="gap-1"
                >
                  {step.action.label}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
              
              {isComplete && (
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              )}
            </div>
          );
        })}

        {nextStep && showActions && (
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Prochaine étape recommandée :
            </p>
            <Button 
              className="w-full gap-2" 
              onClick={() => handleActionClick(nextStep)}
            >
              <nextStep.icon className="w-4 h-4" />
              {nextStep.label}
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProofProgressIndicator;
