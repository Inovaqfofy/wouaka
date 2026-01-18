-- ============================================
-- MOBILE TRUST GRAPH - TABLES ADDITIONNELLES
-- ============================================

-- Table des factures utilitaires (CIE, Senelec, eau...)
CREATE TABLE IF NOT EXISTS public.user_utility_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT,
  utility_type TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  bill_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XOF',
  bill_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,
  payment_status TEXT DEFAULT 'unpaid',
  days_late INTEGER DEFAULT 0,
  source_type TEXT NOT NULL,
  source_confidence NUMERIC DEFAULT 0,
  is_certified BOOLEAN DEFAULT false,
  certified_at TIMESTAMPTZ,
  bill_reference TEXT,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_utility_bills_user ON public.user_utility_bills(user_id);
ALTER TABLE public.user_utility_bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own utility bills" ON public.user_utility_bills;
CREATE POLICY "Users can view own utility bills" ON public.user_utility_bills FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own utility bills" ON public.user_utility_bills;
CREATE POLICY "Users can insert own utility bills" ON public.user_utility_bills FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Score de confiance du numéro de téléphone
CREATE TABLE IF NOT EXISTS public.phone_trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  otp_verified BOOLEAN DEFAULT false,
  otp_verified_at TIMESTAMPTZ,
  ussd_screenshot_uploaded BOOLEAN DEFAULT false,
  ussd_name_extracted TEXT,
  ussd_verification_confidence NUMERIC DEFAULT 0,
  ussd_verified_at TIMESTAMPTZ,
  identity_cross_validated BOOLEAN DEFAULT false,
  identity_match_score NUMERIC DEFAULT 0,
  identity_validated_at TIMESTAMPTZ,
  sms_consent_given BOOLEAN DEFAULT false,
  sms_transactions_count INTEGER DEFAULT 0,
  sms_oldest_transaction TIMESTAMPTZ,
  sms_analyzed_at TIMESTAMPTZ,
  trust_score NUMERIC DEFAULT 0,
  trust_level TEXT DEFAULT 'unverified',
  certification_date TIMESTAMPTZ,
  phone_age_months INTEGER,
  activity_level TEXT,
  last_activity_date TIMESTAMPTZ,
  multiple_users_detected BOOLEAN DEFAULT false,
  fraud_flags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_trust_user ON public.phone_trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_trust_level ON public.phone_trust_scores(trust_level);
ALTER TABLE public.phone_trust_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own phone trust score" ON public.phone_trust_scores;
CREATE POLICY "Users can view own phone trust score" ON public.phone_trust_scores FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own phone trust score" ON public.phone_trust_scores;
CREATE POLICY "Users can manage own phone trust score" ON public.phone_trust_scores FOR ALL USING (auth.uid() = user_id);

-- USSD Screenshot Validations
CREATE TABLE IF NOT EXISTS public.ussd_screenshot_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  provider_detected TEXT,
  screen_type TEXT,
  extracted_name TEXT,
  extracted_phone TEXT,
  extracted_balance NUMERIC,
  extracted_account_status TEXT,
  ocr_confidence NUMERIC DEFAULT 0,
  tampering_probability NUMERIC DEFAULT 0,
  ui_authenticity_score NUMERIC DEFAULT 0,
  cni_name TEXT,
  name_match_score NUMERIC DEFAULT 0,
  is_name_match BOOLEAN DEFAULT false,
  validation_status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  image_hash TEXT,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ussd_validation_user ON public.ussd_screenshot_validations(user_id);
ALTER TABLE public.ussd_screenshot_validations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ussd validations" ON public.ussd_screenshot_validations;
CREATE POLICY "Users can view own ussd validations" ON public.ussd_screenshot_validations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own ussd validations" ON public.ussd_screenshot_validations;
CREATE POLICY "Users can insert own ussd validations" ON public.ussd_screenshot_validations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Data Source Certainty Coefficients
CREATE TABLE IF NOT EXISTS public.data_source_certainty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL UNIQUE,
  source_name TEXT NOT NULL,
  base_certainty NUMERIC NOT NULL,
  certified_certainty NUMERIC NOT NULL,
  certification_requirements JSONB DEFAULT '[]',
  examples JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.data_source_certainty ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read certainty coefficients" ON public.data_source_certainty;
CREATE POLICY "Anyone can read certainty coefficients" ON public.data_source_certainty FOR SELECT USING (true);

-- Insert default certainty coefficients (upsert)
INSERT INTO public.data_source_certainty (source_type, source_name, base_certainty, certified_certainty, certification_requirements) VALUES
  ('declared', 'Données déclaratives', 0.3, 0.5, '["identity_verified"]'),
  ('sms_parsed', 'SMS transactionnels parsés', 0.7, 0.9, '["phone_otp_verified", "provider_detected"]'),
  ('screenshot_ocr', 'Capture écran MoMo OCR', 0.6, 0.9, '["phone_otp_verified", "tampering_check_passed", "name_cross_validated"]'),
  ('document_ocr', 'Document scanné OCR', 0.7, 0.95, '["mrz_validated", "forgery_check_passed"]'),
  ('api_verified', 'API tierce vérifiée', 0.95, 1.0, '[]'),
  ('partner_feedback', 'Retour partenaire', 0.8, 0.95, '["loan_outcome_received"]'),
  ('utility_sms', 'SMS facture utilitaire', 0.65, 0.85, '["provider_shortcode_verified"]'),
  ('tontine_attestation', 'Attestation tontine', 0.5, 0.8, '["guarantor_verified"]')
ON CONFLICT (source_type) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  base_certainty = EXCLUDED.base_certainty,
  certified_certainty = EXCLUDED.certified_certainty;

-- Function to calculate phone trust score
CREATE OR REPLACE FUNCTION public.calculate_phone_trust_score(p_phone_number TEXT)
RETURNS NUMERIC AS $$
DECLARE
  v_score NUMERIC := 0;
  v_record RECORD;
BEGIN
  SELECT * INTO v_record FROM public.phone_trust_scores WHERE phone_number = p_phone_number LIMIT 1;
  IF NOT FOUND THEN RETURN 0; END IF;
  
  IF v_record.otp_verified THEN v_score := v_score + 20; END IF;
  IF v_record.ussd_verification_confidence >= 70 THEN v_score := v_score + 25;
  ELSIF v_record.ussd_screenshot_uploaded THEN v_score := v_score + 10; END IF;
  IF v_record.identity_cross_validated AND v_record.identity_match_score >= 85 THEN v_score := v_score + 30;
  ELSIF v_record.identity_match_score >= 70 THEN v_score := v_score + 15; END IF;
  IF v_record.sms_consent_given THEN
    IF v_record.sms_transactions_count >= 50 THEN v_score := v_score + 25;
    ELSIF v_record.sms_transactions_count >= 20 THEN v_score := v_score + 15;
    ELSIF v_record.sms_transactions_count >= 5 THEN v_score := v_score + 8; END IF;
  END IF;
  IF v_record.phone_age_months >= 24 THEN v_score := v_score + 10;
  ELSIF v_record.phone_age_months >= 12 THEN v_score := v_score + 5; END IF;
  IF v_record.multiple_users_detected THEN v_score := v_score - 40; END IF;
  
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_phone_trust_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_phone_trust_updated_at ON public.phone_trust_scores;
CREATE TRIGGER trigger_phone_trust_updated_at
  BEFORE UPDATE ON public.phone_trust_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_phone_trust_updated_at();

-- Fraud detection for duplicate phones
CREATE OR REPLACE FUNCTION public.check_phone_duplicate_users()
RETURNS TRIGGER AS $$
DECLARE v_existing_users INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO v_existing_users
  FROM public.phone_trust_scores
  WHERE phone_number = NEW.phone_number AND user_id != NEW.user_id;
  
  IF v_existing_users > 0 THEN
    NEW.multiple_users_detected := true;
    NEW.fraud_flags := COALESCE(NEW.fraud_flags, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('type', 'duplicate_phone_user', 'detected_at', now(), 'severity', 'critical', 'existing_users', v_existing_users)
    );
    INSERT INTO public.identity_fraud_risk (user_id, risk_type, risk_level, overall_risk_score, duplicate_identity_suspected, indicators)
    VALUES (NEW.user_id, 'phone_duplicate', 'critical', 95, true, jsonb_build_object('phone_number', NEW.phone_number, 'other_users_count', v_existing_users));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_check_phone_duplicate ON public.phone_trust_scores;
CREATE TRIGGER trigger_check_phone_duplicate
  BEFORE INSERT OR UPDATE ON public.phone_trust_scores
  FOR EACH ROW EXECUTE FUNCTION public.check_phone_duplicate_users();