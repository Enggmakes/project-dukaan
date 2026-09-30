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
-- 2. Create Product Conversations Table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
-- 3. Create Chat Messages Table
-- ==============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES product_conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'user', -- 'user' or 'admin'
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users and admin can view messages" ON chat_messages;
    DROP POLICY IF EXISTS "Users and admin can insert messages" ON chat_messages;
END $$;

CREATE POLICY "Users and admin can view messages"
ON chat_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM product_conversations c
        WHERE c.id = chat_messages.conversation_id
        AND (c.user_id = auth.uid() OR auth.jwt() ->> 'email' = 'workspace7204@gmail.com')
    )
);

CREATE POLICY "Users and admin can insert messages"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM product_conversations c
        WHERE c.id = chat_messages.conversation_id
        AND (c.user_id = auth.uid() OR auth.jwt() ->> 'email' = 'workspace7204@gmail.com')
    )
);

-- ==============================================================
-- 4. Enable Realtime Publications
-- ==============================================================
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'product_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE product_conversations;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    END IF;
END $$;

-- ==============================================================
-- 5. Soft Delete (Admin Side Only) & 5-Day Auto-Purge
-- ==============================================================
ALTER TABLE product_conversations ADD COLUMN IF NOT EXISTS admin_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE product_conversations ADD COLUMN IF NOT EXISTS admin_cleared_at TIMESTAMP WITH TIME ZONE;

-- Automatically purge chats older than 5 days
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

-- Automatically unhide conversation in admin view when client sends a new message
CREATE OR REPLACE FUNCTION unhide_conversation_on_user_message()
RETURNS trigger AS $$
BEGIN
    IF NEW.sender_role = 'user' THEN
        UPDATE product_conversations 
        SET admin_deleted = FALSE, 
            status = 'active', 
            last_message = NEW.message,
            last_message_at = NEW.created_at,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_unhide_on_user_message ON chat_messages;
CREATE TRIGGER trigger_unhide_on_user_message
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION unhide_conversation_on_user_message();


