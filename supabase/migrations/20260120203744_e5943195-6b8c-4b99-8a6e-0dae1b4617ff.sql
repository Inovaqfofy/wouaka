-- Corriger la fonction create_partner_trial_subscription
-- Remplace le rôle invalide GESTIONNAIRE par les rôles legacy valides
CREATE OR REPLACE FUNCTION public.create_partner_trial_subscription()
RETURNS TRIGGER AS $$
DECLARE
  trial_plan_id UUID;
BEGIN
  -- Vérifier si c'est un rôle partenaire (rôles valides uniquement)
  IF NEW.role IN ('PARTENAIRE', 'ANALYSTE', 'ENTREPRISE', 'API_CLIENT') THEN
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