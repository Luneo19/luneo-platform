-- ═══════════════════════════════════════════════════════════════
-- 📁 LUNEO PLATFORM - DESIGN COLLECTIONS SYSTEM
-- ═══════════════════════════════════════════════════════════════
-- Description: Système de collections pour organiser les designs
-- Author: AI Expert
-- Date: 2025-10-25
-- ═══════════════════════════════════════════════════════════════

-- ============================================
-- TABLE: design_collections
-- ============================================

CREATE TABLE IF NOT EXISTS public.design_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  color TEXT DEFAULT '#6366f1', -- Couleur thème de la collection
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false, -- Collections mises en avant
  sort_order INTEGER DEFAULT 0, -- Ordre d'affichage
  designs_count INTEGER DEFAULT 0, -- Compteur de designs
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  tags TEXT[], -- Tags pour recherche
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  CONSTRAINT collection_name_user_unique UNIQUE(user_id, name)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.design_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON public.design_collections(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_collections_is_featured ON public.design_collections(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON public.design_collections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_tags ON public.design_collections USING GIN(tags);

-- ============================================
-- TABLE: design_collection_items
-- ============================================

CREATE TABLE IF NOT EXISTS public.design_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.design_collections(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0, -- Ordre dans la collection
  notes TEXT, -- Notes sur ce design dans cette collection
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT design_collection_unique UNIQUE(collection_id, design_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.design_collection_items(collection_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_collection_items_design ON public.design_collection_items(design_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.design_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_collection_items ENABLE ROW LEVEL SECURITY;

-- Policies pour design_collections
DROP POLICY IF EXISTS "Users can view own collections" ON public.design_collections;
CREATE POLICY "Users can view own collections" 
  ON public.design_collections FOR SELECT 
  USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can create own collections" ON public.design_collections;
CREATE POLICY "Users can create own collections" 
  ON public.design_collections FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own collections" ON public.design_collections;
CREATE POLICY "Users can update own collections" 
  ON public.design_collections FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own collections" ON public.design_collections;
CREATE POLICY "Users can delete own collections" 
  ON public.design_collections FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies pour design_collection_items
DROP POLICY IF EXISTS "Users can view collection items" ON public.design_collection_items;
CREATE POLICY "Users can view collection items" 
  ON public.design_collection_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.design_collections 
      WHERE design_collections.id = design_collection_items.collection_id 
      AND (design_collections.user_id = auth.uid() OR design_collections.is_public = true)
    )
  );

DROP POLICY IF EXISTS "Users can add items to own collections" ON public.design_collection_items;
CREATE POLICY "Users can add items to own collections" 
  ON public.design_collection_items FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.design_collections 
      WHERE design_collections.id = design_collection_items.collection_id 
      AND design_collections.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update items in own collections" ON public.design_collection_items;
CREATE POLICY "Users can update items in own collections" 
  ON public.design_collection_items FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.design_collections 
      WHERE design_collections.id = design_collection_items.collection_id 
      AND design_collections.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete items from own collections" ON public.design_collection_items;
CREATE POLICY "Users can delete items from own collections" 
  ON public.design_collection_items FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.design_collections 
      WHERE design_collections.id = design_collection_items.collection_id 
      AND design_collections.user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_design_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_collections_updated_at ON public.design_collections;
CREATE TRIGGER trigger_update_collections_updated_at
  BEFORE UPDATE ON public.design_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_design_collections_updated_at();

-- Trigger pour mettre à jour le compteur de designs
CREATE OR REPLACE FUNCTION update_collection_designs_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.design_collections
    SET designs_count = designs_count + 1
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.design_collections
    SET designs_count = GREATEST(0, designs_count - 1)
    WHERE id = OLD.collection_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_collection_count ON public.design_collection_items;
CREATE TRIGGER trigger_update_collection_count
  AFTER INSERT OR DELETE ON public.design_collection_items
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_designs_count();

-- ============================================
-- FUNCTIONS HELPER
-- ============================================

-- Fonction pour obtenir les collections d'un design
CREATE OR REPLACE FUNCTION get_design_collections(p_design_id UUID)
RETURNS TABLE (
  collection_id UUID,
  collection_name TEXT,
  collection_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id,
    dc.name,
    dc.color
  FROM public.design_collections dc
  INNER JOIN public.design_collection_items dci ON dc.id = dci.collection_id
  WHERE dci.design_id = p_design_id
  ORDER BY dc.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les designs d'une collection
CREATE OR REPLACE FUNCTION get_collection_designs(p_collection_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  design_id UUID,
  design_prompt TEXT,
  design_image_url TEXT,
  design_created_at TIMESTAMPTZ,
  sort_order INTEGER,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.prompt,
    d.preview_url,
    d.created_at,
    dci.sort_order,
    dci.notes
  FROM public.designs d
  INNER JOIN public.design_collection_items dci ON d.id = dci.design_id
  WHERE dci.collection_id = p_collection_id
  ORDER BY dci.sort_order, dci.added_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- ✅ SCRIPT TERMINÉ
-- ═══════════════════════════════════════════════════════════════
-- 
-- Tables créées :
--   ✅ design_collections (collections de designs)
--   ✅ design_collection_items (items dans collections)
-- 
-- Fonctionnalités :
--   ✅ RLS (Row Level Security)
--   ✅ Triggers (compteurs, updated_at)
--   ✅ Functions helper (queries optimisées)
--   ✅ Indexes pour performance
-- 
-- Prochaine étape :
--   Exécuter ce SQL dans Supabase Dashboard
-- 
-- ═══════════════════════════════════════════════════════════════

