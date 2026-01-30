import { Check, Star, Zap, Shield, Building2, Phone, BarChart3, Fingerprint, Database, Target, FileCheck, HelpCircle, Award, Users, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/layout/PageHero";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import { BORROWER_PLANS, PARTNER_PLANS, formatPrice } from "@/lib/pricing-plans";
import { SubscriptionButton } from "@/components/pricing/SubscriptionButton";

const faqs = [
  {
    question: "Comment fonctionne le coefficient de certitude ?",
    answer:
      "Chaque dossier inclut un coefficient (0.0 à 1.0) reflétant la fiabilité des preuves. Preuves vérifiées (SMS, USSD) = 0.9, Données déclaratives = 0.3. Cela vous permet de moduler vos décisions selon la qualité des preuves.",
  },
  {
    question: "Quelles preuves l'emprunteur doit-il fournir ?",
    answer:
      "L'emprunteur peut fournir : OTP de son numéro, capture USSD Mobile Money, autorisation d'analyse SMS (100% locale), documents d'identité. Plus il fournit de preuves, plus son coefficient augmente.",
  },
  {
    question: "Les données SMS sont-elles transmises ?",
    answer:
      "Non. L'analyse SMS se fait 100% en local sur l'appareil de l'emprunteur. Seuls les indicateurs structurés (montants agrégés, fréquences) sont transmis — jamais le contenu brut.",
  },
  {
    question: "Quelle différence entre les plans Emprunteur et Partenaire ?",
    answer:
      "WOUAKA EMPRUNTEUR permet aux individus de certifier leur solvabilité et de partager leur dossier. WOUAKA PARTENAIRE permet aux institutions de recevoir ces dossiers via API avec coefficient de certitude.",
  },
  {
    question: "Comment fonctionne le paiement ?",
    answer:
      "Nous acceptons Orange Money, MTN MoMo, Wave et carte bancaire via CinetPay. Les emprunteurs paient une fois par certificat. Les partenaires ont un abonnement mensuel.",
  },
  {
    question: "Puis-je tester avant de m'abonner ?",
    answer:
      "Les partenaires ont accès à un sandbox gratuit pour tester l'API avant de s'engager. Les emprunteurs peuvent choisir le plan Découverte à 500 FCFA pour leur premier certificat.",
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Tarifs - WOUAKA EMPRUNTEUR & PARTENAIRE"
        description="Emprunteurs : certifiez votre solvabilité dès 500 FCFA. Partenaires : dossiers de preuves dès 75 000 FCFA/mois. Paiement mobile money."
        keywords="tarif wouaka, certification solvabilité, dossier preuves, abonnement API scoring"
        canonical="/pricing"
      />
      <Navbar />

      {/* Hero */}
      <PageHero
        badge={{ icon: Shield, text: "Souveraineté par la Preuve" }}
        title="Deux produits,"
        titleHighlight="deux parcours"
        description="Emprunteurs : certifiez votre solvabilité. Partenaires : recevez des dossiers de preuves. Paiement mobile money ou carte."
        primaryCTA={{ label: "Voir les plans", href: "#plans" }}
        secondaryCTA={{ label: "Parler à un expert", href: "/contact", icon: Phone }}
      />

      {/* Two Personas Overview */}
      <section className="py-12 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 p-6 bg-secondary/10 rounded-2xl border border-secondary/30">
              <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center">
                <Award className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <p className="font-bold text-lg">WOUAKA EMPRUNTEUR</p>
                <p className="text-sm text-muted-foreground">Certifiez votre solvabilité</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-primary/10 rounded-2xl border border-primary/30">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="font-bold text-lg">WOUAKA PARTENAIRE</p>
                <p className="text-sm text-muted-foreground">Recevez des dossiers de preuves</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Borrower Plans */}
      <section id="emprunteur" className="py-20 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-secondary/20 text-secondary border-secondary/30">
              <Award className="w-3 h-3 mr-1" />
              WOUAKA EMPRUNTEUR
            </Badge>
            <h2 className="font-display text-3xl font-bold mb-4">Certifiez votre solvabilité</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Prouvez votre valeur avec vos données Mobile Money. Vos preuves restent sur votre appareil.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {BORROWER_PLANS.map((plan, i) => (
              <Card
                key={i}
                className={`card-premium relative ${plan.popular ? "border-secondary shadow-glow scale-105" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary" className="shadow-lg px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Populaire
                    </Badge>
                  </div>
                )}
                {plan.highlight && (
                  <div className="bg-secondary/10 text-secondary text-xs font-medium text-center py-2 -mx-6 -mt-6 mb-4 rounded-t-lg">
                    {plan.highlight}
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-6">
                    <span className="font-display text-4xl font-bold">{plan.priceDisplay}</span>
                    {plan.currency && (
                      <span className="text-muted-foreground"> {plan.currency}</span>
                    )}
                  </div>
                  
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Validité</span>
                      <span className="font-semibold">
                        {plan.validityDays >= 365 ? "12 mois" : plan.validityDays >= 90 ? "3 mois" : "30 jours"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Recertifications</span>
                      <span className="font-semibold">
                        {plan.recertifications === null ? "Illimitées" : plan.recertifications === 0 ? "—" : plan.recertifications}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Button 
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full mb-6"
                    asChild
                  >
                    <Link to={`/auth?mode=signup&role=EMPRUNTEUR&plan=${plan.id}`}>
                      Choisir ce plan
                    </Link>
                  </Button>

                  <div className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Plans */}
      <section id="plans" className="py-20 bg-background scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <Building2 className="w-3 h-3 mr-1" />
              WOUAKA PARTENAIRE
            </Badge>
            <h2 className="font-display text-3xl font-bold mb-4">Recevez des dossiers de preuves</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une API unique avec coefficient de certitude sur chaque dossier. Paiement mensuel via mobile money ou carte.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {PARTNER_PLANS.map((plan, i) => (
              <Card
                key={i}
                className={`card-premium relative ${
                  plan.popular ? "border-primary shadow-glow scale-105" : 
                  plan.isTrial ? "border-green-500/50 bg-gradient-to-b from-green-50/50 to-transparent dark:from-green-900/20" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="shadow-lg px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Recommandé
                    </Badge>
                  </div>
                )}
                {plan.isTrial && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="shadow-lg px-4 py-1 bg-green-500 hover:bg-green-600">
                      <Zap className="w-3 h-3 mr-1" />
                      Sans engagement
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-6">
                    <span className="font-display text-4xl font-bold">{plan.priceDisplay}</span>
                    <span className="text-muted-foreground">
                      {plan.currency && ` ${plan.currency}`}
                      {plan.period}
                    </span>
                  </div>
                  
                  {!plan.isCustom && !plan.isTrial && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Dossiers/mois</span>
                        <span className="font-semibold">{plan.quotas.dossiers}</span>
                      </div>
                    </div>
                  )}
                  {plan.isTrial && (
                    <div className="mt-4 p-3 bg-green-100/50 dark:bg-green-900/30 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Dossiers inclus</span>
                        <span className="font-semibold text-green-700 dark:text-green-400">{plan.quotas.dossiers}</span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">Sans carte bancaire requise</p>
                    </div>
                  )}
                  {plan.isCustom && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground text-center">Volume négocié</p>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pt-6">
                  <SubscriptionButton 
                    plan={{
                      ...plan,
                      quotas: { wscore: plan.quotas.dossiers, wkyc: plan.quotas.dossiers ? Math.floor(plan.quotas.dossiers / 2) : null }
                    }}
                    variant={plan.popular ? "default" : plan.isTrial ? "secondary" : "outline"}
                    className={`w-full mb-6 ${plan.isTrial ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                  />

                  <div className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((feature, j) => (
                      <div key={j} className="flex items-start gap-3 opacity-50">
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                          <div className="w-1.5 h-0.5 bg-muted-foreground rounded" />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Payment methods */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">Moyens de paiement acceptés</p>
            <div className="flex justify-center gap-6 items-center opacity-60">
              <span className="font-semibold text-orange-500">Orange Money</span>
              <span className="font-semibold text-yellow-600">MTN MoMo</span>
              <span className="font-semibold text-blue-500">Wave</span>
              <span className="font-semibold">Carte bancaire</span>
            </div>
          </div>
        </div>
      </section>

      {/* All Plans Include */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-4">Inclus dans tous les plans</h2>
            <p className="text-muted-foreground">Les fondamentaux de la souveraineté par la preuve</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              "Coefficient de certitude",
              "Analyse locale embarquée",
              "Conformité BCEAO",
              "0 données brutes stockées",
              "Documentation complète",
              "99.9% de disponibilité",
              "Multi-devises (FCFA, EUR)",
              "Support réactif",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-secondary" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <HelpCircle className="w-3 h-3 mr-1" />
              FAQ
            </Badge>
            <h2 className="font-display text-3xl font-bold mb-4">Questions fréquentes</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, i) => (
              <Card key={i} className="card-premium">
                <CardHeader>
                  <CardTitle className="text-base">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
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
            Prêt à commencer ?
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Emprunteurs : certifiez votre solvabilité dès 1 500 FCFA.
            Partenaires : testez l'API gratuitement pendant 14 jours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth?mode=signup&role=EMPRUNTEUR">Je suis emprunteur</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/auth?mode=signup&role=PARTENAIRE">Je suis partenaire</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm opacity-60">
            Paiement sécurisé via CinetPay • Annulation à tout moment
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
