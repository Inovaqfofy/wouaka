import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileCheck, 
  BarChart3, 
  Layers,
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  CreditCard,
  Building2,
  MapPin,
  Briefcase,
  CheckCircle,
  Loader2,
  Upload,
  Banknote,
  Users,
  Smartphone,
  Receipt,
  AlertTriangle,
  Shield,
  Fingerprint,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useEvaluateClient } from "@/hooks/useEvaluateClient";
import { EvaluationDocumentUpload, DocumentType } from "@/components/kyc/EvaluationDocumentUpload";
import { PhoneVerificationOTP } from "@/components/kyc/PhoneVerificationOTP";
import { LivenessCheck } from "@/components/kyc/LivenessCheck";
import { FaceComparison } from "@/components/kyc/FaceComparison";
import { VerificationLevelSelector, VerificationLevel } from "@/components/kyc/VerificationLevelSelector";
import { SmileIdPaymentFlow } from "@/components/kyc/SmileIdPaymentFlow";
import { VERIFICATION_PRICES, FREE_VERIFICATION_LEVELS, VERIFICATION_SCORE_BONUS, VerificationType } from "@/lib/verification-pricing";
import { useAuth } from "@/hooks/useAuth";

type ProductType = 'w-kyc' | 'w-score' | 'wouaka-core';
type KycLevel = 'basic' | 'enhanced' | 'advanced';
type IdentityVerificationStep = 'select' | 'liveness' | 'face_comparison' | 'payment' | 'completed';

interface NewEvaluationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProduct?: ProductType;
}

interface UploadedDocument {
  type: DocumentType;
  file: File;
  preview: string;
  ocrData?: {
    text: string;
    confidence: number;
    extractedFields?: Record<string, string>;
  };
  uploadedUrl?: string;
  status: 'pending' | 'processing' | 'verified' | 'error';
  error?: string;
}

export interface EvaluationData {
  product: ProductType;
  kycLevel: KycLevel;
  externalReference: string;
  fullName: string;
  phoneNumber: string;
  nationalId?: string;
  dateOfBirth?: string;
  companyName?: string;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  existingLoans?: number;
  city?: string;
  country?: string;
  employmentType?: string;
  // Mobile Money data
  momoTotalIn?: number;
  momoTotalOut?: number;
  momoTransactionCount?: number;
  momoPeriodDays?: number;
  // Utility data
  utilityPaymentsOnTime?: number;
  utilityPaymentsLate?: number;
  // Social data
  tontineParticipation?: boolean;
  tontineDisciplineRate?: number;
  cooperativeMember?: boolean;
  guarantorCount?: number;
  // Telecom
  simAgeMonths?: number;
  // Business
  rccmNumber?: string;
  yearsInBusiness?: number;
  sector?: string;
  // Documents
  documents?: UploadedDocument[];
  // Phone verification
  phoneVerificationToken?: string;
  phoneVerified?: boolean;
  // Identity verification
  identityVerificationLevel?: VerificationLevel;
  identityVerificationCompleted?: boolean;
  livenessScore?: number;
  faceMatchScore?: number;
  smileIdVerificationId?: string;
}

const products = [
  {
    id: 'w-kyc' as ProductType,
    name: 'Vérification Identité',
    description: 'Vérification d\'identité uniquement',
    icon: FileCheck,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    features: ['Vérification identité', 'Détection de fraude', 'Validation documents'],
  },
  {
    id: 'w-score' as ProductType,
    name: 'Scoring Crédit',
    description: 'Scoring crédit uniquement',
    icon: BarChart3,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    features: ['Score de crédit', 'Analyse financière', 'Recommandation prêt'],
  },
  {
    id: 'wouaka-core' as ProductType,
    name: 'Dossier Complet',
    description: 'Solution complète KYC + Score',
    icon: Layers,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    badge: 'Recommandé',
    features: ['KYC complet', 'Scoring avancé', 'Analyse comportementale'],
  },
];

const STEPS = {
  'w-kyc': ['Produit', 'Identité', 'Documents', 'Vérification', 'Récapitulatif'],
  'w-score': ['Produit', 'Identité', 'Données financières', 'Récapitulatif'],
  'wouaka-core': ['Produit', 'Identité', 'Documents', 'Vérification', 'Données financières', 'Récapitulatif'],
};

export const NewEvaluationWizard = ({ 
  open, 
  onOpenChange,
  defaultProduct
}: NewEvaluationWizardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const evaluateClient = useEvaluateClient();
  const [step, setStep] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(defaultProduct || null);
  const [kycLevel, setKycLevel] = useState<KycLevel>('basic');
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [formData, setFormData] = useState<Partial<EvaluationData>>({
    country: 'CI',
  });
  
  // Identity verification states
  const [verificationLevel, setVerificationLevel] = useState<VerificationLevel>('basic');
  const [verificationStep, setVerificationStep] = useState<IdentityVerificationStep>('select');
  const [livenessResult, setLivenessResult] = useState<{ passed: boolean; score: number } | null>(null);
  const [faceMatchResult, setFaceMatchResult] = useState<{ match: boolean; score: number } | null>(null);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);

  const currentSteps = selectedProduct ? STEPS[selectedProduct] : ['Produit'];
  const totalSteps = currentSteps.length;

  useEffect(() => {
    if (defaultProduct && open) {
      setSelectedProduct(defaultProduct);
    }
  }, [defaultProduct, open]);

  // Auto-fill form from OCR data
  useEffect(() => {
    const identityDoc = documents.find(d => 
      (d.type === 'identity_card_front' || d.type === 'passport') && 
      d.ocrData?.extractedFields
    );
    
    if (identityDoc?.ocrData?.extractedFields) {
      const fields = identityDoc.ocrData.extractedFields;
      setFormData(prev => ({
        ...prev,
        fullName: fields.full_name || prev.fullName,
        nationalId: fields.national_id || prev.nationalId,
        dateOfBirth: fields.date_of_birth || prev.dateOfBirth,
      }));
    }
  }, [documents]);

  const handleProductSelect = (productId: ProductType) => {
    setSelectedProduct(productId);
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const canProceed = useMemo(() => {
    const currentStepName = currentSteps[step];
    
    switch (currentStepName) {
      case 'Produit':
        return !!selectedProduct;
      case 'Identité':
        return !!formData.fullName && !!formData.phoneNumber && !!formData.externalReference;
      case 'Documents':
        if (selectedProduct === 'w-score') return true;
        const requiredDocs = kycLevel === 'basic' ? 1 : kycLevel === 'enhanced' ? 3 : 4;
        const verifiedDocs = documents.filter(d => d.status === 'verified').length;
        return verifiedDocs >= requiredDocs;
      case 'Vérification':
        // Can proceed if verification is completed or if basic level is selected
        return verificationStep === 'completed' || verificationLevel === 'basic';
      case 'Données financières':
        return true; // Optional but recommended
      case 'Récapitulatif':
        return true;
      default:
        return true;
    }
  }, [step, currentSteps, selectedProduct, formData, documents, kycLevel, verificationStep, verificationLevel]);

  const handleSubmit = async () => {
    if (!selectedProduct || !formData.fullName || !formData.phoneNumber || !formData.externalReference) {
      return;
    }

    const result = await evaluateClient.mutateAsync({
      product: selectedProduct,
      kycLevel,
      externalReference: formData.externalReference,
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      nationalId: formData.nationalId,
      dateOfBirth: formData.dateOfBirth,
      companyName: formData.companyName,
      monthlyIncome: formData.monthlyIncome,
      monthlyExpenses: formData.monthlyExpenses,
      existingLoans: formData.existingLoans,
      city: formData.city,
      country: formData.country,
      employmentType: formData.employmentType,
      momoTotalIn: formData.momoTotalIn,
      momoTotalOut: formData.momoTotalOut,
      momoTransactionCount: formData.momoTransactionCount,
      momoPeriodDays: formData.momoPeriodDays,
      utilityPaymentsOnTime: formData.utilityPaymentsOnTime,
      utilityPaymentsLate: formData.utilityPaymentsLate,
      tontineParticipation: formData.tontineParticipation,
      tontineDisciplineRate: formData.tontineDisciplineRate,
      cooperativeMember: formData.cooperativeMember,
      guarantorCount: formData.guarantorCount,
      simAgeMonths: formData.simAgeMonths,
      rccmNumber: formData.rccmNumber,
      yearsInBusiness: formData.yearsInBusiness,
      sector: formData.sector,
      documents,
    });

    // Reset form
    setStep(0);
    setSelectedProduct(defaultProduct || null);
    setKycLevel('basic');
    setDocuments([]);
    setFormData({ country: 'CI' });
    onOpenChange(false);

    // Navigate to client detail page
    if (result.clientProfileId) {
      navigate(`/dashboard/partner/clients/${result.clientProfileId}`);
    }
  };

  const handleClose = () => {
    setStep(0);
    setSelectedProduct(defaultProduct || null);
    setKycLevel('basic');
    setDocuments([]);
    setPhoneVerified(false);
    setFormData({ country: 'CI' });
    onOpenChange(false);
  };

  const handlePhoneVerified = (token: string, phone: string) => {
    setPhoneVerified(true);
    setFormData(prev => ({ 
      ...prev, 
      phoneNumber: phone,
      phoneVerificationToken: token,
      phoneVerified: true 
    }));
  };

  const renderStepContent = () => {
    const currentStepName = currentSteps[step];

    switch (currentStepName) {
      case 'Produit':
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              {products.map((product) => {
                const Icon = product.icon;
                const isSelected = selectedProduct === product.id;
                
                return (
                  <Card
                    key={product.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md border-2",
                      isSelected 
                        ? `${product.borderColor} ${product.bgColor}` 
                        : "border-border hover:border-muted-foreground/30"
                    )}
                    onClick={() => handleProductSelect(product.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                          product.bgColor
                        )}>
                          <Icon className={cn("w-6 h-6", product.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{product.name}</h3>
                            {product.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {product.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {product.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {product.features.map((feature, i) => (
                              <span 
                                key={i}
                                className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                          isSelected 
                            ? "border-primary bg-primary" 
                            : "border-muted-foreground/30"
                        )}>
                          {isSelected && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* KYC Level selector for KYC products */}
            {(selectedProduct === 'w-kyc' || selectedProduct === 'wouaka-core') && (
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium">Niveau de vérification KYC</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {(['basic', 'enhanced', 'advanced'] as KycLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setKycLevel(level)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center transition-all",
                        kycLevel === level
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <p className="font-medium capitalize">{level}</p>
                      <p className="text-xs text-muted-foreground">
                        {level === 'basic' ? 'CNI seule' : 
                         level === 'enhanced' ? 'CNI + Selfie' : 
                         'Complet + Adresse'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'Identité':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Identification
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="externalReference">Référence interne *</Label>
                  <Input
                    id="externalReference"
                    placeholder="Ex: CLI-2024-001"
                    value={formData.externalReference || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, externalReference: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Votre identifiant interne pour ce client
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet *</Label>
                  <Input
                    id="fullName"
                    placeholder="Ex: Amadou Diallo"
                    value={formData.fullName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Phone verification with OTP */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Vérification téléphone (optionnel)
                </h4>
                <PhoneVerificationOTP
                  phoneNumber={formData.phoneNumber || ''}
                  onPhoneChange={(phone) => setFormData(prev => ({ ...prev, phoneNumber: phone }))}
                  onVerified={handlePhoneVerified}
                  partnerId={user?.id}
                  purpose="kyc"
                />
                {!phoneVerified && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-700 dark:text-amber-400">
                      La vérification SMS renforce la confiance du score mais n'est pas obligatoire.
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationalId" className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    Numéro CNI
                  </Label>
                  <Input
                    id="nationalId"
                    placeholder="Ex: CI123456789"
                    value={formData.nationalId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, nationalId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date de naissance</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="simAgeMonths" className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />
                    Âge SIM (mois)
                  </Label>
                  <Input
                    id="simAgeMonths"
                    type="number"
                    placeholder="Ex: 24"
                    value={formData.simAgeMonths || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, simAgeMonths: parseInt(e.target.value) || undefined }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    placeholder="Ex: Abidjan"
                    value={formData.city || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Localisation
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CI">Côte d'Ivoire</SelectItem>
                      <SelectItem value="SN">Sénégal</SelectItem>
                      <SelectItem value="ML">Mali</SelectItem>
                      <SelectItem value="BF">Burkina Faso</SelectItem>
                      <SelectItem value="TG">Togo</SelectItem>
                      <SelectItem value="BJ">Bénin</SelectItem>
                      <SelectItem value="NE">Niger</SelectItem>
                      <SelectItem value="GN">Guinée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    placeholder="Ex: Abidjan"
                    value={formData.city || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'Documents':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-1">Documents d'identité</h4>
              <p className="text-sm text-muted-foreground">
                Téléversez les documents requis pour la vérification KYC.
                Les données seront automatiquement extraites par OCR.
              </p>
            </div>
            
            <EvaluationDocumentUpload
              productType={selectedProduct!}
              kycLevel={kycLevel}
              documents={documents}
              onDocumentsChange={setDocuments}
            />
          </div>
        );

      case 'Vérification':
        // Show Smile ID payment flow
        if (showPaymentFlow && verificationLevel && verificationLevel.startsWith('smile_id_')) {
          return (
            <SmileIdPaymentFlow
              verificationType={verificationLevel as VerificationType}
              identityData={{
                fullName: formData.fullName || '',
                nationalId: formData.nationalId || '',
                phoneNumber: formData.phoneNumber || '',
                dateOfBirth: formData.dateOfBirth,
                country: formData.country,
              }}
              onPaymentComplete={(verificationId) => {
                setFormData(prev => ({
                  ...prev,
                  smileIdVerificationId: verificationId,
                  identityVerificationLevel: verificationLevel,
                  identityVerificationCompleted: true,
                }));
                setVerificationStep('completed');
                setShowPaymentFlow(false);
              }}
              onCancel={() => {
                setShowPaymentFlow(false);
                setVerificationStep('select');
              }}
            />
          );
        }

        // Show face comparison if enhanced level
        if (verificationStep === 'face_comparison' && verificationLevel === 'enhanced') {
          const idDocFront = documents.find(d => d.type === 'identity_card_front');
          return (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" />
                  Comparaison faciale
                </h4>
                <p className="text-sm text-muted-foreground">
                  Prenez une photo de votre visage pour la comparer avec le document d'identité.
                </p>
              </div>
              <FaceComparison
                documentImageUrl={idDocFront?.preview || ''}
                onComplete={(result) => {
                  setFaceMatchResult({ match: result.matched, score: result.similarity });
                  setFormData(prev => ({
                    ...prev,
                    faceMatchScore: result.similarity,
                    identityVerificationLevel: 'enhanced',
                    identityVerificationCompleted: true,
                  }));
                  setVerificationStep('completed');
                }}
                onSkip={() => {
                  setVerificationStep('completed');
                }}
              />
            </div>
          );
        }

        // Show liveness check if enhanced level
        if (verificationStep === 'liveness' && verificationLevel === 'enhanced') {
          return (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" />
                  Détection de présence
                </h4>
                <p className="text-sm text-muted-foreground">
                  Suivez les instructions pour prouver que vous êtes bien présent.
                </p>
              </div>
              <LivenessCheck
                onComplete={(result) => {
                  setLivenessResult({ passed: result.passed, score: result.score });
                  setFormData(prev => ({
                    ...prev,
                    livenessScore: result.score,
                  }));
                  // Continue to face comparison
                  setVerificationStep('face_comparison');
                }}
                onSkip={() => {
                  // Skip to face comparison
                  setVerificationStep('face_comparison');
                }}
              />
            </div>
          );
        }

        // Show verification level selector or completion
        if (verificationStep === 'completed') {
          const isPremium = verificationLevel?.startsWith('smile_id_');
          return (
            <div className="space-y-6">
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">Vérification configurée</h4>
                    <p className="text-sm text-green-700">
                      Niveau: <span className="font-medium">
                        {verificationLevel === 'basic' ? 'Basique (SMS + OCR)' :
                         verificationLevel === 'enhanced' ? 'Renforcé (Liveness + Face Match)' :
                         VERIFICATION_PRICES[verificationLevel as VerificationType]?.label || verificationLevel}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {(livenessResult || faceMatchResult) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Fingerprint className="w-4 h-4" />
                      Résultats de vérification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {livenessResult && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Liveness Check</span>
                        <Badge variant={livenessResult.passed ? "default" : "secondary"}>
                          {livenessResult.score}% - {livenessResult.passed ? 'Réussi' : 'Échoué'}
                        </Badge>
                      </div>
                    )}
                    {faceMatchResult && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Face Match</span>
                        <Badge variant={faceMatchResult.match ? "default" : "secondary"}>
                          {faceMatchResult.score}% - {faceMatchResult.match ? 'Correspondance' : 'Non correspondant'}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {isPremium && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm">
                  <Star className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-400">
                    Vérification Smile ID payante incluse - Bonus score: +{VERIFICATION_PRICES[verificationLevel as VerificationType]?.scoreBonus || 10} points
                  </span>
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={() => {
                  setVerificationStep('select');
                  setLivenessResult(null);
                  setFaceMatchResult(null);
                }}
              >
                Modifier le niveau
              </Button>
            </div>
          );
        }

        // Default: show level selector
        return (
          <VerificationLevelSelector
            selectedLevel={verificationLevel}
            onSelectLevel={(level) => {
              setVerificationLevel(level);
            }}
            onContinue={() => {
              if (verificationLevel === 'basic') {
                // Basic level - just mark as complete
                setFormData(prev => ({
                  ...prev,
                  identityVerificationLevel: 'basic',
                  identityVerificationCompleted: true,
                }));
                setVerificationStep('completed');
              } else if (verificationLevel === 'enhanced') {
                // Enhanced level - start liveness check
                setVerificationStep('liveness');
              } else if (verificationLevel.startsWith('smile_id_')) {
                // Premium Smile ID - show payment flow
                setShowPaymentFlow(true);
              }
            }}
          />
        );

      case 'Données financières':
        return (
          <div className="space-y-6">
            {/* Income & Employment */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Revenus et emploi
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Type d'emploi</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, employmentType: value }))}
                  >
                    <SelectTrigger id="employmentType">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salaried">Salarié</SelectItem>
                      <SelectItem value="self-employed">Travailleur indépendant</SelectItem>
                      <SelectItem value="business-owner">Chef d'entreprise</SelectItem>
                      <SelectItem value="informal">Secteur informel</SelectItem>
                      <SelectItem value="student">Étudiant</SelectItem>
                      <SelectItem value="retired">Retraité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Employeur / Entreprise
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Ex: PME Abidjan Import"
                    value={formData.companyName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyIncome">Revenu mensuel (FCFA)</Label>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    placeholder="Ex: 500000"
                    value={formData.monthlyIncome || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyIncome: parseInt(e.target.value) || undefined }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyExpenses">Dépenses mensuelles (FCFA)</Label>
                  <Input
                    id="monthlyExpenses"
                    type="number"
                    placeholder="Ex: 300000"
                    value={formData.monthlyExpenses || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyExpenses: parseInt(e.target.value) || undefined }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="existingLoans">Crédits en cours (FCFA)</Label>
                  <Input
                    id="existingLoans"
                    type="number"
                    placeholder="Ex: 100000"
                    value={formData.existingLoans || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, existingLoans: parseInt(e.target.value) || undefined }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rccmNumber">N° RCCM (si entreprise)</Label>
                  <Input
                    id="rccmNumber"
                    placeholder="Ex: RCCM-CI-XXX"
                    value={formData.rccmNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, rccmNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsInBusiness">Années d'activité</Label>
                  <Input
                    id="yearsInBusiness"
                    type="number"
                    placeholder="Ex: 5"
                    value={formData.yearsInBusiness || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearsInBusiness: parseInt(e.target.value) || undefined }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sector">Secteur d'activité</Label>
                  <Select
                    value={formData.sector}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, sector: value }))}
                  >
                    <SelectTrigger id="sector">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commerce">Commerce</SelectItem>
                      <SelectItem value="agriculture">Agriculture</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="artisanat">Artisanat</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Mobile Money */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Données Mobile Money (30 derniers jours)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="momoTotalIn">Total entrées (FCFA)</Label>
                  <Input
                    id="momoTotalIn"
                    type="number"
                    placeholder="Ex: 1500000"
                    value={formData.momoTotalIn || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, momoTotalIn: parseInt(e.target.value) || undefined }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="momoTotalOut">Total sorties (FCFA)</Label>
                  <Input
                    id="momoTotalOut"
                    type="number"
                    placeholder="Ex: 1200000"
                    value={formData.momoTotalOut || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, momoTotalOut: parseInt(e.target.value) || undefined }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="momoTransactionCount">Nombre de transactions</Label>
                  <Input
                    id="momoTransactionCount"
                    type="number"
                    placeholder="Ex: 45"
                    value={formData.momoTransactionCount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, momoTransactionCount: parseInt(e.target.value) || undefined }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="momoPeriodDays">Période (jours)</Label>
                  <Input
                    id="momoPeriodDays"
                    type="number"
                    placeholder="30"
                    value={formData.momoPeriodDays || 30}
                    onChange={(e) => setFormData(prev => ({ ...prev, momoPeriodDays: parseInt(e.target.value) || 30 }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Utility Payments */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Historique de paiement des factures
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="utilityPaymentsOnTime">Factures payées à temps</Label>
                  <Input
                    id="utilityPaymentsOnTime"
                    type="number"
                    placeholder="Ex: 10"
                    value={formData.utilityPaymentsOnTime || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, utilityPaymentsOnTime: parseInt(e.target.value) || undefined }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utilityPaymentsLate">Factures payées en retard</Label>
                  <Input
                    id="utilityPaymentsLate"
                    type="number"
                    placeholder="Ex: 2"
                    value={formData.utilityPaymentsLate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, utilityPaymentsLate: parseInt(e.target.value) || undefined }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Social Capital */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Capital social
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tontineParticipation"
                    checked={formData.tontineParticipation || false}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, tontineParticipation: checked === true }))
                    }
                  />
                  <Label htmlFor="tontineParticipation">Participe à une tontine</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cooperativeMember"
                    checked={formData.cooperativeMember || false}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, cooperativeMember: checked === true }))
                    }
                  />
                  <Label htmlFor="cooperativeMember">Membre d'une coopérative</Label>
                </div>
              </div>
              {formData.tontineParticipation && (
                <div className="space-y-2">
                  <Label htmlFor="tontineDisciplineRate">Taux de discipline tontine (%)</Label>
                  <Input
                    id="tontineDisciplineRate"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Ex: 95"
                    value={formData.tontineDisciplineRate ? formData.tontineDisciplineRate * 100 : ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      tontineDisciplineRate: (parseInt(e.target.value) || 0) / 100 
                    }))}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="guarantorCount">Nombre de garants disponibles</Label>
                <Input
                  id="guarantorCount"
                  type="number"
                  placeholder="Ex: 2"
                  value={formData.guarantorCount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, guarantorCount: parseInt(e.target.value) || undefined }))}
                />
              </div>
            </div>
          </div>
        );

      case 'Récapitulatif':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Prêt pour l'évaluation</p>
                  <p className="text-sm text-green-700">
                    Vérifiez les informations ci-dessous avant de lancer l'évaluation.
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Produit</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={cn(
                    selectedProduct === 'w-kyc' ? 'bg-blue-100 text-blue-800' :
                    selectedProduct === 'w-score' ? 'bg-orange-100 text-orange-800' :
                    'bg-emerald-100 text-emerald-800'
                  )}>
                    {products.find(p => p.id === selectedProduct)?.name}
                  </Badge>
                  {(selectedProduct === 'w-kyc' || selectedProduct === 'wouaka-core') && (
                    <p className="text-xs text-muted-foreground mt-1">Niveau: {kycLevel}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{formData.fullName}</p>
                  <p className="text-sm text-muted-foreground">{formData.phoneNumber}</p>
                  <p className="text-xs text-muted-foreground">Réf: {formData.externalReference}</p>
                </CardContent>
              </Card>
            </div>

            {/* Documents summary */}
            {documents.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    Documents ({documents.filter(d => d.status === 'verified').length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {documents.map((doc) => (
                      <Badge 
                        key={doc.type} 
                        variant={doc.status === 'verified' ? 'default' : 'secondary'}
                      >
                        {doc.type.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial data summary */}
            {(formData.monthlyIncome || formData.momoTotalIn) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Banknote className="w-4 h-4" />
                    Données financières
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {formData.monthlyIncome && (
                      <div>
                        <p className="text-muted-foreground">Revenu mensuel</p>
                        <p className="font-medium">{formData.monthlyIncome.toLocaleString()} FCFA</p>
                      </div>
                    )}
                    {formData.momoTotalIn && (
                      <div>
                        <p className="text-muted-foreground">MoMo entrées</p>
                        <p className="font-medium">{formData.momoTotalIn.toLocaleString()} FCFA</p>
                      </div>
                    )}
                    {formData.employmentType && (
                      <div>
                        <p className="text-muted-foreground">Emploi</p>
                        <p className="font-medium capitalize">{formData.employmentType}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data quality warning */}
            {selectedProduct !== 'w-kyc' && !formData.monthlyIncome && !formData.momoTotalIn && (
              <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Données financières manquantes</p>
                  <p className="text-sm">
                    Sans données financières, le score sera basé sur des estimations 
                    et aura une confiance réduite.
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {currentSteps[step]}
          </DialogTitle>
          <DialogDescription>
            Étape {step + 1} sur {totalSteps}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 my-4">
          {currentSteps.map((_, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                index <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {index < step ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              {index < currentSteps.length - 1 && (
                <div className={cn(
                  "flex-1 h-1 mx-2 rounded-full transition-colors",
                  index < step ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="py-4"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0 || evaluateClient.isPending}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>
          
          {step < totalSteps - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed}>
              Continuer
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={evaluateClient.isPending || !canProceed}
            >
              {evaluateClient.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Évaluation en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Lancer l'évaluation
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
