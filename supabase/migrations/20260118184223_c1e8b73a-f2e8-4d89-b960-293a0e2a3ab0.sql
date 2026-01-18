-- =============================================
-- PHASE 1: Sécuriser les tables sensibles avec RLS approprié
-- =============================================

-- 1.1 Protéger la table otp_verifications
-- Supprimer la politique permissive et restreindre aux service role
DROP POLICY IF EXISTS "Service role can manage OTP verifications" ON otp_verifications;
DROP POLICY IF EXISTS "Only service role can manage OTP" ON otp_verifications;

-- Note: Pour otp_verifications, les edge functions utilisent le service role,
-- donc on crée une politique restrictive qui n'autorise que les admins côté client
CREATE POLICY "Only admins can view OTP records"
ON otp_verifications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- 1.2 Protéger la table model_versions
DROP POLICY IF EXISTS "Anyone can view active models" ON model_versions;
DROP POLICY IF EXISTS "Only admins can view models" ON model_versions;

CREATE POLICY "Only admins can view models"
ON model_versions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- 1.3 Protéger la table sanctions_list_entries
DROP POLICY IF EXISTS "Anyone can read active sanctions" ON sanctions_list_entries;
DROP POLICY IF EXISTS "Partners and admins can read sanctions" ON sanctions_list_entries;

CREATE POLICY "Partners and admins can read sanctions"
ON sanctions_list_entries
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR
  has_role(auth.uid(), 'PARTENAIRE'::app_role) OR
  has_role(auth.uid(), 'ANALYSTE'::app_role)
);

-- 1.4 Protéger la table pep_categories
DROP POLICY IF EXISTS "Anyone can read PEP categories" ON pep_categories;
DROP POLICY IF EXISTS "Partners and admins can read PEP categories" ON pep_categories;

CREATE POLICY "Partners and admins can read PEP categories"
ON pep_categories
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR
  has_role(auth.uid(), 'PARTENAIRE'::app_role) OR
  has_role(auth.uid(), 'ANALYSTE'::app_role)
);

-- =============================================
-- PHASE 4: Sécuriser les fonctions phone_trust si elles existent
-- =============================================

-- Recréer calculate_phone_trust_score avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.calculate_phone_trust_score(p_phone_number TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trust_score NUMERIC := 0;
  record_count INTEGER;
  verified_count INTEGER;
BEGIN
  -- Count total records for this phone
  SELECT COUNT(*) INTO record_count
  FROM phone_trust_records
  WHERE phone_number = p_phone_number;
  
  -- Count verified records
  SELECT COUNT(*) INTO verified_count
  FROM phone_trust_records
  WHERE phone_number = p_phone_number AND is_verified = true;
  
  -- Calculate trust score based on verified records ratio
  IF record_count > 0 THEN
    trust_score := (verified_count::NUMERIC / record_count::NUMERIC) * 100;
  END IF;
  
  RETURN COALESCE(trust_score, 0);
END;
$$;

-- Recréer update_phone_trust_updated_at avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.update_phone_trust_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;