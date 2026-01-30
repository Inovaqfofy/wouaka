import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SovereignConsentFlow } from './SovereignConsentFlow';
import {
  Loader2,
  User,
  Building2,
  Wallet,
  Link as LinkIcon,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Check,
  Smartphone,
  Signal,
  Lightbulb,
  CheckCircle2,
  Sparkles,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { ScoringInputData, EMPLOYMENT_TYPES, SECTORS, WEST_AFRICAN_CITIES } from '@/lib/scoring-types';
import type { DataConsent } from '@/lib/enrichment-types';
import { useDataEnrichment } from '@/hooks/useDataEnrichment';

const identitySchema = z.object({
  full_name: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  phone_number: z.string().min(8, 'Numéro de téléphone requis'),
});

interface ScoringWizardProps {
  onSubmit: (data: ScoringInputData, enrichmentData?: any) => void;
  loading: boolean;
}

type WizardStep = 'identity' | 'consent' | 'declarative' | 'summary';

const STEPS: { key: WizardStep; label: string; icon: React.ElementType }[] = [
  { key: 'identity', label: 'Identité', icon: User },
  { key: 'consent', label: 'Consentement', icon: Shield },
  { key: 'declarative', label: 'Déclaratif', icon: Wallet },
  { key: 'summary', label: 'Calcul', icon: Sparkles },
];

export function ScoringWizard({ onSubmit, loading }: ScoringWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('identity');
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState<DataConsent | null>(null);
  
  const { enrichData, loading: enrichLoading, result: enrichmentResult } = useDataEnrichment();

  // Form state
  const [formData, setFormData] = useState<Partial<ScoringInputData>>({
    full_name: '',
    national_id: '',
    phone_number: '',
    company_name: '',
    rccm_number: '',
    employment_type: 'employed',
    years_in_business: 2,
    sector: 'commerce',
    monthly_income: 500000,
    monthly_expenses: 350000,
    existing_loans: 0,
    mobile_money_volume: 200000,
    sim_age_months: 24,
    mobile_money_transactions: 30,
    utility_payments_on_time: 10,
    utility_payments_late: 2,
    region: '',
    city: 'abidjan',
  });

  const updateField = (field: keyof ScoringInputData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const validateIdentity = () => {
    try {
      identitySchema.parse({
        full_name: formData.full_name,
        phone_number: formData.phone_number,
      });
      setError(null);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleNextStep = () => {
    setError(null);
    
    if (currentStep === 'identity') {
      if (validateIdentity()) {
        setCurrentStep('consent');
      }
    } else if (currentStep === 'consent') {
      setCurrentStep('declarative');
    } else if (currentStep === 'declarative') {
      setCurrentStep('summary');
    }
  };

  const handlePreviousStep = () => {
    setError(null);
    const stepIndex = STEPS.findIndex(s => s.key === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].key);
    }
  };

  const handleConsentComplete = async (consentData: DataConsent) => {
    setConsent(consentData);
    
    // Trigger enrichment with sovereign data sources
    await enrichData(
      formData.phone_number || '',
      consentData,
      formData.rccm_number,
      formData.national_id
    );
    
    setCurrentStep('declarative');
  };

  const handleSkipConsent = () => {
    setConsent(null);
    setCurrentStep('declarative');
  };

  const handleSubmit = () => {
    onSubmit(formData as ScoringInputData, enrichmentResult);
  };

  // Get connected sources info
  const connectedSources = enrichmentResult?.sources?.filter(
    s => s.verification_status !== 'failed'
  ) || [];

  const hasConnectedSources = connectedSources.length > 0;

  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-xl">Analyse de Profil</CardTitle>
          <Badge variant="outline" className="font-mono">
            Étape {currentStepIndex + 1}/{STEPS.length}
          </Badge>
        </div>
        <CardDescription>
          Complétez les informations pour obtenir votre analyse personnalisée
        </CardDescription>
        
        {/* Progress bar */}
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.key === currentStep;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div 
                  key={step.key}
                  className={`flex items-center gap-1 text-xs ${
                    isActive ? 'text-primary font-semibold' : 
                    isCompleted ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Identity */}
          {currentStep === 'identity' && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nom complet *</Label>
                  <Input
                    id="full_name"
                    placeholder="Jean Kouassi"
                    value={formData.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Téléphone *</Label>
                  <Input
                    id="phone_number"
                    placeholder="+225 07 00 00 00 00"
                    value={formData.phone_number}
                    onChange={(e) => updateField('phone_number', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="national_id">Numéro CNI</Label>
                  <Input
                    id="national_id"
                    placeholder="CI-12345678"
                    value={formData.national_id}
                    onChange={(e) => updateField('national_id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => updateField('city', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEST_AFRICAN_CITIES.map((city) => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label} ({city.country})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Business info in identity step */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Informations professionnelles
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="employment_type">Type d'activité</Label>
                    <Select
                      value={formData.employment_type}
                      onValueChange={(value) => updateField('employment_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rccm_number">Numéro RCCM (optionnel)</Label>
                    <Input
                      id="rccm_number"
                      placeholder="CI-ABJ-2020-B-12345"
                      value={formData.rccm_number}
                      onChange={(e) => updateField('rccm_number', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Sovereign Consent */}
          {currentStep === 'consent' && (
            <motion.div
              key="consent"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SovereignConsentFlow
                phoneNumber={formData.phone_number || ''}
                onConsentComplete={handleConsentComplete}
                onSkip={handleSkipConsent}
                loading={enrichLoading}
              />
            </motion.div>
          )}

          {/* Step 3: Declarative Data */}
          {currentStep === 'declarative' && (
            <motion.div
              key="declarative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Show connected sources */}
              {hasConnectedSources && (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>{connectedSources.length} source(s)</strong> connectée(s).
                    Les données seront enrichies automatiquement.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sector">Secteur d'activité</Label>
                  <Select
                    value={formData.sector}
                    onValueChange={(value) => updateField('sector', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((sector) => (
                        <SelectItem key={sector.value} value={sector.value}>
                          {sector.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Années d'expérience: {formData.years_in_business} ans</Label>
                  <Slider
                    value={[formData.years_in_business || 0]}
                    onValueChange={(value) => updateField('years_in_business', value[0])}
                    max={30}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Financial */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Données financières
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Revenu mensuel: {formatCurrency(formData.monthly_income || 0)}</Label>
                    <Slider
                      value={[formData.monthly_income || 0]}
                      onValueChange={(value) => updateField('monthly_income', value[0])}
                      min={50000}
                      max={5000000}
                      step={50000}
                      className="mt-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dépenses mensuelles: {formatCurrency(formData.monthly_expenses || 0)}</Label>
                    <Slider
                      value={[formData.monthly_expenses || 0]}
                      onValueChange={(value) => updateField('monthly_expenses', value[0])}
                      min={0}
                      max={5000000}
                      step={50000}
                      className="mt-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Crédits en cours: {formatCurrency(formData.existing_loans || 0)}</Label>
                    <Slider
                      value={[formData.existing_loans || 0]}
                      onValueChange={(value) => updateField('existing_loans', value[0])}
                      min={0}
                      max={10000000}
                      step={100000}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Only show Mobile/Behavioral if not connected */}
              {!connectedSources.some(s => s.source_type === 'mobile_money') && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Données Mobile Money
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Volume mensuel: {formatCurrency(formData.mobile_money_volume || 0)}</Label>
                      <Slider
                        value={[formData.mobile_money_volume || 0]}
                        onValueChange={(value) => updateField('mobile_money_volume', value[0])}
                        min={0}
                        max={2000000}
                        step={10000}
                        className="mt-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Transactions par mois: {formData.mobile_money_transactions}</Label>
                      <Slider
                        value={[formData.mobile_money_transactions || 0]}
                        onValueChange={(value) => updateField('mobile_money_transactions', value[0])}
                        max={200}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!connectedSources.some(s => s.source_type === 'telecom') && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Signal className="w-4 h-4" />
                    Données télécom
                  </h4>
                  <div className="space-y-2">
                    <Label>Ancienneté SIM: {formData.sim_age_months} mois</Label>
                    <Slider
                      value={[formData.sim_age_months || 0]}
                      onValueChange={(value) => updateField('sim_age_months', value[0])}
                      max={120}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}

              {!connectedSources.some(s => s.source_type === 'utility') && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Paiements factures
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Paiements à temps: {formData.utility_payments_on_time}</Label>
                      <Slider
                        value={[formData.utility_payments_on_time || 0]}
                        onValueChange={(value) => updateField('utility_payments_on_time', value[0])}
                        max={36}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Paiements en retard: {formData.utility_payments_late}</Label>
                      <Slider
                        value={[formData.utility_payments_late || 0]}
                        onValueChange={(value) => updateField('utility_payments_late', value[0])}
                        max={36}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Summary */}
          {currentStep === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center py-4">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Prêt pour l'analyse</h3>
                <p className="text-muted-foreground mt-2">
                  Vérifiez les informations avant de lancer le calcul
                </p>
              </div>

              {/* Summary cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Identity */}
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medium">Identité</span>
                  </div>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>{formData.full_name}</p>
                    <p>{formData.phone_number}</p>
                    <p>{WEST_AFRICAN_CITIES.find(c => c.value === formData.city)?.label}</p>
                  </div>
                </div>

                {/* Data Sources */}
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="w-4 h-4 text-primary" />
                    <span className="font-medium">Sources de données</span>
                  </div>
                  {hasConnectedSources ? (
                    <div className="space-y-1">
                      {connectedSources.map((source, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="w-3 h-3 text-green-600" />
                          <span>Source {idx + 1} connectée</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Données déclaratives uniquement
                    </p>
                  )}
                </div>

                {/* Financial */}
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="font-medium">Finances</span>
                  </div>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>Revenu: {formatCurrency(formData.monthly_income || 0)}</p>
                    <p>Dépenses: {formatCurrency(formData.monthly_expenses || 0)}</p>
                    <p>Crédits: {formatCurrency(formData.existing_loans || 0)}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-medium">Statut</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      {hasConnectedSources 
                        ? 'Analyse enrichie avec données vérifiées'
                        : 'Analyse basée sur données déclaratives'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {currentStep !== 'consent' && (
          <div className="mt-6 pt-6 border-t flex gap-3">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            )}
            
            <div className="flex-1" />
            
            {currentStep === 'summary' ? (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                size="lg"
                className="min-w-[200px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Lancer l'Analyse
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNextStep} disabled={loading}>
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
