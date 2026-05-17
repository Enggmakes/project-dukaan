-- ==========================================
-- 1. Create the Projects Table
-- ==========================================
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    short TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    price INTEGER NOT NULL,
    rating NUMERIC DEFAULT 5.0,
    reviews INTEGER DEFAULT 0,
    tech TEXT[] NOT NULL,
    features TEXT[] DEFAULT '{}',
    includes TEXT[] DEFAULT '{}',
    screenshots TEXT[] DEFAULT '{}',
    video_url TEXT,
    thumb TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on the table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read/view the projects
CREATE POLICY "Anyone can view projects" 
ON projects FOR SELECT 
USING (true);

-- Policy: Only the specific admin email can insert projects
CREATE POLICY "Admin can insert projects" 
ON projects FOR INSERT 
TO authenticated 
WITH CHECK (auth.jwt() ->> 'email' = 'workspace7204@gmail.com');

-- Policy: Only the specific admin email can update projects
CREATE POLICY "Admin can update projects" 
ON projects FOR UPDATE 
TO authenticated 
USING (auth.jwt() ->> 'email' = 'workspace7204@gmail.com');

-- Policy: Only the specific admin email can delete projects
CREATE POLICY "Admin can delete projects" 
ON projects FOR DELETE 
TO authenticated 
USING (auth.jwt() ->> 'email' = 'workspace7204@gmail.com');


-- ==========================================
-- 2. Create the Storage Bucket for Images
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view the images
CREATE POLICY "Public Image Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'project-images');

-- Policy: Only the admin can upload images
CREATE POLICY "Admin Image Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'project-images' AND auth.jwt() ->> 'email' = 'workspace7204@gmail.com');

-- Policy: Only the admin can update images
CREATE POLICY "Admin Image Update" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'project-images' AND auth.jwt() ->> 'email' = 'workspace7204@gmail.com');

-- Policy: Only the admin can delete images
CREATE POLICY "Admin Image Delete" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'project-images' AND auth.jwt() ->> 'email' = 'workspace7204@gmail.com');


-- ==========================================
-- 3. Create the Custom Requests (Leads) Table
-- ==========================================
CREATE TABLE custom_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    college TEXT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    tech TEXT,
    budget TEXT NOT NULL,
    deadline TEXT NOT NULL,
    contact_method TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'New',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (insert)
CREATE POLICY "Public can insert custom requests"
ON custom_requests FOR INSERT
TO public
WITH CHECK (true);
CREATE POLICY "Anon can insert custom requests"
ON custom_requests FOR INSERT
TO anon
WITH CHECK (true);

-- Only admin can view/update
CREATE POLICY "Admin can view custom requests"
ON custom_requests FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = 'workspace7204@gmail.com');

CREATE POLICY "Admin can update custom requests"
ON custom_requests FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = 'workspace7204@gmail.com');

-- Policy: Only the admin can upload images
CREATE POLICY "Admin Image Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'project-images' AND auth.jwt() ->> 'email' = 'workspace7204@gmail.com');

-- Policy: Only the admin can update images
CREATE POLICY "Admin Image Update" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'project-images' AND auth.jwt() ->> 'email' = 'workspace7204@gmail.com');

-- Policy: Only the admin can delete images
CREATE POLICY "Admin Image Delete" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'project-images' AND auth.jwt() ->> 'email' = 'workspace7204@gmail.com');


-- ==========================================
-- 4. Create the Contact Messages Table
-- ==========================================
CREATE TABLE contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (insert)
CREATE POLICY "Public can insert contact messages"
ON contact_messages FOR INSERT
TO public
WITH CHECK (true);
CREATE POLICY "Anon can insert contact messages"
ON contact_messages FOR INSERT
TO anon
WITH CHECK (true);

-- Only admin can view/delete
CREATE POLICY "Admin can view contact messages"
ON contact_messages FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = 'workspace7204@gmail.com');

CREATE POLICY "Admin can delete contact messages"
ON contact_messages FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' = 'workspace7204@gmail.com');

