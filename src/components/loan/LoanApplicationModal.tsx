/**
 * LoanApplicationModal - Modale de demande de prêt
 * * Formulaire avec calcul dynamique des mensualités
 * Montant maximum bridé par le score utilisateur (score × 20 000 FCFA)
 * Taux dynamique selon le score (15% si < 60, 10% si >= 60)
 */

import { useState, useMemo, useEffect } from 'react';
import { CreditCard, Calendar, RefreshCw, AlertCircle, Info } from 'lucide-react';
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
// Types & Constantes
// ============================================

interface LoanApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  score: number;
  userId?: string;
}

const MIN_AMOUNT = 50000;
const MAX_AMOUNT_ABSOLUTE = 2000000;
const AMOUNT_PER_SCORE_POINT = 20000;
const DURATION_OPTIONS = [3, 6, 12, 24];

// ============================================
// Helpers de calcul
// ============================================

function getInterestRate(score: number): number {
  return score < 60 ? 0.15 : 0.10;
}

function getMaxAmount(score: number): number {
  const scoreBasedMax = score * AMOUNT_PER_SCORE_POINT;
  return Math.min(Math.max(MIN_AMOUNT, scoreBasedMax), MAX_AMOUNT_ABSOLUTE);
}

function calculateMonthlyPayment(principal: number, months: number, annualRate: number): number {
  if (months === 0 || principal === 0) return 0;
  const monthlyRate = annualRate / 12;
  const factor = Math.pow(1 + monthlyRate, months);
  return principal * (monthlyRate * factor) / (factor - 1);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
}

// ============================================
// Composant Principal
// ============================================

export function LoanApplicationModal({ 
  open, 
  onOpenChange, 
  score,
  userId 
}: LoanApplicationModalProps) {
  const { toast } = useToast();
  
  // Logic & State
  const maxAmount = useMemo(() => getMaxAmount(score), [score]);
  const interestRate = useMemo(() => getInterestRate(score), [score]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(MIN_AMOUNT);
  const [duration, setDuration] = useState(12);

  // Réinitialisation lors de l'ouverture
  useEffect(() => {
    if (open) {
      setAmount(Math.min(maxAmount, 500000));
      setDuration(12);
      setError(null);
    }
  }, [open, maxAmount]);

  // Calculs financiers
  const monthlyPayment = useMemo(() => 
    calculateMonthlyPayment(amount, duration, interestRate),
    [amount, duration, interestRate]
  );
  
  const totalPayment = monthlyPayment * duration;
  const totalInterest = totalPayment - amount;

  // Handlers
  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\s/g, '');
    const value = parseInt(rawValue, 10) || 0;
    // On ne bride pas l'input pendant la frappe pour éviter de bloquer l'utilisateur
    setAmount(value);
  };

  const handleBlur = () => {
    // On bride au moment où l'utilisateur quitte le champ (blur)
    const clampedValue = Math.min(Math.max(amount, MIN_AMOUNT), maxAmount);
    setAmount(clampedValue);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const apiKey = localStorage.getItem('wouaka_api_key') || import.meta.env.VITE_WOUAKA_API_KEY;
      if (!apiKey) throw new Error('Clé API non configurée');

      const client = getWouakaClient(apiKey);
      
      const payload = {
        user_id: userId,
        amount,
        duration_months: duration,
        monthly_payment: Math.round(monthlyPayment),
        total_payment: Math.round(totalPayment),
        interest_rate: interestRate,
        score_at_application: score,
        applied_at: new Date().toISOString()
      };

      // Simulation de l'appel SDK (à adapter selon ta méthode réelle)
      await (client as any)._request('loans/apply', 'POST', payload);

      toast({
        title: 'Félicitations !',
        description: `Demande de ${formatCurrency(amount)} envoyée avec succès.`,
      });

      onOpenChange(false);
    } catch (err) {
      const parsed = parseWouakaSdkError(err);
      setError(parsed.message);
      toast({ variant: 'destructive', title: 'Échec', description: parsed.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-6 w-6 text-primary" />
            Demande de Prêt
          </DialogTitle>
          <DialogDescription className="bg-muted/50 p-2 rounded-md mt-2">
            Basé sur votre score de <strong>{score}/100</strong>, votre taux est de <strong>{(interestRate * 100).toFixed(0)}%</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Montant */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="amount" className="font-semibold">Montant du prêt</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="amount"
                  value={amount.toLocaleString('fr-FR')}
                  onChange={handleAmountInputChange}
                  onBlur={handleBlur}
                  className="w-32 text-right font-bold text-primary"
                />
                <span className="text-xs font-medium text-muted-foreground">FCFA</span>
              </div>
            </div>
            
            <Slider
              value={[amount]}
              onValueChange={(val) => setAmount(val[0])}
              min={MIN_AMOUNT}
              max={maxAmount}
              step={5000}
              className="py-2"
            />
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Min: {formatCurrency(MIN_AMOUNT)}</span>
              <span className="text-primary font-bold">Max: {formatCurrency(maxAmount)}</span>
            </div>
          </div>

          {/* Durée */}
          <div className="space-y-3">
            <Label className="font-semibold">Durée de remboursement</Label>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map((m) => (
                <Button
                  key={m}
                  variant={duration === m ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDuration(m)}
                  className="w-full"
                >
                  {m}m
                </Button>
              ))}
            </div>
          </div>

          {/* Résumé Dynamique */}
          <Card className="border-primary/20 bg-primary/5 shadow-none">
            <CardContent className="p-6 text-center space-y-1">
              <p className="text-sm text-muted-foreground">Mensualité estimée</p>
              <div className="text-4xl font-black text-primary tracking-tight">
                {formatCurrency(monthlyPayment)}
              </div>
              <p className="text-xs text-muted-foreground">Pendant {duration} mois</p>
            </CardContent>
          </Card>

          {/* Détails */}
          <div className="grid grid-cols-2 gap-3 text-xs border-t pt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total à payer:</span>
              <span className="font-medium">{formatCurrency(totalPayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intérêts:</span>
              <span className="font-medium text-destructive">+{formatCurrency(totalInterest)}</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 gap-2">
            {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            Confirmer la demande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LoanApplicationModal;
