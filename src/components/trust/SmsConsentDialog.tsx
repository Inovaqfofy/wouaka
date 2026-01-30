/**
 * WOUAKA SMS Consent Dialog
 * Explains SMS reading and gets user consent
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  MessageSquare,
  Lock,
  Eye,
  EyeOff,
  Server,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

interface SmsConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent: (consentId: string) => void;
  phoneNumber: string;
}

export const SmsConsentDialog: React.FC<SmsConsentDialogProps> = ({
  open,
  onOpenChange,
  onConsent,
  phoneNumber,
}) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedDataUse, setAcceptedDataUse] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canProceed = acceptedTerms && acceptedDataUse;

  const handleConsent = async () => {
    if (!canProceed) return;
    
    setIsSubmitting(true);
    
    // Generate consent ID (would normally come from database)
    const consentId = crypto.randomUUID();
    
    // Simulate consent logging
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsSubmitting(false);
    onConsent(consentId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Analyse de vos SMS financiers
          </DialogTitle>
          <DialogDescription>
            Pour construire votre score de crédit souverain
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {/* What we do */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Ce que nous analysons
              </h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  SMS de <strong>Orange Money, MTN MoMo, Wave, Moov</strong>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  SMS de factures (CIE, SENELEC, eau, internet)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Montants, dates, types de transactions
                </li>
              </ul>
            </div>

            {/* What we don't do */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-destructive" />
                Ce que nous ne faisons PAS
              </h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  Lire vos SMS personnels ou conversations
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  Stocker le contenu brut de vos SMS
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  Partager vos données avec des tiers
                </li>
              </ul>
            </div>

            {/* How it works */}
            <Alert className="bg-primary/5 border-primary/20">
              <Smartphone className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Traitement 100% local</strong><br />
                L'analyse se fait entièrement sur votre appareil. 
                Seules les données structurées (montants, dates, types) 
                sont envoyées à nos serveurs, jamais le texte original.
              </AlertDescription>
            </Alert>

            {/* Privacy guarantee */}
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    Garantie de souveraineté
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Vos données financières vous appartiennent. Elles sont utilisées 
                    uniquement pour calculer votre score de crédit et vous libérer 
                    de la dépendance aux institutions bancaires traditionnelles.
                  </p>
                </div>
              </div>
            </div>

            {/* Consent checkboxes */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  J'autorise l'analyse locale de mes SMS financiers 
                  (Mobile Money et factures) pour les 12 derniers mois.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="dataUse"
                  checked={acceptedDataUse}
                  onCheckedChange={(checked) => setAcceptedDataUse(checked === true)}
                />
                <Label htmlFor="dataUse" className="text-sm leading-relaxed cursor-pointer">
                  J'accepte que les données structurées extraites soient utilisées 
                  pour calculer mon score de crédit avec un coefficient de certitude 
                  de 0.7 à 0.9.
                </Label>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleConsent} 
            disabled={!canProceed || isSubmitting}
          >
            {isSubmitting ? 'Enregistrement...' : 'Autoriser l\'analyse'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmsConsentDialog;
