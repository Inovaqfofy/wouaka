import { 
  Users, 
  Building2, 
  Globe, 
  TrendingUp, 
  Heart,
  Banknote,
  ArrowRight,
  Target,
  Zap,
  Star,
  MapPin,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/layout/PageHero";
import { SEOHead } from "@/components/seo/SEOHead";

const impactStats = [
  { 
    value: "2.5M+", 
    label: "Personnes scorées pour la première fois",
    description: "Des individus qui n'avaient jamais eu accès au crédit formel",
    icon: Users,
  },
  { 
    value: "12Mds", 
    label: "FCFA de crédits débloqués",
    description: "Grâce aux scores Wouaka, des crédits approuvés",
    icon: Banknote,
  },
  { 
    value: "50+", 
    label: "Institutions partenaires",
    description: "Banques, IMF, fintech qui ont choisi l'inclusion",
    icon: Building2,
  },
  { 
    value: "8", 
    label: "Pays UEMOA couverts",
    description: "Sénégal, Côte d'Ivoire, Mali, Burkina Faso, Bénin, Togo, Niger, Guinée-Bissau",
    icon: Globe,
  },
];

const successStories = [
  {
    title: "Une IMF sénégalaise double son portefeuille",
    description: "Grâce aux données alternatives, cette institution de microfinance a pu scorer et accepter 40% de clients supplémentaires qu'elle refusait auparavant.",
    metric: "+40%",
    metricLabel: "Clients acceptés",
    location: "Sénégal",
    type: "Microfinance",
  },
  {
    title: "Une fintech ivoirienne réduit ses coûts de 80%",
    description: "L'intégration en 2 jours et le coût par score réduit ont permis à cette fintech de proposer des micro-crédits rentables.",
    metric: "-80%",
    metricLabel: "Coût par scoring",
    location: "Côte d'Ivoire",
    type: "Fintech",
  },
  {
    title: "Une banque malienne améliore sa gestion des risques",
    description: "En combinant les scores traditionnels avec Wouaka, cette banque a réduit son taux de défaut de 35% sur les nouveaux clients.",
    metric: "-35%",
    metricLabel: "Taux de défaut",
    location: "Mali",
    type: "Banque",
  },
];

const countries = [
  { name: "Sénégal", flag: "🇸🇳", active: true },
  { name: "Côte d'Ivoire", flag: "🇨🇮", active: true },
  { name: "Mali", flag: "🇲🇱", active: true },
  { name: "Burkina Faso", flag: "🇧🇫", active: true },
  { name: "Bénin", flag: "🇧🇯", active: true },
  { name: "Togo", flag: "🇹🇬", active: true },
  { name: "Niger", flag: "🇳🇪", active: true },
  { name: "Guinée-Bissau", flag: "🇬🇼", active: true },
];

const Impact = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Notre impact en Afrique de l'Ouest"
        description="2.5M+ personnes scorées pour la première fois, 12 milliards FCFA de crédits débloqués. Impact concret de l'inclusion financière Wouaka dans les 8 pays UEMOA."
        keywords="impact inclusion financière, crédits Afrique, scoring non-bancarisés, UEMOA fintech"
        canonical="/impact"
      />
      <Navbar />

      {/* Hero */}
      <PageHero
        badge={{ icon: Heart, text: "Notre Impact" }}
        title="L'inclusion financière,"
        titleHighlight="en chiffres"
        description="Chaque score que nous délivrons est une opportunité d'accès au crédit pour quelqu'un qui en était exclu. Voici notre impact concret."
        primaryCTA={{ label: "Rejoindre le mouvement", href: "/contact", icon: Phone }}
        secondaryCTA={{ label: "Voir les solutions", href: "/solutions" }}
      />

      {/* Main Stats */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {impactStats.map((stat, i) => (
              <Card key={i} className="text-center card-premium">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-8 h-8 text-secondary" />
                  </div>
                  <div className="font-display text-4xl font-bold text-foreground mb-2">{stat.value}</div>
                  <p className="font-semibold mb-1">{stat.label}</p>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem We Solve */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <Badge variant="outline" className="mb-4 border-destructive/50 text-destructive">Le problème</Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                L'exclusion financière en Afrique de l'Ouest
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">85% de la population</strong> de la zone UEMOA n'a pas accès au crédit formel. 
                  Pas parce qu'ils ne sont pas solvables, mais parce que les outils traditionnels ne savent pas les évaluer.
                </p>
                <p>
                  Les bureaux de crédit classiques (Experian, TransUnion, CRIF) utilisent des modèles conçus pour des marchés 
                  où 90% des gens ont un compte bancaire. Ils ne fonctionnent tout simplement pas ici.
                </p>
                <p>
                  <strong className="text-foreground">Résultat ?</strong> Des millions de personnes solvables, avec des revenus réguliers 
                  via Mobile Money, sont systématiquement exclues du crédit.
                </p>
              </div>
            </div>
            
            <Card className="p-8 text-center bg-destructive/5 border-destructive/30">
              <div className="font-display text-7xl font-bold text-destructive mb-4">85%</div>
              <p className="text-xl font-semibold mb-2">Exclus du crédit formel</p>
              <p className="text-muted-foreground">
                Sur 100 adultes en zone UEMOA, 85 n'ont jamais pu accéder à un crédit bancaire
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Solution */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <Card className="p-8 text-center bg-secondary/5 border-secondary/30 order-2 lg:order-1">
              <div className="font-display text-7xl font-bold text-secondary mb-4">100%</div>
              <p className="text-xl font-semibold mb-2">Scorables avec Wouaka</p>
              <p className="text-muted-foreground">
                Grâce aux données alternatives, nous pouvons évaluer la totalité de la population
              </p>
            </Card>
            
            <div className="order-1 lg:order-2">
              <Badge variant="secondary" className="mb-4">Notre solution</Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                Données alternatives, impact réel
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Wouaka utilise les données qui <strong className="text-foreground">existent vraiment</strong> en Afrique : 
                  transactions Mobile Money, stabilité télécom, comportement digital, historique marchand.
                </p>
                <p>
                  Nos modèles d'IA sont <strong className="text-foreground">entraînés sur des données africaines</strong>, 
                  pas adaptés de modèles occidentaux. Ils comprennent l'économie informelle.
                </p>
                <p>
                  <strong className="text-foreground">Résultat ?</strong> Des millions de personnes peuvent enfin accéder 
                  au crédit, créer des entreprises, développer leurs activités.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Success Stories</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Histoires de succès
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Des institutions qui ont choisi l'inclusion et les résultats qu'elles ont obtenus.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {successStories.map((story, i) => (
              <Card key={i} className="card-premium">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-secondary" />
                    <span className="text-sm text-muted-foreground">{story.location}</span>
                    <Badge variant="outline" className="ml-auto text-xs">{story.type}</Badge>
                  </div>
                  <CardTitle className="text-lg">{story.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{story.description}</p>
                  <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
                    <div className="font-display text-2xl font-bold text-secondary">{story.metric}</div>
                    <div className="text-sm text-muted-foreground">{story.metricLabel}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Map */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Couverture</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Zone UEMOA couverte
            </h2>
            <p className="text-muted-foreground">
              Présents dans les 8 pays de l'Union Économique et Monétaire Ouest-Africaine
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            {countries.map((country, i) => (
              <Card key={i} className={`px-6 py-4 ${country.active ? 'border-secondary/50' : 'opacity-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{country.flag}</span>
                  <span className="font-medium">{country.name}</span>
                  {country.active && <Zap className="w-4 h-4 text-secondary" />}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">Notre vision</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Un score pour tous. Personne n'est invisible.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Notre objectif : que chaque adulte en Afrique de l'Ouest puisse accéder au crédit s'il est solvable, 
              indépendamment de son statut bancaire. C'est possible. Nous le prouvons chaque jour.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2" asChild>
                <Link to="/contact">
                  Rejoindre le mouvement <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/developers">Tester l'API</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-hero text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Prêt à faire partie de l'histoire ?
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto">
            Chaque institution qui rejoint Wouaka contribue à l'inclusion financière de millions d'Africains.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/contact">Parlons de votre projet</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Impact;
