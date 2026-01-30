import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, ShieldCheck, Sparkles, Clock, RefreshCw, Infinity } from 'lucide-react';
import { useCertificatePayment } from '@/hooks/useBorrowerCertificate';
import { BORROWER_PLANS, type BorrowerPlan } from '@/lib/pricing-plans';
import { cn } from '@/lib/utils';

interface PurchaseCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchaseComplete?: () => void;
}

export function PurchaseCertificateDialog({
  open,
  onOpenChange,
  onPurchaseComplete
}: PurchaseCertificateDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { openPaymentPage, isLoading } = useCertificatePayment();

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    await openPaymentPage(selectedPlan);
    onPurchaseComplete?.();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatValidity = (days: number) => {
    if (days >= 365) return `${Math.floor(days / 365)} an${days >= 730 ? 's' : ''}`;
    if (days >= 30) return `${Math.floor(days / 30)} mois`;
    return `${days} jours`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Obtenir mon certificat de solvabilité
          </DialogTitle>
          <DialogDescription>
            Choisissez un plan pour obtenir votre certificat avec partage illimité vers les institutions financières.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {BORROWER_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlan === plan.id}
              onSelect={() => setSelectedPlan(plan.id)}
              formatPrice={formatPrice}
              formatValidity={formatValidity}
            />
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handlePurchase} 
            disabled={!selectedPlan || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirection...
              </>
            ) : (
              <>
                Payer maintenant
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PlanCardProps {
  plan: BorrowerPlan;
  selected: boolean;
  onSelect: () => void;
  formatPrice: (price: number) => string;
  formatValidity: (days: number) => string;
}

function PlanCard({ plan, selected, onSelect, formatPrice, formatValidity }: PlanCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:border-primary/50",
        selected && "border-primary ring-2 ring-primary/20",
        plan.popular && "border-primary/30"
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              {plan.popular && (
                <Badge className="bg-primary/10 text-primary">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Populaire
                </Badge>
              )}
            </div>
            <CardDescription>{plan.description}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-primary">
              {formatPrice(plan.price)}
            </div>
          </div>
        </div>
        
        {/* Validity and recertifications badges */}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Valide {formatValidity(plan.validityDays)}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            {plan.recertifications === null ? (
              <>
                <Infinity className="w-3 h-3" />
                Recertifications illimitées
              </>
            ) : plan.recertifications === 0 ? (
              'Pas de recertification'
            ) : (
              `${plan.recertifications} recertification${plan.recertifications > 1 ? 's' : ''}`
            )}
          </Badge>
        </div>
        
        {plan.highlight && (
          <Badge className="mt-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            {plan.highlight}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
