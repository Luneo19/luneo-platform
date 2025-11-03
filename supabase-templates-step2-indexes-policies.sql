-- =====================================================
-- ÉTAPE 2: CRÉER LES INDEX ET POLICIES
-- Exécute ce fichier APRÈS supabase-templates-step1-tables-only.sql
-- =====================================================

-- =====================================================
-- INDEX - Templates
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_subcategory ON public.templates(subcategory);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON public.templates USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_templates_published ON public.templates(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_templates_featured ON public.templates(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_templates_premium ON public.templates(is_premium);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON public.templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_downloads ON public.templates(downloads_count DESC);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_templates_search ON public.templates USING gin(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- =====================================================
-- INDEX - Cliparts
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_cliparts_category ON public.cliparts(category);
CREATE INDEX IF NOT EXISTS idx_cliparts_subcategory ON public.cliparts(subcategory);
CREATE INDEX IF NOT EXISTS idx_cliparts_tags ON public.cliparts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_cliparts_published ON public.cliparts(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_cliparts_featured ON public.cliparts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_cliparts_premium ON public.cliparts(is_premium);
CREATE INDEX IF NOT EXISTS idx_cliparts_style ON public.cliparts(style);
CREATE INDEX IF NOT EXISTS idx_cliparts_created_at ON public.cliparts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cliparts_downloads ON public.cliparts(downloads_count DESC);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_cliparts_search ON public.cliparts USING gin(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- =====================================================
-- INDEX - User Favorites & Downloads
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_resource ON public.user_favorites(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_user_downloads_user ON public.user_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_downloads_resource ON public.user_downloads(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_user_downloads_created ON public.user_downloads(created_at DESC);

-- =====================================================
-- RLS POLICIES - Templates
-- =====================================================

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published templates" ON public.templates;
CREATE POLICY "Anyone can view published templates"
  ON public.templates FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Users can view own templates" ON public.templates;
CREATE POLICY "Users can view own templates"
  ON public.templates FOR SELECT
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Authenticated users can create templates" ON public.templates;
CREATE POLICY "Authenticated users can create templates"
  ON public.templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update own templates" ON public.templates;
CREATE POLICY "Users can update own templates"
  ON public.templates FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete own templates" ON public.templates;
CREATE POLICY "Users can delete own templates"
  ON public.templates FOR DELETE
  USING (auth.uid() = created_by);

-- =====================================================
-- RLS POLICIES - Cliparts
-- =====================================================

ALTER TABLE public.cliparts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published cliparts" ON public.cliparts;
CREATE POLICY "Anyone can view published cliparts"
  ON public.cliparts FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Users can view own cliparts" ON public.cliparts;
CREATE POLICY "Users can view own cliparts"
  ON public.cliparts FOR SELECT
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Authenticated users can create cliparts" ON public.cliparts;
CREATE POLICY "Authenticated users can create cliparts"
  ON public.cliparts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update own cliparts" ON public.cliparts;
CREATE POLICY "Users can update own cliparts"
  ON public.cliparts FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete own cliparts" ON public.cliparts;
CREATE POLICY "Users can delete own cliparts"
  ON public.cliparts FOR DELETE
  USING (auth.uid() = created_by);

-- =====================================================
-- RLS POLICIES - User Favorites
-- =====================================================

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own favorites" ON public.user_favorites;
CREATE POLICY "Users can manage own favorites"
  ON public.user_favorites
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES - User Downloads
-- =====================================================

ALTER TABLE public.user_downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own downloads" ON public.user_downloads;
CREATE POLICY "Users can view own downloads"
  ON public.user_downloads FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create download records" ON public.user_downloads;
CREATE POLICY "Users can create download records"
  ON public.user_downloads FOR INSERT
  WITH CHECK (auth.uid() = user_id);
