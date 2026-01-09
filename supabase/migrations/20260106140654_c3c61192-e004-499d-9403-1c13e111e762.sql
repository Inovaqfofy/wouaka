-- ==============================================
-- PHASE 1: Tables pour l'enrichissement de données
-- ==============================================

-- Table pour stocker les consentements utilisateurs
CREATE TABLE IF NOT EXISTS public.data_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  phone_number TEXT NOT NULL,
  mobile_money_consent BOOLEAN DEFAULT false,
  telecom_consent BOOLEAN DEFAULT false,
  registry_consent BOOLEAN DEFAULT false,
  utility_consent BOOLEAN DEFAULT false,
  consent_given_at TIMESTAMPTZ DEFAULT NOW(),
  consent_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour stocker les données enrichies par source
CREATE TABLE IF NOT EXISTS public.data_enrichments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scoring_request_id UUID REFERENCES scoring_requests(id) ON DELETE CASCADE,
  consent_id UUID REFERENCES data_consents(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('mobile_money', 'telecom', 'registry', 'utility', 'identity')),
  source_provider TEXT NOT NULL,
  raw_data JSONB NOT NULL DEFAULT '{}',
  normalized_data JSONB,
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed', 'simulated')),
  is_simulated BOOLEAN DEFAULT false,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour gérer les credentials des partenaires API
CREATE TABLE IF NOT EXISTS public.data_source_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('mobile_money', 'telecom', 'registry', 'utility', 'identity')),
  api_endpoint TEXT,
  sandbox_endpoint TEXT,
  is_active BOOLEAN DEFAULT false,
  is_sandbox BOOLEAN DEFAULT true,
  rate_limit_per_minute INT DEFAULT 60,
  supported_countries TEXT[] DEFAULT ARRAY['CI', 'SN', 'ML', 'BF', 'TG', 'BJ', 'NE', 'GN'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_data_enrichments_scoring ON data_enrichments(scoring_request_id);
CREATE INDEX IF NOT EXISTS idx_data_enrichments_source ON data_enrichments(source_type, source_provider);
CREATE INDEX IF NOT EXISTS idx_data_consents_phone ON data_consents(phone_number);
CREATE INDEX IF NOT EXISTS idx_data_consents_session ON data_consents(session_id);

-- Enable RLS
ALTER TABLE public.data_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_enrichments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_source_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data_consents
CREATE POLICY "Users can view own consents" ON public.data_consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own consents" ON public.data_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for data_enrichments (via scoring_requests)
CREATE POLICY "Users can view enrichments for own scoring requests" ON public.data_enrichments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scoring_requests sr 
      WHERE sr.id = data_enrichments.scoring_request_id 
      AND sr.user_id = auth.uid()
    )
  );

-- RLS Policies for data_source_credentials (read-only for authenticated users)
CREATE POLICY "Authenticated users can view active data sources" ON public.data_source_credentials
  FOR SELECT USING (is_active = true);

-- Admin policy for data sources management
CREATE POLICY "Admins can manage data sources" ON public.data_source_credentials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'SUPER_ADMIN'
    )
  );

-- Insert initial data source providers (in sandbox mode)
INSERT INTO public.data_source_credentials (provider, display_name, source_type, sandbox_endpoint, is_active, is_sandbox) VALUES
('mtn_momo_ci', 'MTN Mobile Money', 'mobile_money', 'https://sandbox.momoapi.mtn.com', true, true),
('orange_money_ci', 'Orange Money', 'mobile_money', 'https://sandbox.orange-money.com', true, true),
('wave_ci', 'Wave', 'mobile_money', 'https://sandbox.wave.com', true, true),
('mtn_telecom_ci', 'MTN Télécom Data', 'telecom', 'https://sandbox.mtn.ci', true, true),
('orange_telecom_ci', 'Orange Télécom Data', 'telecom', 'https://sandbox.orange.ci', true, true),
('rccm_ci', 'Registre du Commerce (RCCM)', 'registry', 'https://api.cepici.gouv.ci', true, true),
('cie_ci', 'Compagnie Ivoirienne d''Électricité', 'utility', 'https://api.cie.ci', true, true),
('sodeci_ci', 'SODECI (Eau)', 'utility', 'https://api.sodeci.ci', true, true)
ON CONFLICT (provider) DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER update_data_source_credentials_updated_at
  BEFORE UPDATE ON public.data_source_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();