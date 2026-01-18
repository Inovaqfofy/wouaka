-- Normaliser les limites des plans partenaires avec scores_per_month, kyc_per_month, api_calls_per_month
-- Ces valeurs deviennent la SOURCE UNIQUE DE VÉRITÉ pour tous les quotas

-- Plan Trial (10 dossiers = 10 scores + 10 KYC)
UPDATE subscription_plans 
SET limits = jsonb_build_object(
  'scores_per_month', 10,
  'kyc_per_month', 10,
  'api_calls_per_month', 100,
  'dossiers_per_month', 10
)
WHERE slug = 'partenaire-trial';

-- Plan Starter (50 dossiers)
UPDATE subscription_plans 
SET limits = jsonb_build_object(
  'scores_per_month', 50,
  'kyc_per_month', 50,
  'api_calls_per_month', 5000,
  'dossiers_per_month', 50
)
WHERE slug = 'partenaire-starter';

-- Plan Business (250 dossiers)
UPDATE subscription_plans 
SET limits = jsonb_build_object(
  'scores_per_month', 250,
  'kyc_per_month', 250,
  'api_calls_per_month', 25000,
  'dossiers_per_month', 250
)
WHERE slug = 'partenaire-business';

-- Plan Enterprise (illimité = -1)
UPDATE subscription_plans 
SET limits = jsonb_build_object(
  'scores_per_month', -1,
  'kyc_per_month', -1,
  'api_calls_per_month', -1,
  'dossiers_per_month', -1
)
WHERE slug = 'partenaire-enterprise';