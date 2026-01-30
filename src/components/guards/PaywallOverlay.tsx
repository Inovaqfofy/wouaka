import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PaywallOverlayProps {
  userType: 'borrower' | 'partner';
  title?: string;
  description?: string;
  showTrialOption?: boolean;
  className?: string;
}

export function PaywallOverlay({
  userType,
  title,
  description,
  showTrialOption = true,
  className,
}: PaywallOverlayProps) {
  const navigate = useNavigate();

  const handleViewPlans = () => {
    navigate('/pricing');
  };

  const handleStartTrial = () => {
    navigate('/pricing?trial=true');
  };

  const features = userType === 'borrower' 
    ? [
        { icon: Shield, label: 'Certificat de solvabilité' },
        { icon: Sparkles, label: 'Score de confiance' },
        { icon: Zap, label: 'Partage sécurisé' },
      ]
    : [
        { icon: Shield, label: 'Dossiers de preuves illimités' },
        { icon: Sparkles, label: 'API scoring & KYC' },
        { icon: Zap, label: 'Webhooks en temps réel' },
      ];

  return (
    <div className={cn(
      "flex items-center justify-center min-h-[400px] p-6",
      className
    )}>
      <Card className="max-w-md w-full border-primary/20 bg-gradient-to-b from-background to-muted/30">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <Badge variant="secondary" className="mx-auto mb-2">
            Fonctionnalité Premium
          </Badge>
          <CardTitle className="text-xl">
            {title || 'Abonnement requis'}
          </CardTitle>
          <CardDescription>
            {description || (
              userType === 'borrower'
                ? 'Accédez à votre certificat de solvabilité et partagez-le avec les partenaires financiers.'
                : 'Débloquez l\'accès complet à l\'API scoring et aux dossiers de preuves.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Features list */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-muted-foreground">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="space-y-3 pt-2">
            <Button 
              onClick={handleViewPlans} 
              className="w-full"
              size="lg"
            >
              Voir les plans
            </Button>
            
            {showTrialOption && userType === 'partner' && (
              <Button 
                variant="outline" 
                onClick={handleStartTrial}
                className="w-full"
              >
                Essai gratuit 14 jours
              </Button>
            )}
          </div>

          {/* Fine print */}
          <p className="text-xs text-center text-muted-foreground">
            {userType === 'borrower' 
              ? 'À partir de 2 500 FCFA pour 30 jours'
              : 'Sans engagement • Annulez à tout moment'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
