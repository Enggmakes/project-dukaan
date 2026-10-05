-- ==============================================================
-- 1. Ensure Wishlists Table Exists with RLS
-- ==============================================================
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlists;
    DROP POLICY IF EXISTS "Users can insert to own wishlist" ON wishlists;
    DROP POLICY IF EXISTS "Users can delete own wishlist" ON wishlists;
    DROP POLICY IF EXISTS "Admin can view all wishlists" ON wishlists;
END $$;

CREATE POLICY "Users can view own wishlist" 
ON wishlists FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'workspace7204@gmail.com');

CREATE POLICY "Users can insert to own wishlist" 
ON wishlists FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist" 
ON wishlists FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);


-- ==============================================================
-- 2. Create / Upgrade Product Conversations Table
--    Stores messages as a JSONB list directly inside the row!
--    (1 row per inquiry thread, no table explosion)
-- ==============================================================
CREATE TABLE IF NOT EXISTS product_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    user_email TEXT NOT NULL,
    user_name TEXT,
    project_id TEXT,
    project_title TEXT NOT NULL,
    project_thumb TEXT,
    project_price NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active', -- 'active', 'purchased', 'archived'
    last_message TEXT DEFAULT '',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    messages JSONB DEFAULT '[]'::jsonb,
    admin_deleted BOOLEAN DEFAULT FALSE,
    admin_cleared_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all columns exist if the table was created earlier
ALTER TABLE product_conversations ADD COLUMN IF NOT EXISTS messages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE product_conversations ADD COLUMN IF NOT EXISTS admin_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE product_conversations ADD COLUMN IF NOT EXISTS admin_cleared_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE product_conversations ADD COLUMN IF NOT EXISTS last_message TEXT DEFAULT '';
ALTER TABLE product_conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Migrate existing chat_messages into messages JSONB if chat_messages exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        UPDATE product_conversations c
        SET messages = COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', m.id,
                        'conversation_id', m.conversation_id,
                        'sender_id', m.sender_id,
                        'sender_role', m.sender_role,
                        'sender_name', m.sender_name,
                        'message', m.message,
                        'created_at', m.created_at
                    ) ORDER BY m.created_at ASC
                )
                FROM chat_messages m
                WHERE m.conversation_id = c.id
            ),
            '[]'::jsonb
        )
        WHERE messages IS NULL OR messages = '[]'::jsonb;
    END IF;
END $$;

ALTER TABLE product_conversations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own conversations" ON product_conversations;
    DROP POLICY IF EXISTS "Users can insert own conversations" ON product_conversations;
    DROP POLICY IF EXISTS "Users and admin can update conversations" ON product_conversations;
END $$;

CREATE POLICY "Users can view own conversations"
ON product_conversations FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'workspace7204@gmail.com');

CREATE POLICY "Users can insert own conversations"
ON product_conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admin can update conversations"
ON product_conversations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'workspace7204@gmail.com');


-- ==============================================================
-- 3. Enable Realtime Publications for product_conversations
-- ==============================================================
-- CRITICAL for Supabase Realtime with RLS: REPLICA IDENTITY FULL guarantees
-- that all column updates (including messages JSONB) broadcast to websocket subscribers
ALTER TABLE product_conversations REPLICA IDENTITY FULL;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'product_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE product_conversations;
    END IF;
END $$;


-- ==============================================================
-- 4. 5-Day Auto-Purge Trigger
--    Automatically purges inactive conversations older than 5 days
-- ==============================================================
CREATE OR REPLACE FUNCTION purge_expired_chats()
RETURNS trigger AS $$
BEGIN
    DELETE FROM product_conversations 
    WHERE last_message_at < NOW() - INTERVAL '5 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_purge_expired_chats ON product_conversations;
CREATE TRIGGER trigger_purge_expired_chats
AFTER INSERT OR UPDATE ON product_conversations
FOR EACH STATEMENT
EXECUTE FUNCTION purge_expired_chats();
