import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  User,
  Building2,
  Wallet,
  Smartphone,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { ScoringInputData, EMPLOYMENT_TYPES, SECTORS, WEST_AFRICAN_CITIES } from '@/lib/scoring-types';

const scoringSchema = z.object({
  full_name: z.string().min(2, 'Nom requis'),
  monthly_income: z.number().min(0, 'Revenu invalide'),
  monthly_expenses: z.number().min(0, 'Dépenses invalides'),
  employment_type: z.enum(['employed', 'self_employed', 'business_owner', 'freelancer']),
});

interface ScoringFormProps {
  onSubmit: (data: ScoringInputData) => void;
  loading: boolean;
}

export function ScoringForm({ onSubmit, loading }: ScoringFormProps) {
  const [activeTab, setActiveTab] = useState('personal');
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = () => {
    setError(null);

    try {
      scoringSchema.parse({
        full_name: formData.full_name,
        monthly_income: formData.monthly_income,
        monthly_expenses: formData.monthly_expenses,
        employment_type: formData.employment_type,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    onSubmit(formData as ScoringInputData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  return (
    <Card className="card-premium">
      <CardHeader>
        <CardTitle>Calculer un Score de Crédit</CardTitle>
        <CardDescription>
          Remplissez les informations pour générer une analyse de crédit complète
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="personal" className="text-xs sm:text-sm">
              <User className="w-4 h-4 mr-1 hidden sm:inline" />
              Identité
            </TabsTrigger>
            <TabsTrigger value="business" className="text-xs sm:text-sm">
              <Building2 className="w-4 h-4 mr-1 hidden sm:inline" />
              Activité
            </TabsTrigger>
            <TabsTrigger value="financial" className="text-xs sm:text-sm">
              <Wallet className="w-4 h-4 mr-1 hidden sm:inline" />
              Finances
            </TabsTrigger>
            <TabsTrigger value="behavioral" className="text-xs sm:text-sm">
              <Smartphone className="w-4 h-4 mr-1 hidden sm:inline" />
              Mobile
            </TabsTrigger>
          </TabsList>

          {/* Personal Tab */}
          <TabsContent value="personal" className="space-y-4">
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
                <Label htmlFor="national_id">Numéro CNI</Label>
                <Input
                  id="national_id"
                  placeholder="CI-12345678"
                  value={formData.national_id}
                  onChange={(e) => updateField('national_id', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Téléphone</Label>
                <Input
                  id="phone_number"
                  placeholder="+225 07 00 00 00 00"
                  value={formData.phone_number}
                  onChange={(e) => updateField('phone_number', e.target.value)}
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
          </TabsContent>

          {/* Business Tab */}
          <TabsContent value="business" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employment_type">Type d'emploi *</Label>
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
                <Label htmlFor="company_name">Nom de l'entreprise</Label>
                <Input
                  id="company_name"
                  placeholder="Ma Société SARL"
                  value={formData.company_name}
                  onChange={(e) => updateField('company_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rccm_number">Numéro RCCM</Label>
                <Input
                  id="rccm_number"
                  placeholder="CI-ABJ-2020-B-12345"
                  value={formData.rccm_number}
                  onChange={(e) => updateField('rccm_number', e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
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
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4">
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
              <div className="space-y-2">
                <Label>Volume Mobile Money mensuel: {formatCurrency(formData.mobile_money_volume || 0)}</Label>
                <Slider
                  value={[formData.mobile_money_volume || 0]}
                  onValueChange={(value) => updateField('mobile_money_volume', value[0])}
                  min={0}
                  max={2000000}
                  step={10000}
                  className="mt-2"
                />
              </div>
            </div>
          </TabsContent>

          {/* Behavioral Tab */}
          <TabsContent value="behavioral" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="space-y-2">
                <Label>Transactions Mobile Money/mois: {formData.mobile_money_transactions}</Label>
                <Slider
                  value={[formData.mobile_money_transactions || 0]}
                  onValueChange={(value) => updateField('mobile_money_transactions', value[0])}
                  max={200}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <Label>Paiements factures à temps: {formData.utility_payments_on_time}</Label>
                <Slider
                  value={[formData.utility_payments_on_time || 0]}
                  onValueChange={(value) => updateField('utility_payments_on_time', value[0])}
                  max={36}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <Label>Paiements factures en retard: {formData.utility_payments_late}</Label>
                <Slider
                  value={[formData.utility_payments_late || 0]}
                  onValueChange={(value) => updateField('utility_payments_late', value[0])}
                  max={36}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-6 border-t">
          <Button onClick={handleSubmit} className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Analyse en cours...
              </>
            ) : (
              'Calculer le Score de Crédit'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
