-- =====================================================
-- LUNEO PLATFORM - TEMPLATES & CLIPARTS SYSTEM
-- Tables pour bibliothèque de templates et cliparts
-- =====================================================

-- =====================================================
-- 1. TABLE: templates
-- Bibliothèque de templates pré-conçus
-- =====================================================

CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- 'business-card', 't-shirt', 'mug', 'flyer', 'poster', 'banner', etc.
  subcategory VARCHAR(100), -- 'modern', 'vintage', 'minimalist', 'corporate', etc.
  preview_url TEXT NOT NULL, -- URL de l'image preview
  thumbnail_url TEXT, -- Thumbnail pour la galerie
  konva_json JSONB NOT NULL, -- Design Konva.js complet (layers, shapes, etc.)
  
  -- Dimensions
  width INTEGER NOT NULL, -- mm
  height INTEGER NOT NULL, -- mm
  unit VARCHAR(10) DEFAULT 'mm',
  
  -- Configuration
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  
  -- Customization options
  customizable_areas JSONB, -- Zones éditables du template
  default_colors JSONB, -- Couleurs par défaut
  fonts_used JSONB, -- Polices utilisées
  
  -- Tags & Search
  tags TEXT[], -- Tags pour recherche
  keywords TEXT[], -- Mots-clés SEO
  
  -- Stats
  downloads_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  
  -- Pricing
  price DECIMAL(10, 2) DEFAULT 0.00,
  original_price DECIMAL(10, 2),
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_dimensions CHECK (width > 0 AND height > 0),
  CONSTRAINT valid_price CHECK (price >= 0)
);

-- Index pour performance
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
-- 2. TABLE: cliparts
-- Bibliothèque de cliparts SVG
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cliparts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  
  -- Catégories
  category VARCHAR(100) NOT NULL, -- 'animals', 'food', 'symbols', 'icons', 'nature', 'people', etc.
  subcategory VARCHAR(100), -- Plus spécifique
  
  -- Fichiers
  svg_url TEXT NOT NULL, -- URL du fichier SVG
  preview_url TEXT NOT NULL, -- Image preview (PNG/WEBP)
  thumbnail_url TEXT, -- Thumbnail pour la galerie
  
  -- SVG Data
  svg_content TEXT, -- Contenu SVG (optionnel, pour fast load)
  svg_viewbox VARCHAR(100), -- ViewBox SVG
  
  -- Dimensions
  width INTEGER, -- pixels
  height INTEGER, -- pixels
  
  -- Configuration
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  
  -- Customization
  is_colorizable BOOLEAN DEFAULT true, -- Peut changer la couleur
  default_color VARCHAR(7), -- Couleur par défaut (#HEX)
  has_multiple_colors BOOLEAN DEFAULT false,
  
  -- Tags & Search
  tags TEXT[] NOT NULL DEFAULT '{}', -- Tags pour recherche
  keywords TEXT[], -- Mots-clés SEO
  style VARCHAR(50), -- 'flat', 'line', '3d', 'hand-drawn', etc.
  
  -- Stats
  downloads_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  
  -- Pricing
  price DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_price_clipart CHECK (price >= 0)
);

-- Index pour performance
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
-- 3. TABLE: user_favorites (Templates & Cliparts)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL, -- 'template' ou 'clipart'
  resource_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint
  UNIQUE(user_id, resource_type, resource_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_resource ON public.user_favorites(resource_type, resource_id);

-- =====================================================
-- 4. TABLE: user_downloads (Historique téléchargements)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL, -- 'template' ou 'clipart'
  resource_id UUID NOT NULL,
  download_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_downloads_user ON public.user_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_downloads_resource ON public.user_downloads(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_user_downloads_created ON public.user_downloads(created_at DESC);

-- =====================================================
-- 5. RLS POLICIES - Templates
-- =====================================================

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Tous peuvent voir les templates publiés
DROP POLICY IF EXISTS "Anyone can view published templates" ON public.templates;
CREATE POLICY "Anyone can view published templates"
  ON public.templates FOR SELECT
  USING (is_published = true);

-- Policy: SELECT - Créateurs voient leurs propres templates
DROP POLICY IF EXISTS "Users can view own templates" ON public.templates;
CREATE POLICY "Users can view own templates"
  ON public.templates FOR SELECT
  USING (auth.uid() = created_by);

-- Policy: INSERT - Utilisateurs authentifiés peuvent créer
DROP POLICY IF EXISTS "Authenticated users can create templates" ON public.templates;
CREATE POLICY "Authenticated users can create templates"
  ON public.templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Policy: UPDATE - Créateurs peuvent modifier leurs templates
DROP POLICY IF EXISTS "Users can update own templates" ON public.templates;
CREATE POLICY "Users can update own templates"
  ON public.templates FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Policy: DELETE - Créateurs peuvent supprimer leurs templates
DROP POLICY IF EXISTS "Users can delete own templates" ON public.templates;
CREATE POLICY "Users can delete own templates"
  ON public.templates FOR DELETE
  USING (auth.uid() = created_by);

-- =====================================================
-- 6. RLS POLICIES - Cliparts
-- =====================================================

ALTER TABLE public.cliparts ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Tous peuvent voir les cliparts publiés
DROP POLICY IF EXISTS "Anyone can view published cliparts" ON public.cliparts;
CREATE POLICY "Anyone can view published cliparts"
  ON public.cliparts FOR SELECT
  USING (is_published = true);

-- Policy: SELECT - Créateurs voient leurs propres cliparts
DROP POLICY IF EXISTS "Users can view own cliparts" ON public.cliparts;
CREATE POLICY "Users can view own cliparts"
  ON public.cliparts FOR SELECT
  USING (auth.uid() = created_by);

-- Policy: INSERT - Utilisateurs authentifiés peuvent créer
DROP POLICY IF EXISTS "Authenticated users can create cliparts" ON public.cliparts;
CREATE POLICY "Authenticated users can create cliparts"
  ON public.cliparts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Policy: UPDATE - Créateurs peuvent modifier leurs cliparts
DROP POLICY IF EXISTS "Users can update own cliparts" ON public.cliparts;
CREATE POLICY "Users can update own cliparts"
  ON public.cliparts FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Policy: DELETE - Créateurs peuvent supprimer leurs cliparts
DROP POLICY IF EXISTS "Users can delete own cliparts" ON public.cliparts;
CREATE POLICY "Users can delete own cliparts"
  ON public.cliparts FOR DELETE
  USING (auth.uid() = created_by);

-- =====================================================
-- 7. RLS POLICIES - User Favorites
-- =====================================================

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own favorites
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.user_favorites;
CREATE POLICY "Users can manage own favorites"
  ON public.user_favorites
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 8. RLS POLICIES - User Downloads
-- =====================================================

ALTER TABLE public.user_downloads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own downloads
DROP POLICY IF EXISTS "Users can view own downloads" ON public.user_downloads;
CREATE POLICY "Users can view own downloads"
  ON public.user_downloads FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create download records
DROP POLICY IF EXISTS "Users can create download records" ON public.user_downloads;
CREATE POLICY "Users can create download records"
  ON public.user_downloads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 9. FUNCTIONS - Update counters
-- =====================================================

-- Function: Increment template downloads
CREATE OR REPLACE FUNCTION increment_template_downloads()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.templates
  SET downloads_count = downloads_count + 1
  WHERE id = NEW.resource_id AND NEW.resource_type = 'template';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour downloads
DROP TRIGGER IF EXISTS trigger_increment_template_downloads ON public.user_downloads;
CREATE TRIGGER trigger_increment_template_downloads
  AFTER INSERT ON public.user_downloads
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_downloads();

-- Function: Increment clipart downloads
CREATE OR REPLACE FUNCTION increment_clipart_downloads()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.cliparts
  SET downloads_count = downloads_count + 1
  WHERE id = NEW.resource_id AND NEW.resource_type = 'clipart';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour downloads
DROP TRIGGER IF EXISTS trigger_increment_clipart_downloads ON public.user_downloads;
CREATE TRIGGER trigger_increment_clipart_downloads
  AFTER INSERT ON public.user_downloads
  FOR EACH ROW
  EXECUTE FUNCTION increment_clipart_downloads();

-- Function: Update favorites count
CREATE OR REPLACE FUNCTION update_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.resource_type = 'template' THEN
      UPDATE public.templates SET favorites_count = favorites_count + 1 WHERE id = NEW.resource_id;
    ELSIF NEW.resource_type = 'clipart' THEN
      UPDATE public.cliparts SET favorites_count = favorites_count + 1 WHERE id = NEW.resource_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.resource_type = 'template' THEN
      UPDATE public.templates SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = OLD.resource_id;
    ELSIF OLD.resource_type = 'clipart' THEN
      UPDATE public.cliparts SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = OLD.resource_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour favorites
DROP TRIGGER IF EXISTS trigger_update_favorites_count ON public.user_favorites;
CREATE TRIGGER trigger_update_favorites_count
  AFTER INSERT OR DELETE ON public.user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_favorites_count();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS trigger_templates_updated_at ON public.templates;
CREATE TRIGGER trigger_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

DROP TRIGGER IF EXISTS trigger_cliparts_updated_at ON public.cliparts;
CREATE TRIGGER trigger_cliparts_updated_at
  BEFORE UPDATE ON public.cliparts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

-- =====================================================
-- 10. SEED DATA - Sample templates & cliparts
-- =====================================================

-- Note: Seed data sera inséré via scripts séparés
-- pour éviter surcharge du fichier SQL

-- =====================================================
-- END OF SQL SCRIPT
-- =====================================================
