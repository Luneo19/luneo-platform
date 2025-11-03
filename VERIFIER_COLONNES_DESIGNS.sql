-- ═══════════════════════════════════════════════════════════════
-- 🔍 VÉRIFIER LES COLONNES DE LA TABLE DESIGNS
-- ═══════════════════════════════════════════════════════════════

-- Exécute cette requête dans Supabase pour voir TOUTES les colonnes :

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'designs'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════════════
-- 📋 RÉSULTAT ATTENDU
-- ═══════════════════════════════════════════════════════════════
-- 
-- Tu vas voir toutes les colonnes de la table designs.
-- Cherche les colonnes d'images comme :
--   - image_url
--   - preview_url
--   - generated_image_url
--   - highResUrl
--   - etc.
-- 
-- Une fois que tu as le nom exact, dis-le moi et je corrige !
-- 
-- ═══════════════════════════════════════════════════════════════

