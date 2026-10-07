-- ==============================================================
-- FIX: Privilege Escalation & Deliverable Security Hardening
-- Run this in your Supabase SQL Editor
-- ==============================================================

-- 1. HARDEN is_admin() FUNCTION
-- REMOVE the insecure user_metadata check which allowed any user to self-promote to admin via Console!
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean AS $$
BEGIN
  RETURN (
    -- Primary verified admin email
    LOWER(auth.jwt() ->> 'email') = 'workspace7204@gmail.com'
    -- Or verified server-managed role in public.users table (if public.users exists)
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND LOWER(users.role) = 'admin'
    )
    -- Or server-set app_metadata (cannot be set by client)
    OR (auth.jwt() -> 'app_metadata' ->> 'role') ILIKE 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. HARDEN ORDERS RLS
-- Users can view ONLY their own orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" 
ON orders FOR SELECT 
TO authenticated 
USING (
  LOWER(customer_email) = LOWER(auth.jwt() ->> 'email')
  OR is_admin()
);

-- Only admin can update order deliverables and tracking IDs
DROP POLICY IF EXISTS "Admin can update orders" ON orders;
CREATE POLICY "Admin can update orders"
ON orders FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 3. PRODUCT_CONVERSATIONS DELETE POLICY
-- Allows users to withdraw/cancel and delete their own build inquiries without getting stuck
ALTER TABLE product_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can delete own conversations" ON product_conversations;
CREATE POLICY "Users can delete own conversations" 
ON product_conversations FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id OR is_admin());

