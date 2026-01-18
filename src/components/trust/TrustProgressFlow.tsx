/**
 * WOUAKA Trust Progress Flow
 * Educational UX component showing profile trust progression
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Phone,
  Camera,
  FileText,
  MessageSquare,
  CheckCircle2,
  Lock,
  Shield,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PhoneTrustState, ValidationProgress } from '@/lib/trust-graph/phone-trust-validator';
import { getValidationProgress } from '@/lib/trust-graph/phone-trust-validator';

interface TrustProgressFlowProps {
  trustState: PhoneTrustState | null;
  onStartOtp: () => void;
  onUploadUssd: () => void;
  onVerifyIdentity: () => void;
  onAnalyzeSms: () => void;
  isLoading?: boolean;
  className?: string;
}

interface StageConfig {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  explanation: string;
  points: number;
}

const STAGES: StageConfig[] = [
  {
    id: 'otp',
    icon: Phone,
    title: 'Vérification OTP',
    description: 'Confirmez la possession de votre numéro',
    explanation: 'Un code SMS prouve que vous contrôlez ce numéro. C\'est la base de votre identité mobile.',
    points: 20,
  },
  {
    id: 'ussd',
    icon: Camera,
    title: 'Capture profil MoMo',
    description: 'Capture d\'écran de votre compte Mobile Money',
    explanation: 'Nous vérifions localement que le nom affiché correspond à votre pièce d\'identité. L\'image n\'est jamais stockée.',
    points: 25,
  },
  {
    id: 'identity',
    icon: FileText,
    title: 'Validation croisée',
    description: 'Correspondance avec votre CNI',
    explanation: 'Notre IA compare le nom de votre compte MoMo avec votre pièce d\'identité pour certifier la propriété.',
    points: 30,
  },
  {
    id: 'sms',
    icon: MessageSquare,
    title: 'Historique SMS',
    description: 'Analyse locale de vos SMS financiers',
    explanation: 'Vos SMS sont analysés uniquement sur votre appareil. Seules les données structurées sont transmises, jamais le contenu brut.',
    points: 25,
  },
];

const TRUST_LEVELS = {
  unverified: { label: 'Non vérifié', color: 'bg-muted text-muted-foreground' },
  basic: { label: 'Basique', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  verified: { label: 'Vérifié', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  certified: { label: 'Certifié', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  gold: { label: 'Gold', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
};

export const TrustProgressFlow: React.FC<TrustProgressFlowProps> = ({
  trustState,
  onStartOtp,
  onUploadUssd,
  onVerifyIdentity,
  onAnalyzeSms,
  isLoading = false,
  className,
}) => {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  
  const progress: ValidationProgress = trustState 
    ? getValidationProgress(trustState)
    : { currentStage: 'otp', completedStages: [], progressPercent: 0 };
  
  const trustLevel = trustState?.trustLevel || 'unverified';
  const trustScore = trustState?.trustScore || 0;
  
  const isStageCompleted = (stageId: string) => progress.completedStages.includes(stageId);
  const isStageActive = (stageId: string) => progress.currentStage === stageId;
  const isStageDisabled = (stageId: string) => {
    const stageIndex = STAGES.findIndex(s => s.id === stageId);
    const currentIndex = STAGES.findIndex(s => s.id === progress.currentStage);
    return stageIndex > currentIndex;
  };
  
  const handleStageAction = (stageId: string) => {
    switch (stageId) {
      case 'otp': onStartOtp(); break;
      case 'ussd': onUploadUssd(); break;
      case 'identity': onVerifyIdentity(); break;
      case 'sms': onAnalyzeSms(); break;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with trust score */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Graphe de Confiance</CardTitle>
                <CardDescription>
                  Construisez votre profil de crédit souverain
                </CardDescription>
              </div>
            </div>
            <Badge className={cn('px-3 py-1', TRUST_LEVELS[trustLevel as keyof typeof TRUST_LEVELS]?.color)}>
              {TRUST_LEVELS[trustLevel as keyof typeof TRUST_LEVELS]?.label || 'Inconnu'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Score de confiance</span>
              <span className="font-semibold">{trustScore}/100</span>
            </div>
            <Progress value={trustScore} className="h-3" />
          </div>
          
          {/* Privacy notice */}
          <Alert className="mt-4 border-primary/20 bg-primary/5">
            <Lock className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Pourquoi ce processus ?</strong> Pour garantir votre indépendance financière 
              et ne pas dépendre des banques traditionnelles. Vos données restent souveraines.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progression</span>
          <span className="font-medium">{progress.progressPercent}%</span>
        </div>
        <Progress value={progress.progressPercent} className="h-2" />
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {STAGES.map((stage, index) => {
          const completed = isStageCompleted(stage.id);
          const active = isStageActive(stage.id);
          const disabled = isStageDisabled(stage.id);
          const expanded = expandedStage === stage.id;
          const Icon = stage.icon;
          
          return (
            <Card 
              key={stage.id}
              className={cn(
                'transition-all duration-200',
                completed && 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20',
                active && !completed && 'border-primary ring-2 ring-primary/20',
                disabled && 'opacity-50'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Stage icon */}
                  <div className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                    completed ? 'bg-green-500 text-white' : 
                    active ? 'bg-primary text-primary-foreground' : 
                    'bg-muted text-muted-foreground'
                  )}>
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  
                  {/* Stage content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {stage.title}
                          {completed && (
                            <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                              +{stage.points} pts
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                      </div>
                      
                      {/* Action button */}
                      {active && !completed && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStageAction(stage.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              Commencer
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {/* Expandable explanation */}
                    <button
                      className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
                      onClick={() => setExpandedStage(expanded ? null : stage.id)}
                    >
                      {expanded ? 'Masquer' : 'Pourquoi cette étape ?'}
                    </button>
                    
                    {expanded && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm">
                        <div className="flex gap-2">
                          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <p>{stage.explanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Completion message */}
      {progress.currentStage === 'complete' && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800">
          <CardContent className="p-6 text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-green-500 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
              Profil certifié !
            </h3>
            <p className="text-green-700 dark:text-green-300">
              Votre graphe de confiance est complet. Vos données sont désormais 
              pondérées avec un coefficient de certitude élevé (0.9).
            </p>
          </CardContent>
        </Card>
      )}

      {/* Fraud warning if detected */}
      {trustState?.multipleUsersDetected && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Alerte sécurité :</strong> Ce numéro est associé à plusieurs comptes. 
            Veuillez contacter le support pour vérification.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TrustProgressFlow;
