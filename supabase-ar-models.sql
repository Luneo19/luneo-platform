-- ═══════════════════════════════════════════════════════════════
-- 🎨 LUNEO PLATFORM - AR MODELS SYSTEM
-- ═══════════════════════════════════════════════════════════════
-- Description: Système de gestion des modèles 3D pour réalité augmentée
-- Created: 2025-10-25
-- ═══════════════════════════════════════════════════════════════

-- ============================================
-- 1. TABLE: ar_models
-- ============================================
CREATE TABLE IF NOT EXISTS public.ar_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- URLs des fichiers 3D
  model_url TEXT NOT NULL, -- URL Cloudinary du modèle principal (GLB)
  usdz_url TEXT, -- URL pour iOS AR Quick Look
  thumbnail_url TEXT, -- Image de preview
  
  -- Format et metadata
  format TEXT NOT NULL DEFAULT 'glb', -- glb, usdz, fbx, obj
  file_size BIGINT, -- Taille en bytes
  
  -- Dimensions du modèle
  dimensions JSONB DEFAULT '{
    "width": 1.0,
    "height": 1.0,
    "depth": 1.0,
    "unit": "meters"
  }'::jsonb,
  
  -- Statistiques du mesh
  mesh_info JSONB DEFAULT '{
    "vertices": 0,
    "faces": 0,
    "materials": 0
  }'::jsonb,
  
  -- Configuration AR
  ar_config JSONB DEFAULT'{
    "scale": 1.0,
    "rotation": {"x": 0, "y": 0, "z": 0},
    "position": {"x": 0, "y": 0, "z": 0},
    "allow_scaling": true,
    "allow_rotation": true,
    "placement_mode": "horizontal"
  }'::jsonb,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[],
  
  -- Statut
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  is_public BOOLEAN DEFAULT false,
  
  -- Analytics
  views_count INTEGER DEFAULT 0,
  ar_launches_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ
);

-- Indexes pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_ar_models_user_id ON public.ar_models(user_id);
CREATE INDEX IF NOT EXISTS idx_ar_models_design_id ON public.ar_models(design_id);
CREATE INDEX IF NOT EXISTS idx_ar_models_status ON public.ar_models(status);
CREATE INDEX IF NOT EXISTS idx_ar_models_is_public ON public.ar_models(is_public);
CREATE INDEX IF NOT EXISTS idx_ar_models_created_at ON public.ar_models(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ar_models_tags ON public.ar_models USING GIN(tags);

-- ============================================
-- 2. TABLE: ar_interactions
-- ============================================
-- Tracker les interactions AR (analytics)
CREATE TABLE IF NOT EXISTS public.ar_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ar_model_id UUID NOT NULL REFERENCES public.ar_models(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'ar_launch', 'download', 'share')),
  
  -- Metadata de l'interaction
  session_duration INTEGER, -- Durée en secondes
  device_info JSONB, -- Info sur l'appareil
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ar_interactions_model_id ON public.ar_interactions(ar_model_id);
CREATE INDEX IF NOT EXISTS idx_ar_interactions_user_id ON public.ar_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ar_interactions_type ON public.ar_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ar_interactions_created_at ON public.ar_interactions(created_at DESC);

-- ============================================
-- 3. RLS (ROW LEVEL SECURITY)
-- ============================================

-- Activer RLS
ALTER TABLE public.ar_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ar_interactions ENABLE ROW LEVEL SECURITY;

-- Policies pour ar_models
DROP POLICY IF EXISTS "Users can view own AR models" ON public.ar_models;
CREATE POLICY "Users can view own AR models" 
  ON public.ar_models FOR SELECT 
  USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can insert own AR models" ON public.ar_models;
CREATE POLICY "Users can insert own AR models" 
  ON public.ar_models FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own AR models" ON public.ar_models;
CREATE POLICY "Users can update own AR models" 
  ON public.ar_models FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own AR models" ON public.ar_models;
CREATE POLICY "Users can delete own AR models" 
  ON public.ar_models FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies pour ar_interactions
DROP POLICY IF EXISTS "Anyone can insert AR interactions" ON public.ar_interactions;
CREATE POLICY "Anyone can insert AR interactions" 
  ON public.ar_interactions FOR INSERT 
  WITH CHECK (true); -- Public analytics

DROP POLICY IF EXISTS "Users can view own interactions" ON public.ar_interactions;
CREATE POLICY "Users can view own interactions" 
  ON public.ar_interactions FOR SELECT 
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.ar_models
      WHERE ar_models.id = ar_interactions.ar_model_id
      AND ar_models.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. TRIGGER: updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_ar_models_updated_at ON public.ar_models;
CREATE TRIGGER update_ar_models_updated_at
  BEFORE UPDATE ON public.ar_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. TRIGGER: increment_counters
-- ============================================

CREATE OR REPLACE FUNCTION increment_ar_counter()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les compteurs sur ar_models
  IF NEW.interaction_type = 'view' THEN
    UPDATE public.ar_models 
    SET views_count = views_count + 1,
        last_viewed_at = NOW()
    WHERE id = NEW.ar_model_id;
  ELSIF NEW.interaction_type = 'ar_launch' THEN
    UPDATE public.ar_models 
    SET ar_launches_count = ar_launches_count + 1
    WHERE id = NEW.ar_model_id;
  ELSIF NEW.interaction_type = 'download' THEN
    UPDATE public.ar_models 
    SET downloads_count = downloads_count + 1
    WHERE id = NEW.ar_model_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS increment_ar_counters ON public.ar_interactions;
CREATE TRIGGER increment_ar_counters
  AFTER INSERT ON public.ar_interactions
  FOR EACH ROW
  EXECUTE FUNCTION increment_ar_counter();

-- ═══════════════════════════════════════════════════════════════
-- ✅ AR MODELS SYSTEM CRÉÉ AVEC SUCCÈS !
-- ═══════════════════════════════════════════════════════════════
-- 
-- Tables créées :
--   - ar_models (modèles 3D + metadata)
--   - ar_interactions (analytics AR)
-- 
-- Features :
--   - Support GLB + USDZ (iOS AR Quick Look)
--   - Configuration AR (scale, rotation, placement)
--   - Analytics (views, launches, downloads)
--   - Public/Private models
--   - Tags pour recherche
-- 
-- Next steps :
--   1. Créer API /api/ar/upload
--   2. Intégrer Three.js viewer
--   3. Implémenter export GLB/USDZ
-- 
-- ═══════════════════════════════════════════════════════════════

