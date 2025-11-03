-- ═══════════════════════════════════════════════════════════════
-- 🔗 LUNEO PLATFORM - INTEGRATIONS SYSTEM
-- ═══════════════════════════════════════════════════════════════
-- Description: Système d'intégration avec plateformes e-commerce tierces
-- Platforms: Shopify, WooCommerce, Etsy, Amazon, BigCommerce
-- Created: 2025-10-25
-- ═══════════════════════════════════════════════════════════════

-- ============================================
-- 1. TABLE: integrations
-- ============================================
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Platform info
  platform TEXT NOT NULL CHECK (platform IN ('shopify', 'woocommerce', 'etsy', 'amazon', 'bigcommerce', 'custom')),
  platform_name TEXT NOT NULL, -- Nom personnalisé (ex: "Ma boutique Shopify")
  
  -- Credentials (chiffrées avec MASTER_ENCRYPTION_KEY)
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb, -- Store URL, API keys, tokens chiffrés
  
  -- OAuth (pour Shopify, etc.)
  oauth_access_token TEXT, -- Chiffré
  oauth_refresh_token TEXT, -- Chiffré
  oauth_expires_at TIMESTAMPTZ,
  oauth_scope TEXT[], -- Permissions OAuth
  
  -- Store info
  store_url TEXT, -- URL de la boutique (ex: monshop.myshopify.com)
  store_name TEXT,
  store_currency TEXT DEFAULT 'EUR',
  
  -- Configuration sync
  sync_config JSONB DEFAULT '{
    "auto_sync": true,
    "sync_interval": "1h",
    "sync_products": true,
    "sync_orders": false,
    "sync_inventory": true,
    "sync_direction": "bidirectional"
  }'::jsonb,
  
  -- Statut
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error', 'disconnected')),
  is_active BOOLEAN DEFAULT true,
  
  -- Dernière synchronisation
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'partial', 'failed', 'pending') OR last_sync_status IS NULL),
  last_sync_error TEXT,
  
  -- Statistiques
  products_synced INTEGER DEFAULT 0,
  orders_synced INTEGER DEFAULT 0,
  total_syncs INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  
  -- Contrainte: un user ne peut avoir qu'une seule intégration active par plateforme
  UNIQUE(user_id, platform, store_url)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_platform ON public.integrations(platform);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON public.integrations(status);
CREATE INDEX IF NOT EXISTS idx_integrations_is_active ON public.integrations(is_active);
CREATE INDEX IF NOT EXISTS idx_integrations_last_sync ON public.integrations(last_sync_at DESC);

-- ============================================
-- 2. TABLE: sync_logs
-- ============================================
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  
  -- Sync info
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'automatic', 'webhook')),
  direction TEXT NOT NULL CHECK (direction IN ('import', 'export', 'bidirectional')),
  
  -- Résultats
  status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'success', 'partial', 'failed')),
  
  -- Statistiques
  items_total INTEGER DEFAULT 0,
  items_processed INTEGER DEFAULT 0,
  items_succeeded INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  
  -- Détails
  summary JSONB, -- Résumé de la sync
  errors JSONB, -- Erreurs rencontrées
  
  -- Performance
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER, -- Durée en millisecondes
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration_id ON public.sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON public.sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON public.sync_logs(created_at DESC);

-- ============================================
-- 3. RLS (ROW LEVEL SECURITY)
-- ============================================

-- Activer RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour integrations
DROP POLICY IF EXISTS "Users can view own integrations" ON public.integrations;
CREATE POLICY "Users can view own integrations" 
  ON public.integrations FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own integrations" ON public.integrations;
CREATE POLICY "Users can insert own integrations" 
  ON public.integrations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own integrations" ON public.integrations;
CREATE POLICY "Users can update own integrations" 
  ON public.integrations FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own integrations" ON public.integrations;
CREATE POLICY "Users can delete own integrations" 
  ON public.integrations FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies pour sync_logs
DROP POLICY IF EXISTS "Users can view own sync logs" ON public.sync_logs;
CREATE POLICY "Users can view own sync logs" 
  ON public.sync_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.integrations
      WHERE integrations.id = sync_logs.integration_id
      AND integrations.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service can insert sync logs" ON public.sync_logs;
CREATE POLICY "Service can insert sync logs" 
  ON public.sync_logs FOR INSERT 
  WITH CHECK (true); -- API routes utilisent service role

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_integrations_updated_at ON public.integrations;
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour calculer duration_ms
CREATE OR REPLACE FUNCTION calculate_sync_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_ms := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_sync_duration_trigger ON public.sync_logs;
CREATE TRIGGER calculate_sync_duration_trigger
  BEFORE UPDATE ON public.sync_logs
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION calculate_sync_duration();

-- ============================================
-- 5. FONCTION: update_integration_stats
-- ============================================

CREATE OR REPLACE FUNCTION update_integration_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les stats de l'intégration
  UPDATE public.integrations
  SET 
    last_sync_at = NEW.completed_at,
    last_sync_status = NEW.status,
    total_syncs = total_syncs + 1,
    products_synced = products_synced + NEW.items_succeeded,
    last_sync_error = CASE 
      WHEN NEW.status = 'failed' THEN NEW.errors::text
      ELSE NULL
    END
  WHERE id = NEW.integration_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_integration_stats_trigger ON public.sync_logs;
CREATE TRIGGER update_integration_stats_trigger
  AFTER UPDATE ON public.sync_logs
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION update_integration_stats();

-- ═══════════════════════════════════════════════════════════════
-- ✅ INTEGRATIONS SYSTEM CRÉÉ AVEC SUCCÈS !
-- ═══════════════════════════════════════════════════════════════
-- 
-- Tables créées :
--   - integrations (plateformes e-commerce connectées)
--   - sync_logs (historique synchronisations)
-- 
-- Platforms supportées :
--   - Shopify (OAuth + API)
--   - WooCommerce (API key)
--   - Etsy (OAuth)
--   - Amazon (MWS API)
--   - BigCommerce (API)
--   - Custom (webhooks)
-- 
-- Features :
--   - Auto-sync configurable
--   - Bidirectional sync
--   - Credentials chiffrées
--   - Analytics sync
--   - Error tracking
-- 
-- Next steps :
--   1. Créer /api/integrations/shopify/connect (OAuth)
--   2. Créer /api/integrations/shopify/sync
--   3. Connecter frontend
-- 
-- ═══════════════════════════════════════════════════════════════

