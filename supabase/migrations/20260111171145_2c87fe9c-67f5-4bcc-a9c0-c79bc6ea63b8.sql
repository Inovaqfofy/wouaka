-- Phase 1b: Migration des utilisateurs et mise à jour des fonctions

-- Migrer les utilisateurs existants ENTREPRISE, ANALYSTE et API_CLIENT vers PARTENAIRE
UPDATE public.user_roles 
SET role = 'PARTENAIRE' 
WHERE role IN ('ENTREPRISE', 'ANALYSTE', 'API_CLIENT');

-- Ajouter user_id à loan_applications pour lier l'emprunteur
ALTER TABLE public.loan_applications 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id 
ON public.loan_applications(user_id);

-- Mettre à jour le trigger handle_new_user pour gérer les nouveaux rôles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role app_role;
  default_role app_role := 'EMPRUNTEUR';
BEGIN
  -- Récupérer le rôle demandé depuis les métadonnées
  requested_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    default_role
  );
  
  -- Convertir les anciens rôles en nouveaux rôles
  IF requested_role IN ('ENTREPRISE', 'ANALYSTE', 'API_CLIENT') THEN
    requested_role := 'PARTENAIRE';
  END IF;
  
  -- Empêcher l'auto-attribution du rôle SUPER_ADMIN
  IF requested_role = 'SUPER_ADMIN' THEN
    requested_role := default_role;
  END IF;

  -- Créer le profil
  INSERT INTO public.profiles (id, email, full_name, phone, company, avatar_url, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    '',
    true
  );

  -- Attribuer le rôle
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested_role);

  RETURN NEW;
END;
$$;

-- Fonction pour vérifier si l'utilisateur est un partenaire (inclut les anciens rôles pour rétrocompatibilité)
CREATE OR REPLACE FUNCTION public.is_partner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('PARTENAIRE', 'ENTREPRISE', 'ANALYSTE', 'API_CLIENT')
  )
$$;

-- Fonction pour vérifier si l'utilisateur est un emprunteur
CREATE OR REPLACE FUNCTION public.is_borrower(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'EMPRUNTEUR'
  )
$$;

-- Supprimer les anciennes policies sur loan_applications si elles existent
DROP POLICY IF EXISTS "Borrowers can view own applications" ON public.loan_applications;
DROP POLICY IF EXISTS "Borrowers can create own applications" ON public.loan_applications;
DROP POLICY IF EXISTS "Borrowers can update own applications" ON public.loan_applications;

-- RLS policy pour loan_applications: les emprunteurs peuvent voir leurs propres candidatures
CREATE POLICY "Borrowers can view own applications"
ON public.loan_applications
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  public.is_partner(auth.uid()) OR
  public.has_role(auth.uid(), 'SUPER_ADMIN')
);

-- RLS policy pour loan_applications: les emprunteurs peuvent créer leurs propres candidatures
CREATE POLICY "Borrowers can create own applications"
ON public.loan_applications
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL
);

-- RLS policy pour loan_applications: les emprunteurs peuvent mettre à jour leurs propres candidatures
CREATE POLICY "Borrowers can update own applications"
ON public.loan_applications
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR
  public.is_partner(auth.uid()) OR
  public.has_role(auth.uid(), 'SUPER_ADMIN')
);