// Configuration des prix pour les vérifications premium
// Les prix sont en FCFA (XOF)

export type VerificationType = 'smile_id_basic' | 'smile_id_enhanced' | 'smile_id_biometric';

export interface VerificationPrice {
  price: number;
  label: string;
  description: string;
  features: string[];
  estimatedTime: string;
  scoreBonus: number;
}

export const VERIFICATION_PRICES: Record<VerificationType, VerificationPrice> = {
  smile_id_basic: {
    price: 750,
    label: 'Vérification CNI Basique',
    description: 'Vérification du numéro CNI/NNI auprès des registres officiels',
    features: [
      'Validation numéro CNI/NNI',
      'Vérification format document',
      'Détection documents expirés',
    ],
    estimatedTime: '1-2 minutes',
    scoreBonus: 10,
  },
  smile_id_enhanced: {
    price: 1000,
    label: 'Vérification CNI Enrichie',
    description: 'Vérification CNI + récupération des informations personnelles officielles',
    features: [
      'Tout de la vérification basique',
      'Nom complet officiel',
      'Date de naissance',
      'Adresse enregistrée',
      'Photo officielle',
    ],
    estimatedTime: '2-3 minutes',
    scoreBonus: 15,
  },
  smile_id_biometric: {
    price: 1500,
    label: 'Vérification Biométrique Complète',
    description: 'Vérification CNI + comparaison biométrique selfie vs photo officielle',
    features: [
      'Tout de la vérification enrichie',
      'Comparaison faciale biométrique',
      'Score de correspondance officiel',
      'Détection anti-spoofing avancée',
      'Certificat de vérification',
    ],
    estimatedTime: '3-5 minutes',
    scoreBonus: 20,
  },
};

export const FREE_VERIFICATION_LEVELS = {
  basic: {
    label: 'Vérification Basique',
    description: 'SMS OTP + OCR document',
    features: [
      'Vérification numéro téléphone (OTP)',
      'Extraction OCR du document',
      'Validation format CNI/NNI',
    ],
    scoreBonus: 0,
  },
  enhanced: {
    label: 'Vérification Avancée',
    description: 'Basique + Détection vivacité + Comparaison faciale',
    features: [
      'Tout de la vérification basique',
      'Détection de vivacité (liveness)',
      'Comparaison selfie vs photo CNI',
      'Score de similarité faciale',
    ],
    scoreBonus: 5,
  },
};

// Bonus de score selon le niveau de vérification
export const VERIFICATION_SCORE_BONUS: Record<string, number> = {
  basic: 0,
  enhanced: 5,
  smile_id_basic: 10,
  smile_id_enhanced: 15,
  smile_id_biometric: 20,
};

export function getVerificationPrice(type: VerificationType): number {
  return VERIFICATION_PRICES[type]?.price ?? 0;
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}
