-- Create RPC function to add password with hash
CREATE OR REPLACE FUNCTION public.add_access_password(p_password TEXT, p_label TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.access_passwords (password_hash, label, created_by)
  VALUES (
    crypt(p_password, gen_salt('bf')),
    p_label,
    auth.uid()
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Grant execute to authenticated users (admin check is in RLS)
GRANT EXECUTE ON FUNCTION public.add_access_password(TEXT, TEXT) TO authenticated;