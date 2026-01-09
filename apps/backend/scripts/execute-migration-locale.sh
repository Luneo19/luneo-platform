#!/bin/bash

# Script pour exécuter la migration SQL depuis la machine locale
# Utilise la DATABASE_URL de Railway

set -e

echo "🔧 Exécution de la migration SQL depuis la machine locale..."
echo ""

# Récupérer DATABASE_URL depuis Railway
echo "📥 Récupération de DATABASE_URL depuis Railway..."
DATABASE_URL=$(railway variables 2>&1 | grep -A 3 "DATABASE_URL" | grep "postgresql://" | sed 's/.*│[[:space:]]*//' | tr -d '\n' | sed 's/railway$/railway/')

# Si la récupération automatique échoue, demander à l'utilisateur
if [ -z "$DATABASE_URL" ] || [[ "$DATABASE_URL" != "postgresql://"* ]]; then
    echo "⚠️  Impossible de récupérer automatiquement DATABASE_URL"
    echo ""
    echo "Veuillez fournir votre DATABASE_URL Railway :"
    echo "   Vous pouvez la récupérer avec: railway variables | grep DATABASE_URL"
    echo ""
    read -p "DATABASE_URL: " DATABASE_URL
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL est vide. Abandon."
    exit 1
fi

echo "✅ DATABASE_URL récupéré"
echo "   ${DATABASE_URL:0:50}..."
echo ""

# Vérifier que psql est installé
if ! command -v psql &> /dev/null; then
    echo "❌ psql n'est pas installé sur votre machine"
    echo ""
    echo "Pour installer psql :"
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "   Windows: Téléchargez PostgreSQL depuis https://www.postgresql.org/download/"
    exit 1
fi

echo "📝 Exécution de la migration SQL..."
echo ""

# Exécuter la migration SQL
psql "$DATABASE_URL" << 'EOF'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'User' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "name" TEXT;
    RAISE NOTICE 'Column "name" added to User table';
  ELSE
    RAISE NOTICE 'Column "name" already exists in User table';
  END IF;
END $$;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration exécutée avec succès !"
    echo ""
    echo "Prochaines étapes :"
    echo "   1. Tester /api/auth/signup :"
    echo "      curl -X POST https://api.luneo.app/api/auth/signup \\"
    echo "        -H \"Content-Type: application/json\" \\"
    echo "        -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"firstName\":\"Test\",\"lastName\":\"User\"}'"
else
    echo ""
    echo "❌ Erreur lors de l'exécution de la migration"
    exit 1
fi




