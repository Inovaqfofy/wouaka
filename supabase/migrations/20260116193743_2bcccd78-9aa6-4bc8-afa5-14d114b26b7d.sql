-- Ajouter validation institutionnelle aux certificats
ALTER TABLE public.certificates 
  ADD COLUMN IF NOT EXISTS validated_by_partner_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS validation_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'unvalidated';

-- Contrainte sur validation_status
ALTER TABLE public.certificates
  ADD CONSTRAINT certificates_validation_status_check 
  CHECK (validation_status IN ('unvalidated', 'validated', 'rejected'));

-- Tracker les partages dans les subscriptions
ALTER TABLE public.certificate_subscriptions
  ADD COLUMN IF NOT EXISTS shares_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_free_shares INTEGER;

-- Table des partages pour audit et contrôle
CREATE TABLE IF NOT EXISTS public.certificate_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT,
  shared_with_partner_id UUID REFERENCES public.profiles(id),
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_paid BOOLEAN DEFAULT FALSE,
  amount_paid INTEGER DEFAULT 0,
  accessed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_certificate_shares_token ON public.certificate_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_certificate_shares_certificate ON public.certificate_shares(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificate_shares_user ON public.certificate_shares(user_id);

-- RLS pour certificate_shares
ALTER TABLE public.certificate_shares ENABLE ROW LEVEL SECURITY;

-- Les emprunteurs peuvent voir leurs propres partages
CREATE POLICY "Users can view own shares"
  ON public.certificate_shares FOR SELECT
  USING (auth.uid() = user_id);

-- Les emprunteurs peuvent créer des partages pour leurs certificats
CREATE POLICY "Users can create shares for own certificates"
  ON public.certificate_shares FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.certificates c WHERE c.id = certificate_id AND c.user_id = auth.uid())
  );

-- Les partenaires peuvent voir les partages qui leur sont destinés
CREATE POLICY "Partners can view shares addressed to them"
  ON public.certificate_shares FOR SELECT
  USING (shared_with_partner_id = auth.uid());

-- Accès public pour vérifier un token de partage (lecture seule)
CREATE POLICY "Anyone can verify share token"
  ON public.certificate_shares FOR SELECT
  USING (share_token IS NOT NULL);

-- Function pour consommer un partage
CREATE OR REPLACE FUNCTION public.consume_share_quota(p_user_id UUID, p_certificate_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_subscription RECORD;
  v_shares_remaining INTEGER;
  v_must_pay BOOLEAN := FALSE;
  v_share_price INTEGER := 0;
BEGIN
  -- Récupérer la subscription active
  SELECT cs.*, bp.share_price
  INTO v_subscription
  FROM public.certificate_subscriptions cs
  LEFT JOIN LATERAL (
    SELECT 
      CASE cs.plan_id
        WHEN 'emprunteur-decouverte' THEN 500
        WHEN 'emprunteur-essentiel' THEN 300
        WHEN 'emprunteur-premium' THEN 0
        ELSE 500
      END as share_price
  ) bp ON true
  WHERE cs.user_id = p_user_id
    AND cs.status = 'active'
    AND cs.valid_until > NOW()
  ORDER BY cs.valid_until DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_active_subscription');
  END IF;

  -- Calculer les partages restants
  IF v_subscription.max_free_shares IS NULL THEN
    -- Illimité (Premium)
    v_shares_remaining := -1;
  ELSE
    v_shares_remaining := v_subscription.max_free_shares - COALESCE(v_subscription.shares_used, 0);
  END IF;

  -- Si pas de partages gratuits restants
  IF v_shares_remaining = 0 THEN
    v_must_pay := TRUE;
    v_share_price := v_subscription.share_price;
  END IF;

  -- Incrémenter le compteur si partage gratuit
  IF NOT v_must_pay AND v_shares_remaining != -1 THEN
    UPDATE public.certificate_subscriptions
    SET shares_used = COALESCE(shares_used, 0) + 1
    WHERE id = v_subscription.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'must_pay', v_must_pay,
    'share_price', v_share_price,
    'shares_remaining', CASE WHEN v_shares_remaining = -1 THEN NULL ELSE GREATEST(0, v_shares_remaining - 1) END
  );
END;
$$;