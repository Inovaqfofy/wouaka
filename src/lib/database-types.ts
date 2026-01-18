/**
 * Database Types for Wouaka Platform
 * TypeScript types corresponding to the new structured tables
 */

// ============================================
// USER IDENTITY & VERIFICATION
// ============================================

export interface UserIdentity {
  id: string;
  user_id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  place_of_birth: string | null;
  nationality: string;
  gender: 'M' | 'F' | null;
  document_type: string | null;
  document_number: string | null;
  document_expiry: string | null;
  issuing_authority: string | null;
  issuing_country: string;
  mrz_data: string | null;
  ocr_confidence: number | null;
  verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_id: string | null;
  device_type: 'mobile' | 'tablet' | 'desktop' | 'other' | null;
  os: string | null;
  os_version: string | null;
  browser: string | null;
  screen_resolution: string | null;
  timezone: string | null;
  language: string | null;
  sim_age_months: number | null;
  phone_age_months: number | null;
  mobility_radius_km: number | null;
  location_stability: number | null;
  app_usage_hours: number | null;
  battery_health: number | null;
  first_seen_at: string;
  last_seen_at: string;
  is_primary: boolean;
  risk_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  address_type: 'home' | 'work' | 'business' | 'other' | null;
  street_address: string | null;
  city: string | null;
  region: string | null;
  country: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  verification_method: string | null;
  verified: boolean;
  verified_at: string | null;
  residence_since: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSelfieLiveness {
  id: string;
  user_id: string;
  selfie_url: string | null;
  liveness_video_url: string | null;
  face_match_score: number | null;
  is_face_match: boolean;
  liveness_score: number | null;
  is_live: boolean;
  liveness_method: 'passive' | 'active' | 'challenge' | null;
  checks_passed: string[];
  checks_failed: string[];
  device_id: string | null;
  created_at: string;
}

// ============================================
// FINANCIAL DATA
// ============================================

export interface UserBankStatement {
  id: string;
  user_id: string;
  bank_name: string;
  account_type: 'current' | 'savings' | 'business' | 'other' | null;
  account_number_masked: string | null;
  period_start: string | null;
  period_end: string | null;
  opening_balance: number;
  closing_balance: number;
  total_credits: number;
  total_debits: number;
  transaction_count: number;
  average_balance: number | null;
  min_balance: number | null;
  max_balance: number | null;
  salary_detected: boolean;
  salary_amount: number | null;
  salary_regularity_score: number | null;
  regular_payments: Array<{ name: string; amount: number; frequency: string }>;
  source_file_url: string | null;
  ocr_confidence: number | null;
  verified: boolean;
  created_at: string;
}

export type MomoProvider = 'orange' | 'mtn' | 'wave' | 'moov' | 'free' | 'other';
export type MomoSourceType = 'screenshot' | 'sms' | 'pdf' | 'api';

export interface UserMomoTransaction {
  id: string;
  user_id: string;
  provider: MomoProvider | null;
  phone_number: string | null;
  period_start: string | null;
  period_end: string | null;
  total_in: number;
  total_out: number;
  transaction_count: number;
  avg_transaction_size: number | null;
  unique_contacts: number;
  regularity_score: number | null;
  cash_in_ratio: number | null;
  merchant_payment_count: number;
  p2p_count: number;
  bill_payment_count: number;
  velocity_7d: number | null;
  velocity_30d: number | null;
  source_type: MomoSourceType | null;
  source_file_url: string | null;
  created_at: string;
}

export type UtilityType = 'electricity' | 'water' | 'internet' | 'phone' | 'rent' | 'gas' | 'other';

export interface UserUtilityBill {
  id: string;
  user_id: string;
  utility_type: UtilityType | null;
  provider: string | null;
  account_number: string | null;
  bill_date: string | null;
  due_date: string | null;
  amount: number | null;
  paid: boolean;
  paid_date: string | null;
  days_late: number;
  source_file_url: string | null;
  ocr_confidence: number | null;
  address_id: string | null;
  created_at: string;
}

export type InformalIncomeType = 'trade' | 'agriculture' | 'artisan' | 'transport' | 'services' | 'rental' | 'other';
export type IncomeFrequency = 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'irregular';
export type EvidenceType = 'receipts' | 'photos' | 'attestation' | 'bank_deposits' | 'momo' | 'none';

export interface UserInformalIncome {
  id: string;
  user_id: string;
  income_type: InformalIncomeType | null;
  description: string | null;
  estimated_monthly_amount: number | null;
  frequency: IncomeFrequency | null;
  evidence_type: EvidenceType | null;
  evidence_urls: string[];
  verified: boolean;
  confidence_score: number | null;
  season_start_month: number | null;
  season_end_month: number | null;
  created_at: string;
}

// ============================================
// SOCIAL CAPITAL
// ============================================

export type TontineFrequency = 'weekly' | 'bi-weekly' | 'monthly';

export interface UserTontineMembership {
  id: string;
  user_id: string;
  group_name: string;
  group_size: number | null;
  contribution_amount: number | null;
  frequency: TontineFrequency | null;
  position_in_cycle: number | null;
  member_since: string | null;
  payments_made: number;
  payments_missed: number;
  payments_late: number;
  has_received: boolean;
  received_amount: number | null;
  received_date: string | null;
  is_treasurer: boolean;
  is_organizer: boolean;
  attestation_provided: boolean;
  attestation_url: string | null;
  organizer_phone: string | null;
  discipline_score: number | null;
  verified: boolean;
  created_at: string;
}

export type CooperativeType = 'agricultural' | 'artisan' | 'women' | 'savings' | 'trading' | 'transport' | 'other';
export type CooperativeRole = 'member' | 'board' | 'president' | 'treasurer' | 'secretary';

export interface UserCooperativeMembership {
  id: string;
  user_id: string;
  cooperative_name: string;
  cooperative_type: CooperativeType | null;
  registration_number: string | null;
  member_since: string | null;
  role: CooperativeRole | null;
  share_capital: number;
  loans_taken: number;
  loans_repaid_on_time: number;
  loans_defaulted: number;
  current_loan_amount: number | null;
  current_loan_balance: number | null;
  standing_score: number | null;
  attestation_url: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  verified: boolean;
  created_at: string;
}

export type GuarantorRelationship = 'family' | 'friend' | 'colleague' | 'community' | 'employer' | 'other';

export interface UserGuarantor {
  id: string;
  user_id: string;
  guarantor_name: string;
  relationship: GuarantorRelationship | null;
  phone_number: string | null;
  email: string | null;
  occupation: string | null;
  employer: string | null;
  estimated_income: number | null;
  address: string | null;
  national_id: string | null;
  phone_verified: boolean;
  identity_verified: boolean;
  consent_given: boolean;
  consent_date: string | null;
  quality_score: number | null;
  notes: string | null;
  created_at: string;
}

export type AttestationType = 'chief' | 'imam' | 'pastor' | 'association' | 'employer' | 'cooperative' | 'neighbor' | 'other';

export interface UserCommunityAttestation {
  id: string;
  user_id: string;
  attestation_type: AttestationType | null;
  issuer_name: string;
  issuer_title: string | null;
  issuer_phone: string | null;
  issuer_address: string | null;
  attestation_date: string | null;
  content_summary: string | null;
  file_url: string | null;
  verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  trust_score: number | null;
  created_at: string;
}

export type SocialLinkType = 'phone_contact' | 'momo_contact' | 'whatsapp' | 'facebook' | 'linkedin' | 'other';

export interface UserSocialLink {
  id: string;
  user_id: string;
  link_type: SocialLinkType | null;
  contact_count: number;
  active_contacts_30d: number;
  account_age_months: number | null;
  network_quality_score: number | null;
  verified: boolean;
  last_analyzed_at: string | null;
  created_at: string;
}

// ============================================
// SCORING
// ============================================

export type HesitationPattern = 'confident' | 'thoughtful' | 'erratic';

export interface UserPsychometricResult {
  id: string;
  user_id: string;
  quiz_version: string;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  questions_count: number | null;
  financial_literacy: number | null;
  risk_tolerance: number | null;
  planning_horizon: number | null;
  self_control: number | null;
  optimism_bias: number | null;
  response_consistency: number | null;
  hesitation_pattern: HesitationPattern | null;
  attention_score: number | null;
  random_check_passed: boolean | null;
  time_anomalies: number;
  pattern_detected: string | null;
  composite_score: number | null;
  is_valid: boolean;
  invalidation_reason: string | null;
  created_at: string;
}

export interface UserBehaviorMetric {
  id: string;
  user_id: string;
  period_start: string | null;
  period_end: string | null;
  login_count: number;
  session_avg_duration_minutes: number | null;
  form_completion_rate: number | null;
  document_upload_speed_score: number | null;
  navigation_coherence: number | null;
  time_to_complete_kyc_hours: number | null;
  errors_made: number;
  corrections_made: number;
  help_accessed: number;
  created_at: string;
}

export type FeatureCategory = 'identity' | 'financial' | 'social' | 'behavioral' | 'environmental' | 'psychometric';

export interface ScoreRawFeature {
  id: string;
  scoring_request_id: string | null;
  user_id: string | null;
  feature_id: string;
  feature_name: string | null;
  category: FeatureCategory | null;
  raw_value: number | null;
  string_value: string | null;
  source: string | null;
  source_table: string | null;
  source_id: string | null;
  confidence: number | null;
  is_missing: boolean;
  imputation_method: string | null;
  calculated_at: string;
}

export interface ScoreEngineeredFeature {
  id: string;
  scoring_request_id: string | null;
  feature_id: string;
  raw_feature_ids: string[];
  transformation: string | null;
  normalized_value: number | null;
  contribution_to_score: number | null;
  weight_applied: number | null;
  sub_score_category: string | null;
  calculated_at: string;
}

export type DataQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'minimal';

export interface ScoreHistory {
  id: string;
  user_id: string;
  scoring_request_id: string | null;
  score_value: number | null;
  grade: string | null;
  risk_tier: string | null;
  sub_scores: Record<string, { score: number; confidence: number }> | null;
  data_quality: DataQuality | null;
  data_sources_count: number;
  trigger_event: string | null;
  model_version: string | null;
  created_at: string;
}

export type ZoneType = 'urban' | 'peri-urban' | 'rural';

export interface UserEconomicContext {
  id: string;
  user_id: string;
  region: string | null;
  city: string | null;
  zone_type: ZoneType | null;
  local_poverty_index: number | null;
  local_unemployment_rate: number | null;
  inflation_rate: number | null;
  agricultural_zone: boolean;
  main_economic_activity: string | null;
  seasonal_factors: Record<string, number>;
  last_updated_at: string;
  created_at: string;
}

// ============================================
// FRAUD ANALYSIS
// ============================================

export interface DocumentFraudAnalysis {
  id: string;
  document_id: string | null;
  user_id: string | null;
  check_type: string;
  check_name: string | null;
  passed: boolean | null;
  confidence: number | null;
  details: string | null;
  metadata_validation: Record<string, unknown> | null;
  template_match_score: number | null;
  forgery_indicators: Array<{ type: string; confidence: number; details: string }>;
  manipulation_detected: boolean;
  fraud_probability: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface DeviceFraudAnalysis {
  id: string;
  device_id: string | null;
  user_id: string | null;
  analysis_type: string;
  is_emulator: boolean;
  is_rooted: boolean;
  vpn_detected: boolean;
  proxy_detected: boolean;
  location_spoofing: boolean;
  timezone_mismatch: boolean;
  multiple_accounts_detected: boolean;
  accounts_on_device: number;
  risk_indicators: Array<{ type: string; severity: string; details: string }>;
  device_reputation_score: number | null;
  fraud_score: number | null;
  created_at: string;
}

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BehaviorAnomaly {
  id: string;
  user_id: string;
  anomaly_type: string;
  severity: AnomalySeverity | null;
  description: string | null;
  baseline_value: number | null;
  observed_value: number | null;
  deviation_percentage: number | null;
  detection_method: string | null;
  detection_context: string | null;
  false_positive_probability: number | null;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolution: string | null;
  created_at: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type InvestigationStatus = 'pending' | 'investigating' | 'cleared' | 'confirmed_fraud';

export interface IdentityFraudRisk {
  id: string;
  user_id: string;
  identity_id: string | null;
  risk_type: string;
  risk_level: RiskLevel | null;
  indicators: Array<{ type: string; weight: number; details: string }>;
  cross_reference_hits: number;
  duplicate_identity_suspected: boolean;
  synthetic_identity_probability: number | null;
  overall_risk_score: number | null;
  investigation_status: InvestigationStatus | null;
  investigated_by: string | null;
  investigated_at: string | null;
  notes: string | null;
  created_at: string;
}

// ============================================
// B2B & INSTITUTIONS
// ============================================

export type InstitutionType = 'bank' | 'mfi' | 'cooperative' | 'fintech' | 'enterprise' | 'ngo' | 'government' | 'other';

export interface Institution {
  id: string;
  name: string;
  legal_name: string | null;
  institution_type: InstitutionType | null;
  country: string;
  registration_number: string | null;
  tax_id: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  city: string | null;
  logo_url: string | null;
  website: string | null;
  is_active: boolean;
  is_verified: boolean;
  verified_at: string | null;
  api_access_enabled: boolean;
  webhook_url: string | null;
  webhook_secret: string | null;
  settings: Record<string, unknown>;
  billing_email: string | null;
  created_at: string;
  updated_at: string;
}

export type InstitutionUserRole = 'admin' | 'analyst' | 'operator' | 'viewer';

export interface InstitutionUser {
  id: string;
  institution_id: string;
  user_id: string;
  role: InstitutionUserRole | null;
  permissions: string[];
  is_primary_contact: boolean;
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ConsentLog {
  id: string;
  user_id: string;
  consent_type: string;
  consent_version: string;
  consent_given: boolean;
  consent_text: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_fingerprint: string | null;
  location_data: { latitude?: number; longitude?: number; city?: string } | null;
  expires_at: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  created_at: string;
}

// ============================================
// AGGREGATED USER DATA (for scoring)
// ============================================

export interface AggregatedUserData {
  identity: UserIdentity | null;
  devices: UserDevice[];
  addresses: UserAddress[];
  selfie_liveness: UserSelfieLiveness | null;
  bank_statements: UserBankStatement[];
  momo_transactions: UserMomoTransaction[];
  utility_bills: UserUtilityBill[];
  informal_income: UserInformalIncome[];
  tontines: UserTontineMembership[];
  cooperatives: UserCooperativeMembership[];
  guarantors: UserGuarantor[];
  attestations: UserCommunityAttestation[];
  social_links: UserSocialLink[];
  psychometric: UserPsychometricResult | null;
  behavior_metrics: UserBehaviorMetric[];
  economic_context: UserEconomicContext | null;
}

// ============================================
// INSERT TYPES (for creating new records)
// ============================================

export type UserIdentityInsert = Omit<UserIdentity, 'id' | 'created_at' | 'updated_at'>;
export type UserDeviceInsert = Omit<UserDevice, 'id' | 'created_at' | 'updated_at' | 'first_seen_at' | 'last_seen_at'>;
export type UserAddressInsert = Omit<UserAddress, 'id' | 'created_at' | 'updated_at'>;
export type UserMomoTransactionInsert = Omit<UserMomoTransaction, 'id' | 'created_at'>;
export type UserTontineMembershipInsert = Omit<UserTontineMembership, 'id' | 'created_at'>;
export type ScoreRawFeatureInsert = Omit<ScoreRawFeature, 'id' | 'calculated_at'>;
export type ScoreHistoryInsert = Omit<ScoreHistory, 'id' | 'created_at'>;
export type ConsentLogInsert = Omit<ConsentLog, 'id' | 'created_at'>;
