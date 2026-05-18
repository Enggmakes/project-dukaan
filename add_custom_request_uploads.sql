-- Run this in the Supabase SQL Editor to enable requirement document uploads for custom build requests

-- 1. Create a new storage bucket for requirements files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('requirements-files', 'requirements-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Allow anyone (anonymous/public) to upload files to this bucket
DROP POLICY IF EXISTS "Public Upload custom request files" ON storage.objects;
CREATE POLICY "Public Upload custom request files" 
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'requirements-files');

DROP POLICY IF EXISTS "Anon Upload custom request files" ON storage.objects;
CREATE POLICY "Anon Upload custom request files" 
ON storage.objects FOR INSERT 
TO anon 
WITH CHECK (bucket_id = 'requirements-files');

-- 3. Policy: Allow anyone to read files from this bucket (so admin/users can view them)
DROP POLICY IF EXISTS "Public Access custom request files" ON storage.objects;
CREATE POLICY "Public Access custom request files" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'requirements-files');

-- 4. Add document_url column to the custom_requests table
ALTER TABLE custom_requests ADD COLUMN IF NOT EXISTS document_url TEXT;
