-- =====================================================
-- PHASE 1: Wouaka UCP (Unified Customer Profile) + Profile Scores
-- =====================================================

-- Table principale des profils clients unifiés
CREATE TABLE public.customer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_reference TEXT NOT NULL,
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Données d'identité (JSONB pour flexibilité)
  identity_data JSONB DEFAULT '{}'::jsonb,
  
  -- Indicateurs télécom
  telecom_indicators JSONB DEFAULT '{
    "sim_age_months": null,
    "activity_score": null,
    "stability_index": null,
    "continuity_score": null
  }'::jsonb,
  
  -- Indicateurs financiers alternatifs
  financial_indicators JSONB DEFAULT '{
    "income_regularity": null,
    "repayment_capacity": null,
    "solvency_score": null,
    "payment_history_score": null
  }'::jsonb,
  
  -- Indicateurs commerciaux
  commercial_indicators JSONB DEFAULT '{
    "transaction_frequency": null,
    "reliability_index": null,
    "business_age_months": null,
    "engagement_score": null
  }'::jsonb,
  
  -- Indicateurs de stabilité
  stability_indicators JSONB DEFAULT '{
    "geographic_stability": null,
    "digital_stability": null,
    "account_longevity": null,
    "consistency_score": null
  }'::jsonb,
  
  -- Score composite calculé
  composite_score INTEGER CHECK (composite_score >= 0 AND composite_score <= 100),
  
  -- 4 sous-indicateurs business
  reliability_score INTEGER CHECK (reliability_score >= 0 AND reliability_score <= 100),
  stability_score INTEGER CHECK (stability_score >= 0 AND stability_score <= 100),
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  engagement_capacity INTEGER CHECK (engagement_capacity >= 0 AND engagement_capacity <= 100),
  
  -- Métadonnées
  data_sources TEXT[] DEFAULT '{}',
  last_enriched_at TIMESTAMP WITH TIME ZONE,
  enrichment_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contrainte d'unicité par partenaire
  UNIQUE(partner_id, external_reference)
);

-- Index pour performances
CREATE INDEX idx_customer_profiles_partner ON public.customer_profiles(partner_id);
CREATE INDEX idx_customer_profiles_external_ref ON public.customer_profiles(external_reference);
CREATE INDEX idx_customer_profiles_composite_score ON public.customer_profiles(composite_score);
CREATE INDEX idx_customer_profiles_last_enriched ON public.customer_profiles(last_enriched_at);

-- Enable RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Partners can view their own customer profiles"
  ON public.customer_profiles FOR SELECT
  USING (auth.uid() = partner_id);

CREATE POLICY "Partners can create customer profiles"
  ON public.customer_profiles FOR INSERT
  WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Partners can update their own customer profiles"
  ON public.customer_profiles FOR UPDATE
  USING (auth.uid() = partner_id);

CREATE POLICY "Partners can delete their own customer profiles"
  ON public.customer_profiles FOR DELETE
  USING (auth.uid() = partner_id);

CREATE POLICY "Super admins can manage all customer profiles"
  ON public.customer_profiles FOR ALL
  USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

CREATE POLICY "Analysts can view all customer profiles"
  ON public.customer_profiles FOR SELECT
  USING (has_role(auth.uid(), 'ANALYSTE'::app_role));

-- Trigger pour updated_at
CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Table des pre-checks (scoring rapide)
-- =====================================================
CREATE TABLE public.precheck_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id),
  
  -- Entrées
  phone_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  
  -- Résultats
  status TEXT CHECK (status IN ('reliable', 'evaluate', 'risky')),
  quick_score INTEGER CHECK (quick_score >= 0 AND quick_score <= 100),
  sim_stability TEXT CHECK (sim_stability IN ('low', 'medium', 'high')),
  
  -- Performance
  processing_time_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_precheck_partner ON public.precheck_requests(partner_id);
CREATE INDEX idx_precheck_created ON public.precheck_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.precheck_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Partners can view their own precheck requests"
  ON public.precheck_requests FOR SELECT
  USING (auth.uid() = partner_id);

CREATE POLICY "Partners can create precheck requests"
  ON public.precheck_requests FOR INSERT
  WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Super admins can view all precheck requests"
  ON public.precheck_requests FOR SELECT
  USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

CREATE POLICY "Analysts can view all precheck requests"
  ON public.precheck_requests FOR SELECT
  USING (has_role(auth.uid(), 'ANALYSTE'::app_role));

-- =====================================================
-- Table FraudShield détections
-- =====================================================
CREATE TABLE public.fraud_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Entrées
  phone_number TEXT,
  full_name TEXT,
  national_id TEXT,
  
  -- Résultats
  fraud_score INTEGER CHECK (fraud_score >= 0 AND fraud_score <= 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high')),
  
  -- Détails
  flags JSONB DEFAULT '[]'::jsonb,
  anomalies_count INTEGER DEFAULT 0,
  identity_coherence INTEGER CHECK (identity_coherence >= 0 AND identity_coherence <= 100),
  behavior_coherence INTEGER CHECK (behavior_coherence >= 0 AND behavior_coherence <= 100),
  
  -- Performance
  processing_time_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_fraud_partner ON public.fraud_detections(partner_id);
CREATE INDEX idx_fraud_profile ON public.fraud_detections(profile_id);
CREATE INDEX idx_fraud_risk ON public.fraud_detections(risk_level);

-- Enable RLS
ALTER TABLE public.fraud_detections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Partners can view their own fraud detections"
  ON public.fraud_detections FOR SELECT
  USING (auth.uid() = partner_id);

CREATE POLICY "Partners can create fraud detections"
  ON public.fraud_detections FOR INSERT
  WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Super admins can view all fraud detections"
  ON public.fraud_detections FOR SELECT
  USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- =====================================================
-- Table Monitoring des profils
-- =====================================================
CREATE TABLE public.profile_monitoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Configuration
  monitoring_type TEXT NOT NULL CHECK (monitoring_type IN ('stability_change', 'risk_increase', 'anomaly', 'score_drop')),
  threshold_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  
  -- État
  last_check_at TIMESTAMP WITH TIME ZONE,
  alert_count INTEGER DEFAULT 0,
  last_alert_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_monitoring_profile ON public.profile_monitoring(profile_id);
CREATE INDEX idx_monitoring_partner ON public.profile_monitoring(partner_id);
CREATE INDEX idx_monitoring_active ON public.profile_monitoring(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.profile_monitoring ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Partners can manage their own monitoring"
  ON public.profile_monitoring FOR ALL
  USING (auth.uid() = partner_id);

CREATE POLICY "Super admins can view all monitoring"
  ON public.profile_monitoring FOR SELECT
  USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- Trigger
CREATE TRIGGER update_profile_monitoring_updated_at
  BEFORE UPDATE ON public.profile_monitoring
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Table des alertes de monitoring
-- =====================================================
CREATE TABLE public.monitoring_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monitoring_id UUID NOT NULL REFERENCES public.profile_monitoring(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Détails de l'alerte
  alert_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  
  -- État
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES public.profiles(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_alerts_partner ON public.monitoring_alerts(partner_id);
CREATE INDEX idx_alerts_profile ON public.monitoring_alerts(profile_id);
CREATE INDEX idx_alerts_unacked ON public.monitoring_alerts(is_acknowledged) WHERE is_acknowledged = false;

-- Enable RLS
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Partners can view their own alerts"
  ON public.monitoring_alerts FOR SELECT
  USING (auth.uid() = partner_id);

CREATE POLICY "Partners can acknowledge their alerts"
  ON public.monitoring_alerts FOR UPDATE
  USING (auth.uid() = partner_id);

CREATE POLICY "Super admins can view all alerts"
  ON public.monitoring_alerts FOR SELECT
  USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- =====================================================
-- Mise à jour table scoring_requests avec nouveaux champs
-- =====================================================
ALTER TABLE public.scoring_requests 
  ADD COLUMN IF NOT EXISTS reliability_score INTEGER CHECK (reliability_score >= 0 AND reliability_score <= 100),
  ADD COLUMN IF NOT EXISTS stability_score INTEGER CHECK (stability_score >= 0 AND stability_score <= 100),
  ADD COLUMN IF NOT EXISTS short_term_risk INTEGER CHECK (short_term_risk >= 0 AND short_term_risk <= 100),
  ADD COLUMN IF NOT EXISTS engagement_capacity_score INTEGER CHECK (engagement_capacity_score >= 0 AND engagement_capacity_score <= 100),
  ADD COLUMN IF NOT EXISTS grade TEXT,
  ADD COLUMN IF NOT EXISTS customer_profile_id UUID REFERENCES public.customer_profiles(id);