-- Créer la table products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  compare_at_price DECIMAL(10,2),
  sku VARCHAR(100),
  category VARCHAR(100),
  tags TEXT[],
  image_url TEXT,
  images TEXT[],
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  track_inventory BOOLEAN DEFAULT true,
  inventory_quantity INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Créer la table product_variants
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  inventory_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Créer les policies pour products
CREATE POLICY IF NOT EXISTS "Users can view own products" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own products" ON products FOR DELETE USING (auth.uid() = user_id);

-- Créer les policies pour product_variants
CREATE POLICY IF NOT EXISTS "Users can view variants of own products" ON product_variants FOR SELECT USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND products.user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Users can insert variants to own products" ON product_variants FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND products.user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Users can update variants of own products" ON product_variants FOR UPDATE USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND products.user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Users can delete variants of own products" ON product_variants FOR DELETE USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND products.user_id = auth.uid()));

-- Créer les triggers
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
