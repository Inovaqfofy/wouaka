-- ============================================
-- WOUAKA DATABASE INSTALLATION SCRIPT
-- Version: 1.0.0
-- Date: 2026-01-11
-- Compatible avec Supabase Self-Hosted
-- ============================================
-- 
-- IMPORTANT: FAITES UNE SAUVEGARDE AVANT EXECUTION
-- Ce script ECRASERA toutes les tables existantes!
--
-- Instructions:
-- 1. Connectez-vous à votre base Supabase via SQL Editor
-- 2. Exécutez ce script en entier
-- 3. Configurez les secrets dans Vault (API keys, etc.)
-- 4. Déployez les edge functions séparément
--
-- ============================================

-- ============================================
-- SECTION 1: NETTOYAGE COMPLET
-- ============================================

-- Désactiver les triggers temporairement
SET session_replication_role = replica;

-- Supprimer toutes les politiques RLS existantes sur le schéma public
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Supprimer les tables dans l'ordre des dépendances (FK)
DROP TABLE IF EXISTS public.webhook_deliveries CASCADE;
DROP TABLE IF EXISTS public.webhooks CASCADE;
DROP TABLE IF EXISTS public.monitoring_alerts CASCADE;
DROP TABLE IF EXISTS public.profile_monitoring CASCADE;
DROP TABLE IF EXISTS public.loan_applications CASCADE;
DROP TABLE IF EXISTS public.marketplace_products CASCADE;
DROP TABLE IF EXISTS public.document_submission_tokens CASCADE;
DROP TABLE IF EXISTS public.kyc_requests CASCADE;
DROP TABLE IF EXISTS public.kyc_documents CASCADE;
DROP TABLE IF EXISTS public.kyc_validations CASCADE;
DROP TABLE IF EXISTS public.precheck_requests CASCADE;
DROP TABLE IF EXISTS public.fraud_detections CASCADE;
DROP TABLE IF EXISTS public.identity_fraud_risk CASCADE;
DROP TABLE IF EXISTS public.document_fraud_analysis CASCADE;
DROP TABLE IF EXISTS public.device_fraud_analysis CASCADE;
DROP TABLE IF EXISTS public.behavior_anomalies CASCADE;
DROP TABLE IF EXISTS public.score_engineered_features CASCADE;
DROP TABLE IF EXISTS public.score_raw_features CASCADE;
DROP TABLE IF EXISTS public.score_history CASCADE;
DROP TABLE IF EXISTS public.scoring_requests CASCADE;
DROP TABLE IF EXISTS public.data_enrichments CASCADE;
DROP TABLE IF EXISTS public.data_consents CASCADE;
DROP TABLE IF EXISTS public.data_source_credentials CASCADE;
DROP TABLE IF EXISTS public.premium_verifications CASCADE;
DROP TABLE IF EXISTS public.phone_verifications CASCADE;
DROP TABLE IF EXISTS public.otp_verifications CASCADE;
DROP TABLE IF EXISTS public.dataset_rows CASCADE;
DROP TABLE IF EXISTS public.datasets CASCADE;
DROP TABLE IF EXISTS public.api_calls CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.borrower_shared_results CASCADE;
DROP TABLE IF EXISTS public.borrower_credits CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.payment_transactions CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.partner_billing CASCADE;
DROP TABLE IF EXISTS public.customer_profiles CASCADE;
DROP TABLE IF EXISTS public.institution_users CASCADE;
DROP TABLE IF EXISTS public.institutions CASCADE;
DROP TABLE IF EXISTS public.user_economic_context CASCADE;
DROP TABLE IF EXISTS public.user_psychometric_results CASCADE;
DROP TABLE IF EXISTS public.user_behavior_metrics CASCADE;
DROP TABLE IF EXISTS public.user_social_links CASCADE;
DROP TABLE IF EXISTS public.user_community_attestations CASCADE;
DROP TABLE IF EXISTS public.user_guarantors CASCADE;
DROP TABLE IF EXISTS public.user_cooperative_memberships CASCADE;
DROP TABLE IF EXISTS public.user_tontine_memberships CASCADE;
DROP TABLE IF EXISTS public.user_informal_income CASCADE;
DROP TABLE IF EXISTS public.user_utility_bills CASCADE;
DROP TABLE IF EXISTS public.user_momo_transactions CASCADE;
DROP TABLE IF EXISTS public.user_bank_statements CASCADE;
DROP TABLE IF EXISTS public.user_selfie_liveness CASCADE;
DROP TABLE IF EXISTS public.user_addresses CASCADE;
DROP TABLE IF EXISTS public.user_devices CASCADE;
DROP TABLE IF EXISTS public.user_identities CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.consent_logs CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_partner(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_borrower(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.generate_invoice_number() CASCADE;
DROP FUNCTION IF EXISTS public.consume_borrower_credit(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.check_borrower_credits(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_otps() CASCADE;
DROP FUNCTION IF EXISTS public.update_loan_applications_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_borrower_credits_updated_at() CASCADE;

-- Supprimer le type enum
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Supprimer la séquence
DROP SEQUENCE IF EXISTS public.invoice_number_seq CASCADE;

-- Réactiver les triggers
SET session_replication_role = DEFAULT;

-- ============================================
-- SECTION 2: TYPES ET ENUMS
-- ============================================

CREATE TYPE public.app_role AS ENUM (
  'SUPER_ADMIN',
  'ANALYSTE',
  'ENTREPRISE',
  'API_CLIENT',
  'PARTENAIRE',
  'EMPRUNTEUR'
);

-- Séquence pour les numéros de facture
CREATE SEQUENCE public.invoice_number_seq START 1;

-- ============================================
-- SECTION 3: FONCTIONS UTILITAIRES
-- ============================================

-- Fonction de mise à jour automatique des timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fonction de vérification de rôle
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fonction de récupération du rôle principal
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'SUPER_ADMIN' THEN 1
      WHEN 'ANALYSTE' THEN 2
      WHEN 'ENTREPRISE' THEN 3
      WHEN 'API_CLIENT' THEN 4
    END
  LIMIT 1
$$;

-- Vérification si partenaire
CREATE OR REPLACE FUNCTION public.is_partner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('PARTENAIRE', 'ENTREPRISE', 'ANALYSTE', 'API_CLIENT')
  )
$$;

-- Vérification si emprunteur
CREATE OR REPLACE FUNCTION public.is_borrower(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'EMPRUNTEUR'
  )
$$;

-- Génération de numéro de facture
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_month TEXT;
  seq_num INTEGER;
BEGIN
  year_month := to_char(NOW(), 'YYYYMM');
  seq_num := nextval('public.invoice_number_seq');
  NEW.invoice_number := 'WOK-' || year_month || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Consommation de crédits emprunteur
CREATE OR REPLACE FUNCTION public.consume_borrower_credit(p_user_id uuid, p_credit_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credit_id UUID;
BEGIN
  SELECT id INTO v_credit_id
  FROM public.borrower_credits
  WHERE user_id = p_user_id
    AND credit_type = p_credit_type
    AND credits_available > 0
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY expires_at ASC NULLS LAST
  LIMIT 1
  FOR UPDATE;

  IF v_credit_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.borrower_credits
  SET credits_available = credits_available - 1,
      credits_used = credits_used + 1
  WHERE id = v_credit_id;

  RETURN TRUE;
END;
$$;

-- Vérification des crédits disponibles
CREATE OR REPLACE FUNCTION public.check_borrower_credits(p_user_id uuid, p_credit_type text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(credits_available), 0) INTO v_total
  FROM public.borrower_credits
  WHERE user_id = p_user_id
    AND credit_type = p_credit_type
    AND credits_available > 0
    AND (expires_at IS NULL OR expires_at > NOW());

  RETURN v_total;
END;
$$;

-- Nettoyage des OTP expirés
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_verifications 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Mise à jour timestamp loan_applications
CREATE OR REPLACE FUNCTION public.update_loan_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mise à jour timestamp borrower_credits
CREATE OR REPLACE FUNCTION public.update_borrower_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handler pour nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role app_role;
  default_role app_role := 'EMPRUNTEUR';
BEGIN
  requested_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    default_role
  );
  
  IF requested_role IN ('ENTREPRISE', 'ANALYSTE', 'API_CLIENT') THEN
    requested_role := 'PARTENAIRE';
  END IF;
  
  IF requested_role = 'SUPER_ADMIN' THEN
    requested_role := default_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, company, avatar_url, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    '',
    true
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- SECTION 4: TABLES PRINCIPALES
-- ============================================

-- 4.1 PROFILS ET AUTHENTIFICATION

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  company TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.2 ADMINISTRATION

CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  key TEXT NOT NULL,
  value JSONB DEFAULT '{}',
  category TEXT DEFAULT 'general',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_text TEXT,
  consent_version TEXT,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  location_data JSONB,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.3 IDENTITÉ ET KYC

CREATE TABLE public.user_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT,
  document_country TEXT,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  nationality TEXT,
  place_of_birth TEXT,
  issue_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  mrz_data JSONB,
  ocr_confidence NUMERIC,
  face_match_score NUMERIC,
  liveness_score NUMERIC,
  verification_status TEXT DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  source_document_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id TEXT,
  device_type TEXT,
  os TEXT,
  os_version TEXT,
  browser TEXT,
  screen_resolution TEXT,
  language TEXT,
  timezone TEXT,
  is_primary BOOLEAN DEFAULT false,
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  sim_age_months INTEGER,
  phone_age_months INTEGER,
  app_usage_hours NUMERIC,
  location_stability NUMERIC,
  mobility_radius_km NUMERIC,
  battery_health NUMERIC,
  risk_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  address_type TEXT,
  street_address TEXT,
  city TEXT,
  region TEXT,
  postal_code TEXT,
  country TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  is_current BOOLEAN DEFAULT true,
  residence_since DATE,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_selfie_liveness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  selfie_url TEXT,
  liveness_video_url TEXT,
  liveness_score NUMERIC,
  anti_spoofing_score NUMERIC,
  face_quality_score NUMERIC,
  glasses_detected BOOLEAN,
  mask_detected BOOLEAN,
  multiple_faces BOOLEAN,
  blink_detected BOOLEAN,
  smile_detected BOOLEAN,
  head_turn_detected BOOLEAN,
  provider TEXT,
  provider_job_id TEXT,
  provider_response JSONB,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  ocr_data JSONB,
  ocr_confidence NUMERIC,
  status TEXT DEFAULT 'pending',
  validated_at TIMESTAMPTZ,
  validated_by UUID,
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.kyc_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  identity_verified BOOLEAN,
  address_verified BOOLEAN,
  income_verified BOOLEAN,
  documents_complete BOOLEAN,
  overall_score NUMERIC,
  risk_flags TEXT[],
  assigned_analyst UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.4 DONNÉES FINANCIÈRES

CREATE TABLE public.user_bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bank_name TEXT NOT NULL,
  account_type TEXT,
  account_number_masked TEXT,
  period_start DATE,
  period_end DATE,
  opening_balance NUMERIC,
  closing_balance NUMERIC,
  total_credits NUMERIC,
  total_debits NUMERIC,
  average_balance NUMERIC,
  min_balance NUMERIC,
  max_balance NUMERIC,
  transaction_count INTEGER,
  salary_detected BOOLEAN,
  salary_amount NUMERIC,
  salary_regularity_score NUMERIC,
  regular_payments JSONB,
  source_file_url TEXT,
  ocr_confidence NUMERIC,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_momo_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  phone_number TEXT,
  transaction_type TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'XOF',
  counterparty_phone TEXT,
  counterparty_name TEXT,
  transaction_date TIMESTAMPTZ,
  transaction_id TEXT,
  balance_after NUMERIC,
  fees NUMERIC,
  source_type TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_utility_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  utility_type TEXT,
  provider TEXT,
  account_number TEXT,
  address_id UUID REFERENCES public.user_addresses(id),
  bill_date DATE,
  due_date DATE,
  amount NUMERIC,
  paid BOOLEAN,
  paid_date DATE,
  days_late INTEGER,
  source_file_url TEXT,
  ocr_confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_informal_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  income_type TEXT,
  description TEXT,
  estimated_monthly_amount NUMERIC,
  currency TEXT DEFAULT 'XOF',
  frequency TEXT,
  evidence_type TEXT,
  evidence_url TEXT,
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.5 CAPITAL SOCIAL

CREATE TABLE public.user_tontine_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  group_name TEXT NOT NULL,
  group_size INTEGER,
  contribution_amount NUMERIC,
  frequency TEXT,
  member_since DATE,
  is_organizer BOOLEAN DEFAULT false,
  is_treasurer BOOLEAN DEFAULT false,
  position_in_cycle INTEGER,
  has_received BOOLEAN,
  received_date DATE,
  received_amount NUMERIC,
  payments_made INTEGER,
  payments_missed INTEGER,
  payments_late INTEGER,
  discipline_score NUMERIC,
  organizer_phone TEXT,
  attestation_provided BOOLEAN,
  attestation_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_cooperative_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cooperative_name TEXT NOT NULL,
  cooperative_type TEXT,
  registration_number TEXT,
  member_since DATE,
  role TEXT,
  share_capital NUMERIC,
  loans_taken INTEGER,
  loans_repaid_on_time INTEGER,
  loans_defaulted INTEGER,
  current_loan_amount NUMERIC,
  current_loan_balance NUMERIC,
  standing_score NUMERIC,
  contact_person TEXT,
  contact_phone TEXT,
  attestation_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_guarantors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  guarantor_name TEXT NOT NULL,
  guarantor_phone TEXT,
  guarantor_email TEXT,
  relationship TEXT,
  relationship_duration_months INTEGER,
  guarantor_occupation TEXT,
  guarantor_employer TEXT,
  guarantor_monthly_income NUMERIC,
  willing_to_guarantee BOOLEAN,
  max_guarantee_amount NUMERIC,
  identity_verified BOOLEAN,
  phone_verified BOOLEAN,
  consent_given BOOLEAN,
  consent_date TIMESTAMPTZ,
  trust_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_community_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  attestation_type TEXT,
  issuer_name TEXT NOT NULL,
  issuer_title TEXT,
  issuer_phone TEXT,
  issuer_address TEXT,
  attestation_date DATE,
  content_summary TEXT,
  file_url TEXT,
  trust_score NUMERIC,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  link_type TEXT,
  account_age_months INTEGER,
  contact_count INTEGER,
  active_contacts_30d INTEGER,
  network_quality_score NUMERIC,
  verified BOOLEAN DEFAULT false,
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.6 SCORING ET COMPORTEMENT

CREATE TABLE public.user_behavior_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_start DATE,
  period_end DATE,
  login_count INTEGER,
  session_avg_duration_minutes NUMERIC,
  form_completion_rate NUMERIC,
  document_upload_speed_score NUMERIC,
  navigation_coherence NUMERIC,
  errors_made INTEGER,
  corrections_made INTEGER,
  help_accessed INTEGER,
  time_to_complete_kyc_hours NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_psychometric_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  test_type TEXT,
  test_version TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_time_seconds INTEGER,
  questions_answered INTEGER,
  questions_total INTEGER,
  financial_literacy_score NUMERIC,
  risk_tolerance_score NUMERIC,
  future_orientation_score NUMERIC,
  self_efficacy_score NUMERIC,
  social_capital_score NUMERIC,
  overall_score NUMERIC,
  response_consistency NUMERIC,
  attention_checks_passed INTEGER,
  raw_responses JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_economic_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  zone_type TEXT,
  urban_density TEXT,
  market_proximity_km NUMERIC,
  banking_access_km NUMERIC,
  mobile_network_quality TEXT,
  main_economic_activity TEXT,
  seasonal_income_pattern TEXT,
  local_inflation_estimate NUMERIC,
  local_unemployment_rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.scoring_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  partner_id UUID,
  customer_profile_id UUID,
  api_key_id UUID,
  phone_number TEXT,
  full_name TEXT,
  national_id TEXT,
  annual_revenue NUMERIC,
  years_in_business INTEGER,
  business_type TEXT,
  business_sector TEXT,
  employee_count INTEGER,
  momo_balance NUMERIC,
  momo_transactions_3m NUMERIC,
  momo_unique_senders INTEGER,
  momo_unique_receivers INTEGER,
  utility_payments_on_time INTEGER,
  utility_payments_late INTEGER,
  sim_age_months INTEGER,
  phone_age_months INTEGER,
  data_usage_stability NUMERIC,
  location_stability NUMERIC,
  app_usage_pattern TEXT,
  existing_loans INTEGER,
  loans_repaid_on_time INTEGER,
  loans_defaulted INTEGER,
  score NUMERIC,
  confidence NUMERIC,
  risk_category TEXT,
  sub_scores JSONB,
  model_version TEXT,
  data_sources_used TEXT[],
  processing_time_ms INTEGER,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.score_raw_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scoring_request_id UUID REFERENCES public.scoring_requests(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  feature_category TEXT,
  raw_value TEXT,
  numeric_value NUMERIC,
  data_source TEXT,
  data_quality TEXT,
  extracted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.score_engineered_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scoring_request_id UUID REFERENCES public.scoring_requests(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL,
  raw_feature_ids TEXT[],
  transformation TEXT,
  normalized_value NUMERIC,
  weight_applied NUMERIC,
  contribution_to_score NUMERIC,
  sub_score_category TEXT,
  calculated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  scoring_request_id UUID REFERENCES public.scoring_requests(id),
  score_value NUMERIC,
  grade TEXT,
  risk_tier TEXT,
  data_sources_count INTEGER,
  data_quality TEXT,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.7 FRAUDE

CREATE TABLE public.fraud_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.profiles(id),
  profile_id UUID,
  full_name TEXT,
  phone_number TEXT,
  national_id TEXT,
  fraud_score NUMERIC,
  risk_level TEXT,
  identity_coherence NUMERIC,
  behavior_coherence NUMERIC,
  anomalies_count INTEGER,
  flags JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.document_fraud_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  document_id UUID REFERENCES public.kyc_documents(id),
  check_type TEXT NOT NULL,
  check_name TEXT,
  passed BOOLEAN,
  confidence NUMERIC,
  details TEXT,
  template_match_score NUMERIC,
  manipulation_detected BOOLEAN,
  forgery_indicators JSONB,
  metadata_validation JSONB,
  fraud_probability NUMERIC,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.device_fraud_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  device_id UUID REFERENCES public.user_devices(id),
  analysis_type TEXT NOT NULL,
  is_emulator BOOLEAN,
  is_rooted BOOLEAN,
  vpn_detected BOOLEAN,
  proxy_detected BOOLEAN,
  timezone_mismatch BOOLEAN,
  location_spoofing BOOLEAN,
  multiple_accounts_detected BOOLEAN,
  accounts_on_device INTEGER,
  device_reputation_score NUMERIC,
  risk_indicators JSONB,
  fraud_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.behavior_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  anomaly_type TEXT NOT NULL,
  severity TEXT,
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

CREATE TABLE public.identity_fraud_risk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  identity_id UUID REFERENCES public.user_identities(id),
  risk_type TEXT NOT NULL,
  risk_level TEXT,
  overall_risk_score NUMERIC,
  synthetic_identity_probability NUMERIC,
  duplicate_identity_suspected BOOLEAN,
  cross_reference_hits INTEGER,
  indicators JSONB,
  investigation_status TEXT,
  investigated_by UUID,
  investigated_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.8 API ET INTÉGRATION

CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions JSONB DEFAULT '["score", "kyc", "identity"]',
  rate_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.api_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  request_body JSONB,
  response_body JSONB,
  ip_address INET,
  user_agent TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  retry_count INTEGER DEFAULT 0,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.9 PAIEMENTS ET ABONNEMENTS

CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC DEFAULT 0,
  price_yearly NUMERIC,
  currency TEXT DEFAULT 'FCFA',
  features JSONB,
  limits JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id),
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id),
  transaction_id TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XOF',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_url TEXT,
  payment_token TEXT,
  cinetpay_data JSONB,
  metadata JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transaction_id UUID REFERENCES public.payment_transactions(id),
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XOF',
  status TEXT DEFAULT 'draft',
  issued_at TIMESTAMPTZ DEFAULT now(),
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.partner_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  api_calls_count INTEGER DEFAULT 0,
  score_requests_count INTEGER DEFAULT 0,
  kyc_requests_count INTEGER DEFAULT 0,
  identity_requests_count INTEGER DEFAULT 0,
  total_amount NUMERIC,
  currency TEXT DEFAULT 'XOF',
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.borrower_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credit_type TEXT NOT NULL,
  credits_available INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  source TEXT NOT NULL,
  payment_transaction_id UUID REFERENCES public.payment_transactions(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.borrower_shared_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id UUID NOT NULL,
  result_type TEXT NOT NULL,
  result_id TEXT NOT NULL,
  share_token TEXT DEFAULT gen_random_uuid()::text,
  shared_with_email TEXT,
  shared_with_partner_id UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  is_accessed BOOLEAN DEFAULT false,
  accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.10 MARKETPLACE ET APPLICATIONS

CREATE TABLE public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.profiles(id),
  provider_name TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  min_amount NUMERIC,
  max_amount NUMERIC,
  currency TEXT DEFAULT 'XOF',
  interest_rate NUMERIC,
  duration_min_months INTEGER,
  duration_max_months INTEGER,
  min_score_required INTEGER,
  requirements TEXT[],
  features TEXT[],
  countries TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.profiles(id),
  external_reference TEXT NOT NULL,
  identity_data JSONB,
  financial_indicators JSONB,
  telecom_indicators JSONB,
  commercial_indicators JSONB,
  stability_indicators JSONB,
  composite_score NUMERIC,
  risk_score NUMERIC,
  stability_score NUMERIC,
  reliability_score NUMERIC,
  engagement_capacity NUMERIC,
  data_sources TEXT[],
  enrichment_count INTEGER DEFAULT 0,
  last_enriched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(partner_id, external_reference)
);

CREATE TABLE public.kyc_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.profiles(id),
  customer_profile_id UUID REFERENCES public.customer_profiles(id),
  api_key_id UUID REFERENCES public.api_keys(id),
  full_name TEXT NOT NULL,
  phone_number TEXT,
  national_id TEXT,
  kyc_level TEXT,
  status TEXT DEFAULT 'pending',
  documents_required TEXT[],
  documents_submitted INTEGER DEFAULT 0,
  documents_verified INTEGER DEFAULT 0,
  identity_score NUMERIC,
  fraud_score NUMERIC,
  fraud_indicators JSONB,
  risk_level TEXT,
  risk_flags TEXT[],
  verifications_performed JSONB,
  rejection_reason TEXT,
  processing_time_ms INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id),
  user_id UUID,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  national_id TEXT,
  identity_document_url TEXT,
  additional_documents JSONB,
  score NUMERIC,
  score_grade TEXT,
  score_details JSONB,
  kyc_request_id UUID REFERENCES public.kyc_requests(id),
  kyc_status TEXT,
  kyc_identity_score NUMERIC,
  kyc_fraud_score NUMERIC,
  is_eligible BOOLEAN,
  eligibility_reason TEXT,
  risk_level TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  partner_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.precheck_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.profiles(id),
  api_key_id UUID REFERENCES public.api_keys(id),
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  quick_score NUMERIC,
  sim_stability TEXT,
  status TEXT DEFAULT 'completed',
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.document_submission_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.profiles(id),
  customer_profile_id UUID REFERENCES public.customer_profiles(id),
  kyc_request_id UUID REFERENCES public.kyc_requests(id),
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  token TEXT DEFAULT gen_random_uuid()::text,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '48 hours'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profile_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.profiles(id),
  profile_id UUID NOT NULL REFERENCES public.customer_profiles(id),
  monitoring_type TEXT NOT NULL,
  threshold_config JSONB,
  is_active BOOLEAN DEFAULT true,
  last_check_at TIMESTAMPTZ,
  last_alert_at TIMESTAMPTZ,
  alert_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitoring_id UUID NOT NULL REFERENCES public.profile_monitoring(id),
  partner_id UUID NOT NULL REFERENCES public.profiles(id),
  profile_id UUID NOT NULL REFERENCES public.customer_profiles(id),
  alert_type TEXT NOT NULL,
  severity TEXT,
  message TEXT NOT NULL,
  details JSONB,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES public.profiles(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.11 INSTITUTIONS

CREATE TABLE public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  institution_type TEXT,
  registration_number TEXT,
  tax_id TEXT,
  country TEXT,
  city TEXT,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  billing_email TEXT,
  website TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  api_access_enabled BOOLEAN DEFAULT false,
  webhook_url TEXT,
  webhook_secret TEXT,
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.institution_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT,
  permissions JSONB,
  is_primary_contact BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  invited_by UUID,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.12 ENRICHISSEMENT DE DONNÉES

CREATE TABLE public.data_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  phone_number TEXT NOT NULL,
  telecom_consent BOOLEAN,
  mobile_money_consent BOOLEAN,
  utility_consent BOOLEAN,
  registry_consent BOOLEAN,
  consent_given_at TIMESTAMPTZ,
  consent_expires_at TIMESTAMPTZ,
  ip_address TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.data_source_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  source_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  api_endpoint TEXT,
  sandbox_endpoint TEXT,
  is_sandbox BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  rate_limit_per_minute INTEGER DEFAULT 60,
  supported_countries TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.data_enrichments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scoring_request_id UUID REFERENCES public.scoring_requests(id),
  consent_id UUID REFERENCES public.data_consents(id),
  source_type TEXT NOT NULL,
  source_provider TEXT NOT NULL,
  raw_data JSONB DEFAULT '{}',
  normalized_data JSONB,
  confidence_score NUMERIC,
  verification_status TEXT,
  is_simulated BOOLEAN DEFAULT false,
  processing_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  partner_id UUID REFERENCES public.profiles(id),
  phone_number TEXT NOT NULL,
  verification_method TEXT DEFAULT 'otp',
  verification_token TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  provider TEXT,
  purpose TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  partner_id UUID,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT DEFAULT 'verification',
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.premium_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  partner_id UUID REFERENCES public.profiles(id),
  customer_profile_id UUID REFERENCES public.customer_profiles(id),
  verification_type TEXT NOT NULL,
  identity_data JSONB,
  verification_status TEXT DEFAULT 'pending',
  verification_result JSONB,
  smile_job_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_transaction_id UUID,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XOF',
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.13 DATASETS

CREATE TABLE public.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_name TEXT,
  file_url TEXT,
  file_size INTEGER,
  columns JSONB,
  column_count INTEGER,
  row_count INTEGER,
  status TEXT DEFAULT 'pending',
  processing_progress NUMERIC DEFAULT 0,
  scores_calculated INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.dataset_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  score NUMERIC,
  confidence NUMERIC,
  risk_category TEXT,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SECTION 5: TRIGGERS
-- ============================================

-- Triggers updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_identities_updated_at BEFORE UPDATE ON public.user_identities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_devices_updated_at BEFORE UPDATE ON public.user_devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON public.user_addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_economic_context_updated_at BEFORE UPDATE ON public.user_economic_context FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kyc_documents_updated_at BEFORE UPDATE ON public.kyc_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kyc_validations_updated_at BEFORE UPDATE ON public.kyc_validations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kyc_requests_updated_at BEFORE UPDATE ON public.kyc_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_scoring_requests_updated_at BEFORE UPDATE ON public.scoring_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON public.webhooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_marketplace_products_updated_at BEFORE UPDATE ON public.marketplace_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON public.customer_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profile_monitoring_updated_at BEFORE UPDATE ON public.profile_monitoring FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON public.institutions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_data_source_credentials_updated_at BEFORE UPDATE ON public.data_source_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_premium_verifications_updated_at BEFORE UPDATE ON public.premium_verifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON public.datasets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger loan_applications
CREATE TRIGGER update_loan_applications_updated_at_trigger BEFORE UPDATE ON public.loan_applications FOR EACH ROW EXECUTE FUNCTION public.update_loan_applications_updated_at();

-- Trigger borrower_credits
CREATE TRIGGER update_borrower_credits_updated_at_trigger BEFORE UPDATE ON public.borrower_credits FOR EACH ROW EXECUTE FUNCTION public.update_borrower_credits_updated_at();

-- Trigger numéro de facture
CREATE TRIGGER set_invoice_number BEFORE INSERT ON public.invoices FOR EACH ROW WHEN (NEW.invoice_number IS NULL) EXECUTE FUNCTION public.generate_invoice_number();

-- Trigger nouveau utilisateur (sur auth.users)
-- NOTE: Ce trigger doit être créé sur auth.users qui existe déjà dans Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SECTION 6: POLITIQUES RLS
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_selfie_liveness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_momo_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_utility_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_informal_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tontine_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cooperative_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_community_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_psychometric_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_economic_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_raw_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_engineered_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_fraud_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fraud_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_fraud_risk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrower_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrower_shared_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precheck_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_submission_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_source_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_enrichments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_rows ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Super admins can manage all profiles" ON public.profiles FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- USER_ROLES
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- USER_SESSIONS
CREATE POLICY "Users can view their own sessions" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions FOR ALL USING (auth.uid() = user_id);

-- PERMISSIONS
CREATE POLICY "Everyone can view permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Only super admins can manage permissions" ON public.permissions FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- ROLE_PERMISSIONS
CREATE POLICY "Everyone can view role_permissions" ON public.role_permissions FOR SELECT USING (true);
CREATE POLICY "Only super admins can manage role_permissions" ON public.role_permissions FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- SETTINGS
CREATE POLICY "Users can view their own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id OR is_system = true);
CREATE POLICY "Users can manage their own settings" ON public.settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all settings" ON public.settings FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- AUDIT_LOGS
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can view all audit logs" ON public.audit_logs FOR SELECT USING (has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Analysts can view audit logs" ON public.audit_logs FOR SELECT USING (has_role(auth.uid(), 'ANALYSTE'));

-- NOTIFICATIONS
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- CONSENT_LOGS
CREATE POLICY "Users can view their own consent_logs" ON public.consent_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own consent_logs" ON public.consent_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- USER_IDENTITIES
CREATE POLICY "Users can view their own identities" ON public.user_identities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own identities" ON public.user_identities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all identities" ON public.user_identities FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- USER_DEVICES
CREATE POLICY "Users can view their own devices" ON public.user_devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own devices" ON public.user_devices FOR ALL USING (auth.uid() = user_id);

-- USER_ADDRESSES
CREATE POLICY "Users can view their own addresses" ON public.user_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own addresses" ON public.user_addresses FOR ALL USING (auth.uid() = user_id);

-- USER_SELFIE_LIVENESS
CREATE POLICY "Users can view their own selfie_liveness" ON public.user_selfie_liveness FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own selfie_liveness" ON public.user_selfie_liveness FOR ALL USING (auth.uid() = user_id);

-- KYC_DOCUMENTS
CREATE POLICY "Users can view their own KYC documents" ON public.kyc_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own KYC documents" ON public.kyc_documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Analysts can view all KYC documents" ON public.kyc_documents FOR SELECT USING (has_role(auth.uid(), 'ANALYSTE'));
CREATE POLICY "Admins can manage all KYC documents" ON public.kyc_documents FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- KYC_VALIDATIONS
CREATE POLICY "Users can view their own KYC validations" ON public.kyc_validations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Analysts can manage KYC validations" ON public.kyc_validations FOR ALL USING (has_role(auth.uid(), 'ANALYSTE'));
CREATE POLICY "Admins can manage all KYC validations" ON public.kyc_validations FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- FINANCIAL DATA (user_bank_statements, user_momo_transactions, etc.)
CREATE POLICY "Users can view their own bank_statements" ON public.user_bank_statements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own bank_statements" ON public.user_bank_statements FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own momo_transactions" ON public.user_momo_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own momo_transactions" ON public.user_momo_transactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own utility_bills" ON public.user_utility_bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own utility_bills" ON public.user_utility_bills FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own informal_income" ON public.user_informal_income FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own informal_income" ON public.user_informal_income FOR ALL USING (auth.uid() = user_id);

-- SOCIAL CAPITAL
CREATE POLICY "Users can view their own tontine_memberships" ON public.user_tontine_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own tontine_memberships" ON public.user_tontine_memberships FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own cooperative_memberships" ON public.user_cooperative_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own cooperative_memberships" ON public.user_cooperative_memberships FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own guarantors" ON public.user_guarantors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own guarantors" ON public.user_guarantors FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own community_attestations" ON public.user_community_attestations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own community_attestations" ON public.user_community_attestations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own social_links" ON public.user_social_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own social_links" ON public.user_social_links FOR ALL USING (auth.uid() = user_id);

-- BEHAVIOR & SCORING
CREATE POLICY "Users can view their own behavior_metrics" ON public.user_behavior_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own psychometric_results" ON public.user_psychometric_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own economic_context" ON public.user_economic_context FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own scoring_requests" ON public.scoring_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Partners can view their own scoring_requests" ON public.scoring_requests FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "Partners can create scoring_requests" ON public.scoring_requests FOR INSERT WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Partners can view their score_raw_features" ON public.score_raw_features FOR SELECT USING (EXISTS (SELECT 1 FROM public.scoring_requests sr WHERE sr.id = scoring_request_id AND sr.partner_id = auth.uid()));
CREATE POLICY "Partners can view their score_engineered_features" ON public.score_engineered_features FOR SELECT USING (EXISTS (SELECT 1 FROM public.scoring_requests sr WHERE sr.id = scoring_request_id AND sr.partner_id = auth.uid()));

CREATE POLICY "Users can view their own score_history" ON public.score_history FOR SELECT USING (auth.uid() = user_id);

-- FRAUD
CREATE POLICY "Partners can view their own fraud_detections" ON public.fraud_detections FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "Partners can create fraud_detections" ON public.fraud_detections FOR INSERT WITH CHECK (auth.uid() = partner_id);
CREATE POLICY "Admins can manage all fraud_detections" ON public.fraud_detections FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Users can view their document_fraud_analysis" ON public.document_fraud_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their device_fraud_analysis" ON public.device_fraud_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their behavior_anomalies" ON public.behavior_anomalies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all anomalies" ON public.behavior_anomalies FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Users can view their identity_fraud_risk" ON public.identity_fraud_risk FOR SELECT USING (auth.uid() = user_id);

-- API KEYS
CREATE POLICY "Users can view their own API keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own API keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own API keys" ON public.api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own API keys" ON public.api_keys FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Super admins can view all API keys" ON public.api_keys FOR SELECT USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- API CALLS
CREATE POLICY "Users can view their own API calls" ON public.api_calls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can view all API calls" ON public.api_calls FOR SELECT USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- WEBHOOKS
CREATE POLICY "Users can view their own webhooks" ON public.webhooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own webhooks" ON public.webhooks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own webhook_deliveries" ON public.webhook_deliveries FOR SELECT USING (EXISTS (SELECT 1 FROM public.webhooks w WHERE w.id = webhook_id AND w.user_id = auth.uid()));

-- SUBSCRIPTION PLANS
CREATE POLICY "Everyone can view active subscription plans" ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- SUBSCRIPTIONS
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- PAYMENT TRANSACTIONS
CREATE POLICY "Users can view their own payment_transactions" ON public.payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own payment_transactions" ON public.payment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can update payment_transactions" ON public.payment_transactions FOR UPDATE USING (true);

-- INVOICES
CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage invoices" ON public.invoices FOR ALL USING (true);

-- PARTNER BILLING
CREATE POLICY "Users can view their own billing" ON public.partner_billing FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all billing" ON public.partner_billing FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- BORROWER CREDITS
CREATE POLICY "Users can view their own credits" ON public.borrower_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert credits" ON public.borrower_credits FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update credits" ON public.borrower_credits FOR UPDATE USING (true);

-- BORROWER SHARED RESULTS
CREATE POLICY "Borrowers can view their own shared results" ON public.borrower_shared_results FOR SELECT USING (auth.uid() = borrower_id);
CREATE POLICY "Borrowers can create shared results" ON public.borrower_shared_results FOR INSERT WITH CHECK (auth.uid() = borrower_id);
CREATE POLICY "Borrowers can update their own shared results" ON public.borrower_shared_results FOR UPDATE USING (auth.uid() = borrower_id);
CREATE POLICY "Anyone can view shared results by token" ON public.borrower_shared_results FOR SELECT USING (share_token IS NOT NULL);

-- MARKETPLACE PRODUCTS
CREATE POLICY "Everyone can view active marketplace products" ON public.marketplace_products FOR SELECT USING (is_active = true);
CREATE POLICY "Partners can manage their own products" ON public.marketplace_products FOR ALL USING (auth.uid() = provider_id);
CREATE POLICY "Admins can manage all products" ON public.marketplace_products FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- CUSTOMER PROFILES
CREATE POLICY "Partners can view their own customer profiles" ON public.customer_profiles FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "Partners can create customer profiles" ON public.customer_profiles FOR INSERT WITH CHECK (auth.uid() = partner_id);
CREATE POLICY "Partners can update their own customer profiles" ON public.customer_profiles FOR UPDATE USING (auth.uid() = partner_id);
CREATE POLICY "Partners can delete their own customer profiles" ON public.customer_profiles FOR DELETE USING (auth.uid() = partner_id);
CREATE POLICY "Analysts can view all customer profiles" ON public.customer_profiles FOR SELECT USING (has_role(auth.uid(), 'ANALYSTE'));

-- KYC REQUESTS
CREATE POLICY "Partners can view their own kyc_requests" ON public.kyc_requests FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "Partners can create kyc_requests" ON public.kyc_requests FOR INSERT WITH CHECK (auth.uid() = partner_id);
CREATE POLICY "Partners can update their own kyc_requests" ON public.kyc_requests FOR UPDATE USING (auth.uid() = partner_id);
CREATE POLICY "Analysts can view all kyc_requests" ON public.kyc_requests FOR SELECT USING (has_role(auth.uid(), 'ANALYSTE'));

-- LOAN APPLICATIONS
CREATE POLICY "Users can view their own loan_applications" ON public.loan_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create loan_applications" ON public.loan_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Partners can view applications for their products" ON public.loan_applications FOR SELECT USING (EXISTS (SELECT 1 FROM public.marketplace_products mp WHERE mp.id = product_id AND mp.provider_id = auth.uid()));
CREATE POLICY "Partners can update applications for their products" ON public.loan_applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.marketplace_products mp WHERE mp.id = product_id AND mp.provider_id = auth.uid()));

-- PRECHECK REQUESTS
CREATE POLICY "Partners can view their own precheck_requests" ON public.precheck_requests FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "Partners can create precheck_requests" ON public.precheck_requests FOR INSERT WITH CHECK (auth.uid() = partner_id);

-- DOCUMENT SUBMISSION TOKENS
CREATE POLICY "Partners can view their own submission_tokens" ON public.document_submission_tokens FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "Partners can manage their own submission_tokens" ON public.document_submission_tokens FOR ALL USING (auth.uid() = partner_id);
CREATE POLICY "Public can view valid tokens" ON public.document_submission_tokens FOR SELECT USING (status = 'pending' AND expires_at > now());

-- PROFILE MONITORING
CREATE POLICY "Partners can view their own monitoring" ON public.profile_monitoring FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "Partners can manage their own monitoring" ON public.profile_monitoring FOR ALL USING (auth.uid() = partner_id);

-- MONITORING ALERTS
CREATE POLICY "Partners can view their own alerts" ON public.monitoring_alerts FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "Partners can update their own alerts" ON public.monitoring_alerts FOR UPDATE USING (auth.uid() = partner_id);

-- INSTITUTIONS
CREATE POLICY "Everyone can view active institutions" ON public.institutions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage all institutions" ON public.institutions FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- INSTITUTION USERS
CREATE POLICY "Institution members can view their institution users" ON public.institution_users FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage institution users" ON public.institution_users FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- DATA CONSENTS
CREATE POLICY "Users can view their own data_consents" ON public.data_consents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage data_consents" ON public.data_consents FOR ALL USING (true);

-- DATA SOURCE CREDENTIALS
CREATE POLICY "Admins can view data_source_credentials" ON public.data_source_credentials FOR SELECT USING (has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Admins can manage data_source_credentials" ON public.data_source_credentials FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- DATA ENRICHMENTS
CREATE POLICY "Partners can view their own enrichments" ON public.data_enrichments FOR SELECT USING (EXISTS (SELECT 1 FROM public.scoring_requests sr WHERE sr.id = scoring_request_id AND sr.partner_id = auth.uid()));

-- PHONE/OTP VERIFICATIONS
CREATE POLICY "Users can view their own phone_verifications" ON public.phone_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Partners can view their phone_verifications" ON public.phone_verifications FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "System can manage phone_verifications" ON public.phone_verifications FOR ALL USING (true);

CREATE POLICY "System can manage otp_verifications" ON public.otp_verifications FOR ALL USING (true);

-- PREMIUM VERIFICATIONS
CREATE POLICY "Users can view their own premium_verifications" ON public.premium_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Partners can view their premium_verifications" ON public.premium_verifications FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "System can manage premium_verifications" ON public.premium_verifications FOR ALL USING (true);

-- DATASETS
CREATE POLICY "Users can view their own datasets" ON public.datasets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own datasets" ON public.datasets FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own dataset_rows" ON public.dataset_rows FOR SELECT USING (EXISTS (SELECT 1 FROM public.datasets d WHERE d.id = dataset_id AND d.user_id = auth.uid()));
CREATE POLICY "Users can manage their own dataset_rows" ON public.dataset_rows FOR ALL USING (EXISTS (SELECT 1 FROM public.datasets d WHERE d.id = dataset_id AND d.user_id = auth.uid()));

-- ============================================
-- SECTION 7: INDEX DE PERFORMANCE
-- ============================================

-- Profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- User roles
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Sessions
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Audit logs
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- User identities
CREATE INDEX idx_user_identities_user_id ON public.user_identities(user_id);
CREATE INDEX idx_user_identities_document_number ON public.user_identities(document_number);

-- KYC
CREATE INDEX idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX idx_kyc_documents_status ON public.kyc_documents(status);
CREATE INDEX idx_kyc_validations_user_id ON public.kyc_validations(user_id);
CREATE INDEX idx_kyc_validations_status ON public.kyc_validations(status);
CREATE INDEX idx_kyc_requests_partner_id ON public.kyc_requests(partner_id);
CREATE INDEX idx_kyc_requests_status ON public.kyc_requests(status);

-- Scoring
CREATE INDEX idx_scoring_requests_partner_id ON public.scoring_requests(partner_id);
CREATE INDEX idx_scoring_requests_user_id ON public.scoring_requests(user_id);
CREATE INDEX idx_scoring_requests_customer_profile_id ON public.scoring_requests(customer_profile_id);
CREATE INDEX idx_scoring_requests_status ON public.scoring_requests(status);
CREATE INDEX idx_scoring_requests_phone_number ON public.scoring_requests(phone_number);
CREATE INDEX idx_score_history_user_id ON public.score_history(user_id);

-- Fraud
CREATE INDEX idx_fraud_detections_partner_id ON public.fraud_detections(partner_id);
CREATE INDEX idx_behavior_anomalies_user_id ON public.behavior_anomalies(user_id);

-- API
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key_prefix ON public.api_keys(key_prefix);
CREATE INDEX idx_api_calls_api_key_id ON public.api_calls(api_key_id);
CREATE INDEX idx_api_calls_created_at ON public.api_calls(created_at DESC);

-- Webhooks
CREATE INDEX idx_webhooks_user_id ON public.webhooks(user_id);
CREATE INDEX idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id);

-- Subscriptions
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_transaction_id ON public.payment_transactions(transaction_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);

-- Billing & Credits
CREATE INDEX idx_partner_billing_user_id ON public.partner_billing(user_id);
CREATE INDEX idx_borrower_credits_user_id ON public.borrower_credits(user_id);
CREATE INDEX idx_borrower_credits_credit_type ON public.borrower_credits(credit_type);
CREATE INDEX idx_borrower_shared_results_borrower_id ON public.borrower_shared_results(borrower_id);
CREATE INDEX idx_borrower_shared_results_share_token ON public.borrower_shared_results(share_token);

-- Marketplace
CREATE INDEX idx_marketplace_products_provider_id ON public.marketplace_products(provider_id);
CREATE INDEX idx_marketplace_products_category ON public.marketplace_products(category);
CREATE INDEX idx_marketplace_products_is_active ON public.marketplace_products(is_active);
CREATE INDEX idx_marketplace_products_is_featured ON public.marketplace_products(is_featured);

-- Customer profiles
CREATE INDEX idx_customer_profiles_partner_id ON public.customer_profiles(partner_id);
CREATE INDEX idx_customer_profiles_external_reference ON public.customer_profiles(external_reference);

-- Loan applications
CREATE INDEX idx_loan_applications_product_id ON public.loan_applications(product_id);
CREATE INDEX idx_loan_applications_user_id ON public.loan_applications(user_id);
CREATE INDEX idx_loan_applications_status ON public.loan_applications(status);

-- Document submission tokens
CREATE INDEX idx_document_submission_tokens_partner_id ON public.document_submission_tokens(partner_id);
CREATE INDEX idx_document_submission_tokens_token ON public.document_submission_tokens(token);
CREATE INDEX idx_document_submission_tokens_status ON public.document_submission_tokens(status);

-- Monitoring
CREATE INDEX idx_profile_monitoring_partner_id ON public.profile_monitoring(partner_id);
CREATE INDEX idx_profile_monitoring_profile_id ON public.profile_monitoring(profile_id);
CREATE INDEX idx_monitoring_alerts_partner_id ON public.monitoring_alerts(partner_id);

-- OTP
CREATE INDEX idx_otp_verifications_phone_number ON public.otp_verifications(phone_number);
CREATE INDEX idx_otp_verifications_expires_at ON public.otp_verifications(expires_at);

-- Datasets
CREATE INDEX idx_datasets_user_id ON public.datasets(user_id);
CREATE INDEX idx_dataset_rows_dataset_id ON public.dataset_rows(dataset_id);

-- ============================================
-- SECTION 8: REALTIME
-- ============================================

-- Activer Realtime pour certaines tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_applications;

-- ============================================
-- SECTION 9: STORAGE BUCKETS
-- ============================================

-- Note: Les buckets doivent être créés via l'API Supabase ou le dashboard
-- Ces commandes SQL sont pour référence

-- Créer le bucket avatars (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Créer le bucket kyc-documents (privé)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kyc-documents', 'kyc-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false;

-- Créer le bucket datasets (privé)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('datasets', 'datasets', false, 52428800, ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO UPDATE SET public = false;

-- Créer le bucket invoices (privé)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invoices', 'invoices', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false;

-- Politiques de stockage

-- Avatars (public read, authenticated write)
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- KYC Documents (private, user access)
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON storage.objects;
CREATE POLICY "Users can view their own KYC documents storage" ON storage.objects FOR SELECT USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
CREATE POLICY "Users can upload their own KYC documents storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Datasets (private, user access)
DROP POLICY IF EXISTS "Users can view their own datasets" ON storage.objects;
CREATE POLICY "Users can view their own datasets storage" ON storage.objects FOR SELECT USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload their own datasets" ON storage.objects;
CREATE POLICY "Users can upload their own datasets storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Invoices (private, user access)
DROP POLICY IF EXISTS "Users can view their own invoices" ON storage.objects;
CREATE POLICY "Users can view their own invoices storage" ON storage.objects FOR SELECT USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- SECTION 10: DONNÉES INITIALES
-- ============================================

-- 10.1 Plans d'abonnement
INSERT INTO public.subscription_plans (id, name, description, price_monthly, price_yearly, currency, features, limits, is_active) VALUES
  ('04a1593e-670c-4a2c-ac9a-384f71a0eae7', 'Starter', 'Idéal pour les PME et commerçants', 99000, 990000, 'FCFA', 
   '["25 évaluations par mois", "API standard", "Support par email", "1 utilisateur", "Tableau de bord basique", "Export des données"]'::jsonb,
   '{"scores_per_month": 25, "kyc_per_month": 10, "api_calls_per_month": 500}'::jsonb, true),
  ('5a3cae42-5bea-4e4e-bd80-a18301daedd0', 'Business', 'Pour les entreprises en croissance', 299000, 2990000, 'FCFA',
   '["85 évaluations par mois", "API complète avec webhooks", "Support prioritaire 24/7", "10 utilisateurs", "Tableau de bord avancé", "Exports illimités", "Vérification d''identité", "Alertes personnalisées", "Intégrations partenaires"]'::jsonb,
   '{"scores_per_month": 85, "kyc_per_month": 50, "api_calls_per_month": 5000}'::jsonb, true),
  ('c1ff1e05-c089-4b1d-9cd3-2068a02878be', 'Enterprise', 'Pour les grandes institutions', 0, 0, 'FCFA',
   '["Volume négocié", "API dédiée + SDK personnalisé", "Account Manager dédié", "Utilisateurs illimités", "Marque blanche disponible", "Déploiement dédié", "SLA 99.99% garanti", "Formation de vos équipes", "Audit de sécurité annuel", "Conformité BCEAO renforcée"]'::jsonb,
   '{"scores_per_month": -1, "kyc_per_month": -1, "api_calls_per_month": -1}'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits;

-- 10.2 Permissions
INSERT INTO public.permissions (id, name, resource, action, description) VALUES
  ('9e35d160-eb17-4ec7-9806-c37e6b5d13d0', 'score:read', 'score', 'read', 'Lire les scores'),
  ('6e58e7cd-2193-4031-8d32-94b0ee432b06', 'score:create', 'score', 'create', 'Créer des scores'),
  ('2c13383d-3976-458e-860a-5cf22c01add3', 'kyc:read', 'kyc', 'read', 'Lire les vérifications KYC'),
  ('07da6c72-d83a-438e-90d3-c5baf3c564f8', 'kyc:create', 'kyc', 'create', 'Créer des vérifications KYC'),
  ('4e5482e1-e06b-4a51-b44c-7e991b968e73', 'kyc:validate', 'kyc', 'validate', 'Valider les KYC'),
  ('9a0fd4bb-aa25-4627-9a9d-a411cd1cda52', 'dataset:read', 'dataset', 'read', 'Lire les datasets'),
  ('47ea51cf-5a3b-49b2-83b8-9963e6f7e6e8', 'dataset:create', 'dataset', 'create', 'Créer des datasets'),
  ('b75d7a18-9278-485f-8364-fbd74af10454', 'dataset:delete', 'dataset', 'delete', 'Supprimer des datasets'),
  ('f68ffc57-acc6-4afe-a2be-1f059f7e92de', 'user:read', 'user', 'read', 'Lire les utilisateurs'),
  ('73ba0275-c6d3-4c09-8099-218f25f287a4', 'user:create', 'user', 'create', 'Créer des utilisateurs'),
  ('4702184c-83ac-496e-aac7-25565ac1d83b', 'user:update', 'user', 'update', 'Modifier des utilisateurs'),
  ('c6989203-1162-4ac3-8860-fcd4eebc9d96', 'user:delete', 'user', 'delete', 'Supprimer des utilisateurs'),
  ('783564db-660d-4579-aa3a-b4ea5647f52a', 'settings:read', 'settings', 'read', 'Lire les paramètres'),
  ('ec0e413e-6e15-4bb9-91f4-849d96e67d82', 'settings:update', 'settings', 'update', 'Modifier les paramètres'),
  ('fbc33b57-f72f-4e50-aba3-744063f66eeb', 'billing:read', 'billing', 'read', 'Lire la facturation'),
  ('73fce654-786f-4e27-a7a3-ee7c99c09c9b', 'billing:manage', 'billing', 'manage', 'Gérer la facturation'),
  ('b3c13be1-4445-42a4-abb2-111290eb2131', 'api:manage', 'api', 'manage', 'Gérer les clés API'),
  ('d2328577-8176-4cb6-8a86-bdb1f2e1d080', 'webhook:manage', 'webhook', 'manage', 'Gérer les webhooks'),
  ('9fb49510-cd89-41f1-86a2-98fdef92e5e9', 'audit:read', 'audit', 'read', 'Lire les logs d''audit')
ON CONFLICT (id) DO NOTHING;

-- 10.3 Attribution des permissions aux rôles
-- SUPER_ADMIN - toutes les permissions
INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'SUPER_ADMIN'::app_role, id FROM public.permissions
ON CONFLICT DO NOTHING;

-- ANALYSTE - permissions limitées
INSERT INTO public.role_permissions (role, permission_id) VALUES
  ('ANALYSTE', '9e35d160-eb17-4ec7-9806-c37e6b5d13d0'),
  ('ANALYSTE', '6e58e7cd-2193-4031-8d32-94b0ee432b06'),
  ('ANALYSTE', '2c13383d-3976-458e-860a-5cf22c01add3'),
  ('ANALYSTE', '07da6c72-d83a-438e-90d3-c5baf3c564f8'),
  ('ANALYSTE', '4e5482e1-e06b-4a51-b44c-7e991b968e73'),
  ('ANALYSTE', '9a0fd4bb-aa25-4627-9a9d-a411cd1cda52'),
  ('ANALYSTE', 'f68ffc57-acc6-4afe-a2be-1f059f7e92de'),
  ('ANALYSTE', '9fb49510-cd89-41f1-86a2-98fdef92e5e9')
ON CONFLICT DO NOTHING;

-- ENTREPRISE - permissions partenaires
INSERT INTO public.role_permissions (role, permission_id) VALUES
  ('ENTREPRISE', '9e35d160-eb17-4ec7-9806-c37e6b5d13d0'),
  ('ENTREPRISE', '6e58e7cd-2193-4031-8d32-94b0ee432b06'),
  ('ENTREPRISE', '2c13383d-3976-458e-860a-5cf22c01add3'),
  ('ENTREPRISE', '9a0fd4bb-aa25-4627-9a9d-a411cd1cda52'),
  ('ENTREPRISE', '47ea51cf-5a3b-49b2-83b8-9963e6f7e6e8'),
  ('ENTREPRISE', 'fbc33b57-f72f-4e50-aba3-744063f66eeb'),
  ('ENTREPRISE', 'b3c13be1-4445-42a4-abb2-111290eb2131'),
  ('ENTREPRISE', 'd2328577-8176-4cb6-8a86-bdb1f2e1d080')
ON CONFLICT DO NOTHING;

-- PARTENAIRE - mêmes permissions que ENTREPRISE
INSERT INTO public.role_permissions (role, permission_id) VALUES
  ('PARTENAIRE', '9e35d160-eb17-4ec7-9806-c37e6b5d13d0'),
  ('PARTENAIRE', '6e58e7cd-2193-4031-8d32-94b0ee432b06'),
  ('PARTENAIRE', '2c13383d-3976-458e-860a-5cf22c01add3'),
  ('PARTENAIRE', '9a0fd4bb-aa25-4627-9a9d-a411cd1cda52'),
  ('PARTENAIRE', '47ea51cf-5a3b-49b2-83b8-9963e6f7e6e8'),
  ('PARTENAIRE', 'fbc33b57-f72f-4e50-aba3-744063f66eeb'),
  ('PARTENAIRE', 'b3c13be1-4445-42a4-abb2-111290eb2131'),
  ('PARTENAIRE', 'd2328577-8176-4cb6-8a86-bdb1f2e1d080')
ON CONFLICT DO NOTHING;

-- 10.4 Sources de données
INSERT INTO public.data_source_credentials (id, provider, source_type, display_name, sandbox_endpoint, is_sandbox, is_active, rate_limit_per_minute, supported_countries) VALUES
  ('fb23440c-0f15-4e29-8d89-d6bed55022c9', 'mtn_momo_ci', 'mobile_money', 'MTN Mobile Money', 'https://sandbox.momoapi.mtn.com', true, true, 60, ARRAY['CI', 'SN', 'ML', 'BF', 'TG', 'BJ', 'NE', 'GN']),
  ('8dff602e-c246-4ab3-b1aa-4d9acf234728', 'orange_money_ci', 'mobile_money', 'Orange Money', 'https://sandbox.orange-money.com', true, true, 60, ARRAY['CI', 'SN', 'ML', 'BF', 'TG', 'BJ', 'NE', 'GN']),
  ('aa39c5a4-e331-40f3-b837-70ba0d7d5200', 'wave_ci', 'mobile_money', 'Wave', 'https://sandbox.wave.com', true, true, 60, ARRAY['CI', 'SN', 'ML', 'BF', 'TG', 'BJ', 'NE', 'GN']),
  ('44d28792-2cea-4e7b-94be-5a67c4530170', 'mtn_telecom_ci', 'telecom', 'MTN Télécom Data', 'https://sandbox.mtn.ci', true, true, 60, ARRAY['CI', 'SN', 'ML', 'BF', 'TG', 'BJ', 'NE', 'GN']),
  ('8c731822-2ff4-42ae-bc38-cf628b7516ed', 'orange_telecom_ci', 'telecom', 'Orange Télécom Data', 'https://sandbox.orange.ci', true, true, 60, ARRAY['CI', 'SN', 'ML', 'BF', 'TG', 'BJ', 'NE', 'GN']),
  ('68e7d637-7287-4514-82aa-a776b5e7762c', 'rccm_ci', 'registry', 'Registre du Commerce (RCCM)', 'https://api.cepici.gouv.ci', true, true, 60, ARRAY['CI', 'SN', 'ML', 'BF', 'TG', 'BJ', 'NE', 'GN']),
  ('9ef5c47f-5d3d-43a0-99f2-f8cde7eeb5eb', 'cie_ci', 'utility', 'Compagnie Ivoirienne d''Électricité', 'https://api.cie.ci', true, true, 60, ARRAY['CI', 'SN', 'ML', 'BF', 'TG', 'BJ', 'NE', 'GN']),
  ('cf5363ea-3cba-49a4-9e41-e021b797a114', 'sodeci_ci', 'utility', 'SODECI (Eau)', 'https://api.sodeci.ci', true, true, 60, ARRAY['CI', 'SN', 'ML', 'BF', 'TG', 'BJ', 'NE', 'GN'])
ON CONFLICT (id) DO NOTHING;

-- 10.5 Produits marketplace de démo
INSERT INTO public.marketplace_products (id, provider_name, name, category, min_amount, max_amount, currency, interest_rate, duration_min_months, duration_max_months, min_score_required, features, countries, is_active, is_featured) VALUES
  ('6ccdef66-a94c-443c-8ff3-e17ae10e1b8d', 'Bank of Africa', 'Crédit PME Express', 'credit', 500000, 50000000, 'XOF', 8.50, 12, 60, 70, ARRAY['Déblocage sous 48h', 'Sans garantie jusqu''à 5M', 'Taux préférentiel'], ARRAY['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'], true, true),
  ('7f77f945-8cdd-4b15-b89e-baf9627e33b5', 'PAMECAS', 'Micro-Finance Agricole', 'microfinance', 100000, 10000000, 'XOF', 12.00, 6, 36, 60, ARRAY['Adapté aux cycles agricoles', 'Remboursement flexible', 'Accompagnement'], ARRAY['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'], true, false),
  ('c1aa63fb-8a4b-4e4a-a57e-80f0547854fb', 'Locafrique', 'Leasing Équipement', 'leasing', 1000000, 100000000, 'XOF', 10.00, 24, 84, 65, ARRAY['Financement à 100%', 'Option d''achat', 'Maintenance incluse'], ARRAY['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'], true, false),
  ('16ff1e98-f8bf-4c02-bdf7-e24c112fa00e', 'Ecobank', 'Crédit Commercial', 'credit', 1000000, 200000000, 'XOF', 9.50, 12, 72, 72, ARRAY['Ligne de crédit renouvelable', 'Multidevises', 'Conseil dédié'], ARRAY['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'], true, true),
  ('9bb99d37-61b1-4f68-a285-a0a30ef83bfe', 'BICIS', 'Financement Import/Export', 'trade', 5000000, 500000000, 'XOF', 7.50, 3, 24, 75, ARRAY['Lettre de crédit', 'Couverture de change', 'Réseau international'], ARRAY['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'], true, false),
  ('03f00db3-cc7e-44a4-9678-d516bac3597a', 'ACEP', 'Crédit Femmes Entrepreneures', 'microfinance', 50000, 5000000, 'XOF', 9.00, 6, 24, 55, ARRAY['Taux réduit', 'Formation incluse', 'Suivi personnalisé'], ARRAY['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'], true, true),
  ('ab249d25-f153-4567-8243-ff8468f67481', 'CNAAS', 'Assurance Récolte', 'insurance', 25000, 2000000, 'XOF', 5.00, 12, 12, 50, ARRAY['Protection climatique', 'Indemnisation rapide', 'Couverture complète'], ARRAY['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'], true, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SECTION 11: UTILISATEURS ACTUELS
-- ============================================

-- Note: Les utilisateurs doivent d'abord être créés dans auth.users
-- Ces inserts supposent que les utilisateurs existent déjà dans auth.users

-- Profils (insérer uniquement si l'utilisateur existe dans auth.users)
INSERT INTO public.profiles (id, email, full_name, phone, company, is_active, created_at, updated_at) VALUES
  ('c168da66-0ee8-47d5-bc41-7c32ba5e0fba', 'fofanay@gmail.com', 'Youssouf Fofana', '+14182645730', '', true, '2026-01-05 23:19:01.511+00', now()),
  ('b577fe1d-3a07-4bce-894d-15056db48052', 'yfofana@gmail.com', 'Evann Fofana', NULL, NULL, true, '2026-01-06 00:17:00.956183+00', now()),
  ('4f2115a1-0da6-46fd-bbe9-215d4c9a2d10', 'afribatim@gmail.com', 'Claudine KOUAKOU', NULL, NULL, true, '2026-01-06 15:00:18.756198+00', now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  company = EXCLUDED.company,
  updated_at = now();

-- Rôles utilisateurs
INSERT INTO public.user_roles (user_id, role, granted_at) VALUES
  ('c168da66-0ee8-47d5-bc41-7c32ba5e0fba', 'SUPER_ADMIN', '2026-01-05 23:19:01.511+00'),
  ('b577fe1d-3a07-4bce-894d-15056db48052', 'PARTENAIRE', '2026-01-06 00:17:00.956183+00'),
  ('4f2115a1-0da6-46fd-bbe9-215d4c9a2d10', 'PARTENAIRE', '2026-01-06 15:00:18.756198+00')
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- FIN DU SCRIPT D'INSTALLATION
-- ============================================

-- Vérification finale
DO $$
DECLARE
  table_count INTEGER;
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INSTALLATION WOUAKA TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables créées: %', table_count;
  RAISE NOTICE 'Politiques RLS: %', policy_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ÉTAPES SUIVANTES:';
  RAISE NOTICE '1. Configurez les secrets dans Vault';
  RAISE NOTICE '2. Déployez les Edge Functions';
  RAISE NOTICE '3. Créez les utilisateurs dans auth.users';
  RAISE NOTICE '========================================';
END $$;
