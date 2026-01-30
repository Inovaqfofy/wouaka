-- Supprimer l'ancien constraint qui n'autorise pas manual_grant
ALTER TABLE public.certificate_subscriptions 
DROP CONSTRAINT IF EXISTS certificate_subscriptions_source_check;

-- Recréer le constraint avec manual_grant comme valeur autorisée
ALTER TABLE public.certificate_subscriptions 
ADD CONSTRAINT certificate_subscriptions_source_check 
CHECK (source = ANY (ARRAY['purchase'::text, 'promo'::text, 'referral'::text, 'migration'::text, 'manual_grant'::text]));