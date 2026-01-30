import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Filter,
  Star,
  Building2,
  Percent,
  Clock,
  ArrowRight,
  TrendingUp,
  Shield,
  Banknote,
  HelpCircle,
  Smartphone,
  FileCheck,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicMarketplace, formatAmount, formatDuration, MARKETPLACE_CATEGORIES } from "@/hooks/usePublicMarketplace";
import { SEOHead } from "@/components/seo/SEOHead";

const steps = [
  {
    number: "1",
    title: "Partagez vos données",
    description: "Mobile Money, factures, quittances de loyer, tontines...",
    icon: Search,
  },
  {
    number: "2",
    title: "Candidatez en ligne",
    description: "Formulaire simple en 5 minutes, 50+ signaux analysés",
    icon: FileCheck,
  },
  {
    number: "3",
    title: "Recevez votre financement",
    description: "Réponse rapide et déblocage sur Mobile Money",
    icon: Banknote,
  },
];

const faqs = [
  {
    question: "Ai-je besoin d'un compte bancaire pour candidater ?",
    answer: "Non ! Wouaka utilise un scoring alternatif basé sur plus de 50 signaux : Mobile Money, factures d'électricité et d'eau, historique télécom, participation à des tontines, et bien plus. Vous n'avez pas besoin d'un compte bancaire traditionnel pour être éligible.",
  },
  {
    question: "Comment fonctionne le scoring alternatif ?",
    answer: "Notre technologie analyse votre empreinte financière complète : transactions Mobile Money (Orange, MTN, Wave, Moov), paiements de factures, stabilité résidentielle, ancienneté télécom, participation à des coopératives ou tontines, et même le contexte économique local. Plus de 50 signaux sont combinés pour évaluer votre capacité de remboursement. C'est 100% sécurisé et confidentiel.",
  },
  {
    question: "Combien de temps prend le processus ?",
    answer: "Le formulaire de candidature prend environ 5 minutes. La plupart des partenaires répondent sous 24 à 48 heures.",
  },
  {
    question: "Quels documents sont nécessaires ?",
    answer: "En général, vous aurez besoin d'une pièce d'identité valide et de votre numéro de téléphone Mobile Money. Certains partenaires peuvent demander des documents supplémentaires comme des quittances de loyer ou factures.",
  },
  {
    question: "Wouaka octroie-t-il directement des crédits ?",
    answer: "Non, Wouaka est une plateforme de mise en relation. Nous vous connectons avec des institutions financières partenaires qui évaluent votre demande et octroient le financement.",
  },
];

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: products, isLoading } = usePublicMarketplace({
    category: categoryFilter,
    search: searchQuery
  });

  const featuredProducts = products?.filter(p => p.is_featured) || [];

  return (
    <PublicLayout>
      <SEOHead 
        title="Offres de Financement | Wouaka"
        description="Trouvez le prêt adapté à votre profil. Pas de compte bancaire requis. Scoring alternatif via Mobile Money. Comparez les offres de nos partenaires."
        keywords="prêt Afrique, financement Mobile Money, microcrédit UEMOA, prêt sans compte bancaire"
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4">
                <TrendingUp className="w-3 h-3 mr-1" />
                Offres de financement
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Trouvez le prêt <span className="text-primary">adapté à votre profil</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Pas de compte bancaire ? Pas de problème. Comparez les offres de nos partenaires 
                et candidatez avec votre Mobile Money.
              </p>
              
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un prêt, une institution..."
                    className="pl-12 h-12 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] h-12">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKETPLACE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="mr-2">{cat.icon}</span>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-12 border-b bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-semibold text-center mb-8">Comment ça marche ?</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4 p-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-6 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                <span>50+ signaux alternatifs</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span>Données sécurisées</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span>Partenaires vérifiés</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-2 mb-6">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <h2 className="text-2xl font-bold">Offres vedettes</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.slice(0, 3).map((product) => (
                  <Card key={product.id} className="border-2 border-primary/20 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" />
                            {product.provider_name}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 fill-current" />
                          Vedette
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-muted-foreground" />
                          <span>Taux: <strong>{product.interest_rate ? `${product.interest_rate}%` : 'Variable'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{formatDuration(product.duration_min_months, product.duration_max_months)}</span>
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Montant: </span>
                        <span className="font-medium">{formatAmount(product.min_amount)} - {formatAmount(product.max_amount)}</span>
                      </div>
                      <Button className="w-full" asChild>
                        <Link to={`/marketplace/${product.id}`}>
                          Voir les détails
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Products */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {categoryFilter !== "all" 
                  ? MARKETPLACE_CATEGORIES.find(c => c.value === categoryFilter)?.label 
                  : "Toutes les offres"}
              </h2>
              <span className="text-muted-foreground">
                {products?.length || 0} offre(s) disponible(s)
              </span>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow bg-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" />
                            {product.provider_name}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          Score min: {product.min_score_required}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-muted-foreground" />
                          <span>Taux: <strong>{product.interest_rate ? `${product.interest_rate}%` : 'Variable'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{formatDuration(product.duration_min_months, product.duration_max_months)}</span>
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Montant: </span>
                        <span className="font-medium">{formatAmount(product.min_amount)} - {formatAmount(product.max_amount)}</span>
                      </div>
                      {product.features && product.features.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {product.features.slice(0, 2).map((feature, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {product.features.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{product.features.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      <Button className="w-full" variant="outline" asChild>
                        <Link to={`/marketplace/${product.id}`}>
                          Candidater
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="py-16">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Aucune offre disponible</h3>
                  <p className="text-muted-foreground max-w-md">
                    {searchQuery || categoryFilter !== "all"
                      ? "Aucune offre ne correspond à vos critères. Essayez de modifier vos filtres."
                      : "Les offres de nos partenaires seront bientôt disponibles."}
                  </p>
                  {(searchQuery || categoryFilter !== "all") && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setSearchQuery("");
                        setCategoryFilter("all");
                      }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <Badge variant="secondary" className="mb-4">
                  <HelpCircle className="w-3 h-3 mr-1" />
                  FAQ
                </Badge>
                <h2 className="text-3xl font-bold mb-4">Questions fréquentes</h2>
                <p className="text-muted-foreground">
                  Tout ce que vous devez savoir sur le processus de candidature.
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Vous êtes une institution financière ?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Rejoignez Wouaka et accédez à des emprunteurs qualifiés avec des scores de crédit alternatifs fiables.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" asChild>
                <Link to="/partenaires">
                  Devenir partenaire
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/contact">
                  Nous contacter
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default Marketplace;
