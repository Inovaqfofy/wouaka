-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Update the check_password_hash function to use extensions schema
CREATE OR REPLACE FUNCTION public.check_password_hash(input_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  RETURN stored_hash = extensions.crypt(input_password, stored_hash);
END;
$$;

-- Also update add_access_password to use extensions schema
CREATE OR REPLACE FUNCTION public.add_access_password(p_password TEXT, p_label TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.access_passwords (password_hash, label, created_by)
  VALUES (
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    p_label,
    auth.uid()
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;