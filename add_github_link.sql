-- Run this script in the Supabase SQL Editor to add GitHub URL support

-- Add github_url column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url TEXT;

-- Add github_url column to orders table so users can access their purchase
ALTER TABLE orders ADD COLUMN IF NOT EXISTS github_url TEXT;
