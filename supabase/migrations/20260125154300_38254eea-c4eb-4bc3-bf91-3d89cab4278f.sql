-- Politique INSERT pour audit_logs (Super Admin uniquement)
CREATE POLICY "Super admins can insert audit logs"
ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- Politique INSERT pour invoices (Super Admin uniquement)
CREATE POLICY "Super admins can insert invoices"
ON public.invoices
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- Politique UPDATE pour invoices (Super Admin peut mettre à jour le statut)
CREATE POLICY "Super admins can update invoices"
ON public.invoices
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- Politique SELECT pour invoices (Super Admin peut voir toutes les factures)
CREATE POLICY "Super admins can view all invoices"
ON public.invoices
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));