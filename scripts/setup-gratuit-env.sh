#!/bin/bash

# Script de configuration pour les services gratuits
# Remplace AWS par Neon, Upstash, Cloudinary

set -e

echo "⚙️ Configuration des Services Gratuits"
echo "======================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour demander une valeur
ask_value() {
    local prompt="$1"
    local var_name="$2"
    local default="$3"
    local value
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        value=${value:-$default}
    else
        read -p "$prompt: " value
    fi
    
    echo "$value"
}

echo "📋 Ce script va configurer:"
echo "  1. Neon (Base de données PostgreSQL)"
echo "  2. Upstash (Redis)"
echo "  3. Cloudinary (Stockage)"
echo ""

# Backend
echo -e "${YELLOW}📦 Configuration Backend${NC}"
echo ""

BACKEND_ENV="apps/backend/.env.local"

if [ -f "$BACKEND_ENV" ]; then
    echo -e "${YELLOW}⚠️  Le fichier $BACKEND_ENV existe déjà${NC}"
    read -p "Voulez-vous le remplacer? (oui/non): " replace
    if [ "$replace" != "oui" ]; then
        echo "Configuration annulée."
        exit 0
    fi
fi

# Base de données - Neon
echo ""
echo -e "${GREEN}1️⃣ Base de Données - Neon${NC}"
echo "   Allez sur https://neon.tech et copiez votre connection string"
DATABASE_URL=$(ask_value "Connection string Neon (postgresql://...)" "DATABASE_URL" "")

# Redis - Upstash
echo ""
echo -e "${GREEN}2️⃣ Redis - Upstash${NC}"
echo "   Allez sur https://upstash.com et copiez votre connection string Redis"
REDIS_URL=$(ask_value "Connection string Upstash Redis (redis://...)" "REDIS_URL" "")

# Cloudinary
echo ""
echo -e "${GREEN}3️⃣ Cloudinary${NC}"
echo "   Allez sur https://cloudinary.com et copiez vos credentials"
CLOUDINARY_CLOUD_NAME=$(ask_value "Cloudinary Cloud Name" "CLOUDINARY_CLOUD_NAME" "")
CLOUDINARY_API_KEY=$(ask_value "Cloudinary API Key" "CLOUDINARY_API_KEY" "")
CLOUDINARY_API_SECRET=$(ask_value "Cloudinary API Secret" "CLOUDINARY_API_SECRET" "")

# JWT Secrets
echo ""
echo -e "${GREEN}4️⃣ JWT Secrets${NC}"
echo "   Génération de secrets sécurisés..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32)
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32)

echo ""
echo "📝 Création du fichier $BACKEND_ENV..."

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

echo -e "${GREEN}✅ Fichier backend créé!${NC}"

# Frontend
echo ""
echo -e "${YELLOW}📦 Configuration Frontend${NC}"
echo ""

FRONTEND_ENV="apps/frontend/.env.local"

if [ -f "$FRONTEND_ENV" ]; then
    echo -e "${YELLOW}⚠️  Le fichier $FRONTEND_ENV existe déjà${NC}"
    read -p "Voulez-vous le remplacer? (oui/non): " replace
    if [ "$replace" != "oui" ]; then
        echo "Configuration frontend annulée."
    else
        # Upstash REST (pour frontend)
        echo ""
        echo -e "${GREEN}Upstash REST (pour API routes)${NC}"
        UPSTASH_REST_URL=$(ask_value "Upstash REST URL (https://...)" "UPSTASH_REST_URL" "")
        UPSTASH_REST_TOKEN=$(ask_value "Upstash REST Token" "UPSTASH_REST_TOKEN" "")
        
        echo ""
        echo "📝 Création du fichier $FRONTEND_ENV..."
        
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
        
        echo -e "${GREEN}✅ Fichier frontend créé!${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ Configuration terminée!${NC}"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Vérifier les fichiers créés:"
echo "     - apps/backend/.env.local"
echo "     - apps/frontend/.env.local"
echo ""
echo "  2. Tester la base de données:"
echo "     cd apps/backend && npx prisma db push"
echo ""
echo "  3. Démarrer l'application:"
echo "     cd apps/backend && npm run start:dev"
echo "     cd apps/frontend && npm run dev"
echo ""
echo "📖 Voir CONFIGURATION_GUIDE.md pour plus de détails"

