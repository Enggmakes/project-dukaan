-- ==============================================================
-- 1. Create Public "users" Table with "role" column
--    Allows changing role to 'admin' directly in Supabase Table Editor!
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user', -- 'user' or 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS is active
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Backfill all existing auth.users into public.users
INSERT INTO public.users (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1)), 
    CASE WHEN LOWER(email) = 'workspace7204@gmail.com' THEN 'admin' ELSE 'user' END
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    role = CASE WHEN LOWER(EXCLUDED.email) = 'workspace7204@gmail.com' THEN 'admin' ELSE public.users.role END;

-- 3. Automatic Trigger: Whenever a new user signs up, insert them into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    CASE WHEN LOWER(new.email) = 'workspace7204@gmail.com' THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Helper Function: is_admin() checks public.users table!
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' = 'workspace7204@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND LOWER(users.role) = 'admin'
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'role') ILIKE 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS Policies on public.users table
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can read own row or admin reads all" ON public.users;
    DROP POLICY IF EXISTS "Admins can update user roles" ON public.users;
END $$;

CREATE POLICY "Users can read own row or admin reads all"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id OR is_admin());

CREATE POLICY "Admins can update user roles"
ON public.users FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 6. Attach is_admin() to Projects, Orders, Chats, and Storage
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view projects" ON projects;
    DROP POLICY IF EXISTS "Admin can insert projects" ON projects;
    DROP POLICY IF EXISTS "Admin can update projects" ON projects;
    DROP POLICY IF EXISTS "Admin can delete projects" ON projects;
END $$;

CREATE POLICY "Public can view projects" ON projects FOR SELECT TO public USING (true);
CREATE POLICY "Admin can insert projects" ON projects FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admin can update projects" ON projects FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admin can delete projects" ON projects FOR DELETE TO authenticated USING (is_admin());

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admin can view orders" ON orders;
    DROP POLICY IF EXISTS "Admin can update orders" ON orders;
    DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
    DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
END $$;

CREATE POLICY "Admin can view orders" ON orders FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT TO authenticated USING (LOWER(customer_email) = LOWER(auth.jwt() ->> 'email'));
CREATE POLICY "Admin can update orders" ON orders FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Anyone can insert orders" ON orders FOR INSERT TO public WITH CHECK (true);

ALTER TABLE product_conversations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own conversations" ON product_conversations;
    DROP POLICY IF EXISTS "Users can insert own conversations" ON product_conversations;
    DROP POLICY IF EXISTS "Users and admin can update conversations" ON product_conversations;
END $$;

CREATE POLICY "Users can view own conversations" ON product_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can insert own conversations" ON product_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users and admin can update conversations" ON product_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id OR is_admin());
