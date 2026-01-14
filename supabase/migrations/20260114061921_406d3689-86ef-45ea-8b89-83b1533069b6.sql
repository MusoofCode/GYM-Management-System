-- Add foreign key constraints to fix schema cache relationships
-- This will help PostgREST understand the table relationships properly

-- Add foreign key from profiles.user_id to auth.users(id) if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_user_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from user_roles.user_id to auth.users(id) if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_roles_user_id_fkey' 
    AND table_name = 'user_roles'
  ) THEN
    ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';