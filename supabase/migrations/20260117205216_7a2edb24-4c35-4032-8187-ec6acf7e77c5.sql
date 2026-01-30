-- 1. Ajouter le plan d'essai gratuit pour les partenaires
INSERT INTO subscription_plans (
  slug, name, plan_type, description, price_monthly, 
  limits, quotas, features, validity_days, is_active
) VALUES (
  'partenaire-trial', 'Essai Gratuit', 'partner',
  '14 jours pour tester l''API WOUAKA sans engagement',
  0,
  '{"dossiers_per_month": 10, "api_calls_per_month": 100}'::jsonb,
  '{"dossiers": 10}'::jsonb,
  '["10 dossiers de test", "API REST complète", "Documentation technique", "Support email", "Sandbox API"]'::jsonb,
  14,
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  limits = EXCLUDED.limits,
  quotas = EXCLUDED.quotas,
  features = EXCLUDED.features,
  validity_days = EXCLUDED.validity_days;

-- 2. Créer la fonction pour attribuer automatiquement un trial aux nouveaux partenaires
CREATE OR REPLACE FUNCTION public.create_partner_trial_subscription()
RETURNS TRIGGER AS $$
DECLARE
  trial_plan_id UUID;
BEGIN
  -- Vérifier si c'est un rôle partenaire
  IF NEW.role IN ('PARTENAIRE', 'ANALYSTE', 'GESTIONNAIRE') THEN
    -- Récupérer l'ID du plan trial
    SELECT id INTO trial_plan_id
    FROM subscription_plans
    WHERE slug = 'partenaire-trial' AND is_active = true
    LIMIT 1;
    
    -- Si le plan trial existe et l'utilisateur n'a pas déjà d'abonnement
    IF trial_plan_id IS NOT NULL THEN
      INSERT INTO subscriptions (
        user_id, plan_id, status,
        trial_start, trial_end,
        current_period_start, current_period_end,
        metadata
      )
      SELECT 
        NEW.user_id,
        trial_plan_id,
        'trialing',
        NOW(),
        NOW() + INTERVAL '14 days',
        NOW(),
        NOW() + INTERVAL '14 days',
        '{"auto_created": true, "source": "partner_signup"}'::jsonb
      WHERE NOT EXISTS (
        SELECT 1 FROM subscriptions WHERE user_id = NEW.user_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Créer le trigger sur user_roles
DROP TRIGGER IF EXISTS on_partner_role_assigned ON user_roles;
CREATE TRIGGER on_partner_role_assigned
AFTER INSERT ON user_roles
FOR EACH ROW
EXECUTE FUNCTION public.create_partner_trial_subscription();

-- 4. Ajouter une colonne pour tracker les notifications d'expiration trial
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS trial_reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_expired_notified BOOLEAN DEFAULT false;