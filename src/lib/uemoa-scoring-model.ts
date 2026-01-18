// ============================================
// UEMOA CREDIT SCORING MODEL - Expert Architecture
// Region: Benin, Burkina Faso, Côte d'Ivoire, Guinea-Bissau, Mali, Niger, Senegal, Togo
// Version: 5.0.0-uemoa
// ============================================

// ============================================
// 1. DATA SOURCES TAXONOMY
// ============================================

export type DataSourceCategory = 
  | 'bank_transactions'
  | 'mobile_money'
  | 'utility_payments'
  | 'government_records'
  | 'digital_behavior'
  | 'social_community'
  | 'psychometric'
  | 'geospatial'
  | 'informal_economy';

export type DataAcquisitionMethod = 
  | 'api_direct'
  | 'api_partnership'
  | 'open_data'
  | 'scraping'
  | 'user_provided'
  | 'ocr_extraction'
  | 'device_signals';

export interface DataSourceDefinition {
  id: string;
  name: string;
  category: DataSourceCategory;
  acquisition_method: DataAcquisitionMethod;
  update_frequency: 'realtime' | 'daily' | 'weekly' | 'monthly' | 'on_demand';
  quality_issues: string[];
  legal_framework: string[];
  countries_available: string[];
  features_extracted: string[];
  reliability_score: number; // 0-100
  is_active: boolean;
}

// Complete UEMOA Data Sources Registry
export const UEMOA_DATA_SOURCES: DataSourceDefinition[] = [
  // ============================================
  // BANK & FINANCIAL DATA
  // ============================================
  {
    id: 'bank_statements_ocr',
    name: 'Relevés Bancaires (OCR)',
    category: 'bank_transactions',
    acquisition_method: 'ocr_extraction',
    update_frequency: 'on_demand',
    quality_issues: ['Format variable', 'Qualité scan', 'Multi-devises'],
    legal_framework: ['BCEAO Règlement 15/2002', 'Consentement client'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    features_extracted: [
      'solde_moyen', 'nb_transactions', 'revenus_recurrents', 
      'depenses_fixes', 'ratio_epargne', 'decouvert_frequence'
    ],
    reliability_score: 75,
    is_active: true,
  },
  {
    id: 'bank_api_aggregate',
    name: 'Agrégation Bancaire (API)',
    category: 'bank_transactions',
    acquisition_method: 'api_partnership',
    update_frequency: 'daily',
    quality_issues: ['Couverture limitée', 'Délai synchronisation'],
    legal_framework: ['BCEAO Open Banking', 'PSD2-like UEMOA'],
    countries_available: ['CI', 'SN'],
    features_extracted: [
      'historique_3_mois', 'categories_depenses', 'flux_entrants_sortants',
      'patterns_saisonniers', 'merchant_analysis'
    ],
    reliability_score: 90,
    is_active: false, // Requires partnership
  },

  // ============================================
  // MOBILE MONEY DATA
  // ============================================
  {
    id: 'mtn_momo',
    name: 'MTN Mobile Money',
    category: 'mobile_money',
    acquisition_method: 'api_partnership',
    update_frequency: 'realtime',
    quality_issues: ['Latence API', 'Transactions offline'],
    legal_framework: ['BCEAO EME Licence', 'Consentement explicit'],
    countries_available: ['CI', 'BJ', 'BF', 'GW'],
    features_extracted: [
      'volume_mensuel', 'frequence_transactions', 'p2p_ratio',
      'merchant_payments', 'bill_payments', 'solde_moyen',
      'regularite_revenus', 'diversite_beneficiaires'
    ],
    reliability_score: 85,
    is_active: true,
  },
  {
    id: 'orange_money',
    name: 'Orange Money',
    category: 'mobile_money',
    acquisition_method: 'api_partnership',
    update_frequency: 'realtime',
    quality_issues: ['Intégration multi-pays', 'Format données variable'],
    legal_framework: ['BCEAO EME Licence', 'RGPD Orange'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'NE', 'GW'],
    features_extracted: [
      'cash_in_out_ratio', 'international_transfers', 'airtime_purchases',
      'bill_payments', 'merchant_activity', 'account_age'
    ],
    reliability_score: 85,
    is_active: true,
  },
  {
    id: 'wave',
    name: 'Wave',
    category: 'mobile_money',
    acquisition_method: 'api_partnership',
    update_frequency: 'realtime',
    quality_issues: ['Nouveau entrant', 'Couverture rurale'],
    legal_framework: ['BCEAO EME Licence'],
    countries_available: ['SN', 'CI', 'ML', 'BF'],
    features_extracted: [
      'transaction_velocity', 'merchant_payments', 'qr_usage',
      'savings_patterns', 'loan_repayments'
    ],
    reliability_score: 80,
    is_active: true,
  },
  {
    id: 'moov_money',
    name: 'Moov Money',
    category: 'mobile_money',
    acquisition_method: 'api_partnership',
    update_frequency: 'daily',
    quality_issues: ['API moins mature'],
    legal_framework: ['BCEAO EME Licence'],
    countries_available: ['CI', 'BJ', 'TG', 'NE'],
    features_extracted: [
      'volume_transactions', 'patterns_usage', 'bill_payments'
    ],
    reliability_score: 70,
    is_active: false,
  },

  // ============================================
  // UTILITY PAYMENTS
  // ============================================
  {
    id: 'cie_electricity',
    name: 'CIE (Électricité CI)',
    category: 'utility_payments',
    acquisition_method: 'ocr_extraction',
    update_frequency: 'monthly',
    quality_issues: ['Format factures variable', 'Compteurs collectifs'],
    legal_framework: ['Consentement client'],
    countries_available: ['CI'],
    features_extracted: [
      'historique_paiements', 'ponctualite', 'consommation_moyenne',
      'variations_saisonnieres', 'adresse_stable'
    ],
    reliability_score: 70,
    is_active: true,
  },
  {
    id: 'sodeci_water',
    name: 'SODECI (Eau CI)',
    category: 'utility_payments',
    acquisition_method: 'ocr_extraction',
    update_frequency: 'monthly',
    quality_issues: ['Abonnements partagés'],
    legal_framework: ['Consentement client'],
    countries_available: ['CI'],
    features_extracted: [
      'historique_12_mois', 'paiements_retard', 'montant_moyen'
    ],
    reliability_score: 65,
    is_active: true,
  },
  {
    id: 'senelec',
    name: 'SENELEC (Électricité SN)',
    category: 'utility_payments',
    acquisition_method: 'ocr_extraction',
    update_frequency: 'monthly',
    quality_issues: ['Woyofal vs postpaid'],
    legal_framework: ['Consentement client'],
    countries_available: ['SN'],
    features_extracted: [
      'consommation_patterns', 'recharge_regularity', 'payment_history'
    ],
    reliability_score: 70,
    is_active: true,
  },
  {
    id: 'telecom_bills',
    name: 'Factures Télécom',
    category: 'utility_payments',
    acquisition_method: 'user_provided',
    update_frequency: 'monthly',
    quality_issues: ['Postpaid limité', 'Lignes professionnelles'],
    legal_framework: ['Consentement client'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    features_extracted: [
      'montant_mensuel', 'ponctualite', 'anciennete_ligne'
    ],
    reliability_score: 60,
    is_active: true,
  },

  // ============================================
  // GOVERNMENT & PUBLIC RECORDS
  // ============================================
  {
    id: 'rccm_registry',
    name: 'Registre Commerce (RCCM)',
    category: 'government_records',
    acquisition_method: 'scraping',
    update_frequency: 'weekly',
    quality_issues: ['Données incomplètes', 'Mise à jour tardive'],
    legal_framework: ['Données publiques OHADA'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    features_extracted: [
      'raison_sociale', 'date_creation', 'forme_juridique', 'capital',
      'secteur_activite', 'statut_actif', 'dirigeants'
    ],
    reliability_score: 85,
    is_active: true,
  },
  {
    id: 'tax_compliance',
    name: 'Conformité Fiscale',
    category: 'government_records',
    acquisition_method: 'user_provided',
    update_frequency: 'on_demand',
    quality_issues: ['Auto-déclaration', 'Vérification difficile'],
    legal_framework: ['Secret fiscal'],
    countries_available: ['CI', 'SN'],
    features_extracted: [
      'attestation_fiscale', 'date_validite', 'regime_fiscal'
    ],
    reliability_score: 75,
    is_active: true,
  },
  {
    id: 'business_permits',
    name: 'Permis & Licences',
    category: 'government_records',
    acquisition_method: 'user_provided',
    update_frequency: 'on_demand',
    quality_issues: ['Formats variés', 'Validité à vérifier'],
    legal_framework: ['Données publiques'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    features_extracted: [
      'type_licence', 'date_emission', 'date_expiration', 'autorite'
    ],
    reliability_score: 70,
    is_active: true,
  },
  {
    id: 'id_document',
    name: 'Pièce d\'Identité',
    category: 'government_records',
    acquisition_method: 'ocr_extraction',
    update_frequency: 'on_demand',
    quality_issues: ['Faux documents', 'Expiration'],
    legal_framework: ['Loi identité nationale'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    features_extracted: [
      'nom_complet', 'date_naissance', 'numero_document', 'date_expiration',
      'photo_match', 'mrz_validation'
    ],
    reliability_score: 80,
    is_active: true,
  },

  // ============================================
  // DIGITAL BEHAVIORAL DATA
  // ============================================
  {
    id: 'sim_stability',
    name: 'Stabilité SIM',
    category: 'digital_behavior',
    acquisition_method: 'api_partnership',
    update_frequency: 'realtime',
    quality_issues: ['Multi-SIM courant', 'SIM professionnelle'],
    legal_framework: ['Données opérateur'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG'],
    features_extracted: [
      'age_sim_mois', 'changements_frequence', 'operateur_principal',
      'roaming_patterns'
    ],
    reliability_score: 75,
    is_active: false, // Requires telco partnership
  },
  {
    id: 'device_signals',
    name: 'Signaux Device',
    category: 'digital_behavior',
    acquisition_method: 'device_signals',
    update_frequency: 'realtime',
    quality_issues: ['Privacy concerns', 'Appareils partagés'],
    legal_framework: ['Consentement explicite'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    features_extracted: [
      'type_appareil', 'os_version', 'apps_installees', 'langue_systeme',
      'battery_charging_patterns', 'storage_usage', 'contacts_count'
    ],
    reliability_score: 60,
    is_active: true,
  },
  {
    id: 'app_usage',
    name: 'Usage Application',
    category: 'digital_behavior',
    acquisition_method: 'device_signals',
    update_frequency: 'realtime',
    quality_issues: ['Représentativité'],
    legal_framework: ['RGPD-like'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    features_extracted: [
      'sessions_count', 'time_in_app', 'features_used', 'completion_rate',
      'abandonment_points'
    ],
    reliability_score: 65,
    is_active: true,
  },

  // ============================================
  // SOCIAL & COMMUNITY SIGNALS
  // ============================================
  {
    id: 'tontine_membership',
    name: 'Tontines & GEC',
    category: 'social_community',
    acquisition_method: 'user_provided',
    update_frequency: 'on_demand',
    quality_issues: ['Vérification difficile', 'Informel'],
    legal_framework: ['Aucun cadre formel'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    features_extracted: [
      'nombre_tontines', 'montant_cotisation', 'anciennete_membre',
      'role_gestionnaire', 'historique_respect'
    ],
    reliability_score: 50,
    is_active: true,
  },
  {
    id: 'cooperative_membership',
    name: 'Coopératives Agricoles',
    category: 'social_community',
    acquisition_method: 'api_partnership',
    update_frequency: 'monthly',
    quality_issues: ['Couverture limitée'],
    legal_framework: ['Registre coopératives'],
    countries_available: ['CI', 'SN', 'ML', 'BF'],
    features_extracted: [
      'cooperative_active', 'productions_vendues', 'anciennete',
      'credits_coop_rembourses'
    ],
    reliability_score: 70,
    is_active: false,
  },
  {
    id: 'professional_associations',
    name: 'Associations Professionnelles',
    category: 'social_community',
    acquisition_method: 'user_provided',
    update_frequency: 'on_demand',
    quality_issues: ['Auto-déclaration'],
    legal_framework: ['Registre associations'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    features_extracted: [
      'type_association', 'role', 'anciennete', 'cotisations_jour'
    ],
    reliability_score: 55,
    is_active: true,
  },
  {
    id: 'references_commerciales',
    name: 'Références Commerciales',
    category: 'social_community',
    acquisition_method: 'user_provided',
    update_frequency: 'on_demand',
    quality_issues: ['Biais de sélection', 'Vérification manuelle'],
    legal_framework: ['Consentement tiers'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    features_extracted: [
      'nb_references', 'duree_relation', 'volume_affaires', 'score_confiance'
    ],
    reliability_score: 45,
    is_active: true,
  },

  // ============================================
  // PSYCHOMETRIC DATA
  // ============================================
  {
    id: 'psychometric_quiz',
    name: 'Questionnaire Psychométrique',
    category: 'psychometric',
    acquisition_method: 'user_provided',
    update_frequency: 'on_demand',
    quality_issues: ['Gaming possible', 'Biais culturel'],
    legal_framework: ['Consentement, Non-discrimination'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    features_extracted: [
      'attitude_risque', 'planification_financiere', 'perseverance',
      'reseau_social', 'gestion_imprevus', 'consistance_reponses'
    ],
    reliability_score: 55,
    is_active: true,
  },
  {
    id: 'financial_literacy',
    name: 'Test Littératie Financière',
    category: 'psychometric',
    acquisition_method: 'user_provided',
    update_frequency: 'on_demand',
    quality_issues: ['Niveau éducation variable'],
    legal_framework: ['Aucun'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    features_extracted: [
      'comprehension_interet', 'budget_skills', 'planning_horizon'
    ],
    reliability_score: 50,
    is_active: true,
  },

  // ============================================
  // GEOSPATIAL & ECONOMIC ENVIRONMENT
  // ============================================
  {
    id: 'location_stability',
    name: 'Stabilité Géographique',
    category: 'geospatial',
    acquisition_method: 'device_signals',
    update_frequency: 'daily',
    quality_issues: ['Privacy', 'Précision GPS'],
    legal_framework: ['Consentement géolocalisation'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    features_extracted: [
      'adresse_stable', 'zone_economique', 'mobilite_quotidienne',
      'distance_travail', 'changements_adresse'
    ],
    reliability_score: 65,
    is_active: true,
  },
  {
    id: 'economic_zone',
    name: 'Zone Économique',
    category: 'geospatial',
    acquisition_method: 'open_data',
    update_frequency: 'monthly',
    quality_issues: ['Granularité données'],
    legal_framework: ['Données publiques'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    features_extracted: [
      'indice_economique_zone', 'densite_commerces', 'infrastructure_score',
      'risque_climatique', 'acces_services_financiers'
    ],
    reliability_score: 80,
    is_active: true,
  },

  // ============================================
  // INFORMAL ECONOMY SIGNALS
  // ============================================
  {
    id: 'marketplace_activity',
    name: 'Activité Marketplaces',
    category: 'informal_economy',
    acquisition_method: 'api_partnership',
    update_frequency: 'weekly',
    quality_issues: ['Comptes multiples', 'Faux avis'],
    legal_framework: ['CGU plateforme'],
    countries_available: ['CI', 'SN'],
    features_extracted: [
      'nb_ventes', 'note_vendeur', 'anciennete_compte', 'categories',
      'taux_reclamation', 'delai_livraison'
    ],
    reliability_score: 60,
    is_active: false,
  },
  {
    id: 'cash_flow_proxies',
    name: 'Proxies Flux Cash',
    category: 'informal_economy',
    acquisition_method: 'user_provided',
    update_frequency: 'on_demand',
    quality_issues: ['Estimation', 'Saisonnalité'],
    legal_framework: ['Aucun'],
    countries_available: ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
    features_extracted: [
      'chiffre_affaires_estime', 'nb_employes', 'stock_moyen',
      'frequentation_clients', 'saisonnalite'
    ],
    reliability_score: 40,
    is_active: true,
  },
];

// ============================================
// 2. FEATURE ENGINEERING
// ============================================

export interface ScoringFeature {
  id: string;
  name: string;
  category: string;
  weight: number;
  min_value: number;
  max_value: number;
  transformation: 'linear' | 'log' | 'sigmoid' | 'categorical' | 'binary';
  missing_strategy: 'mean' | 'median' | 'zero' | 'exclude' | 'impute_model';
  sources: string[]; // Data source IDs that contribute
  description: string;
}

export const SCORING_FEATURES: ScoringFeature[] = [
  // ============================================
  // FINANCIAL BEHAVIOR (30% weight total)
  // ============================================
  {
    id: 'income_stability',
    name: 'Stabilité des Revenus',
    category: 'financial',
    weight: 0.08,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'mean',
    sources: ['mtn_momo', 'orange_money', 'wave', 'bank_statements_ocr'],
    description: 'Coefficient de variation des revenus sur 3 mois',
  },
  {
    id: 'expense_ratio',
    name: 'Ratio Dépenses/Revenus',
    category: 'financial',
    weight: 0.07,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'mean',
    sources: ['mtn_momo', 'orange_money', 'bank_statements_ocr'],
    description: 'Part des revenus consacrée aux dépenses fixes',
  },
  {
    id: 'savings_behavior',
    name: 'Comportement Épargne',
    category: 'financial',
    weight: 0.05,
    min_value: 0,
    max_value: 1,
    transformation: 'log',
    missing_strategy: 'zero',
    sources: ['mtn_momo', 'orange_money', 'wave', 'bank_statements_ocr'],
    description: 'Patterns d\'épargne et constitution de réserves',
  },
  {
    id: 'transaction_regularity',
    name: 'Régularité Transactionnelle',
    category: 'financial',
    weight: 0.05,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'mean',
    sources: ['mtn_momo', 'orange_money', 'wave'],
    description: 'Fréquence et régularité des transactions',
  },
  {
    id: 'debt_service_capacity',
    name: 'Capacité Remboursement',
    category: 'financial',
    weight: 0.05,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'mean',
    sources: ['bank_statements_ocr', 'mtn_momo'],
    description: 'Revenus disponibles après charges fixes',
  },

  // ============================================
  // PAYMENT BEHAVIOR (20% weight total)
  // ============================================
  {
    id: 'utility_payment_history',
    name: 'Historique Paiements Utilities',
    category: 'payment_history',
    weight: 0.08,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'mean',
    sources: ['cie_electricity', 'sodeci_water', 'senelec', 'telecom_bills'],
    description: 'Ponctualité des paiements de factures',
  },
  {
    id: 'mobile_money_bill_payments',
    name: 'Paiements Factures via MM',
    category: 'payment_history',
    weight: 0.06,
    min_value: 0,
    max_value: 1,
    transformation: 'log',
    missing_strategy: 'zero',
    sources: ['mtn_momo', 'orange_money', 'wave'],
    description: 'Régularité des paiements via Mobile Money',
  },
  {
    id: 'loan_repayment_history',
    name: 'Historique Remboursement Prêts',
    category: 'payment_history',
    weight: 0.06,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'exclude',
    sources: ['bank_statements_ocr', 'cooperative_membership'],
    description: 'Performance sur prêts antérieurs',
  },

  // ============================================
  // IDENTITY & FORMALIZATION (15% weight total)
  // ============================================
  {
    id: 'identity_verification_score',
    name: 'Score Vérification Identité',
    category: 'identity',
    weight: 0.06,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'zero',
    sources: ['id_document'],
    description: 'Confiance dans la vérification d\'identité',
  },
  {
    id: 'business_formalization',
    name: 'Formalisation Entreprise',
    category: 'identity',
    weight: 0.06,
    min_value: 0,
    max_value: 1,
    transformation: 'categorical',
    missing_strategy: 'zero',
    sources: ['rccm_registry', 'tax_compliance', 'business_permits'],
    description: 'Niveau de formalisation de l\'activité',
  },
  {
    id: 'address_stability',
    name: 'Stabilité Adresse',
    category: 'identity',
    weight: 0.03,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'mean',
    sources: ['location_stability', 'cie_electricity', 'sodeci_water'],
    description: 'Durée à l\'adresse actuelle',
  },

  // ============================================
  // DIGITAL FOOTPRINT (10% weight total)
  // ============================================
  {
    id: 'sim_age_score',
    name: 'Ancienneté SIM',
    category: 'digital',
    weight: 0.04,
    min_value: 0,
    max_value: 1,
    transformation: 'log',
    missing_strategy: 'mean',
    sources: ['sim_stability', 'mtn_momo', 'orange_money'],
    description: 'Durée d\'utilisation du numéro principal',
  },
  {
    id: 'digital_engagement',
    name: 'Engagement Digital',
    category: 'digital',
    weight: 0.03,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'mean',
    sources: ['device_signals', 'app_usage'],
    description: 'Niveau d\'adoption des services digitaux',
  },
  {
    id: 'device_quality_score',
    name: 'Score Qualité Device',
    category: 'digital',
    weight: 0.03,
    min_value: 0,
    max_value: 1,
    transformation: 'categorical',
    missing_strategy: 'mean',
    sources: ['device_signals'],
    description: 'Type et qualité de l\'appareil utilisé',
  },

  // ============================================
  // SOCIAL & COMMUNITY (10% weight total)
  // ============================================
  {
    id: 'tontine_score',
    name: 'Score Tontine',
    category: 'social',
    weight: 0.04,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'zero',
    sources: ['tontine_membership'],
    description: 'Participation et fiabilité dans les tontines',
  },
  {
    id: 'professional_network',
    name: 'Réseau Professionnel',
    category: 'social',
    weight: 0.03,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'zero',
    sources: ['professional_associations', 'references_commerciales'],
    description: 'Qualité du réseau professionnel',
  },
  {
    id: 'community_standing',
    name: 'Réputation Communautaire',
    category: 'social',
    weight: 0.03,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'mean',
    sources: ['cooperative_membership', 'references_commerciales'],
    description: 'Position sociale et réputation locale',
  },

  // ============================================
  // PSYCHOMETRIC (5% weight total)
  // ============================================
  {
    id: 'risk_attitude',
    name: 'Attitude au Risque',
    category: 'psychometric',
    weight: 0.025,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'mean',
    sources: ['psychometric_quiz'],
    description: 'Propension à la prise de risque',
  },
  {
    id: 'financial_planning',
    name: 'Planification Financière',
    category: 'psychometric',
    weight: 0.025,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'mean',
    sources: ['psychometric_quiz', 'financial_literacy'],
    description: 'Capacité de planification et gestion',
  },

  // ============================================
  // GEOSPATIAL (5% weight total)
  // ============================================
  {
    id: 'economic_zone_score',
    name: 'Score Zone Économique',
    category: 'geospatial',
    weight: 0.03,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'mean',
    sources: ['economic_zone', 'location_stability'],
    description: 'Dynamisme économique de la zone',
  },
  {
    id: 'infrastructure_access',
    name: 'Accès Infrastructure',
    category: 'geospatial',
    weight: 0.02,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'mean',
    sources: ['economic_zone'],
    description: 'Accès aux services financiers et infrastructure',
  },

  // ============================================
  // CROSS-VALIDATION BONUS (5% weight total)
  // ============================================
  {
    id: 'data_consistency',
    name: 'Cohérence des Données',
    category: 'validation',
    weight: 0.03,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'zero',
    sources: ['id_document', 'rccm_registry', 'mtn_momo', 'orange_money'],
    description: 'Concordance entre sources multiples',
  },
  {
    id: 'verification_depth',
    name: 'Profondeur Vérification',
    category: 'validation',
    weight: 0.02,
    min_value: 0,
    max_value: 1,
    transformation: 'linear',
    missing_strategy: 'zero',
    sources: ['id_document', 'rccm_registry', 'mtn_momo', 'orange_money'],
    description: 'Nombre et qualité des sources vérifiées',
  },
];

// ============================================
// 3. RISK TIERS & SCORING OUTPUTS
// ============================================

export interface RiskTier {
  id: string;
  name: string;
  grade: string;
  score_min: number;
  score_max: number;
  color: string;
  description: string;
  recommended_actions: string[];
  max_loan_amount_multiplier: number; // Of monthly income
  max_tenor_months: number;
  interest_rate_adjustment: number; // Basis points to add to base rate
}

export const RISK_TIERS: RiskTier[] = [
  {
    id: 'prime',
    name: 'Prime',
    grade: 'A+',
    score_min: 85,
    score_max: 100,
    color: 'emerald',
    description: 'Profil excellent - Risque minimal',
    recommended_actions: ['Approbation automatique', 'Offres premium'],
    max_loan_amount_multiplier: 5,
    max_tenor_months: 36,
    interest_rate_adjustment: 0,
  },
  {
    id: 'near_prime',
    name: 'Near-Prime',
    grade: 'A',
    score_min: 70,
    score_max: 84,
    color: 'green',
    description: 'Bon profil - Risque faible',
    recommended_actions: ['Approbation rapide', 'Conditions standard+'],
    max_loan_amount_multiplier: 4,
    max_tenor_months: 24,
    interest_rate_adjustment: 50,
  },
  {
    id: 'standard',
    name: 'Standard',
    grade: 'B',
    score_min: 55,
    score_max: 69,
    color: 'yellow',
    description: 'Profil moyen - Risque modéré',
    recommended_actions: ['Vérification approfondie', 'Garanties légères'],
    max_loan_amount_multiplier: 3,
    max_tenor_months: 18,
    interest_rate_adjustment: 150,
  },
  {
    id: 'subprime',
    name: 'Subprime',
    grade: 'C',
    score_min: 40,
    score_max: 54,
    color: 'orange',
    description: 'Profil à risque - Attention requise',
    recommended_actions: ['Garanties solides', 'Montants réduits', 'Suivi renforcé'],
    max_loan_amount_multiplier: 2,
    max_tenor_months: 12,
    interest_rate_adjustment: 350,
  },
  {
    id: 'high_risk',
    name: 'High Risk',
    grade: 'D',
    score_min: 25,
    score_max: 39,
    color: 'red',
    description: 'Risque élevé - Recommandation négative',
    recommended_actions: ['Refus recommandé', 'Programme de redressement'],
    max_loan_amount_multiplier: 1,
    max_tenor_months: 6,
    interest_rate_adjustment: 600,
  },
  {
    id: 'decline',
    name: 'Decline',
    grade: 'E',
    score_min: 0,
    score_max: 24,
    color: 'gray',
    description: 'Profil non éligible',
    recommended_actions: ['Refus', 'Éducation financière'],
    max_loan_amount_multiplier: 0,
    max_tenor_months: 0,
    interest_rate_adjustment: 0,
  },
];

// ============================================
// 4. FRAUD DETECTION RULES
// ============================================

export interface FraudRule {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'identity' | 'behavior' | 'velocity' | 'network' | 'document';
  description: string;
  detection_method: string;
  score_penalty: number; // Points to subtract from score
}

export const FRAUD_RULES: FraudRule[] = [
  // Identity Fraud
  {
    id: 'synthetic_identity',
    name: 'Identité Synthétique',
    severity: 'critical',
    category: 'identity',
    description: 'Combinaison suspecte de données d\'identité',
    detection_method: 'Cross-validation nom/date naissance/numéro ID',
    score_penalty: 100,
  },
  {
    id: 'document_tampering',
    name: 'Falsification Document',
    severity: 'critical',
    category: 'document',
    description: 'Document modifié ou falsifié détecté',
    detection_method: 'Analyse forensique image + validation MRZ',
    score_penalty: 100,
  },
  {
    id: 'expired_document',
    name: 'Document Expiré',
    severity: 'medium',
    category: 'document',
    description: 'Pièce d\'identité expirée',
    detection_method: 'Vérification date expiration OCR',
    score_penalty: 20,
  },
  {
    id: 'multiple_applications',
    name: 'Demandes Multiples',
    severity: 'high',
    category: 'velocity',
    description: 'Demandes multiples en peu de temps',
    detection_method: 'Tracking device + phone + IP',
    score_penalty: 40,
  },
  {
    id: 'device_anomaly',
    name: 'Anomalie Device',
    severity: 'medium',
    category: 'behavior',
    description: 'Comportement device suspect (root, VPN, emulateur)',
    detection_method: 'Signals device + app integrity',
    score_penalty: 25,
  },
  {
    id: 'location_mismatch',
    name: 'Incohérence Localisation',
    severity: 'medium',
    category: 'behavior',
    description: 'Localisation déclarée vs localisation détectée',
    detection_method: 'GPS vs IP vs adresse déclarée',
    score_penalty: 15,
  },
  {
    id: 'income_inflation',
    name: 'Surestimation Revenus',
    severity: 'high',
    category: 'behavior',
    description: 'Revenus déclarés incohérents avec données Mobile Money',
    detection_method: 'Revenus déclarés vs flux Mobile Money',
    score_penalty: 35,
  },
  {
    id: 'rccm_inactive',
    name: 'RCCM Inactif/Radié',
    severity: 'high',
    category: 'identity',
    description: 'Entreprise radiée ou inactive au registre',
    detection_method: 'Vérification statut RCCM',
    score_penalty: 50,
  },
  {
    id: 'sim_recently_changed',
    name: 'SIM Récemment Changée',
    severity: 'low',
    category: 'behavior',
    description: 'Numéro de téléphone récent (<3 mois)',
    detection_method: 'Ancienneté SIM via opérateur',
    score_penalty: 10,
  },
  {
    id: 'network_fraud_ring',
    name: 'Réseau Frauduleux',
    severity: 'critical',
    category: 'network',
    description: 'Connexion avec comptes signalés',
    detection_method: 'Graph analysis beneficiaires + device + IP',
    score_penalty: 100,
  },
];

// ============================================
// 5. REGULATORY COMPLIANCE (UEMOA)
// ============================================

export interface ComplianceRequirement {
  id: string;
  regulation: string;
  authority: string;
  description: string;
  implementation: string;
}

export const UEMOA_COMPLIANCE: ComplianceRequirement[] = [
  {
    id: 'data_protection',
    regulation: 'Loi sur la Protection des Données Personnelles',
    authority: 'BCEAO / APDP (par pays)',
    description: 'Cadre similaire RGPD adapté UEMOA',
    implementation: 'Consentement explicite, droit accès/rectification/suppression, minimisation',
  },
  {
    id: 'consent_management',
    regulation: 'Règlement 15/2002/CM/UEMOA',
    authority: 'BCEAO',
    description: 'Collecte et traitement des données financières',
    implementation: 'Consentement écrit/digital, traçabilité, durée conservation limitée',
  },
  {
    id: 'credit_bureau',
    regulation: 'Règlement relatif aux Bureaux d\'Information sur le Crédit',
    authority: 'BCEAO',
    description: 'Encadrement des BIC et scoring',
    implementation: 'Notification client, droit contestation, mise à jour données',
  },
  {
    id: 'aml_kyc',
    regulation: 'Directive AML/CFT UEMOA',
    authority: 'CENTIF (par pays)',
    description: 'Lutte anti-blanchiment et KYC',
    implementation: 'Vérification identité, vigilance renforcée, déclaration soupçons',
  },
  {
    id: 'non_discrimination',
    regulation: 'Principes non-discrimination crédit',
    authority: 'BCEAO',
    description: 'Interdiction discrimination basée sur genre, ethnie, religion',
    implementation: 'Audit features, testing biais, documentation décisions',
  },
  {
    id: 'right_to_explanation',
    regulation: 'Droit à l\'explication',
    authority: 'Best practice',
    description: 'Client doit comprendre motifs décision',
    implementation: 'Explainability model, facteurs clés communiqués',
  },
  {
    id: 'data_retention',
    regulation: 'Conservation données',
    authority: 'BCEAO + lois nationales',
    description: 'Durées de conservation limitées',
    implementation: '5 ans max après fin relation, anonymisation, suppression automatique',
  },
  {
    id: 'data_localization',
    regulation: 'Localisation données',
    authority: 'Lois nationales',
    description: 'Certaines données doivent rester en zone UEMOA',
    implementation: 'Hébergement cloud en zone UEMOA ou pays autorisés',
  },
];

// ============================================
// 6. MODEL VALIDATION METRICS
// ============================================

export interface ModelMetrics {
  auc_roc: number;           // Area Under ROC Curve (target: >0.70)
  gini: number;              // Gini coefficient (target: >0.40)
  ks_statistic: number;      // Kolmogorov-Smirnov (target: >0.30)
  psi: number;               // Population Stability Index (alert if >0.25)
  approval_rate: number;     // % of applications approved
  default_rate_predicted: number;
  default_rate_actual: number;
  lift_top_10: number;       // Lift in top 10% riskiest
}

export const MODEL_THRESHOLDS = {
  auc_roc_min: 0.65,
  auc_roc_target: 0.75,
  gini_min: 0.30,
  gini_target: 0.50,
  ks_min: 0.25,
  ks_target: 0.40,
  psi_warning: 0.10,
  psi_critical: 0.25,
};

// Helper to get active data sources
export function getActiveDataSources(): DataSourceDefinition[] {
  return UEMOA_DATA_SOURCES.filter(s => s.is_active);
}

// Helper to get features by category
export function getFeaturesByCategory(category: string): ScoringFeature[] {
  return SCORING_FEATURES.filter(f => f.category === category);
}

// Helper to get risk tier by score
export function getRiskTierByScore(score: number): RiskTier {
  return RISK_TIERS.find(t => score >= t.score_min && score <= t.score_max) || RISK_TIERS[RISK_TIERS.length - 1];
}

// Total weights validation
export function validateFeatureWeights(): boolean {
  const totalWeight = SCORING_FEATURES.reduce((sum, f) => sum + f.weight, 0);
  return Math.abs(totalWeight - 1.0) < 0.001;
}
