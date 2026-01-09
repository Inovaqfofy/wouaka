import { 
  Code, Copy, Check, ChevronRight, Zap, Shield, Globe, 
  Terminal, ArrowRight, Building2, Clock, Phone
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/layout/PageHero";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";

const codeExamples = {
  simple: `// Évaluez un client en une seule requête
const response = await fetch('https://api.wouaka.com/v1/evaluate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    client_id: 'client_123',
    // Données client minimales requises
  })
});

const result = await response.json();
console.log(result.score);        // 74
console.log(result.risk_level);   // "low"
console.log(result.recommendation); // "approve"`,
  webhook: `// Recevez les résultats en temps réel
app.post('/webhook/wouaka', (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'evaluation.completed') {
    console.log('Score:', data.score);
    console.log('Décision:', data.recommendation);
    // Mettez à jour votre système
  }
  
  res.status(200).send('OK');
});`,
  batch: `// Traitez plusieurs évaluations en lot
const results = await wouaka.evaluations.createBatch({
  clients: [
    { id: 'client_1', /* ... */ },
    { id: 'client_2', /* ... */ },
    { id: 'client_3', /* ... */ },
  ]
});

console.log(results.summary);
// { total: 3, approved: 2, review: 1, rejected: 0 }`,
};

const ApiDocs = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Documentation API"
        description="Documentation complète de l'API Wouaka. Exemples de code, webhooks, traitement par lots. Intégration en quelques heures. Support dédié."
        keywords="API documentation, webhook scoring, intégration crédit, REST API fintech"
        canonical="/api-docs"
      />
      <Navbar />

      {/* Hero */}
      <PageHero
        badge={{ icon: Code, text: "API & Intégrations" }}
        title="Intégrez Wouaka"
        titleHighlight="en quelques heures"
        description="Une API simple et puissante pour automatiser vos décisions de crédit. Documentation complète, environnement de test et support dédié."
        primaryCTA={{ label: "Obtenir mes clés API", href: "/auth", icon: Terminal }}
        secondaryCTA={{ label: "Parler à un expert", href: "/contact", icon: Phone }}
      >
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm mt-8">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-secondary" />
            <span>Authentification sécurisée</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-secondary" />
            <span>99.9% de disponibilité</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-secondary" />
            <span>Réponse en moins de 2 secondes</span>
          </div>
        </div>
      </PageHero>

      {/* Avantages API */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: Clock,
                title: "Intégration rapide",
                description: "Opérationnel en quelques heures, pas en semaines",
              },
              {
                icon: Zap,
                title: "Haute performance",
                description: "Latence moyenne inférieure à 200ms",
              },
              {
                icon: Shield,
                title: "Sécurité maximale",
                description: "Chiffrement de bout en bout, clés rotatives",
              },
              {
                icon: Building2,
                title: "Support dédié",
                description: "Équipe technique à votre disposition",
              },
            ].map((benefit, i) => (
              <Card key={i} className="card-premium text-center">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-base">{benefit.title}</CardTitle>
                  <CardDescription className="text-sm">{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">Exemples de code</Badge>
              <h2 className="font-display text-3xl font-bold mb-4">
                Simple à intégrer, puissant à utiliser
              </h2>
              <p className="text-muted-foreground">
                Quelques lignes de code suffisent pour évaluer vos clients
              </p>
            </div>
            
            <Card className="card-premium">
              <CardContent className="pt-6">
                <Tabs defaultValue="simple" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="simple">Évaluation simple</TabsTrigger>
                    <TabsTrigger value="webhook">Webhooks</TabsTrigger>
                    <TabsTrigger value="batch">Traitement en lot</TabsTrigger>
                  </TabsList>
                  {Object.entries(codeExamples).map(([key, code]) => (
                    <TabsContent key={key} value={key}>
                      <div className="relative">
                        <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{code}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyCode(code, key)}
                        >
                          {copiedCode === key ? (
                            <Check className="w-4 h-4 text-secondary" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Fonctionnalités API */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Fonctionnalités</Badge>
            <h2 className="font-display text-3xl font-bold mb-4">
              Tout ce dont vous avez besoin
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Évaluation de solvabilité",
                description: "Obtenez un score fiable et une recommandation claire pour chaque client",
              },
              {
                title: "Vérification d'identité",
                description: "Validez l'identité de vos clients de manière automatisée",
              },
              {
                title: "Webhooks configurables",
                description: "Recevez les résultats en temps réel sur vos endpoints",
              },
              {
                title: "Traitement en lot",
                description: "Évaluez des milliers de clients en une seule requête",
              },
              {
                title: "Environnement de test",
                description: "Testez votre intégration sans impacter vos quotas",
              },
              {
                title: "Logs et analytics",
                description: "Suivez vos consommations et performances en temps réel",
              },
            ].map((feature, i) => (
              <Card key={i} className="card-premium">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comment démarrer */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Démarrage rapide</Badge>
            <h2 className="font-display text-3xl font-bold mb-4">
              Opérationnel en 3 étapes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Créez votre compte",
                description: "Inscrivez-vous et accédez à votre tableau de bord en quelques minutes",
              },
              {
                step: "02",
                title: "Obtenez vos clés",
                description: "Générez vos clés API pour l'environnement de test puis de production",
              },
              {
                step: "03",
                title: "Intégrez et lancez",
                description: "Suivez notre documentation et commencez à évaluer vos clients",
              },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex w-16 h-16 rounded-2xl bg-primary text-primary-foreground items-center justify-center font-display text-2xl font-bold mb-4">
                  {step.step}
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {i < 2 && (
                  <ArrowRight className="hidden md:block w-6 h-6 text-border mx-auto mt-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-hero text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Prêt à automatiser vos décisions ?
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Créez votre compte et commencez à intégrer Wouaka dès aujourd'hui. 
            Notre équipe est là pour vous accompagner.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="gap-2" asChild>
              <Link to="/auth">
                Créer mon compte
                <ChevronRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/contact">Parler à un expert</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ApiDocs;
