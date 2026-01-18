-- ============================================
-- MIGRATION: Synchronisation des plans avec pricing-plans.ts
-- Ajout d'un slug pour identifier les plans de façon lisible
-- ============================================

-- Ajouter les colonnes manquantes à subscription_plans
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'partner' CHECK (plan_type IN ('borrower', 'partner')),
  ADD COLUMN IF NOT EXISTS validity_days INTEGER,
  ADD COLUMN IF NOT EXISTS recertifications INTEGER,
  ADD COLUMN IF NOT EXISTS smile_id_level TEXT CHECK (smile_id_level IN ('none', 'basic', 'biometric')),
  ADD COLUMN IF NOT EXISTS max_free_shares INTEGER,
  ADD COLUMN IF NOT EXISTS share_price INTEGER,
  ADD COLUMN IF NOT EXISTS highlight TEXT,
  ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS period TEXT DEFAULT '/mois',
  ADD COLUMN IF NOT EXISTS quotas JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS not_included JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS cta TEXT,
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

-- Insérer les plans emprunteur (B2C)
INSERT INTO public.subscription_plans (
  slug, name, description, price_monthly, price_yearly, currency, features, limits,
  plan_type, validity_days, recertifications, smile_id_level, max_free_shares, share_price, popular, highlight, is_active
) VALUES
  (
    'emprunteur-decouverte',
    'Découverte',
    'Certificat valide 30 jours',
    1500, 1500, 'FCFA',
    '["Certificat valide 30 jours", "1 partage gratuit vers institution", "Analyse SMS locale", "Coefficient de certitude basique"]'::jsonb,
    '{}'::jsonb,
    'borrower', 30, 0, 'none', 1, 500, false, NULL, true
  ),
  (
    'emprunteur-essentiel',
    'Essentiel',
    'Certificat renforcé 90 jours + recertification',
    5000, 5000, 'FCFA',
    '["Certificat valide 90 jours", "3 partages gratuits vers institutions", "Vérification Smile ID Basic incluse", "1 recertification gratuite", "Coefficient de certitude renforcé"]'::jsonb,
    '{}'::jsonb,
    'borrower', 90, 1, 'basic', 3, 300, true, 'Vérification officielle incluse', true
  ),
  (
    'emprunteur-premium',
    'Premium',
    'Certification maximale 12 mois',
    12000, 12000, 'FCFA',
    '["Certificat valide 12 mois", "Partages illimités vers institutions", "Vérification Smile ID Biométrique", "Recertifications illimitées", "Niveau de confiance Gold", "Accès prioritaire aux offres"]'::jsonb,
    '{}'::jsonb,
    'borrower', 365, NULL, 'biometric', NULL, 0, false, 'Niveau de confiance maximum', true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  plan_type = EXCLUDED.plan_type,
  validity_days = EXCLUDED.validity_days,
  recertifications = EXCLUDED.recertifications,
  smile_id_level = EXCLUDED.smile_id_level,
  max_free_shares = EXCLUDED.max_free_shares,
  share_price = EXCLUDED.share_price,
  popular = EXCLUDED.popular,
  highlight = EXCLUDED.highlight,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Insérer les plans partenaire (B2B)
INSERT INTO public.subscription_plans (
  slug, name, description, price_monthly, price_yearly, currency, features, limits,
  plan_type, quotas, not_included, cta, popular, is_custom, period, is_active
) VALUES
  (
    'partenaire-starter',
    'Starter',
    'Pour démarrer avec les preuves certifiées',
    75000, 750000, 'FCFA',
    '["50 dossiers de preuves/mois", "Coefficient de certitude inclus", "API REST complète", "Analyse locale garantie", "Documentation technique", "Support email"]'::jsonb,
    '{"dossiers_per_month": 50}'::jsonb,
    'partner', '{"dossiers": 50}'::jsonb, '["Webhooks temps réel", "Export PDF comité crédit", "Screening AML/PEP"]'::jsonb,
    'Commencer', false, false, '/mois', true
  ),
  (
    'partenaire-business',
    'Business',
    'Solution complète avec webhooks',
    250000, 2500000, 'FCFA',
    '["250 dossiers de preuves/mois", "Coefficient de certitude inclus", "Webhooks temps réel", "Export PDF comité crédit", "Screening AML/PEP inclus", "SDK multi-langages", "Support prioritaire"]'::jsonb,
    '{"dossiers_per_month": 250}'::jsonb,
    'partner', '{"dossiers": 250}'::jsonb, '[]'::jsonb,
    'Choisir Business', true, false, '/mois', true
  ),
  (
    'partenaire-enterprise',
    'Enterprise',
    'Sur mesure pour grands volumes',
    0, 0, 'FCFA',
    '["Dossiers illimités", "SLA garanti 99.9%", "Intégration sur mesure", "Formation équipes", "Account manager dédié", "Audit de conformité inclus"]'::jsonb,
    '{"dossiers_per_month": -1}'::jsonb,
    'partner', '{"dossiers": null}'::jsonb, '[]'::jsonb,
    'Contacter les ventes', false, true, '', true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  plan_type = EXCLUDED.plan_type,
  quotas = EXCLUDED.quotas,
  not_included = EXCLUDED.not_included,
  cta = EXCLUDED.cta,
  popular = EXCLUDED.popular,
  is_custom = EXCLUDED.is_custom,
  period = EXCLUDED.period,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Désactiver les anciens plans sans slug
UPDATE public.subscription_plans
SET is_active = false
WHERE slug IS NULL;

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON public.subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_plan_type ON public.subscription_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON public.subscription_plans(is_active);