-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC,
  currency TEXT NOT NULL DEFAULT 'XOF',
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  category TEXT NOT NULL DEFAULT 'general',
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, key)
);

-- Create permissions table
CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role app_role NOT NULL,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Subscription plans policies (public read)
CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admins can manage subscription plans"
ON public.subscription_plans FOR ALL
USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- Subscriptions policies
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all subscriptions"
ON public.subscriptions FOR ALL
USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- Settings policies
CREATE POLICY "Users can view their own settings"
ON public.settings FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage their own settings"
ON public.settings FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all settings"
ON public.settings FOR ALL
USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- Permissions policies (read for authenticated)
CREATE POLICY "Authenticated users can view permissions"
ON public.permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage permissions"
ON public.permissions FOR ALL
USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- Role permissions policies
CREATE POLICY "Authenticated users can view role permissions"
ON public.role_permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage role permissions"
ON public.role_permissions FOR ALL
USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- Add triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, features, limits) VALUES
('Starter', 'Idéal pour démarrer', 0, 0, '["100 scores/mois", "API REST", "Support email"]'::jsonb, '{"scores_per_month": 100, "api_calls_per_month": 1000}'::jsonb),
('Pro', 'Pour les entreprises en croissance', 49900, 499000, '["1000 scores/mois", "API REST", "Webhooks", "Support prioritaire"]'::jsonb, '{"scores_per_month": 1000, "api_calls_per_month": 10000}'::jsonb),
('Enterprise', 'Solution sur mesure', 199900, 1999000, '["Scores illimités", "API REST", "Webhooks", "Support dédié", "SLA 99.9%"]'::jsonb, '{"scores_per_month": -1, "api_calls_per_month": -1}'::jsonb);

-- Insert default permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
('score:read', 'Lire les scores', 'score', 'read'),
('score:create', 'Créer des scores', 'score', 'create'),
('kyc:read', 'Lire les vérifications KYC', 'kyc', 'read'),
('kyc:create', 'Créer des vérifications KYC', 'kyc', 'create'),
('kyc:validate', 'Valider les KYC', 'kyc', 'validate'),
('dataset:read', 'Lire les datasets', 'dataset', 'read'),
('dataset:create', 'Créer des datasets', 'dataset', 'create'),
('dataset:delete', 'Supprimer des datasets', 'dataset', 'delete'),
('user:read', 'Lire les utilisateurs', 'user', 'read'),
('user:create', 'Créer des utilisateurs', 'user', 'create'),
('user:update', 'Modifier des utilisateurs', 'user', 'update'),
('user:delete', 'Supprimer des utilisateurs', 'user', 'delete'),
('settings:read', 'Lire les paramètres', 'settings', 'read'),
('settings:update', 'Modifier les paramètres', 'settings', 'update'),
('billing:read', 'Lire la facturation', 'billing', 'read'),
('billing:manage', 'Gérer la facturation', 'billing', 'manage'),
('api:manage', 'Gérer les clés API', 'api', 'manage'),
('webhook:manage', 'Gérer les webhooks', 'webhook', 'manage'),
('audit:read', 'Lire les logs d''audit', 'audit', 'read');

-- Assign permissions to roles
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'SUPER_ADMIN', id FROM public.permissions;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'ANALYSTE', id FROM public.permissions 
WHERE name IN ('score:read', 'score:create', 'kyc:read', 'kyc:create', 'kyc:validate', 'dataset:read', 'user:read', 'audit:read');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'ENTREPRISE', id FROM public.permissions 
WHERE name IN ('score:read', 'score:create', 'kyc:read', 'dataset:read', 'dataset:create', 'settings:read', 'settings:update', 'billing:read');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'API_CLIENT', id FROM public.permissions 
WHERE name IN ('score:read', 'score:create', 'kyc:read', 'kyc:create', 'api:manage', 'webhook:manage', 'billing:read');