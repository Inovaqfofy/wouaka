import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Target,
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
  Copy,
  CheckCircle,
  Lock,
  FileCheck,
  Eye,
  Server,
  Layers,
  Network,
  BadgeCheck,
  Cpu,
  CircuitBoard,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { RegionalUseCases } from "@/components/institutional/RegionalUseCases";
import WouakaROISimulator from "@/components/institutional/WouakaROISimulator";

const sectors = [
  {
    id: "banques",
    name: "Banques & CBS",
    icon: Building2,
    description: "Enrichissez votre Core Banking avec des données alternatives qualifiées. Compatible T24, Flexcube, Finacle.",
    benefits: [
      "Intégration native T24/Flexcube",
      "-35% de NPL grâce aux signaux faibles",
      "Conformité BCEAO intégrée",
      "Risk Appetite configurable",
    ],
    cta: "Solution Enterprise",
  },
  {
    id: "microfinance",
    name: "IMF & SFD",
    icon: Users,
    description: "Scorez vos emprunteurs sans historique bancaire avec des preuves Mobile Money vérifiables.",
    benefits: [
      "Scoring sans bancarisation",
      "Preuves USSD/SMS analysées",
      "Coefficient de certitude",
      "Interface simplifiée",
    ],
    cta: "Solution IMF",
  },
  {
    id: "fintech",
    name: "Fintech & Néobanques",
    icon: Zap,
    description: "API RESTful avec latence < 150ms. Sandbox gratuit. SDK multi-langages.",
    benefits: [
      "Webhooks temps réel",
      "Latence moyenne 120ms",
      "Sandbox illimité",
      "Support technique 24/7",
    ],
    cta: "Solution Fintech",
  },
  {
    id: "telecoms",
    name: "Télécoms & MoMo",
    icon: Smartphone,
    description: "Valorisez vos données transactionnelles avec le consentement utilisateur explicite.",
    benefits: [
      "API Orange/MTN/Wave",
      "0 données brutes stockées",
      "Revenue share possible",
      "White-label disponible",
    ],
    cta: "Solution Télécom",
  },
];

const codeExample = `// WOUAKA API - Dossier de Preuves Certifié
const response = await fetch('https://api.wouaka.com/v1/wouaka-core', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer wk_live_xxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone_number: '+22507XXXXXXXX',
    full_name: 'Kouamé Jean',
    consent: true,
    level: 'enhanced' // basic | enhanced | advanced
  })
});

const dossier = await response.json();
// Réponse structurée avec coefficient de certitude
{
  "request_id": "req_abc123",
  "status": "completed",
  "score": {
    "value": 72,
    "grade": "B",
    "certainty_coefficient": 0.87,
    "risk_tier": "acceptable"
  },
  "kyc": {
    "status": "verified",
    "level": "enhanced",
    "aml_screening": { "status": "clear", "pep": false }
  },
  "proof_sources": [
    { "type": "otp_verified", "certainty": 0.95 },
    { "type": "ussd_captured", "certainty": 0.88 },
    { "type": "sms_analyzed", "certainty": 0.92 }
  ],
  "credit_recommendation": {
    "max_amount": 2500000,
    "suggested_rate": 12.5,
    "max_tenor_months": 24
  }
}`;

const stats = [
  { value: "-35%", label: "Réduction NPL", icon: TrendingUp },
  { value: "87%", label: "Certitude moyenne", icon: Target },
  { value: "48h", label: "Intégration", icon: Clock },
  { value: "99.9%", label: "Uptime SLA", icon: Server },
];

// Capabilities intégrées dans WOUAKA PARTENAIRE (pas des produits séparés)
const capabilities = [
  {
    id: "scoring",
    name: "Score de Solvabilité",
    tech: "powered by W-SCORE",
    description: "Un score avec coefficient de certitude. Chaque composante est traçable, chaque preuve est vérifiable.",
    icon: BarChart3,
    color: "bg-secondary/10 text-secondary border-secondary/20",
    features: [
      "Score 0-100 avec grade A-E",
      "Coefficient de certitude 0.0-1.0",
      "5 catégories de données alternatives",
      "Explainability pour comités de crédit",
      "Risk tier avec recommandation crédit",
    ],
  },
  {
    id: "identity",
    name: "Vérification d'Identité",
    tech: "powered by W-KYC",
    description: "Transformez les 'clients invisibles' en clients bancarisables via données alternatives.",
    icon: FileCheck,
    color: "bg-primary/10 text-primary border-primary/20",
    features: [
      "OCR documents (CNI, Passeport)",
      "Liveness detection + Face Match",
      "OTP + USSD Capture",
      "Screening AML/PEP temps réel",
      "3 niveaux: Basic, Enhanced, Advanced",
    ],
  },
  {
    id: "dossier",
    name: "Dossier Complet",
    tech: "API unifiée",
    description: "Pipeline complet : vérification + scoring + AML en un seul appel API.",
    icon: CircuitBoard,
    color: "bg-info/10 text-info border-info/20",
    features: [
      "Un endpoint, dossier complet",
      "Orchestration intelligente",
      "Webhooks sur chaque étape",
      "Export PDF pour comités",
      "Audit trail intégré",
    ],
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
        title="WOUAKA PARTENAIRE - Infrastructure de Données Alternatives B2B"
        description="API Enterprise pour enrichir vos Core Banking Systems avec des données alternatives. Compatible T24, Flexcube. Réduisez vos NPL de 35%."
        keywords="API scoring bancaire, middleware données alternatives, Core Banking System, T24, Flexcube, inclusion financière B2B, fintech enterprise"
        canonical="/partenaires"
      />
      <Navbar />

      {/* Hero Section - Enterprise */}
      <section className="relative py-24 lg:py-32 hero-enterprise overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-secondary/8 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[80px] -translate-x-1/2" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="mb-6 bg-white/10 text-white border-white/15">
                <Network className="w-3 h-3 mr-1" />
                INFRASTRUCTURE ENTERPRISE
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight"
            >
              Le Middleware qui connecte{" "}
              <span className="text-secondary">l'informel</span> à votre Core Banking
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/75 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Une API, des dossiers de preuves certifiées avec coefficient de certitude. 
              Compatible T24, Flexcube, Finacle. Intégration en 48h.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 rounded-xl px-8 shadow-gold"
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
                className="border-white/20 text-white hover:bg-white/10 gap-2 rounded-xl px-8"
                asChild
              >
                <Link to="/developer">
                  <Code2 className="w-5 h-5" />
                  Documentation API
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
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <stat.icon className="w-4 h-4 text-secondary opacity-70" />
                    <p className="text-secondary font-bold text-2xl md:text-3xl">{stat.value}</p>
                  </div>
                  <p className="text-white/50 text-sm">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Capabilities Section - Unified under WOUAKA PARTENAIRE */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Layers className="w-3 h-3 mr-1" />
              WOUAKA PARTENAIRE
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Une API, des capacités complètes
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              WOUAKA PARTENAIRE intègre toutes les capacités nécessaires pour évaluer vos clients.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {capabilities.map((capability, i) => (
              <motion.div
                key={capability.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Card className="h-full card-interactive p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl ${capability.color} flex items-center justify-center border`}>
                      <capability.icon className="w-7 h-7" />
                    </div>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {capability.tech}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{capability.name}</h3>
                  <p className="text-muted-foreground mb-5">{capability.description}</p>
                  <ul className="space-y-2">
                    {capability.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-success flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section id="api" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Badge variant="secondary" className="mb-4">
                  <Code2 className="w-3 h-3 mr-1" />
                  API REST
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                  Un endpoint, un dossier complet
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  L'API WOUAKA CORE orchestre KYC + Score + AML en un seul appel. 
                  Chaque composante inclut son coefficient de certitude.
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    { icon: Cpu, title: "Latence < 150ms", desc: "P99 sur toutes les régions UEMOA" },
                    { icon: Workflow, title: "Webhooks temps réel", desc: "Notification sur chaque étape du pipeline" },
                    { icon: Database, title: "Sandbox illimité", desc: "Testez sans engagement ni limite" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button size="lg" className="gap-2" asChild>
                    <Link to="/auth?mode=signup&role=PARTENAIRE">
                      Créer un compte
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2" asChild>
                    <Link to="/developer">
                      Documentation
                    </Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="code-enterprise overflow-hidden rounded-xl">
                  <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-xs text-white/50 font-mono">wouaka-partenaire.js</span>
                    <Button variant="ghost" size="sm" onClick={copyCode} className="text-white/70 hover:text-white hover:bg-white/10">
                      {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className="p-6 overflow-x-auto text-sm max-h-[500px]">
                    <code className="text-white/90 font-mono whitespace-pre">{codeExample}</code>
                  </pre>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Sectors Section */}
      <section id="secteurs" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Globe className="w-3 h-3 mr-1" />
              PAR SECTEUR
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Solutions adaptées à votre métier
            </h2>
          </div>

          <Tabs defaultValue="banques" className="max-w-5xl mx-auto">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8 bg-muted/50">
              {sectors.map((sector) => (
                <TabsTrigger key={sector.id} value={sector.id} className="gap-2 data-[state=active]:bg-card">
                  <sector.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{sector.name.split(" ")[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {sectors.map((sector) => (
              <TabsContent key={sector.id} value={sector.id}>
                <Card className="p-8 card-enterprise">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                        <sector.icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">{sector.name}</h3>
                      <p className="text-muted-foreground mb-6 text-lg">{sector.description}</p>
                      <Button className="gap-2" asChild>
                        <Link to="/contact">
                          {sector.cta}
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Bénéfices clés</h4>
                      <ul className="space-y-3">
                        {sector.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                              <Check className="w-4 h-4 text-success" />
                            </div>
                            <span className="font-medium">{benefit}</span>
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

      {/* Security Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-success/10 text-success border-success/20">
              <Shield className="w-3 h-3 mr-1" />
              SÉCURITÉ & CONFORMITÉ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Infrastructure de classe bancaire
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
            {[
              { icon: Lock, title: "AES-256 + TLS 1.3", desc: "Chiffrement bout-en-bout" },
              { icon: Shield, title: "MFA & RBAC", desc: "Contrôle d'accès strict" },
              { icon: Eye, title: "Audit Trail", desc: "Journalisation immuable" },
              { icon: Server, title: "99.9% SLA", desc: "Haute disponibilité" },
            ].map((item, i) => (
              <Card key={i} className="p-6 text-center card-enterprise">
                <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {["Conforme BCEAO", "UEMOA Compliant", "RGPD Ready", "ISO 27001"].map((badge, i) => (
              <div key={i} className="security-badge">
                <BadgeCheck className="w-4 h-4" />
                <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Simulator - WOUAKA Insight */}
      <WouakaROISimulator />

      {/* Regional Use Cases */}
      <RegionalUseCases />

      {/* CTA Section */}
      <section className="py-20 hero-enterprise text-primary-foreground">
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
              Prêt à enrichir votre Core Banking ?
            </h2>
            <p className="text-primary-foreground/70 text-lg mb-10 max-w-2xl mx-auto">
              Intégration en 48h. Sandbox gratuit. Support technique dédié.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 rounded-xl px-8 shadow-gold"
                asChild
              >
                <Link to="/contact">
                  <Building2 className="w-5 h-5" />
                  Contacter l'équipe commerciale
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 gap-2 rounded-xl px-8"
                asChild
              >
                <Link to="/pricing">
                  Voir les tarifs
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Partenaires;
