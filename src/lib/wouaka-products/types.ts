// ============================================
// WOUAKA PRODUCTS - TYPE DEFINITIONS
// W-KYC | W-SCORE | WOUAKA CORE
// ============================================

// ============================================
// SHARED TYPES
// ============================================

export type Country = 'SN' | 'CI' | 'ML' | 'BF' | 'TG' | 'BJ' | 'NE' | 'GW';
export type Language = 'fr' | 'en';
export type DataQuality = 'high' | 'medium' | 'low' | 'insufficient';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

export interface DeviceInfo {
  device_id: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  os_version: string;
  browser?: string;
  screen_resolution?: string;
  timezone: string;
  language: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor_id: string;
  actor_type: 'user' | 'system' | 'api';
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

// ============================================
// W-KYC TYPES
// ============================================

export type KycLevel = 'basic' | 'enhanced' | 'advanced';

export type KycDocumentType = 
  | 'cni'              // Carte Nationale d'Identité
  | 'passport'
  | 'carte_sejour'     // Carte de séjour
  | 'carte_consulaire' // Carte consulaire
  | 'permis'           // Permis de conduire
  | 'attestation_identite' // Attestation d'identité
  | 'proof_of_address'
  | 'utility_bill'
  | 'bank_statement'
  | 'tax_document'
  | 'selfie'
  | 'liveness_video';

export type KycStatus = 
  | 'pending'
  | 'processing'
  | 'verified'
  | 'rejected'
  | 'requires_review'
  | 'expired';

export interface KycDocumentRequirement {
  document_type: KycDocumentType;
  required: boolean;
  alternatives?: KycDocumentType[];
  max_age_months?: number;
  ocr_enabled: boolean;
}

export interface KycLevelConfig {
  level: KycLevel;
  name: string;
  description: string;
  required_documents: KycDocumentRequirement[];
  requires_selfie: boolean;
  requires_liveness: boolean;
  requires_address_verification: boolean;
  min_age: number;
  max_processing_hours: number;
  auto_approve_threshold: number;
}

export interface ExtractedIdentity {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  nationality?: string;
  gender?: 'M' | 'F';
  document_number?: string;
  document_expiry?: string;
  issuing_authority?: string;
  issuing_country?: string;
  address?: string;
  mrz_data?: string;
  [key: string]: string | undefined;
}

export interface FaceMatchResult {
  match_score: number;
  is_match: boolean;
  confidence: number;
  method: 'local' | 'api';
}

export interface LivenessResult {
  is_live: boolean;
  confidence: number;
  checks_passed: string[];
  checks_failed: string[];
  method: 'passive' | 'active' | 'challenge';
}

export interface DocumentVerification {
  document_type: KycDocumentType;
  is_valid: boolean;
  confidence: number;
  extracted_data: ExtractedIdentity;
  ocr_confidence: number;
  forgery_checks: {
    check_name: string;
    passed: boolean;
    confidence: number;
    details?: string;
  }[];
  metadata_validation: {
    file_integrity: boolean;
    creation_date?: string;
    modification_date?: string;
    suspicious_edits: boolean;
  };
  template_match?: {
    country: Country;
    document_version: string;
    match_confidence: number;
  };
}

export interface AddressVerification {
  method: 'utility_bill' | 'bank_statement' | 'attestation' | 'geolocation';
  is_verified: boolean;
  confidence: number;
  extracted_address?: string;
  geo_match?: boolean;
  document_date?: string;
  consistency_check?: boolean;
}

export interface KycRiskScore {
  score: number; // 0-100 (100 = lowest risk)
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: {
    factor: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    weight: number;
  }[];
  fraud_indicators: {
    indicator: string;
    detected: boolean;
    confidence: number;
  }[];
  pep_screening?: {
    is_pep: boolean;
    match_confidence: number;
    details?: string;
  };
  sanctions_screening?: {
    is_sanctioned: boolean;
    match_confidence: number;
    list_name?: string;
  };
}

export interface KycResult {
  kyc_id: string;
  level: KycLevel;
  status: KycStatus;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Verifications
  identity_verification: DocumentVerification | null;
  face_verification: FaceMatchResult | null;
  liveness_verification: LivenessResult | null;
  address_verification: AddressVerification | null;
  
  // Consolidated identity
  verified_identity?: ExtractedIdentity;
  
  // Risk assessment
  risk_score: KycRiskScore;
  
  // Metadata
  processing_time_ms: number;
  documents_submitted: number;
  manual_review_required: boolean;
  reviewer_id?: string;
  review_notes?: string;
  rejection_reason?: string;
  
  // Audit
  audit_trail: AuditLog[];
}

// ============================================
// W-SCORE TYPES
// ============================================

export interface FinancialData {
  // Bank statement data
  bank_statements?: {
    bank_name: string;
    account_type: 'checking' | 'savings' | 'business';
    period_start: string;
    period_end: string;
    opening_balance: number;
    closing_balance: number;
    total_credits: number;
    total_debits: number;
    transaction_count: number;
    average_balance: number;
    min_balance: number;
    salary_detected: boolean;
    salary_amount?: number;
    regular_payments: { name: string; amount: number; frequency: string }[];
  }[];
  
  // Mobile money data
  momo_data?: {
    provider: 'orange' | 'mtn' | 'wave' | 'moov' | 'free' | 'other';
    period_days: number;
    total_in: number;
    total_out: number;
    transaction_count: number;
    avg_transaction_size: number;
    unique_contacts: number;
    regularity_score: number;
    cash_in_ratio: number;
    merchant_payment_count: number;
  }[];
  
  // Utility payments
  utility_payments?: {
    type: 'electricity' | 'water' | 'internet' | 'phone' | 'rent';
    provider: string;
    payments_on_time: number;
    payments_late: number;
    payments_missed: number;
    average_amount: number;
    history_months: number;
  }[];
  
  // Informal economy
  informal_income?: {
    source: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'irregular';
    estimated_monthly: number;
    evidence_type: 'receipt' | 'attestation' | 'declaration' | 'photo';
    confidence: number;
  }[];
}

export interface SocialCapitalData {
  // Tontine participation
  tontines?: {
    group_name: string;
    member_since: string;
    contribution_amount: number;
    frequency: 'weekly' | 'monthly';
    position_in_cycle?: number;
    total_members: number;
    payments_made: number;
    payments_missed: number;
    is_treasurer: boolean;
    attestation_provided: boolean;
  }[];
  
  // Cooperative membership
  cooperatives?: {
    name: string;
    type: 'agricultural' | 'artisan' | 'women' | 'savings' | 'other';
    member_since: string;
    role: 'member' | 'board' | 'president';
    share_capital: number;
    loan_history?: {
      amount: number;
      repaid: boolean;
      on_time: boolean;
    }[];
  }[];
  
  // Guarantors
  guarantors?: {
    relationship: 'family' | 'friend' | 'colleague' | 'community';
    occupation: string;
    verified: boolean;
    phone_verified: boolean;
    income_estimate?: number;
  }[];
  
  // Community standing
  community_attestations?: {
    from: 'chief' | 'imam' | 'pastor' | 'association' | 'employer';
    date: string;
    content_summary: string;
    verified: boolean;
  }[];
}

export interface PsychometricData {
  quiz_id: string;
  completed_at: string;
  duration_seconds: number;
  
  // Scores by dimension
  financial_literacy: number;
  risk_tolerance: number;
  planning_horizon: number;
  self_control: number;
  optimism_bias: number;
  
  // Behavioral signals
  response_consistency: number;
  hesitation_pattern: 'confident' | 'thoughtful' | 'erratic';
  attention_score: number;
  
  // Anti-gaming
  random_check_passed: boolean;
  time_anomalies: number;
  pattern_detected: string | null;
}

export interface EnvironmentalData {
  region: string;
  city: string;
  zone_type: 'urban' | 'peri_urban' | 'rural';
  
  // Economic indicators
  local_poverty_index?: number;
  infrastructure_score?: number;
  market_volatility?: number;
  
  // Seasonal factors
  agricultural_zone: boolean;
  current_season: 'planting' | 'growing' | 'harvest' | 'off_season' | 'na';
  seasonal_adjustment: number;
  
  // Regional risk
  regional_default_rate?: number;
  economic_activity_index?: number;
}

export interface ScoreSubComponents {
  identity_stability: {
    score: number;
    confidence: number;
    factors: { name: string; value: number; weight: number }[];
  };
  cashflow_consistency: {
    score: number;
    confidence: number;
    factors: { name: string; value: number; weight: number }[];
  };
  behavioral_psychometric: {
    score: number;
    confidence: number;
    factors: { name: string; value: number; weight: number }[];
  };
  financial_discipline: {
    score: number;
    confidence: number;
    factors: { name: string; value: number; weight: number }[];
  };
  social_capital: {
    score: number;
    confidence: number;
    factors: { name: string; value: number; weight: number }[];
  };
  environmental_adjustment: {
    score: number;
    confidence: number;
    factors: { name: string; value: number; weight: number }[];
  };
}

export interface CreditRecommendation {
  approved: boolean;
  max_amount: number;
  max_tenor_months: number;
  suggested_rate: number;
  rate_adjustment: number;
  conditions: string[];
  guarantees_required: string[];
  monitoring_level: 'standard' | 'enhanced' | 'intensive';
}

export interface ScoreExplainability {
  positive_factors: { factor: string; impact: number; description: string }[];
  negative_factors: { factor: string; impact: number; description: string }[];
  improvement_suggestions: { action: string; potential_gain: number; timeframe: string }[];
  data_quality_notes: string[];
  confidence_breakdown: { source: string; confidence: number; weight: number }[];
}

export interface FraudAnalysis {
  fraud_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  alerts: {
    id: string;
    type: string;
    severity: 'warning' | 'high' | 'critical';
    description: string;
    confidence: number;
  }[];
  cross_validation: {
    check: string;
    passed: boolean;
    details: string;
  }[];
  manipulation_detection: {
    indicator: string;
    detected: boolean;
    confidence: number;
  }[];
}

export interface WScoreResult {
  score_id: string;
  final_score: number;
  grade: string;
  risk_tier: string;
  confidence: number;
  data_quality: DataQuality;
  
  // Sub-scores
  sub_scores: ScoreSubComponents;
  
  // Credit recommendation
  credit_recommendation: CreditRecommendation;
  
  // Explainability
  explainability: ScoreExplainability;
  
  // Fraud analysis
  fraud_analysis: FraudAnalysis;
  
  // Metadata
  model_version: string;
  calculated_at: string;
  processing_time_ms: number;
  data_sources_used: string[];
  features_computed: number;
  
  // Certainty coefficients (v5.4)
  certainty_coefficients?: Record<string, number>;
  
  // NEW: Confidence Analysis (v5.5 - Sovereign Proof Layer)
  confidence_analysis?: {
    /** Global confidence index (0-100) */
    confidence_index: number;
    /** Breakdown by proof type */
    proof_breakdown: {
      hard_proof_percentage: number;
      soft_proof_percentage: number;
      declarative_percentage: number;
    };
    /** Certification level */
    certification_level: 'gold' | 'certified' | 'verified' | 'basic' | 'unverified';
    /** Summary for bankers */
    banker_summary: string;
    /** High trust flag */
    high_trust: boolean;
    /** Guarantor bonus info */
    guarantor_bonus: {
      applied: boolean;
      bonus_percentage: number;
      certified_guarantor_score?: number;
    };
  };
  
  // Compliance
  compliance: {
    consent_tracked: boolean;
    explainable: boolean;
    non_discriminatory: boolean;
    audit_logged: boolean;
  };
}

// ============================================
// WOUAKA CORE TYPES (COMBINED)
// ============================================

export interface WouakaCoreRequest {
  // Identification
  reference_id: string;
  
  // KYC data
  kyc_level: KycLevel;
  documents: {
    type: KycDocumentType;
    file_url: string;
    file_hash: string;
  }[];
  selfie_url?: string;
  
  // Declared info
  declared_info: {
    full_name: string;
    date_of_birth: string;
    phone_number: string;
    address?: string;
    occupation?: string;
    monthly_income?: number;
    employment_type?: 'formal' | 'informal' | 'self_employed' | 'unemployed';
  };
  
  // Financial data
  financial_data?: FinancialData;
  
  // Social capital
  social_capital?: SocialCapitalData;
  
  // Psychometric
  psychometric_data?: PsychometricData;
  
  // Environmental
  environmental_data?: EnvironmentalData;
  
  // Device
  device_info?: DeviceInfo;
  geolocation?: GeoLocation;
  
  // Consent
  consent: {
    data_processing: boolean;
    kyc_verification: boolean;
    credit_check: boolean;
    third_party_sharing: boolean;
    timestamp: string;
    ip_address: string;
  };
}

export interface WouakaCoreResult {
  request_id: string;
  reference_id: string;
  
  // Status
  status: 'completed' | 'pending_review' | 'rejected' | 'error';
  
  // KYC Result
  kyc: KycResult;
  
  // Score Result
  score: WScoreResult | null;
  
  // Combined risk
  combined_risk: {
    overall_risk: 'low' | 'medium' | 'high' | 'critical';
    kyc_risk_weight: number;
    credit_risk_weight: number;
    fraud_risk_weight: number;
    final_recommendation: 'approve' | 'review' | 'reject';
    conditions: string[];
  };
  
  // Timeline
  timeline: {
    event: string;
    timestamp: string;
    duration_ms?: number;
    status: 'completed' | 'failed' | 'skipped';
  }[];
  
  // Metadata
  created_at: string;
  completed_at?: string;
  processing_time_ms: number;
  version: string;
}

// ============================================
// API TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    request_id: string;
    processing_time_ms: number;
    timestamp: string;
  };
}

export interface WebhookPayload {
  event_type: string;
  event_id: string;
  timestamp: string;
  data: Record<string, unknown>;
  signature: string;
}
