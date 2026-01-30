// Tarification des certificats pour les emprunteurs
// Nouveau modèle: validité temporelle + recertifications
// Les emprunteurs passant par un lien partenaire ne paient pas (c'est le partenaire qui paie)

import { BORROWER_PLANS, type BorrowerPlan } from './pricing-plans';

// Re-export pour compatibilité
export { BORROWER_PLANS as CERTIFICATE_PLANS } from './pricing-plans';
export type { BorrowerPlan as CertificatePlan } from './pricing-plans';

// ====== LEGACY - Maintenu pour rétrocompatibilité avec anciens crédits ======

export interface BorrowerCreditPackage {
  id: string;
  name: string;
  description: string;
  creditType: 'score' | 'kyc_basic' | 'kyc_enhanced' | 'bundle';
  credits: number;
  price: number; // en FCFA
  originalPrice?: number; // prix sans réduction
  savings?: number; // économie en FCFA
  popular?: boolean;
  features: string[];
}

/**
 * @deprecated Utilisez BORROWER_PLANS pour les nouveaux abonnements certificat
 */
export const BORROWER_CREDIT_PACKAGES: BorrowerCreditPackage[] = [
  // Ces packages sont obsolètes mais maintenus pour les utilisateurs existants
  {
    id: 'score_single',
    name: 'W-Score (Legacy)',
    description: 'Ancien système de crédits - Utilisez les nouveaux plans certificat',
    creditType: 'score',
    credits: 1,
    price: 1000,
    features: [
      'Score de crédit sur 100 points',
      'Rapport téléchargeable',
    ]
  },
];

/**
 * @deprecated Utilisez BORROWER_PLANS
 */
export const BORROWER_UNIT_PRICES = {
  score: 1000,
  kyc_basic: 1500,
  kyc_enhanced: 2500
} as const;

/**
 * @deprecated Utilisez getBorrowerPlanById de pricing-plans.ts
 */
export function getBorrowerPackageById(id: string): BorrowerCreditPackage | undefined {
  return BORROWER_CREDIT_PACKAGES.find(pkg => pkg.id === id);
}

/**
 * @deprecated
 */
export function getBorrowerPackagesByType(creditType: BorrowerCreditPackage['creditType']): BorrowerCreditPackage[] {
  return BORROWER_CREDIT_PACKAGES.filter(pkg => pkg.creditType === creditType);
}

/**
 * @deprecated
 */
export function getBundleContents(bundleId: string): { scores: number; kyc_basic: number; kyc_enhanced: number } {
  switch (bundleId) {
    case 'bundle_score_kyc':
      return { scores: 1, kyc_basic: 1, kyc_enhanced: 0 };
    case 'pack_complete':
      return { scores: 1, kyc_basic: 0, kyc_enhanced: 1 };
    default:
      return { scores: 0, kyc_basic: 0, kyc_enhanced: 0 };
  }
}

// ====== NOUVELLES FONCTIONS POUR LE SYSTÈME CERTIFICAT ======

/**
 * Formater la durée de validité en texte lisible
 */
export function formatValidityPeriod(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return `${years} an${years > 1 ? 's' : ''}`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} mois`;
  }
  return `${days} jour${days > 1 ? 's' : ''}`;
}

/**
 * Formater le nombre de recertifications
 */
export function formatRecertifications(count: number | null): string {
  if (count === null) return 'Illimitées';
  if (count === 0) return 'Aucune';
  return `${count} recertification${count > 1 ? 's' : ''}`;
}

/**
 * Obtenir le plan recommandé en fonction du besoin
 */
export function getRecommendedPlan(needsSmileId: boolean = false): BorrowerPlan {
  if (needsSmileId) {
    return BORROWER_PLANS.find(p => p.id === 'emprunteur-essentiel') || BORROWER_PLANS[1];
  }
  return BORROWER_PLANS.find(p => p.popular) || BORROWER_PLANS[1];
}
