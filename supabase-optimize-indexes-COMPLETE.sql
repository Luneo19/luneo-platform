-- =====================================================
-- 🚀 OPTIMISATION DATABASE - VERSION COMPLÈTE
-- =====================================================
-- Basé sur le schéma EXACT de votre base de données
-- Date: 28 octobre 2025
-- Objectif: 30+ indexes pour performance maximale
-- =====================================================

-- =====================================================
-- 1. TEMPLATES - Optimisation complète
-- =====================================================

-- Index pour filtrage par catégorie
CREATE INDEX IF NOT EXISTS idx_templates_category 
ON public.templates(category) 
WHERE is_published = true;

-- Index pour filtrage par sous-catégorie
CREATE INDEX IF NOT EXISTS idx_templates_category_subcategory 
ON public.templates(category, subcategory) 
WHERE is_published = true;

-- Index pour tri par date de création
CREATE INDEX IF NOT EXISTS idx_templates_published_created 
ON public.templates(is_published, created_at DESC);

-- Index pour templates premium
CREATE INDEX IF NOT EXISTS idx_templates_premium 
ON public.templates(is_premium) 
WHERE is_premium = true AND is_published = true;

-- Index GIN pour recherche par tags
CREATE INDEX IF NOT EXISTS idx_templates_tags_gin 
ON public.templates USING gin(tags);

-- Index pour tri par popularité (uses_count)
CREATE INDEX IF NOT EXISTS idx_templates_uses_count 
ON public.templates(uses_count DESC) 
WHERE is_published = true;

-- Index pour tri par vues
CREATE INDEX IF NOT EXISTS idx_templates_views_count 
ON public.templates(views_count DESC) 
WHERE is_published = true;

-- Index composite pour dashboard admin
CREATE INDEX IF NOT EXISTS idx_templates_admin_dashboard 
ON public.templates(is_published, created_at DESC, uses_count DESC);


-- =====================================================
-- 2. CLIPARTS - Optimisation complète
-- =====================================================

-- Index pour filtrage par catégorie
CREATE INDEX IF NOT EXISTS idx_cliparts_category 
ON public.cliparts(category) 
WHERE is_published = true;

-- Index pour filtrage par sous-catégorie
CREATE INDEX IF NOT EXISTS idx_cliparts_category_subcategory 
ON public.cliparts(category, subcategory) 
WHERE is_published = true;

-- Index pour tri par date de création
CREATE INDEX IF NOT EXISTS idx_cliparts_published_created 
ON public.cliparts(is_published, created_at DESC);

-- Index pour cliparts premium
CREATE INDEX IF NOT EXISTS idx_cliparts_premium 
ON public.cliparts(is_premium) 
WHERE is_premium = true AND is_published = true;

-- Index GIN pour recherche par tags
CREATE INDEX IF NOT EXISTS idx_cliparts_tags_gin 
ON public.cliparts USING gin(tags);

-- Index pour tri par slug (recherche rapide)
CREATE INDEX IF NOT EXISTS idx_cliparts_slug 
ON public.cliparts(slug);


-- =====================================================
-- 3. CUSTOM_DESIGNS - Optimisation complète
-- =====================================================

-- Index pour récupération designs par utilisateur
CREATE INDEX IF NOT EXISTS idx_custom_designs_user_created 
ON public.custom_designs(user_id, created_at DESC);

-- Index pour récupération designs par produit
CREATE INDEX IF NOT EXISTS idx_custom_designs_product_created 
ON public.custom_designs(product_id, created_at DESC);

-- Index pour filtrage par statut
CREATE INDEX IF NOT EXISTS idx_custom_designs_status 
ON public.custom_designs(status, created_at DESC);

-- Index pour designs liés à une commande
CREATE INDEX IF NOT EXISTS idx_custom_designs_order_id 
ON public.custom_designs(order_id) 
WHERE order_id IS NOT NULL;

-- Index pour templates (designs réutilisables)
CREATE INDEX IF NOT EXISTS idx_custom_designs_is_template 
ON public.custom_designs(is_template, created_at DESC) 
WHERE is_template = true;

-- Index composite pour dashboard utilisateur
CREATE INDEX IF NOT EXISTS idx_custom_designs_user_status 
ON public.custom_designs(user_id, status, created_at DESC);

-- Index pour designs avec commande
CREATE INDEX IF NOT EXISTS idx_custom_designs_ordered 
ON public.custom_designs(user_id, ordered_at DESC) 
WHERE ordered_at IS NOT NULL;

-- Index pour designs imprimés
CREATE INDEX IF NOT EXISTS idx_custom_designs_printed 
ON public.custom_designs(user_id, printed_at DESC) 
WHERE printed_at IS NOT NULL;


-- =====================================================
-- 4. ORDERS - Optimisation complète
-- =====================================================

-- Index pour récupération commandes par utilisateur
CREATE INDEX IF NOT EXISTS idx_orders_user_created 
ON public.orders(user_id, created_at DESC);

-- Index pour filtrage par statut
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON public.orders(status, created_at DESC);

-- Index composite pour dashboard utilisateur
CREATE INDEX IF NOT EXISTS idx_orders_user_status 
ON public.orders(user_id, status, created_at DESC);

-- Index pour commandes payées
CREATE INDEX IF NOT EXISTS idx_orders_paid_at 
ON public.orders(user_id, created_at DESC) 
WHERE status = 'paid';


-- =====================================================
-- 5. PRODUCTS - Optimisation complète
-- =====================================================

-- Index pour filtrage par catégorie
CREATE INDEX IF NOT EXISTS idx_products_category 
ON public.products(category);

-- Index pour tri par date de création
CREATE INDEX IF NOT EXISTS idx_products_created 
ON public.products(created_at DESC);

-- Index pour produits par utilisateur
CREATE INDEX IF NOT EXISTS idx_products_user_created 
ON public.products(user_id, created_at DESC);

-- Index composite pour catalogue
CREATE INDEX IF NOT EXISTS idx_products_category_created 
ON public.products(category, created_at DESC);


-- =====================================================
-- 6. USER_FAVORITES - Optimisation complète
-- =====================================================

-- Index pour récupération favoris par utilisateur et type
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_type 
ON public.user_favorites(user_id, item_type, created_at DESC);

-- Index pour recherche inverse (quel utilisateur a aimé cet item)
CREATE INDEX IF NOT EXISTS idx_user_favorites_item 
ON public.user_favorites(item_id, item_type);

-- Index composite pour suppression rapide
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_item 
ON public.user_favorites(user_id, item_id, item_type);


-- =====================================================
-- 7. USER_DOWNLOADS - Optimisation complète
-- =====================================================

-- Index pour historique téléchargements par utilisateur
CREATE INDEX IF NOT EXISTS idx_user_downloads_user_created 
ON public.user_downloads(user_id, created_at DESC);

-- Index pour statistiques par item
CREATE INDEX IF NOT EXISTS idx_user_downloads_item_type 
ON public.user_downloads(item_id, item_type, created_at DESC);

-- Index pour comptage téléchargements par item
CREATE INDEX IF NOT EXISTS idx_user_downloads_item_count 
ON public.user_downloads(item_id, item_type);


-- =====================================================
-- 8. INDEXES SUPPLÉMENTAIRES (si tables existent)
-- =====================================================

-- INTEGRATIONS
CREATE INDEX IF NOT EXISTS idx_integrations_user_platform 
ON public.integrations(user_id, platform);

CREATE INDEX IF NOT EXISTS idx_integrations_active 
ON public.integrations(user_id, is_active) 
WHERE is_active = true;

-- NOTIFICATIONS
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON public.notifications(user_id, created_at DESC);

-- AUDIT_LOGS
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
ON public.audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created 
ON public.audit_logs(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource 
ON public.audit_logs(resource_type, resource_id);


-- =====================================================
-- 9. ANALYSE DES PERFORMANCES
-- =====================================================

-- Activer l'extension pour statistiques de requêtes
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Afficher les indexes créés
DO $$ 
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
  
  RAISE NOTICE '✅ Optimisation database complétée avec succès !';
  RAISE NOTICE '📊 % indexes créés au total.', index_count;
  RAISE NOTICE '🚀 Performance améliorée pour:';
  RAISE NOTICE '   • Filtrage par catégorie';
  RAISE NOTICE '   • Recherche par utilisateur';
  RAISE NOTICE '   • Tri par date et popularité';
  RAISE NOTICE '   • Recherche par tags (GIN)';
  RAISE NOTICE '   • Récupération commandes et designs';
END $$;


-- =====================================================
-- 10. RÉSUMÉ DES OPTIMISATIONS
-- =====================================================

-- Templates: 8 indexes
-- Cliparts: 6 indexes
-- Custom Designs: 8 indexes
-- Orders: 4 indexes
-- Products: 4 indexes
-- User Favorites: 3 indexes
-- User Downloads: 3 indexes
-- Autres tables: 7 indexes
-- =====================================================
-- TOTAL: 43 indexes pour performance maximale
-- =====================================================

-- Vérification finale
SELECT 
  schemaname,
  tablename,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  AND tablename IN ('templates', 'cliparts', 'orders', 'custom_designs', 'products', 'user_favorites', 'user_downloads')
GROUP BY schemaname, tablename
ORDER BY tablename;


