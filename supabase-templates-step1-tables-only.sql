-- =====================================================
-- ÉTAPE 1: CRÉER LES TABLES SEULEMENT
-- Exécute ce fichier EN PREMIER
-- =====================================================

-- =====================================================
-- TABLE 1: templates
-- =====================================================

CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  preview_url TEXT NOT NULL,
  thumbnail_url TEXT,
  konva_json JSONB NOT NULL,
  
  -- Dimensions
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  unit VARCHAR(10) DEFAULT 'mm',
  
  -- Configuration
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  
  -- Customization options
  customizable_areas JSONB,
  default_colors JSONB,
  fonts_used JSONB,
  
  -- Tags & Search
  tags TEXT[],
  keywords TEXT[],
  
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

-- =====================================================
-- TABLE 2: cliparts
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cliparts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  
  svg_url TEXT NOT NULL,
  preview_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  svg_content TEXT,
  svg_viewbox VARCHAR(100),
  
  width INTEGER,
  height INTEGER,
  
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  
  is_colorizable BOOLEAN DEFAULT true,
  default_color VARCHAR(7),
  has_multiple_colors BOOLEAN DEFAULT false,
  
  tags TEXT[] NOT NULL DEFAULT '{}',
  keywords TEXT[],
  style VARCHAR(50),
  
  downloads_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  
  price DECIMAL(10, 2) DEFAULT 0.00,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_price_clipart CHECK (price >= 0)
);

-- =====================================================
-- TABLE 3: user_favorites
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, resource_type, resource_id)
);

-- =====================================================
-- TABLE 4: user_downloads
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  download_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- VÉRIFICATION
-- =====================================================

SELECT 
  'templates' as table_name, 
  COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'templates' AND table_schema = 'public'
UNION ALL
SELECT 
  'cliparts' as table_name, 
  COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'cliparts' AND table_schema = 'public'
UNION ALL
SELECT 
  'user_favorites' as table_name, 
  COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'user_favorites' AND table_schema = 'public'
UNION ALL
SELECT 
  'user_downloads' as table_name, 
  COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'user_downloads' AND table_schema = 'public';
