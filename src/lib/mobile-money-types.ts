// ============================================
// Types pour les APIs Mobile Money
// MTN MoMo, Orange Money, Wave
// ============================================

export type MobileMoneyProvider = 'mtn_momo' | 'orange_money' | 'wave' | 'moov_money';

export interface MobileMoneyVerifyRequest {
  phone_number: string;
  account_holder_consent: boolean;
  provider?: MobileMoneyProvider;
  country_code?: string;
}

export interface MobileMoneyVerifyResponse {
  success: boolean;
  verified: boolean;
  source: string;
  provider: string;
  status: 'verified' | 'not_found' | 'not_configured' | 'auth_failed' | 'error';
  confidence: number;
  data: MobileMoneyAccountData | null;
  processing_time_ms: number;
  message?: string;
  error?: string;
}

export interface MobileMoneyAccountData {
  is_active: boolean;
  account_holder_name?: string;
  account_status: 'active' | 'inactive' | 'suspended' | 'unknown';
  account_type?: string;
}

export interface MobileMoneyTransactionSummary {
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
}

// Provider configurations
export interface MobileMoneyProviderConfig {
  id: MobileMoneyProvider;
  name: string;
  displayName: string;
  logo?: string;
  countries: string[];
  features: {
    account_verification: boolean;
    transaction_history: boolean;
    balance_check: boolean;
    kyc_data: boolean;
  };
  apiStatus: 'active' | 'sandbox' | 'not_configured' | 'coming_soon';
}

export const MOBILE_MONEY_PROVIDERS: MobileMoneyProviderConfig[] = [
  {
    id: 'mtn_momo',
    name: 'MTN Mobile Money',
    displayName: 'MTN MoMo',
    countries: ['CI', 'GH', 'UG', 'RW', 'CM', 'BJ', 'CG', 'ZM'],
    features: {
      account_verification: true,
      transaction_history: true,
      balance_check: false,
      kyc_data: true,
    },
    apiStatus: 'not_configured',
  },
  {
    id: 'orange_money',
    name: 'Orange Money',
    displayName: 'Orange Money',
    countries: ['CI', 'SN', 'ML', 'BF', 'CM', 'GN', 'NE', 'MG'],
    features: {
      account_verification: true,
      transaction_history: false,
      balance_check: false,
      kyc_data: false,
    },
    apiStatus: 'not_configured',
  },
  {
    id: 'wave',
    name: 'Wave',
    displayName: 'Wave',
    countries: ['SN', 'CI', 'ML', 'BF', 'GM', 'UG'],
    features: {
      account_verification: true,
      transaction_history: false,
      balance_check: false,
      kyc_data: false,
    },
    apiStatus: 'not_configured',
  },
  {
    id: 'moov_money',
    name: 'Moov Money',
    displayName: 'Moov Money',
    countries: ['CI', 'BJ', 'TG', 'NE', 'GA', 'CF'],
    features: {
      account_verification: false,
      transaction_history: false,
      balance_check: false,
      kyc_data: false,
    },
    apiStatus: 'coming_soon',
  },
];

// Helper to get provider by phone prefix
export function detectProviderFromPhone(phoneNumber: string): MobileMoneyProvider | null {
  const cleanPhone = phoneNumber.replace(/[\s+\-]/g, '');
  
  // Côte d'Ivoire prefixes
  if (cleanPhone.startsWith('225')) {
    const prefix = cleanPhone.substring(3, 5);
    if (['05', '04', '54', '44'].includes(prefix)) return 'mtn_momo';
    if (['07', '08', '57', '47'].includes(prefix)) return 'orange_money';
    if (['01', '02', '51', '42'].includes(prefix)) return 'moov_money';
  }
  
  // Senegal prefixes
  if (cleanPhone.startsWith('221')) {
    const prefix = cleanPhone.substring(3, 5);
    if (['77', '78'].includes(prefix)) return 'orange_money';
    if (['76', '70'].includes(prefix)) return 'wave';
  }
  
  return null;
}

// Helper to format currency
export function formatMobileMoneyAmount(amount: number, currency = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// API connection status colors
export const API_STATUS_COLORS: Record<MobileMoneyProviderConfig['apiStatus'], {
  bg: string;
  text: string;
  label: string;
}> = {
  active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Actif' },
  sandbox: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Sandbox' },
  not_configured: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Non configuré' },
  coming_soon: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Bientôt' },
};
