-- ═══════════════════════════════════════════════════════════════
-- 🔐 LUNEO PLATFORM - 2FA SYSTEM
-- ═══════════════════════════════════════════════════════════════
-- Description: Système d'authentification à 2 facteurs (TOTP)
-- Created: 2025-10-25
-- ═══════════════════════════════════════════════════════════════

-- ============================================
-- 1. TABLE: totp_secrets
-- ============================================
CREATE TABLE IF NOT EXISTS public.totp_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL, -- Secret TOTP chiffré
  backup_codes TEXT[], -- Codes de secours chiffrés
  is_enabled BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_totp_secrets_user_id ON public.totp_secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_totp_secrets_enabled ON public.totp_secrets(is_enabled);

-- ============================================
-- 2. TABLE: totp_attempts
-- ============================================
-- Pour tracker les tentatives de vérification (protection brute force)
CREATE TABLE IF NOT EXISTS public.totp_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_totp_attempts_user_id ON public.totp_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_totp_attempts_created_at ON public.totp_attempts(created_at);

-- ============================================
-- 3. RLS (ROW LEVEL SECURITY)
-- ============================================

-- Activer RLS
ALTER TABLE public.totp_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.totp_attempts ENABLE ROW LEVEL SECURITY;

-- Policies pour totp_secrets
DROP POLICY IF EXISTS "Users can view own TOTP secret" ON public.totp_secrets;
CREATE POLICY "Users can view own TOTP secret" 
  ON public.totp_secrets FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own TOTP secret" ON public.totp_secrets;
CREATE POLICY "Users can insert own TOTP secret" 
  ON public.totp_secrets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own TOTP secret" ON public.totp_secrets;
CREATE POLICY "Users can update own TOTP secret" 
  ON public.totp_secrets FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own TOTP secret" ON public.totp_secrets;
CREATE POLICY "Users can delete own TOTP secret" 
  ON public.totp_secrets FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies pour totp_attempts
DROP POLICY IF EXISTS "Users can view own TOTP attempts" ON public.totp_attempts;
CREATE POLICY "Users can view own TOTP attempts" 
  ON public.totp_attempts FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert TOTP attempts" ON public.totp_attempts;
CREATE POLICY "Service role can insert TOTP attempts" 
  ON public.totp_attempts FOR INSERT 
  WITH CHECK (true); -- API route utilise service role

-- ============================================
-- 4. TRIGGER: updated_at
-- ============================================

-- Créer la fonction trigger si elle n'existe pas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à totp_secrets
DROP TRIGGER IF EXISTS update_totp_secrets_updated_at ON public.totp_secrets;
CREATE TRIGGER update_totp_secrets_updated_at
  BEFORE UPDATE ON public.totp_secrets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. FONCTION: cleanup_old_totp_attempts
-- ============================================
-- Nettoyer les tentatives de plus de 30 jours

CREATE OR REPLACE FUNCTION cleanup_old_totp_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.totp_attempts
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. FONCTION: get_recent_failed_attempts
-- ============================================
-- Obtenir le nombre d'échecs récents (15 dernières minutes)

CREATE OR REPLACE FUNCTION get_recent_failed_attempts(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  failed_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO failed_count
  FROM public.totp_attempts
  WHERE user_id = p_user_id
    AND success = false
    AND created_at > NOW() - INTERVAL '15 minutes';
  
  RETURN failed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. AJOUTER COLONNE À profiles
-- ============================================
-- Tracker si 2FA est requis pour ce user

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'requires_2fa'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN requires_2fa BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_requires_2fa ON public.profiles(requires_2fa);

-- ═══════════════════════════════════════════════════════════════
-- ✅ 2FA SYSTEM CRÉÉ AVEC SUCCÈS !
-- ═══════════════════════════════════════════════════════════════
-- 
-- Tables créées :
--   - totp_secrets (secrets TOTP + backup codes)
--   - totp_attempts (historique tentatives)
-- 
-- Fonctions créées :
--   - cleanup_old_totp_attempts() - Nettoyage automatique
--   - get_recent_failed_attempts() - Protection brute force
-- 
-- Next steps :
--   1. Créer API routes (/api/2fa/setup, /api/2fa/verify, /api/2fa/disable)
--   2. Intégrer UI dans Settings
--   3. Implémenter middleware pour vérifier 2FA au login
-- 
-- ═══════════════════════════════════════════════════════════════

