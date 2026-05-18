-- Run this script in the Supabase SQL Editor to fix the orders visibility issue in the user profile

-- Enable Row Level Security on the orders table just in case it isn't already
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 1. Ensure the admin can view all orders
DROP POLICY IF EXISTS "Admin can view orders" ON orders;
CREATE POLICY "Admin can view orders" 
ON orders FOR SELECT 
TO authenticated 
USING (auth.jwt() ->> 'email' = 'workspace7204@gmail.com');

-- 2. Allow users to view their OWN orders based on customer_email (case insensitive)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" 
ON orders FOR SELECT 
TO authenticated 
USING (LOWER(customer_email) = LOWER(auth.jwt() ->> 'email'));

-- 3. Ensure anyone can insert orders (so checkout works)
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
CREATE POLICY "Anyone can insert orders"
ON orders FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can insert orders" ON orders;
CREATE POLICY "Anon can insert orders"
ON orders FOR INSERT
TO anon
WITH CHECK (true);
