-- Table des crédits emprunteur
CREATE TABLE public.borrower_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credit_type TEXT NOT NULL CHECK (credit_type IN ('score', 'kyc_basic', 'kyc_enhanced', 'bundle')),
  credits_available INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  source TEXT NOT NULL CHECK (source IN ('purchase', 'promo', 'partner_gift', 'referral')),
  payment_transaction_id UUID REFERENCES public.payment_transactions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_borrower_credits_user ON public.borrower_credits(user_id);
CREATE INDEX idx_borrower_credits_type ON public.borrower_credits(user_id, credit_type);
CREATE INDEX idx_borrower_credits_available ON public.borrower_credits(user_id, credit_type) WHERE credits_available > 0;

-- Table des résultats partagés
CREATE TABLE public.borrower_shared_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id UUID NOT NULL,
  result_type TEXT NOT NULL CHECK (result_type IN ('score', 'kyc')),
  result_id UUID NOT NULL,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  shared_with_partner_id UUID REFERENCES public.profiles(id),
  shared_with_email TEXT,
  is_accessed BOOLEAN DEFAULT FALSE,
  accessed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les tokens de partage
CREATE INDEX idx_shared_results_token ON public.borrower_shared_results(share_token);
CREATE INDEX idx_shared_results_borrower ON public.borrower_shared_results(borrower_id);

-- Enable RLS
ALTER TABLE public.borrower_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrower_shared_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for borrower_credits
CREATE POLICY "Users can view their own credits"
ON public.borrower_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert credits"
ON public.borrower_credits FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update credits"
ON public.borrower_credits FOR UPDATE
USING (true);

-- RLS Policies for borrower_shared_results
CREATE POLICY "Borrowers can view their own shared results"
ON public.borrower_shared_results FOR SELECT
USING (auth.uid() = borrower_id);

CREATE POLICY "Borrowers can create shared results"
ON public.borrower_shared_results FOR INSERT
WITH CHECK (auth.uid() = borrower_id);

CREATE POLICY "Borrowers can update their own shared results"
ON public.borrower_shared_results FOR UPDATE
USING (auth.uid() = borrower_id);

CREATE POLICY "Anyone can view shared results by token"
ON public.borrower_shared_results FOR SELECT
USING (share_token IS NOT NULL);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_borrower_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for borrower_credits
CREATE TRIGGER update_borrower_credits_timestamp
BEFORE UPDATE ON public.borrower_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_borrower_credits_updated_at();

-- Function to consume a credit
CREATE OR REPLACE FUNCTION public.consume_borrower_credit(
  p_user_id UUID,
  p_credit_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_credit_id UUID;
BEGIN
  -- Find an available credit (not expired, has credits)
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

  -- Consume the credit
  UPDATE public.borrower_credits
  SET credits_available = credits_available - 1,
      credits_used = credits_used + 1
  WHERE id = v_credit_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check available credits
CREATE OR REPLACE FUNCTION public.check_borrower_credits(
  p_user_id UUID,
  p_credit_type TEXT
) RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;