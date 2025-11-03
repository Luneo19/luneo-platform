-- Récupérer TOUTES les colonnes de TOUTES les tables en une seule requête
SELECT 
  table_name,
  column_name,
  data_type,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('templates', 'cliparts', 'products', 'orders', 'custom_designs', 'user_favorites', 'user_downloads')
ORDER BY table_name, ordinal_position;



