import { useNavigate } from 'react-router-dom';
import { FileCheck, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface KycRequiredCardProps {
  documentsRequired: number;
  documentsUploaded: number;
  kycStatus: 'none' | 'pending' | 'validated' | 'rejected';
  title?: string;
  description?: string;
  redirectTo?: string;
  className?: string;
}

export function KycRequiredCard({
  documentsRequired,
  documentsUploaded,
  kycStatus,
  title,
  description,
  redirectTo = '/dashboard/borrower/documents',
  className,
}: KycRequiredCardProps) {
  const navigate = useNavigate();

  const progress = documentsRequired > 0 
    ? Math.round((documentsUploaded / documentsRequired) * 100) 
    : 0;

  const handleCompleteKyc = () => {
    navigate(redirectTo);
  };

  const getStatusBadge = () => {
    switch (kycStatus) {
      case 'validated':
        return <Badge className="bg-primary text-primary-foreground">Vérifié</Badge>;
      case 'pending':
        return <Badge variant="secondary">En cours de vérification</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">Non commencé</Badge>;
    }
  };

  const steps = [
    { 
      label: 'Pièce d\'identité', 
      completed: documentsUploaded >= 1,
      required: true 
    },
    { 
      label: 'Justificatif de domicile', 
      completed: documentsUploaded >= 2,
      required: true 
    },
    { 
      label: 'Justificatif de revenus', 
      completed: documentsUploaded >= 3,
      required: false 
    },
  ];

  return (
    <div className={cn(
      "flex items-center justify-center min-h-[400px] p-6",
      className
    )}>
      <Card className="max-w-md w-full border-accent/20 bg-gradient-to-b from-background to-accent/5">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 rounded-full bg-accent/10 w-fit">
            <FileCheck className="h-8 w-8 text-accent-foreground" />
          </div>
          <div className="flex justify-center mb-2">
            {getStatusBadge()}
          </div>
          <CardTitle className="text-xl">
            {title || 'Vérification d\'identité requise'}
          </CardTitle>
          <CardDescription>
            {description || 'Complétez votre vérification KYC pour accéder à cette fonctionnalité.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps checklist */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  step.completed 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-muted/30 border-border"
                )}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                )}
                <span className={cn(
                  "text-sm flex-1",
                  step.completed ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
                {step.required && !step.completed && (
                  <Badge variant="outline" className="text-xs">Requis</Badge>
                )}
              </div>
            ))}
          </div>

          {/* Warning for rejected */}
          {kycStatus === 'rejected' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                Votre vérification a été rejetée. Veuillez soumettre de nouveaux documents.
              </p>
            </div>
          )}

          {/* CTA */}
          <Button 
            onClick={handleCompleteKyc} 
            className="w-full"
            size="lg"
          >
            <Upload className="h-4 w-4 mr-2" />
            {kycStatus === 'none' 
              ? 'Commencer la vérification' 
              : 'Continuer la vérification'
            }
          </Button>

          {/* Info */}
          <p className="text-xs text-center text-muted-foreground">
            La vérification prend généralement moins de 24h
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
