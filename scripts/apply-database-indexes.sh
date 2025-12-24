#!/bin/bash

# Script pour appliquer les index composites à la base de données
# Usage: ./scripts/apply-database-indexes.sh

set -e

echo "🔍 Application des index composites à la base de données..."
echo ""

# Vérifier que DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erreur: DATABASE_URL n'est pas défini"
  echo "   Définissez DATABASE_URL dans votre .env.local"
  exit 1
fi

# Chemin vers le fichier SQL
SQL_FILE="apps/backend/prisma/migrations/add_composite_indexes.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Erreur: Fichier SQL non trouvé: $SQL_FILE"
  exit 1
fi

echo "📄 Fichier SQL: $SQL_FILE"
echo ""

# Appliquer les index via psql
echo "🚀 Application des index..."
psql "$DATABASE_URL" -f "$SQL_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Index composites appliqués avec succès!"
  echo ""
  echo "📊 Vérification des index créés..."
  psql "$DATABASE_URL" -c "
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE indexname LIKE 'idx_%'
    ORDER BY tablename, indexname;
  "
  echo ""
  echo "✨ Terminé!"
else
  echo ""
  echo "❌ Erreur lors de l'application des index"
  exit 1
fi

