-- Create table for scoring requests and results
CREATE TABLE public.scoring_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Input data
  full_name TEXT,
  national_id TEXT,
  phone_number TEXT,
  company_name TEXT,
  rccm_number TEXT,
  
  -- Financial data
  monthly_income DECIMAL(15, 2),
  monthly_expenses DECIMAL(15, 2),
  existing_loans DECIMAL(15, 2) DEFAULT 0,
  mobile_money_volume DECIMAL(15, 2) DEFAULT 0,
  
  -- Behavioral data
  sim_age_months INTEGER DEFAULT 0,
  mobile_money_transactions INTEGER DEFAULT 0,
  utility_payments_on_time INTEGER DEFAULT 0,
  utility_payments_late INTEGER DEFAULT 0,
  
  -- Employment/Business data
  employment_type TEXT, -- 'employed', 'self_employed', 'business_owner', 'freelancer'
  years_in_business INTEGER DEFAULT 0,
  sector TEXT,
  
  -- Location data
  region TEXT,
  city TEXT,
  
  -- Results
  score INTEGER,
  risk_category TEXT, -- 'excellent', 'good', 'fair', 'poor', 'very_poor'
  confidence DECIMAL(5, 2),
  explanations JSONB,
  recommendations JSONB,
  feature_importance JSONB,
  
  -- Metadata
  processing_time_ms INTEGER,
  model_version TEXT DEFAULT '1.0.0',
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.scoring_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scoring requests"
ON public.scoring_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create scoring requests"
ON public.scoring_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can view all scoring requests"
ON public.scoring_requests FOR SELECT
USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Analysts can view all scoring requests"
ON public.scoring_requests FOR SELECT
USING (public.has_role(auth.uid(), 'ANALYSTE'));

-- Trigger for updated_at
CREATE TRIGGER update_scoring_requests_updated_at
  BEFORE UPDATE ON public.scoring_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_scoring_requests_user_id ON public.scoring_requests(user_id);
CREATE INDEX idx_scoring_requests_status ON public.scoring_requests(status);
CREATE INDEX idx_scoring_requests_created_at ON public.scoring_requests(created_at DESC);
CREATE INDEX idx_scoring_requests_score ON public.scoring_requests(score);