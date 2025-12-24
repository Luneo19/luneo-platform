#!/bin/bash

# Script pour copier DATABASE_URL depuis Postgres vers backend
set -e

echo "🔗 Copie de DATABASE_URL depuis Postgres vers backend..."

# Récupérer DATABASE_URL depuis Postgres
DB_URL=$(railway variables --service Postgres --kv 2>&1 | grep "^DATABASE_URL=" | sed 's/^DATABASE_URL=//' | tr -d '\n')

if [ -z "$DB_URL" ]; then
    echo "❌ Impossible de récupérer DATABASE_URL depuis Postgres"
    echo "   Essayons une autre méthode..."
    
    # Méthode alternative : extraire depuis le format tableau
    DB_URL=$(railway variables --service Postgres 2>&1 | grep -A 3 "DATABASE_URL" | grep "postgresql://" | sed 's/.*│[[:space:]]*//' | tr -d '\n')
    
    # Reconstruire l'URL complète (elle peut être sur plusieurs lignes)
    DB_URL=$(railway variables --service Postgres 2>&1 | awk '/DATABASE_URL/,/railway/ {if(/postgresql:\/\//) start=1; if(start) {gsub(/^[│ ]*/, ""); gsub(/[│ ]*$/, ""); url=url$0}} END {print url}' | tr -d '\n' | sed 's/railway$/railway/')
fi

if [ -z "$DB_URL" ]; then
    echo "⚠️  Impossible de récupérer automatiquement DATABASE_URL"
    echo "   Vous devrez le configurer manuellement dans Railway Dashboard"
    echo "   Avec la valeur : \${{Postgres.DATABASE_URL}}"
    exit 1
fi

echo "✅ DATABASE_URL récupéré"
echo "   ${DB_URL:0:50}..."
echo ""

# Définir dans le service backend
echo "📝 Configuration dans le service backend..."
railway variables --service backend --set "DATABASE_URL=$DB_URL" 2>&1

echo ""
echo "✅ DATABASE_URL configuré dans le service backend !"






