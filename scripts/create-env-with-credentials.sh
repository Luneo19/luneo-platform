#!/bin/bash

# Script pour créer les .env.local avec les credentials fournis

set -e

echo "⚙️ Création des fichiers .env.local"
echo "===================================="
echo ""

# Credentials fournis
UPSTASH_REST_URL="https://moved-gelding-21293.upstash.io"
UPSTASH_REST_TOKEN="AVMtAAIncDJmZTJmNGVkMzdhZGE0MmI5YjBhMzU4N2QyOTBmNTU2YXAyMjEyOTM"
CLOUDINARY_CLOUD_NAME="deh4aokbx"

# Générer JWT secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32)
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32)

echo "📋 Credentials fournis:"
echo "   ✅ Upstash REST URL"
echo "   ✅ Upstash REST Token"
echo "   ✅ Cloudinary Cloud Name"
echo ""

echo "⚠️  Credentials manquants à fournir:"
echo ""

# Neon Database URL
read -p "🔵 Neon Database URL (postgresql://user:pass@ep-xxx.region.neon.tech/neondb?sslmode=require): " DATABASE_URL

# Upstash Redis URL (TCP)
read -p "🔴 Upstash Redis URL TCP (redis://default:token@moved-gelding-21293.upstash.io:6379): " REDIS_URL

# Cloudinary API Key et Secret
read -p "☁️  Cloudinary API Key: " CLOUDINARY_API_KEY
read -p "☁️  Cloudinary API Secret: " CLOUDINARY_API_SECRET

echo ""
echo "📝 Création des fichiers..."

# Backend .env.local
BACKEND_ENV="apps/backend/.env.local"
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

echo "✅ Backend configuré: $BACKEND_ENV"

# Frontend .env.local
FRONTEND_ENV="apps/frontend/.env.local"
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

echo "✅ Frontend configuré: $FRONTEND_ENV"

echo ""
echo "🎉 Configuration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Tester: cd apps/backend && npx prisma db push"
echo "  2. Démarrer: cd apps/backend && npm run start:dev"

