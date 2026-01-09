import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageHero } from '@/components/layout/PageHero';
import { 
  GraduationCap, 
  Target, 
  TrendingUp, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Lightbulb,
  BarChart3,
  Brain,
  Smartphone,
  Building2,
  CreditCard,
  Clock,
  Activity,
  HelpCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

const scoreRanges = [
  { 
    min: 80, 
    max: 100, 
    grade: 'A+', 
    category: 'Excellent',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Profil de crédit exceptionnel. Accès aux meilleures conditions de financement.',
    approval: '95%+',
    conditions: 'Taux préférentiels, montants élevés, conditions flexibles'
  },
  { 
    min: 70, 
    max: 79, 
    grade: 'A', 
    category: 'Très bon',
    color: 'bg-green-400',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50/70',
    borderColor: 'border-green-200',
    description: 'Profil très fiable avec un historique solide.',
    approval: '85-95%',
    conditions: 'Bonnes conditions, montants importants'
  },
  { 
    min: 60, 
    max: 69, 
    grade: 'B+', 
    category: 'Bon',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'Bon profil avec quelques axes d\'amélioration.',
    approval: '75-85%',
    conditions: 'Conditions standards, montants modérés à importants'
  },
  { 
    min: 50, 
    max: 59, 
    grade: 'B', 
    category: 'Correct',
    color: 'bg-emerald-400',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50/70',
    borderColor: 'border-emerald-200',
    description: 'Profil acceptable nécessitant des améliorations.',
    approval: '60-75%',
    conditions: 'Conditions standards avec garanties possibles'
  },
  { 
    min: 40, 
    max: 49, 
    grade: 'C+', 
    category: 'Moyen',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'Profil présentant des risques modérés.',
    approval: '40-60%',
    conditions: 'Montants limités, garanties requises'
  },
  { 
    min: 30, 
    max: 39, 
    grade: 'C', 
    category: 'Faible',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'Profil à risque élevé, accès limité au crédit.',
    approval: '20-40%',
    conditions: 'Micro-crédit, garanties obligatoires'
  },
  { 
    min: 20, 
    max: 29, 
    grade: 'D', 
    category: 'Très faible',
    color: 'bg-red-400',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Profil à haut risque, crédit très difficile.',
    approval: '5-20%',
    conditions: 'Alternatives de financement recommandées'
  },
  { 
    min: 0, 
    max: 19, 
    grade: 'E', 
    category: 'Critique',
    color: 'bg-red-600',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    description: 'Profil critique, restructuration nécessaire.',
    approval: '<5%',
    conditions: 'Programme d\'accompagnement recommandé'
  },
];

const factors = [
  {
    name: 'Historique de paiements',
    weight: 25,
    icon: Clock,
    description: 'Régularité des paiements de factures (eau, électricité, Mobile Money)',
    tips: [
      'Payez vos factures à temps chaque mois',
      'Utilisez les rappels automatiques',
      'Évitez les retards de paiement'
    ]
  },
  {
    name: 'Stabilité Mobile Money',
    weight: 20,
    icon: Smartphone,
    description: 'Volume et régularité des transactions Mobile Money',
    tips: [
      'Maintenez une activité régulière',
      'Diversifiez vos transactions',
      'Conservez le même numéro longtemps'
    ]
  },
  {
    name: 'Capacité financière',
    weight: 20,
    icon: CreditCard,
    description: 'Ratio revenus/dépenses et endettement actuel',
    tips: [
      'Maintenez un ratio dépenses < 70% revenus',
      'Remboursez vos prêts existants',
      'Augmentez progressivement vos revenus'
    ]
  },
  {
    name: 'Stabilité professionnelle',
    weight: 15,
    icon: Building2,
    description: 'Ancienneté dans l\'activité et formalisation',
    tips: [
      'Formalisez votre entreprise (RCCM)',
      'Maintenez une activité stable',
      'Documentez vos revenus'
    ]
  },
  {
    name: 'Ancienneté SIM',
    weight: 10,
    icon: Activity,
    description: 'Durée d\'utilisation du numéro de téléphone',
    tips: [
      'Conservez votre numéro principal',
      'Évitez de changer fréquemment',
      '12+ mois est idéal'
    ]
  },
  {
    name: 'Facteur régional',
    weight: 10,
    icon: Target,
    description: 'Environnement économique de la région',
    tips: [
      'Développez votre réseau local',
      'Profitez des opportunités régionales',
      'Adaptez-vous au contexte local'
    ]
  },
];

const subIndicators = [
  {
    name: 'Fiabilité',
    icon: Shield,
    description: 'Mesure votre historique de paiements et le niveau de formalisation de votre activité.',
    interpretation: 'Plus ce score est élevé, plus vous êtes perçu comme un emprunteur fiable.',
    example: 'Un score de 75% indique un bon historique avec quelques axes d\'amélioration.'
  },
  {
    name: 'Stabilité',
    icon: TrendingUp,
    description: 'Évalue la stabilité de votre activité professionnelle et votre présence digitale.',
    interpretation: 'Reflète la durabilité de vos revenus et votre ancrage numérique.',
    example: '5+ ans d\'activité et 24+ mois de SIM donnent un excellent score.'
  },
  {
    name: 'Risque CT',
    icon: AlertTriangle,
    description: 'Évalue le risque à court terme basé sur votre situation financière actuelle.',
    interpretation: 'Un score élevé (proche de 100) signifie un FAIBLE risque à court terme.',
    example: 'Score de 80% = situation financière saine, risque faible.'
  },
  {
    name: 'Capacité d\'engagement',
    icon: Target,
    description: 'Mesure votre capacité à honorer de nouveaux engagements financiers.',
    interpretation: 'Détermine le montant maximal que vous pouvez raisonnablement emprunter.',
    example: 'Score de 65% = capacité modérée, prêts de taille moyenne recommandés.'
  },
];

const faqs = [
  {
    question: 'Comment est calculé mon score Wouaka ?',
    answer: 'Votre score est calculé par notre moteur IA qui analyse 8 facteurs clés : historique de paiements, activité Mobile Money, ratio revenus/dépenses, stabilité professionnelle, ancienneté SIM, formalisation business, charge d\'emprunt existante et contexte régional. Chaque facteur a un poids spécifique dans le calcul final.'
  },
  {
    question: 'Quelle est la différence avec un score bancaire traditionnel ?',
    answer: 'Contrairement aux scores bancaires classiques qui nécessitent un historique bancaire formel, Wouaka utilise des données alternatives (Mobile Money, paiements de factures, comportement digital) accessibles à tous. Cela permet de scorer des personnes sans compte bancaire traditionnel.'
  },
  {
    question: 'Combien de temps faut-il pour améliorer mon score ?',
    answer: 'Les améliorations peuvent être visibles en 1-3 mois pour les changements de comportement (paiements réguliers). Les facteurs structurels (ancienneté, formalisation) prennent plus de temps. Un suivi régulier et des actions constantes sont la clé.'
  },
  {
    question: 'Mon score peut-il baisser ?',
    answer: 'Oui, plusieurs facteurs peuvent faire baisser votre score : retards de paiement, augmentation de l\'endettement, baisse d\'activité Mobile Money, ou changement fréquent de numéro de téléphone.'
  },
  {
    question: 'Les prêteurs voient-ils tous les détails de mon profil ?',
    answer: 'Non. Les partenaires voient uniquement le score global, la catégorie de risque et les indicateurs agrégés. Vos données personnelles détaillées restent confidentielles et ne sont jamais partagées.'
  },
  {
    question: 'Que signifie l\'indice de confiance ?',
    answer: 'L\'indice de confiance (0-100%) indique la fiabilité de votre score. Plus il y a de données disponibles pour vous évaluer, plus cet indice est élevé. Un score avec 85%+ de confiance est très fiable.'
  },
];

export default function ScoreEducation() {
  return (
    <PublicLayout>
      <SEOHead
        title="Comprendre votre score de crédit"
        description="Guide complet pour interpréter votre score de crédit Wouaka. Échelle de notation A+ à E, facteurs d'influence, FAQ et conseils pour améliorer votre score."
        keywords="comprendre score crédit, échelle notation crédit, améliorer score, facteurs score crédit Afrique"
        canonical="/score-education"
      />
      
      <PageHero
        badge={{ icon: GraduationCap, text: "Guide éducatif" }}
        title="Comprendre votre"
        titleHighlight="Score de Crédit"
        description="Découvrez comment interpréter votre score Wouaka, ce qu'il signifie pour vos demandes de financement, et comment l'améliorer."
        primaryCTA={{ label: "Calculer mon score", href: "/scoring" }}
      />

      <main className="flex-1">

        {/* Score Scale Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-display font-bold mb-3">
                L'échelle de Score Wouaka
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Le score Wouaka va de <strong>0 à 100</strong>, avec des grades de <strong>E à A+</strong>. 
                Voici ce que signifie chaque niveau.
              </p>
            </div>

            {/* Visual Scale */}
            <div className="max-w-4xl mx-auto mb-10">
              <div className="relative h-12 rounded-full overflow-hidden flex">
                {scoreRanges.slice().reverse().map((range, i) => (
                  <div
                    key={range.grade}
                    className={`${range.color} flex-1 flex items-center justify-center text-white text-sm font-bold`}
                    style={{ width: `${(range.max - range.min + 1)}%` }}
                  >
                    {range.grade}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>0</span>
                <span>20</span>
                <span>40</span>
                <span>60</span>
                <span>80</span>
                <span>100</span>
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {scoreRanges.slice(0, 4).map((range, index) => (
                <motion.div
                  key={range.grade}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`${range.bgColor} ${range.borderColor} border-2 h-full`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge className={`${range.color} text-white text-lg px-3 py-1`}>
                          {range.grade}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {range.min}-{range.max}
                        </span>
                      </div>
                      <CardTitle className={`${range.textColor} text-lg`}>
                        {range.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">{range.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Approbation: {range.approval}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{range.conditions}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
              {scoreRanges.slice(4).map((range, index) => (
                <motion.div
                  key={range.grade}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index + 4) * 0.1 }}
                >
                  <Card className={`${range.bgColor} ${range.borderColor} border-2 h-full`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge className={`${range.color} text-white text-lg px-3 py-1`}>
                          {range.grade}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {range.min}-{range.max}
                        </span>
                      </div>
                      <CardTitle className={`${range.textColor} text-lg`}>
                        {range.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">{range.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span>Approbation: {range.approval}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{range.conditions}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Example interpretation */}
            <Card className="mt-8 max-w-2xl mx-auto border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Exemple : Score de 72/100
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>
                  Un score de <strong>72</strong> correspond au grade <strong>A</strong> (Très bon).
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Taux d'approbation estimé : 85-95%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Accès à des montants de prêt importants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Conditions avantageuses disponibles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <span>+8 points pour atteindre A+ et les meilleures conditions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Factors Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-display font-bold mb-3 flex items-center justify-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Les 6 Facteurs de Calcul
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Votre score est calculé à partir de ces facteurs pondérés. 
                Comprendre leur poids vous aide à prioriser vos actions.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {factors.map((factor, index) => (
                <motion.div
                  key={factor.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <factor.icon className="w-5 h-5 text-primary" />
                        </div>
                        <Badge variant="secondary">{factor.weight}%</Badge>
                      </div>
                      <CardTitle className="text-base">{factor.name}</CardTitle>
                      <Progress value={factor.weight * 4} className="h-2" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{factor.description}</p>
                      <div className="space-y-1">
                        <p className="text-xs font-medium flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" /> Conseils :
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {factor.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-primary">•</span> {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Sub-indicators Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-display font-bold mb-3 flex items-center justify-center gap-2">
                <Brain className="w-6 h-6" />
                Les 4 Sous-indicateurs
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                En plus du score global, 4 indicateurs spécifiques vous donnent 
                une vision détaillée de votre profil.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              {subIndicators.map((indicator, index) => (
                <motion.div
                  key={indicator.name}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-primary/10">
                          <indicator.icon className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>{indicator.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm">{indicator.description}</p>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Interprétation :</p>
                        <p className="text-sm text-muted-foreground">{indicator.interpretation}</p>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                        <span className="text-muted-foreground">{indicator.example}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-display font-bold mb-3 flex items-center justify-center gap-2">
                <HelpCircle className="w-6 h-6" />
                Questions Fréquentes
              </h2>
            </div>

            <div className="grid gap-4 max-w-3xl mx-auto">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-start gap-2">
                        <span className="text-primary font-bold">Q.</span>
                        {faq.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="py-8 space-y-4">
                <Brain className="w-12 h-12 text-primary mx-auto" />
                <h3 className="text-xl font-display font-bold">
                  Prêt à découvrir votre score ?
                </h3>
                <p className="text-muted-foreground">
                  Obtenez votre analyse de solvabilité complète en quelques minutes.
                </p>
                <a 
                  href="/scoring" 
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  <Target className="w-4 h-4" />
                  Calculer mon score
                </a>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
