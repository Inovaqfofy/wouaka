// ============================================
// Profils de démonstration pour le scoring
// Ces profils simulent des données réalistes de l'Afrique de l'Ouest
// ============================================

import type { 
  MobileMoneyEnrichedData, 
  TelecomEnrichedData, 
  RegistryEnrichedData, 
  UtilityEnrichedData 
} from './enrichment-types';

export interface DemoProfile {
  id: string;
  name: string;
  description: string;
  expected_score_range: [number, number];
  mobile_money: MobileMoneyEnrichedData;
  telecom: TelecomEnrichedData;
  registry?: RegistryEnrichedData;
  utilities: UtilityEnrichedData[];
}

// Profil Excellent - Entrepreneur établi
export const EXCELLENT_PROFILE: DemoProfile = {
  id: 'excellent',
  name: 'Entrepreneur Établi',
  description: 'Chef d\'entreprise avec historique solide et activité formalisée',
  expected_score_range: [80, 95],
  mobile_money: {
    provider: 'mtn_momo_ci',
    account_status: 'active',
    account_age_months: 48,
    last_30_days: {
      incoming_count: 85,
      incoming_volume: 3500000,
      outgoing_count: 72,
      outgoing_volume: 2800000,
      p2p_count: 35,
      merchant_payment_count: 25,
      bill_payment_count: 12,
      average_transaction_amount: 52000,
    },
    last_90_days: {
      incoming_volume: 10200000,
      outgoing_volume: 8100000,
      total_transactions: 450,
    },
    average_balance: 850000,
    transaction_regularity_score: 92,
    verification_status: 'simulated',
  },
  telecom: {
    provider: 'mtn_telecom_ci',
    sim_age_months: 72,
    network_provider: 'MTN',
    account_type: 'postpaid',
    recharge_pattern: {
      frequency: 'monthly',
      average_amount: 50000,
      consistency_score: 95,
    },
    usage_metrics: {
      avg_monthly_voice_minutes: 450,
      avg_monthly_data_mb: 8500,
      data_usage_trend: 'stable',
    },
    location_stability_score: 88,
    device_change_frequency: 0.5,
    roaming_frequency: 2,
    verification_status: 'simulated',
  },
  registry: {
    provider: 'rccm_ci',
    is_valid: true,
    company_name: 'KOUASSI TRADING SARL',
    rccm_number: 'CI-ABJ-2019-B-12345',
    registration_date: '2019-03-15',
    activity_sector: 'Commerce général',
    legal_form: 'SARL',
    status: 'active',
    capital: 5000000,
    currency: 'XOF',
    address: 'Plateau, Rue du Commerce',
    city: 'Abidjan',
    last_declaration_date: '2024-12-01',
    directors_count: 2,
    verification_status: 'simulated',
  },
  utilities: [
    {
      provider: 'cie_ci',
      utility_type: 'electricity',
      account_status: 'active',
      account_age_months: 60,
      payment_history: {
        last_12_months_on_time: 11,
        last_12_months_late: 1,
        last_12_months_missed: 0,
        average_days_to_payment: 5,
      },
      consumption_pattern: {
        average_monthly_amount: 85000,
        trend: 'stable',
      },
      verification_status: 'simulated',
    },
  ],
};

// Profil Bon - Commerçant actif
export const GOOD_PROFILE: DemoProfile = {
  id: 'good',
  name: 'Commerçant Actif',
  description: 'Commerçant informel avec bonne activité Mobile Money',
  expected_score_range: [65, 79],
  mobile_money: {
    provider: 'orange_money_ci',
    account_status: 'active',
    account_age_months: 28,
    last_30_days: {
      incoming_count: 45,
      incoming_volume: 1200000,
      outgoing_count: 38,
      outgoing_volume: 950000,
      p2p_count: 22,
      merchant_payment_count: 12,
      bill_payment_count: 4,
      average_transaction_amount: 28000,
    },
    last_90_days: {
      incoming_volume: 3400000,
      outgoing_volume: 2700000,
      total_transactions: 220,
    },
    average_balance: 180000,
    transaction_regularity_score: 75,
    verification_status: 'simulated',
  },
  telecom: {
    provider: 'orange_telecom_ci',
    sim_age_months: 36,
    network_provider: 'Orange',
    account_type: 'prepaid',
    recharge_pattern: {
      frequency: 'weekly',
      average_amount: 5000,
      consistency_score: 70,
    },
    usage_metrics: {
      avg_monthly_voice_minutes: 280,
      avg_monthly_data_mb: 3500,
      data_usage_trend: 'increasing',
    },
    location_stability_score: 72,
    device_change_frequency: 1,
    roaming_frequency: 0,
    verification_status: 'simulated',
  },
  utilities: [
    {
      provider: 'cie_ci',
      utility_type: 'electricity',
      account_status: 'active',
      account_age_months: 24,
      payment_history: {
        last_12_months_on_time: 9,
        last_12_months_late: 3,
        last_12_months_missed: 0,
        average_days_to_payment: 12,
      },
      consumption_pattern: {
        average_monthly_amount: 35000,
        trend: 'stable',
      },
      verification_status: 'simulated',
    },
  ],
};

// Profil Moyen - Nouveau dans le digital
export const AVERAGE_PROFILE: DemoProfile = {
  id: 'average',
  name: 'Nouveau Digital',
  description: 'Utilisateur récent avec peu d\'historique',
  expected_score_range: [45, 64],
  mobile_money: {
    provider: 'wave_ci',
    account_status: 'active',
    account_age_months: 8,
    last_30_days: {
      incoming_count: 12,
      incoming_volume: 280000,
      outgoing_count: 15,
      outgoing_volume: 220000,
      p2p_count: 8,
      merchant_payment_count: 5,
      bill_payment_count: 2,
      average_transaction_amount: 18000,
    },
    last_90_days: {
      incoming_volume: 720000,
      outgoing_volume: 580000,
      total_transactions: 75,
    },
    average_balance: 45000,
    transaction_regularity_score: 48,
    verification_status: 'simulated',
  },
  telecom: {
    provider: 'mtn_telecom_ci',
    sim_age_months: 14,
    network_provider: 'MTN',
    account_type: 'prepaid',
    recharge_pattern: {
      frequency: 'irregular',
      average_amount: 2000,
      consistency_score: 40,
    },
    usage_metrics: {
      avg_monthly_voice_minutes: 120,
      avg_monthly_data_mb: 1200,
      data_usage_trend: 'increasing',
    },
    location_stability_score: 55,
    device_change_frequency: 2,
    roaming_frequency: 0,
    verification_status: 'simulated',
  },
  utilities: [],
};

// Profil à Risque - Instabilité financière
export const RISKY_PROFILE: DemoProfile = {
  id: 'risky',
  name: 'Profil à Risque',
  description: 'Historique de paiements irréguliers et instabilité',
  expected_score_range: [20, 44],
  mobile_money: {
    provider: 'mtn_momo_ci',
    account_status: 'active',
    account_age_months: 6,
    last_30_days: {
      incoming_count: 5,
      incoming_volume: 85000,
      outgoing_count: 8,
      outgoing_volume: 120000,
      p2p_count: 3,
      merchant_payment_count: 2,
      bill_payment_count: 0,
      average_transaction_amount: 12000,
    },
    last_90_days: {
      incoming_volume: 280000,
      outgoing_volume: 380000,
      total_transactions: 35,
    },
    average_balance: 12000,
    transaction_regularity_score: 25,
    verification_status: 'simulated',
  },
  telecom: {
    provider: 'orange_telecom_ci',
    sim_age_months: 4,
    network_provider: 'Orange',
    account_type: 'prepaid',
    recharge_pattern: {
      frequency: 'irregular',
      average_amount: 500,
      consistency_score: 20,
    },
    usage_metrics: {
      avg_monthly_voice_minutes: 45,
      avg_monthly_data_mb: 350,
      data_usage_trend: 'decreasing',
    },
    location_stability_score: 30,
    device_change_frequency: 4,
    roaming_frequency: 0,
    verification_status: 'simulated',
  },
  utilities: [
    {
      provider: 'cie_ci',
      utility_type: 'electricity',
      account_status: 'suspended',
      account_age_months: 12,
      payment_history: {
        last_12_months_on_time: 3,
        last_12_months_late: 5,
        last_12_months_missed: 4,
        average_days_to_payment: 35,
      },
      consumption_pattern: {
        average_monthly_amount: 25000,
        trend: 'decreasing',
      },
      verification_status: 'simulated',
    },
  ],
};

// Map de tous les profils
export const DEMO_PROFILES: Record<string, DemoProfile> = {
  excellent: EXCELLENT_PROFILE,
  good: GOOD_PROFILE,
  average: AVERAGE_PROFILE,
  risky: RISKY_PROFILE,
};

// Fonction pour obtenir un profil simulé basé sur les données utilisateur
export function getSimulatedProfile(phoneNumber: string): DemoProfile {
  // Utilise le dernier chiffre du numéro pour déterminer le profil
  const lastDigit = parseInt(phoneNumber.slice(-1)) || 0;
  
  if (lastDigit >= 8) return EXCELLENT_PROFILE;
  if (lastDigit >= 5) return GOOD_PROFILE;
  if (lastDigit >= 2) return AVERAGE_PROFILE;
  return RISKY_PROFILE;
}

// Fonction pour générer des données simulées cohérentes
export function generateSimulatedEnrichment(
  phoneNumber: string,
  sourceType: 'mobile_money' | 'telecom' | 'registry' | 'utility'
): any {
  const profile = getSimulatedProfile(phoneNumber);
  
  switch (sourceType) {
    case 'mobile_money':
      return profile.mobile_money;
    case 'telecom':
      return profile.telecom;
    case 'registry':
      return profile.registry || null;
    case 'utility':
      return profile.utilities[0] || null;
    default:
      return null;
  }
}
