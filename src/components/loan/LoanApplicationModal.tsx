/**
 * LoanApplicationModal - Modale de demande de prêt
 * 
 * Formulaire avec calcul dynamique des mensualités
 * Montant maximum bridé par le score utilisateur (score × 20 000 FCFA)
 * Taux dynamique selon le score (15% si < 60, 10% si >= 60)
 * 
 * @uses calculateMonthlyPayment pour le calcul des mensualités
 * @uses shadcn/ui Dialog
 */

import { useState, useMemo } from 'react';
import { CreditCard, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getWouakaClient, parseWouakaSdkError } from '@/lib/wouaka-sdk-client';

// ============================================
// Types
// ============================================

interface LoanApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  score: number;
  userId?: string;
}

// ============================================
// Constants
// ============================================

const MIN_AMOUNT = 50000; // 50,000 FCFA minimum
const MAX_AMOUNT_ABSOLUTE = 2000000; // 2,000,000 FCFA max
const AMOUNT_PER_SCORE_POINT = 20000; // 20,000 FCFA per score point
const DURATION_OPTIONS = [3, 6, 12, 24];

// ============================================
// Helpers
// ============================================

/**
 * Get dynamic interest rate based on score
 * 15% if score < 60, 10% if score >= 60
 */
function getInterestRate(score: number): number {
  return score < 60 ? 0.15 : 0.10;
}

/**
 * Calculate maximum loan amount based on score
 */
function getMaxAmount(score: number): number {
  const scoreBasedMax = score * AMOUNT_PER_SCORE_POINT;
  return Math.min(Math.max(MIN_AMOUNT, scoreBasedMax), MAX_AMOUNT_ABSOLUTE);
}

/**
 * Calculate monthly payment using standard amortization formula
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
function calculateMonthlyPayment(principal: number, months: number, annualRate: number): number {
  if (months === 0 || principal === 0) return 0;
  
  const monthlyRate = annualRate / 12;
  const factor = Math.pow(1 + monthlyRate, months);
  
  return principal * (monthlyRate * factor) / (factor - 1);
}

/**
 * Format currency in FCFA
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount)) + ' FCFA';
}

// ============================================
// Duration Selector Component
// ============================================

interface DurationSelectorProps {
  value: number;
  onChange: (duration: number) => void;
}

function DurationSelector({ value, onChange }: DurationSelectorProps) {
  return (
    <div className="flex gap-2">
      {DURATION_OPTIONS.map(months => (
        <Button
          key={months}
          type="button"
          variant={value === months ? 'default' : 'outline'}
          className={`flex-1 ${value === months ? '' : 'hover:bg-muted'}`}
          onClick={() => onChange(months)}
        >
          {months} mois
        </Button>
      ))}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function LoanApplicationModal({ 
  open, 
  onOpenChange, 
  score,
  userId 
}: LoanApplicationModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate max amount and interest rate based on score
  const maxAmount = useMemo(() => getMaxAmount(score), [score]);
  const interestRate = useMemo(() => getInterestRate(score), [score]);
  
  // Form state
  const [amount, setAmount] = useState(Math.min(maxAmount, 500000));
  const [duration, setDuration] = useState(12);

  // Calculate payment details dynamically
  const monthlyPayment = useMemo(() => 
    calculateMonthlyPayment(amount, duration, interestRate),
    [amount, duration, interestRate]
  );
  
  const totalPayment = useMemo(() => monthlyPayment * duration, [monthlyPayment, duration]);
  const totalInterest = useMemo(() => totalPayment - amount, [totalPayment, amount]);

  // Handle amount change from slider
  const handleAmountSliderChange = (value: number[]) => {
    setAmount(value[0]);
  };

  // Handle amount change from input
  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
    const clampedValue = Math.min(Math.max(value, MIN_AMOUNT), maxAmount);
    setAmount(clampedValue);
  };

  // Submit application
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const apiKey = localStorage.getItem('wouaka_api_key') || import.meta.env.VITE_WOUAKA_API_KEY;
      
      if (!apiKey) {
        throw new Error('Clé API non configurée');
      }

      const client = getWouakaClient(apiKey);
      
      const applicationData = {
        user_id: userId,
        amount: amount,
        duration_months: duration,
        monthly_payment: Math.round(monthlyPayment),
        total_payment: Math.round(totalPayment),
        interest_rate: interestRate,
        score_at_application: score,
      };

      // Use SDK method
      await (client as any)._request('loan-application', 'POST', applicationData);

      toast({
        title: 'Demande envoyée !',
        description: `Votre demande de prêt de ${formatCurrency(amount)} a été soumise avec succès.`,
      });

      onOpenChange(false);
    } catch (err) {
      const parsedError = parseWouakaSdkError(err);
      setError(parsedError.message);
      
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: parsedError.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Demande de Prêt
          </DialogTitle>
          <DialogDescription>
            Score {score}/100 — Montant max:{' '}
            <span className="font-semibold text-foreground">
              {formatCurrency(maxAmount)}
            </span>
            {' '}— Taux: <span className="font-semibold">{(interestRate * 100).toFixed(0)}%</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Amount Field */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Montant souhaité
            </Label>
            
            <div className="flex items-center gap-3">
              <Input
                type="text"
                value={amount.toLocaleString('fr-FR')}
                onChange={handleAmountInputChange}
                className="w-40 text-right font-mono"
              />
              <span className="text-sm text-muted-foreground">FCFA</span>
            </div>
            
            <Slider
              value={[amount]}
              onValueChange={handleAmountSliderChange}
              min={MIN_AMOUNT}
              max={maxAmount}
              step={10000}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(MIN_AMOUNT)}</span>
              <span>{formatCurrency(maxAmount)}</span>
            </div>
          </div>

          {/* Duration Field */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Durée de remboursement
            </Label>
            
            <DurationSelector value={duration} onChange={setDuration} />
          </div>

          {/* Monthly Payment Display - Large */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Votre mensualité</p>
              <p className="text-4xl font-bold text-primary">
                {formatCurrency(monthlyPayment)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                pendant {duration} mois
              </p>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Total à rembourser</p>
              <p className="font-semibold">{formatCurrency(totalPayment)}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Coût du crédit</p>
              <p className="font-semibold text-destructive">{formatCurrency(totalInterest)}</p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Confirmer la demande'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LoanApplicationModal;
