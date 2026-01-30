// ============================================
// Types pour l'enrichissement de données alternatives
// ============================================

// Types de sources de données
export type DataSourceType = 'mobile_money' | 'telecom' | 'registry' | 'utility' | 'identity';

export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'simulated' | 'unavailable' | 'declared';

// Fournisseurs de données
export interface DataSourceProvider {
  provider: string;
  display_name: string;
  source_type: DataSourceType;
  is_active: boolean;
  is_sandbox: boolean;
  supported_countries: string[];
}

// Consentement utilisateur
export interface DataConsent {
  id?: string;
  phone_number: string;
  mobile_money_consent: boolean;
  telecom_consent: boolean;
  registry_consent: boolean;
  utility_consent: boolean;
  consent_given_at?: string;
  consent_expires_at?: string;
}

// Données Mobile Money enrichies
export interface MobileMoneyEnrichedData {
  provider: string;
  account_status: 'active' | 'inactive' | 'suspended' | 'unknown';
  account_age_months: number;
  last_30_days: {
    incoming_count: number;
    incoming_volume: number;
    outgoing_count: number;
    outgoing_volume: number;
    p2p_count: number;
    merchant_payment_count: number;
    bill_payment_count: number;
    average_transaction_amount: number;
  };
  last_90_days: {
    incoming_volume: number;
    outgoing_volume: number;
    total_transactions: number;
  };
  average_balance: number;
  transaction_regularity_score: number; // 0-100
  verification_status: VerificationStatus;
}

// Données Télécom enrichies
export interface TelecomEnrichedData {
  provider: string;
  sim_age_months: number;
  network_provider: string;
  account_type: 'prepaid' | 'postpaid';
  recharge_pattern: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'irregular';
    average_amount: number;
    consistency_score: number; // 0-100
  };
  usage_metrics: {
    avg_monthly_voice_minutes: number;
    avg_monthly_data_mb: number;
    data_usage_trend: 'increasing' | 'stable' | 'decreasing';
  };
  location_stability_score: number; // 0-100 based on cell tower data
  device_change_frequency: number; // fois par an
  roaming_frequency: number; // jours par mois
  verification_status: VerificationStatus;
}

// Données RCCM enrichies
export interface RegistryEnrichedData {
  provider: string;
  is_valid: boolean;
  company_name: string;
  rccm_number: string;
  registration_date: string;
  activity_sector: string;
  legal_form: string;
  status: 'active' | 'suspended' | 'dissolved' | 'unknown';
  capital: number;
  currency: string;
  address: string;
  city: string;
  last_declaration_date?: string;
  directors_count?: number;
  verification_status: VerificationStatus;
}

// Données utilités enrichies
export interface UtilityEnrichedData {
  provider: string;
  utility_type: 'electricity' | 'water' | 'gas' | 'internet';
  account_status: 'active' | 'suspended' | 'closed';
  account_age_months: number;
  payment_history: {
    last_12_months_on_time: number;
    last_12_months_late: number;
    last_12_months_missed: number;
    average_days_to_payment: number;
  };
  consumption_pattern: {
    average_monthly_amount: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  verification_status: VerificationStatus;
}

// Résumé de toutes les données enrichies
export interface EnrichmentSummary {
  total_sources_connected: number;
  verified_sources: number;
  simulated_sources: number;
  failed_sources: number;
  overall_data_confidence: number; // 0-100
  sources: Array<{
    source_type: DataSourceType;
    provider: string;
    verification_status: VerificationStatus;
    confidence_score: number;
    contribution_weight: number;
  }>;
}

// Extension du ScoringResult avec données enrichies
export interface EnrichedScoringResult {
  // Qualité des données
  data_quality: {
    total_sources: number;
    verified_sources: number;
    declared_sources: number;
    simulated_sources: number;
    overall_data_confidence: number;
  };
  
  // Breakdown par source
  source_breakdown: Array<{
    category: DataSourceType;
    provider: string;
    display_name: string;
    verification_status: VerificationStatus;
    confidence_score: number;
    contribution_to_score: number;
    icon?: string;
  }>;
  
  // Données enrichies par type (optionnel)
  enriched_data?: {
    mobile_money?: MobileMoneyEnrichedData;
    telecom?: TelecomEnrichedData;
    registry?: RegistryEnrichedData;
    utilities?: UtilityEnrichedData[];
  };
}

// Icônes pour chaque type de source
export const DATA_SOURCE_ICONS: Record<DataSourceType, string> = {
  mobile_money: 'Smartphone',
  telecom: 'Signal',
  registry: 'Building2',
  utility: 'Lightbulb',
  identity: 'UserCheck',
};

// Labels pour chaque type de source
export const DATA_SOURCE_LABELS: Record<DataSourceType, { fr: string; en: string }> = {
  mobile_money: { fr: 'Mobile Money', en: 'Mobile Money' },
  telecom: { fr: 'Données Télécom', en: 'Telecom Data' },
  registry: { fr: 'Registre Commerce', en: 'Business Registry' },
  utility: { fr: 'Factures Utilités', en: 'Utility Bills' },
  identity: { fr: 'Identité', en: 'Identity' },
};

// Couleurs selon le statut de vérification
export const VERIFICATION_STATUS_COLORS: Record<VerificationStatus, { bg: string; text: string; border: string }> = {
  verified: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  simulated: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  unavailable: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  declared: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
};

// Labels pour le statut de vérification
export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, { fr: string; en: string }> = {
  verified: { fr: 'Vérifié', en: 'Verified' },
  pending: { fr: 'En attente', en: 'Pending' },
  failed: { fr: 'Échec', en: 'Failed' },
  simulated: { fr: 'Simulé (Démo)', en: 'Simulated (Demo)' },
  unavailable: { fr: 'Non disponible', en: 'Unavailable' },
  declared: { fr: 'Déclaratif', en: 'Declared' },
};
