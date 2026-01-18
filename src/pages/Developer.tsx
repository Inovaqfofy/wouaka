import { useState } from "react";
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
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { PageHero } from "@/components/layout/PageHero";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Code examples for different languages
const codeExamples = {
  wscore: {
    javascript: `// Installation: npm install @wouaka/sdk
import { WouakaClient } from '@wouaka/sdk';

const wouaka = new WouakaClient({
  apiKey: 'YOUR_API_KEY'
});

// Calculer un score de crédit
const result = await wouaka.score.calculate({
  phone_number: '+22507XXXXXXXX',
  full_name: 'Kouamé Jean',
  consent: true,
  // Optionnel
  national_id: 'CI1234567890',
  birth_date: '1990-05-15'
});

console.log(result);
// {
//   score: 72,
//   grade: "B",
//   risk_level: "low",
//   confidence: 0.85,
//   factors: [...],
//   recommendation: "approved"
// }`,
    python: `# Installation: pip install wouaka-sdk
from wouaka import WouakaClient

client = WouakaClient(api_key="YOUR_API_KEY")

# Calculer un score de crédit
result = client.score.calculate(
    phone_number="+22507XXXXXXXX",
    full_name="Kouamé Jean",
    consent=True,
    # Optionnel
    national_id="CI1234567890",
    birth_date="1990-05-15"
)

print(result)
# {
#   "score": 72,
#   "grade": "B",
#   "risk_level": "low",
#   "confidence": 0.85,
#   "factors": [...],
#   "recommendation": "approved"
# }`,
    php: `<?php
// Installation: composer require wouaka/sdk

use Wouaka\\WouakaClient;

$client = new WouakaClient('YOUR_API_KEY');

// Calculer un score de crédit
$result = $client->score->calculate([
    'phone_number' => '+22507XXXXXXXX',
    'full_name' => 'Kouamé Jean',
    'consent' => true,
    // Optionnel
    'national_id' => 'CI1234567890',
    'birth_date' => '1990-05-15'
]);

print_r($result);
// Array(
//   "score" => 72,
//   "grade" => "B",
//   "risk_level" => "low",
//   ...
// )`,
    curl: `curl -X POST https://api.wouaka-creditscore.com/v1/score \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone_number": "+22507XXXXXXXX",
    "full_name": "Kouamé Jean",
    "consent": true,
    "national_id": "CI1234567890",
    "birth_date": "1990-05-15"
  }'

# Réponse:
# {
#   "score": 72,
#   "grade": "B",
#   "risk_level": "low",
#   "confidence": 0.85,
#   "factors": [...],
#   "recommendation": "approved"
# }`
  },
  wkyc: {
    javascript: `// Vérifier l'identité d'un client
const result = await wouaka.kyc.verify({
  full_name: 'Kouamé Jean',
  national_id: 'CI1234567890',
  phone_number: '+22507XXXXXXXX',
  document_type: 'national_id',
  document_url: 'https://...' // URL du document uploadé
});

console.log(result);
// {
//   verified: true,
//   identity_score: 92,
//   fraud_score: 8,
//   checks: {
//     document_valid: true,
//     face_match: true,
//     registry_match: true
//   },
//   risk_flags: []
// }`,
    python: `# Vérifier l'identité d'un client
result = client.kyc.verify(
    full_name="Kouamé Jean",
    national_id="CI1234567890",
    phone_number="+22507XXXXXXXX",
    document_type="national_id",
    document_url="https://..."  # URL du document uploadé
)

print(result)
# {
#   "verified": True,
#   "identity_score": 92,
#   "fraud_score": 8,
#   "checks": {...},
#   "risk_flags": []
# }`,
    php: `<?php
// Vérifier l'identité d'un client
$result = $client->kyc->verify([
    'full_name' => 'Kouamé Jean',
    'national_id' => 'CI1234567890',
    'phone_number' => '+22507XXXXXXXX',
    'document_type' => 'national_id',
    'document_url' => 'https://...'
]);

print_r($result);`,
    curl: `curl -X POST https://api.wouaka-creditscore.com/v1/kyc/verify \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "full_name": "Kouamé Jean",
    "national_id": "CI1234567890",
    "phone_number": "+22507XXXXXXXX",
    "document_type": "national_id",
    "document_url": "https://..."
  }'`
  }
};

const endpoints = [
  {
    method: "POST",
    path: "/v1/score",
    name: "Calculer un score",
    product: "W-SCORE",
    description: "Calcule le score de crédit d'un individu basé sur ses données alternatives.",
    params: [
      { name: "phone_number", type: "string", required: true, description: "Numéro de téléphone au format international (+225...)" },
      { name: "full_name", type: "string", required: true, description: "Nom complet du client" },
      { name: "consent", type: "boolean", required: true, description: "Consentement explicite du client" },
      { name: "national_id", type: "string", required: false, description: "Numéro de pièce d'identité" },
      { name: "birth_date", type: "string", required: false, description: "Date de naissance (YYYY-MM-DD)" },
    ],
    response: {
      score: 72,
      grade: "B",
      risk_level: "low",
      confidence: 0.85,
      factors: [
        { name: "mobile_money_activity", score: 78, weight: 0.25 },
        { name: "telecom_stability", score: 85, weight: 0.20 }
      ],
      recommendation: "approved"
    }
  },
  {
    method: "POST",
    path: "/v1/kyc/verify",
    name: "Vérifier l'identité",
    product: "W-KYC",
    description: "Vérifie l'identité d'un client via OCR et registres officiels.",
    params: [
      { name: "full_name", type: "string", required: true, description: "Nom complet à vérifier" },
      { name: "national_id", type: "string", required: true, description: "Numéro de pièce d'identité" },
      { name: "phone_number", type: "string", required: false, description: "Numéro de téléphone" },
      { name: "document_type", type: "string", required: true, description: "Type de document (national_id, passport, driver_license)" },
      { name: "document_url", type: "string", required: true, description: "URL du document uploadé" },
    ],
    response: {
      verified: true,
      identity_score: 92,
      fraud_score: 8,
      checks: {
        document_valid: true,
        face_match: true,
        registry_match: true,
        not_expired: true
      },
      risk_flags: []
    }
  },
  {
    method: "GET",
    path: "/v1/score/:id",
    name: "Récupérer un score",
    product: "W-SCORE",
    description: "Récupère les détails d'un score précédemment calculé.",
    params: [
      { name: "id", type: "string", required: true, description: "ID du score (path parameter)" },
    ],
    response: {
      id: "score_abc123",
      created_at: "2026-01-11T10:30:00Z",
      score: 72,
      grade: "B",
      status: "completed"
    }
  },
  {
    method: "POST",
    path: "/v1/enrich",
    name: "Enrichir un profil",
    product: "WOUAKA CORE",
    description: "Enrichit un profil client avec des données alternatives multi-sources.",
    params: [
      { name: "phone_number", type: "string", required: true, description: "Numéro de téléphone" },
      { name: "full_name", type: "string", required: false, description: "Nom complet" },
      { name: "sources", type: "array", required: false, description: "Sources à interroger (mobile_money, telecom, utility, etc.)" },
    ],
    response: {
      profile_id: "prof_xyz789",
      sources_queried: ["mobile_money", "telecom", "utility"],
      data: {
        mobile_money: { provider: "Orange Money", active_months: 24, avg_balance: 150000 },
        telecom: { provider: "Orange CI", tenure_months: 36, data_usage: "high" }
      },
      confidence: 0.88
    }
  }
];

const webhookEvents = [
  { event: "score.completed", description: "Un score a été calculé avec succès" },
  { event: "score.failed", description: "Le calcul du score a échoué" },
  { event: "kyc.verified", description: "Une vérification KYC a réussi" },
  { event: "kyc.rejected", description: "Une vérification KYC a été rejetée" },
  { event: "kyc.pending_review", description: "Une vérification KYC nécessite une revue manuelle" },
  { event: "profile.enriched", description: "Un profil a été enrichi avec succès" },
  { event: "subscription.renewed", description: "Votre abonnement a été renouvelé" },
  { event: "quota.warning", description: "Vous approchez de votre limite de quota (80%)" },
];

const errorCodes = [
  { code: 400, name: "Bad Request", description: "Paramètres invalides ou manquants" },
  { code: 401, name: "Unauthorized", description: "Clé API manquante ou invalide" },
  { code: 403, name: "Forbidden", description: "Accès refusé (quota dépassé, plan insuffisant)" },
  { code: 404, name: "Not Found", description: "Ressource non trouvée" },
  { code: 422, name: "Unprocessable Entity", description: "Données valides mais impossibles à traiter" },
  { code: 429, name: "Too Many Requests", description: "Rate limit atteint (attendez avant de réessayer)" },
  { code: 500, name: "Internal Server Error", description: "Erreur serveur (contactez le support)" },
];

const Developer = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [playgroundEndpoint, setPlaygroundEndpoint] = useState("/v1/score");
  const [playgroundBody, setPlaygroundBody] = useState(JSON.stringify({
    phone_number: "+22507XXXXXXXX",
    full_name: "Kouamé Jean",
    consent: true
  }, null, 2));
  const [playgroundResponse, setPlaygroundResponse] = useState<string | null>(null);
  const [isPlaygroundLoading, setIsPlaygroundLoading] = useState(false);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const runPlayground = async () => {
    setIsPlaygroundLoading(true);
    // Simulate API response
    setTimeout(() => {
      const mockResponse = {
        score: Math.floor(Math.random() * 30) + 60,
        grade: ["A", "B", "B+", "C"][Math.floor(Math.random() * 4)],
        risk_level: ["low", "medium", "low"][Math.floor(Math.random() * 3)],
        confidence: (Math.random() * 0.2 + 0.75).toFixed(2),
        processing_time_ms: Math.floor(Math.random() * 500) + 200,
        request_id: `req_${Math.random().toString(36).substr(2, 9)}`
      };
      setPlaygroundResponse(JSON.stringify(mockResponse, null, 2));
      setIsPlaygroundLoading(false);
    }, 1500);
  };

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative">
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b rounded-t-lg">
        <span className="text-sm text-muted-foreground font-mono">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyCode(code, id)}
          className="gap-2"
        >
          {copiedCode === id ? (
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
      <pre className="p-4 overflow-x-auto bg-[#1e1e1e] text-[#d4d4d4] text-sm rounded-b-lg">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Documentation API Développeur"
        description="Documentation complète de l'API Wouaka. Intégrez le scoring de crédit et la vérification d'identité en quelques lignes de code. SDK, webhooks, playground."
        keywords="API scoring crédit Afrique, documentation API KYC UEMOA, SDK fintech, webhooks"
        canonical="/developer"
      />
      <Navbar />

      <PageHero
        badge={{ icon: Code2, text: "Documentation Développeur" }}
        title="Intégrez Wouaka"
        titleHighlight="en quelques minutes"
        description="Documentation complète, SDK multi-langages, playground interactif. Tout ce dont vous avez besoin pour intégrer W-SCORE, W-KYC et WOUAKA CORE."
        primaryCTA={{ label: "Obtenir mes clés API", href: "/auth?mode=signup&role=PARTENAIRE" }}
        secondaryCTA={{ label: "Voir les tarifs", href: "/pricing" }}
      />

      {/* Quick Start */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                <Zap className="w-3 h-3 mr-1" />
                Démarrage rapide
              </Badge>
              <h2 className="text-3xl font-bold mb-4">3 étapes pour commencer</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="card-premium text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-secondary">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Créez un compte</h3>
                  <p className="text-sm text-muted-foreground">
                    Inscrivez-vous et choisissez votre plan d'abonnement
                  </p>
                </CardContent>
              </Card>
              <Card className="card-premium text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-secondary">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Générez vos clés</h3>
                  <p className="text-sm text-muted-foreground">
                    Créez une clé API depuis votre tableau de bord
                  </p>
                </CardContent>
              </Card>
              <Card className="card-premium text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-secondary">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Intégrez l'API</h3>
                  <p className="text-sm text-muted-foreground">
                    Utilisez notre SDK ou les endpoints REST
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* SDK Installation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Installation du SDK
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="npm">
                  <TabsList className="mb-4">
                    <TabsTrigger value="npm">npm</TabsTrigger>
                    <TabsTrigger value="yarn">yarn</TabsTrigger>
                    <TabsTrigger value="pip">pip</TabsTrigger>
                    <TabsTrigger value="composer">composer</TabsTrigger>
                  </TabsList>
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
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section id="auth" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Authentification</h2>
                <p className="text-muted-foreground">Sécurisez vos appels API avec vos clés</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Comment ça marche</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Toutes les requêtes à l'API Wouaka doivent inclure votre clé API dans l'en-tête 
                      <code className="mx-1 px-2 py-0.5 bg-muted rounded text-sm">Authorization</code>.
                    </p>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800">Important</p>
                          <p className="text-sm text-amber-700">
                            Ne partagez jamais vos clés API. Utilisez des variables d'environnement 
                            côté serveur. En cas de fuite, régénérez immédiatement vos clés.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Types de clés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="bg-green-50 text-green-700">Live</Badge>
                        <div>
                          <p className="font-medium">Clé de production</p>
                          <p className="text-sm text-muted-foreground">
                            Pour les appels en production. Chaque requête est comptabilisée dans votre quota.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">Test</Badge>
                        <div>
                          <p className="font-medium">Clé de test</p>
                          <p className="text-sm text-muted-foreground">
                            Pour le développement. Retourne des données simulées, non comptabilisée.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <CodeBlock 
                  code={`// En-tête d'authentification
const headers = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
};

// Avec le SDK (recommandé)
import { WouakaClient } from '@wouaka/sdk';

const wouaka = new WouakaClient({
  apiKey: process.env.WOUAKA_API_KEY,
  // Optionnel: mode test
  sandbox: false
});

// La clé est automatiquement incluse dans chaque requête
const result = await wouaka.score.calculate({...});`}
                  language="javascript"
                  id="auth-example"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section id="endpoints" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCode className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Référence API</h2>
                <p className="text-muted-foreground">Tous les endpoints disponibles</p>
              </div>
            </div>

            <div className="mb-6 text-sm">
              <span className="text-muted-foreground">Base URL: </span>
              <code className="px-2 py-1 bg-muted rounded">https://api.wouaka-creditscore.com</code>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {endpoints.map((endpoint, i) => (
                <AccordionItem key={i} value={`endpoint-${i}`} className="border rounded-lg bg-background">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className={endpoint.method === "POST" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono">{endpoint.path}</code>
                      <span className="text-muted-foreground text-sm">— {endpoint.name}</span>
                      <Badge variant="secondary" className="ml-auto">{endpoint.product}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-muted-foreground mb-4">{endpoint.description}</p>
                    
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Paramètres</h4>
                        <div className="space-y-2">
                          {endpoint.params.map((param, j) => (
                            <div key={j} className="p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-sm font-mono">{param.name}</code>
                                <Badge variant="outline" className="text-xs">{param.type}</Badge>
                                {param.required && <Badge variant="destructive" className="text-xs">requis</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">{param.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Réponse</h4>
                        <pre className="p-4 bg-[#1e1e1e] text-[#d4d4d4] text-sm rounded-lg overflow-x-auto">
                          <code>{JSON.stringify(endpoint.response, null, 2)}</code>
                        </pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section id="examples" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Exemples de code</h2>
                <p className="text-muted-foreground">Intégration en JavaScript, Python, PHP et cURL</p>
              </div>
            </div>

            <Tabs defaultValue="wscore" className="mb-8">
              <TabsList className="mb-6">
                <TabsTrigger value="wscore" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  W-SCORE
                </TabsTrigger>
                <TabsTrigger value="wkyc" className="gap-2">
                  <Fingerprint className="w-4 h-4" />
                  W-KYC
                </TabsTrigger>
              </TabsList>

              {["wscore", "wkyc"].map((product) => (
                <TabsContent key={product} value={product}>
                  <Card>
                    <CardContent className="pt-6">
                      <Tabs value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <TabsList className="mb-4">
                          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                          <TabsTrigger value="python">Python</TabsTrigger>
                          <TabsTrigger value="php">PHP</TabsTrigger>
                          <TabsTrigger value="curl">cURL</TabsTrigger>
                        </TabsList>
                        {["javascript", "python", "php", "curl"].map((lang) => (
                          <TabsContent key={lang} value={lang}>
                            <CodeBlock 
                              code={codeExamples[product as keyof typeof codeExamples][lang as keyof typeof codeExamples.wscore]} 
                              language={lang} 
                              id={`${product}-${lang}`}
                            />
                          </TabsContent>
                        ))}
                      </Tabs>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </section>

      {/* Playground */}
      <section id="playground" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <Play className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Playground</h2>
                <p className="text-muted-foreground">Testez l'API en direct (mode sandbox)</p>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Endpoint</Label>
                      <Select value={playgroundEndpoint} onValueChange={setPlaygroundEndpoint}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="/v1/score">POST /v1/score</SelectItem>
                          <SelectItem value="/v1/kyc/verify">POST /v1/kyc/verify</SelectItem>
                          <SelectItem value="/v1/enrich">POST /v1/enrich</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Corps de la requête (JSON)</Label>
                      <Textarea 
                        value={playgroundBody}
                        onChange={(e) => setPlaygroundBody(e.target.value)}
                        className="font-mono text-sm h-48"
                      />
                    </div>
                    <Button onClick={runPlayground} disabled={isPlaygroundLoading} className="w-full gap-2">
                      {isPlaygroundLoading ? (
                        <>Exécution...</>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Exécuter
                        </>
                      )}
                    </Button>
                  </div>
                  <div>
                    <Label>Réponse</Label>
                    <div className="mt-2 h-[280px] bg-[#1e1e1e] rounded-lg overflow-auto">
                      {playgroundResponse ? (
                        <pre className="p-4 text-[#d4d4d4] text-sm">
                          <code>{playgroundResponse}</code>
                        </pre>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          <p>La réponse apparaîtra ici</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Webhooks */}
      <section id="webhooks" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Webhook className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Webhooks</h2>
                <p className="text-muted-foreground">Recevez des notifications en temps réel</p>
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
                      Configurez vos webhooks depuis votre tableau de bord partenaire. 
                      Vous pouvez souscrire aux événements qui vous intéressent.
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
                    <CardTitle className="text-lg">Vérification de signature</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Chaque webhook inclut une signature HMAC-SHA256 dans l'en-tête 
                      <code className="mx-1 px-2 py-0.5 bg-muted rounded text-sm">X-Wouaka-Signature</code>.
                      Vérifiez-la pour vous assurer de l'authenticité.
                    </p>
                    <CodeBlock 
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
                      id="webhook-verify"
                    />
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Événements disponibles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {webhookEvents.map((event, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <code className="text-sm font-mono text-secondary">{event.event}</code>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Error Handling */}
      <section id="errors" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Gestion des erreurs</h2>
                <p className="text-muted-foreground">Codes HTTP et format des erreurs</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Codes d'erreur</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {errorCodes.map((error, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Badge variant={error.code >= 500 ? "destructive" : error.code >= 400 ? "secondary" : "outline"}>
                          {error.code}
                        </Badge>
                        <div>
                          <p className="font-medium">{error.name}</p>
                          <p className="text-sm text-muted-foreground">{error.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Format de réponse d'erreur</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock 
                    code={`{
  "error": {
    "code": "INVALID_PHONE_NUMBER",
    "message": "Le numéro de téléphone doit être au format international",
    "details": {
      "field": "phone_number",
      "provided": "07XXXXXXXX",
      "expected": "+225XXXXXXXXX"
    }
  },
  "request_id": "req_abc123",
  "timestamp": "2026-01-11T10:30:00Z"
}`}
                    language="json"
                    id="error-format"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section id="limits" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Rate Limits</h2>
                <p className="text-muted-foreground">Limites de requêtes par plan</p>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Plan</th>
                        <th className="text-left py-3 px-4 font-semibold">Requêtes/min</th>
                        <th className="text-left py-3 px-4 font-semibold">W-SCORE/mois</th>
                        <th className="text-left py-3 px-4 font-semibold">W-KYC/mois</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4">Starter</td>
                        <td className="py-3 px-4">60</td>
                        <td className="py-3 px-4">25</td>
                        <td className="py-3 px-4">10</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Business</td>
                        <td className="py-3 px-4">120</td>
                        <td className="py-3 px-4">85</td>
                        <td className="py-3 px-4">50</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">Enterprise</td>
                        <td className="py-3 px-4">Illimité</td>
                        <td className="py-3 px-4">Sur mesure</td>
                        <td className="py-3 px-4">Illimité</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Les en-têtes de réponse incluent <code className="px-1 bg-muted rounded">X-RateLimit-Remaining</code> et 
                  <code className="px-1 bg-muted rounded ml-1">X-RateLimit-Reset</code> pour suivre votre consommation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-hero text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Prêt à intégrer Wouaka ?
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Créez votre compte et obtenez vos clés API en quelques minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth?mode=signup&role=PARTENAIRE">
                Créer un compte partenaire
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/contact">Contacter l'équipe</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Developer;
