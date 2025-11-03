-- =====================================================
-- ÉTENDRE TABLE ORDERS POUR E-COMMERCE
-- =====================================================

-- Ajouter colonnes pour custom designs et print files
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS custom_design_id UUID REFERENCES public.custom_designs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS print_files JSONB,
ADD COLUMN IF NOT EXISTS ecommerce_platform VARCHAR(50),
ADD COLUMN IF NOT EXISTS ecommerce_order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS production_status VARCHAR(50) DEFAULT 'pending';

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_orders_custom_design ON public.orders(custom_design_id);
CREATE INDEX IF NOT EXISTS idx_orders_ecommerce ON public.orders(ecommerce_platform, ecommerce_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_production_status ON public.orders(production_status);

-- Ajouter colonne order_id dans custom_designs si pas déjà fait
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_designs' 
    AND column_name = 'order_id'
  ) THEN
    ALTER TABLE public.custom_designs 
    ADD COLUMN order_id VARCHAR(255);
  END IF;
END $$;

-- Ajouter colonne status dans custom_designs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_designs' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.custom_designs 
    ADD COLUMN status VARCHAR(50) DEFAULT 'draft';
  END IF;
END $$;

-- Index pour custom_designs
CREATE INDEX IF NOT EXISTS idx_custom_designs_order ON public.custom_designs(order_id);
CREATE INDEX IF NOT EXISTS idx_custom_designs_status ON public.custom_designs(status);

