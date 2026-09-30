-- ==============================================================
-- Super-Easy Admin Access via Supabase Auth Metadata (Option 2)
-- Gives full admin permissions to:
-- 1. 'workspace7204@gmail.com' (Primary Admin)
-- 2. Any user with {"role": "admin"} in their User Metadata or App Metadata
-- ==============================================================

-- 1. Helper Function: is_admin()
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' = 'workspace7204@gmail.com'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') ILIKE 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') ILIKE 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================
-- 2. Projects RLS Policies
-- ==============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view projects" ON projects;
    DROP POLICY IF EXISTS "Admin can insert projects" ON projects;
    DROP POLICY IF EXISTS "Admin can update projects" ON projects;
    DROP POLICY IF EXISTS "Admin can delete projects" ON projects;
END $$;

CREATE POLICY "Public can view projects" 
ON projects FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Admin can insert projects" 
ON projects FOR INSERT 
TO authenticated 
WITH CHECK (is_admin());

CREATE POLICY "Admin can update projects" 
ON projects FOR UPDATE 
TO authenticated 
USING (is_admin());

CREATE POLICY "Admin can delete projects" 
ON projects FOR DELETE 
TO authenticated 
USING (is_admin());


-- ==============================================================
-- 3. Orders RLS Policies
-- ==============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admin can view orders" ON orders;
    DROP POLICY IF EXISTS "Admin can update orders" ON orders;
    DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
    DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
END $$;

CREATE POLICY "Admin can view orders" 
ON orders FOR SELECT 
TO authenticated 
USING (is_admin());

CREATE POLICY "Users can view their own orders" 
ON orders FOR SELECT 
TO authenticated 
USING (LOWER(customer_email) = LOWER(auth.jwt() ->> 'email'));

CREATE POLICY "Admin can update orders" 
ON orders FOR UPDATE 
TO authenticated 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Anyone can insert orders" 
ON orders FOR INSERT 
TO public 
WITH CHECK (true);


-- ==============================================================
-- 4. Product Conversations (Chats) RLS Policies
-- ==============================================================
ALTER TABLE product_conversations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own conversations" ON product_conversations;
    DROP POLICY IF EXISTS "Users can insert own conversations" ON product_conversations;
    DROP POLICY IF EXISTS "Users and admin can update conversations" ON product_conversations;
END $$;

CREATE POLICY "Users can view own conversations"
ON product_conversations FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can insert own conversations"
ON product_conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admin can update conversations"
ON product_conversations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR is_admin());


-- ==============================================================
-- 5. Storage (project-images bucket) RLS Policies
-- ==============================================================
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view project images" ON storage.objects;
    DROP POLICY IF EXISTS "Admin can upload project images" ON storage.objects;
    DROP POLICY IF EXISTS "Admin can update project images" ON storage.objects;
    DROP POLICY IF EXISTS "Admin can delete project images" ON storage.objects;
END $$;

CREATE POLICY "Public can view project images" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'project-images');

CREATE POLICY "Admin can upload project images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'project-images' AND is_admin());

CREATE POLICY "Admin can update project images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'project-images' AND is_admin());

CREATE POLICY "Admin can delete project images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'project-images' AND is_admin());
