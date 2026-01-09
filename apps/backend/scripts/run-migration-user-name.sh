#!/bin/bash

# Script pour exécuter la migration add_user_name_column sur Railway
# Usage: railway run "cd apps/backend && bash scripts/run-migration-user-name.sh"

set -e

echo "🔄 Exécution de la migration add_user_name_column..."
echo ""

# Vérifier que DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL n'est pas défini"
  exit 1
fi

# Exécuter la migration SQL directement
psql "$DATABASE_URL" -f prisma/migrations/add_user_name_column/migration.sql

echo ""
echo "✅ Migration exécutée avec succès !"
echo ""
echo "🔍 Vérification de la colonne..."
psql "$DATABASE_URL" -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'name';"





