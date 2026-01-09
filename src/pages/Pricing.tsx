import { Check, Star, ArrowRight, Zap, Shield, Building2, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/layout/PageHero";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import { PRICING_PLANS } from "@/lib/pricing-plans";

const faqs = [
  {
    question: "Comment fonctionne l'essai gratuit ?",
    answer:
      "L'essai gratuit de 14 jours vous donne accès à toutes les fonctionnalités du plan Business. Aucune carte bancaire n'est requise pour commencer. À la fin de l'essai, vous pouvez choisir le plan qui vous convient.",
  },
  {
    question: "Puis-je changer de plan à tout moment ?",
    answer:
      "Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment. Les changements prennent effet immédiatement et la facturation est ajustée au prorata.",
  },
  {
    question: "Qu'est-ce qu'une 'évaluation' ?",
    answer:
      "Une évaluation correspond à une analyse complète du profil de risque d'un client ou d'une entreprise. Chaque analyse consomme un crédit de votre forfait mensuel.",
  },
  {
    question: "Comment fonctionne le déploiement dédié ?",
    answer:
      "Pour le plan Enterprise, nous déployons une instance dédiée de notre plateforme, hébergée en toute souveraineté selon vos exigences. Cela garantit des performances optimales et une isolation complète de vos données.",
  },
  {
    question: "Proposez-vous un accompagnement à l'intégration ?",
    answer:
      "Absolument. Notre équipe technique vous accompagne tout au long de l'intégration. Pour les plans Business et Enterprise, nous offrons des sessions de formation et un support dédié.",
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Tarifs - Plans et prix"
        description="Tarification simple et transparente pour le scoring de crédit Wouaka. Starter 99 000 FCFA/mois, Business et Enterprise. Essai gratuit 14 jours."
        keywords="tarif scoring crédit, prix API credit score, abonnement Wouaka, plan entreprise FCFA"
        canonical="/pricing"
      />
      <Navbar />

      {/* Hero */}
      <PageHero
        badge={{ icon: Zap, text: "Tarification simple et transparente" }}
        title="Des plans qui évoluent"
        titleHighlight="avec votre activité"
        description="Pas de frais cachés, pas d'engagement. Commencez gratuitement et passez à l'échelle quand vous êtes prêt."
        primaryCTA={{ label: "Commencer l'essai gratuit", href: "/auth" }}
        secondaryCTA={{ label: "Parler à un expert", href: "/contact", icon: Phone }}
      />

      {/* Pricing Cards */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PRICING_PLANS.map((plan, i) => (
              <Card
                key={i}
                className={`card-premium relative ${plan.popular ? "border-secondary shadow-glow scale-105" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary" className="shadow-lg px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Recommandé
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-6">
                    <span className="font-display text-5xl font-bold">{plan.priceDisplay}</span>
                    <span className="text-muted-foreground">
                      {plan.currency}
                      {plan.period}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Button className="w-full mb-6" variant={plan.popular ? "default" : "outline"} size="lg" asChild>
                    <Link to={plan.isCustom ? "/contact" : "/auth"}>
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>

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
        </div>
      </section>

      {/* All Plans Include */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-4">Inclus dans tous les plans</h2>
            <p className="text-muted-foreground">Les fondamentaux pour une utilisation en toute confiance</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              "Chiffrement des données",
              "Conformité BCEAO",
              "Documentation complète",
              "99.9% de disponibilité",
              "Mises à jour gratuites",
              "Multi-devises (FCFA, EUR, USD)",
              "Historique d'activité",
              "Export des données",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-secondary" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="card-premium max-w-4xl mx-auto overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Solution Enterprise</span>
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold mb-4">Besoin d'une solution sur mesure ?</h3>
                <p className="text-muted-foreground mb-6">
                  Nos experts conçoivent avec vous une solution adaptée à vos volumes, vos contraintes réglementaires et
                  vos processus métier.
                </p>
                <ul className="space-y-2 mb-6">
                  {["Volumes illimités", "Infrastructure dédiée", "Support premium 24/7", "Intégration sur mesure"].map(
                    (item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-secondary" />
                        {item}
                      </li>
                    ),
                  )}
                </ul>
                <Button size="lg" className="gap-2" asChild>
                  <Link to="/contact">
                    <Phone className="w-4 h-4" />
                    Parler à un expert
                  </Link>
                </Button>
              </div>
              <div className="bg-hero p-8 md:p-12 flex items-center justify-center">
                <div className="text-center text-primary-foreground">
                  <Shield className="w-16 h-16 mx-auto mb-4 opacity-80" />
                  <p className="text-xl font-semibold mb-2">Conforme BCEAO</p>
                  <p className="text-sm opacity-70">Hébergement souverain & sécurisé</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
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
            Prêt à optimiser vos décisions de crédit ?
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Essayez gratuitement pendant 14 jours. Aucune carte bancaire requise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">Commencer l'essai gratuit</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/contact">Demander une démo</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
