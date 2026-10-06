-- ==============================================================
-- Add lottery_unlocked column to product_conversations
-- Allows admin to grant isolated scratch tickets per student
-- ==============================================================
ALTER TABLE product_conversations 
ADD COLUMN IF NOT EXISTS lottery_unlocked BOOLEAN DEFAULT FALSE;
