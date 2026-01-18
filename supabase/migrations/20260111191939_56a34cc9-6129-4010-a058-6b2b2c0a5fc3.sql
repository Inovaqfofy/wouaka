-- Update subscription_plans to add kyc_per_month quotas

-- Update Starter plan
UPDATE subscription_plans
SET limits = jsonb_set(limits::jsonb, '{kyc_per_month}', '10')
WHERE name = 'Starter';

-- Update Business plan
UPDATE subscription_plans
SET limits = jsonb_set(limits::jsonb, '{kyc_per_month}', '50')
WHERE name = 'Business';

-- Update Enterprise plan (unlimited = -1)
UPDATE subscription_plans
SET limits = jsonb_set(limits::jsonb, '{kyc_per_month}', '-1')
WHERE name = 'Enterprise';