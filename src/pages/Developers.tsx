import { useState } from "react";
import { 
  Code2, 
  Copy, 
  Check, 
  Zap, 
  Clock, 
  BookOpen,
  Terminal,
  Play,
  Shield,
  Globe,
  Webhook,
  Key,
  FileJson,
  Braces
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/layout/PageHero";
import { SEOHead } from "@/components/seo/SEOHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiPlayground } from "@/components/api/ApiPlayground";

const codeExamples = {
  curl: `curl -X POST https://api.wouaka-creditscore.com/v1/score \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone_number": "+221771234567",
    "full_name": "Amadou Diallo"
  }'`,
  javascript: `const response = await fetch('https://api.wouaka-creditscore.com/v1/score', {
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
console.log(\`Score: \${score}, Risque: \${risk_level}\`);`,
  python: `import requests

response = requests.post(
    'https://api.wouaka-creditscore.com/v1/score',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'phone_number': '+221771234567',
        'full_name': 'Amadou Diallo'
    }
)

data = response.json()
print(f"Score: {data['score']}, Risque: {data['risk_level']}")`,
  php: `<?php
$ch = curl_init('https://api.wouaka-creditscore.com/v1/score');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'phone_number' => '+221771234567',
    'full_name' => 'Amadou Diallo'
]));

$response = json_decode(curl_exec($ch), true);
echo "Score: " . $response['score'] . ", Risque: " . $response['risk_level'];
?>`,
};

const endpoints = [
  {
    method: "POST",
    path: "/v1/score",
    name: "Inclusion Score",
    description: "Score complet avec 4 indicateurs business",
    price: "5 000 FCFA",
  },
  {
    method: "POST",
    path: "/v1/precheck",
    name: "Pre-Check",
    description: "Pré-scoring instantané < 2s",
    price: "2 500 FCFA",
  },
  {
    method: "POST",
    path: "/v1/business",
    name: "Business Score",
    description: "Scoring entreprises et commerces",
    price: "10 000 FCFA",
  },
  {
    method: "POST",
    path: "/v1/identity",
    name: "Identity Check",
    description: "Vérification KYC enrichie",
    price: "7 500 FCFA",
  },
  {
    method: "POST",
    path: "/v1/fraud",
    name: "Fraud Shield",
    description: "Détection de fraude",
    price: "7 500 FCFA",
  },
  {
    method: "POST",
    path: "/v1/rbi",
    name: "RBI Score",
    description: "Repayment Behavior Index (0-10)",
    price: "5 000 FCFA",
  },
];

const Developers = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Hub Développeurs - API Documentation"
        description="Intégrez l'API Wouaka en 5 minutes. Documentation en français, 100 scores gratuits, SDK JavaScript/Python/PHP. Sandbox illimité. Réponse en moins de 2s."
        keywords="API scoring crédit, documentation développeur, SDK fintech, intégration API Afrique, webhook scoring"
        canonical="/developers"
      />
      <Navbar />

      {/* Hero */}
      <PageHero
        badge={{ icon: Terminal, text: "Developer Hub" }}
        title="Intégrez en"
        titleHighlight="5 minutes"
        description="API REST simple. Documentation en français. 100 scores gratuits pour commencer. Pas de réunions. Pas de contrats. Juste du code."
        primaryCTA={{ label: "Obtenir une clé API", href: "/auth", icon: Key }}
        secondaryCTA={{ label: "Documentation complète", href: "/api-docs", icon: BookOpen }}
      >
        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-10">
          <div className="text-center">
            <div className="font-display text-3xl font-bold text-secondary">100</div>
            <div className="text-sm opacity-70">Scores gratuits/mois</div>
          </div>
          <div className="text-center">
            <div className="font-display text-3xl font-bold text-secondary">&lt; 2s</div>
            <div className="text-sm opacity-70">Temps de réponse</div>
          </div>
          <div className="text-center">
            <div className="font-display text-3xl font-bold text-secondary">99.9%</div>
            <div className="text-sm opacity-70">Uptime garanti</div>
          </div>
          <div className="text-center">
            <div className="font-display text-3xl font-bold text-secondary">FR</div>
            <div className="text-sm opacity-70">Doc en français</div>
          </div>
        </div>
      </PageHero>

      {/* API Playground */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Play className="w-3 h-3 mr-1" />
              Playground
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Testez notre API <span className="text-gradient">sans inscription</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explorez tous nos endpoints. Voyez les requêtes et réponses en temps réel. 
              Aucune clé API requise pour le mode démo.
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <ApiPlayground />
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Quick Start</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Votre premier score en 3 étapes
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  step: "1",
                  title: "Créez un compte",
                  description: "Inscription gratuite, clé API instantanée",
                  icon: Key,
                },
                {
                  step: "2",
                  title: "Copiez le code",
                  description: "Exemples prêts à l'emploi ci-dessous",
                  icon: Code2,
                },
                {
                  step: "3",
                  title: "Scorez !",
                  description: "Résultat en moins de 2 secondes",
                  icon: Zap,
                },
              ].map((item, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                      <span className="font-display text-xl font-bold text-secondary">{item.step}</span>
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Code Examples */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-slate-900 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-slate-400 text-sm">Wouaka API - Inclusion Score</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="javascript" className="w-full">
                  <div className="bg-slate-800 px-4">
                    <TabsList className="bg-transparent border-0 h-12">
                      <TabsTrigger value="curl" className="data-[state=active]:bg-slate-700 text-slate-300">cURL</TabsTrigger>
                      <TabsTrigger value="javascript" className="data-[state=active]:bg-slate-700 text-slate-300">JavaScript</TabsTrigger>
                      <TabsTrigger value="python" className="data-[state=active]:bg-slate-700 text-slate-300">Python</TabsTrigger>
                      <TabsTrigger value="php" className="data-[state=active]:bg-slate-700 text-slate-300">PHP</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  {Object.entries(codeExamples).map(([lang, code]) => (
                    <TabsContent key={lang} value={lang} className="m-0">
                      <div className="relative bg-slate-900 p-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-4 right-4 text-slate-400 hover:text-white"
                          onClick={() => copyCode(code, lang)}
                        >
                          {copiedCode === lang ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <pre className="text-slate-300 text-sm overflow-x-auto font-mono">
                          {code}
                        </pre>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Response Example */}
            <Card className="mt-6 overflow-hidden">
              <CardHeader className="bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Réponse JSON</span>
                </div>
              </CardHeader>
              <CardContent className="bg-slate-900 p-6">
                <pre className="text-slate-300 text-sm overflow-x-auto font-mono">
{`{
  "success": true,
  "score": 78,
  "grade": "B+",
  "reliability": 82,
  "stability": 75,
  "short_term_risk": 71,
  "engagement_capacity": 84,
  "risk_level": "low",
  "confidence": 92,
  "processing_time_ms": 1824
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Endpoints</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tous nos endpoints
            </h2>
            <p className="text-muted-foreground">
              Une API, plusieurs produits. Tarification transparente.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {endpoints.map((endpoint, i) => (
                <Card key={i} className="hover:border-secondary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Badge variant="outline" className="font-mono text-xs bg-secondary/10 text-secondary border-secondary/30">
                          {endpoint.method}
                        </Badge>
                        <code className="font-mono text-sm">{endpoint.path}</code>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{endpoint.name}</p>
                        <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-display font-bold text-secondary">{endpoint.price}</span>
                        <span className="text-xs text-muted-foreground">/requête</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Conçu pour les développeurs
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Clock,
                title: "Temps de réponse < 2s",
                description: "API optimisée pour la performance. 99.9% uptime garanti.",
              },
              {
                icon: Webhook,
                title: "Webhooks configurables",
                description: "Recevez des notifications en temps réel sur vos endpoints.",
              },
              {
                icon: Shield,
                title: "Authentification sécurisée",
                description: "Clés API avec permissions granulaires et rotation.",
              },
              {
                icon: Globe,
                title: "Sandbox illimité",
                description: "Testez autant que vous voulez. Données de test réalistes.",
              },
              {
                icon: Braces,
                title: "SDKs à venir",
                description: "JavaScript, Python, PHP. Bientôt disponibles.",
              },
              {
                icon: BookOpen,
                title: "Documentation FR",
                description: "Guides, tutoriels et exemples en français.",
              },
            ].map((feature, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-hero text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Prêt à coder ?
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto">
            100 scores gratuits. Pas de carte bancaire. Clé API en 30 secondes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="gap-2" asChild>
              <Link to="/auth">
                <Key className="w-5 h-5" />
                Créer un compte gratuit
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2" asChild>
              <Link to="/api-docs">
                <BookOpen className="w-5 h-5" />
                Lire la documentation
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Developers;
