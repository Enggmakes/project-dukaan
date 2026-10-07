-- ==============================================================
-- PROJECT DUKAAN: CUSTOM INQUIRY PRICE OVERRIDE COLUMN
-- Run this in your Supabase SQL Editor to allow engineers to set
-- personalized project price quotes per student inquiry.
-- ==============================================================

ALTER TABLE public.product_conversations 
ADD COLUMN IF NOT EXISTS custom_price NUMERIC DEFAULT NULL;
