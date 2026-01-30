// ============================================
// WOUAKA PRICING PLANS - 2 PERSONAS
// EMPRUNTEUR | PARTENAIRE
// ============================================

// ============================================
// INTERFACE EMPRUNTEUR - NOUVEAU MODÈLE VALIDITÉ
// ============================================

export interface BorrowerPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceDisplay: string;
  currency: string;
  validityDays: number; // Durée de validité du certificat
  recertifications: number | null; // null = illimité
  smileIdIncluded: 'none' | 'basic' | 'biometric';
  // Protection B2B: limites de partage
  maxFreeShares: number | null; // null = illimité
  sharePrice: number; // Prix par partage supplémentaire en FCFA
  features: string[];
  highlight?: string;
  popular: boolean;
}

export interface PartnerPlan {
  id: string;
  name: string;
  description: string;
  price: number | null; // null = sur mesure
  priceDisplay: string;
  currency: string;
  period: string;
  quotas: {
    dossiers: number | null; // null = illimité
  };
  features: string[];
  notIncluded: string[];
  cta: string;
  popular: boolean;
  isCustom: boolean;
  isTrial?: boolean; // Nouveau: indique si c'est un essai gratuit
  trialDays?: number; // Nouveau: durée de l'essai en jours
}

/**
 * @deprecated - Utilisez PartnerPlan directement
 * Cette interface est maintenue pour rétrocompatibilité uniquement
 * Les références à wscore/wkyc sont remplacées par "dossiers" dans la nouvelle architecture
 */
export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number | null;
  priceDisplay: string;
  currency: string;
  period: string;
  quotas: {
    /** @deprecated - Utilisez dossiers de PartnerPlan */
    wscore: number | null;
    /** @deprecated - Utilisez dossiers de PartnerPlan */
    wkyc: number | null;
  };
  features: string[];
  notIncluded: string[];
  cta: string;
  popular: boolean;
  isCustom: boolean;
}

// ============================================
// PLANS EMPRUNTEUR (B2C) - MODÈLE VALIDITÉ TEMPORELLE
// Un certificat valide X jours avec partage illimité
// ============================================

export const BORROWER_PLANS: BorrowerPlan[] = [
  {
    id: "emprunteur-decouverte",
    name: "Découverte",
    description: "Certificat valide 30 jours",
    price: 1500,
    priceDisplay: "1 500",
    currency: "FCFA",
    validityDays: 30,
    recertifications: 0,
    smileIdIncluded: 'none',
    maxFreeShares: 1, // 1 partage gratuit
    sharePrice: 500, // 500 FCFA par partage supplémentaire
    features: [
      "Certificat valide 30 jours",
      "1 partage gratuit vers institution",
      "Analyse SMS locale",
      "Coefficient de certitude basique",
    ],
    popular: false,
  },
  {
    id: "emprunteur-essentiel",
    name: "Essentiel",
    description: "Certificat renforcé 90 jours + recertification",
    price: 5000,
    priceDisplay: "5 000",
    currency: "FCFA",
    validityDays: 90,
    recertifications: 1,
    smileIdIncluded: 'basic',
    maxFreeShares: 3, // 3 partages gratuits
    sharePrice: 300, // 300 FCFA par partage supplémentaire
    features: [
      "Certificat valide 90 jours",
      "3 partages gratuits vers institutions",
      "Vérification Smile ID Basic incluse",
      "1 recertification gratuite",
      "Coefficient de certitude renforcé",
    ],
    highlight: "Vérification officielle incluse",
    popular: true,
  },
  {
    id: "emprunteur-premium",
    name: "Premium",
    description: "Certification maximale 12 mois",
    price: 12000,
    priceDisplay: "12 000",
    currency: "FCFA",
    validityDays: 365,
    recertifications: null, // illimité
    smileIdIncluded: 'biometric',
    maxFreeShares: null, // Partages illimités
    sharePrice: 0,
    features: [
      "Certificat valide 12 mois",
      "Partages illimités vers institutions",
      "Vérification Smile ID Biométrique",
      "Recertifications illimitées",
      "Niveau de confiance Gold",
      "Accès prioritaire aux offres",
    ],
    highlight: "Niveau de confiance maximum",
    popular: false,
  },
];

// ============================================
// PLANS PARTENAIRE (B2B)
// API de dossiers de preuves certifiées
// ============================================

export const PARTNER_PLANS: PartnerPlan[] = [
  // Plan d'essai gratuit - NOUVEAU
  {
    id: "partenaire-trial",
    name: "Essai Gratuit",
    description: "14 jours pour tester l'API",
    price: 0,
    priceDisplay: "Gratuit",
    currency: "",
    period: "14 jours",
    quotas: {
      dossiers: 10,
    },
    features: [
      "10 dossiers de test",
      "API REST complète",
      "Documentation technique",
      "Support email",
      "Sandbox inclus",
    ],
    notIncluded: [
      "Webhooks temps réel",
      "Export PDF comité crédit",
      "Screening AML/PEP",
    ],
    cta: "Démarrer l'essai",
    popular: false,
    isCustom: false,
    isTrial: true,
    trialDays: 14,
  },
  {
    id: "partenaire-starter",
    name: "Starter",
    description: "Pour démarrer avec les preuves certifiées",
    price: 75000,
    priceDisplay: "75 000",
    currency: "FCFA",
    period: "/mois",
    quotas: {
      dossiers: 50,
    },
    features: [
      "50 dossiers de preuves/mois",
      "Coefficient de certitude inclus",
      "API REST complète",
      "Analyse locale garantie",
      "Documentation technique",
      "Support email",
    ],
    notIncluded: [
      "Webhooks temps réel",
      "Export PDF comité crédit",
      "Screening AML/PEP",
    ],
    cta: "Commencer",
    popular: false,
    isCustom: false,
  },
  {
    id: "partenaire-business",
    name: "Business",
    description: "Solution complète avec webhooks",
    price: 250000,
    priceDisplay: "250 000",
    currency: "FCFA",
    period: "/mois",
    quotas: {
      dossiers: 250,
    },
    features: [
      "250 dossiers de preuves/mois",
      "Coefficient de certitude inclus",
      "Webhooks temps réel",
      "Export PDF comité crédit",
      "Screening AML/PEP inclus",
      "SDK multi-langages",
      "Support prioritaire",
    ],
    notIncluded: [],
    cta: "Choisir Business",
    popular: true,
    isCustom: false,
  },
  {
    id: "partenaire-enterprise",
    name: "Enterprise",
    description: "Sur mesure pour grands volumes",
    price: null,
    priceDisplay: "Sur mesure",
    currency: "",
    period: "",
    quotas: {
      dossiers: null,
    },
    features: [
      "Dossiers illimités",
      "SLA garanti 99.9%",
      "Intégration sur mesure",
      "Formation équipes",
      "Account manager dédié",
      "Audit de conformité inclus",
    ],
    notIncluded: [],
    cta: "Contacter les ventes",
    popular: false,
    isCustom: true,
  },
];

// ============================================
// LEGACY: PRICING_PLANS pour rétrocompatibilité
// @deprecated - Utilisez PARTNER_PLANS directement
// Sera supprimé dans une prochaine version
// ============================================

/**
 * @deprecated - Utilisez PARTNER_PLANS directement
 * Les quotas wscore/wkyc sont remplacés par "dossiers" dans PartnerPlan
 */
export const PRICING_PLANS: PricingPlan[] = PARTNER_PLANS.map((plan) => ({
  id: plan.id,
  name: plan.name,
  description: plan.description,
  price: plan.price,
  priceDisplay: plan.priceDisplay,
  currency: plan.currency,
  period: plan.period,
  quotas: {
    // Les quotas séparés sont obsolètes - un dossier = scoring + kyc + aml
    wscore: plan.quotas.dossiers,
    wkyc: plan.quotas.dossiers,
  },
  features: plan.features,
  notIncluded: plan.notIncluded,
  cta: plan.cta,
  popular: plan.popular,
  isCustom: plan.isCustom,
}));

// ============================================
// HELPERS
// ============================================

export const getBorrowerPlanById = (id: string): BorrowerPlan | undefined => {
  return BORROWER_PLANS.find((plan) => plan.id === id);
};

export const getPartnerPlanById = (id: string): PartnerPlan | undefined => {
  return PARTNER_PLANS.find((plan) => plan.id === id);
};

export const getPlanById = (id: string): PricingPlan | undefined => {
  return PRICING_PLANS.find((plan) => plan.id === id);
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fr-FR").format(price);
};

export const formatValidityDays = (days: number): string => {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return years === 1 ? "1 an" : `${years} ans`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return months === 1 ? "1 mois" : `${months} mois`;
  }
  return `${days} jours`;
};

export const formatRecertifications = (recertifications: number | null): string => {
  if (recertifications === null) return "Illimitées";
  if (recertifications === 0) return "Non incluses";
  return recertifications === 1 ? "1 incluse" : `${recertifications} incluses`;
};
