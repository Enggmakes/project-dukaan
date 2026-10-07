-- ==============================================================
-- PROJECT DUKAAN: MARKETING POPUPS & LIVE SCHEME BROADCASTS TABLE
-- Run this script in your Supabase SQL Editor
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.marketing_popups (
    id TEXT PRIMARY KEY DEFAULT 'default-scheme',
    enabled BOOLEAN DEFAULT TRUE,
    audience TEXT DEFAULT 'guests_only', -- 'guests_only', 'authenticated_only', 'all_visitors'
    badge TEXT DEFAULT 'STUDENT CAPSTONE INCENTIVE',
    title TEXT DEFAULT 'FLAT 25% OFF YOUR FIRST CAPSTONE BLUEPRINT',
    description TEXT DEFAULT 'Register a free account to unlock verified Flutter, AI & IoT codebases, IEEE synopses, and live consultation with lead project engineers.',
    coupon_code TEXT DEFAULT 'STUDENT2026',
    discount_percent NUMERIC DEFAULT 25,
    media_type TEXT DEFAULT 'image', -- 'none', 'image', 'video'
    media_url TEXT DEFAULT 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&auto=format&fit=crop&q=80',
    video_autoplay BOOLEAN DEFAULT TRUE,
    video_muted BOOLEAN DEFAULT TRUE,
    animation TEXT DEFAULT 'cyber_glitch', -- 'cyber_glitch', 'hologram_pulse', 'terminal_boot', 'smooth_fade'
    layout_mode TEXT DEFAULT 'with_buttons', -- 'with_buttons', 'no_buttons_pure_media'
    cta_text TEXT DEFAULT 'CREATE ACCOUNT & CLAIM 25% OFF',
    cta_link TEXT DEFAULT '/login',
    secondary_cta_text TEXT DEFAULT 'EXPLORE BLUEPRINTS',
    secondary_cta_link TEXT DEFAULT '/marketplace',
    auto_dismiss_seconds INTEGER DEFAULT 0,
    show_delay_seconds INTEGER DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.marketing_popups ENABLE ROW LEVEL SECURITY;

-- 1. All visitors (guests and authenticated) can read active popups
DROP POLICY IF EXISTS "Public can view active popups" ON public.marketing_popups;
CREATE POLICY "Public can view active popups" 
ON public.marketing_popups FOR SELECT 
TO public 
USING (true);

-- 2. Authenticated users (admin) can update/insert popups
DROP POLICY IF EXISTS "Authenticated can manage popups" ON public.marketing_popups;
CREATE POLICY "Authenticated can manage popups" 
ON public.marketing_popups FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Enable Realtime Replication
ALTER TABLE public.marketing_popups REPLICA IDENTITY FULL;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'marketing_popups'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_popups;
    END IF;
END $$;

-- Seed default initial scheme configuration
INSERT INTO public.marketing_popups (
    id, enabled, audience, badge, title, description, coupon_code, 
    discount_percent, media_type, media_url, animation, layout_mode, 
    cta_text, cta_link, secondary_cta_text, secondary_cta_link
)
VALUES (
    'default-scheme',
    TRUE,
    'guests_only',
    'STUDENT CAPSTONE INCENTIVE',
    'FLAT 25% OFF YOUR FIRST CAPSTONE BLUEPRINT',
    'Register a free account to unlock verified Flutter, AI & IoT codebases, IEEE synopses, and live consultation with lead project engineers.',
    'STUDENT2026',
    25,
    'image',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&auto=format&fit=crop&q=80',
    'cyber_glitch',
    'with_buttons',
    'CREATE ACCOUNT & CLAIM 25% OFF',
    '/login',
    'EXPLORE BLUEPRINTS',
    '/marketplace'
) ON CONFLICT (id) DO NOTHING;
