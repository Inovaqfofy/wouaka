import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Code2, 
  Key, 
  Webhook, 
  BookOpen, 
  Copy, 
  CheckCircle,
  Play,
  ArrowRight,
  Shield,
  Zap,
  Terminal,
  Package,
  FileCode,
  AlertCircle,
  Clock,
  BarChart3,
  Fingerprint,
  Database,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Globe,
  Building,
  Users,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DeveloperSidebar, CodeBlockEnhanced, ApiStatusWidget } from "@/components/developer";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Code examples for different languages
const codeExamples = {
  wscore: {
    javascript: `import { WouakaClient } from '@wouaka/sdk';

const wouaka = new WouakaClient({
  apiKey: process.env.WOUAKA_API_KEY
});

// Calculer un score de crédit
const result = await wouaka.score.calculate({
  phone_number: '+22507XXXXXXXX',
  full_name: 'Kouamé Jean',
  country: 'CI',
  consent: true
});

console.log(\`Score: \${result.score} (\${result.grade})\`);
console.log(\`Risque: \${result.risk_level}\`);
console.log(\`Recommandation: \${result.recommendation}\`);`,
    python: `from wouaka import WouakaClient
import os

client = WouakaClient(api_key=os.environ["WOUAKA_API_KEY"])

# Calculer un score de crédit
result = client.score.calculate(
    phone_number="+22507XXXXXXXX",
    full_name="Kouamé Jean",
    country="CI",
    consent=True
)

print(f"Score: {result.score} ({result.grade})")
print(f"Risque: {result.risk_level}")
print(f"Recommandation: {result.recommendation}")`,
    php: `<?php
use Wouaka\\WouakaClient;

$client = new WouakaClient(getenv('WOUAKA_API_KEY'));

// Calculer un score de crédit
$result = $client->score->calculate([
    'phone_number' => '+22507XXXXXXXX',
    'full_name' => 'Kouamé Jean',
    'country' => 'CI',
    'consent' => true
]);

echo "Score: {$result->score} ({$result->grade})\\n";
echo "Risque: {$result->risk_level}\\n";`,
    curl: `curl -X POST https://api.wouaka-creditscore.com/v1/score \\
  -H "Authorization: Bearer $WOUAKA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone_number": "+22507XXXXXXXX",
    "full_name": "Kouamé Jean",
    "country": "CI",
    "consent": true
  }'`
  },
  wkyc: {
    javascript: `// Vérification d'identité KYC
const result = await wouaka.kyc.verify({
  full_name: 'Kouamé Jean',
  national_id: 'CI1234567890',
  phone_number: '+22507XXXXXXXX',
  document_type: 'national_id',
  document_url: 'https://...'
});

if (result.verified) {
  console.log(\`Identité vérifiée avec un score de \${result.identity_score}%\`);
} else {
  console.log(\`Vérification échouée: \${result.failure_reason}\`);
}`,
    python: `# Vérification d'identité KYC
result = client.kyc.verify(
    full_name="Kouamé Jean",
    national_id="CI1234567890",
    phone_number="+22507XXXXXXXX",
    document_type="national_id",
    document_url="https://..."
)

if result.verified:
    print(f"Identité vérifiée: {result.identity_score}%")
else:
    print(f"Échec: {result.failure_reason}")`,
    php: `<?php
$result = $client->kyc->verify([
    'full_name' => 'Kouamé Jean',
    'national_id' => 'CI1234567890',
    'phone_number' => '+22507XXXXXXXX',
    'document_type' => 'national_id',
    'document_url' => 'https://...'
]);

if ($result->verified) {
    echo "Vérifié: {$result->identity_score}%";
}`,
    curl: `curl -X POST https://api.wouaka-creditscore.com/v1/kyc/verify \\
  -H "Authorization: Bearer $WOUAKA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "full_name": "Kouamé Jean",
    "national_id": "CI1234567890",
    "phone_number": "+22507XXXXXXXX",
    "document_type": "national_id"
  }'`
  }
};

const endpoints = [
  {
    method: "POST",
    path: "/v1/score",
    name: "Calculer un score",
    product: "scoring",
    description: "Calcule le score de crédit d'un individu basé sur ses données financières et comportementales.",
    params: [
      { name: "phone_number", type: "string", required: true, description: "Numéro de téléphone au format international" },
      { name: "full_name", type: "string", required: true, description: "Nom complet de l'individu" },
      { name: "country", type: "string", required: true, description: "Code pays ISO 3166-1 alpha-2 (CI, SN, ML...)" },
      { name: "consent", type: "boolean", required: true, description: "Consentement explicite du client" },
      { name: "national_id", type: "string", required: false, description: "Numéro d'identité nationale" },
      { name: "birth_date", type: "string", required: false, description: "Date de naissance (YYYY-MM-DD)" },
    ],
    response: {
      score: 72,
      grade: "B",
      risk_level: "low",
      confidence: 0.85,
      recommendation: "approved"
    }
  },
  {
    method: "POST",
    path: "/v1/kyc/verify",
    name: "Vérifier une identité",
    product: "kyc",
    description: "Vérifie l'identité d'un individu en comparant ses documents avec les bases de données officielles.",
    params: [
      { name: "full_name", type: "string", required: true, description: "Nom complet tel qu'il apparaît sur le document" },
      { name: "national_id", type: "string", required: true, description: "Numéro d'identité nationale" },
      { name: "phone_number", type: "string", required: true, description: "Numéro de téléphone" },
      { name: "document_type", type: "string", required: true, description: "Type de document: national_id, passport, driver_license" },
      { name: "document_url", type: "string", required: false, description: "URL du document uploadé" },
    ],
    response: {
      verified: true,
      identity_score: 92,
      fraud_score: 8,
      risk_level: "low"
    }
  },
  {
    method: "POST",
    path: "/v1/precheck",
    name: "Pré-vérification rapide",
    product: "scoring",
    description: "Vérifie rapidement l'éligibilité d'un prospect sans calculer le score complet.",
    params: [
      { name: "phone_number", type: "string", required: true, description: "Numéro de téléphone" },
      { name: "full_name", type: "string", required: false, description: "Nom complet" },
    ],
    response: {
      eligible: true,
      preliminary_grade: "B",
      data_available: true
    }
  },
  {
    method: "GET",
    path: "/v1/score/:id",
    name: "Récupérer un score",
    product: "scoring",
    description: "Récupère le détail d'un score précédemment calculé.",
    params: [
      { name: "id", type: "string", required: true, description: "Identifiant unique du score (req_xxx)" },
    ],
    response: {
      id: "req_abc123",
      score: 72,
      grade: "B",
      created_at: "2024-01-15T10:30:00Z"
    }
  }
];

const webhookEvents = [
  { event: "score.completed", description: "Score calculé avec succès" },
  { event: "score.failed", description: "Échec du calcul de score" },
  { event: "kyc.verified", description: "Vérification KYC réussie" },
  { event: "kyc.failed", description: "Échec de la vérification KYC" },
  { event: "kyc.pending_review", description: "Vérification en attente de revue manuelle" },
  { event: "alert.fraud_detected", description: "Alerte fraude détectée" },
  { event: "certificate.validated", description: "Certificat validé par un partenaire" },
];

const errorCodes = [
  { code: 200, name: "OK", description: "Requête réussie" },
  { code: 400, name: "Bad Request", description: "Paramètres invalides ou manquants" },
  { code: 401, name: "Unauthorized", description: "Clé API invalide ou expirée" },
  { code: 403, name: "Forbidden", description: "Accès refusé à cette ressource" },
  { code: 404, name: "Not Found", description: "Ressource non trouvée" },
  { code: 429, name: "Rate Limited", description: "Trop de requêtes, réessayez plus tard" },
  { code: 500, name: "Server Error", description: "Erreur serveur interne" },
];

const Developer = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [activeSection, setActiveSection] = useState("quickstart");
  
  // Section refs for scroll
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['quickstart', 'auth', 'sdk', 'scoring', 'kyc', 'endpoints', 'webhooks', 'signatures', 'errors', 'ratelimits'];
      for (const id of sections) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom > 150) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d] rounded-t-lg">
        <span className="text-xs text-secondary font-mono uppercase">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyCode(code, id)}
          className="gap-2 h-7 text-xs text-[#8b949e] hover:text-white"
        >
          {copiedCode === id ? (
            <>
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500">Copié!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copier
            </>
          )}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto bg-[#0d1117] text-[#c9d1d9] text-sm rounded-b-lg">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Documentation API Développeur | Portail WOUAKA"
        description="Documentation complète de l'API WOUAKA. Intégrez le scoring de crédit et la vérification d'identité en quelques lignes de code. SDK, webhooks, sandbox."
        keywords="API scoring crédit Afrique, documentation API KYC UEMOA, SDK fintech, webhooks, developer portal"
        canonical="/developer"
      />
      <Navbar />

      {/* Hero Section - Professional Design */}
      <section className="relative py-20 bg-gradient-to-br from-primary via-primary to-primary/90 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-6 bg-secondary/20 text-secondary border-secondary/30 text-sm px-4 py-1.5">
                <Code2 className="w-4 h-4 mr-2" />
                Portail Développeur v2.0
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Bâtissez l'avenir du crédit<br />
                <span className="text-secondary">avec l'API WOUAKA</span>
              </h1>
              
              <p className="text-xl text-white/80 mb-8 max-w-2xl">
                Simplifiez vos processus d'octroi avec une intégration de quelques lignes de code. 
                Documentation complète, SDK multi-langages, environnement sandbox.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2" asChild>
                  <Link to="/auth?mode=signup&role=PARTENAIRE">
                    <Key className="w-5 h-5" />
                    Obtenir mes clés API
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-2" asChild>
                  <Link to="/developer/sandbox">
                    <Play className="w-5 h-5" />
                    Tester en Sandbox
                  </Link>
                </Button>
              </div>
            </motion.div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-white/20">
              {[
                { label: "Latence moyenne", value: "< 200ms" },
                { label: "Uptime", value: "99.99%" },
                { label: "Pays UEMOA", value: "8" },
                { label: "Appels/mois", value: "10M+" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-secondary">{stat.value}</div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Sticky Sidebar */}
        <DeveloperSidebar activeSection={activeSection} onSectionClick={scrollToSection} />

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          
          {/* Quick Start Section */}
          <section id="quickstart" className="py-16 border-b">
            <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Quick Start</h2>
                  <p className="text-muted-foreground">Intégrez WOUAKA en 3 étapes</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-10">
                {[
                  { step: 1, title: "Créez un compte", desc: "Inscrivez-vous et choisissez votre plan", icon: Users },
                  { step: 2, title: "Générez vos clés", desc: "Créez une clé API depuis votre dashboard", icon: Key },
                  { step: 3, title: "Intégrez l'API", desc: "Utilisez notre SDK ou les endpoints REST", icon: Code2 },
                ].map((item) => (
                  <Card key={item.step} className="relative overflow-hidden border-primary/20 hover:border-primary/40 transition-colors">
                    <CardContent className="pt-6">
                      <div className="absolute top-4 right-4 text-5xl font-bold text-primary/10">{item.step}</div>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Code Example */}
              <Card className="bg-[#0d1117] border-[#30363d]">
                <CardHeader className="border-b border-[#30363d]">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-secondary" />
                      Votre premier appel API
                    </CardTitle>
                    <Badge className="bg-secondary/20 text-secondary border-secondary/30">5 minutes</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <CodeBlockEnhanced
                    code={codeExamples.wscore.javascript}
                    language="javascript"
                    title="score-example.js"
                    showLineNumbers
                  />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Authentication Section */}
          <section id="auth" className="py-16 bg-muted/30 border-b">
            <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Key className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Authentification</h2>
                  <p className="text-muted-foreground">Sécurisez vos appels API avec OAuth2</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Lock className="w-5 h-5 text-primary" />
                        Bearer Token
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        Toutes les requêtes doivent inclure votre clé API dans l'en-tête 
                        <code className="mx-1 px-2 py-0.5 bg-muted rounded text-sm">Authorization</code>.
                      </p>
                      <CodeBlock 
                        code={`Authorization: Bearer wk_live_xxxxxxxxxx`}
                        language="http"
                        id="auth-header"
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-secondary/30 bg-secondary/5">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-secondary mt-0.5" />
                        <div>
                          <h4 className="font-semibold mb-1">Environnements</h4>
                          <ul className="text-sm text-muted-foreground space-y-2">
                            <li><code className="text-secondary">wk_test_</code> → Mode sandbox (pas de consommation)</li>
                            <li><code className="text-secondary">wk_live_</code> → Mode production</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Base URL</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Production</Badge>
                          </div>
                          <code className="text-sm font-mono">https://api.wouaka-creditscore.com/v1</code>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">Sandbox</Badge>
                          </div>
                          <code className="text-sm font-mono">https://sandbox.wouaka-creditscore.com/v1</code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* SDK Installation */}
          <section id="sdk" className="py-16 border-b">
            <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Installation SDK</h2>
                  <p className="text-muted-foreground">SDKs officiels pour tous les langages</p>
                </div>
              </div>

              <Tabs defaultValue="npm" className="mb-8">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="npm">npm</TabsTrigger>
                  <TabsTrigger value="yarn">yarn</TabsTrigger>
                  <TabsTrigger value="pip">pip</TabsTrigger>
                  <TabsTrigger value="composer">composer</TabsTrigger>
                </TabsList>
                <div className="mt-4">
                  <TabsContent value="npm">
                    <CodeBlock code="npm install @wouaka/sdk" language="bash" id="npm-install" />
                  </TabsContent>
                  <TabsContent value="yarn">
                    <CodeBlock code="yarn add @wouaka/sdk" language="bash" id="yarn-install" />
                  </TabsContent>
                  <TabsContent value="pip">
                    <CodeBlock code="pip install wouaka-sdk" language="bash" id="pip-install" />
                  </TabsContent>
                  <TabsContent value="composer">
                    <CodeBlock code="composer require wouaka/sdk" language="bash" id="composer-install" />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </section>

          {/* Scoring API */}
          <section id="scoring" className="py-16 bg-muted/30 border-b">
            <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Scoring API</h2>
                  <p className="text-muted-foreground">Calcul de score de crédit en temps réel</p>
                </div>
              </div>

              <Tabs defaultValue="javascript" className="mb-8">
                <TabsList className="mb-4">
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="php">PHP</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>
                {Object.entries(codeExamples.wscore).map(([lang, code]) => (
                  <TabsContent key={lang} value={lang}>
                    <CodeBlockEnhanced code={code} language={lang} showLineNumbers />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </section>

          {/* KYC API */}
          <section id="kyc" className="py-16 border-b">
            <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Fingerprint className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Vérification API</h2>
                  <p className="text-muted-foreground">Vérification d'identité KYC/AML</p>
                </div>
              </div>

              <Tabs defaultValue="javascript" className="mb-8">
                <TabsList className="mb-4">
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="php">PHP</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>
                {Object.entries(codeExamples.wkyc).map(([lang, code]) => (
                  <TabsContent key={lang} value={lang}>
                    <CodeBlockEnhanced code={code} language={lang} showLineNumbers />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </section>

          {/* Endpoints Reference */}
          <section id="endpoints" className="py-16 bg-muted/30 border-b">
            <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileCode className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Référence API</h2>
                  <p className="text-muted-foreground">Tous les endpoints disponibles</p>
                </div>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                {endpoints.map((endpoint, i) => (
                  <AccordionItem key={i} value={`endpoint-${i}`} className="bg-card border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <Badge variant={endpoint.method === "GET" ? "secondary" : "default"} className={endpoint.method === "POST" ? "bg-emerald-500" : ""}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono">{endpoint.path}</code>
                        <span className="text-muted-foreground text-sm ml-2">{endpoint.name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4">
                        <p className="text-muted-foreground">{endpoint.description}</p>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Paramètres</h4>
                          <div className="space-y-2">
                            {endpoint.params.map((param, j) => (
                              <div key={j} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                <code className="text-sm text-primary font-mono">{param.name}</code>
                                <Badge variant="outline" className="text-xs">{param.type}</Badge>
                                {param.required && <Badge variant="destructive" className="text-xs">requis</Badge>}
                                <span className="text-sm text-muted-foreground flex-1">{param.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Exemple de réponse</h4>
                          <CodeBlock 
                            code={JSON.stringify(endpoint.response, null, 2)} 
                            language="json" 
                            id={`response-${i}`} 
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* Webhooks */}
          <section id="webhooks" className="py-16 border-b">
            <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Webhook className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Webhooks</h2>
                  <p className="text-muted-foreground">Notifications en temps réel</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        Configurez vos URLs de webhook depuis votre tableau de bord partenaire. 
                        Soyez notifié instantanément lors des événements importants.
                      </p>
                      <Button variant="outline" asChild>
                        <Link to="/dashboard/partner/webhooks">
                          Configurer mes webhooks
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Événements disponibles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {webhookEvents.map((event, i) => (
                          <div key={i} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded">
                            <code className="text-xs font-mono text-secondary">{event.event}</code>
                            <span className="text-sm text-muted-foreground">{event.description}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card id="signatures">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="w-5 h-5 text-primary" />
                      Vérification de signature HMAC
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Chaque webhook inclut une signature HMAC-SHA256 dans l'en-tête 
                      <code className="mx-1 px-2 py-0.5 bg-muted rounded text-sm">X-Wouaka-Signature</code>.
                    </p>
                    <CodeBlockEnhanced 
                      code={`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const computed = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computed)
  );
}`}
                      language="javascript"
                      title="verify-webhook.js"
                      showLineNumbers
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Errors */}
          <section id="errors" className="py-16 bg-muted/30 border-b">
            <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Codes d'erreur</h2>
                  <p className="text-muted-foreground">Gestion des erreurs HTTP</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      {errorCodes.map((error, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Badge variant={error.code >= 500 ? "destructive" : error.code >= 400 ? "secondary" : "outline"}>
                            {error.code}
                          </Badge>
                          <div className="flex-1">
                            <span className="font-medium">{error.name}</span>
                            <p className="text-sm text-muted-foreground">{error.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Format d'erreur</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeBlockEnhanced 
                      code={`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Le numéro de téléphone est invalide",
    "field": "phone_number",
    "details": {
      "expected_format": "+225XXXXXXXXX"
    }
  },
  "request_id": "req_abc123"
}`}
                      language="json"
                      title="error-response.json"
                      showLineNumbers
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Rate Limits */}
          <section id="ratelimits" className="py-16 border-b">
            <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Rate Limits</h2>
                  <p className="text-muted-foreground">Limites de requêtes par plan</p>
                </div>
              </div>

              <Card>
                <CardContent className="pt-6 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Plan</th>
                        <th className="text-left py-3 px-4 font-semibold">Requêtes/min</th>
                        <th className="text-left py-3 px-4 font-semibold">Évaluations/mois</th>
                        <th className="text-left py-3 px-4 font-semibold">Vérifications/mois</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4"><Badge variant="outline">Starter</Badge></td>
                        <td className="py-3 px-4">60</td>
                        <td className="py-3 px-4">25</td>
                        <td className="py-3 px-4">10</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><Badge variant="secondary">Business</Badge></td>
                        <td className="py-3 px-4">120</td>
                        <td className="py-3 px-4">85</td>
                        <td className="py-3 px-4">50</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4"><Badge className="bg-primary">Enterprise</Badge></td>
                        <td className="py-3 px-4">300</td>
                        <td className="py-3 px-4">500</td>
                        <td className="py-3 px-4">200</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4"><Badge className="bg-secondary text-secondary-foreground">Custom</Badge></td>
                        <td className="py-3 px-4">Sur mesure</td>
                        <td className="py-3 px-4">Illimité</td>
                        <td className="py-3 px-4">Illimité</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card className="mt-6 border-secondary/30 bg-secondary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-secondary mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">En-têtes de réponse</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Chaque réponse inclut des en-têtes pour surveiller votre consommation :
                      </p>
                      <div className="grid sm:grid-cols-3 gap-2 text-sm">
                        <code className="px-2 py-1 bg-muted rounded">X-RateLimit-Limit</code>
                        <code className="px-2 py-1 bg-muted rounded">X-RateLimit-Remaining</code>
                        <code className="px-2 py-1 bg-muted rounded">X-RateLimit-Reset</code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-gradient-to-br from-primary to-primary/90">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Prêt à intégrer WOUAKA ?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                Rejoignez les institutions financières et fintechs qui font confiance à WOUAKA pour leurs décisions de crédit.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" asChild>
                  <Link to="/auth?mode=signup&role=PARTENAIRE">
                    Créer un compte gratuit
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
                  <Link to="/contact">
                    Contacter l'équipe commerciale
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Status Footer */}
          <section className="py-8 bg-muted/30 border-t">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <ApiStatusWidget />
              </div>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Developer;
