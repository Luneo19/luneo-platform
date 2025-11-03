-- ═══════════════════════════════════════════════════════════════
-- 🎨 LUNEO PLATFORM - WHITE-LABEL SYSTEM
-- ═══════════════════════════════════════════════════════════════
-- Description: Multi-tenant white-label (branding personnalisé)
-- Author: AI Expert
-- Date: 2025-10-26
-- ═══════════════════════════════════════════════════════════════

-- ============================================
-- TABLE: brand_settings
-- ============================================

CREATE TABLE IF NOT EXISTS public.brand_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Branding
  brand_name TEXT,
  brand_logo_url TEXT,
  brand_favicon_url TEXT,
  brand_primary_color TEXT DEFAULT '#6366f1',
  brand_secondary_color TEXT DEFAULT '#8b5cf6',
  brand_accent_color TEXT DEFAULT '#ec4899',
  
  -- Custom domain
  custom_domain TEXT UNIQUE,
  domain_verified BOOLEAN DEFAULT false,
  domain_verified_at TIMESTAMPTZ,
  ssl_enabled BOOLEAN DEFAULT true,
  
  -- Email branding
  email_from_name TEXT,
  email_from_address TEXT,
  email_reply_to TEXT,
  email_logo_url TEXT,
  email_footer_text TEXT,
  
  -- UI customization
  theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'auto')),
  font_family TEXT DEFAULT 'Inter',
  border_radius TEXT DEFAULT '8px',
  
  -- Features toggles
  features_enabled JSONB DEFAULT '{
    "ai_studio": true,
    "ar_studio": true,
    "integrations": true,
    "team": true,
    "analytics": true
  }'::jsonb,
  
  -- Custom CSS
  custom_css TEXT,
  custom_js TEXT,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  
  -- Social
  social_links JSONB DEFAULT '{}'::jsonb,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_brand_settings_user_id ON public.brand_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_settings_domain ON public.brand_settings(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_brand_settings_verified ON public.brand_settings(domain_verified) WHERE domain_verified = true;

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own brand settings" ON public.brand_settings;
CREATE POLICY "Users can view own brand settings" 
  ON public.brand_settings FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own brand settings" ON public.brand_settings;
CREATE POLICY "Users can create own brand settings" 
  ON public.brand_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own brand settings" ON public.brand_settings;
CREATE POLICY "Users can update own brand settings" 
  ON public.brand_settings FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view verified domains" ON public.brand_settings;
CREATE POLICY "Anyone can view verified domains" 
  ON public.brand_settings FOR SELECT 
  USING (domain_verified = true AND custom_domain IS NOT NULL);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_brand_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_brand_settings_updated_at ON public.brand_settings;
CREATE TRIGGER trigger_update_brand_settings_updated_at
  BEFORE UPDATE ON public.brand_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_settings_updated_at();

-- Créer des brand_settings par défaut à l'inscription
CREATE OR REPLACE FUNCTION create_default_brand_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.brand_settings (user_id, brand_name)
  VALUES (NEW.id, 'Ma Marque')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_brand_settings ON auth.users;
CREATE TRIGGER trigger_create_brand_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_brand_settings();

-- ============================================
-- FUNCTIONS HELPER
-- ============================================

-- Obtenir les brand settings par custom domain
CREATE OR REPLACE FUNCTION get_brand_by_domain(p_domain TEXT)
RETURNS TABLE (
  user_id UUID,
  brand_name TEXT,
  brand_logo_url TEXT,
  brand_primary_color TEXT,
  features_enabled JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bs.user_id,
    bs.brand_name,
    bs.brand_logo_url,
    bs.brand_primary_color,
    bs.features_enabled
  FROM public.brand_settings bs
  WHERE bs.custom_domain = p_domain
  AND bs.domain_verified = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérifier si un domaine est disponible
CREATE OR REPLACE FUNCTION is_domain_available(p_domain TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  domain_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.brand_settings 
    WHERE custom_domain = p_domain
  ) INTO domain_exists;
  
  RETURN NOT domain_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- ✅ SCRIPT TERMINÉ
-- ═══════════════════════════════════════════════════════════════
-- 
-- Table créée :
--   ✅ brand_settings (white-label complet)
-- 
-- Fonctionnalités :
--   ✅ Branding personnalisé (logo, couleurs, fonts)
--   ✅ Custom domain avec vérification
--   ✅ Email branding
--   ✅ UI customization (CSS, JS)
--   ✅ Features toggles
--   ✅ SEO personnalisé
--   ✅ Auto-création à l'inscription
-- 
-- ═══════════════════════════════════════════════════════════════

