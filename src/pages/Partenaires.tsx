import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Target,
  Fingerprint,
  Zap,
  Users,
  Smartphone,
  Code2,
  ArrowRight,
  Check,
  Clock,
  TrendingUp,
  Shield,
  Database,
  BarChart3,
  Globe,
  Play,
  Star,
  Copy,
  CheckCircle,
  Lock,
  FileCheck,
  MessageSquare,
  Eye,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";

const sectors = [
  {
    id: "banques",
    name: "Banques & Institutions",
    icon: Building2,
    description: "Recevez des dossiers de preuves certifiées pour vos décisions de crédit.",
    benefits: [
      "Coefficient de certitude sur chaque dossier",
      "-35% de taux de défaut grâce aux preuves",
      "Conformité BCEAO intégrée",
      "Audit trail complet",
    ],
    cta: "Solution Bancaire",
  },
  {
    id: "microfinance",
    name: "Microfinance & IMF",
    icon: Users,
    description: "Évaluez vos emprunteurs avec des preuves tangibles, même sans historique bancaire.",
    benefits: [
      "Preuves Mobile Money vérifiées",
      "Capital social valorisé",
      "Coefficient de certitude transparent",
      "Interface simplifiée",
    ],
    cta: "Solution IMF",
  },
  {
    id: "fintech",
    name: "Fintech & Startups",
    icon: Zap,
    description: "Intégrez en 48h une infrastructure de dossiers de preuves robuste.",
    benefits: [
      "API avec coefficient de certitude",
      "Sandbox gratuit",
      "Webhooks temps réel",
      "SDK multi-langages",
    ],
    cta: "Solution Fintech",
  },
  {
    id: "telecoms",
    name: "Télécoms & Mobile Money",
    icon: Smartphone,
    description: "Valorisez les données que vos abonnés choisissent de partager.",
    benefits: [
      "Consentement utilisateur explicite",
      "Dossiers temps réel",
      "0 données brutes transmises",
      "White-label possible",
    ],
    cta: "Solution Télécom",
  },
];

const codeExample = `// Recevez un dossier de preuves certifiées
const response = await fetch('https://api.wouaka-creditscore.com/v1/dossier', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone_number: '+22507XXXXXXXX',
    full_name: 'Kouamé Jean',
    consent: true
  })
});

const dossier = await response.json();
// {
//   dossier_id: "doss_xyz789",
//   status: "certified",
//   score: 72,
//   grade: "B",
//   certainty_coefficient: 0.87,
//   trust_level: "certified",
//   proof_sources: [
//     { type: "otp_verified", weight: 0.9 },
//     { type: "ussd_captured", weight: 0.85 },
//     { type: "sms_analyzed", weight: 0.9 }
//   ],
//   aml_screening: { status: "clear", pep: false },
//   consent_expires_at: "2026-02-16T10:30:00Z"
// }`;

const stats = [
  { value: "200+", label: "Dossiers/mois (Starter)" },
  { value: "87%", label: "Certitude moyenne" },
  { value: "48h", label: "Intégration API" },
  { value: "99.9%", label: "Disponibilité" },
];

const features = [
  {
    icon: Target,
    title: "Coefficient de Certitude",
    description: "Chaque dossier inclut un coefficient (0.0 à 1.0) reflétant la fiabilité des preuves. SMS analysé = 0.9, Déclaratif = 0.3.",
  },
  {
    icon: FileCheck,
    title: "Preuves Vérifiables",
    description: "5 sources de preuves : OTP vérifié, capture USSD, analyse SMS locale, documents OCR, screening AML.",
  },
  {
    icon: Lock,
    title: "Souveraineté Totale",
    description: "Analyse 100% locale sur l'appareil utilisateur. Aucune donnée brute transmise, uniquement des indicateurs structurés.",
  },
  {
    icon: Eye,
    title: "Transparence Complète",
    description: "Chaque composante du score est explicable. Conforme BCEAO. Export PDF pour comités de crédit.",
  },
];

const Partenaires = () => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(codeExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="WOUAKA PARTENAIRE - Dossiers de Preuves Certifiées"
        description="Une API unique pour recevoir des dossiers de preuves vérifiables avec coefficient de certitude. Intégration en 48h. Conformité BCEAO."
        keywords="API scoring certifié, dossier preuves, coefficient certitude, partenaires fintech, inclusion financière UEMOA"
        canonical="/partenaires"
      />
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-primary via-primary to-primary/95 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl -translate-x-1/2" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Badge className="mb-6 bg-white/10 text-white border-white/20">
                <Building2 className="w-3 h-3 mr-1" />
                WOUAKA PARTENAIRE
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            >
              Une API. Des dossiers de <span className="text-secondary">preuves</span> certifiées.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/80 mb-10 max-w-2xl mx-auto"
            >
              Recevez des évaluations avec coefficient de certitude. 
              Chaque preuve est traçable, chaque source est vérifiable.
              Pas de boîte noire, pas de score opaque.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 rounded-full px-8"
                asChild
              >
                <Link to="/auth?mode=signup&role=PARTENAIRE">
                  <Play className="w-5 h-5" />
                  Demander une démo
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 gap-2 rounded-full px-8"
                asChild
              >
                <Link to="#api">
                  <Code2 className="w-5 h-5" />
                  Tester l'API
                </Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-8 border-t border-white/10"
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-secondary font-bold text-3xl md:text-4xl">{stat.value}</p>
                  <p className="text-white/60 text-sm">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Shield className="w-3 h-3 mr-1" />
              Ce que vous recevez
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Un dossier de preuves, pas un score
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Chaque évaluation est accompagnée de son coefficient de certitude et de la liste des preuves vérifiées.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors Section */}
      <section id="secteurs" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Globe className="w-3 h-3 mr-1" />
              Par secteur
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Dossiers de preuves adaptés à votre métier
            </h2>
          </div>

          <Tabs defaultValue="banques" className="max-w-5xl mx-auto">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
              {sectors.map((sector) => (
                <TabsTrigger key={sector.id} value={sector.id} className="gap-2">
                  <sector.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{sector.name.split(" ")[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {sectors.map((sector) => (
              <TabsContent key={sector.id} value={sector.id}>
                <Card className="p-8">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                        <sector.icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">{sector.name}</h3>
                      <p className="text-muted-foreground mb-6">{sector.description}</p>
                      <Button className="gap-2" asChild>
                        <Link to="/contact">
                          {sector.cta}
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-4">Bénéfices clés</h4>
                      <ul className="space-y-3">
                        {sector.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                              <Check className="w-4 h-4 text-secondary" />
                            </div>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* API Section */}
      <section id="api" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                <Code2 className="w-3 h-3 mr-1" />
                Pour les développeurs
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Un endpoint, un dossier complet
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                L'API retourne un dossier de preuves avec coefficient de certitude, sources vérifiées et screening AML.
              </p>
            </div>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm text-muted-foreground">JavaScript</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyCode}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
              <pre className="p-6 overflow-x-auto bg-[#1e1e1e] text-[#d4d4d4] text-sm">
                <code>{codeExample}</code>
              </pre>
            </Card>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                { icon: Clock, title: "48h d'intégration", desc: "Documentation claire et support réactif" },
                { icon: Target, title: "Certitude incluse", desc: "Coefficient sur chaque dossier" },
                { icon: Database, title: "Sandbox gratuit", desc: "Testez sans engagement" },
              ].map((item, i) => (
                <Card key={i} className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" className="gap-2" asChild>
                <Link to="/auth?mode=signup&role=PARTENAIRE">
                  <Code2 className="w-5 h-5" />
                  Créer un compte développeur
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            <Star className="w-3 h-3 mr-1" />
            Tarification simple
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            À partir de 49 000 FCFA/mois
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            200 dossiers de preuves par mois. Coefficient de certitude inclus. Paiement via Orange Money, MTN MoMo, Wave ou carte.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2" asChild>
              <Link to="/pricing">
                Voir les plans
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link to="/contact">
                Parler à un expert
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à recevoir des dossiers de preuves ?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Vos clients prouvent leur valeur, vous recevez des évaluations 
            certifiées avec coefficient de certitude.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
              asChild
            >
              <Link to="/auth?mode=signup&role=PARTENAIRE">
                Commencer maintenant
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/contact">Parler à un expert</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm opacity-60">
            Paiement sécurisé via CinetPay • Facturation mensuelle • Annulation à tout moment
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Partenaires;
