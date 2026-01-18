-- =====================================================
-- WOUAKA DATABASE SCHEMA - PHASE 1
-- Tables: USER_IDENTITIES, USER_DEVICES, USER_ADDRESSES
-- =====================================================

-- USER_IDENTITIES: Identités extraites des documents
CREATE TABLE IF NOT EXISTS public.user_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  place_of_birth TEXT,
  nationality TEXT DEFAULT 'CI',
  gender TEXT CHECK (gender IN ('M', 'F')),
  document_type TEXT,
  document_number TEXT,
  document_expiry DATE,
  issuing_authority TEXT,
  issuing_country TEXT DEFAULT 'CI',
  mrz_data TEXT,
  ocr_confidence NUMERIC,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- USER_DEVICES: Signaux appareils
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'other')),
  os TEXT,
  os_version TEXT,
  browser TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  sim_age_months INTEGER,
  phone_age_months INTEGER,
  mobility_radius_km NUMERIC,
  location_stability NUMERIC,
  app_usage_hours NUMERIC,
  battery_health NUMERIC,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  is_primary BOOLEAN DEFAULT false,
  risk_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- USER_ADDRESSES: Historique adresses
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address_type TEXT CHECK (address_type IN ('home', 'work', 'business', 'other')),
  street_address TEXT,
  city TEXT,
  region TEXT,
  country TEXT DEFAULT 'CI',
  postal_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  verification_method TEXT,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  residence_since DATE,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- USER_SELFIE_LIVENESS: Vérifications selfie et vivacité
CREATE TABLE IF NOT EXISTS public.user_selfie_liveness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selfie_url TEXT,
  liveness_video_url TEXT,
  face_match_score NUMERIC,
  is_face_match BOOLEAN DEFAULT false,
  liveness_score NUMERIC,
  is_live BOOLEAN DEFAULT false,
  liveness_method TEXT CHECK (liveness_method IN ('passive', 'active', 'challenge')),
  checks_passed JSONB DEFAULT '[]',
  checks_failed JSONB DEFAULT '[]',
  device_id UUID REFERENCES public.user_devices(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABLES FINANCIÈRES
-- =====================================================

-- USER_BANK_STATEMENTS: Relevés bancaires
CREATE TABLE IF NOT EXISTS public.user_bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_type TEXT CHECK (account_type IN ('current', 'savings', 'business', 'other')),
  account_number_masked TEXT,
  period_start DATE,
  period_end DATE,
  opening_balance NUMERIC DEFAULT 0,
  closing_balance NUMERIC DEFAULT 0,
  total_credits NUMERIC DEFAULT 0,
  total_debits NUMERIC DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  average_balance NUMERIC,
  min_balance NUMERIC,
  max_balance NUMERIC,
  salary_detected BOOLEAN DEFAULT false,
  salary_amount NUMERIC,
  salary_regularity_score NUMERIC,
  regular_payments JSONB DEFAULT '[]',
  source_file_url TEXT,
  ocr_confidence NUMERIC,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- USER_MOMO_TRANSACTIONS: Transactions Mobile Money
CREATE TABLE IF NOT EXISTS public.user_momo_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT CHECK (provider IN ('orange', 'mtn', 'wave', 'moov', 'free', 'other')),
  phone_number TEXT,
  period_start DATE,
  period_end DATE,
  total_in NUMERIC DEFAULT 0,
  total_out NUMERIC DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  avg_transaction_size NUMERIC,
  unique_contacts INTEGER DEFAULT 0,
  regularity_score NUMERIC,
  cash_in_ratio NUMERIC,
  merchant_payment_count INTEGER DEFAULT 0,
  p2p_count INTEGER DEFAULT 0,
  bill_payment_count INTEGER DEFAULT 0,
  velocity_7d NUMERIC,
  velocity_30d NUMERIC,
  source_type TEXT CHECK (source_type IN ('screenshot', 'sms', 'pdf', 'api')),
  source_file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- USER_UTILITY_BILLS: Factures utilitaires
CREATE TABLE IF NOT EXISTS public.user_utility_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  utility_type TEXT CHECK (utility_type IN ('electricity', 'water', 'internet', 'phone', 'rent', 'gas', 'other')),
  provider TEXT,
  account_number TEXT,
  bill_date DATE,
  due_date DATE,
  amount NUMERIC,
  paid BOOLEAN DEFAULT false,
  paid_date DATE,
  days_late INTEGER DEFAULT 0,
  source_file_url TEXT,
  ocr_confidence NUMERIC,
  address_id UUID REFERENCES public.user_addresses(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- USER_INFORMAL_INCOME: Revenus informels
CREATE TABLE IF NOT EXISTS public.user_informal_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_type TEXT CHECK (income_type IN ('trade', 'agriculture', 'artisan', 'transport', 'services', 'rental', 'other')),
  description TEXT,
  estimated_monthly_amount NUMERIC,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'seasonal', 'irregular')),
  evidence_type TEXT CHECK (evidence_type IN ('receipts', 'photos', 'attestation', 'bank_deposits', 'momo', 'none')),
  evidence_urls JSONB DEFAULT '[]',
  verified BOOLEAN DEFAULT false,
  confidence_score NUMERIC,
  season_start_month INTEGER,
  season_end_month INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABLES CAPITAL SOCIAL
-- =====================================================

-- USER_TONTINE_MEMBERSHIPS: Participations tontines
CREATE TABLE IF NOT EXISTS public.user_tontine_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  group_size INTEGER,
  contribution_amount NUMERIC,
  frequency TEXT CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly')),
  position_in_cycle INTEGER,
  member_since DATE,
  payments_made INTEGER DEFAULT 0,
  payments_missed INTEGER DEFAULT 0,
  payments_late INTEGER DEFAULT 0,
  has_received BOOLEAN DEFAULT false,
  received_amount NUMERIC,
  received_date DATE,
  is_treasurer BOOLEAN DEFAULT false,
  is_organizer BOOLEAN DEFAULT false,
  attestation_provided BOOLEAN DEFAULT false,
  attestation_url TEXT,
  organizer_phone TEXT,
  discipline_score NUMERIC,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- USER_COOPERATIVE_MEMBERSHIPS: Adhésions coopératives
CREATE TABLE IF NOT EXISTS public.user_cooperative_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cooperative_name TEXT NOT NULL,
  cooperative_type TEXT CHECK (cooperative_type IN ('agricultural', 'artisan', 'women', 'savings', 'trading', 'transport', 'other')),
  registration_number TEXT,
  member_since DATE,
  role TEXT CHECK (role IN ('member', 'board', 'president', 'treasurer', 'secretary')),
  share_capital NUMERIC DEFAULT 0,
  loans_taken INTEGER DEFAULT 0,
  loans_repaid_on_time INTEGER DEFAULT 0,
  loans_defaulted INTEGER DEFAULT 0,
  current_loan_amount NUMERIC,
  current_loan_balance NUMERIC,
  standing_score NUMERIC,
  attestation_url TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- USER_GUARANTORS: Garants
CREATE TABLE IF NOT EXISTS public.user_guarantors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guarantor_name TEXT NOT NULL,
  relationship TEXT CHECK (relationship IN ('family', 'friend', 'colleague', 'community', 'employer', 'other')),
  phone_number TEXT,
  email TEXT,
  occupation TEXT,
  employer TEXT,
  estimated_income NUMERIC,
  address TEXT,
  national_id TEXT,
  phone_verified BOOLEAN DEFAULT false,
  identity_verified BOOLEAN DEFAULT false,
  consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ,
  quality_score NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- USER_COMMUNITY_ATTESTATIONS: Attestations communautaires
CREATE TABLE IF NOT EXISTS public.user_community_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attestation_type TEXT CHECK (attestation_type IN ('chief', 'imam', 'pastor', 'association', 'employer', 'cooperative', 'neighbor', 'other')),
  issuer_name TEXT NOT NULL,
  issuer_title TEXT,
  issuer_phone TEXT,
  issuer_address TEXT,
  attestation_date DATE,
  content_summary TEXT,
  file_url TEXT,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  trust_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- USER_SOCIAL_LINKS: Liens sociaux (contacts, réseaux)
CREATE TABLE IF NOT EXISTS public.user_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_type TEXT CHECK (link_type IN ('phone_contact', 'momo_contact', 'whatsapp', 'facebook', 'linkedin', 'other')),
  contact_count INTEGER DEFAULT 0,
  active_contacts_30d INTEGER DEFAULT 0,
  account_age_months INTEGER,
  network_quality_score NUMERIC,
  verified BOOLEAN DEFAULT false,
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABLES SCORING
-- =====================================================

-- USER_PSYCHOMETRIC_RESULTS: Résultats tests psychométriques
CREATE TABLE IF NOT EXISTS public.user_psychometric_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_version TEXT DEFAULT 'v1.0',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  questions_count INTEGER,
  financial_literacy NUMERIC,
  risk_tolerance NUMERIC,
  planning_horizon NUMERIC,
  self_control NUMERIC,
  optimism_bias NUMERIC,
  response_consistency NUMERIC,
  hesitation_pattern TEXT CHECK (hesitation_pattern IN ('confident', 'thoughtful', 'erratic')),
  attention_score NUMERIC,
  random_check_passed BOOLEAN,
  time_anomalies INTEGER DEFAULT 0,
  pattern_detected TEXT,
  composite_score NUMERIC,
  is_valid BOOLEAN DEFAULT true,
  invalidation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- USER_BEHAVIOR_METRICS: Métriques comportementales
CREATE TABLE IF NOT EXISTS public.user_behavior_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE,
  period_end DATE,
  login_count INTEGER DEFAULT 0,
  session_avg_duration_minutes NUMERIC,
  form_completion_rate NUMERIC,
  document_upload_speed_score NUMERIC,
  navigation_coherence NUMERIC,
  time_to_complete_kyc_hours NUMERIC,
  errors_made INTEGER DEFAULT 0,
  corrections_made INTEGER DEFAULT 0,
  help_accessed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SCORE_RAW_FEATURES: Features brutes calculées
CREATE TABLE IF NOT EXISTS public.score_raw_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scoring_request_id UUID REFERENCES public.scoring_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  feature_id TEXT NOT NULL,
  feature_name TEXT,
  category TEXT CHECK (category IN ('identity', 'financial', 'social', 'behavioral', 'environmental', 'psychometric')),
  raw_value NUMERIC,
  string_value TEXT,
  source TEXT,
  source_table TEXT,
  source_id UUID,
  confidence NUMERIC,
  is_missing BOOLEAN DEFAULT false,
  imputation_method TEXT,
  calculated_at TIMESTAMPTZ DEFAULT now()
);

-- SCORE_ENGINEERED_FEATURES: Features transformées
CREATE TABLE IF NOT EXISTS public.score_engineered_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scoring_request_id UUID REFERENCES public.scoring_requests(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL,
  raw_feature_ids UUID[] DEFAULT '{}',
  transformation TEXT,
  normalized_value NUMERIC,
  contribution_to_score NUMERIC,
  weight_applied NUMERIC,
  sub_score_category TEXT,
  calculated_at TIMESTAMPTZ DEFAULT now()
);

-- SCORE_HISTORY: Historique évolution scores
CREATE TABLE IF NOT EXISTS public.score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scoring_request_id UUID REFERENCES public.scoring_requests(id),
  score_value INTEGER,
  grade TEXT,
  risk_tier TEXT,
  sub_scores JSONB,
  data_quality TEXT CHECK (data_quality IN ('excellent', 'good', 'fair', 'poor', 'minimal')),
  data_sources_count INTEGER DEFAULT 0,
  trigger_event TEXT,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- USER_ECONOMIC_CONTEXT: Contexte économique utilisateur
CREATE TABLE IF NOT EXISTS public.user_economic_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  region TEXT,
  city TEXT,
  zone_type TEXT CHECK (zone_type IN ('urban', 'peri-urban', 'rural')),
  local_poverty_index NUMERIC,
  local_unemployment_rate NUMERIC,
  inflation_rate NUMERIC,
  agricultural_zone BOOLEAN DEFAULT false,
  main_economic_activity TEXT,
  seasonal_factors JSONB DEFAULT '{}',
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABLES FRAUDE
-- =====================================================

-- DOCUMENT_FRAUD_ANALYSIS: Analyse fraude documents
CREATE TABLE IF NOT EXISTS public.document_fraud_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.kyc_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  check_type TEXT NOT NULL,
  check_name TEXT,
  passed BOOLEAN,
  confidence NUMERIC,
  details TEXT,
  metadata_validation JSONB,
  template_match_score NUMERIC,
  forgery_indicators JSONB DEFAULT '[]',
  manipulation_detected BOOLEAN DEFAULT false,
  fraud_probability NUMERIC,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DEVICE_FRAUD_ANALYSIS: Analyse fraude appareil
CREATE TABLE IF NOT EXISTS public.device_fraud_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.user_devices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  analysis_type TEXT NOT NULL,
  is_emulator BOOLEAN DEFAULT false,
  is_rooted BOOLEAN DEFAULT false,
  vpn_detected BOOLEAN DEFAULT false,
  proxy_detected BOOLEAN DEFAULT false,
  location_spoofing BOOLEAN DEFAULT false,
  timezone_mismatch BOOLEAN DEFAULT false,
  multiple_accounts_detected BOOLEAN DEFAULT false,
  accounts_on_device INTEGER DEFAULT 1,
  risk_indicators JSONB DEFAULT '[]',
  device_reputation_score NUMERIC,
  fraud_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- BEHAVIOR_ANOMALIES: Anomalies comportementales
CREATE TABLE IF NOT EXISTS public.behavior_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  baseline_value NUMERIC,
  observed_value NUMERIC,
  deviation_percentage NUMERIC,
  detection_method TEXT,
  detection_context TEXT,
  false_positive_probability NUMERIC,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- IDENTITY_FRAUD_RISK: Risque fraude identité
CREATE TABLE IF NOT EXISTS public.identity_fraud_risk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_id UUID REFERENCES public.user_identities(id),
  risk_type TEXT NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  indicators JSONB DEFAULT '[]',
  cross_reference_hits INTEGER DEFAULT 0,
  duplicate_identity_suspected BOOLEAN DEFAULT false,
  synthetic_identity_probability NUMERIC,
  overall_risk_score NUMERIC,
  investigation_status TEXT CHECK (investigation_status IN ('pending', 'investigating', 'cleared', 'confirmed_fraud')),
  investigated_by UUID,
  investigated_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABLES ADMINISTRATION B2B
-- =====================================================

-- INSTITUTIONS: Institutions partenaires
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  institution_type TEXT CHECK (institution_type IN ('bank', 'mfi', 'cooperative', 'fintech', 'enterprise', 'ngo', 'government', 'other')),
  country TEXT DEFAULT 'CI',
  registration_number TEXT,
  tax_id TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  logo_url TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  api_access_enabled BOOLEAN DEFAULT false,
  webhook_url TEXT,
  webhook_secret TEXT,
  settings JSONB DEFAULT '{}',
  billing_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- INSTITUTION_USERS: Lien utilisateurs-institutions
CREATE TABLE IF NOT EXISTS public.institution_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'analyst', 'operator', 'viewer')),
  permissions JSONB DEFAULT '[]',
  is_primary_contact BOOLEAN DEFAULT false,
  invited_by UUID,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(institution_id, user_id)
);

-- CONSENT_LOGS: Logs consentements RGPD/BCEAO
CREATE TABLE IF NOT EXISTS public.consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  consent_version TEXT DEFAULT 'v1.0',
  consent_given BOOLEAN NOT NULL,
  consent_text TEXT,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  location_data JSONB,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TRIGGERS UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT unnest(ARRAY[
      'user_identities', 'user_devices', 'user_addresses',
      'institutions'
    ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%s;
      CREATE TRIGGER update_%s_updated_at
      BEFORE UPDATE ON public.%s
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END $$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_selfie_liveness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_momo_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_utility_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_informal_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tontine_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cooperative_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_community_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_psychometric_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_raw_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_engineered_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_economic_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_fraud_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fraud_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_fraud_risk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- Policies for user-owned tables (users can see their own data)
CREATE POLICY "Users can view their own identities" ON public.user_identities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own identities" ON public.user_identities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own identities" ON public.user_identities FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own devices" ON public.user_devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own devices" ON public.user_devices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own devices" ON public.user_devices FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own addresses" ON public.user_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addresses" ON public.user_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own addresses" ON public.user_addresses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own selfie_liveness" ON public.user_selfie_liveness FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own selfie_liveness" ON public.user_selfie_liveness FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own bank_statements" ON public.user_bank_statements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bank_statements" ON public.user_bank_statements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own momo_transactions" ON public.user_momo_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own momo_transactions" ON public.user_momo_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own utility_bills" ON public.user_utility_bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own utility_bills" ON public.user_utility_bills FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own informal_income" ON public.user_informal_income FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own informal_income" ON public.user_informal_income FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own informal_income" ON public.user_informal_income FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own tontine_memberships" ON public.user_tontine_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tontine_memberships" ON public.user_tontine_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tontine_memberships" ON public.user_tontine_memberships FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own cooperative_memberships" ON public.user_cooperative_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cooperative_memberships" ON public.user_cooperative_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cooperative_memberships" ON public.user_cooperative_memberships FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own guarantors" ON public.user_guarantors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own guarantors" ON public.user_guarantors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own guarantors" ON public.user_guarantors FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own attestations" ON public.user_community_attestations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attestations" ON public.user_community_attestations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own social_links" ON public.user_social_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own social_links" ON public.user_social_links FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own psychometric_results" ON public.user_psychometric_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own psychometric_results" ON public.user_psychometric_results FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own behavior_metrics" ON public.user_behavior_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own behavior_metrics" ON public.user_behavior_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own score_raw_features" ON public.score_raw_features FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own score_engineered_features" ON public.score_engineered_features FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.scoring_requests sr WHERE sr.id = scoring_request_id AND sr.user_id = auth.uid()));

CREATE POLICY "Users can view their own score_history" ON public.score_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own economic_context" ON public.user_economic_context FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own economic_context" ON public.user_economic_context FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fraud tables: users can only view, not modify
CREATE POLICY "Users can view their document_fraud_analysis" ON public.document_fraud_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their device_fraud_analysis" ON public.device_fraud_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their behavior_anomalies" ON public.behavior_anomalies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their identity_fraud_risk" ON public.identity_fraud_risk FOR SELECT USING (auth.uid() = user_id);

-- Consent logs: users can view and insert their own
CREATE POLICY "Users can view their own consent_logs" ON public.consent_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own consent_logs" ON public.consent_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Institutions: public read for verified institutions
CREATE POLICY "Anyone can view verified institutions" ON public.institutions FOR SELECT USING (is_active = true AND is_verified = true);

-- Institution users: members can see their institution
CREATE POLICY "Institution members can view their institution" ON public.institution_users FOR SELECT USING (auth.uid() = user_id);

-- Admin policies (SUPER_ADMIN can do everything)
CREATE POLICY "Admins can manage all user_identities" ON public.user_identities FOR ALL USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Admins can manage all user_devices" ON public.user_devices FOR ALL USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Admins can manage all institutions" ON public.institutions FOR ALL USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Admins can manage all institution_users" ON public.institution_users FOR ALL USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Admins can manage all fraud_analysis" ON public.document_fraud_analysis FOR ALL USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Admins can manage all device_fraud" ON public.device_fraud_analysis FOR ALL USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Admins can manage all anomalies" ON public.behavior_anomalies FOR ALL USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Admins can manage all identity_risk" ON public.identity_fraud_risk FOR ALL USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_identities_user_id ON public.user_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON public.user_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bank_statements_user_id ON public.user_bank_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_momo_transactions_user_id ON public.user_momo_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_utility_bills_user_id ON public.user_utility_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tontine_memberships_user_id ON public.user_tontine_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cooperative_memberships_user_id ON public.user_cooperative_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_guarantors_user_id ON public.user_guarantors(user_id);
CREATE INDEX IF NOT EXISTS idx_score_raw_features_scoring_request_id ON public.score_raw_features(scoring_request_id);
CREATE INDEX IF NOT EXISTS idx_score_raw_features_user_id ON public.score_raw_features(user_id);
CREATE INDEX IF NOT EXISTS idx_score_history_user_id ON public.score_history(user_id);
CREATE INDEX IF NOT EXISTS idx_score_history_created_at ON public.score_history(created_at);
CREATE INDEX IF NOT EXISTS idx_document_fraud_analysis_document_id ON public.document_fraud_analysis(document_id);
CREATE INDEX IF NOT EXISTS idx_device_fraud_analysis_device_id ON public.device_fraud_analysis(device_id);
CREATE INDEX IF NOT EXISTS idx_behavior_anomalies_user_id ON public.behavior_anomalies(user_id);
CREATE INDEX IF NOT EXISTS idx_institution_users_institution_id ON public.institution_users(institution_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON public.consent_logs(user_id);