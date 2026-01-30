-- Create system_settings table if not exists
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Public can read public settings
CREATE POLICY "Anyone can read public settings"
  ON public.system_settings
  FOR SELECT
  USING (is_public = true);

-- Admins can manage all settings
CREATE POLICY "Admins can manage settings"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- Add maintenance_mode setting
INSERT INTO public.system_settings (key, value, description, is_public)
VALUES (
  'maintenance_mode',
  'true',
  'Activer/Désactiver la page Coming Soon',
  true
);

-- Create access_passwords table for storing hashed passwords
CREATE TABLE IF NOT EXISTS public.access_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  label TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  used_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.access_passwords ENABLE ROW LEVEL SECURITY;

-- Only admins can manage passwords
CREATE POLICY "Admins can manage access passwords"
  ON public.access_passwords
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- Public can check passwords (for validation)
CREATE POLICY "Anyone can validate passwords"
  ON public.access_passwords
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert default password hash for 'Wouska$'
INSERT INTO public.access_passwords (password_hash, label)
VALUES (
  crypt('Wouska$', gen_salt('bf')),
  'Mot de passe initial'
);