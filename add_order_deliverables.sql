-- ==============================================================
-- Add Deliverables JSONB column to orders table
-- Stores custom links (GitHub, Drive, Video, PDF, Notes) per order
-- ==============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '{}'::jsonb;

-- Ensure RLS allows admin to update orders and deliverables
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admin can update orders" ON orders;
END $$;

CREATE POLICY "Admin can update orders"
ON orders FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = 'workspace7204@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'workspace7204@gmail.com');
