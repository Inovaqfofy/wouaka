-- Fix the remaining permissive RLS policy on phone_verifications

-- Drop the overly permissive "Service role" policy
DROP POLICY IF EXISTS "Service role can manage phone verifications" ON public.phone_verifications;

-- Create proper policies:
-- Users can view their own phone verifications
CREATE POLICY "Users can view own phone verifications"
  ON public.phone_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create verifications for their phone
CREATE POLICY "Users can create own phone verifications"
  ON public.phone_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own verifications (e.g., confirm OTP)
CREATE POLICY "Users can update own phone verifications"
  ON public.phone_verifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own verifications
CREATE POLICY "Users can delete own phone verifications"
  ON public.phone_verifications FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all phone verifications for support
CREATE POLICY "Admins can view all phone verifications"
  ON public.phone_verifications FOR SELECT
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));