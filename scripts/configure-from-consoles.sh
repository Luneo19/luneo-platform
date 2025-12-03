#!/bin/bash

# Script de configuration depuis les consoles Neon, Upstash et Cloudinary
# Basé sur les URLs fournies

set -e

echo "⚙️ Configuration Automatique depuis les Consoles"
echo "================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Instructions:${NC}"
echo ""
echo "1. Neon: https://console.neon.tech/app/projects/late-fog-69955127"
echo "   → Cliquez sur 'Connect' ou 'Connection string'"
echo "   → Copiez la connection string complète"
echo ""
echo "2. Upstash: https://console.upstash.com/redis/f5689418-2571-465c-bb57-bf594f290899"
echo "   → Section 'Connection details'"
echo "   → Copiez: Redis URL, REST URL, REST Token"
echo ""
echo "3. Cloudinary: https://console.cloudinary.com/app/c-8af446674d728b78cb0129e8f860a0/home/dashboard"
echo "   → Cliquez sur 'Go to API Keys'"
echo "   → Copiez: Cloud Name, API Key, API Secret"
echo ""

read -p "Appuyez sur Entrée quand vous êtes prêt à entrer les credentials... " dummy

# Neon
echo ""
echo -e "${GREEN}1️⃣ Neon Database${NC}"
echo "   Allez sur: https://console.neon.tech/app/projects/late-fog-69955127"
echo "   → Cliquez sur 'Connect' ou 'Connection string'"
echo "   → Sélectionnez la branche 'production'"
echo "   → Copiez la connection string complète"
read -p "   Connection string Neon: " DATABASE_URL

# Upstash Redis
echo ""
echo -e "${GREEN}2️⃣ Upstash Redis${NC}"
echo "   Allez sur: https://console.upstash.com/redis/f5689418-2571-465c-bb57-bf594f290899"
echo "   → Section 'Connection details'"
echo "   → Copiez la Redis URL (format: redis://default:token@endpoint:6379)"
read -p "   Redis URL: " REDIS_URL

echo "   → Copiez la REST URL (format: https://endpoint.upstash.io)"
read -p "   REST URL: " UPSTASH_REST_URL

echo "   → Copiez le REST Token"
read -p "   REST Token: " UPSTASH_REST_TOKEN

# Cloudinary
echo ""
echo -e "${GREEN}3️⃣ Cloudinary${NC}"
echo "   Allez sur: https://console.cloudinary.com/app/c-8af446674d728b78cb0129e8f860a0/home/dashboard"
echo "   → Cliquez sur 'Go to API Keys'"
echo "   → Cloud Name devrait être: deh4aokbx"
read -p "   Cloud Name [deh4aokbx]: " CLOUDINARY_CLOUD_NAME
CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME:-deh4aokbx}

read -p "   API Key: " CLOUDINARY_API_KEY
read -p "   API Secret: " CLOUDINARY_API_SECRET

# Générer JWT secrets
echo ""
echo -e "${GREEN}4️⃣ Génération des JWT Secrets${NC}"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32)
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32)
echo "   ✅ Secrets générés automatiquement"

# Créer fichier backend
echo ""
echo -e "${YELLOW}📝 Création des fichiers de configuration...${NC}"

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

echo -e "${GREEN}✅ Backend configuré: $BACKEND_ENV${NC}"

# Créer fichier frontend
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

echo -e "${GREEN}✅ Frontend configuré: $FRONTEND_ENV${NC}"

echo ""
echo -e "${GREEN}🎉 Configuration terminée!${NC}"
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Tester la base de données:"
echo "   cd apps/backend && npx prisma db push"
echo ""
echo "2. Démarrer l'application:"
echo "   cd apps/backend && npm run start:dev"
echo "   cd apps/frontend && npm run dev"
echo ""
echo "✅ Tous les services sont maintenant configurés avec des alternatives GRATUITES!"

