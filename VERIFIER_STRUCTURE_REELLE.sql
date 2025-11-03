-- ============================================================================
-- SCRIPT DE VÉRIFICATION - STRUCTURE RÉELLE DE LA BASE SUPABASE
-- ============================================================================
-- Ce script affiche la structure exacte de toutes vos tables
-- pour créer des indexes qui fonctionnent vraiment
-- ============================================================================

-- Afficher toutes les tables dans le schéma public
SELECT 
  '=== TABLES EXISTANTES ===' as info,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Afficher TOUTES les colonnes de la table profiles
SELECT 
  '=== COLONNES DE PROFILES ===' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Afficher TOUTES les colonnes de la table designs
SELECT 
  '=== COLONNES DE DESIGNS ===' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'designs'
ORDER BY ordinal_position;

-- Afficher TOUTES les colonnes de la table projects
SELECT 
  '=== COLONNES DE PROJECTS ===' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'projects'
ORDER BY ordinal_position;

-- Afficher les indexes existants
SELECT 
  '=== INDEXES EXISTANTS ===' as info,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

