-- Bootstrap first admin user
-- This inserts the first admin role directly, bypassing RLS temporarily
-- using a security definer function

-- Create a one-time function to bootstrap the first admin
CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert admin role for village@gmail.com user
  INSERT INTO public.user_roles (user_id, role)
  VALUES ('277ba5c0-4f4b-4031-a590-68e510509536', 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Execute the bootstrap function
SELECT public.bootstrap_admin();

-- Drop the bootstrap function (no longer needed)
DROP FUNCTION public.bootstrap_admin();