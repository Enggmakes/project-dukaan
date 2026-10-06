-- ==============================================================
-- PROJECT DUKAAN: INQUIRY DISCOUNT & LOTTERY BOUNDS COLUMNS
-- Run this in your Supabase SQL Editor to persist dynamic discount
-- prices and custom lottery bounds directly in product_conversations
-- ==============================================================

ALTER TABLE public.product_conversations 
ADD COLUMN IF NOT EXISTS applied_discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS discounted_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lottery_min_discount INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS lottery_max_discount INTEGER DEFAULT 30;
