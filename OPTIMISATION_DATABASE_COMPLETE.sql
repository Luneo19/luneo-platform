-- ============================================================================
-- OPTIMISATION DATABASE COMPLÈTE - PRODUCTION
-- ============================================================================
-- Date: 29 Octobre 2025
-- Objectif: Optimiser les performances database pour production
-- Basé sur: Best practices PostgreSQL 14+ et Supabase 2025
-- ============================================================================

-- ============================================================================
-- 1. INDEXES CRITIQUES POUR PERFORMANCE
-- ============================================================================

-- Profiles (auth)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status) WHERE subscription_status IS NOT NULL;

-- Designs (requêtes fréquentes)
CREATE INDEX IF NOT EXISTS idx_designs_user_id_created ON designs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designs_brand_id ON designs(brand_id) WHERE brand_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_designs_product_id ON designs(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_designs_status ON designs(status);
CREATE INDEX IF NOT EXISTS idx_designs_shared ON designs(is_shared) WHERE is_shared = true;

-- Products (queries lourdes)
CREATE INDEX IF NOT EXISTS idx_products_user_id_created ON products(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id) WHERE brand_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status) WHERE status IS NOT NULL;

-- Orders (dashboard stats)
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_total_amount ON orders(total_amount) WHERE total_amount > 0;

-- Templates & Cliparts (recherche)
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_templates_name_trgm ON templates USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cliparts_category ON cliparts(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cliparts_tags_gin ON cliparts USING gin(tags);

-- Brands (multi-tenant)
CREATE INDEX IF NOT EXISTS idx_brands_owner_id ON brands(owner_id);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug) WHERE slug IS NOT NULL;

-- API Keys (auth)
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id_active ON api_keys(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash) WHERE is_active = true;

-- Webhooks (integrations)
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active) WHERE is_active = true;

-- Notifications (recent first)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================================================
-- 2. FULL-TEXT SEARCH (si extension pg_trgm activée)
-- ============================================================================

-- Activer extension si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Indexes GIN pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_description_search ON products USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_designs_name_search ON designs USING gin(to_tsvector('english', name));

-- ============================================================================
-- 3. STATISTIQUES ET VACUUM
-- ============================================================================

-- Mettre à jour les statistiques (important après ajout d'indexes)
ANALYZE profiles;
ANALYZE designs;
ANALYZE products;
ANALYZE orders;
ANALYZE templates;
ANALYZE cliparts;
ANALYZE brands;
ANALYZE api_keys;
ANALYZE webhooks;
ANALYZE notifications;

-- Vacuum pour récupérer l'espace et optimiser
VACUUM ANALYZE profiles;
VACUUM ANALYZE designs;
VACUUM ANALYZE products;
VACUUM ANALYZE orders;

-- ============================================================================
-- 4. VUES MATÉRIALISÉES POUR DASHBOARD STATS (OPTIONNEL)
-- ============================================================================

-- Vue matérialisée pour stats dashboard (refresh toutes les 5 minutes via cron)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT d.id) as total_designs,
  COUNT(DISTINCT p.id) as total_products,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.total_amount), 0) as total_revenue,
  MAX(d.created_at) as last_design_date,
  MAX(o.created_at) as last_order_date
FROM profiles u
LEFT JOIN designs d ON d.user_id = u.id
LEFT JOIN products p ON p.user_id = u.id
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_user ON dashboard_stats(user_id);

-- Fonction pour refresh automatique (à appeler via cron ou trigger)
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$;

-- ============================================================================
-- 5. FONCTIONS OPTIMISÉES POUR QUERIES FRÉQUENTES
-- ============================================================================

-- Fonction optimisée: Get user designs avec pagination
CREATE OR REPLACE FUNCTION get_user_designs(
  p_user_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  status TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.thumbnail_url,
    d.created_at,
    d.updated_at,
    d.status
  FROM designs d
  WHERE d.user_id = p_user_id
    AND (p_status IS NULL OR d.status = p_status)
  ORDER BY d.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Fonction optimisée: Get dashboard stats pour un user
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Essayer d'abord la vue matérialisée (plus rapide)
  SELECT row_to_json(ds)
  INTO v_result
  FROM dashboard_stats ds
  WHERE ds.user_id = p_user_id;
  
  -- Si pas de résultat dans la vue, calculer en temps réel
  IF v_result IS NULL THEN
    SELECT json_build_object(
      'user_id', p_user_id,
      'total_designs', (SELECT COUNT(*) FROM designs WHERE user_id = p_user_id),
      'total_products', (SELECT COUNT(*) FROM products WHERE user_id = p_user_id),
      'total_orders', (SELECT COUNT(*) FROM orders WHERE user_id = p_user_id),
      'total_revenue', COALESCE((SELECT SUM(total_amount) FROM orders WHERE user_id = p_user_id), 0)
    )
    INTO v_result;
  END IF;
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- 6. PARTITIONNEMENT (Pour tables très volumineuses)
-- ============================================================================

-- Si la table orders devient très grande (>1M rows), partitionner par date
-- NOTE: Ceci est un exemple, à adapter selon les besoins

/*
-- Créer table partitionnée (à faire sur nouvelle table)
CREATE TABLE orders_partitioned (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- ... autres colonnes
) PARTITION BY RANGE (created_at);

-- Créer partitions par mois
CREATE TABLE orders_2025_10 PARTITION OF orders_partitioned
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE orders_2025_11 PARTITION OF orders_partitioned
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Index sur chaque partition
CREATE INDEX ON orders_2025_10(user_id, created_at DESC);
CREATE INDEX ON orders_2025_11(user_id, created_at DESC);
*/

-- ============================================================================
-- 7. CONFIGURATION POSTGRESQL (À appliquer dans Supabase Dashboard)
-- ============================================================================

/*
-- Settings > Database > Custom Config (nécessite plan Pro)

-- Augmenter shared_buffers (25% de RAM)
ALTER SYSTEM SET shared_buffers = '2GB';

-- Augmenter work_mem pour queries complexes
ALTER SYSTEM SET work_mem = '64MB';

-- Augmenter maintenance_work_mem pour VACUUM et CREATE INDEX
ALTER SYSTEM SET maintenance_work_mem = '512MB';

-- Activer parallel query
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
ALTER SYSTEM SET max_parallel_workers = 8;

-- Optimiser random page cost (pour SSD)
ALTER SYSTEM SET random_page_cost = 1.1;

-- Augmenter effective_cache_size (75% de RAM)
ALTER SYSTEM SET effective_cache_size = '6GB';

-- Log slow queries (>100ms)
ALTER SYSTEM SET log_min_duration_statement = 100;

-- Reload config
SELECT pg_reload_conf();
*/

-- ============================================================================
-- 8. MONITORING QUERIES
-- ============================================================================

-- Query pour voir les indexes manquants (suggérés par PostgreSQL)
/*
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.5
ORDER BY n_distinct DESC
LIMIT 20;
*/

-- Query pour voir les indexes inutilisés
/*
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
*/

-- Query pour voir les slow queries
/*
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time,
  stddev_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
*/

-- ============================================================================
-- 9. CLEANUP ET MAINTENANCE
-- ============================================================================

-- Fonction pour nettoyer les designs non sauvegardés (>30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_drafts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM designs
  WHERE status = 'draft'
    AND created_at < NOW() - INTERVAL '30 days'
    AND user_id IS NULL;
END;
$$;

-- Fonction pour nettoyer les notifications lues (>90 jours)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM notifications
  WHERE read = true
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- ============================================================================
-- FIN OPTIMISATION DATABASE
-- ============================================================================

-- Vérification finale
SELECT 
  'Optimisation terminée!' as message,
  NOW() as timestamp;

-- Afficher les indexes créés
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

