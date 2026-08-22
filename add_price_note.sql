-- Run this in Supabase SQL Editor if you want to store custom price notes in your database
ALTER TABLE projects ADD COLUMN IF NOT EXISTS price_note TEXT;
