-- ==============================================================
-- PROJECT DUKAAN: REAL-TIME INQUIRIES & CHAT TRANSMISSION FIX
-- Run this in your Supabase SQL Editor if real-time updates are blocked by RLS or Publications
-- ==============================================================

-- 1. Ensure REPLICA IDENTITY FULL so Postgres WAL broadcasts full row payloads
ALTER TABLE public.product_conversations REPLICA IDENTITY FULL;

-- 2. Add product_conversations to supabase_realtime publication
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'product_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.product_conversations;
    END IF;
END $$;

-- 3. Verify and refresh RLS policies on product_conversations
ALTER TABLE public.product_conversations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own conversations" ON public.product_conversations;
    DROP POLICY IF EXISTS "Users can insert own conversations" ON public.product_conversations;
    DROP POLICY IF EXISTS "Users and admin can update conversations" ON public.product_conversations;
    DROP POLICY IF EXISTS "Admin full access to conversations" ON public.product_conversations;
END $$;

-- Allow user to view their own conversations OR admin to view all
CREATE POLICY "Users can view own conversations"
ON public.product_conversations FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' = 'workspace7204@gmail.com'
    OR LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'admin'
    OR LOWER(COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '')) = 'admin'
);

-- Allow authenticated users to create build inquiries
CREATE POLICY "Users can insert own conversations"
ON public.product_conversations FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' = 'workspace7204@gmail.com'
    OR LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'admin'
);

-- Allow user to update their own conversations OR admin to reply
CREATE POLICY "Users and admin can update conversations"
ON public.product_conversations FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' = 'workspace7204@gmail.com'
    OR LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'admin'
    OR LOWER(COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '')) = 'admin'
);

-- Allow admins to delete/archive conversations
CREATE POLICY "Admin full delete access to conversations"
ON public.product_conversations FOR DELETE
TO authenticated
USING (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' = 'workspace7204@gmail.com'
    OR LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'admin'
    OR LOWER(COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '')) = 'admin'
);
