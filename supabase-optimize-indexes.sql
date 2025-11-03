-- =====================================================
-- 🚀 OPTIMISATION DATABASE - INDEXES PERFORMANCE
-- =====================================================
-- Objectif: Réduire latence de 373ms → <200ms
-- Action: Créer indexes pour requêtes fréquentes
-- =====================================================

-- 1. TEMPLATES - Optimiser recherche et filtrage
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_templates_category 
ON public.templates(category) 
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_templates_subcategory 
ON public.templates(category, subcategory) 
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_templates_is_published_created 
ON public.templates(is_published, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_templates_is_featured 
ON public.templates(is_featured) 
WHERE is_featured = true AND is_published = true;

CREATE INDEX IF NOT EXISTS idx_templates_search 
ON public.templates USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_templates_tags 
ON public.templates USING gin(tags);

-- Index composite pour dashboard
CREATE INDEX IF NOT EXISTS idx_templates_dashboard 
ON public.templates(is_published, views_count DESC, uses_count DESC);


-- 2. CLIPARTS - Optimiser recherche et filtrage
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_cliparts_category 
ON public.cliparts(category) 
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_cliparts_subcategory 
ON public.cliparts(category, subcategory) 
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_cliparts_is_published_created 
ON public.cliparts(is_published, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cliparts_is_featured 
ON public.cliparts(is_featured) 
WHERE is_featured = true AND is_published = true;

CREATE INDEX IF NOT EXISTS idx_cliparts_tags 
ON public.cliparts USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_cliparts_keywords 
ON public.cliparts USING gin(keywords);

CREATE INDEX IF NOT EXISTS idx_cliparts_search 
ON public.cliparts USING gin(to_tsvector('english', name || ' ' || array_to_string(tags, ' ') || ' ' || array_to_string(keywords, ' ')));

-- Index composite pour dashboard
CREATE INDEX IF NOT EXISTS idx_cliparts_dashboard 
ON public.cliparts(is_published, downloads_count DESC, views_count DESC);


-- 3. ORDERS - Optimiser dashboard et requêtes utilisateur
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_orders_user_status 
ON public.orders(user_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_user_created_desc 
ON public.orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON public.orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_custom_design 
ON public.orders(custom_design_id) 
WHERE custom_design_id IS NOT NULL;


-- 4. CUSTOM_DESIGNS - Optimiser récupération designs
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_custom_designs_user_created 
ON public.custom_designs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_custom_designs_product 
ON public.custom_designs(product_id);

CREATE INDEX IF NOT EXISTS idx_custom_designs_order 
ON public.custom_designs(order_id) 
WHERE order_id IS NOT NULL;


-- 5. PRODUCTS - Optimiser catalogue
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_category 
ON public.products(category) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_is_active_created 
ON public.products(is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_user 
ON public.products(user_id);


-- 6. USER_FAVORITES - Optimiser récupération favoris
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_type 
ON public.user_favorites(user_id, item_type);

CREATE INDEX IF NOT EXISTS idx_user_favorites_item 
ON public.user_favorites(item_id, item_type);

CREATE INDEX IF NOT EXISTS idx_user_favorites_created 
ON public.user_favorites(user_id, created_at DESC);


-- 7. USER_DOWNLOADS - Optimiser historique téléchargements
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_downloads_user_created 
ON public.user_downloads(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_downloads_item 
ON public.user_downloads(item_id, item_type);


-- 8. INTEGRATIONS - Optimiser récupération intégrations
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_integrations_user_platform 
ON public.integrations(user_id, platform);

CREATE INDEX IF NOT EXISTS idx_integrations_is_active 
ON public.integrations(user_id, is_active) 
WHERE is_active = true;


-- 9. NOTIFICATIONS - Optimiser récupération notifications
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON public.notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON public.notifications(user_id, created_at DESC);


-- 10. AUDIT_LOGS - Optimiser recherche logs
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
ON public.audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created 
ON public.audit_logs(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource 
ON public.audit_logs(resource_type, resource_id);


-- =====================================================
-- 🎯 ANALYSE DES PERFORMANCES
-- =====================================================

-- Activer l'extension pour statistiques de requêtes
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Afficher les indexes créés
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('templates', 'cliparts', 'orders', 'custom_designs', 'products')
ORDER BY tablename, indexname;


-- =====================================================
-- ✅ RÉSULTAT ATTENDU
-- =====================================================
-- • 30+ indexes créés
-- • Requêtes templates: 373ms → <100ms
-- • Requêtes cliparts: 300ms → <100ms
-- • Dashboard orders: 500ms → <200ms
-- • API Health: unhealthy → healthy
-- =====================================================



