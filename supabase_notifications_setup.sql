-- ==========================================
-- Subscribers Table + Notifications Setup
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Subscribers table
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (insert)
CREATE POLICY "Allow public inserts on subscribers"
  ON public.subscribers FOR INSERT
  WITH CHECK (true);

-- Only admin can view subscriber list
CREATE POLICY "Admin can view subscribers"
  ON public.subscribers FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'workspace7204@gmail.com');


-- ==========================================
-- 2. Enable Realtime on projects table
--    (Required for in-app bell notifications)
-- ==========================================

-- Run this to enable realtime for the projects table:
-- Go to Supabase Dashboard → Database → Replication
-- Toggle ON the "projects" table under "supabase_realtime" publication
-- OR run:
ALTER PUBLICATION supabase_realtime ADD TABLE projects;


-- ==========================================
-- 3. Database Webhook for Email Notifications
--    (Triggers Edge Function on project INSERT)
-- ==========================================
-- Go to: Supabase Dashboard → Database → Webhooks → Create a new webhook
-- 
-- Name: notify-subscribers-on-new-project
-- Table: projects
-- Events: INSERT
-- Type: Supabase Edge Functions
-- Edge Function: notify-subscribers
--
-- OR use the HTTP webhook option pointing to:
-- https://<your-project-ref>.supabase.co/functions/v1/notify-subscribers


-- ==========================================
-- 4. Edge Function Environment Variables
--    Set these in Supabase Dashboard → Edge Functions → notify-subscribers → Secrets
-- ==========================================
-- RESEND_API_KEY      = your Resend API key (get free at resend.com)
-- SITE_URL            = https://projectdukaan.vercel.app
-- (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase)
