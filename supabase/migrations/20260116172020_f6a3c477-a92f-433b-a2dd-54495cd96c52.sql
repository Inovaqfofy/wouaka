-- Phase 5: Fraud alert trigger for real-time notifications
-- Creates a trigger that automatically notifies admins when high fraud scores are detected

-- Function to create fraud alert notification
CREATE OR REPLACE FUNCTION public.notify_fraud_alert()
RETURNS TRIGGER AS $$
DECLARE
  admin_ids uuid[];
BEGIN
  -- Only trigger for high fraud scores
  IF NEW.overall_risk_score >= 70 OR NEW.risk_level = 'high' OR NEW.risk_level = 'critical' THEN
    -- Get all admin user IDs
    SELECT ARRAY_AGG(id) INTO admin_ids
    FROM public.profiles
    WHERE role = 'admin';
    
    -- Create notification for each admin
    IF admin_ids IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, priority, metadata)
      SELECT 
        unnest(admin_ids),
        'fraud_alert',
        'Alerte Fraude Détectée',
        'Score de risque: ' || NEW.overall_risk_score || '% - Type: ' || NEW.risk_type,
        'high',
        jsonb_build_object(
          'fraud_risk_id', NEW.id,
          'user_id', NEW.user_id,
          'risk_type', NEW.risk_type,
          'risk_level', NEW.risk_level,
          'overall_risk_score', NEW.overall_risk_score,
          'detected_at', NEW.created_at
        );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on identity_fraud_risk table
DROP TRIGGER IF EXISTS trigger_fraud_alert ON public.identity_fraud_risk;
CREATE TRIGGER trigger_fraud_alert
  AFTER INSERT ON public.identity_fraud_risk
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_fraud_alert();

-- Add consent_id to scoring_requests if not exists (for consent filtering)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'scoring_requests' 
    AND column_name = 'consent_id'
  ) THEN
    ALTER TABLE public.scoring_requests 
    ADD COLUMN consent_id uuid REFERENCES public.data_consents(id);
  END IF;
END $$;

-- Index for consent-based filtering
CREATE INDEX IF NOT EXISTS idx_scoring_requests_consent_id ON public.scoring_requests(consent_id);

-- Add phone_age_months to phone_trust_scores if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'phone_trust_scores' 
    AND column_name = 'phone_age_months'
  ) THEN
    ALTER TABLE public.phone_trust_scores 
    ADD COLUMN phone_age_months integer;
  END IF;
END $$;

-- Add activity_level to phone_trust_scores if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'phone_trust_scores' 
    AND column_name = 'activity_level'
  ) THEN
    ALTER TABLE public.phone_trust_scores 
    ADD COLUMN activity_level text DEFAULT 'unknown';
  END IF;
END $$;

-- Add last_activity_date to phone_trust_scores if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'phone_trust_scores' 
    AND column_name = 'last_activity_date'
  ) THEN
    ALTER TABLE public.phone_trust_scores 
    ADD COLUMN last_activity_date timestamptz;
  END IF;
END $$;