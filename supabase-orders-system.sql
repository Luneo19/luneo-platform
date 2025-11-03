-- ============================================
-- SUPABASE ORDERS SYSTEM - PRODUCTION READY
-- Pour plateformes e-commerce de luxe
-- ============================================

-- 1. TABLE ORDERS
-- Gestion complète des commandes clients
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  
  -- Détails commande
  order_number TEXT UNIQUE NOT NULL, -- Format: ORD-20250125-ABC123
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded', 'failed')),
  
  -- Montants (en cents pour précision)
  subtotal INTEGER NOT NULL DEFAULT 0, -- Sous-total avant taxes
  tax_amount INTEGER NOT NULL DEFAULT 0, -- Montant TVA
  shipping_amount INTEGER NOT NULL DEFAULT 0, -- Frais de livraison
  discount_amount INTEGER NOT NULL DEFAULT 0, -- Réductions appliquées
  total_amount INTEGER NOT NULL, -- Montant total
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Stripe integration
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_customer_id TEXT,
  payment_method TEXT, -- 'card', 'paypal', 'invoice', etc.
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- Shipping
  shipping_address JSONB, -- {street, city, postal_code, country, etc.}
  shipping_method TEXT, -- 'standard', 'express', 'overnight'
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Billing
  billing_address JSONB,
  invoice_url TEXT, -- URL facture PDF
  invoice_number TEXT UNIQUE,
  
  -- Metadata
  notes TEXT, -- Notes internes
  customer_notes TEXT, -- Notes du client
  metadata JSONB, -- Données additionnelles flexibles
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- Indexes pour performance
  CONSTRAINT order_number_format CHECK (order_number ~* '^ORD-[0-9]{8}-[A-Z0-9]{6}$')
);

-- 2. TABLE ORDER ITEMS
-- Lignes de commande (produits + designs)
-- ============================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
  
  -- Détails produit (snapshot au moment de la commande)
  product_name TEXT NOT NULL,
  product_sku TEXT,
  variant_name TEXT, -- Ex: "Noir, XL"
  
  -- Design appliqué
  design_name TEXT,
  design_preview_url TEXT,
  design_print_url TEXT, -- URL haute résolution pour impression
  
  -- Quantité et prix
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price INTEGER NOT NULL, -- Prix unitaire en cents
  total_price INTEGER NOT NULL, -- quantity * unit_price
  
  -- Métadonnées
  customization JSONB, -- Personnalisations (texte, couleurs, etc.)
  production_notes TEXT, -- Instructions pour production
  production_status TEXT DEFAULT 'pending' CHECK (production_status IN ('pending', 'in_production', 'ready', 'shipped')),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE ORDER STATUS HISTORY
-- Historique des changements de statut (traçabilité)
-- ============================================

CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Changement de statut
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  
  -- Détails
  reason TEXT, -- Raison du changement
  notes TEXT, -- Notes additionnelles
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Qui a fait le changement
  
  -- Metadata
  metadata JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDEXES POUR PERFORMANCE
-- ============================================

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_design_id ON order_items(design_id);

-- Order Status History
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at DESC);

-- 5. RLS POLICIES
-- Sécurité Row-Level Security
-- ============================================

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Service role can manage all orders" ON orders;

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Service role can manage all order items" ON order_items;

DROP POLICY IF EXISTS "Users can view own order history" ON order_status_history;
DROP POLICY IF EXISTS "Service role can manage all order history" ON order_status_history;

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all orders" ON orders
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Order items policies
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all order items" ON order_items
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Order status history policies
CREATE POLICY "Users can view own order history" ON order_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_status_history.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all order history" ON order_status_history
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- 6. FUNCTIONS
-- Fonctions utilitaires
-- ============================================

-- Fonction pour générer un numéro de commande unique
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_num TEXT;
  date_part TEXT;
  random_part TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Format: ORD-20250125-ABC123
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    order_num := 'ORD-' || date_part || '-' || random_part;
    
    -- Vérifier l'unicité
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = order_num) INTO exists_check;
    
    IF NOT exists_check THEN
      RETURN order_num;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le total d'une commande
CREATE OR REPLACE FUNCTION calculate_order_total(order_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  subtotal_value INTEGER;
  tax_value INTEGER;
  shipping_value INTEGER;
  discount_value INTEGER;
BEGIN
  SELECT subtotal, tax_amount, shipping_amount, discount_amount
  INTO subtotal_value, tax_value, shipping_value, discount_value
  FROM orders
  WHERE id = order_uuid;
  
  RETURN subtotal_value + tax_value + shipping_value - discount_value;
END;
$$ LANGUAGE plpgsql;

-- 7. TRIGGERS
-- Automatisation
-- ============================================

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour historique de statut
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_order_status_change_trigger ON orders;
CREATE TRIGGER log_order_status_change_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Trigger pour générer order_number automatiquement
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number_trigger ON orders;
CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- 8. VUES UTILES
-- Pour requêtes simplifiées
-- ============================================

-- Vue pour orders avec items
CREATE OR REPLACE VIEW orders_with_items AS
SELECT 
  o.*,
  COUNT(oi.id) as items_count,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'id', oi.id,
      'product_name', oi.product_name,
      'design_name', oi.design_name,
      'quantity', oi.quantity,
      'unit_price', oi.unit_price,
      'total_price', oi.total_price
    )
  ) as items
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id;

-- Vue pour statistiques orders
CREATE OR REPLACE VIEW order_stats AS
SELECT 
  user_id,
  COUNT(*) as total_orders,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as average_order_value,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders
FROM orders
GROUP BY user_id;

-- ============================================
-- EXÉCUTION COMPLÈTE
-- ============================================

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ ORDERS SYSTEM CRÉÉ AVEC SUCCÈS !';
  RAISE NOTICE '📊 Tables: orders, order_items, order_status_history';
  RAISE NOTICE '🔒 RLS Policies activées';
  RAISE NOTICE '⚡ Triggers et functions configurés';
  RAISE NOTICE '🎯 Prêt pour production niveau entreprise';
END $$;

