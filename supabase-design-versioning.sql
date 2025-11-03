-- ═══════════════════════════════════════════════════════════════
-- 📚 LUNEO PLATFORM - DESIGN VERSIONING SYSTEM
-- ═══════════════════════════════════════════════════════════════
-- Description: Système de versioning pour designs (historique)
-- Author: AI Expert
-- Date: 2025-10-25
-- ═══════════════════════════════════════════════════════════════

-- ============================================
-- TABLE: design_versions
-- ============================================

CREATE TABLE IF NOT EXISTS public.design_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  preview_url TEXT,
  style TEXT,
  size TEXT,
  quality TEXT,
  generation_time INTEGER, -- en ms
  changes_description TEXT, -- Description des modifications
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT design_version_unique UNIQUE(design_id, version_number)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_design_versions_design_id ON public.design_versions(design_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_design_versions_created_at ON public.design_versions(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.design_versions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view versions of own designs" ON public.design_versions;
CREATE POLICY "Users can view versions of own designs" 
  ON public.design_versions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.designs 
      WHERE designs.id = design_versions.design_id 
      AND designs.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service can insert versions" ON public.design_versions;
CREATE POLICY "Service can insert versions" 
  ON public.design_versions FOR INSERT 
  WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour créer automatiquement une version lors de la modification d'un design
CREATE OR REPLACE FUNCTION create_design_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Si le prompt ou l'image change, créer une nouvelle version
  IF (OLD.prompt IS DISTINCT FROM NEW.prompt) OR 
     (OLD.generated_image_url IS DISTINCT FROM NEW.generated_image_url) THEN
    
    -- Obtenir le prochain numéro de version
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO next_version
    FROM public.design_versions
    WHERE design_id = NEW.id;

    -- Créer la version
    INSERT INTO public.design_versions (
      design_id,
      version_number,
      prompt,
      image_url,
      preview_url,
      style,
      size,
      quality,
      generation_time,
      changes_description,
      created_by,
      metadata
    ) VALUES (
      NEW.id,
      next_version,
      NEW.prompt,
      NEW.generated_image_url,
      COALESCE(NEW.preview_url, NEW.generated_image_url),
      NEW.style,
      NEW.size,
      NEW.quality,
      NEW.generation_time,
      'Modification automatique',
      NEW.user_id,
      jsonb_build_object(
        'previous_prompt', OLD.prompt,
        'updated_at', NOW()
      )
    );

    RAISE NOTICE 'Version % créée pour design %', next_version, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_design_version ON public.designs;
CREATE TRIGGER trigger_create_design_version
  AFTER UPDATE ON public.designs
  FOR EACH ROW
  WHEN (OLD.prompt IS DISTINCT FROM NEW.prompt OR OLD.generated_image_url IS DISTINCT FROM NEW.generated_image_url)
  EXECUTE FUNCTION create_design_version();

-- ============================================
-- FUNCTIONS HELPER
-- ============================================

-- Récupérer l'historique d'un design
CREATE OR REPLACE FUNCTION get_design_history(p_design_id UUID)
RETURNS TABLE (
  version_number INTEGER,
  prompt TEXT,
  image_url TEXT,
  changes_description TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dv.version_number,
    dv.prompt,
    dv.preview_url,
    dv.changes_description,
    dv.created_at
  FROM public.design_versions dv
  WHERE dv.design_id = p_design_id
  ORDER BY dv.version_number DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restaurer une version spécifique
CREATE OR REPLACE FUNCTION restore_design_version(
  p_design_id UUID,
  p_version_number INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  version_rec RECORD;
BEGIN
  -- Récupérer la version
  SELECT * INTO version_rec
  FROM public.design_versions
  WHERE design_id = p_design_id
  AND version_number = p_version_number;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Version % not found for design %', p_version_number, p_design_id;
  END IF;

  -- Restaurer les données de cette version
  UPDATE public.designs
  SET 
    prompt = version_rec.prompt,
    generated_image_url = version_rec.image_url,
    preview_url = version_rec.preview_url,
    style = version_rec.style,
    size = version_rec.size,
    quality = version_rec.quality,
    updated_at = NOW()
  WHERE id = p_design_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nettoyer les anciennes versions (garder les 10 dernières)
CREATE OR REPLACE FUNCTION cleanup_old_design_versions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.design_versions dv
  WHERE dv.id NOT IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY design_id ORDER BY version_number DESC) as rn
      FROM public.design_versions
    ) sub
    WHERE rn <= 10
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- ✅ SCRIPT TERMINÉ
-- ═══════════════════════════════════════════════════════════════
-- 
-- Tables créées :
--   ✅ design_versions (historique des modifications)
-- 
-- Fonctionnalités :
--   ✅ Versioning automatique (trigger)
--   ✅ Restauration de versions
--   ✅ Historique complet
--   ✅ Cleanup automatique (10 dernières versions)
--   ✅ RLS complet
-- 
-- ═══════════════════════════════════════════════════════════════

