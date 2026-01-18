/**
 * SOVEREIGN CONSENT FLOW
 * Nouveau flux de consentement adapté au paradigme "Confiance par la Preuve"
 * Détaille l'accès aux SMS et fichiers locaux avec pédagogie sur la souveraineté des données
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  MessageSquare,
  FileText,
  Camera,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Server,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  Wallet,
  Lightbulb,
  Building2,
} from 'lucide-react';
import type { DataConsent, DataSourceType } from '@/lib/enrichment-types';

interface DataSourceConsent {
  type: DataSourceType | 'sms_analysis' | 'ussd_screenshot' | 'file_upload';
  label: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
  certaintyBonus: number;
  processingLocation: 'local' | 'server';
  dataRetention: 'none' | 'structured_only' | 'temporary' | 'permanent';
  detailedExplanation: string;
}

const SOVEREIGN_DATA_SOURCES: DataSourceConsent[] = [
  {
    type: 'sms_analysis',
    label: 'Analyse SMS Mobile Money',
    description: 'Extraction locale de votre historique financier via SMS',
    icon: MessageSquare,
    required: true,
    certaintyBonus: 0.9,
    processingLocation: 'local',
    dataRetention: 'structured_only',
    detailedExplanation: `
**Qu'est-ce qui est analysé ?**
- SMS des opérateurs : Orange Money, MTN MoMo, Wave, Moov Money
- Types détectés : virements reçus/envoyés, retraits, factures, rechargements

**Qu'est-ce qui N'EST PAS analysé ?**
- Vos SMS personnels, conversations privées
- SMS d'autres applications ou services

**Traitement des données :**
- L'analyse se fait **100% sur votre appareil** grâce à notre moteur NLP local
- Seules les **données structurées** (montant, date, type) sont envoyées
- Le contenu textuel brut des SMS **n'est jamais transmis**
    `,
  },
  {
    type: 'ussd_screenshot',
    label: 'Capture Profil Mobile Money',
    description: 'Validation de propriété via capture d\'écran USSD',
    icon: Camera,
    required: true,
    certaintyBonus: 0.85,
    processingLocation: 'local',
    dataRetention: 'none',
    detailedExplanation: `
**Pourquoi cette capture ?**
- Certifier que le numéro Mobile Money vous appartient
- Valider la correspondance avec votre pièce d'identité

**Protection des données :**
- L'image est analysée **localement** par OCR (Tesseract.js)
- Seul le **nom extrait** est comparé avec votre CNI
- L'image est **immédiatement supprimée** après analyse
- **Rien n'est stocké** sur nos serveurs
    `,
  },
  {
    type: 'file_upload',
    label: 'Documents justificatifs',
    description: 'Factures PDF, relevés bancaires (optionnel)',
    icon: FileText,
    required: false,
    certaintyBonus: 0.95,
    processingLocation: 'server',
    dataRetention: 'structured_only',
    detailedExplanation: `
**Documents acceptés :**
- Factures d'électricité (CIE, SBEE, Senelec...)
- Factures d'eau, téléphone fixe
- Relevés bancaires

**Traitement :**
- Les documents sont analysés par OCR sécurisé
- Seules les métadonnées (montants, dates, statut paiement) sont conservées
- Les fichiers originaux sont supprimés après extraction
    `,
  },
  {
    type: 'mobile_money',
    label: 'Données Mobile Money enrichies',
    description: 'Analyse approfondie de vos transactions',
    icon: Wallet,
    required: false,
    certaintyBonus: 0.9,
    processingLocation: 'local',
    dataRetention: 'structured_only',
    detailedExplanation: `
**Données analysées :**
- Volume et régularité des transactions
- Ratio entrées/sorties (flux de trésorerie)
- Régularité des revenus détectés

**Ce qui améliore votre score :**
- Transactions régulières sur 6+ mois
- Solde moyen positif
- Revenus stables et identifiables
    `,
  },
  {
    type: 'utility',
    label: 'Historique Factures',
    description: 'Paiements de services (électricité, eau...)',
    icon: Lightbulb,
    required: false,
    certaintyBonus: 0.85,
    processingLocation: 'local',
    dataRetention: 'structured_only',
    detailedExplanation: `
**Ce qui est analysé :**
- SMS de confirmation de paiement CIE, SBEE, Senelec...
- Régularité des paiements
- Retards éventuels

**Impact sur votre score :**
- Paiements réguliers = +15% de confiance
- Retards fréquents = impact négatif modéré
    `,
  },
];

interface SovereignConsentFlowProps {
  phoneNumber: string;
  onConsentComplete: (consent: DataConsent & { sovereign_consents: Record<string, boolean> }) => void;
  onSkip: () => void;
  loading?: boolean;
}

export function SovereignConsentFlow({
  phoneNumber,
  onConsentComplete,
  onSkip,
  loading = false,
}: SovereignConsentFlowProps) {
  const [consents, setConsents] = useState<Record<string, boolean>>({
    sms_analysis: true,
    ussd_screenshot: true,
    file_upload: false,
    mobile_money: true,
    utility: true,
  });

  const [acknowledgeDataSovereignty, setAcknowledgeDataSovereignty] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>('sms_analysis');

  const toggleConsent = (type: string) => {
    const source = SOVEREIGN_DATA_SOURCES.find(s => s.type === type);
    if (source?.required) return; // Can't toggle required sources
    setConsents(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSubmit = () => {
    const consent: DataConsent & { sovereign_consents: Record<string, boolean> } = {
      phone_number: phoneNumber,
      mobile_money_consent: consents.mobile_money || consents.sms_analysis,
      telecom_consent: true,
      registry_consent: false,
      utility_consent: consents.utility,
      sovereign_consents: consents,
    };
    onConsentComplete(consent);
  };

  const enabledCount = Object.values(consents).filter(Boolean).length;
  const estimatedCertainty = SOVEREIGN_DATA_SOURCES
    .filter(s => consents[s.type])
    .reduce((acc, s) => Math.max(acc, s.certaintyBonus), 0);

  const canSubmit = acknowledgeDataSovereignty && 
    SOVEREIGN_DATA_SOURCES
      .filter(s => s.required)
      .every(s => consents[s.type]);

  return (
    <Card className="card-premium">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-primary" />
          <CardTitle>Souveraineté de vos Données</CardTitle>
        </div>
        <CardDescription className="max-w-lg mx-auto">
          Contrairement aux systèmes traditionnels, <strong>vos données restent sous votre contrôle</strong>. 
          L'analyse se fait localement sur votre appareil.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Data Sovereignty Pledge */}
        <Alert className="bg-primary/5 border-primary/20">
          <Lock className="w-4 h-4 text-primary" />
          <AlertTitle className="text-primary">Notre engagement</AlertTitle>
          <AlertDescription className="text-sm">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Analyse locale via IA embarquée (Tesseract.js, NLP)</li>
              <li>Seules les données structurées sont transmises</li>
              <li>Aucun stockage permanent d'images ou SMS bruts</li>
              <li>Vous restez propriétaire de vos données à 100%</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Data Sources Accordion */}
        <Accordion 
          type="single" 
          collapsible 
          value={expandedItem || undefined}
          onValueChange={(value) => setExpandedItem(value)}
          className="space-y-2"
        >
          {SOVEREIGN_DATA_SOURCES.map((source) => {
            const isEnabled = consents[source.type];
            const Icon = source.icon;

            return (
              <AccordionItem 
                key={source.type} 
                value={source.type}
                className={`
                  border rounded-lg transition-all overflow-hidden
                  ${isEnabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'}
                `}
              >
                <div className="flex items-center p-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`
                      p-2 rounded-lg
                      ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{source.label}</span>
                        {source.required && (
                          <Badge variant="secondary" className="text-xs">Requis</Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            source.processingLocation === 'local' 
                              ? 'border-green-500 text-green-600' 
                              : 'border-blue-500 text-blue-600'
                          }`}
                        >
                          {source.processingLocation === 'local' ? (
                            <><Smartphone className="w-3 h-3 mr-1" /> Local</>
                          ) : (
                            <><Server className="w-3 h-3 mr-1" /> Serveur</>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{source.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <AccordionTrigger className="p-0 hover:no-underline">
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </AccordionTrigger>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => toggleConsent(source.type)}
                      disabled={source.required || loading}
                    />
                  </div>
                </div>

                <AccordionContent className="px-4 pb-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-line">
                    {source.detailedExplanation}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {source.dataRetention === 'none' ? (
                        <><EyeOff className="w-3 h-3 text-green-500" /> Aucune conservation</>
                      ) : source.dataRetention === 'structured_only' ? (
                        <><Eye className="w-3 h-3 text-blue-500" /> Données structurées uniquement</>
                      ) : (
                        <><Eye className="w-3 h-3 text-yellow-500" /> Conservation temporaire</>
                      )}
                    </div>
                    <div>
                      Coefficient de certitude : <strong>{Math.round(source.certaintyBonus * 100)}%</strong>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Certainty Estimate */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Coefficient de certitude estimé</span>
            <Badge className="bg-green-500">{Math.round(estimatedCertainty * 100)}%</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Plus vous autorisez de sources, plus votre score sera précis et fiable.
          </p>
        </div>

        {/* Final Acknowledgement */}
        <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
          <Checkbox
            id="sovereignty"
            checked={acknowledgeDataSovereignty}
            onCheckedChange={(checked) => setAcknowledgeDataSovereignty(checked === true)}
          />
          <div className="flex-1">
            <Label htmlFor="sovereignty" className="font-medium cursor-pointer">
              Je comprends et accepte le traitement de mes données
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              J'ai lu et compris comment mes données seront analysées. Je comprends que l'analyse 
              se fait localement sur mon appareil et que seules les données structurées seront 
              transmises pour le calcul de mon score.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={loading}
            className="flex-1"
          >
            Continuer sans analyse
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Traitement...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Valider ({enabledCount} sources)
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
