import {
  Shield,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  Building2,
  Zap,
  ChevronRight,
  Check,
  ArrowRight,
  Star,
  Target,
  Banknote,
  Code2,
  Smartphone,
  Eye,
  UserX,
  Globe,
  Timer,
  DollarSign,
  Brain,
  Fingerprint,
  AlertTriangle,
  BarChart3,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import heroConsultant from "@/assets/hero-consultant.png";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Scoring de crédit pour l'Afrique"
        description="Wouaka score 100% de la population africaine grâce aux données alternatives. Mobile Money, télécom, comportement digital. Intégration API en 48h. Conforme BCEAO."
        keywords="scoring crédit Afrique, credit score UEMOA, inclusion financière, Mobile Money, API scoring, BCEAO, fintech Afrique"
        canonical="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Wouaka",
          description: "Plateforme de scoring de crédit pour l'Afrique de l'Ouest",
          url: "https://wouaka-creditscore.com",
          logo: "https://wouaka-creditscore.com/logo.png",
          areaServed: "UEMOA",
        }}
      />
      <Navbar />

      {/* Hero Section - Design moderne et inspirant */}
      <section className="relative min-h-screen bg-gradient-to-br from-primary via-primary to-primary/95 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-secondary/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/4" />
          <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-accent/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="container mx-auto px-4 relative z-10 h-screen">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-end min-h-screen pt-24 pb-0">
            
            {/* Right side - Content */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-center lg:text-left order-2 lg:order-2"
            >
              {/* Tagline badge */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2.5 mb-8"
              >
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                <span className="text-white/90 text-sm font-medium tracking-wide">
                  Scoring de crédit nouvelle génération
                </span>
              </motion.div>

              {/* Main title */}
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight"
              >
                Scorez <span className="text-secondary">l'invisible</span>.
                <br />
                <span className="text-white/80">85% de l'Afrique</span>
                <br />
                vous attend.
              </motion.h1>

              {/* Description */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/70 text-lg md:text-xl mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                Grâce aux données alternatives — Mobile Money, télécom, comportement digital — 
                nous rendons <strong className="text-white">visible l'invisible</strong>. 
                Scorez 100% de la population, pas seulement les 15% bancarisés.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
              >
                <Button 
                  size="lg" 
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 text-lg px-8 py-6 font-semibold rounded-full shadow-2xl shadow-secondary/30 hover:shadow-secondary/40 transition-all hover:scale-105" 
                  asChild
                >
                  <Link to="/developers">
                    <Code2 className="w-5 h-5" />
                    Tester l'API gratuitement
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 gap-2 rounded-full px-8 py-6 transition-all" 
                  asChild
                >
                  <Link to="/contact">
                    <Play className="w-5 h-5" />
                    Voir la démo
                  </Link>
                </Button>
              </motion.div>

              {/* Stats row */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-white/10"
              >
                {[
                  { value: "48h", label: "Intégration" },
                  { value: "100%", label: "Population scorée" },
                  { value: "5k", label: "FCFA/score" },
                  { value: "BCEAO", label: "Conforme" },
                ].map((stat, i) => (
                  <div key={i} className="text-center lg:text-left">
                    <p className="text-secondary font-display text-2xl md:text-3xl font-bold">{stat.value}</p>
                    <p className="text-white/50 text-sm">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Left side - Image */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
              className="relative order-1 lg:order-1 flex items-end justify-center lg:justify-start self-end"
            >
              <div className="relative">
                {/* Glowing background effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/30 via-secondary/10 to-transparent rounded-full blur-3xl scale-110" />
                
                {/* Main image */}
                <img 
                  src={heroConsultant} 
                  alt="Consultant africain professionnel" 
                  className="relative z-10 h-[500px] lg:h-[calc(100vh-96px)] max-h-[750px] w-auto object-contain object-bottom drop-shadow-2xl"
                />
                
                {/* Floating card - Top right */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    y: [0, -8, 0],
                  }}
                  transition={{ 
                    delay: 0.8,
                    y: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  }}
                  className="absolute top-[15%] -right-4 lg:-right-8 bg-white/95 backdrop-blur-lg rounded-2xl p-4 shadow-2xl z-20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-primary/60 text-xs font-medium">Taux d'inclusion</p>
                      <p className="text-primary font-bold text-xl">+85%</p>
                    </div>
                  </div>
                </motion.div>
                
                {/* Floating card - Middle left */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    y: [0, 8, 0],
                  }}
                  transition={{ 
                    delay: 1,
                    y: {
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  }}
                  className="absolute top-[45%] -left-8 lg:-left-12 bg-white/95 backdrop-blur-lg rounded-2xl p-4 shadow-2xl z-20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-primary/60 text-xs font-medium">Fiabilité</p>
                      <p className="text-primary font-bold text-xl">99.9%</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* The Invisible Problem - Visualisation */}
      <section className="py-20 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Le problème invisible
            </Badge>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Sur 100 Africains de l'Ouest
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Compact Progress Bar Visualization */}
            <div className="mb-8">
              <div className="relative h-12 rounded-full overflow-hidden bg-muted border border-border">
                {/* Invisible section (85%) */}
                <div
                  className="absolute inset-y-0 left-0 bg-muted-foreground/30 flex items-center justify-end pr-4 transition-all duration-1000 ease-out animate-[slideInLeft_1s_ease-out]"
                  style={{ width: "85%" }}
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserX className="w-5 h-5" />
                    <span className="font-display text-lg font-bold">85%</span>
                    <span className="text-sm hidden sm:inline">invisibles</span>
                  </div>
                </div>
                {/* Visible section (15%) */}
                <div
                  className="absolute inset-y-0 right-0 bg-secondary shadow-glow flex items-center justify-center transition-all duration-1000 ease-out animate-[slideInRight_1s_ease-out]"
                  style={{ width: "15%" }}
                >
                  <div className="flex items-center gap-1 text-secondary-foreground">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-display text-sm font-bold">15%</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Non scorés par les bureaux traditionnels</span>
                <span>Bancarisés</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center">
                      <span className="font-display text-2xl font-bold text-destructive">85</span>
                    </div>
                    <div>
                      <p className="font-semibold text-destructive">Invisibles</p>
                      <p className="text-sm text-muted-foreground">Non scorés par les bureaux traditionnels</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-secondary/30 bg-secondary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center">
                      <span className="font-display text-2xl font-bold text-secondary">15</span>
                    </div>
                    <div>
                      <p className="font-semibold text-secondary">Scorés</p>
                      <p className="text-sm text-muted-foreground">Avec compte bancaire formel</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <p className="text-lg text-muted-foreground">
                <strong className="text-foreground">Wouaka change la donne :</strong> nous scorons{" "}
                <span className="text-secondary font-bold">100% de la population</span>, pas seulement les 15% déjà
                bancarisés.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How We're Different - Comparatif */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              La différence Wouaka
            </Badge>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Pourquoi nous, pas eux ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Les bureaux traditionnels (Experian, TransUnion, CRIF) utilisent des modèles occidentaux inadaptés à
              l'Afrique.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Bureaux traditionnels */}
              <Card className="border-destructive/30">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-destructive" />
                    </div>
                    <CardTitle className="text-destructive">Bureaux traditionnels</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { icon: UserX, text: "Scorent seulement 10-15% de la population" },
                    { icon: Globe, text: "Modèles occidentaux importés" },
                    { icon: Clock, text: "Intégration en 6-12 mois" },
                    { icon: DollarSign, text: "500-2000 FCFA par score" },
                    { icon: Banknote, text: "Données bancaires uniquement" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-muted-foreground">
                      <item.icon className="w-5 h-5 text-destructive/70" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Wouaka */}
              <Card className="border-secondary shadow-glow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-secondary" />
                    </div>
                    <CardTitle className="text-secondary">Wouaka</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { icon: Users, text: "Score 100% de la population" },
                    { icon: Globe, text: "Technologie native africaine" },
                    { icon: Timer, text: "Intégration en 48 heures" },
                    { icon: DollarSign, text: "Dès 2 500 FCFA par score" },
                    { icon: Smartphone, text: "Données alternatives (Mobile Money, télécom)" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-secondary" />
                      <span className="font-medium">{item.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link to="/vs-traditional" className="gap-2">
                  Voir le comparatif détaillé <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Products That Make Sense */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Nos produits
            </Badge>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Des produits qui ont du sens
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conçus pour le marché africain. Prix transparents. Intégration rapide.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Target,
                name: "Inclusion Score",
                tagline: "Le score pour les non-bancarisés",
                price: "5 000 FCFA",
                description: "Scorez ceux que les autres ignorent. Entrée : numéro de téléphone uniquement.",
                features: ["< 2 secondes", "Mobile Money", "Télécom", "Comportement"],
                highlight: true,
              },
              {
                icon: Building2,
                name: "Business Score",
                tagline: "Scoring des commerces informels",
                price: "10 000 FCFA",
                description: "Évaluez la fiabilité des PME et commerces, même sans RCCM.",
                features: ["Secteur informel", "Stabilité activité", "Risque fraude"],
                highlight: false,
              },
              {
                icon: Smartphone,
                name: "Agent Mobile",
                tagline: "Pour les agents terrain",
                price: "Sur devis",
                description: "Application mobile pour pré-qualifier en 30 secondes sur le terrain.",
                features: ["Mode hors-ligne", "Workflow simplifié", "Rapports instantanés"],
                highlight: false,
              },
              {
                icon: Eye,
                name: "Wouaka Watch",
                tagline: "Monitoring en temps réel",
                price: "25 000 FCFA/mois",
                description: "Surveillez vos portefeuilles. Alertes proactives sur les risques.",
                features: ["Alertes webhook", "Prédiction défauts", "Tableau de bord"],
                highlight: false,
              },
            ].map((product, i) => (
              <Card
                key={i}
                className={`card-premium relative group hover:scale-[1.02] transition-transform ${product.highlight ? "border-secondary shadow-glow" : ""}`}
              >
                {product.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary" className="shadow-lg">
                      <Star className="w-3 h-3 mr-1" />
                      Produit phare
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
                    <product.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <p className="text-xs text-secondary font-medium">{product.tagline}</p>
                  <div className="mt-2">
                    <span className="font-display text-2xl font-bold">{product.price}</span>
                    <span className="text-xs text-muted-foreground">/requête</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {product.features.map((feature, j) => (
                      <Badge key={j} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button asChild>
              <Link to="/pricing" className="gap-2">
                Voir tous les tarifs <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Built for Africa */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                Construit pour l'Afrique
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                Technologie africaine,
                <br />
                pour l'Afrique
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Nous ne sommes pas un bureau de crédit occidental qui s'adapte. Nous sommes{" "}
                <strong className="text-foreground">nés ici</strong>, pour répondre aux réalités du marché africain.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: Brain,
                    title: "IA entraînée sur données africaines",
                    description:
                      "Nos modèles comprennent l'économie informelle, le Mobile Money, et les comportements locaux.",
                  },
                  {
                    icon: Fingerprint,
                    title: "Scoring sans compte bancaire",
                    description:
                      "Télécom, transactions marchandes, stabilité numérique : nous utilisons ce qui existe vraiment.",
                  },
                  {
                    icon: Shield,
                    title: "Conformité BCEAO native",
                    description:
                      "Pas d'adaptation : nous sommes conformes dès la conception. Hébergement souverain inclus.",
                  },
                  {
                    icon: Timer,
                    title: "Intégration en 48 heures",
                    description: "API simple, documentation en français, support réactif. Pas 6 mois d'intégration.",
                  },
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Card className="card-premium p-8">
                <div className="text-center mb-6">
                  <div className="text-sm text-muted-foreground mb-2">Wouaka Inclusion Score</div>
                  <div className="relative w-40 h-40 mx-auto">
                    <div className="w-full h-full rounded-full border-8 border-secondary/30 flex items-center justify-center bg-gradient-primary">
                      <span className="font-display text-5xl font-bold text-primary-foreground">78</span>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                      <Badge variant="success" className="shadow-lg">
                        Fiable
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Fiabilité", value: "82%" },
                    { label: "Stabilité", value: "75%" },
                    { label: "Risque court terme", value: "Faible" },
                    { label: "Capacité d'engagement", value: "84%" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-2 border-b border-border/50 last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Client non-bancarisé</strong> • Scoré via Mobile Money et
                    télécom uniquement
                  </p>
                </div>
              </Card>

              <div className="absolute -bottom-4 -right-4 bg-card border border-border rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-secondary" />
                  <span className="text-sm font-medium">1,8 secondes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Love */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Code2 className="w-3 h-3 mr-1" />
              Developer-First
            </Badge>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">Intégrez en 5 minutes</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Pas 6 mois. Pas de réunions interminables. Copiez, collez, scorez.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="card-premium overflow-hidden">
              <div className="bg-slate-900 p-6 font-mono text-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-slate-400 ml-2">score.js</span>
                </div>
                <pre className="text-slate-300 overflow-x-auto">
                  {`// Wouaka Inclusion Score - C'est vraiment aussi simple
const response = await fetch('https://api.wouaka-creditscore.com/v1/score', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone_number: '+221771234567',
    full_name: 'Amadou Diallo'
  })
});

const { score, reliability, stability, risk_level } = await response.json();
// { score: 78, reliability: 82, stability: 75, risk_level: "low" }`}
                </pre>
              </div>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4 justify-between items-center">
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="font-display text-2xl font-bold text-secondary">100</div>
                      <div className="text-xs text-muted-foreground">Scores gratuits/mois</div>
                    </div>
                    <div className="text-center">
                      <div className="font-display text-2xl font-bold text-secondary">∞</div>
                      <div className="text-xs text-muted-foreground">Sandbox illimité</div>
                    </div>
                    <div className="text-center">
                      <div className="font-display text-2xl font-bold text-secondary">FR</div>
                      <div className="text-xs text-muted-foreground">Doc en français</div>
                    </div>
                  </div>
                  <Button asChild>
                    <Link to="/developers" className="gap-2">
                      Documentation API <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "2.5M+", label: "Personnes scorées pour la première fois", icon: Users },
              { value: "50+", label: "Institutions partenaires", icon: Building2 },
              { value: "8 pays", label: "Zone UEMOA couverte", icon: Globe },
              { value: "99.9%", label: "Disponibilité API", icon: Zap },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-secondary" />
                </div>
                <div className="font-display text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Témoignages
            </Badge>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Ils ont choisi l'inclusion
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                quote:
                  "Avec Wouaka, nous avons pu scorer 40% de clients supplémentaires que nous refusions auparavant faute de données. Notre portefeuille a doublé.",
                author: "Directeur du Crédit",
                company: "Institution de Microfinance, Sénégal",
                metric: "+40% clients",
              },
              {
                quote:
                  "L'intégration a pris 2 jours. Deux jours ! Avec notre ancien bureau de crédit, on parlait en mois.",
                author: "CTO",
                company: "Fintech, Côte d'Ivoire",
                metric: "2 jours d'intégration",
              },
              {
                quote:
                  "Le coût par score a baissé de 80%. Et la qualité des décisions s'est améliorée grâce aux données alternatives.",
                author: "Risk Manager",
                company: "Banque régionale, Mali",
                metric: "-80% coût/score",
              },
            ].map((testimonial, i) => (
              <Card key={i} className="card-premium">
                <CardContent className="pt-6">
                  <Badge variant="secondary" className="mb-4">
                    {testimonial.metric}
                  </Badge>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link to="/impact" className="gap-2">
                Voir notre impact <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Tarification transparente
            </Badge>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Des plans qui évoluent avec vous
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Pas de frais cachés, pas d'engagement. Commencez gratuitement et passez à l'échelle quand vous êtes prêt.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "99K",
                currency: "FCFA",
                period: "/mois",
                description: "Idéal pour les PME et commerçants",
                features: [
                  "25 évaluations par mois",
                  "API standard",
                  "Support par email",
                  "1 utilisateur",
                  "Tableau de bord basique",
                ],
                cta: "Commencer maintenant",
                popular: false,
              },
              {
                name: "Business",
                price: "299K",
                currency: "FCFA",
                period: "/mois",
                description: "Pour les entreprises en croissance",
                features: [
                  "85 évaluations par mois",
                  "API complète avec webhooks",
                  "Support prioritaire 24/7",
                  "10 utilisateurs",
                  "Tableau de bord avancé",
                ],
                cta: "Essai gratuit 14 jours",
                popular: true,
              },
              {
                name: "Enterprise",
                price: "Sur mesure",
                currency: "",
                period: "",
                description: "Pour les grandes institutions",
                features: [
                  "Volume négocié",
                  "API dédiée + SDK personnalisé",
                  "Account Manager dédié",
                  "SLA 99.99% garanti",
                  "Conformité BCEAO renforcée",
                ],
                cta: "Parler à un expert",
                popular: false,
              },
            ].map((plan, i) => (
              <Card key={i} className={`card-premium relative ${plan.popular ? "border-secondary shadow-glow" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary" className="shadow-lg">
                      <Star className="w-3 h-3 mr-1" />
                      Recommandé
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="font-display text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">
                      {plan.currency}
                      {plan.period}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-secondary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                    <Link to={plan.name === "Enterprise" ? "/contact" : "/auth"}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/pricing">
              <Button variant="link" className="gap-2">
                Comparer tous les plans <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-hero text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">Prêt à scorer l'invisible ?</h2>
          <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto">
            Rejoignez les 50+ institutions qui ont choisi l'inclusion financière. 100 scores gratuits pour commencer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="gap-2" asChild>
              <Link to="/developers">
                <Code2 className="w-5 h-5" />
                Tester l'API gratuitement
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/contact">Parler à un expert</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
