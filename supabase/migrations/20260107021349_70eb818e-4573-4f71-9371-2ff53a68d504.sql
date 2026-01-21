
-- Create function to handle new user registration
-- This will be called via trigger when auth.users gets a new record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _employee_id uuid;
  _default_role_id uuid;
BEGIN
  -- Find employee by email (email from auth.users)
  SELECT id INTO _employee_id
  FROM public.employees
  WHERE email = NEW.email;
  
  -- If employee found, create user record
  IF _employee_id IS NOT NULL THEN
    -- Insert into users table
    INSERT INTO public.users (id, employee_id)
    VALUES (NEW.id, _employee_id)
    ON CONFLICT (id) DO NOTHING;
    
    -- Get default 'user' role id
    SELECT id INTO _default_role_id
    FROM public.roles
    WHERE code = 'user';
    
    -- Assign default 'user' role
    IF _default_role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role_id)
      VALUES (NEW.id, _default_role_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
