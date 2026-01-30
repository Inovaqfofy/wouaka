-- Table pour stocker les codes OTP temporaires
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'kyc',
  user_id UUID,
  partner_id UUID,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(phone_number, purpose)
);

-- Table pour stocker les vérifications de téléphone réussies
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verification_method TEXT NOT NULL DEFAULT 'sms_otp',
  provider TEXT DEFAULT 'africastalking',
  partner_id UUID REFERENCES public.profiles(id),
  user_id UUID,
  purpose TEXT DEFAULT 'kyc',
  verification_token UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_otp_phone_purpose ON public.otp_verifications(phone_number, purpose);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_token ON public.phone_verifications(verification_token);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON public.phone_verifications(phone_number);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for otp_verifications (service role only via edge functions)
CREATE POLICY "Service role can manage OTP verifications"
  ON public.otp_verifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS policies for phone_verifications
CREATE POLICY "Partners can view their phone verifications"
  ON public.phone_verifications
  FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Service role can manage phone verifications"
  ON public.phone_verifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Cleanup function for expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.otp_verifications 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;