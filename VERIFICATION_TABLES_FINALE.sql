-- ═══════════════════════════════════════════════════════════════
-- 🔍 VÉRIFICATION COMPLÈTE DES TABLES CRÉÉES
-- ═══════════════════════════════════════════════════════════════

-- Exécute cette requête dans Supabase pour voir TOUTES les tables :

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name AND columns.table_schema = 'public') as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ═══════════════════════════════════════════════════════════════
-- 📋 TABLES ATTENDUES (22+)
-- ═══════════════════════════════════════════════════════════════
-- 
-- ✅ Core:
--   - profiles
--   - designs
--   - team_members
--   - api_keys
-- 
-- ✅ E-commerce:
--   - products
--   - product_variants
--   - orders
--   - order_items
--   - order_status_history
-- 
-- ✅ Security:
--   - totp_secrets
--   - totp_attempts
--   - audit_logs
-- 
-- ✅ AR:
--   - ar_models
--   - ar_interactions
-- 
-- ✅ Integrations:
--   - integrations
--   - sync_logs
-- 
-- ✅ Notifications:
--   - notifications
--   - notification_preferences
-- 
-- ✅ Nouvelles (session actuelle):
--   - design_collections ✅
--   - design_collection_items ✅
--   - design_shares ✅
--   - share_analytics ✅
--   - webhook_endpoints ✅
--   - webhook_deliveries ✅
--   - design_versions ✅
--   - role_permissions ✅
-- 
-- ═══════════════════════════════════════════════════════════════

