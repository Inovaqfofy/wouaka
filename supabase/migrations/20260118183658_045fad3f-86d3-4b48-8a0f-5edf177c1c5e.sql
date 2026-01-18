-- =========================================
-- Phase 2.5: Sécuriser les fonctions SQL
-- =========================================

-- Recréer les fonctions avec search_path sécurisé

-- 1. calculate_phone_trust_score (si elle existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_phone_trust_score') THEN
    EXECUTE 'ALTER FUNCTION public.calculate_phone_trust_score SET search_path = public';
  END IF;
END $$;

-- 2. check_borrower_credits
CREATE OR REPLACE FUNCTION public.check_borrower_credits(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_credits integer;
BEGIN
  SELECT COALESCE(SUM(credits_available - credits_used), 0)
  INTO total_credits
  FROM public.borrower_credits
  WHERE user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > now());
  
  RETURN total_credits;
END;
$$;

-- 3. consume_borrower_credit
CREATE OR REPLACE FUNCTION public.consume_borrower_credit(p_user_id uuid, p_credit_type text DEFAULT 'any')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  credit_record RECORD;
BEGIN
  -- Find an available credit
  SELECT id, credits_available, credits_used
  INTO credit_record
  FROM public.borrower_credits
  WHERE user_id = p_user_id
    AND credits_available > credits_used
    AND (expires_at IS NULL OR expires_at > now())
    AND (p_credit_type = 'any' OR credit_type = p_credit_type)
  ORDER BY expires_at ASC NULLS LAST
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Consume one credit
  UPDATE public.borrower_credits
  SET credits_used = credits_used + 1,
      updated_at = now()
  WHERE id = credit_record.id;

  RETURN true;
END;
$$;

-- 4. generate_share_code
CREATE OR REPLACE FUNCTION public.generate_share_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- 5. update_borrower_credits_updated_at
CREATE OR REPLACE FUNCTION public.update_borrower_credits_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 6. update_loan_applications_updated_at
CREATE OR REPLACE FUNCTION public.update_loan_applications_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 7. update_phone_trust_updated_at (si elle existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_phone_trust_updated_at') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.update_phone_trust_updated_at()
      RETURNS trigger
      LANGUAGE plpgsql
      SET search_path = public
      AS $func$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $func$';
  END IF;
END $$;

-- =========================================
-- Phase 2.6: Nettoyer les plans orphelins
-- =========================================

-- Désactiver les plans sans slug (doublons)
UPDATE public.subscription_plans 
SET is_active = false, 
    updated_at = now()
WHERE slug IS NULL 
  AND is_active = true;

-- Log de l'opération
INSERT INTO public.audit_logs (action, entity_type, metadata, ip_address)
VALUES (
  'security_migration_applied',
  'system',
  jsonb_build_object(
    'migration', 'production_readiness_fixes',
    'functions_secured', ARRAY['check_borrower_credits', 'consume_borrower_credit', 'generate_share_code', 'update_borrower_credits_updated_at', 'update_loan_applications_updated_at'],
    'orphan_plans_disabled', true
  ),
  '0.0.0.0'::inet
);