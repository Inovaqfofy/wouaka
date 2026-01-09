import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHero } from '@/components/layout/PageHero';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  Shield, 
  Zap,
  Users,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Star,
  Building2,
  Phone,
} from 'lucide-react';

const BENEFITS = [
  {
    icon: Users,
    title: "Scorez l'invisible",
    description: "Analysez 85% de la population africaine traditionnellement exclue du crédit classique."
  },
  {
    icon: Zap,
    title: "Résultats instantanés",
    description: "Obtenez une décision en quelques secondes, pas en plusieurs jours."
  },
  {
    icon: Shield,
    title: "Conformité BCEAO",
    description: "Notre solution respecte toutes les réglementations de la zone UEMOA."
  },
  {
    icon: BarChart3,
    title: "Décisions éclairées",
    description: "Score clair, indicateurs business et recommandations actionables."
  },
];

const TESTIMONIALS = [
  {
    quote: "Wouaka nous a permis de tripler notre portefeuille de micro-crédits en 6 mois.",
    author: "Directeur Crédit",
    company: "IMF Abidjan",
    rating: 5,
  },
  {
    quote: "L'intégration API a pris moins de 48h. Le support technique est excellent.",
    author: "CTO",
    company: "Fintech Dakar",
    rating: 5,
  },
  {
    quote: "Réduction de 40% de nos impayés grâce à une meilleure sélection des risques.",
    author: "Risk Manager",
    company: "Banque Régionale",
    rating: 5,
  },
];

export default function Discover() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Découvrir Wouaka - Scoring de Crédit pour l'Afrique"
        description="Découvrez comment Wouaka révolutionne le scoring de crédit en Afrique. Scorez l'invisible, incluez les non-bancarisés."
        keywords="scoring crédit, inclusion financière, Afrique, UEMOA, Mobile Money"
        canonical="/decouvrir"
      />
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <PageHero
          badge={{ icon: Brain, text: "Solution IA pour l'Afrique" }}
          title="Scorez l'invisible,"
          titleHighlight="Incluez tous"
          description="Rejoignez les institutions financières qui utilisent Wouaka pour analyser la solvabilité de clients traditionnellement exclus du système bancaire."
          primaryCTA={{ label: "Demander une démo", href: "/contact", icon: Phone }}
          secondaryCTA={{ label: "Voir les tarifs", href: "/pricing" }}
        />

        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Pourquoi Wouaka</Badge>
              <h2 className="text-3xl font-display font-bold mb-4">
                L'outil de scoring adapté à l'Afrique
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Conçu spécifiquement pour les marchés africains, notre moteur utilise 
                les données alternatives disponibles localement.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
              {BENEFITS.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4">
                Simple et efficace
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              {[
                { step: 1, title: "Inscrivez-vous", desc: "Créez votre compte et obtenez vos accès API" },
                { step: 2, title: "Intégrez", desc: "Connectez notre API à votre système en quelques heures" },
                { step: 3, title: "Scorez", desc: "Analysez vos clients et prenez de meilleures décisions" },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Témoignages</Badge>
              <h2 className="text-3xl font-display font-bold mb-4">
                Ils nous font confiance
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {TESTIMONIALS.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4 italic">
                        "{testimonial.quote}"
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{testimonial.author}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-display font-bold mb-4">
              Prêt à transformer votre scoring ?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Rejoignez les institutions qui scorent l'invisible et développent l'inclusion financière en Afrique.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" variant="secondary">
                <Link to="/auth">
                  Créer un compte gratuit
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10">
                <Link to="/contact">
                  Parler à un expert
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-primary-foreground/70">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>100 scores gratuits/mois</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sandbox illimité</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Support en français</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
