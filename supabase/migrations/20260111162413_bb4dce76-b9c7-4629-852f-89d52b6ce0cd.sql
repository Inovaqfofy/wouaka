-- =====================================================
-- MIGRATION: Corrections Enterprise Dashboard B2B
-- =====================================================

-- 1. Table kyc_requests pour le modèle B2B (partenaire vérifie ses clients)
CREATE TABLE public.kyc_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_profile_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
  
  -- Client info (peut être rempli avant création du profil client)
  full_name TEXT NOT NULL,
  phone_number TEXT,
  national_id TEXT,
  
  -- Status and results
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'verified', 'review', 'rejected')),
  identity_score INTEGER,
  fraud_score INTEGER,
  documents_submitted INTEGER DEFAULT 0,
  documents_verified INTEGER DEFAULT 0,
  
  -- Risk indicators
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_flags TEXT[],
  
  -- Processing info
  processing_time_ms INTEGER,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.kyc_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour kyc_requests
CREATE POLICY "Partners can view their own KYC requests"
  ON public.kyc_requests FOR SELECT
  USING (auth.uid() = partner_id);

CREATE POLICY "Partners can create KYC requests"
  ON public.kyc_requests FOR INSERT
  WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Partners can update their own KYC requests"
  ON public.kyc_requests FOR UPDATE
  USING (auth.uid() = partner_id);

-- 2. Table document_submission_tokens pour liens de soumission sécurisés
CREATE TABLE public.document_submission_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kyc_request_id UUID REFERENCES public.kyc_requests(id) ON DELETE CASCADE,
  customer_profile_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
  
  -- Client info pour le lien
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  
  -- Token status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
  
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.document_submission_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour document_submission_tokens
CREATE POLICY "Partners can manage their submission tokens"
  ON public.document_submission_tokens FOR ALL
  USING (auth.uid() = partner_id);

-- Politique publique pour lire un token valide (pour la page publique de soumission)
CREATE POLICY "Anyone can read valid tokens"
  ON public.document_submission_tokens FOR SELECT
  USING (
    status = 'active' 
    AND expires_at > NOW()
  );

-- 3. Table marketplace_products pour les produits financiers
CREATE TABLE public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Institution qui propose le produit
  
  -- Product info
  name TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('credit', 'microfinance', 'leasing', 'trade', 'insurance', 'savings')),
  
  -- Financial terms
  interest_rate DECIMAL(5,2),
  min_amount DECIMAL(15,2),
  max_amount DECIMAL(15,2),
  currency TEXT DEFAULT 'XOF',
  duration_min_months INTEGER,
  duration_max_months INTEGER,
  
  -- Eligibility
  min_score_required INTEGER DEFAULT 50,
  countries TEXT[] DEFAULT ARRAY['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'],
  
  -- Features and conditions
  features TEXT[],
  requirements TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour marketplace_products (lecture publique pour les partenaires)
CREATE POLICY "Authenticated users can view active marketplace products"
  ON public.marketplace_products FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Providers can manage their products"
  ON public.marketplace_products FOR ALL
  USING (auth.uid() = provider_id);

-- Trigger pour updated_at
CREATE TRIGGER update_kyc_requests_updated_at
  BEFORE UPDATE ON public.kyc_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_products_updated_at
  BEFORE UPDATE ON public.marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Insérer des produits marketplace de base (données réelles UEMOA)
INSERT INTO public.marketplace_products (name, provider_name, category, interest_rate, min_amount, max_amount, duration_min_months, duration_max_months, min_score_required, features, is_featured) VALUES
('Crédit PME Express', 'Bank of Africa', 'credit', 8.50, 500000, 50000000, 12, 60, 70, ARRAY['Déblocage sous 48h', 'Sans garantie jusqu''à 5M', 'Taux préférentiel'], true),
('Micro-Finance Agricole', 'PAMECAS', 'microfinance', 12.00, 100000, 10000000, 6, 36, 60, ARRAY['Adapté aux cycles agricoles', 'Remboursement flexible', 'Accompagnement'], false),
('Leasing Équipement', 'Locafrique', 'leasing', 10.00, 1000000, 100000000, 24, 84, 65, ARRAY['Financement à 100%', 'Option d''achat', 'Maintenance incluse'], false),
('Crédit Commercial', 'Ecobank', 'credit', 9.50, 1000000, 200000000, 12, 72, 72, ARRAY['Ligne de crédit renouvelable', 'Multidevises', 'Conseil dédié'], true),
('Financement Import/Export', 'BICIS', 'trade', 7.50, 5000000, 500000000, 3, 24, 75, ARRAY['Lettre de crédit', 'Couverture de change', 'Réseau international'], false),
('Crédit Femmes Entrepreneures', 'ACEP', 'microfinance', 9.00, 50000, 5000000, 6, 24, 55, ARRAY['Taux réduit', 'Formation incluse', 'Suivi personnalisé'], true),
('Assurance Récolte', 'CNAAS', 'insurance', 5.00, 25000, 2000000, 12, 12, 50, ARRAY['Protection climatique', 'Indemnisation rapide', 'Couverture complète'], false);