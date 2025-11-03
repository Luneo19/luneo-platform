-- ═══════════════════════════════════════════════════════════════
-- 🎨 LUNEO PLATFORM - 3D CONFIGURATOR SYSTEM
-- ═══════════════════════════════════════════════════════════════
-- Description: Tables pour 3D Product Configurator (comme Zakeke)
-- Author: AI Expert
-- Date: 2025-10-27
-- Dependencies: auth.users, public.products
-- ═══════════════════════════════════════════════════════════════

-- ============================================
-- TABLE: product_3d_config
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_3d_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- 3D Model
  model_glb_url TEXT NOT NULL,
  model_usdz_url TEXT, -- For iOS AR
  model_size_mb NUMERIC(10,2),
  
  -- Available Options
  available_materials JSONB DEFAULT '[]'::jsonb, -- Array of material IDs
  available_colors JSONB DEFAULT '[]'::jsonb, -- Array of color codes
  available_parts JSONB DEFAULT '[]'::jsonb, -- Array of part category IDs
  
  -- Default Configuration
  default_material TEXT,
  default_color TEXT DEFAULT '#000000',
  default_parts JSONB DEFAULT '{}'::jsonb,
  
  -- Features
  supports_text_engraving BOOLEAN DEFAULT false,
  supports_image_upload BOOLEAN DEFAULT false,
  supports_ar_preview BOOLEAN DEFAULT false,
  supports_material_switch BOOLEAN DEFAULT false,
  supports_part_swap BOOLEAN DEFAULT false,
  
  -- Engraving Options
  max_engraving_chars INTEGER DEFAULT 20,
  available_fonts JSONB DEFAULT '["helvetiker", "optimer", "gentilis"]'::jsonb,
  engraving_positions JSONB DEFAULT '[]'::jsonb, -- Predefined engraving zones
  
  -- Camera Settings
  camera_position JSONB DEFAULT '{"x": 0, "y": 1.5, "z": 3}'::jsonb,
  camera_target JSONB DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  orbit_controls JSONB DEFAULT '{"minDistance": 1, "maxDistance": 10, "maxPolarAngle": 90}'::jsonb,
  
  -- Lighting
  lighting_preset TEXT DEFAULT 'studio' CHECK (lighting_preset IN ('studio', 'sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'park', 'lobby')),
  custom_lighting JSONB,
  
  -- Performance
  poly_count INTEGER,
  texture_count INTEGER,
  max_texture_size INTEGER DEFAULT 2048,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.product_3d_config IS 'Configuration 3D pour chaque produit - matériaux, couleurs, pièces, engraving.';

CREATE INDEX idx_product_3d_config_product_id ON public.product_3d_config(product_id);
CREATE INDEX idx_product_3d_config_supports_ar ON public.product_3d_config(supports_ar_preview) WHERE supports_ar_preview = true;

-- ============================================
-- TABLE: product_parts
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.product_3d_config(id) ON DELETE CASCADE,
  
  -- Part Identity
  part_category_id TEXT NOT NULL, -- e.g., 'watch-straps', 'shoe-laces'
  part_variant_id TEXT NOT NULL, -- e.g., 'leather-black', 'metal-silver'
  part_name TEXT NOT NULL,
  
  -- 3D Asset
  glb_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size_mb NUMERIC(10,2),
  
  -- Part Properties
  mesh_name TEXT NOT NULL, -- Name of the mesh in the model
  position JSONB DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  rotation JSONB DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  scale JSONB DEFAULT '{"x": 1, "y": 1, "z": 1}'::jsonb,
  
  -- Material Override
  material_override JSONB, -- Custom material for this part
  
  -- Pricing
  price NUMERIC(10,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  
  -- Availability
  available BOOLEAN DEFAULT true,
  stock_count INTEGER,
  
  -- Classification
  tags JSONB DEFAULT '[]'::jsonb,
  category TEXT, -- leather, metal, fabric, etc.
  
  -- Metadata
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.product_parts IS 'Pièces modulaires swappables pour configurateur 3D.';

CREATE INDEX idx_product_parts_config_id ON public.product_parts(config_id);
CREATE INDEX idx_product_parts_category ON public.product_parts(part_category_id);
CREATE INDEX idx_product_parts_variant ON public.product_parts(part_variant_id);
CREATE INDEX idx_product_parts_available ON public.product_parts(available) WHERE available = true;
CREATE INDEX idx_product_parts_tags ON public.product_parts USING GIN (tags);

-- ============================================
-- TABLE: product_3d_configurations
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_3d_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES public.product_3d_config(id) ON DELETE CASCADE,
  
  -- Configuration Data
  configuration_name TEXT DEFAULT 'Untitled Configuration',
  configuration_data JSONB NOT NULL, -- Full Three.js configuration
  
  -- Selected Options
  selected_material TEXT,
  selected_color TEXT,
  selected_parts JSONB DEFAULT '[]'::jsonb, -- Array of part variant IDs
  
  -- Text Engraving
  engraved_text TEXT,
  engraving_font TEXT,
  engraving_position JSONB,
  
  -- Renders
  preview_url TEXT, -- Screenshot of 3D config
  highres_url TEXT, -- High-res render (2000x2000)
  ar_ios_url TEXT, -- USDZ file for iOS AR
  ar_android_url TEXT, -- GLB file for Android AR
  
  -- Pricing
  base_price NUMERIC(10,2) DEFAULT 0.00,
  customization_price NUMERIC(10,2) DEFAULT 0.00,
  total_price NUMERIC(10,2) GENERATED ALWAYS AS (base_price + customization_price) STORED,
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'saved', 'ordered', 'produced')),
  
  -- Order Link
  order_id UUID, -- FK to orders if exists
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.product_3d_configurations IS 'Configurations 3D sauvegardées par les utilisateurs.';

CREATE INDEX idx_product_3d_configurations_user_id ON public.product_3d_configurations(user_id);
CREATE INDEX idx_product_3d_configurations_product_id ON public.product_3d_configurations(product_id);
CREATE INDEX idx_product_3d_configurations_config_id ON public.product_3d_configurations(config_id);
CREATE INDEX idx_product_3d_configurations_status ON public.product_3d_configurations(status);
CREATE INDEX idx_product_3d_configurations_created_at ON public.product_3d_configurations(created_at DESC);

-- ============================================
-- TABLE: material_library
-- ============================================

CREATE TABLE IF NOT EXISTS public.material_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Material Identity
  material_id TEXT UNIQUE NOT NULL,
  material_name TEXT NOT NULL,
  material_type TEXT NOT NULL CHECK (material_type IN ('leather', 'fabric', 'metal', 'plastic', 'wood', 'glass', 'custom')),
  
  -- Visual Properties
  base_color TEXT NOT NULL DEFAULT '#FFFFFF',
  roughness NUMERIC(3,2) DEFAULT 0.5 CHECK (roughness >= 0 AND roughness <= 1),
  metalness NUMERIC(3,2) DEFAULT 0.0 CHECK (metalness >= 0 AND metalness <= 1),
  
  -- Texture Maps
  normal_map_url TEXT,
  roughness_map_url TEXT,
  metalness_map_url TEXT,
  ao_map_url TEXT,
  displacement_map_url TEXT,
  
  -- Preview
  thumbnail_url TEXT,
  
  -- Classification
  category TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  -- Pricing
  price_modifier NUMERIC(10,2) DEFAULT 0.00,
  
  -- Metadata
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.material_library IS 'Bibliothèque globale de matériaux 3D réutilisables.';

CREATE INDEX idx_material_library_type ON public.material_library(material_type);
CREATE INDEX idx_material_library_category ON public.material_library(category);
CREATE INDEX idx_material_library_tags ON public.material_library USING GIN (tags);
CREATE INDEX idx_material_library_popular ON public.material_library(is_popular) WHERE is_popular = true;

-- ============================================
-- RLS (ROW LEVEL SECURITY)
-- ============================================

ALTER TABLE public.product_3d_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_3d_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_library ENABLE ROW LEVEL SECURITY;

-- product_3d_config policies
DROP POLICY IF EXISTS "Anyone can view 3D configs" ON public.product_3d_config;
CREATE POLICY "Anyone can view 3D configs" ON public.product_3d_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert 3D configs" ON public.product_3d_config;
CREATE POLICY "Authenticated users can insert 3D configs" ON public.product_3d_config FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update own 3D configs" ON public.product_3d_config;
CREATE POLICY "Users can update own 3D configs" ON public.product_3d_config FOR UPDATE USING (auth.uid() = created_by);

-- product_parts policies
DROP POLICY IF EXISTS "Anyone can view parts" ON public.product_parts;
CREATE POLICY "Anyone can view parts" ON public.product_parts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert parts" ON public.product_parts;
CREATE POLICY "Authenticated users can insert parts" ON public.product_parts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- product_3d_configurations policies
DROP POLICY IF EXISTS "Users can view own 3D configurations" ON public.product_3d_configurations;
CREATE POLICY "Users can view own 3D configurations" ON public.product_3d_configurations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own 3D configurations" ON public.product_3d_configurations;
CREATE POLICY "Users can insert own 3D configurations" ON public.product_3d_configurations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own 3D configurations" ON public.product_3d_configurations;
CREATE POLICY "Users can update own 3D configurations" ON public.product_3d_configurations FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own 3D configurations" ON public.product_3d_configurations;
CREATE POLICY "Users can delete own 3D configurations" ON public.product_3d_configurations FOR DELETE USING (auth.uid() = user_id);

-- material_library policies
DROP POLICY IF EXISTS "Anyone can view materials" ON public.material_library;
CREATE POLICY "Anyone can view materials" ON public.material_library FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert materials" ON public.material_library;
CREATE POLICY "Authenticated users can insert materials" ON public.material_library FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_product_3d_config_updated_at
  BEFORE UPDATE ON public.product_3d_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_parts_updated_at
  BEFORE UPDATE ON public.product_parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_3d_configurations_updated_at
  BEFORE UPDATE ON public.product_3d_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_library_updated_at
  BEFORE UPDATE ON public.material_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Material Library
-- ============================================

INSERT INTO public.material_library (material_id, material_name, material_type, base_color, roughness, metalness, category, tags, is_popular, description) VALUES
  -- Leather
  ('leather-black', 'Black Leather', 'leather', '#1a1a1a', 0.8, 0.0, 'leather', '["premium", "classic", "formal"]', true, 'Premium black leather with authentic texture'),
  ('leather-brown', 'Brown Leather', 'leather', '#8B4513', 0.7, 0.0, 'leather', '["classic", "vintage", "natural"]', true, 'Classic brown leather with natural grain'),
  ('leather-tan', 'Tan Leather', 'leather', '#D2B48C', 0.75, 0.0, 'leather', '["casual", "summer", "light"]', false, 'Light tan leather for summer styles'),
  
  -- Fabric
  ('fabric-cotton', 'Cotton', 'fabric', '#FFFFFF', 0.9, 0.0, 'fabric', '["soft", "natural", "breathable"]', true, 'Soft cotton fabric with natural texture'),
  ('fabric-denim', 'Denim', 'fabric', '#4169E1', 0.8, 0.0, 'fabric', '["casual", "durable", "classic"]', true, 'Classic blue denim with woven texture'),
  ('fabric-canvas', 'Canvas', 'fabric', '#F5F5DC', 0.85, 0.0, 'fabric', '["durable", "casual", "rugged"]', false, 'Heavy-duty canvas fabric'),
  
  -- Metal
  ('metal-steel', 'Brushed Steel', 'metal', '#C0C0C0', 0.3, 0.9, 'metal', '["modern", "durable", "sleek"]', true, 'Brushed stainless steel with metallic finish'),
  ('metal-gold', 'Gold', 'metal', '#FFD700', 0.1, 1.0, 'metal', '["luxury", "premium", "elegant"]', true, 'Luxurious gold with high reflectivity'),
  ('metal-copper', 'Copper', 'metal', '#B87333', 0.2, 0.8, 'metal', '["warm", "vintage", "unique"]', false, 'Warm copper with natural patina'),
  ('metal-rose-gold', 'Rose Gold', 'metal', '#E8B4B8', 0.15, 0.85, 'metal', '["modern", "elegant", "trendy"]', true, 'Modern rose gold finish'),
  ('metal-black', 'Black Steel', 'metal', '#2C2C2C', 0.25, 0.7, 'metal', '["modern", "stealth", "premium"]', false, 'Matte black steel coating'),
  
  -- Plastic
  ('plastic-matte', 'Matte Plastic', 'plastic', '#FFFFFF', 0.9, 0.0, 'plastic', '["smooth", "modern", "clean"]', false, 'Smooth matte plastic finish'),
  ('plastic-glossy', 'Glossy Plastic', 'plastic', '#FFFFFF', 0.1, 0.0, 'plastic', '["shiny", "modern", "reflective"]', true, 'High-gloss plastic with mirror finish'),
  ('plastic-transparent', 'Clear Plastic', 'plastic', '#FFFFFF', 0.0, 0.0, 'plastic', '["transparent", "modern", "tech"]', false, 'Crystal clear transparent plastic'),
  
  -- Wood
  ('wood-oak', 'Oak Wood', 'wood', '#DEB887', 0.8, 0.0, 'wood', '["natural", "classic", "warm"]', true, 'Natural oak wood with grain texture'),
  ('wood-walnut', 'Walnut Wood', 'wood', '#8B4513', 0.7, 0.0, 'wood', '["dark", "rich", "luxury"]', true, 'Rich walnut wood with dark grain'),
  ('wood-maple', 'Maple Wood', 'wood', '#F5DEB3', 0.75, 0.0, 'wood', '["light", "natural", "clean"]', false, 'Light maple wood with subtle grain'),
  
  -- Glass
  ('glass-clear', 'Clear Glass', 'glass', '#FFFFFF', 0.0, 0.0, 'glass', '["transparent", "premium", "elegant"]', false, 'Crystal clear glass with transparency'),
  ('glass-tinted', 'Tinted Glass', 'glass', '#1a1a1a', 0.0, 0.0, 'glass', '["dark", "privacy", "modern"]', false, 'Dark tinted glass with privacy'),
  ('glass-frosted', 'Frosted Glass', 'glass', '#F0F0F0', 0.1, 0.0, 'glass', '["soft", "elegant", "subtle"]', true, 'Frosted glass with diffused light'),
  
  -- Special
  ('carbon-fiber', 'Carbon Fiber', 'custom', '#2C2C2C', 0.2, 0.1, 'special', '["tech", "performance", "modern"]', true, 'High-tech carbon fiber weave'),
  ('brushed-aluminum', 'Brushed Aluminum', 'custom', '#E5E5E5', 0.4, 0.7, 'special', '["modern", "tech", "sleek"]', true, 'Anodized aluminum with brush finish'),
  ('rubber-soft', 'Soft Rubber', 'custom', '#333333', 0.95, 0.0, 'special', '["grip", "comfort", "sport"]', false, 'Soft-touch rubber coating')
ON CONFLICT (material_id) DO NOTHING;

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_3d_config_for_product(p_product_id UUID)
RETURNS TABLE (
  config_id UUID,
  model_url TEXT,
  materials JSONB,
  colors JSONB,
  parts JSONB,
  features JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.model_glb_url,
    c.available_materials,
    c.available_colors,
    c.available_parts,
    jsonb_build_object(
      'textEngraving', c.supports_text_engraving,
      'imageUpload', c.supports_image_upload,
      'arPreview', c.supports_ar_preview,
      'materialSwitch', c.supports_material_switch,
      'partSwap', c.supports_part_swap
    )
  FROM public.product_3d_config c
  WHERE c.product_id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_parts_for_config(p_config_id UUID)
RETURNS TABLE (
  part_id UUID,
  category TEXT,
  variant TEXT,
  part_name TEXT,
  glb_url TEXT,
  thumbnail TEXT,
  price NUMERIC,
  available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.part_category_id,
    p.part_variant_id,
    p.part_name,
    p.glb_url,
    p.thumbnail_url,
    p.price,
    p.available
  FROM public.product_parts p
  WHERE p.config_id = p_config_id
  AND p.available = true
  ORDER BY p.part_category_id, p.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ✅ SCRIPT 3D CONFIGURATOR EXÉCUTÉ !
-- ============================================

SELECT 'success' AS status, '4 tables créées: product_3d_config, product_parts, product_3d_configurations, material_library' AS message;
