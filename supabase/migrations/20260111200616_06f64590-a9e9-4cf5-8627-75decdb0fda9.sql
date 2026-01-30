-- Add detailed columns to kyc_requests for storing verification data
ALTER TABLE public.kyc_requests
ADD COLUMN IF NOT EXISTS verifications_performed JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS fraud_indicators JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS documents_required TEXT[] DEFAULT ARRAY['identity_card']::text[],
ADD COLUMN IF NOT EXISTS kyc_level TEXT DEFAULT 'basic';

-- Add detailed columns to scoring_requests for storing sub-scores and explanations
ALTER TABLE public.scoring_requests
ADD COLUMN IF NOT EXISTS sub_scores JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS fraud_analysis JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS data_quality TEXT DEFAULT 'low',
ADD COLUMN IF NOT EXISTS positive_factors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS negative_factors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS improvement_suggestions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS credit_recommendation JSONB DEFAULT '{}'::jsonb;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_kyc_requests_kyc_level ON public.kyc_requests(kyc_level);
CREATE INDEX IF NOT EXISTS idx_scoring_requests_data_quality ON public.scoring_requests(data_quality);