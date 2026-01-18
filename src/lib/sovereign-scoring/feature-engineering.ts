// ============================================
// SOVEREIGN FEATURE ENGINEERING ENGINE
// Adapted for UEMOA realities: seasonality, informality, sparse data
// ============================================

export type FeatureCategory =
  | 'financial'
  | 'behavioral'
  | 'identity'
  | 'social'
  | 'digital'
  | 'environmental'
  | 'psychometric';

export type Transformation =
  | 'raw'
  | 'log'
  | 'ratio'
  | 'velocity'
  | 'window_7d'
  | 'window_30d'
  | 'window_90d'
  | 'zscore'
  | 'percentile'
  | 'binary'
  | 'categorical';

export interface FeatureDefinition {
  id: string;
  name: string;
  category: FeatureCategory;
  source_fields: string[];
  transformation: Transformation;
  formula: string;
  risk_direction: 'higher_better' | 'lower_better' | 'optimal_range';
  optimal_range?: { min: number; max: number };
  weight: number;
  missing_strategy: 'default' | 'impute_mean' | 'impute_median' | 'flag_missing' | 'exclude';
  default_value?: number;
  risk_patterns: RiskPattern[];
  uemoa_adjustments: string[];
}

export interface RiskPattern {
  pattern_id: string;
  description: string;
  condition: string;
  impact: 'risk_increase' | 'risk_decrease';
  severity: number; // 1-10
}

// ============================================
// A) FINANCIAL FEATURES
// ============================================

export const FINANCIAL_FEATURES: FeatureDefinition[] = [
  {
    id: 'income_stability_index',
    name: 'Indice Stabilité Revenus',
    category: 'financial',
    source_fields: ['monthly_income_history', 'income_sources'],
    transformation: 'velocity',
    formula: '1 - (std_dev(monthly_income_90d) / mean(monthly_income_90d))',
    risk_direction: 'higher_better',
    weight: 0.08,
    missing_strategy: 'default',
    default_value: 0.5,
    risk_patterns: [
      { pattern_id: 'volatile_income', description: 'Revenus très variables', condition: 'index < 0.4', impact: 'risk_increase', severity: 6 },
      { pattern_id: 'stable_income', description: 'Revenus stables', condition: 'index >= 0.8', impact: 'risk_decrease', severity: 4 },
    ],
    uemoa_adjustments: [
      'Tolérer plus de variabilité pour secteur agricole (saisonnalité)',
      'Ajuster pour économie informelle (revenus journaliers)',
      'Considérer multi-sources comme stabilisant si régulières',
    ],
  },
  {
    id: 'expense_to_income_ratio',
    name: 'Ratio Dépenses/Revenus',
    category: 'financial',
    source_fields: ['monthly_expenses', 'monthly_income'],
    transformation: 'ratio',
    formula: 'monthly_expenses / monthly_income',
    risk_direction: 'lower_better',
    weight: 0.07,
    missing_strategy: 'impute_median',
    risk_patterns: [
      { pattern_id: 'over_spending', description: 'Dépenses > 90% revenus', condition: 'ratio > 0.9', impact: 'risk_increase', severity: 8 },
      { pattern_id: 'unsustainable', description: 'Dépenses > revenus', condition: 'ratio > 1.0', impact: 'risk_increase', severity: 10 },
      { pattern_id: 'healthy_margin', description: 'Marge saine', condition: 'ratio < 0.7', impact: 'risk_decrease', severity: 3 },
    ],
    uemoa_adjustments: [
      'Inclure dépenses informelles (tontines, entraide)',
      'Ajuster pour ménages élargis (personnes à charge)',
      'Considérer saisonnalité des dépenses',
    ],
  },
  {
    id: 'savings_rate',
    name: 'Taux d\'Épargne',
    category: 'financial',
    source_fields: ['monthly_income', 'monthly_expenses', 'tontine_contribution'],
    transformation: 'ratio',
    formula: '(monthly_income - monthly_expenses + tontine_contribution) / monthly_income',
    risk_direction: 'higher_better',
    weight: 0.05,
    missing_strategy: 'default',
    default_value: 0.05,
    risk_patterns: [
      { pattern_id: 'no_savings', description: 'Pas d\'épargne', condition: 'rate <= 0', impact: 'risk_increase', severity: 5 },
      { pattern_id: 'good_saver', description: 'Épargne > 15%', condition: 'rate >= 0.15', impact: 'risk_decrease', severity: 4 },
    ],
    uemoa_adjustments: [
      'Inclure tontines comme forme d\'épargne',
      'Reconnaître épargne communautaire (coopératives)',
    ],
  },
  {
    id: 'momo_velocity_7d',
    name: 'Vélocité Mobile Money 7j',
    category: 'financial',
    source_fields: ['momo_transactions_7d', 'momo_volume_7d'],
    transformation: 'velocity',
    formula: 'sum(transactions_7d) / 7',
    risk_direction: 'optimal_range',
    optimal_range: { min: 0.5, max: 5 },
    weight: 0.04,
    missing_strategy: 'flag_missing',
    risk_patterns: [
      { pattern_id: 'no_activity', description: 'Aucune activité MoMo', condition: 'velocity == 0', impact: 'risk_increase', severity: 3 },
      { pattern_id: 'excessive_activity', description: 'Activité excessive', condition: 'velocity > 10', impact: 'risk_increase', severity: 4 },
    ],
    uemoa_adjustments: [
      'Normaliser selon opérateur (Orange, MTN, Wave ont des patterns différents)',
      'Ajuster pour zones rurales (moins de transactions)',
    ],
  },
  {
    id: 'momo_in_out_ratio',
    name: 'Ratio Entrées/Sorties MoMo',
    category: 'financial',
    source_fields: ['momo_credits_30d', 'momo_debits_30d'],
    transformation: 'ratio',
    formula: 'momo_credits_30d / max(momo_debits_30d, 1)',
    risk_direction: 'optimal_range',
    optimal_range: { min: 0.8, max: 1.5 },
    weight: 0.04,
    missing_strategy: 'default',
    default_value: 1.0,
    risk_patterns: [
      { pattern_id: 'net_spender', description: 'Sorties >> Entrées', condition: 'ratio < 0.5', impact: 'risk_increase', severity: 6 },
      { pattern_id: 'balanced', description: 'Flux équilibrés', condition: 'ratio between 0.9 and 1.1', impact: 'risk_decrease', severity: 2 },
    ],
    uemoa_adjustments: [
      'Distinguer transferts familiaux (ne pas pénaliser support famille)',
    ],
  },
  {
    id: 'cashflow_regularity',
    name: 'Régularité Flux de Trésorerie',
    category: 'financial',
    source_fields: ['all_transactions_90d'],
    transformation: 'window_90d',
    formula: 'calculate_regularity_score(transactions)',
    risk_direction: 'higher_better',
    weight: 0.05,
    missing_strategy: 'default',
    default_value: 0.4,
    risk_patterns: [
      { pattern_id: 'irregular', description: 'Flux très irréguliers', condition: 'score < 0.3', impact: 'risk_increase', severity: 5 },
      { pattern_id: 'regular', description: 'Flux réguliers', condition: 'score >= 0.7', impact: 'risk_decrease', severity: 4 },
    ],
    uemoa_adjustments: [
      'Tolérer irrégularité pour travailleurs journaliers',
      'Reconnaître patterns hebdomadaires (marchés)',
    ],
  },
  {
    id: 'debt_to_income_ratio',
    name: 'Ratio Endettement',
    category: 'financial',
    source_fields: ['existing_debts', 'monthly_income'],
    transformation: 'ratio',
    formula: 'existing_debts / (monthly_income * 12)',
    risk_direction: 'lower_better',
    weight: 0.05,
    missing_strategy: 'default',
    default_value: 0,
    risk_patterns: [
      { pattern_id: 'over_indebted', description: 'Surendetté', condition: 'ratio > 3', impact: 'risk_increase', severity: 9 },
      { pattern_id: 'high_debt', description: 'Endettement élevé', condition: 'ratio > 1.5', impact: 'risk_increase', severity: 6 },
      { pattern_id: 'low_debt', description: 'Faible endettement', condition: 'ratio < 0.5', impact: 'risk_decrease', severity: 3 },
    ],
    uemoa_adjustments: [
      'Inclure dettes informelles (tontines en cours)',
      'Considérer garanties familiales',
    ],
  },
];

// ============================================
// B) PAYMENT HISTORY FEATURES
// ============================================

export const PAYMENT_FEATURES: FeatureDefinition[] = [
  {
    id: 'utility_payment_discipline',
    name: 'Discipline Paiement Factures',
    category: 'behavioral',
    source_fields: ['utility_on_time', 'utility_late', 'utility_total'],
    transformation: 'ratio',
    formula: 'utility_on_time / max(utility_total, 1)',
    risk_direction: 'higher_better',
    weight: 0.08,
    missing_strategy: 'default',
    default_value: 0.5,
    risk_patterns: [
      { pattern_id: 'poor_payer', description: 'Mauvais payeur', condition: 'ratio < 0.5', impact: 'risk_increase', severity: 7 },
      { pattern_id: 'excellent_payer', description: 'Excellent payeur', condition: 'ratio >= 0.95', impact: 'risk_decrease', severity: 5 },
    ],
    uemoa_adjustments: [
      'Reconnaître paiements en espèces (pas toujours tracés)',
      'Ajuster pour coupures fréquentes (contexte infrastructure)',
    ],
  },
  {
    id: 'rent_payment_consistency',
    name: 'Régularité Paiement Loyer',
    category: 'behavioral',
    source_fields: ['rent_payments_12m', 'rent_due_count'],
    transformation: 'ratio',
    formula: 'count(on_time_payments) / rent_due_count',
    risk_direction: 'higher_better',
    weight: 0.06,
    missing_strategy: 'flag_missing',
    risk_patterns: [
      { pattern_id: 'chronic_late', description: 'Retards chroniques', condition: 'ratio < 0.6', impact: 'risk_increase', severity: 6 },
      { pattern_id: 'always_ontime', description: 'Toujours à temps', condition: 'ratio >= 0.9', impact: 'risk_decrease', severity: 4 },
    ],
    uemoa_adjustments: [
      'Accepter quittances manuscrites (locations informelles)',
      'Vérifier avec propriétaire si possible',
    ],
  },
  {
    id: 'tontine_discipline',
    name: 'Discipline Cotisation Tontine',
    category: 'behavioral',
    source_fields: ['tontine_contributions', 'tontine_missed'],
    transformation: 'ratio',
    formula: '1 - (tontine_missed / max(tontine_contributions + tontine_missed, 1))',
    risk_direction: 'higher_better',
    weight: 0.06,
    missing_strategy: 'exclude',
    risk_patterns: [
      { pattern_id: 'unreliable_member', description: 'Membre peu fiable', condition: 'ratio < 0.7', impact: 'risk_increase', severity: 5 },
      { pattern_id: 'perfect_record', description: 'Parfait historique', condition: 'ratio >= 1.0', impact: 'risk_decrease', severity: 4 },
    ],
    uemoa_adjustments: [
      'Signal fort de fiabilité dans contexte UEMOA',
      'Vérifier auprès organisateur',
    ],
  },
  {
    id: 'cooperative_loan_history',
    name: 'Historique Prêts Coopérative',
    category: 'behavioral',
    source_fields: ['coop_loans_taken', 'coop_loans_repaid_ontime'],
    transformation: 'ratio',
    formula: 'coop_loans_repaid_ontime / max(coop_loans_taken, 1)',
    risk_direction: 'higher_better',
    weight: 0.06,
    missing_strategy: 'exclude',
    risk_patterns: [
      { pattern_id: 'defaulter', description: 'Défaillant', condition: 'ratio < 0.5', impact: 'risk_increase', severity: 8 },
      { pattern_id: 'clean_record', description: 'Historique propre', condition: 'ratio >= 1.0', impact: 'risk_decrease', severity: 5 },
    ],
    uemoa_adjustments: [
      'Excellent prédicteur dans contexte UEMOA',
      'Obtenir attestation coopérative',
    ],
  },
];

// ============================================
// C) IDENTITY & STABILITY FEATURES
// ============================================

export const IDENTITY_FEATURES: FeatureDefinition[] = [
  {
    id: 'document_verification_score',
    name: 'Score Vérification Documents',
    category: 'identity',
    source_fields: ['id_verified', 'id_expiry_valid', 'name_match_score'],
    transformation: 'raw',
    formula: '(id_verified * 0.4 + id_expiry_valid * 0.3 + name_match_score * 0.3)',
    risk_direction: 'higher_better',
    weight: 0.06,
    missing_strategy: 'default',
    default_value: 0.3,
    risk_patterns: [
      { pattern_id: 'unverified', description: 'Non vérifié', condition: 'score < 0.3', impact: 'risk_increase', severity: 7 },
      { pattern_id: 'fully_verified', description: 'Pleinement vérifié', condition: 'score >= 0.9', impact: 'risk_decrease', severity: 5 },
    ],
    uemoa_adjustments: [
      'Reconnaître CNI, passeport, attestation identité',
      'Tolérer documents manuscrits anciens',
    ],
  },
  {
    id: 'sim_age_score',
    name: 'Score Ancienneté SIM',
    category: 'identity',
    source_fields: ['sim_age_months'],
    transformation: 'log',
    formula: 'min(log(sim_age_months + 1) / log(37), 1)',
    risk_direction: 'higher_better',
    weight: 0.04,
    missing_strategy: 'default',
    default_value: 0.3,
    risk_patterns: [
      { pattern_id: 'new_sim', description: 'SIM < 3 mois', condition: 'months < 3', impact: 'risk_increase', severity: 6 },
      { pattern_id: 'stable_sim', description: 'SIM > 24 mois', condition: 'months >= 24', impact: 'risk_decrease', severity: 4 },
    ],
    uemoa_adjustments: [
      'Signal anti-fraude majeur',
      'Distinguer portabilité légitime',
    ],
  },
  {
    id: 'address_stability_score',
    name: 'Score Stabilité Adresse',
    category: 'identity',
    source_fields: ['years_at_address', 'utility_bill_verified', 'rent_receipts'],
    transformation: 'raw',
    formula: 'min(years_at_address / 3, 1) * 0.5 + utility_verified * 0.3 + rent_verified * 0.2',
    risk_direction: 'higher_better',
    weight: 0.03,
    missing_strategy: 'default',
    default_value: 0.4,
    risk_patterns: [
      { pattern_id: 'unstable_residence', description: 'Résidence instable', condition: 'years < 1', impact: 'risk_increase', severity: 4 },
      { pattern_id: 'stable_residence', description: 'Résidence stable > 3 ans', condition: 'years >= 3', impact: 'risk_decrease', severity: 3 },
    ],
    uemoa_adjustments: [
      'Accepter hébergement familial comme stable',
      'Utiliser factures utilitaires comme preuve',
    ],
  },
  {
    id: 'business_formalization_score',
    name: 'Score Formalisation Entreprise',
    category: 'identity',
    source_fields: ['rccm_verified', 'rccm_status', 'years_registered'],
    transformation: 'raw',
    formula: 'rccm_verified * 0.6 + (status == "active" ? 0.2 : 0) + min(years / 5, 0.2)',
    risk_direction: 'higher_better',
    weight: 0.06,
    missing_strategy: 'default',
    default_value: 0.2,
    risk_patterns: [
      { pattern_id: 'informal', description: 'Non enregistré', condition: 'rccm_verified == false', impact: 'risk_increase', severity: 3 },
      { pattern_id: 'formal_active', description: 'RCCM actif', condition: 'rccm_verified && status == "active"', impact: 'risk_decrease', severity: 5 },
    ],
    uemoa_adjustments: [
      'Ne pas exclure informels (majorité du marché)',
      'Valoriser effort de formalisation',
    ],
  },
];

// ============================================
// D) DIGITAL FOOTPRINT FEATURES
// ============================================

export const DIGITAL_FEATURES: FeatureDefinition[] = [
  {
    id: 'digital_engagement_score',
    name: 'Score Engagement Digital',
    category: 'digital',
    source_fields: ['momo_tx_count_30d', 'financial_apps_count', 'device_age_months'],
    transformation: 'raw',
    formula: 'min(momo_tx / 30, 1) * 0.5 + min(apps / 3, 1) * 0.3 + min(device_age / 18, 1) * 0.2',
    risk_direction: 'higher_better',
    weight: 0.03,
    missing_strategy: 'default',
    default_value: 0.3,
    risk_patterns: [
      { pattern_id: 'low_digital', description: 'Faible empreinte digitale', condition: 'score < 0.2', impact: 'risk_increase', severity: 2 },
      { pattern_id: 'high_digital', description: 'Fort engagement digital', condition: 'score >= 0.7', impact: 'risk_decrease', severity: 2 },
    ],
    uemoa_adjustments: [
      'Ajuster pour zones rurales (moins de couverture)',
      'Reconnaître USSD comme engagement',
    ],
  },
  {
    id: 'device_quality_score',
    name: 'Score Qualité Appareil',
    category: 'digital',
    source_fields: ['device_model', 'device_age_months', 'os_version'],
    transformation: 'raw',
    formula: 'device_tier_score * 0.4 + (1 - min(age/36, 1)) * 0.3 + os_recency * 0.3',
    risk_direction: 'optimal_range',
    optimal_range: { min: 0.3, max: 0.8 },
    weight: 0.03,
    missing_strategy: 'default',
    default_value: 0.5,
    risk_patterns: [
      { pattern_id: 'very_old_device', description: 'Appareil très ancien', condition: 'age > 48', impact: 'risk_increase', severity: 2 },
    ],
    uemoa_adjustments: [
      'Ne pas pénaliser appareils basiques (réalité économique)',
      'Valoriser stabilité (même appareil longtemps)',
    ],
  },
  {
    id: 'location_consistency_score',
    name: 'Score Cohérence Localisation',
    category: 'digital',
    source_fields: ['declared_city', 'detected_city', 'mobility_radius'],
    transformation: 'raw',
    formula: '(declared == detected ? 1 : 0) * 0.6 + (1 - min(radius/100, 1)) * 0.4',
    risk_direction: 'higher_better',
    weight: 0.02,
    missing_strategy: 'default',
    default_value: 0.5,
    risk_patterns: [
      { pattern_id: 'location_mismatch', description: 'Localisation incohérente', condition: 'declared != detected', impact: 'risk_increase', severity: 4 },
    ],
    uemoa_adjustments: [
      'Tolérer mobilité régionale (commerce, agriculture)',
      'Reconnaître multi-résidence',
    ],
  },
];

// ============================================
// E) SOCIAL CAPITAL FEATURES
// ============================================

export const SOCIAL_FEATURES: FeatureDefinition[] = [
  {
    id: 'tontine_network_score',
    name: 'Score Réseau Tontines',
    category: 'social',
    source_fields: ['tontine_memberships', 'tontine_years', 'tontine_amounts'],
    transformation: 'raw',
    formula: 'min(memberships/3, 1) * 0.3 + min(avg_years/3, 1) * 0.4 + amount_tier * 0.3',
    risk_direction: 'higher_better',
    weight: 0.04,
    missing_strategy: 'exclude',
    risk_patterns: [
      { pattern_id: 'no_tontine', description: 'Pas de tontine', condition: 'memberships == 0', impact: 'risk_increase', severity: 1 },
      { pattern_id: 'strong_tontine', description: 'Réseau tontine fort', condition: 'score >= 0.7', impact: 'risk_decrease', severity: 4 },
    ],
    uemoa_adjustments: [
      'Signal majeur de capital social UEMOA',
      'Vérifier auprès organisateurs',
    ],
  },
  {
    id: 'cooperative_standing_score',
    name: 'Score Réputation Coopérative',
    category: 'social',
    source_fields: ['coop_membership_years', 'coop_savings', 'coop_loan_history'],
    transformation: 'raw',
    formula: 'min(years/5, 1) * 0.3 + savings_tier * 0.3 + loan_repayment_rate * 0.4',
    risk_direction: 'higher_better',
    weight: 0.04,
    missing_strategy: 'exclude',
    risk_patterns: [
      { pattern_id: 'new_member', description: 'Nouveau membre', condition: 'years < 1', impact: 'risk_increase', severity: 1 },
      { pattern_id: 'established_member', description: 'Membre établi', condition: 'years >= 3 && loan_rate >= 0.95', impact: 'risk_decrease', severity: 5 },
    ],
    uemoa_adjustments: [
      'Excellent indicateur historique crédit informel',
      'Partenariats directs avec COOPEC, MFIs',
    ],
  },
  {
    id: 'guarantor_quality_score',
    name: 'Score Qualité Garants',
    category: 'social',
    source_fields: ['guarantor_count', 'guarantor_verified', 'guarantor_avg_score'],
    transformation: 'raw',
    formula: 'min(count/2, 1) * 0.3 + (verified/count) * 0.4 + avg_score/100 * 0.3',
    risk_direction: 'higher_better',
    weight: 0.03,
    missing_strategy: 'default',
    default_value: 0,
    risk_patterns: [
      { pattern_id: 'no_guarantors', description: 'Pas de garants', condition: 'count == 0', impact: 'risk_increase', severity: 2 },
      { pattern_id: 'strong_guarantors', description: 'Garants solides', condition: 'verified >= 2 && avg_score >= 70', impact: 'risk_decrease', severity: 4 },
    ],
    uemoa_adjustments: [
      'Vérifier garants par téléphone',
      'Détecter garanties croisées',
    ],
  },
  {
    id: 'community_standing_score',
    name: 'Score Réputation Communautaire',
    category: 'social',
    source_fields: ['market_years', 'association_memberships', 'local_references'],
    transformation: 'raw',
    formula: 'min(market_years/5, 1) * 0.4 + min(associations/2, 1) * 0.3 + references_verified * 0.3',
    risk_direction: 'higher_better',
    weight: 0.03,
    missing_strategy: 'default',
    default_value: 0.3,
    risk_patterns: [
      { pattern_id: 'newcomer', description: 'Nouveau dans la communauté', condition: 'market_years < 1', impact: 'risk_increase', severity: 2 },
      { pattern_id: 'established', description: 'Bien établi', condition: 'market_years >= 3', impact: 'risk_decrease', severity: 3 },
    ],
    uemoa_adjustments: [
      'Reconnaître commerce informel stable',
      'Vérifier auprès chef de marché/quartier',
    ],
  },
];

// ============================================
// F) PSYCHOMETRIC FEATURES
// ============================================

export const PSYCHOMETRIC_FEATURES: FeatureDefinition[] = [
  {
    id: 'financial_literacy_score',
    name: 'Score Culture Financière',
    category: 'psychometric',
    source_fields: ['quiz_budgeting', 'quiz_savings', 'quiz_debt', 'quiz_risk'],
    transformation: 'raw',
    formula: '(budgeting + savings + debt + risk) / 4',
    risk_direction: 'higher_better',
    weight: 0.025,
    missing_strategy: 'exclude',
    risk_patterns: [
      { pattern_id: 'low_literacy', description: 'Faible culture financière', condition: 'score < 40', impact: 'risk_increase', severity: 3 },
      { pattern_id: 'high_literacy', description: 'Bonne culture financière', condition: 'score >= 70', impact: 'risk_decrease', severity: 2 },
    ],
    uemoa_adjustments: [
      'Questions adaptées contexte local',
      'Administrer en langue locale si nécessaire',
    ],
  },
  {
    id: 'response_consistency_score',
    name: 'Score Cohérence Réponses',
    category: 'psychometric',
    source_fields: ['quiz_responses', 'response_times'],
    transformation: 'raw',
    formula: 'calculate_consistency(similar_questions_answers)',
    risk_direction: 'higher_better',
    weight: 0.025,
    missing_strategy: 'exclude',
    risk_patterns: [
      { pattern_id: 'inconsistent', description: 'Réponses incohérentes', condition: 'score < 60', impact: 'risk_increase', severity: 4 },
      { pattern_id: 'consistent', description: 'Réponses cohérentes', condition: 'score >= 85', impact: 'risk_decrease', severity: 2 },
    ],
    uemoa_adjustments: [
      'Détecter réponses préparées',
      'Vérifier temps de réponse naturel',
    ],
  },
  {
    id: 'planning_horizon_score',
    name: 'Score Horizon de Planification',
    category: 'psychometric',
    source_fields: ['planning_questions_responses'],
    transformation: 'categorical',
    formula: 'map(horizon, {short: 0.3, medium: 0.6, long: 0.9})',
    risk_direction: 'higher_better',
    weight: 0.025,
    missing_strategy: 'default',
    default_value: 0.5,
    risk_patterns: [
      { pattern_id: 'short_term', description: 'Vision court terme', condition: 'horizon == "short"', impact: 'risk_increase', severity: 2 },
      { pattern_id: 'long_term', description: 'Vision long terme', condition: 'horizon == "long"', impact: 'risk_decrease', severity: 2 },
    ],
    uemoa_adjustments: [
      'Reconnaître planification saisonnière (agriculture)',
      'Ajuster pour contexte incertain',
    ],
  },
];

// ============================================
// G) ENVIRONMENTAL FEATURES
// ============================================

export const ENVIRONMENTAL_FEATURES: FeatureDefinition[] = [
  {
    id: 'economic_zone_factor',
    name: 'Facteur Zone Économique',
    category: 'environmental',
    source_fields: ['city', 'region', 'zone_economic_data'],
    transformation: 'raw',
    formula: 'zone_prosperity_index',
    risk_direction: 'higher_better',
    weight: 0.03,
    missing_strategy: 'default',
    default_value: 0.6,
    risk_patterns: [
      { pattern_id: 'high_risk_zone', description: 'Zone à haut risque', condition: 'index < 0.4', impact: 'risk_increase', severity: 3 },
      { pattern_id: 'prosperous_zone', description: 'Zone prospère', condition: 'index >= 0.8', impact: 'risk_decrease', severity: 2 },
    ],
    uemoa_adjustments: [
      'Utiliser données BCEAO, INS',
      'Ajuster pour saisonnalité régionale',
    ],
  },
  {
    id: 'infrastructure_access_score',
    name: 'Score Accès Infrastructure',
    category: 'environmental',
    source_fields: ['city', 'electricity_access', 'banking_access', 'mobile_coverage'],
    transformation: 'raw',
    formula: '(electricity * 0.3 + banking * 0.3 + mobile * 0.4)',
    risk_direction: 'higher_better',
    weight: 0.02,
    missing_strategy: 'default',
    default_value: 0.5,
    risk_patterns: [
      { pattern_id: 'low_infra', description: 'Faible infrastructure', condition: 'score < 0.4', impact: 'risk_increase', severity: 2 },
    ],
    uemoa_adjustments: [
      'Données ouvertes disponibles',
      'Ajuster attentes pour zones rurales',
    ],
  },
  {
    id: 'seasonal_adjustment_factor',
    name: 'Facteur Ajustement Saisonnier',
    category: 'environmental',
    source_fields: ['sector', 'current_month', 'agricultural_calendar'],
    transformation: 'raw',
    formula: 'calculate_seasonal_factor(sector, month, calendar)',
    risk_direction: 'optimal_range',
    optimal_range: { min: 0.8, max: 1.2 },
    weight: 0.02,
    missing_strategy: 'default',
    default_value: 1.0,
    risk_patterns: [
      { pattern_id: 'off_season', description: 'Hors saison (agriculture)', condition: 'sector == "agriculture" && season == "dry"', impact: 'risk_increase', severity: 3 },
      { pattern_id: 'peak_season', description: 'Haute saison', condition: 'season == "harvest"', impact: 'risk_decrease', severity: 2 },
    ],
    uemoa_adjustments: [
      'Critique pour profils agricoles',
      'Utiliser calendrier cultural local',
    ],
  },
];

// ============================================
// EXPORT ALL FEATURES
// ============================================

export const ALL_FEATURES: FeatureDefinition[] = [
  ...FINANCIAL_FEATURES,
  ...PAYMENT_FEATURES,
  ...IDENTITY_FEATURES,
  ...DIGITAL_FEATURES,
  ...SOCIAL_FEATURES,
  ...PSYCHOMETRIC_FEATURES,
  ...ENVIRONMENTAL_FEATURES,
];

export function getFeatureById(id: string): FeatureDefinition | undefined {
  return ALL_FEATURES.find(f => f.id === id);
}

export function getFeaturesByCategory(category: FeatureCategory): FeatureDefinition[] {
  return ALL_FEATURES.filter(f => f.category === category);
}

export function getTotalWeight(): number {
  return ALL_FEATURES.reduce((sum, f) => sum + f.weight, 0);
}

export function validateWeights(): { valid: boolean; total: number } {
  const total = getTotalWeight();
  return { valid: Math.abs(total - 1.0) < 0.001, total };
}
