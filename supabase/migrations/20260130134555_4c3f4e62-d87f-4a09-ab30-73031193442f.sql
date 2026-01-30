-- ============================================
-- MIGRATION: FIX PERMISSIVE RLS POLICIES
-- ============================================

-- 1. borrower_credits - Remove permissive policies
DROP POLICY IF EXISTS "System can insert credits" ON public.borrower_credits;
DROP POLICY IF EXISTS "System can update credits" ON public.borrower_credits;

-- Replace with user-scoped policies
CREATE POLICY "Users can insert their own credits"
  ON public.borrower_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON public.borrower_credits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. compliance_logs - Remove permissive insert
DROP POLICY IF EXISTS "System can create compliance logs" ON public.compliance_logs;

-- Block direct client inserts (edge functions use service role)
CREATE POLICY "No direct compliance log insert"
  ON public.compliance_logs FOR INSERT
  WITH CHECK (false);

-- 3. invoices - Remove permissive insert
DROP POLICY IF EXISTS "Service role can insert invoices" ON public.invoices;

-- Keep existing admin policy for inserts, but verify it works
-- Super admins can insert invoices is already secure

-- 4. learning_metrics - Remove permissive insert
DROP POLICY IF EXISTS "System can insert learning metrics" ON public.learning_metrics;

CREATE POLICY "No direct learning metrics insert"
  ON public.learning_metrics FOR INSERT
  WITH CHECK (false);

-- 5. loan_applications - Remove the "Anyone can create" policy
DROP POLICY IF EXISTS "Anyone can create loan applications" ON public.loan_applications;

-- "Borrowers can create own applications" already exists and is secure

-- 6. logs - Remove permissive insert
DROP POLICY IF EXISTS "Allow insert" ON public.logs;

CREATE POLICY "Admins can insert logs"
  ON public.logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- 7. screenshot_analyses - Remove permissive insert
DROP POLICY IF EXISTS "System can insert screenshot analyses" ON public.screenshot_analyses;

CREATE POLICY "Users can insert own screenshot analyses"
  ON public.screenshot_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 8. sms_analyses - Remove permissive insert
DROP POLICY IF EXISTS "System can insert sms analyses" ON public.sms_analyses;

CREATE POLICY "Users can insert own sms analyses"
  ON public.sms_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 9. user_welcome_tasks - Remove permissive insert/update
DROP POLICY IF EXISTS "System can insert welcome tasks" ON public.user_welcome_tasks;
DROP POLICY IF EXISTS "System can update welcome tasks" ON public.user_welcome_tasks;

-- These should only be created by the trigger (service role)
CREATE POLICY "No direct welcome task insert"
  ON public.user_welcome_tasks FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct welcome task update"
  ON public.user_welcome_tasks FOR UPDATE
  USING (false);

-- ============================================
-- FIX FUNCTIONS WITHOUT search_path
-- ============================================

CREATE OR REPLACE FUNCTION public.check_borrower_credits(p_user_id uuid, p_credit_type text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.check_phone_duplicate_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- ============================================
-- CREATE EXTENSIONS SCHEMA FOR FUTURE USE
-- ============================================

CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;