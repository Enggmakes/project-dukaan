-- ==============================================================
-- FIX: "Failed to delete user: Database error deleting user"
-- ==============================================================
-- Why this happens:
-- PostgreSQL prevents deleting rows from auth.users when other
-- tables (e.g., wishlists, product_conversations, public.users)
-- have foreign keys pointing to auth.users WITHOUT "ON DELETE CASCADE".
--
-- Running this script adds ON DELETE CASCADE to all foreign keys 
-- referencing auth.users(id), allowing you to delete users cleanly.
-- ==============================================================

-- 1. Fix wishlists foreign key
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'wishlists'
    ) THEN
        -- Find and drop existing foreign key on user_id
        ALTER TABLE public.wishlists DROP CONSTRAINT IF EXISTS wishlists_user_id_fkey;
        
        -- Re-add with ON DELETE CASCADE
        ALTER TABLE public.wishlists 
            ADD CONSTRAINT wishlists_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            
        RAISE NOTICE 'Updated public.wishlists foreign key with ON DELETE CASCADE';
    END IF;
END $$;


-- 2. Fix product_conversations foreign key
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'product_conversations'
    ) THEN
        -- Find and drop existing foreign key on user_id
        ALTER TABLE public.product_conversations DROP CONSTRAINT IF EXISTS product_conversations_user_id_fkey;
        
        -- Re-add with ON DELETE CASCADE
        ALTER TABLE public.product_conversations 
            ADD CONSTRAINT product_conversations_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            
        RAISE NOTICE 'Updated public.product_conversations foreign key with ON DELETE CASCADE';
    END IF;
END $$;


-- 3. Fix public.users foreign key (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
        
        ALTER TABLE public.users 
            ADD CONSTRAINT users_id_fkey 
            FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
            
        RAISE NOTICE 'Updated public.users foreign key with ON DELETE CASCADE';
    END IF;
END $$;


-- 4. Automatically find ANY remaining foreign keys in the public schema 
--    pointing to auth.users and ensure they all have ON DELETE CASCADE
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            tc.constraint_name, 
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_schema = 'auth'
          AND ccu.table_name = 'users'
          AND tc.table_schema = 'public'
    ) LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I;', 
                       r.table_schema, r.table_name, r.constraint_name);
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE;', 
                       r.table_schema, r.table_name, r.constraint_name, r.column_name);
        RAISE NOTICE 'Upgraded %.% constraint % to ON DELETE CASCADE', r.table_schema, r.table_name, r.constraint_name;
    END LOOP;
END $$;

-- Verify all foreign keys pointing to auth.users now have CASCADE
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema = 'auth'
  AND ccu.table_name = 'users';
