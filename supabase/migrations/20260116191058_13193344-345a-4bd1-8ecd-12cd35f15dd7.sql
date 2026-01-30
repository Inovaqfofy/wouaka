-- Nettoyage des objets partiellement créés
DROP TABLE IF EXISTS public.certificate_subscriptions CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP FUNCTION IF EXISTS public.get_active_certificate(UUID);
DROP FUNCTION IF EXISTS public.check_recertifications_available(UUID);
DROP FUNCTION IF EXISTS public.consume_recertification(UUID, UUID);

-- =====================================================
-- PHASE 1: Création table certificates et adaptation du modèle
-- =====================================================

-- Table des certificats de solvabilité
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  
  -- Données du score au moment de la certification
  score INTEGER CHECK (score >= 0 AND score <= 100),
  certainty_coefficient NUMERIC(3,2) CHECK (certainty_coefficient >= 0 AND certainty_coefficient <= 1),
  trust_level TEXT CHECK (trust_level IN ('insufficient', 'basic', 'verified', 'strong', 'certified')),
  
  -- Preuves utilisées pour ce certificat
  proofs_snapshot JSONB DEFAULT '{}',
  
  -- Validité
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Recertification
  recertification_of UUID REFERENCES public.certificates(id),
  recertification_number INTEGER DEFAULT 0,
  
  -- Smile ID
  smile_id_verification_id UUID,
  smile_id_level TEXT CHECK (smile_id_level IN ('none', 'basic', 'biometric')),
  
  -- Code de partage unique pour les partenaires
  share_code TEXT UNIQUE,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des abonnements certificat
CREATE TABLE public.certificate_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  
  -- Validité de l'abonnement
  validity_days INTEGER NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Recertifications
  recertifications_total INTEGER, -- null = illimité
  recertifications_used INTEGER DEFAULT 0,
  
  -- Smile ID inclus
  smile_id_level TEXT CHECK (smile_id_level IN ('none', 'basic', 'biometric')) DEFAULT 'none',
  
  -- Certificat actif
  current_certificate_id UUID REFERENCES public.certificates(id),
  
  -- Paiement
  payment_transaction_id TEXT,
  amount_paid INTEGER NOT NULL,
  
  -- Source
  source TEXT CHECK (source IN ('purchase', 'promo', 'referral', 'migration')) DEFAULT 'purchase',
  
  -- Statut
  status TEXT CHECK (status IN ('pending', 'active', 'expired', 'cancelled')) DEFAULT 'pending',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX idx_certificates_valid_until ON public.certificates(valid_until);
CREATE INDEX idx_certificates_user_valid ON public.certificates(user_id, valid_until DESC);
CREATE INDEX idx_certificates_share_code ON public.certificates(share_code);
CREATE INDEX idx_certificate_subscriptions_user_id ON public.certificate_subscriptions(user_id);
CREATE INDEX idx_certificate_subscriptions_status ON public.certificate_subscriptions(status);
CREATE INDEX idx_certificate_subscriptions_user_status ON public.certificate_subscriptions(user_id, status);

-- Trigger pour updated_at
CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certificate_subscriptions_updated_at
  BEFORE UPDATE ON public.certificate_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies pour certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Les emprunteurs voient leurs propres certificats
CREATE POLICY "Users can view their own certificates"
  ON public.certificates FOR SELECT
  USING (auth.uid() = user_id);

-- Les emprunteurs peuvent créer leurs certificats
CREATE POLICY "Users can insert their own certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les emprunteurs peuvent mettre à jour leurs certificats
CREATE POLICY "Users can update their own certificates"
  ON public.certificates FOR UPDATE
  USING (auth.uid() = user_id);

-- Les partenaires peuvent voir les certificats via share_code (accès public pour le partage)
CREATE POLICY "Anyone can view certificates by share_code"
  ON public.certificates FOR SELECT
  USING (share_code IS NOT NULL);

-- RLS Policies pour certificate_subscriptions
ALTER TABLE public.certificate_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.certificate_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.certificate_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.certificate_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Fonction pour obtenir le certificat actif d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_active_certificate(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  plan_id TEXT,
  score INTEGER,
  certainty_coefficient NUMERIC,
  trust_level TEXT,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  days_remaining INTEGER,
  is_expired BOOLEAN,
  share_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.plan_id,
    c.score,
    c.certainty_coefficient,
    c.trust_level,
    c.valid_from,
    c.valid_until,
    GREATEST(0, EXTRACT(DAY FROM (c.valid_until - NOW()))::INTEGER) as days_remaining,
    c.valid_until < NOW() as is_expired,
    c.share_code
  FROM public.certificates c
  WHERE c.user_id = p_user_id
  ORDER BY c.valid_until DESC
  LIMIT 1;
END;
$$;

-- Fonction pour vérifier les recertifications disponibles
CREATE OR REPLACE FUNCTION public.check_recertifications_available(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  recertifications_remaining INTEGER,
  can_recertify BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id as subscription_id,
    CASE 
      WHEN cs.recertifications_total IS NULL THEN -1 -- illimité
      ELSE cs.recertifications_total - cs.recertifications_used
    END as recertifications_remaining,
    CASE
      WHEN cs.recertifications_total IS NULL THEN TRUE
      ELSE (cs.recertifications_total - cs.recertifications_used) > 0
    END as can_recertify
  FROM public.certificate_subscriptions cs
  WHERE cs.user_id = p_user_id
    AND cs.status = 'active'
    AND cs.valid_until > NOW()
  ORDER BY cs.valid_until DESC
  LIMIT 1;
END;
$$;

-- Fonction pour consommer une recertification
CREATE OR REPLACE FUNCTION public.consume_recertification(p_user_id UUID, p_subscription_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_can_recertify BOOLEAN;
BEGIN
  SELECT 
    CASE
      WHEN cs.recertifications_total IS NULL THEN TRUE
      ELSE (cs.recertifications_total - cs.recertifications_used) > 0
    END INTO v_can_recertify
  FROM public.certificate_subscriptions cs
  WHERE cs.id = p_subscription_id
    AND cs.user_id = p_user_id
    AND cs.status = 'active'
    AND cs.valid_until > NOW()
  FOR UPDATE;

  IF NOT FOUND OR NOT v_can_recertify THEN
    RETURN FALSE;
  END IF;

  UPDATE public.certificate_subscriptions
  SET recertifications_used = recertifications_used + 1
  WHERE id = p_subscription_id;

  RETURN TRUE;
END;
$$;

-- Fonction pour générer un code de partage unique
CREATE OR REPLACE FUNCTION public.generate_share_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer un code de 8 caractères
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    
    -- Vérifier l'unicité
    SELECT EXISTS(SELECT 1 FROM public.certificates WHERE share_code = v_code) INTO v_exists;
    
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$;