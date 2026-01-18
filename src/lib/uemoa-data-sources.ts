// ============================================
// UEMOA DATA SOURCES CATALOG - Complete Registry
// Expert-level data source definitions for UEMOA credit scoring
// ============================================

export type DataSourceCategory =
  | 'banking'
  | 'mobile_money'
  | 'utilities'
  | 'telecom'
  | 'digital_footprint'
  | 'social_community'
  | 'psychometric'
  | 'market_environment'
  | 'alternative_economics'
  | 'government';

export type AcquisitionMethod =
  | 'api_direct'
  | 'api_partnership'
  | 'open_data'
  | 'scraping'
  | 'user_provided'
  | 'ocr_extraction'
  | 'device_signals'
  | 'telecom_integration'
  | 'bilateral_partnership';

export type DataType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';

export interface DataField {
  name: string;
  type: DataType;
  description: string;
  example: any; // Can be string, number, boolean, or array
  required: boolean;
  validation_rules?: string[];
}

export interface DataSourceSchema {
  fields: DataField[];
  primary_key: string;
  indexes: string[];
}

export interface DataSourceDefinition {
  id: string;
  name: string;
  category: DataSourceCategory;
  type: 'conventional' | 'alternative' | 'unconventional';
  acquisition_method: AcquisitionMethod;
  update_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'on_demand';
  schema: DataSourceSchema;
  quality_indicators: {
    reliability_score: number; // 0-100
    completeness_threshold: number; // 0-1
    freshness_hours: number;
    validation_rules: string[];
  };
  legal_considerations: string[];
  ethical_guidelines: string[];
  fallback_strategy: string;
  countries_available: string[];
  is_active: boolean;
  cost_per_request?: number; // In XOF
}

// ============================================
// A) BANKING SIGNALS
// ============================================

export const BANKING_SOURCES: DataSourceDefinition[] = [
  {
    id: 'bank_transaction_history',
    name: 'Historique Transactions Bancaires',
    category: 'banking',
    type: 'conventional',
    acquisition_method: 'ocr_extraction',
    update_frequency: 'on_demand',
    schema: {
      fields: [
        { name: 'account_number_masked', type: 'string', description: 'Numéro compte masqué', example: '****4521', required: true },
        { name: 'bank_code', type: 'string', description: 'Code établissement bancaire', example: 'SGBF', required: true },
        { name: 'statement_period_start', type: 'date', description: 'Début période relevé', example: '2024-01-01', required: true },
        { name: 'statement_period_end', type: 'date', description: 'Fin période relevé', example: '2024-03-31', required: true },
        { name: 'opening_balance', type: 'number', description: 'Solde début période', example: 150000, required: true },
        { name: 'closing_balance', type: 'number', description: 'Solde fin période', example: 285000, required: true },
        { name: 'total_credits', type: 'number', description: 'Total crédits période', example: 450000, required: true },
        { name: 'total_debits', type: 'number', description: 'Total débits période', example: 315000, required: true },
        { name: 'transaction_count', type: 'number', description: 'Nombre transactions', example: 47, required: true },
        { name: 'average_daily_balance', type: 'number', description: 'Solde moyen journalier', example: 198000, required: false },
        { name: 'balance_volatility', type: 'number', description: 'Écart-type du solde', example: 45000, required: false },
        { name: 'overdraft_days', type: 'number', description: 'Jours en découvert', example: 2, required: false },
        { name: 'salary_deposits', type: 'array', description: 'Virements salaires détectés', example: [], required: false },
        { name: 'recurring_expenses', type: 'array', description: 'Dépenses récurrentes', example: [], required: false },
      ],
      primary_key: 'account_number_masked',
      indexes: ['bank_code', 'statement_period_end'],
    },
    quality_indicators: {
      reliability_score: 85,
      completeness_threshold: 0.8,
      freshness_hours: 720, // 30 days
      validation_rules: [
        'closing_balance = opening_balance + total_credits - total_debits',
        'statement_period_end > statement_period_start',
        'transaction_count >= 0',
      ],
    },
    legal_considerations: [
      'Consentement explicite du client requis (BCEAO Règlement 15/2002)',
      'Secret bancaire - données à ne pas partager avec tiers',
      'Conservation max 5 ans après fin relation',
    ],
    ethical_guidelines: [
      'Ne pas discriminer basé sur le type de banque',
      'Considérer les contextes de banques rurales vs urbaines',
    ],
    fallback_strategy: 'Utiliser données Mobile Money comme proxy si relevés bancaires indisponibles',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
  {
    id: 'bank_cash_flow_analysis',
    name: 'Analyse Flux de Trésorerie',
    category: 'banking',
    type: 'conventional',
    acquisition_method: 'ocr_extraction',
    update_frequency: 'on_demand',
    schema: {
      fields: [
        { name: 'net_cash_flow_monthly', type: 'number', description: 'Flux net mensuel moyen', example: 75000, required: true },
        { name: 'cash_flow_volatility', type: 'number', description: 'Volatilité flux (CV)', example: 0.35, required: true },
        { name: 'seasonality_index', type: 'number', description: 'Indice saisonnalité', example: 0.15, required: false },
        { name: 'income_regularity_score', type: 'number', description: 'Score régularité revenus', example: 78, required: true },
        { name: 'expense_consistency', type: 'number', description: 'Consistance dépenses', example: 0.82, required: true },
        { name: 'savings_rate', type: 'number', description: 'Taux épargne mensuel', example: 0.12, required: false },
        { name: 'discretionary_spending_ratio', type: 'number', description: 'Ratio dépenses discrétionnaires', example: 0.25, required: false },
      ],
      primary_key: 'account_number_masked',
      indexes: ['income_regularity_score'],
    },
    quality_indicators: {
      reliability_score: 80,
      completeness_threshold: 0.7,
      freshness_hours: 720,
      validation_rules: [
        'cash_flow_volatility >= 0 AND cash_flow_volatility <= 3',
        'savings_rate >= -0.5 AND savings_rate <= 0.8',
      ],
    },
    legal_considerations: ['Données dérivées du relevé bancaire - mêmes règles'],
    ethical_guidelines: ['Interpréter la volatilité dans le contexte économique local'],
    fallback_strategy: 'Estimer via Mobile Money ou déclarations',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
];

// ============================================
// B) MOBILE MONEY (MoMo & e-wallets)
// ============================================

export const MOBILE_MONEY_SOURCES: DataSourceDefinition[] = [
  {
    id: 'mtn_momo_transactions',
    name: 'MTN Mobile Money - Transactions',
    category: 'mobile_money',
    type: 'alternative',
    acquisition_method: 'api_partnership',
    update_frequency: 'realtime',
    schema: {
      fields: [
        { name: 'phone_number_hash', type: 'string', description: 'Hash du numéro', example: 'sha256:a1b2c3...', required: true },
        { name: 'account_age_months', type: 'number', description: 'Ancienneté compte', example: 36, required: true },
        { name: 'kyc_level', type: 'string', description: 'Niveau KYC', example: 'level_2', required: true },
        { name: 'total_inflow_30d', type: 'number', description: 'Entrées 30j', example: 250000, required: true },
        { name: 'total_outflow_30d', type: 'number', description: 'Sorties 30j', example: 230000, required: true },
        { name: 'transaction_count_30d', type: 'number', description: 'Nb transactions 30j', example: 45, required: true },
        { name: 'average_balance', type: 'number', description: 'Solde moyen', example: 35000, required: true },
        { name: 'p2p_sent_count', type: 'number', description: 'Nb envois P2P', example: 12, required: true },
        { name: 'p2p_received_count', type: 'number', description: 'Nb réceptions P2P', example: 8, required: true },
        { name: 'merchant_payment_count', type: 'number', description: 'Nb paiements marchands', example: 15, required: true },
        { name: 'bill_payment_count', type: 'number', description: 'Nb paiements factures', example: 4, required: true },
        { name: 'cash_in_count', type: 'number', description: 'Nb dépôts cash', example: 6, required: true },
        { name: 'cash_out_count', type: 'number', description: 'Nb retraits cash', example: 8, required: true },
        { name: 'unique_payees_count', type: 'number', description: 'Nb bénéficiaires uniques', example: 18, required: false },
        { name: 'unique_payers_count', type: 'number', description: 'Nb payeurs uniques', example: 12, required: false },
        { name: 'reciprocity_index', type: 'number', description: 'Indice réciprocité', example: 0.67, required: false },
        { name: 'velocity_score', type: 'number', description: 'Score vélocité', example: 72, required: false },
        { name: 'night_transaction_ratio', type: 'number', description: 'Ratio transactions nuit', example: 0.08, required: false },
        { name: 'weekend_transaction_ratio', type: 'number', description: 'Ratio transactions weekend', example: 0.22, required: false },
      ],
      primary_key: 'phone_number_hash',
      indexes: ['account_age_months', 'velocity_score'],
    },
    quality_indicators: {
      reliability_score: 90,
      completeness_threshold: 0.9,
      freshness_hours: 24,
      validation_rules: [
        'total_inflow_30d >= 0',
        'total_outflow_30d >= 0',
        'reciprocity_index >= 0 AND reciprocity_index <= 1',
        'account_age_months >= 0',
      ],
    },
    legal_considerations: [
      'Consentement explicite requis (BCEAO EME)',
      'Données à ne pas croiser avec identité sans consentement',
      'Anonymisation des bénéficiaires',
    ],
    ethical_guidelines: [
      'Ne pas pénaliser les faibles volumes en zone rurale',
      'Considérer saisonnalité agricole',
    ],
    fallback_strategy: 'Demander relevé SMS ou capture écran wallet',
    countries_available: ['CI', 'BJ', 'BF', 'GW'],
    is_active: true,
  },
  {
    id: 'orange_money_transactions',
    name: 'Orange Money - Transactions',
    category: 'mobile_money',
    type: 'alternative',
    acquisition_method: 'api_partnership',
    update_frequency: 'realtime',
    schema: {
      fields: [
        { name: 'phone_number_hash', type: 'string', description: 'Hash du numéro', example: 'sha256:d4e5f6...', required: true },
        { name: 'account_creation_date', type: 'date', description: 'Date création compte', example: '2020-05-15', required: true },
        { name: 'total_volume_90d', type: 'number', description: 'Volume total 90j', example: 850000, required: true },
        { name: 'average_transaction_size', type: 'number', description: 'Taille moyenne transaction', example: 15000, required: true },
        { name: 'international_transfer_count', type: 'number', description: 'Nb transferts internationaux', example: 2, required: false },
        { name: 'airtime_purchase_total', type: 'number', description: 'Total achats crédit', example: 25000, required: false },
        { name: 'savings_product_active', type: 'boolean', description: 'Produit épargne actif', example: true, required: false },
        { name: 'loan_product_history', type: 'array', description: 'Historique prêts MoMo', example: [], required: false },
        { name: 'churn_risk_score', type: 'number', description: 'Score risque churn', example: 15, required: false },
      ],
      primary_key: 'phone_number_hash',
      indexes: ['total_volume_90d'],
    },
    quality_indicators: {
      reliability_score: 88,
      completeness_threshold: 0.85,
      freshness_hours: 24,
      validation_rules: ['total_volume_90d >= 0', 'average_transaction_size >= 0'],
    },
    legal_considerations: ['BCEAO EME Licence', 'RGPD Orange Group'],
    ethical_guidelines: ['Traitement équitable multi-opérateurs'],
    fallback_strategy: 'Utiliser MTN MoMo ou Wave comme alternative',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'NE', 'GW'],
    is_active: true,
  },
  {
    id: 'wave_transactions',
    name: 'Wave - Transactions',
    category: 'mobile_money',
    type: 'alternative',
    acquisition_method: 'api_partnership',
    update_frequency: 'realtime',
    schema: {
      fields: [
        { name: 'phone_number_hash', type: 'string', description: 'Hash du numéro', example: 'sha256:g7h8i9...', required: true },
        { name: 'account_age_days', type: 'number', description: 'Ancienneté compte jours', example: 540, required: true },
        { name: 'qr_payment_count_30d', type: 'number', description: 'Paiements QR 30j', example: 22, required: true },
        { name: 'total_spend_30d', type: 'number', description: 'Dépenses totales 30j', example: 180000, required: true },
        { name: 'merchant_diversity_score', type: 'number', description: 'Diversité marchands', example: 0.75, required: false },
        { name: 'savings_balance', type: 'number', description: 'Solde épargne Wave', example: 50000, required: false },
        { name: 'loan_eligibility_tier', type: 'string', description: 'Tier éligibilité prêt Wave', example: 'gold', required: false },
      ],
      primary_key: 'phone_number_hash',
      indexes: ['account_age_days', 'qr_payment_count_30d'],
    },
    quality_indicators: {
      reliability_score: 85,
      completeness_threshold: 0.8,
      freshness_hours: 24,
      validation_rules: ['account_age_days >= 0', 'qr_payment_count_30d >= 0'],
    },
    legal_considerations: ['BCEAO EME Licence'],
    ethical_guidelines: ['Wave récent - éviter biais ancienneté'],
    fallback_strategy: 'Utiliser Orange Money ou MTN MoMo',
    countries_available: ['SN', 'CI', 'ML', 'BF'],
    is_active: true,
  },
  {
    id: 'mobile_money_network_graph',
    name: 'Graphe Réseau Mobile Money',
    category: 'mobile_money',
    type: 'unconventional',
    acquisition_method: 'api_partnership',
    update_frequency: 'weekly',
    schema: {
      fields: [
        { name: 'user_node_id', type: 'string', description: 'ID noeud utilisateur', example: 'node_12345', required: true },
        { name: 'connections_count', type: 'number', description: 'Nb connexions', example: 45, required: true },
        { name: 'cluster_coefficient', type: 'number', description: 'Coefficient clustering', example: 0.42, required: true },
        { name: 'pagerank_score', type: 'number', description: 'Score PageRank', example: 0.0015, required: false },
        { name: 'community_id', type: 'string', description: 'ID communauté détectée', example: 'comm_78', required: false },
        { name: 'centrality_score', type: 'number', description: 'Score centralité', example: 0.35, required: false },
        { name: 'stable_connections_ratio', type: 'number', description: 'Ratio connexions stables', example: 0.68, required: false },
      ],
      primary_key: 'user_node_id',
      indexes: ['cluster_coefficient', 'centrality_score'],
    },
    quality_indicators: {
      reliability_score: 75,
      completeness_threshold: 0.6,
      freshness_hours: 168,
      validation_rules: [
        'cluster_coefficient >= 0 AND cluster_coefficient <= 1',
        'pagerank_score >= 0',
      ],
    },
    legal_considerations: ['Données agrégées uniquement', 'Pas d\'identification des contacts'],
    ethical_guidelines: ['Ne pas utiliser pour discrimination sociale'],
    fallback_strategy: 'Ignorer ce signal si indisponible',
    countries_available: ['CI', 'SN'],
    is_active: false, // Requires advanced partnership
  },
];

// ============================================
// C) UTILITIES + RECURRING OBLIGATIONS
// ============================================

export const UTILITIES_SOURCES: DataSourceDefinition[] = [
  {
    id: 'electricity_cie',
    name: 'CIE Électricité (Côte d\'Ivoire)',
    category: 'utilities',
    type: 'alternative',
    acquisition_method: 'ocr_extraction',
    update_frequency: 'monthly',
    schema: {
      fields: [
        { name: 'customer_reference', type: 'string', description: 'Référence client CIE', example: 'CIE-2024-12345', required: true },
        { name: 'meter_number', type: 'string', description: 'Numéro compteur', example: 'M-987654', required: true },
        { name: 'contract_type', type: 'string', description: 'Type contrat', example: 'domestique_5A', required: true },
        { name: 'consumption_kwh_avg', type: 'number', description: 'Consommation moyenne kWh', example: 245, required: true },
        { name: 'bill_amount_avg', type: 'number', description: 'Montant facture moyen', example: 18500, required: true },
        { name: 'payment_on_time_count', type: 'number', description: 'Nb paiements à temps (12m)', example: 10, required: true },
        { name: 'payment_late_count', type: 'number', description: 'Nb paiements en retard (12m)', example: 2, required: true },
        { name: 'disconnection_count', type: 'number', description: 'Nb coupures pour impayé', example: 0, required: true },
        { name: 'connection_duration_months', type: 'number', description: 'Durée connexion mois', example: 48, required: false },
        { name: 'address_stability', type: 'boolean', description: 'Adresse stable', example: true, required: false },
      ],
      primary_key: 'customer_reference',
      indexes: ['payment_on_time_count', 'connection_duration_months'],
    },
    quality_indicators: {
      reliability_score: 80,
      completeness_threshold: 0.75,
      freshness_hours: 720,
      validation_rules: [
        'payment_on_time_count + payment_late_count <= 12',
        'consumption_kwh_avg >= 0',
      ],
    },
    legal_considerations: ['Consentement client requis', 'Données factures personnelles'],
    ethical_guidelines: ['Considérer compteurs collectifs dans habitat communautaire'],
    fallback_strategy: 'Demander 3 dernières factures en photo',
    countries_available: ['CI'],
    is_active: true,
  },
  {
    id: 'water_sodeci',
    name: 'SODECI Eau (Côte d\'Ivoire)',
    category: 'utilities',
    type: 'alternative',
    acquisition_method: 'ocr_extraction',
    update_frequency: 'monthly',
    schema: {
      fields: [
        { name: 'customer_reference', type: 'string', description: 'Référence client', example: 'SOD-78945', required: true },
        { name: 'consumption_m3_avg', type: 'number', description: 'Consommation moyenne m³', example: 12, required: true },
        { name: 'bill_amount_avg', type: 'number', description: 'Montant facture moyen', example: 8500, required: true },
        { name: 'payment_history_12m', type: 'array', description: 'Historique paiements 12m', example: [], required: false },
        { name: 'late_payment_ratio', type: 'number', description: 'Ratio retards paiement', example: 0.08, required: false },
      ],
      primary_key: 'customer_reference',
      indexes: ['late_payment_ratio'],
    },
    quality_indicators: {
      reliability_score: 70,
      completeness_threshold: 0.7,
      freshness_hours: 720,
      validation_rules: ['consumption_m3_avg >= 0', 'late_payment_ratio >= 0 AND late_payment_ratio <= 1'],
    },
    legal_considerations: ['Consentement client requis'],
    ethical_guidelines: ['Abonnements partagés courants - ajuster'],
    fallback_strategy: 'Estimer via Mobile Money bill payments',
    countries_available: ['CI'],
    is_active: true,
  },
  {
    id: 'telecom_postpaid',
    name: 'Abonnement Télécom Postpayé',
    category: 'utilities',
    type: 'alternative',
    acquisition_method: 'user_provided',
    update_frequency: 'monthly',
    schema: {
      fields: [
        { name: 'operator', type: 'string', description: 'Opérateur', example: 'Orange', required: true },
        { name: 'plan_type', type: 'string', description: 'Type forfait', example: 'business_50GB', required: true },
        { name: 'monthly_amount', type: 'number', description: 'Montant mensuel', example: 45000, required: true },
        { name: 'account_age_months', type: 'number', description: 'Ancienneté compte mois', example: 24, required: true },
        { name: 'payment_punctuality_score', type: 'number', description: 'Score ponctualité', example: 92, required: false },
      ],
      primary_key: 'phone_number_hash',
      indexes: ['account_age_months'],
    },
    quality_indicators: {
      reliability_score: 65,
      completeness_threshold: 0.6,
      freshness_hours: 720,
      validation_rules: ['monthly_amount >= 0', 'account_age_months >= 0'],
    },
    legal_considerations: ['Postpayé limité en UEMOA', 'Données opérateur confidentielles'],
    ethical_guidelines: ['Postpayé corrélé à statut socio-économique - attention biais'],
    fallback_strategy: 'Utiliser comportement recharge prépayé',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
  {
    id: 'rent_payment_history',
    name: 'Historique Paiement Loyer',
    category: 'utilities',
    type: 'alternative',
    acquisition_method: 'user_provided',
    update_frequency: 'monthly',
    schema: {
      fields: [
        { name: 'landlord_type', type: 'string', description: 'Type bailleur', example: 'particulier', required: true },
        { name: 'monthly_rent', type: 'number', description: 'Loyer mensuel', example: 85000, required: true },
        { name: 'lease_duration_months', type: 'number', description: 'Durée bail mois', example: 24, required: true },
        { name: 'payment_method', type: 'string', description: 'Mode paiement', example: 'mobile_money', required: false },
        { name: 'late_payments_12m', type: 'number', description: 'Retards 12 mois', example: 1, required: false },
        { name: 'landlord_phone_verified', type: 'boolean', description: 'Téléphone bailleur vérifié', example: true, required: false },
      ],
      primary_key: 'user_id',
      indexes: ['lease_duration_months'],
    },
    quality_indicators: {
      reliability_score: 50,
      completeness_threshold: 0.5,
      freshness_hours: 720,
      validation_rules: ['monthly_rent >= 0', 'late_payments_12m >= 0'],
    },
    legal_considerations: ['Données auto-déclarées - vérification recommandée'],
    ethical_guidelines: ['Loyer informel courant - ne pas pénaliser'],
    fallback_strategy: 'Vérifier via Mobile Money transfers récurrents',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
];

// ============================================
// D) TELECOM & DEVICE SIGNALS
// ============================================

export const TELECOM_SOURCES: DataSourceDefinition[] = [
  {
    id: 'sim_stability',
    name: 'Stabilité SIM',
    category: 'telecom',
    type: 'alternative',
    acquisition_method: 'telecom_integration',
    update_frequency: 'daily',
    schema: {
      fields: [
        { name: 'msisdn_hash', type: 'string', description: 'Hash MSISDN', example: 'sha256:j1k2l3...', required: true },
        { name: 'sim_age_months', type: 'number', description: 'Ancienneté SIM mois', example: 42, required: true },
        { name: 'sim_swap_count_12m', type: 'number', description: 'Changements SIM 12m', example: 0, required: true },
        { name: 'primary_operator', type: 'string', description: 'Opérateur principal', example: 'MTN', required: true },
        { name: 'dual_sim_detected', type: 'boolean', description: 'Double SIM détectée', example: true, required: false },
        { name: 'roaming_frequency', type: 'number', description: 'Fréquence roaming', example: 0.02, required: false },
        { name: 'active_days_30d', type: 'number', description: 'Jours actifs 30j', example: 28, required: true },
      ],
      primary_key: 'msisdn_hash',
      indexes: ['sim_age_months', 'sim_swap_count_12m'],
    },
    quality_indicators: {
      reliability_score: 80,
      completeness_threshold: 0.8,
      freshness_hours: 24,
      validation_rules: [
        'sim_age_months >= 0',
        'sim_swap_count_12m >= 0',
        'active_days_30d >= 0 AND active_days_30d <= 30',
      ],
    },
    legal_considerations: ['Partenariat opérateur requis', 'Données télécoms sensibles'],
    ethical_guidelines: ['Ne pas discriminer multi-SIM (pratique courante)'],
    fallback_strategy: 'Demander déclaration utilisateur + vérifier via OTP',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG'],
    is_active: false, // Requires telco partnership
  },
  {
    id: 'topup_behavior',
    name: 'Comportement Recharge Crédit',
    category: 'telecom',
    type: 'alternative',
    acquisition_method: 'api_partnership',
    update_frequency: 'daily',
    schema: {
      fields: [
        { name: 'msisdn_hash', type: 'string', description: 'Hash MSISDN', example: 'sha256:m4n5o6...', required: true },
        { name: 'topup_count_30d', type: 'number', description: 'Nb recharges 30j', example: 8, required: true },
        { name: 'topup_total_30d', type: 'number', description: 'Total recharges 30j', example: 15000, required: true },
        { name: 'average_topup_amount', type: 'number', description: 'Montant moyen recharge', example: 1875, required: true },
        { name: 'topup_regularity_score', type: 'number', description: 'Score régularité recharge', example: 72, required: false },
        { name: 'zero_balance_frequency', type: 'number', description: 'Fréquence solde zéro', example: 0.15, required: false },
        { name: 'topup_source_diversity', type: 'number', description: 'Diversité sources recharge', example: 3, required: false },
      ],
      primary_key: 'msisdn_hash',
      indexes: ['topup_regularity_score'],
    },
    quality_indicators: {
      reliability_score: 75,
      completeness_threshold: 0.7,
      freshness_hours: 24,
      validation_rules: ['topup_count_30d >= 0', 'topup_total_30d >= 0'],
    },
    legal_considerations: ['Partenariat opérateur requis'],
    ethical_guidelines: ['Petites recharges fréquentes = économie informelle, pas risque'],
    fallback_strategy: 'Estimer via airtime purchases Mobile Money',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
  {
    id: 'device_signals',
    name: 'Signaux Appareil',
    category: 'telecom',
    type: 'unconventional',
    acquisition_method: 'device_signals',
    update_frequency: 'realtime',
    schema: {
      fields: [
        { name: 'device_id_hash', type: 'string', description: 'Hash ID appareil', example: 'sha256:p7q8r9...', required: true },
        { name: 'device_brand', type: 'string', description: 'Marque appareil', example: 'Samsung', required: true },
        { name: 'device_model', type: 'string', description: 'Modèle appareil', example: 'Galaxy A52', required: true },
        { name: 'os_version', type: 'string', description: 'Version OS', example: 'Android 13', required: true },
        { name: 'device_age_estimate_months', type: 'number', description: 'Âge estimé appareil mois', example: 18, required: false },
        { name: 'screen_resolution', type: 'string', description: 'Résolution écran', example: '1080x2400', required: false },
        { name: 'storage_available_gb', type: 'number', description: 'Stockage disponible GB', example: 45, required: false },
        { name: 'battery_health_estimate', type: 'number', description: 'Santé batterie estimée', example: 0.85, required: false },
        { name: 'installed_banking_apps', type: 'number', description: 'Nb apps bancaires', example: 3, required: false },
        { name: 'installed_shopping_apps', type: 'number', description: 'Nb apps shopping', example: 5, required: false },
        { name: 'language_setting', type: 'string', description: 'Langue système', example: 'fr_CI', required: false },
      ],
      primary_key: 'device_id_hash',
      indexes: ['device_brand'],
    },
    quality_indicators: {
      reliability_score: 60,
      completeness_threshold: 0.5,
      freshness_hours: 1,
      validation_rules: ['device_age_estimate_months >= 0'],
    },
    legal_considerations: [
      'Consentement explicite requis',
      'Privacy concerns majeurs',
      'Ne pas stocker liste apps exacte',
    ],
    ethical_guidelines: [
      'Ne pas discriminer basé sur marque appareil',
      'Considérer téléphones partagés',
    ],
    fallback_strategy: 'Ignorer ce signal si non consenti',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
  {
    id: 'location_patterns',
    name: 'Patterns Localisation',
    category: 'telecom',
    type: 'unconventional',
    acquisition_method: 'device_signals',
    update_frequency: 'daily',
    schema: {
      fields: [
        { name: 'user_id_hash', type: 'string', description: 'Hash utilisateur', example: 'sha256:s1t2u3...', required: true },
        { name: 'primary_location_city', type: 'string', description: 'Ville principale', example: 'Abidjan', required: true },
        { name: 'primary_location_zone', type: 'string', description: 'Zone économique', example: 'cocody', required: false },
        { name: 'location_stability_score', type: 'number', description: 'Score stabilité lieu', example: 0.85, required: true },
        { name: 'daily_commute_distance_km', type: 'number', description: 'Distance trajet quotidien km', example: 12, required: false },
        { name: 'work_location_detected', type: 'boolean', description: 'Lieu travail détecté', example: true, required: false },
        { name: 'urban_rural_classification', type: 'string', description: 'Classification urbain/rural', example: 'urban', required: false },
        { name: 'location_diversity_30d', type: 'number', description: 'Diversité lieux 30j', example: 8, required: false },
      ],
      primary_key: 'user_id_hash',
      indexes: ['location_stability_score', 'urban_rural_classification'],
    },
    quality_indicators: {
      reliability_score: 65,
      completeness_threshold: 0.6,
      freshness_hours: 24,
      validation_rules: [
        'location_stability_score >= 0 AND location_stability_score <= 1',
        'daily_commute_distance_km >= 0',
      ],
    },
    legal_considerations: [
      'Consentement géolocalisation explicite',
      'Ne pas stocker coordonnées exactes',
      'Agrégation minimale commune/quartier',
    ],
    ethical_guidelines: [
      'Mobilité rurale différente de urbaine',
      'Migrations saisonnières agricoles normales',
    ],
    fallback_strategy: 'Utiliser adresse déclarée + zone économique',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
];

// ============================================
// E) DIGITAL FOOTPRINT
// ============================================

export const DIGITAL_FOOTPRINT_SOURCES: DataSourceDefinition[] = [
  {
    id: 'app_engagement',
    name: 'Engagement Application',
    category: 'digital_footprint',
    type: 'alternative',
    acquisition_method: 'device_signals',
    update_frequency: 'realtime',
    schema: {
      fields: [
        { name: 'user_id', type: 'string', description: 'ID utilisateur app', example: 'usr_12345', required: true },
        { name: 'sessions_count_30d', type: 'number', description: 'Nb sessions 30j', example: 45, required: true },
        { name: 'avg_session_duration_sec', type: 'number', description: 'Durée moyenne session sec', example: 180, required: true },
        { name: 'features_used_count', type: 'number', description: 'Nb fonctionnalités utilisées', example: 8, required: false },
        { name: 'form_completion_rate', type: 'number', description: 'Taux complétion formulaires', example: 0.92, required: false },
        { name: 'time_to_complete_forms_sec', type: 'number', description: 'Temps complétion formulaires sec', example: 240, required: false },
        { name: 'abandonment_points', type: 'array', description: 'Points abandon', example: [], required: false },
        { name: 'preferred_hours', type: 'array', description: 'Heures préférées utilisation', example: [9, 18, 20], required: false },
        { name: 'notification_response_rate', type: 'number', description: 'Taux réponse notifications', example: 0.65, required: false },
      ],
      primary_key: 'user_id',
      indexes: ['sessions_count_30d', 'form_completion_rate'],
    },
    quality_indicators: {
      reliability_score: 70,
      completeness_threshold: 0.7,
      freshness_hours: 1,
      validation_rules: [
        'sessions_count_30d >= 0',
        'form_completion_rate >= 0 AND form_completion_rate <= 1',
      ],
    },
    legal_considerations: ['Données first-party', 'Politique confidentialité app'],
    ethical_guidelines: ['Ne pas pénaliser utilisateurs occasionnels'],
    fallback_strategy: 'Ignorer si données insuffisantes',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
];

// ============================================
// F) SOCIAL / COMMUNITY / COOPERATIVE
// ============================================

export const SOCIAL_COMMUNITY_SOURCES: DataSourceDefinition[] = [
  {
    id: 'tontine_membership',
    name: 'Participation Tontines',
    category: 'social_community',
    type: 'unconventional',
    acquisition_method: 'user_provided',
    update_frequency: 'monthly',
    schema: {
      fields: [
        { name: 'user_id', type: 'string', description: 'ID utilisateur', example: 'usr_12345', required: true },
        { name: 'tontine_count', type: 'number', description: 'Nb tontines actives', example: 2, required: true },
        { name: 'monthly_contribution_total', type: 'number', description: 'Cotisation mensuelle totale', example: 25000, required: true },
        { name: 'membership_duration_avg_months', type: 'number', description: 'Durée moyenne adhésion mois', example: 18, required: false },
        { name: 'is_tontine_organizer', type: 'boolean', description: 'Est organisateur tontine', example: false, required: false },
        { name: 'missed_contributions_12m', type: 'number', description: 'Cotisations manquées 12m', example: 0, required: false },
        { name: 'payout_received_12m', type: 'number', description: 'Versements reçus 12m', example: 1, required: false },
        { name: 'tontine_group_size_avg', type: 'number', description: 'Taille moyenne groupe', example: 15, required: false },
        { name: 'verification_method', type: 'string', description: 'Méthode vérification', example: 'organizer_call', required: false },
      ],
      primary_key: 'user_id',
      indexes: ['tontine_count', 'missed_contributions_12m'],
    },
    quality_indicators: {
      reliability_score: 55,
      completeness_threshold: 0.5,
      freshness_hours: 720,
      validation_rules: [
        'tontine_count >= 0',
        'monthly_contribution_total >= 0',
        'missed_contributions_12m >= 0',
      ],
    },
    legal_considerations: ['Données auto-déclarées', 'Tontines souvent informelles'],
    ethical_guidelines: [
      'Tontines = crédit social positif',
      'Vérification difficile - pondérer en conséquence',
    ],
    fallback_strategy: 'Vérifier via transferts récurrents Mobile Money',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
  {
    id: 'cooperative_membership',
    name: 'Adhésion Coopérative Agricole',
    category: 'social_community',
    type: 'alternative',
    acquisition_method: 'api_partnership',
    update_frequency: 'monthly',
    schema: {
      fields: [
        { name: 'farmer_id', type: 'string', description: 'ID agriculteur', example: 'AGR-12345', required: true },
        { name: 'cooperative_name', type: 'string', description: 'Nom coopérative', example: 'COOP-CACAO-DIVO', required: true },
        { name: 'membership_years', type: 'number', description: 'Années adhésion', example: 5, required: true },
        { name: 'production_volume_last_season', type: 'number', description: 'Volume production saison kg', example: 2500, required: false },
        { name: 'coop_loan_history', type: 'array', description: 'Historique prêts coop', example: [], required: false },
        { name: 'coop_loan_default_count', type: 'number', description: 'Nb défauts prêts coop', example: 0, required: false },
        { name: 'certification_status', type: 'string', description: 'Certification (FairTrade, UTZ)', example: 'fairtrade', required: false },
      ],
      primary_key: 'farmer_id',
      indexes: ['membership_years', 'coop_loan_default_count'],
    },
    quality_indicators: {
      reliability_score: 75,
      completeness_threshold: 0.7,
      freshness_hours: 720,
      validation_rules: ['membership_years >= 0', 'coop_loan_default_count >= 0'],
    },
    legal_considerations: ['Registre coopératives officiel', 'Partenariat requis'],
    ethical_guidelines: ['Saisonnalité agricole à considérer'],
    fallback_strategy: 'Demander attestation coopérative',
    countries_available: ['CI', 'SN', 'ML', 'BF'],
    is_active: false, // Requires partnership
  },
  {
    id: 'professional_association',
    name: 'Associations Professionnelles',
    category: 'social_community',
    type: 'alternative',
    acquisition_method: 'user_provided',
    update_frequency: 'on_demand',
    schema: {
      fields: [
        { name: 'user_id', type: 'string', description: 'ID utilisateur', example: 'usr_12345', required: true },
        { name: 'association_name', type: 'string', description: 'Nom association', example: 'CGECI', required: true },
        { name: 'membership_type', type: 'string', description: 'Type adhésion', example: 'membre_actif', required: true },
        { name: 'membership_years', type: 'number', description: 'Années adhésion', example: 3, required: true },
        { name: 'leadership_role', type: 'boolean', description: 'Rôle direction', example: false, required: false },
        { name: 'dues_paid_current', type: 'boolean', description: 'Cotisations à jour', example: true, required: false },
      ],
      primary_key: 'user_id',
      indexes: ['membership_years'],
    },
    quality_indicators: {
      reliability_score: 55,
      completeness_threshold: 0.5,
      freshness_hours: 720,
      validation_rules: ['membership_years >= 0'],
    },
    legal_considerations: ['Registre associations', 'Auto-déclaration courante'],
    ethical_guidelines: ['Ne pas discriminer non-membres'],
    fallback_strategy: 'Vérifier via recherche publique',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
  {
    id: 'commercial_references',
    name: 'Références Commerciales',
    category: 'social_community',
    type: 'alternative',
    acquisition_method: 'user_provided',
    update_frequency: 'on_demand',
    schema: {
      fields: [
        { name: 'user_id', type: 'string', description: 'ID utilisateur', example: 'usr_12345', required: true },
        { name: 'reference_count', type: 'number', description: 'Nb références', example: 3, required: true },
        { name: 'references', type: 'array', description: 'Liste références', example: [], required: true },
        { name: 'avg_relationship_years', type: 'number', description: 'Durée moyenne relation années', example: 2.5, required: false },
        { name: 'verified_count', type: 'number', description: 'Nb références vérifiées', example: 2, required: false },
        { name: 'avg_confidence_score', type: 'number', description: 'Score confiance moyen', example: 0.75, required: false },
      ],
      primary_key: 'user_id',
      indexes: ['reference_count', 'verified_count'],
    },
    quality_indicators: {
      reliability_score: 50,
      completeness_threshold: 0.4,
      freshness_hours: 720,
      validation_rules: ['reference_count >= 0', 'verified_count <= reference_count'],
    },
    legal_considerations: ['Consentement tiers requis', 'Vérification manuelle'],
    ethical_guidelines: ['Biais de sélection évident'],
    fallback_strategy: 'Ignorer si aucune référence vérifiable',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
];

// ============================================
// G) PSYCHOMETRIC & BEHAVIORAL
// ============================================

export const PSYCHOMETRIC_SOURCES: DataSourceDefinition[] = [
  {
    id: 'psychometric_quiz',
    name: 'Questionnaire Psychométrique',
    category: 'psychometric',
    type: 'unconventional',
    acquisition_method: 'user_provided',
    update_frequency: 'on_demand',
    schema: {
      fields: [
        { name: 'session_id', type: 'string', description: 'ID session quiz', example: 'quiz_12345', required: true },
        { name: 'user_id', type: 'string', description: 'ID utilisateur', example: 'usr_12345', required: true },
        { name: 'completion_time_sec', type: 'number', description: 'Temps complétion sec', example: 420, required: true },
        { name: 'risk_attitude_score', type: 'number', description: 'Score attitude risque', example: 65, required: true },
        { name: 'financial_planning_score', type: 'number', description: 'Score planification financière', example: 72, required: true },
        { name: 'perseverance_score', type: 'number', description: 'Score persévérance', example: 78, required: true },
        { name: 'social_network_score', type: 'number', description: 'Score réseau social', example: 68, required: true },
        { name: 'emergency_handling_score', type: 'number', description: 'Score gestion imprévus', example: 55, required: true },
        { name: 'response_consistency', type: 'number', description: 'Consistance réponses', example: 0.88, required: true },
        { name: 'attention_check_passed', type: 'boolean', description: 'Questions attention passées', example: true, required: true },
        { name: 'gaming_detection_flag', type: 'boolean', description: 'Suspicion gaming', example: false, required: false },
        { name: 'cultural_adjustment_applied', type: 'boolean', description: 'Ajustement culturel appliqué', example: true, required: false },
      ],
      primary_key: 'session_id',
      indexes: ['user_id', 'response_consistency'],
    },
    quality_indicators: {
      reliability_score: 60,
      completeness_threshold: 0.9,
      freshness_hours: 8760, // 1 year
      validation_rules: [
        'completion_time_sec >= 120', // Minimum 2 minutes
        'response_consistency >= 0.5',
        'attention_check_passed = true',
      ],
    },
    legal_considerations: [
      'Non-discrimination obligatoire',
      'Ne pas utiliser comme seul facteur décisionnel',
      'Explication du score requise',
    ],
    ethical_guidelines: [
      'Biais culturel à neutraliser',
      'Niveau éducation variable - questions adaptées',
      'Ne pas pénaliser réponses honnêtes négatives',
    ],
    fallback_strategy: 'Score neutre 0.5 si quiz non complété',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
  {
    id: 'financial_literacy_test',
    name: 'Test Littératie Financière',
    category: 'psychometric',
    type: 'unconventional',
    acquisition_method: 'user_provided',
    update_frequency: 'on_demand',
    schema: {
      fields: [
        { name: 'session_id', type: 'string', description: 'ID session test', example: 'lit_12345', required: true },
        { name: 'user_id', type: 'string', description: 'ID utilisateur', example: 'usr_12345', required: true },
        { name: 'interest_comprehension', type: 'number', description: 'Compréhension intérêts', example: 80, required: true },
        { name: 'budget_skills', type: 'number', description: 'Compétences budget', example: 75, required: true },
        { name: 'savings_understanding', type: 'number', description: 'Compréhension épargne', example: 70, required: true },
        { name: 'risk_understanding', type: 'number', description: 'Compréhension risque', example: 65, required: true },
        { name: 'planning_horizon', type: 'string', description: 'Horizon planification', example: 'medium_term', required: false },
        { name: 'overall_literacy_score', type: 'number', description: 'Score littératie global', example: 72, required: true },
      ],
      primary_key: 'session_id',
      indexes: ['user_id', 'overall_literacy_score'],
    },
    quality_indicators: {
      reliability_score: 55,
      completeness_threshold: 0.8,
      freshness_hours: 8760,
      validation_rules: [
        'interest_comprehension >= 0 AND interest_comprehension <= 100',
        'overall_literacy_score >= 0 AND overall_literacy_score <= 100',
      ],
    },
    legal_considerations: ['Non-discrimination', 'Niveau éducation variable'],
    ethical_guidelines: ['Adapter au contexte culturel local'],
    fallback_strategy: 'Ignorer si test non complété',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
];

// ============================================
// H) MARKET & ENVIRONMENT
// ============================================

export const MARKET_ENVIRONMENT_SOURCES: DataSourceDefinition[] = [
  {
    id: 'local_price_indices',
    name: 'Indices Prix Locaux',
    category: 'market_environment',
    type: 'alternative',
    acquisition_method: 'open_data',
    update_frequency: 'monthly',
    schema: {
      fields: [
        { name: 'region', type: 'string', description: 'Région', example: 'abidjan', required: true },
        { name: 'month', type: 'string', description: 'Mois', example: '2024-03', required: true },
        { name: 'food_staples_index', type: 'number', description: 'Indice denrées base', example: 105.2, required: true },
        { name: 'transport_index', type: 'number', description: 'Indice transport', example: 98.5, required: true },
        { name: 'housing_index', type: 'number', description: 'Indice logement', example: 110.3, required: false },
        { name: 'inflation_yoy', type: 'number', description: 'Inflation annuelle %', example: 4.2, required: true },
        { name: 'economic_stress_indicator', type: 'number', description: 'Indicateur stress éco', example: 0.35, required: false },
      ],
      primary_key: 'region_month',
      indexes: ['region', 'month'],
    },
    quality_indicators: {
      reliability_score: 85,
      completeness_threshold: 0.8,
      freshness_hours: 720,
      validation_rules: ['food_staples_index > 0', 'inflation_yoy >= -50 AND inflation_yoy <= 100'],
    },
    legal_considerations: ['Données publiques INS', 'Aucune restriction'],
    ethical_guidelines: ['Contextualiser le scoring par zone économique'],
    fallback_strategy: 'Utiliser données nationales si régionales indisponibles',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
  {
    id: 'economic_zone_classification',
    name: 'Classification Zone Économique',
    category: 'market_environment',
    type: 'alternative',
    acquisition_method: 'open_data',
    update_frequency: 'monthly',
    schema: {
      fields: [
        { name: 'zone_id', type: 'string', description: 'ID zone', example: 'CI-ABJ-COCODY', required: true },
        { name: 'city', type: 'string', description: 'Ville', example: 'Abidjan', required: true },
        { name: 'neighborhood', type: 'string', description: 'Quartier', example: 'Cocody', required: false },
        { name: 'economic_tier', type: 'string', description: 'Tier économique', example: 'metro', required: true },
        { name: 'gdp_per_capita_estimate', type: 'number', description: 'PIB/hab estimé', example: 2500000, required: false },
        { name: 'formal_employment_rate', type: 'number', description: 'Taux emploi formel', example: 0.35, required: false },
        { name: 'banking_access_score', type: 'number', description: 'Score accès bancaire', example: 0.85, required: false },
        { name: 'infrastructure_score', type: 'number', description: 'Score infrastructure', example: 0.90, required: true },
        { name: 'climate_risk_index', type: 'number', description: 'Indice risque climat', example: 0.15, required: false },
      ],
      primary_key: 'zone_id',
      indexes: ['economic_tier', 'infrastructure_score'],
    },
    quality_indicators: {
      reliability_score: 80,
      completeness_threshold: 0.7,
      freshness_hours: 720,
      validation_rules: [
        'infrastructure_score >= 0 AND infrastructure_score <= 1',
        'formal_employment_rate >= 0 AND formal_employment_rate <= 1',
      ],
    },
    legal_considerations: ['Données publiques agrégées'],
    ethical_guidelines: ['Ne pas discriminer zones rurales', 'Ajuster seuils par contexte'],
    fallback_strategy: 'Utiliser classification nationale par défaut',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
];

// ============================================
// I) ALTERNATIVE ECONOMICS
// ============================================

export const ALTERNATIVE_ECONOMICS_SOURCES: DataSourceDefinition[] = [
  {
    id: 'agricultural_data',
    name: 'Données Agricoles',
    category: 'alternative_economics',
    type: 'unconventional',
    acquisition_method: 'api_partnership',
    update_frequency: 'monthly',
    schema: {
      fields: [
        { name: 'farmer_id', type: 'string', description: 'ID agriculteur', example: 'AGR-12345', required: true },
        { name: 'crop_types', type: 'array', description: 'Types cultures', example: ['cacao', 'café'], required: true },
        { name: 'land_size_hectares', type: 'number', description: 'Taille terres ha', example: 3.5, required: true },
        { name: 'yield_last_season_kg', type: 'number', description: 'Rendement saison kg', example: 2800, required: false },
        { name: 'yield_vs_regional_avg', type: 'number', description: 'Rendement vs moyenne région', example: 1.15, required: false },
        { name: 'certifications', type: 'array', description: 'Certifications', example: ['fairtrade'], required: false },
        { name: 'cooperative_membership', type: 'boolean', description: 'Membre coopérative', example: true, required: false },
        { name: 'irrigation_access', type: 'boolean', description: 'Accès irrigation', example: false, required: false },
        { name: 'storage_capacity', type: 'number', description: 'Capacité stockage kg', example: 1000, required: false },
        { name: 'market_access_score', type: 'number', description: 'Score accès marché', example: 0.7, required: false },
      ],
      primary_key: 'farmer_id',
      indexes: ['crop_types', 'land_size_hectares'],
    },
    quality_indicators: {
      reliability_score: 65,
      completeness_threshold: 0.6,
      freshness_hours: 720,
      validation_rules: ['land_size_hectares > 0', 'yield_last_season_kg >= 0'],
    },
    legal_considerations: ['Partenariat ministère agriculture', 'Données sensibles production'],
    ethical_guidelines: ['Saisonnalité critique', 'Risques climatiques à considérer'],
    fallback_strategy: 'Estimer via déclarations et zone géographique',
    countries_available: ['CI', 'SN', 'ML', 'BF'],
    is_active: false, // Requires partnership
  },
  {
    id: 'transport_business_kpis',
    name: 'KPIs Transport',
    category: 'alternative_economics',
    type: 'unconventional',
    acquisition_method: 'user_provided',
    update_frequency: 'weekly',
    schema: {
      fields: [
        { name: 'operator_id', type: 'string', description: 'ID opérateur', example: 'TRN-12345', required: true },
        { name: 'vehicle_type', type: 'string', description: 'Type véhicule', example: 'taxi_compteur', required: true },
        { name: 'vehicle_count', type: 'number', description: 'Nb véhicules', example: 2, required: true },
        { name: 'daily_revenue_avg', type: 'number', description: 'Revenu quotidien moyen', example: 35000, required: true },
        { name: 'operating_days_monthly', type: 'number', description: 'Jours opération/mois', example: 26, required: true },
        { name: 'fuel_cost_ratio', type: 'number', description: 'Ratio coût carburant', example: 0.35, required: false },
        { name: 'maintenance_regularity', type: 'string', description: 'Régularité maintenance', example: 'regular', required: false },
        { name: 'license_valid', type: 'boolean', description: 'Licence valide', example: true, required: true },
      ],
      primary_key: 'operator_id',
      indexes: ['vehicle_type', 'daily_revenue_avg'],
    },
    quality_indicators: {
      reliability_score: 50,
      completeness_threshold: 0.5,
      freshness_hours: 168,
      validation_rules: ['vehicle_count >= 1', 'daily_revenue_avg >= 0'],
    },
    legal_considerations: ['Données auto-déclarées', 'Secteur informel important'],
    ethical_guidelines: ['Activité informelle courante - ne pas discriminer'],
    fallback_strategy: 'Estimer via Mobile Money transactions',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
];

// ============================================
// J) GOVERNMENT RECORDS
// ============================================

export const GOVERNMENT_SOURCES: DataSourceDefinition[] = [
  {
    id: 'rccm_registry',
    name: 'Registre Commerce RCCM',
    category: 'government',
    type: 'conventional',
    acquisition_method: 'scraping',
    update_frequency: 'weekly',
    schema: {
      fields: [
        { name: 'rccm_number', type: 'string', description: 'Numéro RCCM', example: 'CI-ABJ-2020-B-12345', required: true },
        { name: 'company_name', type: 'string', description: 'Raison sociale', example: 'SARL EXAMPLE', required: true },
        { name: 'legal_form', type: 'string', description: 'Forme juridique', example: 'SARL', required: true },
        { name: 'registration_date', type: 'date', description: 'Date immatriculation', example: '2020-03-15', required: true },
        { name: 'share_capital', type: 'number', description: 'Capital social', example: 1000000, required: false },
        { name: 'business_activity', type: 'string', description: 'Activité principale', example: 'Commerce général', required: true },
        { name: 'registered_address', type: 'string', description: 'Adresse siège', example: 'Abidjan, Cocody', required: true },
        { name: 'status', type: 'string', description: 'Statut', example: 'active', required: true },
        { name: 'last_modification_date', type: 'date', description: 'Dernière modification', example: '2023-05-10', required: false },
        { name: 'directors', type: 'array', description: 'Dirigeants', example: [], required: false },
        { name: 'annual_declarations_up_to_date', type: 'boolean', description: 'Déclarations annuelles à jour', example: true, required: false },
      ],
      primary_key: 'rccm_number',
      indexes: ['company_name', 'registration_date', 'status'],
    },
    quality_indicators: {
      reliability_score: 95,
      completeness_threshold: 0.85,
      freshness_hours: 168,
      validation_rules: [
        'status IN (active, inactive, dissolved)',
        'registration_date <= current_date',
      ],
    },
    legal_considerations: ['Données publiques OHADA', 'Scraping autorisé pour données publiques'],
    ethical_guidelines: ['Entreprises récentes légitimes - ne pas sur-pénaliser'],
    fallback_strategy: 'Demander attestation RCCM en document',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
  {
    id: 'identity_document',
    name: 'Document Identité',
    category: 'government',
    type: 'conventional',
    acquisition_method: 'ocr_extraction',
    update_frequency: 'on_demand',
    schema: {
      fields: [
        { name: 'document_type', type: 'string', description: 'Type document', example: 'cni', required: true },
        { name: 'document_number', type: 'string', description: 'Numéro document', example: 'CI-123456789', required: true },
        { name: 'full_name', type: 'string', description: 'Nom complet', example: 'KOUADIO Jean', required: true },
        { name: 'birth_date', type: 'date', description: 'Date naissance', example: '1985-07-22', required: true },
        { name: 'birth_place', type: 'string', description: 'Lieu naissance', example: 'Bouaké', required: false },
        { name: 'gender', type: 'string', description: 'Genre', example: 'M', required: false },
        { name: 'nationality', type: 'string', description: 'Nationalité', example: 'Ivoirienne', required: true },
        { name: 'issue_date', type: 'date', description: 'Date émission', example: '2020-01-15', required: true },
        { name: 'expiry_date', type: 'date', description: 'Date expiration', example: '2030-01-14', required: true },
        { name: 'issuing_authority', type: 'string', description: 'Autorité émettrice', example: 'ONECI', required: false },
        { name: 'mrz_valid', type: 'boolean', description: 'MRZ valide', example: true, required: false },
        { name: 'photo_match_score', type: 'number', description: 'Score correspondance photo', example: 0.92, required: false },
        { name: 'ocr_confidence', type: 'number', description: 'Confiance OCR', example: 0.95, required: true },
      ],
      primary_key: 'document_number',
      indexes: ['full_name', 'expiry_date'],
    },
    quality_indicators: {
      reliability_score: 90,
      completeness_threshold: 0.9,
      freshness_hours: 8760,
      validation_rules: [
        'expiry_date > current_date',
        'ocr_confidence >= 0.7',
        'birth_date < current_date',
      ],
    },
    legal_considerations: [
      'Données très sensibles',
      'Conservation limitée',
      'Accès restreint',
      'Loi identité nationale',
    ],
    ethical_guidelines: ['Protection maximale', 'Chiffrement obligatoire'],
    fallback_strategy: 'Demander nouvelle photo document plus claire',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    is_active: true,
  },
  {
    id: 'tax_compliance',
    name: 'Conformité Fiscale',
    category: 'government',
    type: 'conventional',
    acquisition_method: 'user_provided',
    update_frequency: 'on_demand',
    schema: {
      fields: [
        { name: 'tax_id', type: 'string', description: 'Numéro fiscal', example: 'DGI-123456', required: true },
        { name: 'tax_regime', type: 'string', description: 'Régime fiscal', example: 'RSI', required: true },
        { name: 'last_declaration_date', type: 'date', description: 'Dernière déclaration', example: '2024-03-31', required: false },
        { name: 'compliance_certificate_valid', type: 'boolean', description: 'Attestation fiscale valide', example: true, required: true },
        { name: 'certificate_expiry_date', type: 'date', description: 'Expiration attestation', example: '2024-12-31', required: false },
        { name: 'outstanding_liabilities', type: 'boolean', description: 'Dettes fiscales', example: false, required: false },
      ],
      primary_key: 'tax_id',
      indexes: ['compliance_certificate_valid'],
    },
    quality_indicators: {
      reliability_score: 85,
      completeness_threshold: 0.7,
      freshness_hours: 720,
      validation_rules: ['certificate_expiry_date > current_date OR compliance_certificate_valid = false'],
    },
    legal_considerations: ['Secret fiscal', 'Document utilisateur uniquement'],
    ethical_guidelines: ['Secteur informel important - régimes simplifiés'],
    fallback_strategy: 'Score neutre si document non fourni',
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG'],
    is_active: true,
  },
];

// ============================================
// COMPLETE DATA SOURCE REGISTRY
// ============================================

export const ALL_DATA_SOURCES: DataSourceDefinition[] = [
  ...BANKING_SOURCES,
  ...MOBILE_MONEY_SOURCES,
  ...UTILITIES_SOURCES,
  ...TELECOM_SOURCES,
  ...DIGITAL_FOOTPRINT_SOURCES,
  ...SOCIAL_COMMUNITY_SOURCES,
  ...PSYCHOMETRIC_SOURCES,
  ...MARKET_ENVIRONMENT_SOURCES,
  ...ALTERNATIVE_ECONOMICS_SOURCES,
  ...GOVERNMENT_SOURCES,
];

export const getDataSourceById = (id: string): DataSourceDefinition | undefined => {
  return ALL_DATA_SOURCES.find(source => source.id === id);
};

export const getActiveDataSources = (): DataSourceDefinition[] => {
  return ALL_DATA_SOURCES.filter(source => source.is_active);
};

export const getDataSourcesByCategory = (category: DataSourceCategory): DataSourceDefinition[] => {
  return ALL_DATA_SOURCES.filter(source => source.category === category);
};

export const getDataSourcesByCountry = (countryCode: string): DataSourceDefinition[] => {
  return ALL_DATA_SOURCES.filter(source => source.countries_available.includes(countryCode));
};

// Total: 25+ data sources across 10 categories
