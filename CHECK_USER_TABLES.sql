-- Vérifier les colonnes de user_favorites et user_downloads
(SELECT 'user_favorites' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_favorites'
ORDER BY ordinal_position)

UNION ALL

(SELECT 'user_downloads' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_downloads'
ORDER BY ordinal_position);

