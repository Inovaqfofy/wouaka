-- Fix PUBLIC_DATA_EXPOSURE: Restrict access to sensitive configuration tables

-- 1. DROP existing overly permissive policies on subscription_plans
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Public can view active subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Authenticated users can view active plans" ON public.subscription_plans;

-- Create new policy: Only authenticated users can view active plans
CREATE POLICY "Authenticated users can view active plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (is_active = true);

-- 2. DROP existing overly permissive policies on data_source_credentials
DROP POLICY IF EXISTS "Anyone can view data source credentials" ON public.data_source_credentials;
DROP POLICY IF EXISTS "Public can view active data sources" ON public.data_source_credentials;
DROP POLICY IF EXISTS "Super admins can view data source credentials" ON public.data_source_credentials;

-- Create new policy: Only SUPER_ADMIN can view data source credentials
CREATE POLICY "Super admins can view data source credentials"
ON public.data_source_credentials
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- 3. DROP existing overly permissive policies on data_source_certainty
DROP POLICY IF EXISTS "Anyone can view data source certainty" ON public.data_source_certainty;
DROP POLICY IF EXISTS "Public can view active certainty configs" ON public.data_source_certainty;
DROP POLICY IF EXISTS "Authenticated users can view certainty configs" ON public.data_source_certainty;

-- Create new policy: Only authenticated users can view certainty configs
CREATE POLICY "Authenticated users can view certainty configs"
ON public.data_source_certainty
FOR SELECT
TO authenticated
USING (is_active = true);