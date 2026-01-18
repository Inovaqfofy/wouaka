// ============================================
// SOVEREIGN DATA SOURCES - NO EXTERNAL DEPENDENCIES
// All data from: user uploads, OCR, open data, partnerships
// ============================================

export type SovereignSourceType = 
  | 'conventional' 
  | 'alternative' 
  | 'informal' 
  | 'environmental' 
  | 'device' 
  | 'social';

export type AcquisitionMethod =
  | 'direct_upload'           // PDF, image, receipt, invoice
  | 'offline_verification'    // Manual check possible
  | 'explicit_consent'        // User grants access
  | 'device_signals'          // Battery, uptime, mobility
  | 'ocr_extraction'          // Vision-based extraction
  | 'public_scraping'         // Public gov portals
  | 'open_data'               // Gov, NGOs, BCEAO
  | 'mfi_partnership'         // Direct MFI agreements
  | 'community_verification'; // Tontines, cooperatives

export type WeightCategory = 'very_strong' | 'strong' | 'medium' | 'weak' | 'optional';

export interface DataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  description: string;
  example: unknown;
  required: boolean;
  validation_regex?: string;
  min_value?: number;
  max_value?: number;
}

export interface FraudRisk {
  risk_id: string;
  description: string;
  detection_method: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SovereignDataSource {
  id: string;
  name: string;
  category: string;
  type: SovereignSourceType;
  acquisition_method: AcquisitionMethod;
  requires_internet: boolean;
  schema: {
    fields: DataField[];
    primary_key: string;
  };
  reliability_score: number; // 0-100
  fraud_risks: FraudRisk[];
  scoring_value: string;
  weight_category: WeightCategory;
  ocr_rules?: OcrExtractionRule[];
  validation_rules: string[];
  fallback_strategy: string;
}

export interface OcrExtractionRule {
  field: string;
  pattern: string;
  extraction_type: 'regex' | 'keyword_after' | 'table_cell' | 'amount';
  confidence_threshold: number;
}

// ============================================
// A) BANKING DATA (WITHOUT PAID APIs)
// ============================================

export const SOVEREIGN_BANKING_SOURCES: SovereignDataSource[] = [
  {
    id: 'printed_bank_statement',
    name: 'Relevé Bancaire Imprimé/PDF',
    category: 'banking',
    type: 'conventional',
    acquisition_method: 'direct_upload',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'bank_name', type: 'string', description: 'Nom de la banque', example: 'SGBF', required: true },
        { name: 'account_holder', type: 'string', description: 'Titulaire du compte', example: 'KOUASSI Jean', required: true },
        { name: 'account_number_masked', type: 'string', description: 'N° compte masqué', example: '****7892', required: true },
        { name: 'statement_month', type: 'string', description: 'Mois du relevé', example: '2024-01', required: true },
        { name: 'opening_balance', type: 'number', description: 'Solde initial', example: 125000, required: true },
        { name: 'closing_balance', type: 'number', description: 'Solde final', example: 187500, required: true },
        { name: 'total_credits', type: 'number', description: 'Total entrées', example: 450000, required: true },
        { name: 'total_debits', type: 'number', description: 'Total sorties', example: 387500, required: true },
        { name: 'transaction_count', type: 'number', description: 'Nb transactions', example: 23, required: true },
        { name: 'salary_detected', type: 'boolean', description: 'Virement salaire détecté', example: true, required: false },
        { name: 'salary_amount', type: 'number', description: 'Montant salaire', example: 350000, required: false },
        { name: 'overdraft_count', type: 'number', description: 'Nb jours découvert', example: 0, required: false },
        { name: 'recurring_debits', type: 'array', description: 'Prélèvements récurrents', example: [], required: false },
      ],
      primary_key: 'account_number_masked',
    },
    reliability_score: 85,
    fraud_risks: [
      { risk_id: 'edited_pdf', description: 'PDF modifié', detection_method: 'Vérifier métadonnées PDF, cohérence totaux', severity: 'high' },
      { risk_id: 'fake_bank', description: 'Faux en-tête bancaire', detection_method: 'Comparer logo/format avec base référence', severity: 'high' },
      { risk_id: 'amount_mismatch', description: 'Totaux incohérents', detection_method: 'Vérifier que entrées-sorties = delta solde', severity: 'medium' },
    ],
    scoring_value: 'Preuve solide de flux financiers, stabilité revenus, discipline bancaire',
    weight_category: 'very_strong',
    ocr_rules: [
      { field: 'bank_name', pattern: '^(SGBF|BOA|BICICI|SIB|CORIS|ECOBANK|UBA|BNI)', extraction_type: 'regex', confidence_threshold: 0.8 },
      { field: 'account_number_masked', pattern: '\\*{4}\\d{4}', extraction_type: 'regex', confidence_threshold: 0.9 },
      { field: 'opening_balance', pattern: 'Solde\\s*(initial|début|antérieur)\\s*:?\\s*([\\d\\s]+)', extraction_type: 'keyword_after', confidence_threshold: 0.85 },
      { field: 'closing_balance', pattern: 'Solde\\s*(final|fin|nouveau)\\s*:?\\s*([\\d\\s]+)', extraction_type: 'keyword_after', confidence_threshold: 0.85 },
      { field: 'total_credits', pattern: 'Total\\s*(crédit|entrées)\\s*:?\\s*([\\d\\s]+)', extraction_type: 'keyword_after', confidence_threshold: 0.8 },
      { field: 'total_debits', pattern: 'Total\\s*(débit|sorties)\\s*:?\\s*([\\d\\s]+)', extraction_type: 'keyword_after', confidence_threshold: 0.8 },
    ],
    validation_rules: [
      'opening_balance + total_credits - total_debits == closing_balance (±1%)',
      'statement_month within last 6 months',
      'bank_name matches known UEMOA banks',
      'account_holder similarity with declared name > 70%',
    ],
    fallback_strategy: 'Demander relevé SMS ou reçus ATM si PDF indisponible',
  },
  {
    id: 'atm_receipts',
    name: 'Reçus de Retrait ATM',
    category: 'banking',
    type: 'conventional',
    acquisition_method: 'direct_upload',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'receipt_date', type: 'date', description: 'Date transaction', example: '2024-01-15', required: true },
        { name: 'atm_location', type: 'string', description: 'Localisation DAB', example: 'Abidjan Plateau', required: false },
        { name: 'withdrawal_amount', type: 'number', description: 'Montant retiré', example: 50000, required: true },
        { name: 'available_balance', type: 'number', description: 'Solde disponible', example: 235000, required: true },
        { name: 'account_masked', type: 'string', description: 'N° compte masqué', example: '****7892', required: true },
        { name: 'bank_code', type: 'string', description: 'Code banque', example: 'SGBF', required: true },
      ],
      primary_key: 'receipt_date',
    },
    reliability_score: 70,
    fraud_risks: [
      { risk_id: 'fake_receipt', description: 'Reçu fabriqué', detection_method: 'Vérifier format thermique, police standard', severity: 'medium' },
      { risk_id: 'date_manipulation', description: 'Date modifiée', detection_method: 'Cross-check avec autres reçus', severity: 'medium' },
    ],
    scoring_value: 'Preuve ponctuelle d\'accès à liquidités et solde bancaire',
    weight_category: 'medium',
    validation_rules: [
      'withdrawal_amount <= available_balance',
      'receipt_date within last 90 days',
    ],
    fallback_strategy: 'Utiliser relevé complet si disponible',
  },
  {
    id: 'sms_bank_alerts',
    name: 'SMS Alertes Bancaires',
    category: 'banking',
    type: 'alternative',
    acquisition_method: 'explicit_consent',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'sms_date', type: 'date', description: 'Date SMS', example: '2024-01-20', required: true },
        { name: 'sender_number', type: 'string', description: 'Numéro expéditeur', example: '+22507000000', required: true },
        { name: 'transaction_type', type: 'string', description: 'Type (CREDIT/DEBIT)', example: 'CREDIT', required: true },
        { name: 'amount', type: 'number', description: 'Montant', example: 150000, required: true },
        { name: 'new_balance', type: 'number', description: 'Nouveau solde', example: 385000, required: false },
        { name: 'description', type: 'string', description: 'Libellé', example: 'VIR SALAIRE MARS', required: false },
      ],
      primary_key: 'sms_date',
    },
    reliability_score: 75,
    fraud_risks: [
      { risk_id: 'fake_sms', description: 'SMS fabriqué', detection_method: 'Vérifier numéro expéditeur banque officiel', severity: 'high' },
      { risk_id: 'screenshot_edit', description: 'Screenshot modifié', detection_method: 'Analyse pixels, métadonnées image', severity: 'high' },
    ],
    scoring_value: 'Historique temps réel des mouvements, patterns de revenus',
    weight_category: 'strong',
    validation_rules: [
      'sender_number matches known bank SMS numbers',
      'chronological order of transactions is consistent',
      'balance progression is mathematically correct',
    ],
    fallback_strategy: 'Demander relevé officiel si SMS insuffisants',
  },
];

// ============================================
// B) MOBILE MONEY (USER-PROVIDED)
// ============================================

export const SOVEREIGN_MOMO_SOURCES: SovereignDataSource[] = [
  {
    id: 'momo_screenshot',
    name: 'Screenshot Historique Mobile Money',
    category: 'mobile_money',
    type: 'alternative',
    acquisition_method: 'ocr_extraction',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'provider', type: 'string', description: 'Opérateur MoMo', example: 'Orange Money', required: true },
        { name: 'phone_number_masked', type: 'string', description: 'N° masqué', example: '07****5234', required: true },
        { name: 'current_balance', type: 'number', description: 'Solde actuel', example: 45000, required: true },
        { name: 'screenshot_date', type: 'date', description: 'Date capture', example: '2024-01-25', required: true },
        { name: 'last_transactions', type: 'array', description: 'Dernières transactions', example: [], required: false },
      ],
      primary_key: 'phone_number_masked',
    },
    reliability_score: 65,
    fraud_risks: [
      { risk_id: 'edited_screenshot', description: 'Image modifiée', detection_method: 'Analyse ELA (Error Level Analysis)', severity: 'high' },
      { risk_id: 'old_screenshot', description: 'Screenshot ancien', detection_method: 'Vérifier date système visible', severity: 'medium' },
      { risk_id: 'fake_app', description: 'Fausse app MoMo', detection_method: 'Vérifier UI exacte de l\'app officielle', severity: 'critical' },
    ],
    scoring_value: 'Preuve de liquidités et activité financière digitale',
    weight_category: 'strong',
    ocr_rules: [
      { field: 'provider', pattern: '(Orange Money|MTN MoMo|Moov Money|Wave)', extraction_type: 'regex', confidence_threshold: 0.9 },
      { field: 'current_balance', pattern: '(Solde|Balance)\\s*:?\\s*([\\d\\s,\\.]+)\\s*(FCFA|XOF)?', extraction_type: 'keyword_after', confidence_threshold: 0.85 },
    ],
    validation_rules: [
      'screenshot_date within last 7 days',
      'UI matches official app design for provider',
      'phone_number matches declared number',
    ],
    fallback_strategy: 'Demander SMS de confirmation ou mini-relevé USSD',
  },
  {
    id: 'momo_sms_confirmations',
    name: 'SMS Confirmations Mobile Money',
    category: 'mobile_money',
    type: 'alternative',
    acquisition_method: 'explicit_consent',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'sms_date', type: 'date', description: 'Date SMS', example: '2024-01-20', required: true },
        { name: 'sender', type: 'string', description: 'Expéditeur', example: 'OrangeMoney', required: true },
        { name: 'transaction_type', type: 'string', description: 'Type', example: 'ENVOI', required: true },
        { name: 'amount', type: 'number', description: 'Montant', example: 25000, required: true },
        { name: 'recipient_masked', type: 'string', description: 'Destinataire', example: '07****1234', required: false },
        { name: 'new_balance', type: 'number', description: 'Nouveau solde', example: 12500, required: false },
        { name: 'transaction_id', type: 'string', description: 'ID transaction', example: 'MP240120789456', required: true },
      ],
      primary_key: 'transaction_id',
    },
    reliability_score: 80,
    fraud_risks: [
      { risk_id: 'fake_sender', description: 'Expéditeur falsifié', detection_method: 'Vérifier short code officiel', severity: 'high' },
      { risk_id: 'duplicate_id', description: 'ID transaction dupliqué', detection_method: 'Vérifier unicité', severity: 'medium' },
    ],
    scoring_value: 'Historique fiable des transferts, patterns de revenus/dépenses',
    weight_category: 'very_strong',
    validation_rules: [
      'sender matches official MoMo short codes (30303, 144, etc.)',
      'transaction_id format matches provider pattern',
      'chronological order is consistent',
    ],
    fallback_strategy: 'Demander relevé USSD *144# ou équivalent',
  },
  {
    id: 'ussd_mini_statement',
    name: 'Mini-Relevé USSD Mobile Money',
    category: 'mobile_money',
    type: 'alternative',
    acquisition_method: 'direct_upload',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'provider', type: 'string', description: 'Opérateur', example: 'MTN MoMo', required: true },
        { name: 'phone_number', type: 'string', description: 'Numéro', example: '0758001234', required: true },
        { name: 'balance', type: 'number', description: 'Solde', example: 87500, required: true },
        { name: 'last_5_transactions', type: 'array', description: '5 dernières transactions', example: [], required: true },
        { name: 'statement_date', type: 'date', description: 'Date relevé', example: '2024-01-25', required: true },
      ],
      primary_key: 'phone_number',
    },
    reliability_score: 85,
    fraud_risks: [
      { risk_id: 'fabricated_ussd', description: 'Écran USSD fabriqué', detection_method: 'Vérifier format exact USSD provider', severity: 'high' },
    ],
    scoring_value: 'Aperçu rapide et fiable de l\'activité MoMo récente',
    weight_category: 'strong',
    validation_rules: [
      'statement_date within last 48 hours',
      'USSD format matches provider standard',
    ],
    fallback_strategy: 'Demander screenshots détaillés',
  },
];

// ============================================
// C) UTILITIES AND RECURRING BILLS
// ============================================

export const SOVEREIGN_UTILITY_SOURCES: SovereignDataSource[] = [
  {
    id: 'electricity_bill',
    name: 'Facture Électricité (CIE, SENELEC, CEET, etc.)',
    category: 'utilities',
    type: 'conventional',
    acquisition_method: 'ocr_extraction',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'provider', type: 'string', description: 'Fournisseur', example: 'CIE', required: true },
        { name: 'customer_name', type: 'string', description: 'Nom abonné', example: 'KOUAME Aminata', required: true },
        { name: 'customer_id', type: 'string', description: 'N° abonné', example: 'ABJ-456789', required: true },
        { name: 'bill_period', type: 'string', description: 'Période', example: '01/2024', required: true },
        { name: 'consumption_kwh', type: 'number', description: 'Consommation kWh', example: 245, required: true },
        { name: 'amount_due', type: 'number', description: 'Montant à payer', example: 35600, required: true },
        { name: 'due_date', type: 'date', description: 'Date limite', example: '2024-02-15', required: true },
        { name: 'payment_status', type: 'string', description: 'Statut', example: 'PAYÉ', required: false },
        { name: 'payment_date', type: 'date', description: 'Date paiement', example: '2024-02-10', required: false },
        { name: 'address', type: 'string', description: 'Adresse', example: 'Cocody, Rue des Jardins', required: false },
      ],
      primary_key: 'customer_id',
    },
    reliability_score: 90,
    fraud_risks: [
      { risk_id: 'forged_bill', description: 'Facture falsifiée', detection_method: 'Vérifier format officiel, code-barres', severity: 'medium' },
      { risk_id: 'name_mismatch', description: 'Nom différent', detection_method: 'Comparer avec nom déclaré', severity: 'low' },
    ],
    scoring_value: 'Preuve de résidence stable, discipline de paiement, estimation niveau de vie',
    weight_category: 'very_strong',
    ocr_rules: [
      { field: 'provider', pattern: '(CIE|SENELEC|CEET|SONABEL|SBEE|NIGELEC)', extraction_type: 'regex', confidence_threshold: 0.95 },
      { field: 'customer_id', pattern: '[A-Z]{2,4}[-\\s]?\\d{5,10}', extraction_type: 'regex', confidence_threshold: 0.9 },
      { field: 'consumption_kwh', pattern: 'Consommation\\s*:?\\s*(\\d+)\\s*kWh', extraction_type: 'keyword_after', confidence_threshold: 0.85 },
      { field: 'amount_due', pattern: '(Montant|Total)\\s*(à payer|TTC)?\\s*:?\\s*([\\d\\s]+)', extraction_type: 'keyword_after', confidence_threshold: 0.9 },
    ],
    validation_rules: [
      'consumption_kwh > 0 and < 10000',
      'amount_due correlates with consumption (± 30%)',
      'bill_period within last 3 months',
    ],
    fallback_strategy: 'Demander reçu de paiement ou attestation',
  },
  {
    id: 'water_bill',
    name: 'Facture Eau (SODECI, SDE, ONEA, etc.)',
    category: 'utilities',
    type: 'conventional',
    acquisition_method: 'ocr_extraction',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'provider', type: 'string', description: 'Fournisseur', example: 'SODECI', required: true },
        { name: 'customer_name', type: 'string', description: 'Nom abonné', example: 'DIALLO Moussa', required: true },
        { name: 'customer_id', type: 'string', description: 'N° abonné', example: 'SOD-789456', required: true },
        { name: 'bill_period', type: 'string', description: 'Période', example: '01/2024', required: true },
        { name: 'consumption_m3', type: 'number', description: 'Consommation m³', example: 18, required: true },
        { name: 'amount_due', type: 'number', description: 'Montant', example: 12500, required: true },
        { name: 'due_date', type: 'date', description: 'Date limite', example: '2024-02-20', required: true },
        { name: 'payment_status', type: 'string', description: 'Statut', example: 'PAYÉ', required: false },
      ],
      primary_key: 'customer_id',
    },
    reliability_score: 85,
    fraud_risks: [
      { risk_id: 'forged_bill', description: 'Facture falsifiée', detection_method: 'Vérifier format officiel', severity: 'medium' },
    ],
    scoring_value: 'Preuve de résidence, discipline de paiement',
    weight_category: 'strong',
    validation_rules: [
      'consumption_m3 > 0 and < 500',
      'bill_period within last 3 months',
    ],
    fallback_strategy: 'Accepter facture électricité comme alternative',
  },
  {
    id: 'rent_receipt',
    name: 'Quittance de Loyer',
    category: 'utilities',
    type: 'conventional',
    acquisition_method: 'direct_upload',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'landlord_name', type: 'string', description: 'Nom bailleur', example: 'KOFFI Propriétés', required: true },
        { name: 'tenant_name', type: 'string', description: 'Nom locataire', example: 'TRAORE Awa', required: true },
        { name: 'rental_period', type: 'string', description: 'Période', example: '01/2024', required: true },
        { name: 'monthly_rent', type: 'number', description: 'Loyer mensuel', example: 75000, required: true },
        { name: 'payment_date', type: 'date', description: 'Date paiement', example: '2024-01-05', required: true },
        { name: 'property_address', type: 'string', description: 'Adresse bien', example: 'Yopougon, Quartier Millionnaire', required: false },
        { name: 'receipt_number', type: 'string', description: 'N° quittance', example: 'QTT-2024-001', required: false },
      ],
      primary_key: 'receipt_number',
    },
    reliability_score: 70,
    fraud_risks: [
      { risk_id: 'fake_receipt', description: 'Fausse quittance', detection_method: 'Vérifier signature, cohérence', severity: 'medium' },
      { risk_id: 'inflated_rent', description: 'Loyer exagéré', detection_method: 'Comparer avec prix marché zone', severity: 'low' },
    ],
    scoring_value: 'Preuve de charges fixes, stabilité résidentielle',
    weight_category: 'strong',
    validation_rules: [
      'monthly_rent within market range for address zone',
      'payment_date <= 10th of the month (discipline)',
      'tenant_name matches declared name > 70%',
    ],
    fallback_strategy: 'Demander attestation d\'hébergement',
  },
  {
    id: 'telecom_bill',
    name: 'Facture Télécom/Internet',
    category: 'utilities',
    type: 'conventional',
    acquisition_method: 'ocr_extraction',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'provider', type: 'string', description: 'Opérateur', example: 'Orange CI', required: true },
        { name: 'customer_name', type: 'string', description: 'Nom', example: 'BAMBA Seydou', required: true },
        { name: 'phone_number', type: 'string', description: 'Numéro', example: '0758001234', required: true },
        { name: 'bill_period', type: 'string', description: 'Période', example: '01/2024', required: true },
        { name: 'amount_due', type: 'number', description: 'Montant', example: 15000, required: true },
        { name: 'plan_type', type: 'string', description: 'Type forfait', example: 'Postpaid', required: false },
      ],
      primary_key: 'phone_number',
    },
    reliability_score: 80,
    fraud_risks: [
      { risk_id: 'forged_bill', description: 'Facture falsifiée', detection_method: 'Vérifier format opérateur', severity: 'medium' },
    ],
    scoring_value: 'Indique niveau de vie, discipline paiement, stabilité numéro',
    weight_category: 'medium',
    validation_rules: [
      'phone_number matches declared number',
      'bill_period within last 2 months',
    ],
    fallback_strategy: 'Demander reçu de recharge récent',
  },
];

// ============================================
// D) TELECOM/DEVICE SIGNALS (NO API)
// ============================================

export const SOVEREIGN_DEVICE_SOURCES: SovereignDataSource[] = [
  {
    id: 'topup_history',
    name: 'Historique Recharges Téléphoniques',
    category: 'device',
    type: 'device',
    acquisition_method: 'explicit_consent',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'phone_number', type: 'string', description: 'Numéro', example: '0758001234', required: true },
        { name: 'topups_last_30d', type: 'array', description: 'Recharges 30 jours', example: [], required: true },
        { name: 'total_topup_amount', type: 'number', description: 'Total rechargé', example: 25000, required: true },
        { name: 'topup_frequency', type: 'number', description: 'Fréquence (nb/mois)', example: 8, required: true },
        { name: 'average_topup', type: 'number', description: 'Recharge moyenne', example: 3125, required: true },
        { name: 'topup_regularity_score', type: 'number', description: 'Régularité (0-100)', example: 75, required: false },
      ],
      primary_key: 'phone_number',
    },
    reliability_score: 70,
    fraud_risks: [
      { risk_id: 'inflated_topups', description: 'Montants exagérés', detection_method: 'Comparer avec moyenne régionale', severity: 'low' },
    ],
    scoring_value: 'Indicateur de discipline dépenses, stabilité financière',
    weight_category: 'medium',
    validation_rules: [
      'total_topup_amount / topup_frequency == average_topup (± 5%)',
      'topup_frequency between 1 and 30',
    ],
    fallback_strategy: 'Utiliser SMS de confirmation recharge',
  },
  {
    id: 'device_info',
    name: 'Informations Appareil',
    category: 'device',
    type: 'device',
    acquisition_method: 'device_signals',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'device_model', type: 'string', description: 'Modèle téléphone', example: 'Samsung Galaxy A21s', required: true },
        { name: 'device_age_months', type: 'number', description: 'Âge appareil (mois)', example: 18, required: true },
        { name: 'os_version', type: 'string', description: 'Version OS', example: 'Android 12', required: true },
        { name: 'storage_free_percent', type: 'number', description: '% stockage libre', example: 45, required: false },
        { name: 'battery_health', type: 'number', description: 'Santé batterie %', example: 87, required: false },
        { name: 'screen_time_daily_avg', type: 'number', description: 'Temps écran moy/jour (min)', example: 180, required: false },
        { name: 'apps_installed_count', type: 'number', description: 'Nb apps installées', example: 42, required: false },
        { name: 'financial_apps', type: 'array', description: 'Apps financières', example: ['Orange Money', 'Wave'], required: false },
      ],
      primary_key: 'device_model',
    },
    reliability_score: 75,
    fraud_risks: [
      { risk_id: 'spoofed_device', description: 'Info appareil falsifiée', detection_method: 'Vérifier cohérence user-agent', severity: 'medium' },
    ],
    scoring_value: 'Indique niveau socio-économique, engagement digital, stabilité',
    weight_category: 'medium',
    validation_rules: [
      'device_age_months > 0',
      'battery_health between 50 and 100',
    ],
    fallback_strategy: 'Demander capture d\'écran "À propos du téléphone"',
  },
  {
    id: 'sim_stability',
    name: 'Stabilité SIM',
    category: 'device',
    type: 'device',
    acquisition_method: 'device_signals',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'phone_number', type: 'string', description: 'Numéro', example: '0758001234', required: true },
        { name: 'sim_age_months', type: 'number', description: 'Âge SIM (mois)', example: 36, required: true },
        { name: 'operator', type: 'string', description: 'Opérateur', example: 'Orange', required: true },
        { name: 'sim_type', type: 'string', description: 'Type SIM', example: 'Postpaid', required: false },
        { name: 'recent_port_in', type: 'boolean', description: 'Portabilité récente', example: false, required: false },
        { name: 'network_consistency', type: 'number', description: 'Stabilité réseau %', example: 92, required: false },
      ],
      primary_key: 'phone_number',
    },
    reliability_score: 80,
    fraud_risks: [
      { risk_id: 'sim_swap', description: 'Échange SIM récent', detection_method: 'Vérifier date activation SIM', severity: 'high' },
      { risk_id: 'burner_sim', description: 'SIM jetable', detection_method: 'Âge < 3 mois', severity: 'high' },
    ],
    scoring_value: 'Indicateur majeur de stabilité identité, anti-fraude',
    weight_category: 'very_strong',
    validation_rules: [
      'sim_age_months >= 3 for medium trust',
      'sim_age_months >= 12 for high trust',
      'recent_port_in == false for high trust',
    ],
    fallback_strategy: 'Demander copie enregistrement SIM opérateur',
  },
  {
    id: 'location_stability',
    name: 'Stabilité Géographique',
    category: 'device',
    type: 'device',
    acquisition_method: 'device_signals',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'primary_city', type: 'string', description: 'Ville principale', example: 'Abidjan', required: true },
        { name: 'neighborhood', type: 'string', description: 'Quartier', example: 'Cocody', required: false },
        { name: 'mobility_radius_km', type: 'number', description: 'Rayon mobilité (km)', example: 15, required: true },
        { name: 'location_consistency', type: 'number', description: 'Stabilité lieu %', example: 85, required: true },
        { name: 'commute_pattern', type: 'string', description: 'Pattern déplacement', example: 'regular_commuter', required: false },
        { name: 'home_work_detected', type: 'boolean', description: 'Domicile/travail détectés', example: true, required: false },
      ],
      primary_key: 'primary_city',
    },
    reliability_score: 70,
    fraud_risks: [
      { risk_id: 'location_spoofing', description: 'GPS falsifié', detection_method: 'Détecter incohérences timing/distance', severity: 'medium' },
    ],
    scoring_value: 'Stabilité résidentielle, régularité vie quotidienne',
    weight_category: 'medium',
    validation_rules: [
      'location_consistency >= 50%',
      'mobility_radius_km < 200 for urban profiles',
    ],
    fallback_strategy: 'Utiliser adresse factures utilitaires',
  },
];

// ============================================
// E) SOCIAL CAPITAL / INFORMAL ECONOMY
// ============================================

export const SOVEREIGN_SOCIAL_SOURCES: SovereignDataSource[] = [
  {
    id: 'tontine_membership',
    name: 'Participation Tontine',
    category: 'social',
    type: 'informal',
    acquisition_method: 'community_verification',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'tontine_name', type: 'string', description: 'Nom tontine', example: 'Solidarité des Femmes de Cocody', required: true },
        { name: 'member_since', type: 'date', description: 'Membre depuis', example: '2022-03-15', required: true },
        { name: 'monthly_contribution', type: 'number', description: 'Cotisation mensuelle', example: 25000, required: true },
        { name: 'members_count', type: 'number', description: 'Nb membres', example: 15, required: true },
        { name: 'missed_payments', type: 'number', description: 'Paiements manqués', example: 0, required: true },
        { name: 'times_received', type: 'number', description: 'Fois reçu la cagnotte', example: 3, required: false },
        { name: 'organizer_name', type: 'string', description: 'Nom organisateur', example: 'Mme BAMBA', required: false },
        { name: 'organizer_phone', type: 'string', description: 'Tél organisateur', example: '0758001234', required: false },
        { name: 'verification_status', type: 'string', description: 'Statut vérification', example: 'verified', required: false },
      ],
      primary_key: 'tontine_name',
    },
    reliability_score: 75,
    fraud_risks: [
      { risk_id: 'fake_tontine', description: 'Tontine fictive', detection_method: 'Appeler organisateur, vérifier existence', severity: 'high' },
      { risk_id: 'inflated_contribution', description: 'Montant exagéré', detection_method: 'Comparer avec revenus déclarés', severity: 'medium' },
    ],
    scoring_value: 'Preuve d\'engagement communautaire, discipline financière, réseau social',
    weight_category: 'strong',
    validation_rules: [
      'monthly_contribution < 50% monthly_income',
      'missed_payments <= 2 for good standing',
      'member_since > 6 months for strong signal',
    ],
    fallback_strategy: 'Demander attestation écrite de l\'organisateur',
  },
  {
    id: 'cooperative_membership',
    name: 'Adhésion Coopérative',
    category: 'social',
    type: 'informal',
    acquisition_method: 'mfi_partnership',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'coop_name', type: 'string', description: 'Nom coopérative', example: 'COOPEC des Artisans de Bouaké', required: true },
        { name: 'coop_type', type: 'string', description: 'Type', example: 'savings_credit', required: true },
        { name: 'member_id', type: 'string', description: 'N° membre', example: 'COOP-2021-456', required: true },
        { name: 'member_since', type: 'date', description: 'Adhésion', example: '2021-06-01', required: true },
        { name: 'savings_balance', type: 'number', description: 'Solde épargne', example: 175000, required: false },
        { name: 'loans_taken', type: 'number', description: 'Nb prêts obtenus', example: 2, required: false },
        { name: 'loans_repaid_ontime', type: 'number', description: 'Prêts remboursés à temps', example: 2, required: false },
        { name: 'current_loan_balance', type: 'number', description: 'Encours prêt', example: 0, required: false },
      ],
      primary_key: 'member_id',
    },
    reliability_score: 85,
    fraud_risks: [
      { risk_id: 'fake_membership', description: 'Fausse adhésion', detection_method: 'Vérifier auprès coopérative', severity: 'high' },
    ],
    scoring_value: 'Excellent indicateur de discipline financière, historique crédit informel',
    weight_category: 'very_strong',
    validation_rules: [
      'loans_repaid_ontime == loans_taken for perfect record',
      'current_loan_balance < 3x savings_balance',
    ],
    fallback_strategy: 'Demander attestation de la coopérative',
  },
  {
    id: 'market_stall_payment',
    name: 'Paiement Emplacement Marché',
    category: 'social',
    type: 'informal',
    acquisition_method: 'direct_upload',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'market_name', type: 'string', description: 'Nom marché', example: 'Grand Marché Treichville', required: true },
        { name: 'stall_number', type: 'string', description: 'N° emplacement', example: 'A-45', required: true },
        { name: 'monthly_fee', type: 'number', description: 'Frais mensuels', example: 35000, required: true },
        { name: 'payment_period', type: 'string', description: 'Période payée', example: '01/2024 - 03/2024', required: true },
        { name: 'receipt_number', type: 'string', description: 'N° reçu', example: 'MKT-2024-789', required: false },
        { name: 'years_at_location', type: 'number', description: 'Années à cet emplacement', example: 4, required: false },
      ],
      primary_key: 'stall_number',
    },
    reliability_score: 70,
    fraud_risks: [
      { risk_id: 'fake_receipt', description: 'Faux reçu', detection_method: 'Vérifier format officiel mairie/marché', severity: 'medium' },
    ],
    scoring_value: 'Preuve d\'activité commerciale stable, ancrage local',
    weight_category: 'medium',
    validation_rules: [
      'monthly_fee correlates with market tier',
      'years_at_location > 1 for stability signal',
    ],
    fallback_strategy: 'Attestation chef de marché',
  },
  {
    id: 'guarantor_network',
    name: 'Réseau de Garants',
    category: 'social',
    type: 'social',
    acquisition_method: 'explicit_consent',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'guarantors', type: 'array', description: 'Liste garants', example: [], required: true },
        { name: 'guarantor_count', type: 'number', description: 'Nb garants', example: 2, required: true },
        { name: 'verified_guarantors', type: 'number', description: 'Garants vérifiés', example: 2, required: false },
        { name: 'guarantor_avg_score', type: 'number', description: 'Score moyen garants', example: 72, required: false },
        { name: 'relationship_years_avg', type: 'number', description: 'Années relation moyenne', example: 5, required: false },
      ],
      primary_key: 'guarantor_count',
    },
    reliability_score: 65,
    fraud_risks: [
      { risk_id: 'fake_guarantors', description: 'Faux garants', detection_method: 'Appeler et vérifier chaque garant', severity: 'high' },
      { risk_id: 'circular_guarantees', description: 'Garanties croisées', detection_method: 'Détecter si garants se garantissent mutuellement', severity: 'high' },
    ],
    scoring_value: 'Capital social, fiabilité perçue par pairs',
    weight_category: 'medium',
    validation_rules: [
      'guarantor_count >= 2',
      'verified_guarantors == guarantor_count for full credit',
      'no circular guarantees in network',
    ],
    fallback_strategy: 'Augmenter autres preuves si garants insuffisants',
  },
];

// ============================================
// F) PSYCHOMETRIC & MICRO-BEHAVIOR
// ============================================

export const SOVEREIGN_PSYCHOMETRIC_SOURCES: SovereignDataSource[] = [
  {
    id: 'financial_literacy_quiz',
    name: 'Quiz Culture Financière',
    category: 'psychometric',
    type: 'alternative',
    acquisition_method: 'explicit_consent',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'quiz_version', type: 'string', description: 'Version quiz', example: 'v2.1', required: true },
        { name: 'total_score', type: 'number', description: 'Score total (%)', example: 72, required: true },
        { name: 'budgeting_score', type: 'number', description: 'Score budget', example: 80, required: true },
        { name: 'savings_score', type: 'number', description: 'Score épargne', example: 65, required: true },
        { name: 'debt_understanding', type: 'number', description: 'Compréhension dette', example: 70, required: true },
        { name: 'risk_awareness', type: 'number', description: 'Conscience risque', example: 75, required: true },
        { name: 'time_to_complete_sec', type: 'number', description: 'Temps réponse (sec)', example: 180, required: true },
        { name: 'consistency_score', type: 'number', description: 'Cohérence réponses', example: 85, required: true },
      ],
      primary_key: 'quiz_version',
    },
    reliability_score: 60,
    fraud_risks: [
      { risk_id: 'coached_answers', description: 'Réponses préparées', detection_method: 'Temps réponse trop rapide', severity: 'medium' },
      { risk_id: 'random_clicking', description: 'Clics aléatoires', detection_method: 'Inconsistance réponses similaires', severity: 'medium' },
    ],
    scoring_value: 'Indicateur de capacité à gérer un crédit, planification',
    weight_category: 'medium',
    validation_rules: [
      'time_to_complete_sec between 60 and 600',
      'consistency_score >= 70',
    ],
    fallback_strategy: 'Demander entretien téléphonique court',
  },
  {
    id: 'risk_attitude_assessment',
    name: 'Évaluation Attitude au Risque',
    category: 'psychometric',
    type: 'alternative',
    acquisition_method: 'explicit_consent',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'assessment_version', type: 'string', description: 'Version', example: 'v1.3', required: true },
        { name: 'risk_tolerance', type: 'number', description: 'Tolérance risque (0-100)', example: 45, required: true },
        { name: 'impulsivity_score', type: 'number', description: 'Impulsivité (0-100, bas=mieux)', example: 25, required: true },
        { name: 'planning_horizon', type: 'string', description: 'Horizon planification', example: 'medium_term', required: true },
        { name: 'loss_aversion', type: 'number', description: 'Aversion perte', example: 70, required: true },
        { name: 'financial_confidence', type: 'number', description: 'Confiance financière', example: 60, required: true },
        { name: 'response_time_avg_ms', type: 'number', description: 'Temps réponse moyen (ms)', example: 3200, required: true },
      ],
      primary_key: 'assessment_version',
    },
    reliability_score: 55,
    fraud_risks: [
      { risk_id: 'gaming_test', description: 'Manipulation test', detection_method: 'Patterns réponses anormaux', severity: 'medium' },
    ],
    scoring_value: 'Prédiction comportement remboursement sous stress',
    weight_category: 'weak',
    validation_rules: [
      'response_time_avg_ms between 1000 and 15000',
      'impulsivity_score < 70 for approval',
    ],
    fallback_strategy: 'Pondérer autres données plus fortement',
  },
];

// ============================================
// G) ENVIRONMENTAL & ECONOMIC CONTEXT
// ============================================

export const SOVEREIGN_ENVIRONMENT_SOURCES: SovereignDataSource[] = [
  {
    id: 'local_economic_index',
    name: 'Indice Économique Local',
    category: 'environmental',
    type: 'environmental',
    acquisition_method: 'open_data',
    requires_internet: true,
    schema: {
      fields: [
        { name: 'region', type: 'string', description: 'Région', example: 'Abidjan', required: true },
        { name: 'city', type: 'string', description: 'Ville', example: 'Cocody', required: true },
        { name: 'poverty_index', type: 'number', description: 'Indice pauvreté', example: 0.25, required: true },
        { name: 'unemployment_rate', type: 'number', description: 'Taux chômage', example: 0.12, required: true },
        { name: 'economic_activity_level', type: 'string', description: 'Niveau activité', example: 'high', required: true },
        { name: 'infrastructure_score', type: 'number', description: 'Score infrastructure', example: 78, required: true },
        { name: 'market_price_stability', type: 'number', description: 'Stabilité prix', example: 0.85, required: false },
      ],
      primary_key: 'city',
    },
    reliability_score: 90,
    fraud_risks: [],
    scoring_value: 'Ajustement contextuel du risque selon environnement économique',
    weight_category: 'medium',
    validation_rules: [
      'region in UEMOA_REGIONS',
      'poverty_index between 0 and 1',
    ],
    fallback_strategy: 'Utiliser moyenne nationale si données locales indisponibles',
  },
  {
    id: 'agricultural_calendar',
    name: 'Calendrier Agricole',
    category: 'environmental',
    type: 'environmental',
    acquisition_method: 'open_data',
    requires_internet: true,
    schema: {
      fields: [
        { name: 'region', type: 'string', description: 'Région', example: 'Bouaké', required: true },
        { name: 'current_season', type: 'string', description: 'Saison actuelle', example: 'harvest', required: true },
        { name: 'expected_yield', type: 'string', description: 'Rendement attendu', example: 'good', required: false },
        { name: 'price_forecast', type: 'string', description: 'Prévision prix', example: 'stable', required: false },
        { name: 'risk_factors', type: 'array', description: 'Facteurs risque', example: ['drought_risk'], required: false },
      ],
      primary_key: 'region',
    },
    reliability_score: 70,
    fraud_risks: [],
    scoring_value: 'Ajustement saisonnier pour profils agricoles',
    weight_category: 'optional',
    validation_rules: [
      'current_season in [planting, growing, harvest, dry_season]',
    ],
    fallback_strategy: 'Ignorer si profil non-agricole',
  },
];

// ============================================
// H) SELF-DECLARED PROFILE
// ============================================

export const SOVEREIGN_DECLARED_SOURCES: SovereignDataSource[] = [
  {
    id: 'self_declared_income',
    name: 'Revenus Auto-Déclarés',
    category: 'declared',
    type: 'conventional',
    acquisition_method: 'explicit_consent',
    requires_internet: false,
    schema: {
      fields: [
        { name: 'monthly_income', type: 'number', description: 'Revenu mensuel', example: 350000, required: true },
        { name: 'income_sources', type: 'array', description: 'Sources revenus', example: ['salary', 'business'], required: true },
        { name: 'income_regularity', type: 'string', description: 'Régularité', example: 'regular', required: true },
        { name: 'monthly_expenses', type: 'number', description: 'Dépenses mensuelles', example: 250000, required: true },
        { name: 'dependents_count', type: 'number', description: 'Personnes à charge', example: 3, required: true },
        { name: 'existing_debts', type: 'number', description: 'Dettes existantes', example: 100000, required: true },
        { name: 'savings_amount', type: 'number', description: 'Épargne', example: 75000, required: false },
      ],
      primary_key: 'monthly_income',
    },
    reliability_score: 40,
    fraud_risks: [
      { risk_id: 'income_inflation', description: 'Revenus gonflés', detection_method: 'Cross-check avec MoMo, bank, sector', severity: 'high' },
      { risk_id: 'hidden_expenses', description: 'Dépenses cachées', detection_method: 'Incohérence avec niveau de vie déclaré', severity: 'medium' },
      { risk_id: 'hidden_debts', description: 'Dettes cachées', detection_method: 'Vérifier coopératives, tontines', severity: 'high' },
    ],
    scoring_value: 'Données de base, mais doivent être validées',
    weight_category: 'weak',
    validation_rules: [
      'monthly_income > 0',
      'monthly_expenses < monthly_income * 1.5',
      'dependents_count < 15',
      'existing_debts < monthly_income * 24',
    ],
    fallback_strategy: 'Obligatoire mais poids réduit sans vérification',
  },
];

// ============================================
// EXPORT ALL SOURCES
// ============================================

export const ALL_SOVEREIGN_SOURCES = [
  ...SOVEREIGN_BANKING_SOURCES,
  ...SOVEREIGN_MOMO_SOURCES,
  ...SOVEREIGN_UTILITY_SOURCES,
  ...SOVEREIGN_DEVICE_SOURCES,
  ...SOVEREIGN_SOCIAL_SOURCES,
  ...SOVEREIGN_PSYCHOMETRIC_SOURCES,
  ...SOVEREIGN_ENVIRONMENT_SOURCES,
  ...SOVEREIGN_DECLARED_SOURCES,
];

export function getSourceById(id: string): SovereignDataSource | undefined {
  return ALL_SOVEREIGN_SOURCES.find(s => s.id === id);
}

export function getSourcesByCategory(category: string): SovereignDataSource[] {
  return ALL_SOVEREIGN_SOURCES.filter(s => s.category === category);
}

export function getSourcesByWeight(weight: WeightCategory): SovereignDataSource[] {
  return ALL_SOVEREIGN_SOURCES.filter(s => s.weight_category === weight);
}

export function getOfflineSources(): SovereignDataSource[] {
  return ALL_SOVEREIGN_SOURCES.filter(s => !s.requires_internet);
}
