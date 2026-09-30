-- ==========================================
-- Create the Wishlists Table (Idempotent)
-- ==========================================
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- Enable RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlists;
    DROP POLICY IF EXISTS "Users can insert to own wishlist" ON wishlists;
    DROP POLICY IF EXISTS "Users can delete own wishlist" ON wishlists;
    DROP POLICY IF EXISTS "Admin can view all wishlists" ON wishlists;
END $$;

-- Policy: Users can view their own wishlist items (and admin can view all)
CREATE POLICY "Users can view own wishlist" 
ON wishlists FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'workspace7204@gmail.com');

-- Policy: Users can add to their own wishlist
CREATE POLICY "Users can insert to own wishlist" 
ON wishlists FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove from their own wishlist
CREATE POLICY "Users can delete own wishlist" 
ON wishlists FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

