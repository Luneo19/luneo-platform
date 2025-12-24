#!/bin/bash

# Script pour créer les fichiers .env.local avec TOUS les credentials

set -e

echo "⚙️ Création des fichiers .env.local complets"
echo "============================================="
echo ""

# Toutes les valeurs fournies
DATABASE_URL="postgresql://neondb_owner:npg_6vgw4tFMpTxo@ep-solitary-moon-abw2l1e0-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
REDIS_URL="rediss://default:AVMtAAIncDJmZTJmNGVkMzdhZGE0MmI5YjBhMzU4N2QyOTBmNTU2YXAyMjEyOTM@moved-gelding-21293.upstash.io:6379"
UPSTASH_REST_URL="https://moved-gelding-21293.upstash.io"
UPSTASH_REST_TOKEN="AVMtAAIncDJmZTJmNGVkMzdhZGE0MmI5YjBhMzU4N2QyOTBmNTU2YXAyMjEyOTM"
CLOUDINARY_CLOUD_NAME="deh4aokbx"
CLOUDINARY_API_KEY="541766291559917"
CLOUDINARY_API_SECRET="s0yc_QR4w9IsM6_HRq2hM5SDnfI"

# Générer JWT secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32)
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32)

echo "✅ Tous les credentials fournis!"
echo ""

# Backend .env.local
BACKEND_ENV="apps/backend/.env.local"
echo "📝 Création de $BACKEND_ENV..."

cat > "$BACKEND_ENV" << EOF
# ========================================
# LUNEO BACKEND - Configuration GRATUITE
# Généré automatiquement le $(date)
# ========================================

# Base de Données - Neon (GRATUIT)
DATABASE_URL="$DATABASE_URL"

# Redis - Upstash (GRATUIT)
REDIS_URL="$REDIS_URL"

# Stockage - Cloudinary (GRATUIT)
CLOUDINARY_CLOUD_NAME="$CLOUDINARY_CLOUD_NAME"
CLOUDINARY_API_KEY="$CLOUDINARY_API_KEY"
CLOUDINARY_API_SECRET="$CLOUDINARY_API_SECRET"

# JWT Secrets (générés automatiquement)
JWT_SECRET="$JWT_SECRET"
JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Application
NODE_ENV="development"
PORT="3000"
API_PREFIX="/api/v1"
CORS_ORIGIN="*"
FRONTEND_URL="http://localhost:3001"

# ⚠️ AWS DÉSACTIVÉ
# Ne pas utiliser les variables AWS
EOF

echo "✅ Backend configuré!"

# Frontend .env.local
FRONTEND_ENV="apps/frontend/.env.local"
echo "📝 Création de $FRONTEND_ENV..."

cat > "$FRONTEND_ENV" << EOF
# ========================================
# LUNEO FRONTEND - Configuration GRATUITE
# Généré automatiquement le $(date)
# ========================================

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Stockage - Cloudinary (GRATUIT)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="$CLOUDINARY_CLOUD_NAME"
CLOUDINARY_CLOUD_NAME="$CLOUDINARY_CLOUD_NAME"
CLOUDINARY_API_KEY="$CLOUDINARY_API_KEY"
CLOUDINARY_API_SECRET="$CLOUDINARY_API_SECRET"

# Redis - Upstash (GRATUIT - pour API routes)
UPSTASH_REDIS_REST_URL="$UPSTASH_REST_URL"
UPSTASH_REDIS_REST_TOKEN="$UPSTASH_REST_TOKEN"

# Application
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHAT=false
NEXT_PUBLIC_ENABLE_AI_STUDIO=true

# ⚠️ AWS DÉSACTIVÉ
# Ne pas utiliser les variables AWS
EOF

echo "✅ Frontend configuré!"
echo ""
echo "🎉 Configuration 100% terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Tester la base de données:"
echo "     cd apps/backend && npx prisma db push"
echo ""
echo "  2. Démarrer l'application:"
echo "     cd apps/backend && npm run start:dev"
echo "     cd apps/frontend && npm run dev"
echo ""
echo "✅ Tous les services sont maintenant configurés avec des alternatives GRATUITES!"
