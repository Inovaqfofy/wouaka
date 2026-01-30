-- =====================================================
-- WOUAKA SELF-LEARNING ENGINE - Database Schema
-- =====================================================

-- 1. Loan Outcomes - Capture real credit results for feedback loop
CREATE TABLE public.loan_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scoring_request_id UUID REFERENCES scoring_requests(id),
  partner_id UUID REFERENCES profiles(id) NOT NULL,
  customer_profile_id UUID REFERENCES customer_profiles(id),
  
  -- Partner decision
  loan_granted BOOLEAN NOT NULL,
  loan_amount NUMERIC,
  loan_tenor_months INTEGER,
  interest_rate NUMERIC,
  
  -- Real outcome (feedback)
  repayment_status TEXT CHECK (repayment_status IN ('pending', 'on_time', 'late_30', 'late_60', 'late_90', 'default', 'early_repayment')),
  total_repaid NUMERIC DEFAULT 0,
  days_late_avg INTEGER DEFAULT 0,
  early_repayment BOOLEAN DEFAULT false,
  partial_recovery_amount NUMERIC,
  
  -- Score at decision time (for comparison)
  score_at_decision INTEGER,
  grade_at_decision VARCHAR(2),
  risk_level_at_decision VARCHAR(20),
  
  -- Timestamps
  decision_date TIMESTAMPTZ DEFAULT now(),
  disbursement_date TIMESTAMPTZ,
  maturity_date TIMESTAMPTZ,
  outcome_date TIMESTAMPTZ,
  outcome_reported_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Model Versions - Track scoring model evolution
CREATE TABLE public.model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100),
  description TEXT,
  
  -- Configuration
  feature_weights JSONB NOT NULL DEFAULT '{}',
  sub_score_weights JSONB NOT NULL DEFAULT '{}',
  fraud_rules JSONB NOT NULL DEFAULT '[]',
  thresholds JSONB DEFAULT '{}',
  
  -- Performance metrics
  training_sample_size INTEGER DEFAULT 0,
  validation_sample_size INTEGER DEFAULT 0,
  validation_auc NUMERIC,
  validation_gini NUMERIC,
  ks_statistic NUMERIC,
  accuracy NUMERIC,
  precision_score NUMERIC,
  recall_score NUMERIC,
  f1_score NUMERIC,
  
  -- Comparison with previous
  previous_version_id UUID REFERENCES model_versions(id),
  improvement_vs_previous NUMERIC,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'testing', 'active', 'deprecated', 'archived')),
  is_active BOOLEAN DEFAULT false,
  promoted_to_production_at TIMESTAMPTZ,
  promoted_by UUID REFERENCES profiles(id),
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. A/B Experiments - Test new model configurations
CREATE TABLE public.ab_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  hypothesis TEXT,
  
  -- Configuration
  control_model_version_id UUID REFERENCES model_versions(id),
  treatment_model_version_id UUID REFERENCES model_versions(id),
  traffic_split NUMERIC DEFAULT 0.5 CHECK (traffic_split >= 0 AND traffic_split <= 1),
  
  -- Targeting
  target_countries TEXT[],
  target_partner_ids UUID[],
  min_sample_size INTEGER DEFAULT 1000,
  
  -- Results
  control_requests INTEGER DEFAULT 0,
  treatment_requests INTEGER DEFAULT 0,
  control_outcomes INTEGER DEFAULT 0,
  treatment_outcomes INTEGER DEFAULT 0,
  control_default_rate NUMERIC,
  treatment_default_rate NUMERIC,
  statistical_significance NUMERIC,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
  winner TEXT CHECK (winner IN ('control', 'treatment', 'inconclusive')),
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Feature Performance - Track individual feature effectiveness
CREATE TABLE public.feature_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id UUID REFERENCES model_versions(id),
  feature_id VARCHAR(100) NOT NULL,
  feature_name VARCHAR(200),
  
  -- Current configuration
  current_weight NUMERIC NOT NULL,
  
  -- Performance metrics
  correlation_with_default NUMERIC,
  predictive_power NUMERIC,
  information_value NUMERIC,
  data_availability NUMERIC,
  
  -- Drift detection
  baseline_mean NUMERIC,
  baseline_stddev NUMERIC,
  current_mean NUMERIC,
  current_stddev NUMERIC,
  drift_score NUMERIC,
  drift_severity TEXT CHECK (drift_severity IN ('none', 'minor', 'moderate', 'major', 'critical')),
  
  -- Suggested adjustments
  suggested_weight NUMERIC,
  adjustment_confidence NUMERIC,
  adjustment_reason TEXT,
  
  calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Screenshot Analyses - Store MoMo screenshot OCR results
CREATE TABLE public.screenshot_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  scoring_request_id UUID REFERENCES scoring_requests(id),
  kyc_request_id UUID REFERENCES kyc_requests(id),
  
  -- Provider detection
  detected_provider TEXT CHECK (detected_provider IN ('orange_money', 'mtn_momo', 'wave', 'moov', 'unknown')),
  provider_confidence NUMERIC,
  
  -- Extracted data
  extracted_balance NUMERIC,
  extracted_currency VARCHAR(10) DEFAULT 'XOF',
  extracted_phone VARCHAR(20),
  extracted_name TEXT,
  extracted_transactions JSONB DEFAULT '[]',
  transaction_count INTEGER DEFAULT 0,
  
  -- Temporal analysis
  screenshot_date TIMESTAMPTZ,
  oldest_transaction_date TIMESTAMPTZ,
  newest_transaction_date TIMESTAMPTZ,
  
  -- Authenticity analysis
  ui_authenticity_score NUMERIC,
  tampering_probability NUMERIC,
  ela_anomalies JSONB DEFAULT '[]',
  metadata_consistency BOOLEAN,
  
  -- Freshness
  freshness TEXT CHECK (freshness IN ('live', 'recent', 'old', 'suspicious')),
  
  -- Raw data
  raw_ocr_text TEXT,
  image_hash VARCHAR(64),
  file_url TEXT,
  
  -- Confidence
  overall_confidence NUMERIC,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. SMS Analyses - Store parsed MoMo SMS
CREATE TABLE public.sms_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  scoring_request_id UUID REFERENCES scoring_requests(id),
  
  -- Provider detection
  detected_provider TEXT CHECK (detected_provider IN ('orange_money', 'mtn_momo', 'wave', 'moov', 'unknown')),
  sender_shortcode VARCHAR(50),
  
  -- Parsed data
  transaction_type TEXT CHECK (transaction_type IN ('credit', 'debit', 'balance', 'fee', 'other')),
  amount NUMERIC,
  currency VARCHAR(10) DEFAULT 'XOF',
  counterparty_name TEXT,
  counterparty_phone VARCHAR(20),
  balance_after NUMERIC,
  transaction_ref VARCHAR(100),
  
  -- Raw data
  raw_sms_text TEXT NOT NULL,
  sms_date TIMESTAMPTZ,
  
  -- Validation
  pattern_matched VARCHAR(100),
  parse_confidence NUMERIC,
  is_validated BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Learning Metrics - Daily aggregated learning stats
CREATE TABLE public.learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  model_version_id UUID REFERENCES model_versions(id),
  
  -- Volume
  total_requests INTEGER DEFAULT 0,
  total_outcomes INTEGER DEFAULT 0,
  outcomes_on_time INTEGER DEFAULT 0,
  outcomes_late INTEGER DEFAULT 0,
  outcomes_default INTEGER DEFAULT 0,
  
  -- Performance
  daily_auc NUMERIC,
  daily_accuracy NUMERIC,
  daily_precision NUMERIC,
  daily_recall NUMERIC,
  
  -- Feature stats
  feature_availability JSONB DEFAULT '{}',
  feature_drift_alerts JSONB DEFAULT '[]',
  
  -- Recommendations
  retraining_recommended BOOLEAN DEFAULT false,
  retraining_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(metric_date, model_version_id)
);

-- Indexes for performance
CREATE INDEX idx_loan_outcomes_partner ON loan_outcomes(partner_id);
CREATE INDEX idx_loan_outcomes_scoring ON loan_outcomes(scoring_request_id);
CREATE INDEX idx_loan_outcomes_status ON loan_outcomes(repayment_status);
CREATE INDEX idx_loan_outcomes_decision_date ON loan_outcomes(decision_date);

CREATE INDEX idx_model_versions_active ON model_versions(is_active) WHERE is_active = true;
CREATE INDEX idx_model_versions_status ON model_versions(status);

CREATE INDEX idx_ab_experiments_status ON ab_experiments(status);

CREATE INDEX idx_feature_performance_model ON feature_performance(model_version_id);
CREATE INDEX idx_feature_performance_feature ON feature_performance(feature_id);

CREATE INDEX idx_screenshot_analyses_user ON screenshot_analyses(user_id);
CREATE INDEX idx_screenshot_analyses_scoring ON screenshot_analyses(scoring_request_id);

CREATE INDEX idx_sms_analyses_user ON sms_analyses(user_id);
CREATE INDEX idx_sms_analyses_scoring ON sms_analyses(scoring_request_id);

CREATE INDEX idx_learning_metrics_date ON learning_metrics(metric_date);

-- Enable RLS
ALTER TABLE loan_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshot_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies using existing has_role() function

-- loan_outcomes: Partners can see their own outcomes, admins see all
CREATE POLICY "Partners view own loan outcomes" ON loan_outcomes
  FOR SELECT USING (
    partner_id = auth.uid() OR
    has_role(auth.uid(), 'SUPER_ADMIN')
  );

CREATE POLICY "Partners insert own loan outcomes" ON loan_outcomes
  FOR INSERT WITH CHECK (partner_id = auth.uid() OR has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Partners update own loan outcomes" ON loan_outcomes
  FOR UPDATE USING (partner_id = auth.uid() OR has_role(auth.uid(), 'SUPER_ADMIN'));

-- model_versions: Anyone can view active models, admins can manage
CREATE POLICY "Anyone can view active models" ON model_versions
  FOR SELECT USING (is_active = true OR status = 'active' OR has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Admins manage model versions" ON model_versions
  FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- ab_experiments: Only admins
CREATE POLICY "Admins manage experiments" ON ab_experiments
  FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- feature_performance: Only admins
CREATE POLICY "Admins view feature performance" ON feature_performance
  FOR SELECT USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- screenshot_analyses: Users see their own, system can insert
CREATE POLICY "Users view own screenshot analyses" ON screenshot_analyses
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "System can insert screenshot analyses" ON screenshot_analyses
  FOR INSERT WITH CHECK (true);

-- sms_analyses: Users see their own, system can insert
CREATE POLICY "Users view own sms analyses" ON sms_analyses
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "System can insert sms analyses" ON sms_analyses
  FOR INSERT WITH CHECK (true);

-- learning_metrics: Only admins
CREATE POLICY "Admins view learning metrics" ON learning_metrics
  FOR SELECT USING (has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "System can insert learning metrics" ON learning_metrics
  FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_loan_outcomes_updated_at
  BEFORE UPDATE ON loan_outcomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_versions_updated_at
  BEFORE UPDATE ON model_versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_experiments_updated_at
  BEFORE UPDATE ON ab_experiments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial model version (v5.0.0)
INSERT INTO model_versions (
  version, name, description, status, is_active,
  feature_weights, sub_score_weights, fraud_rules
) VALUES (
  'v5.0.0',
  'WOUAKA Baseline',
  'Initial self-learning model baseline',
  'active',
  true,
  '{
    "income_stability": 0.15,
    "mobile_money_activity": 0.20,
    "bill_payment_regularity": 0.12,
    "social_capital": 0.18,
    "identity_strength": 0.10,
    "behavioral_signals": 0.08,
    "geographic_risk": 0.07,
    "employment_stability": 0.10
  }',
  '{
    "financial_stability": 0.30,
    "behavioral_reliability": 0.20,
    "social_capital": 0.20,
    "identity_verification": 0.15,
    "fraud_risk": 0.15
  }',
  '[
    {"rule": "velocity_check", "threshold": 5, "weight": 0.2},
    {"rule": "device_fingerprint", "threshold": 3, "weight": 0.15},
    {"rule": "document_tampering", "threshold": 0.7, "weight": 0.25},
    {"rule": "identity_mismatch", "threshold": 0.5, "weight": 0.2},
    {"rule": "behavioral_anomaly", "threshold": 2, "weight": 0.2}
  ]'
);