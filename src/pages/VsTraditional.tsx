import { 
  Check, 
  X, 
  Building2, 
  Zap, 
  Clock, 
  DollarSign, 
  Users, 
  Globe, 
  Shield, 
  Smartphone,
  ArrowRight,
  AlertTriangle,
  Target,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/layout/PageHero";
import { SEOHead } from "@/components/seo/SEOHead";

const comparisonData = [
  {
    category: "Couverture population",
    wouaka: "100% de la population scorable",
    traditional: "10-15% (bancarisés uniquement)",
    wouakaWins: true,
  },
  {
    category: "Sources de données",
    wouaka: "Mobile Money, télécom, comportement digital, données marchandes",
    traditional: "Historique bancaire uniquement",
    wouakaWins: true,
  },
  {
    category: "Temps d'intégration",
    wouaka: "48 heures",
    traditional: "6-12 mois",
    wouakaWins: true,
  },
  {
    category: "Coût par score",
    wouaka: "Dès 2 500 FCFA",
    traditional: "5 000-15 000 FCFA",
    wouakaWins: true,
  },
  {
    category: "Modèles IA",
    wouaka: "Entraînés sur données africaines",
    traditional: "Modèles occidentaux adaptés",
    wouakaWins: true,
  },
  {
    category: "Documentation",
    wouaka: "En français, exemples de code",
    traditional: "En anglais, processus complexe",
    wouakaWins: true,
  },
  {
    category: "Support",
    wouaka: "Équipe locale, réponse < 24h",
    traditional: "Support international, délais variables",
    wouakaWins: true,
  },
  {
    category: "Conformité BCEAO",
    wouaka: "Native, dès la conception",
    traditional: "Adaptation nécessaire",
    wouakaWins: true,
  },
  {
    category: "Hébergement",
    wouaka: "Souverain (Afrique)",
    traditional: "International (Europe/US)",
    wouakaWins: true,
  },
  {
    category: "Historique mondial",
    wouaka: "Focus Afrique de l'Ouest",
    traditional: "Présence mondiale, décennies d'expérience",
    wouakaWins: false,
  },
];

const bureaux = [
  { name: "Experian", origin: "Irlande/UK", focus: "Global, faible présence Afrique" },
  { name: "TransUnion", origin: "USA", focus: "Afrique du Sud principalement" },
  { name: "Equifax", origin: "USA", focus: "Amériques, Europe" },
  { name: "CRIF", origin: "Italie", focus: "Europe, expansion Afrique limitée" },
];

const VsTraditional = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Wouaka vs Bureaux de crédit traditionnels"
        description="Comparez Wouaka aux bureaux de crédit traditionnels (Experian, TransUnion, CRIF). 100% de population scorable vs 15%. Intégration en 48h vs 6 mois. Coût 10x inférieur."
        keywords="Wouaka vs Experian, bureaux crédit Afrique, alternative TransUnion, scoring alternatif UEMOA"
        canonical="/vs-traditional"
      />
      <Navbar />

      {/* Hero */}
      <PageHero
        badge={{ icon: AlertTriangle, text: "Comparatif honnête" }}
        title="Wouaka vs Bureaux de crédit"
        titleHighlight="traditionnels"
        description="Nous ne prétendons pas être meilleurs partout. Mais là où ça compte pour l'Afrique, nous sommes imbattables."
        primaryCTA={{ label: "Parler à un expert", href: "/contact", icon: Phone }}
        secondaryCTA={{ label: "Voir notre impact", href: "/impact" }}
      />

      {/* Comparison Table */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                Comparatif détaillé
              </h2>
              <p className="text-muted-foreground">
                Une analyse transparente de nos forces et de nos limites.
              </p>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-4 font-semibold">Critère</th>
                      <th className="text-left p-4 font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-secondary" />
                          </div>
                          Wouaka
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          </div>
                          Bureaux traditionnels
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium">{row.category}</td>
                        <td className="p-4">
                          <div className="flex items-start gap-2">
                            {row.wouakaWins ? (
                              <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                            ) : (
                              <div className="w-5 h-5 flex-shrink-0" />
                            )}
                            <span className={row.wouakaWins ? "text-foreground" : "text-muted-foreground"}>
                              {row.wouaka}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-start gap-2">
                            {!row.wouakaWins ? (
                              <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="w-5 h-5 text-destructive/50 flex-shrink-0 mt-0.5" />
                            )}
                            <span className={!row.wouakaWins ? "text-foreground" : "text-muted-foreground"}>
                              {row.traditional}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* When to use what */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Quand utiliser quoi ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nous sommes honnêtes : les bureaux traditionnels ont leur place. Voici quand choisir l'un ou l'autre.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Wouaka */}
            <Card className="border-secondary">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-secondary">Choisissez Wouaka si...</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "Vous ciblez des clients non-bancarisés ou sous-bancarisés",
                  "Vous avez besoin d'une intégration rapide (jours, pas mois)",
                  "Votre budget scoring est limité",
                  "Vous opérez en zone UEMOA",
                  "Vous voulez des modèles adaptés au contexte africain",
                  "Vos clients utilisent principalement Mobile Money",
                  "Vous êtes une fintech ou microfinance",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Traditional */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle>Bureaux traditionnels si...</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "Vous ciblez exclusivement des clients bancarisés",
                  "Vous avez besoin d'un historique de crédit bancaire long",
                  "Vous opérez en dehors de l'Afrique de l'Ouest",
                  "Vous avez des exigences réglementaires spécifiques hors BCEAO",
                  "Vous avez déjà une intégration en place",
                  "Le temps et le coût d'intégration ne sont pas un problème",
                  "Vous avez besoin de données de crédit internationales",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-muted-foreground">
                    <div className="w-5 h-5 rounded-full border border-muted-foreground/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The bureaux */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Les acteurs traditionnels
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ces multinationales dominent le marché mondial, mais leur présence en Afrique de l'Ouest reste limitée.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {bureaux.map((bureau, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-1">{bureau.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{bureau.origin}</p>
                  <p className="text-xs text-muted-foreground">{bureau.focus}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why we built this */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">Notre mission</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Pourquoi nous avons créé Wouaka
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Les bureaux de crédit traditionnels ont été conçus pour des marchés où 90% de la population a un compte bancaire. 
              En Afrique de l'Ouest, c'est l'inverse : <strong className="text-foreground">85% de la population n'a pas accès au crédit formel</strong>.
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              Nous avons construit Wouaka pour <strong className="text-foreground">inclure ceux que les autres ignorent</strong>. 
              Pas parce que c'est facile, mais parce que c'est nécessaire.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2" asChild>
                <Link to="/developers">
                  Essayer gratuitement <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/impact">Voir notre impact</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-hero text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Prêt à passer à l'inclusion ?
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto">
            100 scores gratuits pour tester. Intégration en 48 heures. Support en français.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/contact">Parler à un expert</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/api-docs">Voir l'API</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VsTraditional;
