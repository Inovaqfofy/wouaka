import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import { 
  Building2, 
  Zap, 
  Target, 
  TrendingUp,
  Shield,
  Clock,
  Users,
  ChevronRight,
  Check,
  ArrowRight,
  BarChart3,
  FileCheck,
  Banknote,
  Globe,
  Smartphone,
  Eye,
  AlertTriangle,
  Phone,
  Star,
  Layers
} from "lucide-react";

const Solutions = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("secteurs");

  // Handle hash navigation
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash === "produits") {
      setActiveTab("produits");
    } else {
      setActiveTab("secteurs");
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Solutions par secteur et produit"
        description="Solutions Wouaka adaptées aux banques, microfinance, fintech et télécoms. Business Score, Agent Mobile, Wouaka Watch. Réduisez le risque crédit de 85%."
        keywords="solution scoring banque, microfinance Afrique, fintech API, credit scoring entreprise, Business Score"
        canonical="/solutions"
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-hero text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              <Layers className="w-3 h-3 mr-1" />
              Solutions Wouaka
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
              Des solutions adaptées
              <span className="block text-secondary">à chaque métier</span>
            </h1>
            <p className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto mb-8">
              Que vous soyez une banque, une fintech ou une entreprise, Wouaka s'adapte à vos besoins 
              spécifiques pour optimiser vos décisions de crédit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="gap-2" asChild>
                <Link to="/contact">
                  <Phone className="w-4 h-4" />
                  Parler à un expert
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/pricing">Voir les tarifs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "85%", label: "Réduction du risque crédit" },
              { value: "< 2s", label: "Temps de réponse moyen" },
              { value: "99.9%", label: "Disponibilité garantie" },
              { value: "+40%", label: "Augmentation des approbations" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="secteurs" className="gap-2">
                  <Building2 className="w-4 h-4" />
                  Par secteur
                </TabsTrigger>
                <TabsTrigger value="produits" className="gap-2">
                  <Target className="w-4 h-4" />
                  Par produit
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Par Secteur */}
            <TabsContent value="secteurs" className="space-y-20">
              {/* Banques */}
              <div id="banques" className="scroll-mt-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <Badge variant="outline" className="mb-4">
                      <Building2 className="w-3 h-3 mr-1" />
                      Banques & Établissements financiers
                    </Badge>
                    <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                      Réduisez le risque, accélérez les décisions
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      Optimisez votre portefeuille de crédit avec des évaluations fiables et rapides. 
                      Notre technologie propriétaire analyse les profils en temps réel pour vous aider 
                      à prendre les bonnes décisions.
                    </p>
                    <ul className="space-y-3 mb-8">
                      {[
                        "Évaluation instantanée des demandeurs",
                        "Réduction significative des impayés",
                        "Intégration avec vos systèmes existants",
                        "Rapports de conformité automatisés",
                        "Support dédié aux institutions",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-secondary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button size="lg" className="gap-2" asChild>
                      <Link to="/contact">
                        Demander une démo
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: TrendingUp, value: "85%", label: "Réduction du risque" },
                      { icon: Clock, value: "< 2s", label: "Temps de réponse" },
                      { icon: Users, value: "+40%", label: "Clients qualifiés" },
                      { icon: Shield, value: "100%", label: "Conforme BCEAO" },
                    ].map((stat, i) => (
                      <Card key={i} className="card-premium text-center p-6">
                        <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {/* Microfinance */}
              <div id="microfinance" className="scroll-mt-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="order-2 lg:order-1">
                    <Card className="card-premium p-8">
                      <div className="text-center mb-6">
                        <BarChart3 className="w-16 h-16 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Inclusion financière à grande échelle</h3>
                        <p className="text-muted-foreground">
                          Atteignez des populations auparavant exclues du système financier grâce à notre scoring adapté.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-primary">+40%</div>
                          <div className="text-sm text-muted-foreground">Clients qualifiés</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-primary">÷3</div>
                          <div className="text-sm text-muted-foreground">Coûts d'analyse</div>
                        </div>
                      </div>
                    </Card>
                  </div>
                  <div className="order-1 lg:order-2">
                    <Badge variant="outline" className="mb-4">
                      <Users className="w-3 h-3 mr-1" />
                      Microfinance & IMF
                    </Badge>
                    <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                      L'inclusion financière à grande échelle
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      Étendez votre portée aux populations non bancarisées avec un scoring adapté aux micro-crédits 
                      et aux profils informels.
                    </p>
                    <ul className="space-y-3 mb-8">
                      {[
                        "Scoring adapté aux micro-crédits",
                        "Données alternatives (mobile money, télécom)",
                        "Interface simplifiée pour agents terrain",
                        "Mode hors-ligne disponible",
                        "Coûts divisés par 3",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-secondary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button size="lg" className="gap-2" asChild>
                      <Link to="/contact">
                        Parler à un expert
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Fintech */}
              <div id="fintech" className="scroll-mt-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <Badge variant="outline" className="mb-4">
                      <Zap className="w-3 h-3 mr-1" />
                      Fintech & Néobanques
                    </Badge>
                    <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                      Automatisez vos flux de crédit
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      Intégrez notre API en quelques heures et automatisez entièrement vos décisions de crédit. 
                      Conçue pour les volumes importants et les exigences de performance des acteurs digitaux.
                    </p>
                    <ul className="space-y-3 mb-8">
                      {[
                        "API REST haute performance",
                        "Documentation complète et SDK",
                        "Webhooks configurables",
                        "Environnement de test dédié",
                        "Scalabilité automatique",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-secondary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button size="lg" className="gap-2" asChild>
                      <Link to="/developers">
                        Explorer l'API
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: Zap, title: "API performante", desc: "< 200ms de latence" },
                      { icon: Globe, title: "Scalable", desc: "Millions de requêtes" },
                      { icon: BarChart3, title: "Analytics", desc: "Tableaux de bord temps réel" },
                      { icon: FileCheck, title: "Webhooks", desc: "Notifications instantanées" },
                    ].map((feature, i) => (
                      <Card key={i} className="card-premium p-6">
                        <feature.icon className="w-8 h-8 text-primary mb-3" />
                        <h4 className="font-semibold mb-1">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {/* Télécoms */}
              <div id="telecoms" className="scroll-mt-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="order-2 lg:order-1">
                    <Card className="card-premium p-8">
                      <div className="text-center mb-6">
                        <Smartphone className="w-16 h-16 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Partenariats data stratégiques</h3>
                        <p className="text-muted-foreground">
                          Monétisez vos données dans le respect de la vie privée tout en contribuant à l'inclusion financière.
                        </p>
                      </div>
                      <div className="space-y-3">
                        {[
                          "Anonymisation et sécurité des données",
                          "Revenus additionnels sur vos data",
                          "Impact social positif",
                          "Conformité RGPD et BCEAO",
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-secondary" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                  <div className="order-1 lg:order-2">
                    <Badge variant="outline" className="mb-4">
                      <Smartphone className="w-3 h-3 mr-1" />
                      Télécoms & Mobile Money
                    </Badge>
                    <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                      Partenariats data et scoring
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      Collaborez avec Wouaka pour créer des solutions de scoring innovantes basées sur vos données télécom 
                      et mobile money, dans le respect strict de la vie privée.
                    </p>
                    <Button size="lg" className="gap-2" asChild>
                      <Link to="/contact">
                        Discuter d'un partenariat
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Par Produit */}
            <TabsContent value="produits" className="space-y-20">
              {/* Business Score */}
              <div id="business-score" className="scroll-mt-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <Badge variant="outline" className="mb-4">
                      <Building2 className="w-3 h-3 mr-1" />
                      Business Score
                    </Badge>
                    <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                      Scoring des commerces et PME
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      Évaluez la solvabilité des entreprises formelles et informelles grâce à notre 
                      scoring adapté au contexte africain.
                    </p>
                    <ul className="space-y-3 mb-8">
                      {[
                        "Analyse des flux de trésorerie",
                        "Historique des transactions mobile money",
                        "Réputation commerciale locale",
                        "Ancienneté et stabilité de l'activité",
                        "Score de 0 à 100 avec grade",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-secondary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-3">
                      <Button size="lg" className="gap-2" asChild>
                        <Link to="/scoring">
                          Essayer maintenant
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </Button>
                      <Button size="lg" variant="outline" asChild>
                        <Link to="/pricing">Voir les tarifs</Link>
                      </Button>
                    </div>
                  </div>
                  <Card className="card-premium p-8">
                    <div className="text-center mb-6">
                      <Banknote className="w-16 h-16 text-primary mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Optimisez votre trésorerie</h3>
                      <p className="text-muted-foreground">
                        Réduisez vos impayés et améliorez votre DSO grâce à une meilleure qualification.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">-45%</div>
                        <div className="text-sm text-muted-foreground">Créances douteuses</div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">+20%</div>
                        <div className="text-sm text-muted-foreground">Délais respectés</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Agent Mobile */}
              <div id="agent-mobile" className="scroll-mt-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="order-2 lg:order-1 grid grid-cols-2 gap-4">
                    {[
                      { icon: Smartphone, title: "Mode hors-ligne", desc: "Fonctionne sans connexion" },
                      { icon: Clock, title: "Sync auto", desc: "Synchronisation automatique" },
                      { icon: Users, title: "Multi-agents", desc: "Gestion d'équipes terrain" },
                      { icon: Shield, title: "Sécurisé", desc: "Données cryptées" },
                    ].map((feature, i) => (
                      <Card key={i} className="card-premium p-6">
                        <feature.icon className="w-8 h-8 text-primary mb-3" />
                        <h4 className="font-semibold mb-1">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                      </Card>
                    ))}
                  </div>
                  <div className="order-1 lg:order-2">
                    <Badge variant="outline" className="mb-4">
                      <Smartphone className="w-3 h-3 mr-1" />
                      Agent Mobile
                    </Badge>
                    <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                      Application pour agents terrain
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      Équipez vos agents de terrain avec une application mobile puissante qui fonctionne 
                      même sans connexion internet.
                    </p>
                    <ul className="space-y-3 mb-8">
                      {[
                        "Mode hors-ligne complet",
                        "Capture de documents par photo",
                        "Scoring instantané sur le terrain",
                        "Géolocalisation des visites",
                        "Rapports automatisés",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-secondary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button size="lg" className="gap-2" asChild>
                      <Link to="/contact">
                        Demander une démo
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Wouaka Watch */}
              <div id="wouaka-watch" className="scroll-mt-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <Badge variant="outline" className="mb-4">
                      <Eye className="w-3 h-3 mr-1" />
                      Wouaka Watch
                    </Badge>
                    <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                      Monitoring en temps réel
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      Surveillez en continu l'évolution du profil de risque de vos clients et recevez 
                      des alertes instantanées en cas de changement significatif.
                    </p>
                    <ul className="space-y-3 mb-8">
                      {[
                        "Alertes en temps réel",
                        "Détection des changements de comportement",
                        "Tableaux de bord personnalisables",
                        "Rapports périodiques automatiques",
                        "Intégration webhook",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-secondary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button size="lg" className="gap-2" asChild>
                      <Link to="/contact">
                        En savoir plus
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </Button>
                  </div>
                  <Card className="card-premium p-8">
                    <div className="text-center mb-6">
                      <Eye className="w-16 h-16 text-primary mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Anticipez les risques</h3>
                      <p className="text-muted-foreground">
                        Soyez alerté avant que les problèmes ne surviennent.
                      </p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: "Baisse de score significative", color: "bg-destructive" },
                        { label: "Changement de comportement", color: "bg-yellow-500" },
                        { label: "Nouveau flag de risque", color: "bg-orange-500" },
                      ].map((alert, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className={`w-3 h-3 rounded-full ${alert.color}`} />
                          <span className="text-sm">{alert.label}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>

              {/* Fraud Shield */}
              <div id="fraud-shield" className="scroll-mt-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="order-2 lg:order-1">
                    <Card className="card-premium p-8">
                      <div className="text-center mb-6">
                        <AlertTriangle className="w-16 h-16 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Détection multicouche</h3>
                        <p className="text-muted-foreground">
                          Plusieurs niveaux de vérification pour une protection maximale.
                        </p>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: "Cohérence identité", score: 95 },
                          { label: "Cohérence comportementale", score: 88 },
                          { label: "Détection anomalies", score: 92 },
                        ].map((item, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{item.label}</span>
                              <span className="font-medium">{item.score}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all" 
                                style={{ width: `${item.score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                  <div className="order-1 lg:order-2">
                    <Badge variant="outline" className="mb-4">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Fraud Shield
                    </Badge>
                    <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                      Détection de fraude avancée
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      Protégez-vous contre les tentatives de fraude grâce à notre système de détection 
                      multicouche basé sur l'IA.
                    </p>
                    <ul className="space-y-3 mb-8">
                      {[
                        "Vérification de cohérence identitaire",
                        "Analyse comportementale",
                        "Détection des anomalies en temps réel",
                        "Score de fraude de 0 à 100",
                        "Flags détaillés avec explications",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-secondary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button size="lg" className="gap-2" asChild>
                      <Link to="/contact">
                        Demander une démo
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Avantages Enterprise */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Avantages exclusifs</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pourquoi les grandes institutions nous choisissent
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Conformité BCEAO garantie",
                description: "Opérez en toute sérénité avec une plateforme conforme aux exigences réglementaires de la zone UEMOA.",
              },
              {
                icon: Globe,
                title: "Infrastructure souveraine",
                description: "Vos données sensibles restent hébergées en Afrique, sur des serveurs dédiés et sécurisés.",
              },
              {
                icon: TrendingUp,
                title: "ROI mesurable",
                description: "Nos clients constatent une réduction moyenne de 85% des impayés dès les premiers mois.",
              },
              {
                icon: Clock,
                title: "Déploiement rapide",
                description: "De la signature au go-live en moins de 4 semaines, avec accompagnement dédié.",
              },
              {
                icon: Users,
                title: "Support premium",
                description: "Un Account Manager dédié et une équipe technique disponible 24/7.",
              },
              {
                icon: Zap,
                title: "Scalabilité illimitée",
                description: "Notre architecture supporte des millions d'évaluations sans compromis sur la performance.",
              },
            ].map((benefit, i) => (
              <Card key={i} className="card-premium">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Plan Enterprise */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="card-premium max-w-4xl mx-auto overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12">
                <Badge variant="secondary" className="mb-4">
                  <Star className="w-3 h-3 mr-1" />
                  Plan Enterprise
                </Badge>
                <h3 className="font-display text-2xl md:text-3xl font-bold mb-4">
                  Une solution sur mesure pour votre institution
                </h3>
                <p className="text-muted-foreground mb-6">
                  Bénéficiez d'une configuration adaptée à vos volumes, vos exigences de conformité 
                  et vos processus métier.
                </p>
                
                <ul className="space-y-3 mb-8">
                  {[
                    "Volume d'évaluations illimité",
                    "Infrastructure dédiée et souveraine",
                    "SLA 99.99% garanti",
                    "Account Manager dédié",
                    "Support technique 24/7",
                    "Formation de vos équipes",
                    "Intégration sur mesure",
                    "Audit de sécurité annuel",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-secondary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="gap-2" asChild>
                    <Link to="/contact">
                      <Phone className="w-4 h-4" />
                      Parler à un expert
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/pricing">Comparer les plans</Link>
                  </Button>
                </div>
              </div>
              
              <div className="bg-hero p-8 md:p-12 flex items-center justify-center">
                <div className="text-center text-primary-foreground">
                  <div className="text-5xl font-bold mb-2">Sur mesure</div>
                  <p className="text-lg opacity-80 mb-6">Tarification adaptée à vos besoins</p>
                  <div className="space-y-2 text-sm opacity-70">
                    <p>✓ Devis personnalisé sous 48h</p>
                    <p>✓ POC gratuit disponible</p>
                    <p>✓ Déploiement en 4 semaines</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-hero text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Prêt à transformer vos décisions de crédit ?
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Nos experts vous accompagnent pour identifier la meilleure configuration pour votre activité.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="gap-2" asChild>
              <Link to="/contact">
                Parler à un expert
                <ChevronRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/pricing">
                Comparer les plans
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Solutions;