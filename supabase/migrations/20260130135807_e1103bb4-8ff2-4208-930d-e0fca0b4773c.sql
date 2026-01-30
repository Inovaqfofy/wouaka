-- Create a function to verify access password using bcrypt
CREATE OR REPLACE FUNCTION public.check_password_hash(input_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$;