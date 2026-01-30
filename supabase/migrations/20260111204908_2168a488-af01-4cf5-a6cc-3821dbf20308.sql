-- Table pour les vérifications premium payantes (Smile ID)
CREATE TABLE public.premium_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  partner_id UUID REFERENCES public.profiles(id),
  customer_profile_id UUID REFERENCES public.customer_profiles(id),
  verification_type TEXT NOT NULL CHECK (verification_type IN ('smile_id_basic', 'smile_id_enhanced', 'smile_id_biometric')),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'XOF',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_transaction_id TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'processing', 'completed', 'failed')),
  smile_job_id TEXT,
  verification_result JSONB,
  identity_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_premium_verifications_partner ON public.premium_verifications(partner_id);
CREATE INDEX idx_premium_verifications_customer ON public.premium_verifications(customer_profile_id);
CREATE INDEX idx_premium_verifications_payment_status ON public.premium_verifications(payment_status);
CREATE INDEX idx_premium_verifications_verification_status ON public.premium_verifications(verification_status);

-- Trigger pour updated_at
CREATE TRIGGER update_premium_verifications_updated_at
  BEFORE UPDATE ON public.premium_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.premium_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Partners can view their own verifications
CREATE POLICY "Partners can view their verifications"
  ON public.premium_verifications
  FOR SELECT
  USING (partner_id = auth.uid());

-- Policy: Partners can create verifications
CREATE POLICY "Partners can create verifications"
  ON public.premium_verifications
  FOR INSERT
  WITH CHECK (partner_id = auth.uid());

-- Policy: Service role can do everything (for edge functions)
CREATE POLICY "Service role full access"
  ON public.premium_verifications
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');