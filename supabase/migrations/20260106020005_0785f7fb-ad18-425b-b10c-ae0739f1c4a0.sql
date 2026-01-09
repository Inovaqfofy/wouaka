-- Update handle_new_user to use role from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  selected_role app_role;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Get role from metadata, default to ENTREPRISE
  -- Only allow ANALYSTE, ENTREPRISE, API_CLIENT from signup
  selected_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'role', '')::app_role,
    'ENTREPRISE'::app_role
  );
  
  -- Prevent SUPER_ADMIN from being assigned via signup
  IF selected_role = 'SUPER_ADMIN' THEN
    selected_role := 'ENTREPRISE';
  END IF;
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role);
  
  RETURN NEW;
END;
$function$;

-- Transform fofanay@gmail.com to SUPER_ADMIN
UPDATE public.user_roles 
SET role = 'SUPER_ADMIN'
WHERE user_id = (
  SELECT id FROM public.profiles WHERE email = 'fofanay@gmail.com'
);