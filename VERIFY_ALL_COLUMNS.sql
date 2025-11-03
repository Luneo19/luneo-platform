-- =====================================================
-- 🔍 VÉRIFICATION COMPLÈTE - TOUTES LES COLONNES
-- =====================================================
-- EXÉCUTEZ CE SCRIPT ET ENVOYEZ-MOI UNE CAPTURE D'ÉCRAN
-- =====================================================

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('templates', 'cliparts', 'products', 'orders', 'custom_designs', 'user_favorites', 'user_downloads')
ORDER BY 
  CASE table_name
    WHEN 'templates' THEN 1
    WHEN 'cliparts' THEN 2
    WHEN 'products' THEN 3
    WHEN 'orders' THEN 4
    WHEN 'custom_designs' THEN 5
    WHEN 'user_favorites' THEN 6
    WHEN 'user_downloads' THEN 7
  END,
  ordinal_position;


