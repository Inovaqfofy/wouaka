import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  Download, 
  ArrowRight,
  Clock,
  ShieldCheck,
  Smartphone,
  Target,
  BarChart3,
  Landmark,
  Store
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface UseCaseData {
  segment: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  problem: string;
  solution: string;
  result: string;
  resultValue: string;
  chartData: { month: string; value: number }[];
  chartLabel: string;
  pdfUrl: string;
}

interface CountryData {
  code: string;
  name: string;
  flag: string;
  currency: string;
  useCases: UseCaseData[];
}

const countriesData: CountryData[] = [
  {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    flag: '🇨🇮',
    currency: 'XOF',
    useCases: [
      {
        segment: 'leader',
        icon: Landmark,
        title: 'BICICI',
        subtitle: 'Leader Bancaire',
        problem: 'Lenteur du KYC et coût d\'acquisition client élevé (45 000 XOF/dossier)',
        solution: 'Automatisation du scoring via API WOUAKA pour les crédits à la consommation jusqu\'à 5M XOF',
        result: 'Temps de réponse divisé par 10',
        resultValue: '48h → 4h',
        chartData: [
          { month: 'Jan', value: 48 },
          { month: 'Fév', value: 36 },
          { month: 'Mar', value: 24 },
          { month: 'Avr', value: 12 },
          { month: 'Mai', value: 6 },
          { month: 'Juin', value: 4 },
        ],
        chartLabel: 'Temps de traitement (heures)',
        pdfUrl: '/case-studies/bicici-wouaka.pdf'
      },
      {
        segment: 'challenger',
        icon: Building2,
        title: 'COFINA CI',
        subtitle: 'Établissement Challenger',
        problem: 'Taux d\'impayés (NPL) élevé de 12% sur le secteur informel',
        solution: 'Filtrage intelligent des emprunteurs via données Orange Money et MTN MoMo intégrées au W-SCORE',
        result: 'Baisse des impayés de 25%',
        resultValue: '12% → 9%',
        chartData: [
          { month: 'Jan', value: 12 },
          { month: 'Fév', value: 11.5 },
          { month: 'Mar', value: 10.8 },
          { month: 'Avr', value: 10.2 },
          { month: 'Mai', value: 9.5 },
          { month: 'Juin', value: 9 },
        ],
        chartLabel: 'Taux de NPL (%)',
        pdfUrl: '/case-studies/cofina-ci-wouaka.pdf'
      },
      {
        segment: 'microfinance',
        icon: Store,
        title: 'UNACOOPEC',
        subtitle: 'Microfinance de Proximité',
        problem: 'Absence de données fiables sur les clients ruraux des zones de production de cacao',
        solution: 'Déploiement de l\'app WOUAKA pour certifier la solvabilité communautaire via les transactions locales',
        result: 'Inclusion de 500 nouveaux clients en 3 mois',
        resultValue: '+500 clients',
        chartData: [
          { month: 'Jan', value: 50 },
          { month: 'Fév', value: 120 },
          { month: 'Mar', value: 210 },
          { month: 'Avr', value: 340 },
          { month: 'Mai', value: 420 },
          { month: 'Juin', value: 500 },
        ],
        chartLabel: 'Nouveaux clients inclus',
        pdfUrl: '/case-studies/unacoopec-wouaka.pdf'
      }
    ]
  },
  {
    code: 'SN',
    name: 'Sénégal',
    flag: '🇸🇳',
    currency: 'XOF',
    useCases: [
      {
        segment: 'leader',
        icon: Landmark,
        title: 'CBAO Groupe Attijariwafa',
        subtitle: 'Leader Bancaire',
        problem: 'Process manuel de vérification KYC ralentissant l\'octroi des crédits PME',
        solution: 'Intégration W-KYC + W-SCORE via API pour une décision en temps réel',
        result: 'Volume de crédits PME +40%',
        resultValue: '+40% volume',
        chartData: [
          { month: 'Jan', value: 100 },
          { month: 'Fév', value: 108 },
          { month: 'Mar', value: 118 },
          { month: 'Avr', value: 128 },
          { month: 'Mai', value: 135 },
          { month: 'Juin', value: 140 },
        ],
        chartLabel: 'Volume crédits PME (base 100)',
        pdfUrl: '/case-studies/cbao-wouaka.pdf'
      },
      {
        segment: 'challenger',
        icon: Building2,
        title: 'Baobab Sénégal',
        subtitle: 'Établissement Challenger',
        problem: 'Coût de scoring manuel trop élevé pour les micro-crédits < 500 000 XOF',
        solution: 'Scoring automatisé via transactions Wave et Orange Money pour les petits montants',
        result: 'Coût par dossier réduit de 60%',
        resultValue: '-60% coût',
        chartData: [
          { month: 'Jan', value: 15000 },
          { month: 'Fév', value: 12000 },
          { month: 'Mar', value: 9500 },
          { month: 'Avr', value: 7800 },
          { month: 'Mai', value: 6500 },
          { month: 'Juin', value: 6000 },
        ],
        chartLabel: 'Coût par dossier (XOF)',
        pdfUrl: '/case-studies/baobab-sn-wouaka.pdf'
      },
      {
        segment: 'microfinance',
        icon: Store,
        title: 'PAMECAS',
        subtitle: 'Microfinance de Proximité',
        problem: 'Difficulté à évaluer les femmes entrepreneures du secteur informel',
        solution: 'Score communautaire WOUAKA intégrant les données des tontines numériques',
        result: '1 200 femmes financées en 6 mois',
        resultValue: '+1 200 femmes',
        chartData: [
          { month: 'Jan', value: 80 },
          { month: 'Fév', value: 220 },
          { month: 'Mar', value: 450 },
          { month: 'Avr', value: 720 },
          { month: 'Mai', value: 980 },
          { month: 'Juin', value: 1200 },
        ],
        chartLabel: 'Femmes entrepreneures financées',
        pdfUrl: '/case-studies/pamecas-wouaka.pdf'
      }
    ]
  },
  {
    code: 'CM',
    name: 'Cameroun',
    flag: '🇨🇲',
    currency: 'XAF',
    useCases: [
      {
        segment: 'leader',
        icon: Landmark,
        title: 'Afriland First Bank',
        subtitle: 'Leader Bancaire',
        problem: 'Délai de 2 semaines pour l\'approbation des crédits agricoles',
        solution: 'Pipeline digitalisé avec W-SCORE adapté aux cycles agricoles (cacao, café)',
        result: 'Délai réduit à 3 jours',
        resultValue: '14j → 3j',
        chartData: [
          { month: 'Jan', value: 14 },
          { month: 'Fév', value: 11 },
          { month: 'Mar', value: 8 },
          { month: 'Avr', value: 6 },
          { month: 'Mai', value: 4 },
          { month: 'Juin', value: 3 },
        ],
        chartLabel: 'Délai d\'approbation (jours)',
        pdfUrl: '/case-studies/afriland-wouaka.pdf'
      },
      {
        segment: 'challenger',
        icon: Building2,
        title: 'Express Union',
        subtitle: 'Établissement Challenger',
        problem: 'Portefeuille de microcrédits sous-performant avec 18% de défauts',
        solution: 'Recalibrage du scoring avec données MTN MoMo et indicateurs comportementaux',
        result: 'Taux de défaut réduit à 11%',
        resultValue: '18% → 11%',
        chartData: [
          { month: 'Jan', value: 18 },
          { month: 'Fév', value: 16.5 },
          { month: 'Mar', value: 15 },
          { month: 'Avr', value: 13.5 },
          { month: 'Mai', value: 12 },
          { month: 'Juin', value: 11 },
        ],
        chartLabel: 'Taux de défaut (%)',
        pdfUrl: '/case-studies/express-union-wouaka.pdf'
      },
      {
        segment: 'microfinance',
        icon: Store,
        title: 'CamCCUL',
        subtitle: 'Microfinance de Proximité',
        problem: 'Impossible de servir les zones rurales anglophones (Nord-Ouest, Sud-Ouest)',
        solution: 'App WOUAKA multilingue avec scoring communautaire hors-ligne',
        result: '800 agriculteurs inclus en zones enclavées',
        resultValue: '+800 agriculteurs',
        chartData: [
          { month: 'Jan', value: 45 },
          { month: 'Fév', value: 150 },
          { month: 'Mar', value: 280 },
          { month: 'Avr', value: 450 },
          { month: 'Mai', value: 650 },
          { month: 'Juin', value: 800 },
        ],
        chartLabel: 'Agriculteurs inclus',
        pdfUrl: '/case-studies/camccul-wouaka.pdf'
      }
    ]
  }
];

const segmentColors = {
  leader: {
    bg: 'bg-gradient-to-br from-[#0A3D2C]/10 to-[#0A3D2C]/5',
    border: 'border-[#0A3D2C]/20',
    accent: 'bg-[#0A3D2C]',
    badge: 'bg-[#0A3D2C]/10 text-[#0A3D2C] border-[#0A3D2C]/20'
  },
  challenger: {
    bg: 'bg-gradient-to-br from-[#0A3D2C]/8 to-[#0A3D2C]/3',
    border: 'border-[#0A3D2C]/15',
    accent: 'bg-[#0A3D2C]/80',
    badge: 'bg-[#0A3D2C]/8 text-[#0A3D2C] border-[#0A3D2C]/15'
  },
  microfinance: {
    bg: 'bg-gradient-to-br from-[#D4A017]/10 to-[#D4A017]/5',
    border: 'border-[#D4A017]/20',
    accent: 'bg-[#D4A017]',
    badge: 'bg-[#D4A017]/10 text-[#D4A017] border-[#D4A017]/20'
  }
};

const chartColors = {
  leader: '#0A3D2C',
  challenger: '#0A3D2C',
  microfinance: '#D4A017'
};

export const RegionalUseCases = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>('CI');
  
  const country = countriesData.find(c => c.code === selectedCountry) || countriesData[0];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-[#D4A017]/10 text-[#D4A017] border-[#D4A017]/30">
            <Target className="w-3 h-3 mr-1" />
            Résultats Prouvés
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Cas d'Usage <span className="text-[#0A3D2C]">Régionaux</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez comment WOUAKA transforme les opérations de crédit des institutions financières 
            à travers l'Afrique de l'Ouest et Centrale.
          </p>
        </div>

        {/* Country Selector */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <span className="text-sm font-medium text-muted-foreground">Sélectionnez un pays :</span>
          
          {/* Flag Buttons */}
          <div className="flex gap-2">
            {countriesData.map((c) => (
              <button
                key={c.code}
                onClick={() => setSelectedCountry(c.code)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                  selectedCountry === c.code
                    ? 'border-[#0A3D2C] bg-[#0A3D2C]/10'
                    : 'border-border hover:border-[#0A3D2C]/50'
                }`}
              >
                <span className="text-2xl">{c.flag}</span>
                <span className="font-medium hidden sm:inline">{c.name}</span>
              </button>
            ))}
          </div>

          {/* Or Dropdown */}
          <div className="hidden md:block">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                {countriesData.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="flex items-center gap-2">
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Use Cases Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCountry}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {country.useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              const colors = segmentColors[useCase.segment as keyof typeof segmentColors];
              const chartColor = chartColors[useCase.segment as keyof typeof chartColors];
              
              return (
                <motion.div
                  key={useCase.segment}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className={`h-full ${colors.bg} ${colors.border} border-2 overflow-hidden hover:shadow-lg transition-shadow`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-3 rounded-xl ${colors.accent}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <Badge variant="outline" className={colors.badge}>
                          {useCase.subtitle}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl text-[#0A3D2C]">
                        {useCase.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Problem */}
                      <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                        <p className="text-xs font-semibold text-destructive mb-1 uppercase tracking-wide">
                          Problématique
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {useCase.problem}
                        </p>
                      </div>

                      {/* Solution */}
                      <div className="p-3 rounded-lg bg-[#0A3D2C]/5 border border-[#0A3D2C]/20">
                        <p className="text-xs font-semibold text-[#0A3D2C] mb-1 uppercase tracking-wide">
                          Solution WOUAKA
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {useCase.solution}
                        </p>
                      </div>

                      {/* Result with Chart */}
                      <div className="p-4 rounded-lg bg-[#D4A017]/10 border border-[#D4A017]/30">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs font-semibold text-[#D4A017] uppercase tracking-wide">
                              Résultat
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {useCase.result}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#D4A017]">
                              {useCase.resultValue}
                            </p>
                          </div>
                        </div>

                        {/* Mini Chart */}
                        <div className="h-20 mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={useCase.chartData}>
                              <defs>
                                <linearGradient id={`gradient-${useCase.segment}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--background))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                                formatter={(value: number) => [value, useCase.chartLabel]}
                              />
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke={chartColor}
                                strokeWidth={2}
                                fill={`url(#gradient-${useCase.segment})`}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-1">
                          {useCase.chartLabel}
                        </p>
                      </div>

                      {/* Download Button */}
                      <Button 
                        variant="outline" 
                        className="w-full group border-[#0A3D2C]/30 hover:bg-[#0A3D2C] hover:text-white hover:border-[#0A3D2C]"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger l'étude de cas
                        <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Institutions partenaires', value: '45+', icon: Building2 },
            { label: 'Pays couverts', value: '8', icon: Target },
            { label: 'Crédits facilités', value: '2.5Mds XOF', icon: TrendingUp },
            { label: 'Taux de satisfaction', value: '96%', icon: ShieldCheck },
          ].map((stat, i) => (
            <div key={i} className="text-center p-6 rounded-xl bg-card border">
              <stat.icon className="w-8 h-8 mx-auto mb-3 text-[#0A3D2C]" />
              <p className="text-3xl font-bold text-[#D4A017]">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button size="lg" className="bg-[#0A3D2C] hover:bg-[#0A3D2C]/90 text-white">
            <BarChart3 className="w-5 h-5 mr-2" />
            Demander une étude personnalisée
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RegionalUseCases;
