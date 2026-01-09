// Shared pricing plans data - single source of truth
export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number | null; // null = Sur mesure
  priceDisplay: string;
  currency: string;
  period: string;
  credits: number | null; // null = Volume négocié
  creditsDisplay: string;
  features: string[];
  notIncluded: string[];
  cta: string;
  popular: boolean;
  isCustom: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Idéal pour les PME et commerçants",
    price: 99000,
    priceDisplay: "99K",
    currency: "FCFA",
    period: "/mois",
    credits: 25,
    creditsDisplay: "25 évaluations/mois",
    features: [
      "25 évaluations par mois",
      "API standard",
      "Support par email",
      "1 utilisateur",
      "Tableau de bord basique",
      "Export des données",
    ],
    notIncluded: [
      "Webhooks",
      "Vérification d'identité",
      "Support prioritaire",
    ],
    cta: "Commencer maintenant",
    popular: false,
    isCustom: false,
  },
  {
    id: "business",
    name: "Business",
    description: "Pour les entreprises en croissance",
    price: 299000,
    priceDisplay: "299K",
    currency: "FCFA",
    period: "/mois",
    credits: 85,
    creditsDisplay: "85 évaluations/mois",
    features: [
      "85 évaluations par mois",
      "API complète avec webhooks",
      "Support prioritaire 24/7",
      "10 utilisateurs",
      "Tableau de bord avancé",
      "Exports illimités",
      "Vérification d'identité",
      "Alertes personnalisées",
      "Intégrations partenaires",
    ],
    notIncluded: [
      "Déploiement dédié",
    ],
    cta: "Essai gratuit 14 jours",
    popular: true,
    isCustom: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Pour les grandes institutions",
    price: null,
    priceDisplay: "Sur mesure",
    currency: "",
    period: "",
    credits: null,
    creditsDisplay: "Volume négocié",
    features: [
      "Volume négocié",
      "API dédiée + SDK personnalisé",
      "Account Manager dédié",
      "Utilisateurs illimités",
      "Marque blanche disponible",
      "Déploiement dédié",
      "SLA 99.99% garanti",
      "Formation de vos équipes",
      "Audit de sécurité annuel",
      "Conformité BCEAO renforcée",
    ],
    notIncluded: [],
    cta: "Parler à un expert",
    popular: false,
    isCustom: true,
  },
];

export const getPlanById = (id: string): PricingPlan | undefined => {
  return PRICING_PLANS.find(plan => plan.id === id);
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR').format(price);
};
