-- Add RLS policies for SUPER_ADMIN to manage certificate_subscriptions

-- Allow SUPER_ADMIN to insert subscriptions for any user
CREATE POLICY "Super admins can insert any subscription"
ON public.certificate_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- Allow SUPER_ADMIN to update any subscription
CREATE POLICY "Super admins can update any subscription"
ON public.certificate_subscriptions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- Allow SUPER_ADMIN to view all subscriptions
CREATE POLICY "Super admins can view all subscriptions"
ON public.certificate_subscriptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- Also add policies for the subscriptions table (partner subscriptions)
-- Allow SUPER_ADMIN to insert subscriptions for any user
CREATE POLICY "Super admins can insert partner subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- Allow SUPER_ADMIN to update any subscription
CREATE POLICY "Super admins can update partner subscriptions"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- Allow SUPER_ADMIN to view all subscriptions
CREATE POLICY "Super admins can view all partner subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));