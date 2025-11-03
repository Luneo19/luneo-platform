-- =====================================================
-- 🔍 VÉRIFICATION SCHÉMA DES TABLES
-- =====================================================
-- Objectif: Identifier TOUTES les colonnes existantes
-- =====================================================

-- 1. Colonnes de la table TEMPLATES
SELECT 
  'TEMPLATES' as table_name,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'templates'
ORDER BY ordinal_position;

-- 2. Colonnes de la table CLIPARTS
SELECT 
  'CLIPARTS' as table_name,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cliparts'
ORDER BY ordinal_position;

-- 3. Colonnes de la table PRODUCTS
SELECT 
  'PRODUCTS' as table_name,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'products'
ORDER BY ordinal_position;

-- 4. Colonnes de la table ORDERS
SELECT 
  'ORDERS' as table_name,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders'
ORDER BY ordinal_position;

-- 5. Colonnes de la table CUSTOM_DESIGNS
SELECT 
  'CUSTOM_DESIGNS' as table_name,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'custom_designs'
ORDER BY ordinal_position;



