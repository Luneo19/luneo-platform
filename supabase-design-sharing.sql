-- ═══════════════════════════════════════════════════════════════
-- 🔗 LUNEO PLATFORM - DESIGN SHARING SYSTEM
-- ═══════════════════════════════════════════════════════════════
-- Description: Système de partage public de designs avec tokens
-- Author: AI Expert
-- Date: 2025-10-25
-- ═══════════════════════════════════════════════════════════════

-- ============================================
-- TABLE: design_shares
-- ============================================

CREATE TABLE IF NOT EXISTS public.design_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE, -- Token public unique (URL-safe)
  title TEXT NOT NULL, -- Titre personnalisé pour le partage
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  requires_password BOOLEAN DEFAULT false,
  password_hash TEXT, -- Bcrypt hash si protection par mot de passe
  allow_download BOOLEAN DEFAULT false,
  allow_ar_view BOOLEAN DEFAULT true,
  show_branding BOOLEAN DEFAULT true, -- Afficher "Powered by Luneo"
  custom_message TEXT, -- Message personnalisé pour les visiteurs
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  ar_launch_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ, -- Date d'expiration (optionnelle)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_shares_design_id ON public.design_shares(design_id);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON public.design_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_token ON public.design_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_shares_active ON public.design_shares(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shares_expires ON public.design_shares(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- TABLE: share_analytics
-- ============================================

CREATE TABLE IF NOT EXISTS public.share_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES public.design_shares(id) ON DELETE CASCADE,
  visitor_id TEXT, -- Hash anonyme du visiteur (IP + User-Agent)
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'download', 'ar_launch', 'share')),
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT, -- mobile, tablet, desktop
  referrer TEXT,
  session_duration INTEGER, -- Durée de la session en secondes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour analytics
CREATE INDEX IF NOT EXISTS idx_share_analytics_share_id ON public.share_analytics(share_id);
CREATE INDEX IF NOT EXISTS idx_share_analytics_created_at ON public.share_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_analytics_action ON public.share_analytics(action_type);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.design_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_analytics ENABLE ROW LEVEL SECURITY;

-- Policies pour design_shares
DROP POLICY IF EXISTS "Users can view own shares" ON public.design_shares;
CREATE POLICY "Users can view own shares" 
  ON public.design_shares FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view active shares by token" ON public.design_shares;
CREATE POLICY "Anyone can view active shares by token" 
  ON public.design_shares FOR SELECT 
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

DROP POLICY IF EXISTS "Users can create own shares" ON public.design_shares;
CREATE POLICY "Users can create own shares" 
  ON public.design_shares FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own shares" ON public.design_shares;
CREATE POLICY "Users can update own shares" 
  ON public.design_shares FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own shares" ON public.design_shares;
CREATE POLICY "Users can delete own shares" 
  ON public.design_shares FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies pour share_analytics
DROP POLICY IF EXISTS "Users can view analytics of own shares" ON public.share_analytics;
CREATE POLICY "Users can view analytics of own shares" 
  ON public.share_analytics FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.design_shares 
      WHERE design_shares.id = share_analytics.share_id 
      AND design_shares.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service can insert analytics" ON public.share_analytics;
CREATE POLICY "Service can insert analytics" 
  ON public.share_analytics FOR INSERT 
  WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_design_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_shares_updated_at ON public.design_shares;
CREATE TRIGGER trigger_update_shares_updated_at
  BEFORE UPDATE ON public.design_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_design_shares_updated_at();

-- Trigger pour incrémenter les compteurs
CREATE OR REPLACE FUNCTION increment_share_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action_type = 'view' THEN
    UPDATE public.design_shares
    SET view_count = view_count + 1, last_viewed_at = NOW()
    WHERE id = NEW.share_id;
  ELSIF NEW.action_type = 'download' THEN
    UPDATE public.design_shares
    SET download_count = download_count + 1
    WHERE id = NEW.share_id;
  ELSIF NEW.action_type = 'ar_launch' THEN
    UPDATE public.design_shares
    SET ar_launch_count = ar_launch_count + 1
    WHERE id = NEW.share_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_increment_share_counters ON public.share_analytics;
CREATE TRIGGER trigger_increment_share_counters
  AFTER INSERT ON public.share_analytics
  FOR EACH ROW
  EXECUTE FUNCTION increment_share_counters();

-- ============================================
-- FUNCTIONS HELPER
-- ============================================

-- Générer un token unique de partage
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer un token aléatoire de 12 caractères (URL-safe)
    token := encode(gen_random_bytes(9), 'base64');
    token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
    
    -- Vérifier s'il existe déjà
    SELECT EXISTS(SELECT 1 FROM public.design_shares WHERE share_token = token) INTO token_exists;
    
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nettoyer les partages expirés
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS void AS $$
BEGIN
  UPDATE public.design_shares
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- ✅ SCRIPT TERMINÉ
-- ═══════════════════════════════════════════════════════════════
-- 
-- Tables créées :
--   ✅ design_shares (partages publics avec tokens)
--   ✅ share_analytics (analytics des partages)
-- 
-- Fonctionnalités :
--   ✅ Tokens uniques URL-safe
--   ✅ Protection par mot de passe (optionnelle)
--   ✅ Expiration automatique
--   ✅ Analytics détaillées (vues, downloads, AR)
--   ✅ RLS complet
--   ✅ Triggers pour compteurs
-- 
-- Prochaine étape :
--   Exécuter ce SQL dans Supabase Dashboard
-- 
-- ═══════════════════════════════════════════════════════════════

