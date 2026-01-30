-- =================================================================
-- MODULE DE DÉFENSE ACTIVE WOUAKA
-- Tables, triggers et fonctions de sécurité
-- =================================================================

-- Table des IPs bannies
CREATE TABLE IF NOT EXISTS public.blacklisted_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  reason TEXT NOT NULL,
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  banned_until TIMESTAMP WITH TIME ZONE, -- NULL = permanent
  banned_by TEXT, -- 'system' ou user_id
  trigger_endpoint TEXT,
  trigger_details JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  unban_reason TEXT,
  unbanned_at TIMESTAMP WITH TIME ZONE,
  unbanned_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche rapide d'IP
CREATE INDEX IF NOT EXISTS idx_blacklisted_ips_lookup ON public.blacklisted_ips(ip_address, is_active);

-- Table des alertes de sécurité
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'honeypot_triggered', 'velocity_breach', 'emulator_detected', 'bot_detected', 'ddos_attempt'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  source_ip TEXT,
  user_agent TEXT,
  user_id UUID,
  api_key_id UUID,
  endpoint TEXT,
  payload JSONB,
  fingerprint TEXT, -- Hash unique de l'attaque pour déduplication
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  action_taken TEXT, -- 'ip_banned', 'user_suspended', 'alert_sent', 'none'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour dashboard
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON public.security_alerts(alert_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity, is_acknowledged);

-- Table pour tracking des tentatives de connexion échouées
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  email_hash TEXT, -- Hash de l'email pour confidentialité
  user_agent TEXT,
  failure_reason TEXT,
  attempt_count INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMP WITH TIME ZONE
);

-- Index pour lookup rapide
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON public.failed_login_attempts(ip_address, last_attempt_at DESC);

-- Table pour tracking de vélocité des appels API (scoring)
CREATE TABLE IF NOT EXISTS public.api_velocity_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP, user_id, ou api_key_id
  identifier_type TEXT NOT NULL, -- 'ip', 'user', 'api_key'
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  unique_payloads INTEGER DEFAULT 1,
  payload_hashes TEXT[], -- Hashes des payloads pour détecter variation
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  is_suspicious BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour analyse vélocité
CREATE INDEX IF NOT EXISTS idx_velocity_lookup ON public.api_velocity_tracking(identifier, endpoint, window_start);

-- Table pour les hashes d'images USSD connues (émulateurs/fraudes)
CREATE TABLE IF NOT EXISTS public.known_fraudulent_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_hash TEXT NOT NULL UNIQUE,
  image_type TEXT NOT NULL, -- 'emulator_screenshot', 'web_image', 'synthetic', 'recycled'
  source TEXT, -- D'où vient cette image
  detection_count INTEGER DEFAULT 1,
  first_detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Index pour lookup de hash
CREATE INDEX IF NOT EXISTS idx_known_fraud_hash ON public.known_fraudulent_images(image_hash);

-- Enable RLS
ALTER TABLE public.blacklisted_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_velocity_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.known_fraudulent_images ENABLE ROW LEVEL SECURITY;

-- Policies: Seuls les admins peuvent voir ces tables
CREATE POLICY "Admins can manage blacklisted_ips"
  ON public.blacklisted_ips
  FOR ALL
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Admins can manage security_alerts"
  ON public.security_alerts
  FOR ALL
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Admins can view failed_login_attempts"
  ON public.failed_login_attempts
  FOR SELECT
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Admins can manage velocity_tracking"
  ON public.api_velocity_tracking
  FOR ALL
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Admins can manage known_fraudulent_images"
  ON public.known_fraudulent_images
  FOR ALL
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- Fonction pour vérifier la vélocité des appels API scoring
CREATE OR REPLACE FUNCTION public.check_scoring_velocity()
RETURNS TRIGGER AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_request_count INTEGER;
  v_unique_payloads INTEGER;
  v_identifier TEXT;
  v_payload_hash TEXT;
  v_existing_hashes TEXT[];
BEGIN
  -- Ne surveiller que les endpoints de scoring
  IF NEW.endpoint NOT LIKE '%score%' AND NEW.endpoint NOT LIKE '%calculate%' THEN
    RETURN NEW;
  END IF;
  
  -- Fenêtre de 10 minutes
  v_window_start := NOW() - INTERVAL '10 minutes';
  
  -- Identifier = IP + User Agent combiné ou user_id
  v_identifier := COALESCE(NEW.user_id::TEXT, NEW.ip_address::TEXT || '-' || COALESCE(NEW.user_agent, 'unknown'));
  
  -- Hash du payload pour détecter les variations
  v_payload_hash := MD5(COALESCE(NEW.request_body::TEXT, ''));
  
  -- Compter les requêtes dans la fenêtre
  SELECT COUNT(*), COUNT(DISTINCT MD5(COALESCE(request_body::TEXT, '')))
  INTO v_request_count, v_unique_payloads
  FROM public.api_calls
  WHERE (user_id = NEW.user_id OR ip_address = NEW.ip_address)
    AND endpoint LIKE '%score%'
    AND created_at >= v_window_start;
  
  -- Si plus de 3 requêtes avec données différentes en 10 min
  IF v_request_count >= 3 AND v_unique_payloads >= 3 THEN
    -- Marquer comme suspicious dans identity_fraud_risk
    INSERT INTO public.identity_fraud_risk (
      user_id, 
      risk_type, 
      risk_level, 
      overall_risk_score, 
      indicators,
      investigation_status
    )
    VALUES (
      COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000'::UUID),
      'velocity_abuse',
      'high',
      85,
      jsonb_build_object(
        'trigger', 'scoring_velocity_breach',
        'request_count', v_request_count,
        'unique_payloads', v_unique_payloads,
        'window_minutes', 10,
        'ip_address', NEW.ip_address::TEXT,
        'user_agent', NEW.user_agent,
        'detected_at', NOW()
      ),
      'pending'
    )
    ON CONFLICT DO NOTHING;
    
    -- Créer une alerte de sécurité
    INSERT INTO public.security_alerts (
      alert_type,
      severity,
      source_ip,
      user_agent,
      user_id,
      api_key_id,
      endpoint,
      payload,
      action_taken
    )
    VALUES (
      'velocity_breach',
      'high',
      NEW.ip_address::TEXT,
      NEW.user_agent,
      NEW.user_id,
      NEW.api_key_id,
      NEW.endpoint,
      jsonb_build_object(
        'request_count', v_request_count,
        'unique_payloads', v_unique_payloads,
        'window_minutes', 10
      ),
      'user_flagged'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger sur api_calls
DROP TRIGGER IF EXISTS trigger_check_scoring_velocity ON public.api_calls;
CREATE TRIGGER trigger_check_scoring_velocity
  AFTER INSERT ON public.api_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.check_scoring_velocity();

-- Fonction pour bannir une IP
CREATE OR REPLACE FUNCTION public.ban_ip(
  p_ip_address TEXT,
  p_reason TEXT,
  p_duration_hours INTEGER DEFAULT NULL, -- NULL = permanent
  p_trigger_endpoint TEXT DEFAULT NULL,
  p_trigger_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_ban_id UUID;
  v_banned_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculer la date de fin de ban
  IF p_duration_hours IS NOT NULL THEN
    v_banned_until := NOW() + (p_duration_hours || ' hours')::INTERVAL;
  END IF;
  
  INSERT INTO public.blacklisted_ips (
    ip_address,
    reason,
    banned_until,
    banned_by,
    trigger_endpoint,
    trigger_details
  )
  VALUES (
    p_ip_address,
    p_reason,
    v_banned_until,
    'system',
    p_trigger_endpoint,
    p_trigger_details
  )
  RETURNING id INTO v_ban_id;
  
  RETURN v_ban_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction pour vérifier si une IP est bannie
CREATE OR REPLACE FUNCTION public.is_ip_banned(p_ip_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.blacklisted_ips
    WHERE ip_address = p_ip_address
      AND is_active = true
      AND (banned_until IS NULL OR banned_until > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction pour détecter les User-Agents de bots
CREATE OR REPLACE FUNCTION public.is_bot_user_agent(p_user_agent TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_user_agent IS NULL THEN
    RETURN TRUE; -- Pas de UA = suspect
  END IF;
  
  -- Détecter les navigateurs automatisés connus
  RETURN p_user_agent ~* '(puppeteer|headless|phantom|selenium|webdriver|chrome-lighthouse|googlebot|bingbot|yandexbot|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|python-requests|axios|node-fetch|curl|wget|scrapy)';
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Enable realtime pour security_alerts (dashboard temps réel)
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_alerts;