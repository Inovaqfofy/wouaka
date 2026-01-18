-- ============================================
-- WOUAKA AUTOMATED EMAIL TRIGGERS
-- Triggers pour l'envoi automatique d'emails
-- ============================================

-- Function to send welcome email on profile creation
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call edge function to send welcome email
  PERFORM net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/send-automated-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
    ),
    body := jsonb_build_object(
      'template', 'welcome',
      'to', NEW.email,
      'data', jsonb_build_object(
        'fullName', COALESCE(NEW.full_name, 'Nouvel utilisateur'),
        'email', NEW.email
      ),
      'triggeredBy', 'db_trigger'
    )
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block the insert
  RAISE WARNING 'Failed to send welcome email: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Function to send KYC success email
CREATE OR REPLACE FUNCTION public.trigger_kyc_success_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
BEGIN
  -- Only trigger when validation_status changes to 'validated'
  IF NEW.validation_status = 'validated' AND (OLD.validation_status IS NULL OR OLD.validation_status != 'validated') THEN
    -- Get user info
    SELECT email, full_name INTO v_user_email, v_user_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    IF v_user_email IS NOT NULL THEN
      PERFORM net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/send-automated-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := jsonb_build_object(
          'template', 'kyc_success',
          'to', v_user_email,
          'data', jsonb_build_object(
            'fullName', COALESCE(v_user_name, 'Cher utilisateur'),
            'certificationLevel', COALESCE(NEW.plan_id, 'Standard'),
            'certificateId', SUBSTRING(NEW.id::TEXT FROM 1 FOR 16),
            'validUntil', TO_CHAR(NEW.valid_until, 'DD Mon YYYY')
          ),
          'triggeredBy', 'db_trigger'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send KYC success email: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Function to send score ready email
CREATE OR REPLACE FUNCTION public.trigger_score_ready_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
  v_previous_score INTEGER;
  v_trend TEXT;
BEGIN
  -- Only trigger when status is 'completed'
  IF NEW.status = 'completed' AND NEW.score IS NOT NULL THEN
    -- Get user info
    SELECT email, full_name INTO v_user_email, v_user_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Get previous score for trend
    SELECT score INTO v_previous_score
    FROM public.scoring_requests
    WHERE user_id = NEW.user_id AND id != NEW.id AND status = 'completed'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Determine trend
    IF v_previous_score IS NULL THEN
      v_trend := 'stable';
    ELSIF NEW.score > v_previous_score THEN
      v_trend := 'up';
    ELSIF NEW.score < v_previous_score THEN
      v_trend := 'down';
    ELSE
      v_trend := 'stable';
    END IF;
    
    IF v_user_email IS NOT NULL THEN
      PERFORM net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/send-automated-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := jsonb_build_object(
          'template', 'score_ready',
          'to', v_user_email,
          'data', jsonb_build_object(
            'fullName', COALESCE(v_user_name, 'Cher utilisateur'),
            'scoreValue', NEW.score,
            'scoreTrend', v_trend,
            'lastUpdate', TO_CHAR(NOW(), 'DD Mon YYYY à HH24:MI')
          ),
          'triggeredBy', 'db_trigger'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send score ready email: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Function to send security alert email on fraud detection
CREATE OR REPLACE FUNCTION public.trigger_security_alert_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
BEGIN
  -- Only trigger for high risk levels
  IF NEW.risk_level IN ('high', 'critical') AND NEW.overall_risk_score >= 60 THEN
    -- Get user info
    SELECT email, full_name INTO v_user_email, v_user_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    IF v_user_email IS NOT NULL THEN
      PERFORM net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/send-automated-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := jsonb_build_object(
          'template', 'security_alert',
          'to', v_user_email,
          'data', jsonb_build_object(
            'fullName', COALESCE(v_user_name, 'Cher utilisateur'),
            'alertType', 'suspicious_activity',
            'ipAddress', COALESCE((NEW.indicators->>'ip_address')::TEXT, '0.0.0.0'),
            'location', (NEW.indicators->>'location')::TEXT,
            'timestamp', TO_CHAR(NEW.created_at, 'DD Mon YYYY à HH24:MI')
          ),
          'triggeredBy', 'db_trigger'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send security alert email: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Note: Triggers are not created automatically because:
-- 1. The net.http_post extension may not be available
-- 2. Vault access requires specific configuration
-- 
-- The edge function can be called directly from the application code instead.
-- Example usage in frontend:
-- await supabase.functions.invoke('send-automated-email', {
--   body: { template: 'welcome', to: email, data: { fullName, email } }
-- })

-- Create a simple log table for email tracking
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template TEXT NOT NULL,
  recipient_email_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resend_id TEXT,
  triggered_by TEXT DEFAULT 'api',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view email logs
CREATE POLICY "Admins can view email logs"
ON public.email_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'SUPER_ADMIN'
  )
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON public.email_logs(template);

COMMENT ON TABLE public.email_logs IS 'Logs for automated email sending (privacy-safe: only hashed emails)';
