-- ============================================
-- KILL SWITCH / EMERGENCY CONTROL SYSTEM
-- ============================================

-- Table de contrôle des fonctionnalités système
CREATE TABLE IF NOT EXISTS public.system_security_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  restricted_to_roles TEXT[] DEFAULT ARRAY['SUPER_ADMIN']::TEXT[],
  emergency_message TEXT DEFAULT 'Service temporairement indisponible pour maintenance de sécurité.',
  last_toggled_at TIMESTAMP WITH TIME ZONE,
  toggled_by UUID REFERENCES auth.users(id),
  auto_disabled_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour le mode global du système
CREATE TABLE IF NOT EXISTS public.system_lockdown_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_full_lockdown BOOLEAN DEFAULT false,
  is_read_only_mode BOOLEAN DEFAULT false,
  lockdown_reason TEXT,
  lockdown_message TEXT DEFAULT 'Maintenance de sécurité en cours. Les services reprendront sous peu.',
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by UUID REFERENCES auth.users(id),
  auto_triggered BOOLEAN DEFAULT false,
  trigger_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour l'historique des actions d'urgence
CREATE TABLE IF NOT EXISTS public.emergency_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL, -- 'lockdown', 'unlock', 'feature_disable', 'feature_enable', 'integrity_check'
  feature_name TEXT,
  performed_by UUID REFERENCES auth.users(id),
  auto_triggered BOOLEAN DEFAULT false,
  trigger_reason TEXT,
  details JSONB DEFAULT '{}'::JSONB,
  integrity_check_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour le cache des vérifications d'intégrité
CREATE TABLE IF NOT EXISTS public.integrity_check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL, -- 'pre_unlock', 'periodic', 'manual'
  time_window_minutes INTEGER DEFAULT 10,
  transactions_checked INTEGER DEFAULT 0,
  anomalies_found INTEGER DEFAULT 0,
  suspicious_entries JSONB DEFAULT '[]'::JSONB,
  passed BOOLEAN DEFAULT false,
  checked_by UUID REFERENCES auth.users(id),
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trigger pour updated_at
CREATE TRIGGER update_system_security_controls_updated_at
  BEFORE UPDATE ON public.system_security_controls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_lockdown_state_updated_at
  BEFORE UPDATE ON public.system_lockdown_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default feature controls
INSERT INTO public.system_security_controls (feature_name, display_name, description, is_active) VALUES
  ('external_api_scoring', 'API Scoring Externe', 'Endpoint /wouaka-score pour partenaires API', true),
  ('kyc_processing', 'Traitement KYC', 'Validation d''identité et vérification documentaire', true),
  ('momo_sms_extraction', 'Extraction MoMo/SMS', 'Analyse des captures d''écran et SMS', true),
  ('webhook_delivery', 'Livraison Webhooks', 'Envoi des notifications aux partenaires', true),
  ('new_user_registration', 'Nouvelles Inscriptions', 'Création de nouveaux comptes utilisateurs', true),
  ('payment_processing', 'Traitement Paiements', 'CinetPay et transactions financières', true)
ON CONFLICT (feature_name) DO NOTHING;

-- Insert default lockdown state (single row)
INSERT INTO public.system_lockdown_state (id, is_full_lockdown, is_read_only_mode)
VALUES ('00000000-0000-0000-0000-000000000001', false, false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.system_security_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_lockdown_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrity_check_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies - SUPER_ADMIN only
CREATE POLICY "super_admin_manage_security_controls" ON public.system_security_controls
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'SUPER_ADMIN')
  );

CREATE POLICY "super_admin_manage_lockdown" ON public.system_lockdown_state
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'SUPER_ADMIN')
  );

CREATE POLICY "super_admin_view_emergency_log" ON public.emergency_actions_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'SUPER_ADMIN')
  );

CREATE POLICY "super_admin_view_integrity_checks" ON public.integrity_check_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- Function to check if a feature is active
CREATE OR REPLACE FUNCTION public.is_feature_active(p_feature_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_active BOOLEAN;
  v_is_lockdown BOOLEAN;
  v_is_read_only BOOLEAN;
BEGIN
  -- Check global lockdown first
  SELECT is_full_lockdown, is_read_only_mode 
  INTO v_is_lockdown, v_is_read_only
  FROM system_lockdown_state 
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  -- If full lockdown, everything is disabled
  IF v_is_lockdown THEN
    RETURN false;
  END IF;
  
  -- If read-only mode, only allow read operations
  IF v_is_read_only AND p_feature_name IN ('external_api_scoring', 'kyc_processing', 'momo_sms_extraction', 'new_user_registration') THEN
    RETURN false;
  END IF;
  
  -- Check specific feature
  SELECT is_active INTO v_is_active
  FROM system_security_controls
  WHERE feature_name = p_feature_name;
  
  RETURN COALESCE(v_is_active, true);
END;
$$;

-- Function to get emergency message for a feature
CREATE OR REPLACE FUNCTION public.get_feature_emergency_message(p_feature_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message TEXT;
  v_lockdown_message TEXT;
  v_is_lockdown BOOLEAN;
BEGIN
  -- Check global lockdown
  SELECT is_full_lockdown, lockdown_message 
  INTO v_is_lockdown, v_lockdown_message
  FROM system_lockdown_state 
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  IF v_is_lockdown THEN
    RETURN COALESCE(v_lockdown_message, 'Service temporairement suspendu.');
  END IF;
  
  -- Get feature-specific message
  SELECT emergency_message INTO v_message
  FROM system_security_controls
  WHERE feature_name = p_feature_name;
  
  RETURN COALESCE(v_message, 'Service temporairement indisponible.');
END;
$$;

-- Function for auto-lockdown triggered by Security Watch
CREATE OR REPLACE FUNCTION public.trigger_auto_lockdown()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_critical_count INTEGER;
  v_honeypot_count INTEGER;
BEGIN
  -- Count critical alerts in last 5 minutes
  SELECT COUNT(*) INTO v_critical_count
  FROM security_alerts
  WHERE severity = 'critical'
    AND created_at > NOW() - INTERVAL '5 minutes'
    AND acknowledged = false;
  
  -- Count honeypot triggers in last 5 minutes
  SELECT COUNT(*) INTO v_honeypot_count
  FROM security_alerts
  WHERE alert_type = 'honeypot_triggered'
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  -- Auto-lockdown conditions:
  -- 1. 3+ critical alerts in 5 minutes
  -- 2. 2+ honeypot triggers in 5 minutes
  IF v_critical_count >= 3 OR v_honeypot_count >= 2 THEN
    -- Enable read-only mode
    UPDATE system_lockdown_state
    SET 
      is_read_only_mode = true,
      lockdown_reason = CASE 
        WHEN v_honeypot_count >= 2 THEN 'Multiple honeypot triggers detected'
        ELSE 'Multiple critical security alerts'
      END,
      locked_at = NOW(),
      auto_triggered = true,
      trigger_source = 'security_watch_auto'
    WHERE id = '00000000-0000-0000-0000-000000000001';
    
    -- Log the action
    INSERT INTO emergency_actions_log (
      action_type,
      auto_triggered,
      trigger_reason,
      details
    ) VALUES (
      'auto_read_only',
      true,
      'Security Watch auto-trigger',
      jsonb_build_object(
        'critical_alerts', v_critical_count,
        'honeypot_triggers', v_honeypot_count,
        'triggered_at', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on security_alerts for auto-lockdown
CREATE TRIGGER check_auto_lockdown_trigger
  AFTER INSERT ON public.security_alerts
  FOR EACH ROW
  WHEN (NEW.severity = 'critical')
  EXECUTE FUNCTION trigger_auto_lockdown();

-- Function to run integrity check before unlock
CREATE OR REPLACE FUNCTION public.run_integrity_check(p_time_window_minutes INTEGER DEFAULT 10)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_anomalies INTEGER := 0;
  v_suspicious JSONB := '[]'::JSONB;
  v_result JSONB;
  v_transactions_checked INTEGER := 0;
  rec RECORD;
BEGIN
  -- Check scoring requests for anomalies
  FOR rec IN
    SELECT 
      sr.id,
      sr.phone_number,
      sr.score,
      sr.created_at,
      'Duplicate phone in short window' as reason
    FROM scoring_requests sr
    WHERE sr.created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL
    GROUP BY sr.id, sr.phone_number, sr.score, sr.created_at
    HAVING COUNT(*) > 3
  LOOP
    v_anomalies := v_anomalies + 1;
    v_suspicious := v_suspicious || jsonb_build_object(
      'type', 'scoring_duplicate',
      'id', rec.id,
      'reason', rec.reason,
      'created_at', rec.created_at
    );
  END LOOP;
  
  -- Check for fraud alerts
  SELECT COUNT(*) INTO v_transactions_checked
  FROM scoring_requests
  WHERE created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
  
  -- Check for velocity breaches
  FOR rec IN
    SELECT 
      sa.id,
      sa.alert_type,
      sa.severity,
      sa.details,
      sa.created_at
    FROM security_alerts sa
    WHERE sa.created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL
      AND sa.alert_type IN ('velocity_breach', 'fraud_detected', 'suspicious_pattern')
  LOOP
    v_anomalies := v_anomalies + 1;
    v_suspicious := v_suspicious || jsonb_build_object(
      'type', 'security_alert',
      'id', rec.id,
      'alert_type', rec.alert_type,
      'severity', rec.severity,
      'created_at', rec.created_at
    );
  END LOOP;
  
  -- Build result
  v_result := jsonb_build_object(
    'passed', v_anomalies = 0,
    'transactions_checked', v_transactions_checked,
    'anomalies_found', v_anomalies,
    'suspicious_entries', v_suspicious,
    'checked_at', NOW(),
    'time_window_minutes', p_time_window_minutes
  );
  
  -- Store result
  INSERT INTO integrity_check_results (
    check_type,
    time_window_minutes,
    transactions_checked,
    anomalies_found,
    suspicious_entries,
    passed,
    checked_by
  ) VALUES (
    'pre_unlock',
    p_time_window_minutes,
    v_transactions_checked,
    v_anomalies,
    v_suspicious,
    v_anomalies = 0,
    auth.uid()
  );
  
  RETURN v_result;
END;
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_controls_feature ON public.system_security_controls(feature_name);
CREATE INDEX IF NOT EXISTS idx_emergency_log_created ON public.emergency_actions_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integrity_checks_created ON public.integrity_check_results(checked_at DESC);