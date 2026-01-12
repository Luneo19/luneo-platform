#!/bin/bash

# Script pour exécuter la migration Prisma
# Usage: ./scripts/run-migration.sh

set -e

echo "🔄 Exécution de la migration Prisma..."

cd apps/backend

echo "📝 Génération du client Prisma..."
npx prisma generate

echo "🗄️  Application de la migration..."
npx prisma migrate dev --name add_2fa_and_indexes

echo "✅ Migration appliquée avec succès!"
echo ""
echo "Les champs suivants ont été ajoutés à la table User:"
echo "  - is_2fa_enabled (Boolean)"
echo "  - two_fa_secret (Text)"
echo "  - temp_2fa_secret (Text)"
echo "  - backup_codes (Text[])"
echo ""
echo "Les indexes suivants ont été créés pour optimiser les performances:"
echo "  - User: email, brandId, lastLoginAt, createdAt"
echo "  - Order: brandId, userId, status, createdAt (composite)"
echo "  - Product: brandId, isActive, isPublic, createdAt (composite)"
echo "  - Design: userId, brandId, status, createdAt (composite)"
echo "  - Customization: brandId, userId, status, createdAt"
echo "  - UsageMetric: brandId, metricType, timestamp (composite)"

cd ../..
