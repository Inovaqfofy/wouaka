import React from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  FileCheck, 
  Shield, 
  AlertTriangle, 
  Globe, 
  Building2,
  Users,
  Smartphone,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock
} from 'lucide-react';

interface DataSourceDocProps {
  showTitle?: boolean;
}

const dataCategories = [
  {
    id: 'verified',
    title: 'Données Vérifiées',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Données confirmées par des sources tierces de confiance',
    sources: [
      {
        name: 'OCR Documents Officiels',
        description: 'Extraction et validation automatique des CNI, passeports, factures',
        method: 'Tesseract.js (local) + règles de validation UEMOA',
        confidence: '70-95%',
        requirement: 'Upload document lisible',
      },
      {
        name: 'Vérification Téléphone',
        description: 'Code OTP envoyé par SMS',
        method: 'AfricasTalking API',
        confidence: '95%',
        requirement: 'Numéro actif',
      },
      {
        name: 'Reconnaissance Faciale',
        description: 'Comparaison selfie vs photo document',
        method: 'Face-API.js (local)',
        confidence: '70-90%',
        requirement: 'Selfie + document photo',
      },
      {
        name: 'Détection Vivacité',
        description: 'Vérification anti-spoofing',
        method: 'Face-API.js landmarks analysis',
        confidence: '60-85%',
        requirement: 'Caméra en direct',
      },
      {
        name: 'RCCM Scraping',
        description: 'Vérification registre commercial',
        method: 'Scraping portails publics UEMOA',
        confidence: '75-90%',
        requirement: 'Numéro RCCM valide',
      },
      {
        name: 'Attestations Partenaires',
        description: 'Validations par MFI, coopératives, employeurs',
        method: 'Signatures cryptographiques partenaires vérifiés',
        confidence: '80-95%',
        requirement: 'Partenaire Wouaka actif',
      },
    ],
  },
  {
    id: 'partial',
    title: 'Données Partiellement Vérifiées',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Données avec validation partielle ou en attente',
    sources: [
      {
        name: 'OCR sans Cross-Validation',
        description: 'Texte extrait mais non recoupé',
        method: 'Extraction regex locale',
        confidence: '40-65%',
        requirement: 'Document uploadé',
      },
      {
        name: 'Historique MoMo (Screenshot)',
        description: 'Capture d\'écran Mobile Money analysée',
        method: 'OCR + pattern matching UI officielle',
        confidence: '50-70%',
        requirement: 'Screenshot récent',
      },
      {
        name: 'SMS Bancaires',
        description: 'Alertes SMS analysées',
        method: 'Pattern matching numéros officiels',
        confidence: '60-80%',
        requirement: 'Screenshots SMS',
      },
    ],
  },
  {
    id: 'declared',
    title: 'Données Déclaratives',
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    description: 'Informations fournies par l\'utilisateur sans vérification externe',
    sources: [
      {
        name: 'Revenus Déclarés',
        description: 'Montant saisi par l\'utilisateur',
        method: 'Validation vs contexte national',
        confidence: '30-50%',
        requirement: 'Formulaire',
      },
      {
        name: 'Dépenses Mensuelles',
        description: 'Estimation utilisateur',
        method: 'Cohérence avec revenus',
        confidence: '30-50%',
        requirement: 'Formulaire',
      },
      {
        name: 'Participation Tontine',
        description: 'Auto-déclaration',
        method: 'Aucune vérification',
        confidence: '20-40%',
        requirement: 'Formulaire',
      },
      {
        name: 'Années d\'Activité',
        description: 'Ancienneté déclarée',
        method: 'Cohérence avec âge',
        confidence: '30-50%',
        requirement: 'Formulaire',
      },
    ],
  },
  {
    id: 'context',
    title: 'Données Contextuelles',
    icon: Globe,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Indicateurs régionaux et sectoriels publics',
    sources: [
      {
        name: 'Indices Économiques BCEAO',
        description: 'PIB, inflation, inclusion financière par pays',
        method: 'Open Data BCEAO/World Bank',
        confidence: '95%',
        requirement: 'Pays UEMOA',
      },
      {
        name: 'Risques Sectoriels',
        description: 'Volatilité et formalisation par secteur',
        method: 'Données agrégées MFI',
        confidence: '80%',
        requirement: 'Secteur identifié',
      },
      {
        name: 'Contexte Urbain',
        description: 'Infrastructure et activité par ville',
        method: 'Données géographiques',
        confidence: '75%',
        requirement: 'Ville identifiée',
      },
    ],
  },
];

export function DataSourcesDocumentation({ showTitle = true }: DataSourceDocProps) {
  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Sources de Données Wouaka
          </CardTitle>
          <CardDescription>
            Transparence complète sur les données utilisées pour le scoring et la vérification KYC
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <Accordion type="multiple" className="space-y-2">
          {dataCategories.map((category) => (
            <AccordionItem 
              key={category.id} 
              value={category.id}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${category.bgColor}`}>
                    <category.icon className={`h-5 w-5 ${category.color}`} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{category.title}</div>
                    <div className="text-sm text-muted-foreground">{category.description}</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-3">
                  {category.sources.map((source, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-muted/30 rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{source.name}</span>
                        <Badge variant="outline" className={category.color}>
                          {source.confidence}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{source.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Shield className="h-3 w-3" />
                          <span>Méthode: {source.method}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <FileCheck className="h-3 w-3" />
                          <span>Requis: {source.requirement}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Important notice */}
        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-primary">Information Importante</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  <strong>Aucune API Mobile Money active</strong> - Les données MoMo sont analysées via OCR de screenshots
                </li>
                <li>
                  Le scoring distingue clairement les données <strong>vérifiées</strong> des données <strong>déclarées</strong>
                </li>
                <li>
                  Un taux de vérification plus élevé améliore la confiance du score final
                </li>
                <li>
                  Les attestations partenaires permettent de valider les données déclaratives
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            100% Souverain
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            RGPD/UEMOA Conforme
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Scoring Explicable
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default DataSourcesDocumentation;
