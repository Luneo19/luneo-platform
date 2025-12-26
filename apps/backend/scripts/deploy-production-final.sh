#!/bin/bash

# ==============================================
# DÉPLOIEMENT PRODUCTION FINAL COMPLET
# Configure TOUT et déploie en production
# ==============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  DÉPLOIEMENT PRODUCTION FINAL - LUNEO                     ║${NC}"
echo -e "${BLUE}║  Configuration expert et déploiement complet             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$BACKEND_DIR"

# ==============================================
# 1. VÉRIFICATIONS
# ==============================================
echo -e "${YELLOW}📋 Vérifications...${NC}"

if ! vercel whoami > /dev/null 2>&1; then
    echo -e "${RED}❌ Non connecté à Vercel${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Connecté à Vercel: $(vercel whoami)${NC}"

# ==============================================
# 2. VALIDATION PRISMA
# ==============================================
echo -e "${YELLOW}🔍 Validation Prisma...${NC}"
npx prisma validate
echo -e "${GREEN}✅ Schema Prisma valide${NC}"

# ==============================================
# 3. GÉNÉRATION PRISMA (avec DATABASE_URL mock)
# ==============================================
echo -e "${YELLOW}⚙️  Génération Prisma client...${NC}"
DATABASE_URL="postgresql://postgres:test@localhost:5432/test" npx prisma generate
echo -e "${GREEN}✅ Client Prisma généré${NC}"

# ==============================================
# 4. BUILD LOCAL
# ==============================================
echo -e "${YELLOW}🔨 Build local...${NC}"
npm run build
echo -e "${GREEN}✅ Build local réussi${NC}"

# ==============================================
# 5. VÉRIFICATION VERCEL.JSON
# ==============================================
echo -e "${YELLOW}🔍 Vérification vercel.json...${NC}"

if [ ! -f "vercel.json" ]; then
    echo -e "${YELLOW}📝 Création de vercel.json...${NC}"
    cat > vercel.json << 'EOF'
{
  "version": 2,
  "buildCommand": "npx prisma generate && npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install --include=dev",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/api/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "VERCEL": "1"
  },
  "regions": ["cdg1"]
}
EOF
fi

# ==============================================
# 6. CONFIGURATION VARIABLES VERCEL
# ==============================================
echo -e "${YELLOW}🔧 Configuration des variables Vercel...${NC}"

# Fonction pour ajouter une variable si elle n'existe pas
add_env_if_missing() {
    local key=$1
    local value=$2
    
    if vercel env ls 2>/dev/null | grep -q " $key "; then
        echo -e "${YELLOW}⚠️  Variable $key existe déjà${NC}"
    else
        echo -e "${BLUE}📝 Ajout: $key${NC}"
        echo "$value" | vercel env add "$key" production 2>&1 | tail -2
    fi
}

# Générer secrets
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n' | head -c 64)
JWT_REFRESH=$(openssl rand -base64 64 | tr -d '\n' | head -c 64)
MASTER_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Variables critiques
add_env_if_missing "JWT_SECRET" "$JWT_SECRET"
add_env_if_missing "JWT_REFRESH_SECRET" "$JWT_REFRESH"
add_env_if_missing "MASTER_ENCRYPTION_KEY" "$MASTER_KEY"

# Stripe
add_env_if_missing "STRIPE_SECRET_KEY" "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"
add_env_if_missing "STRIPE_WEBHOOK_SECRET" "whsec_rgKvTaCDRSLV6Iv6yrF8fNBh9c2II3uu"
add_env_if_missing "STRIPE_PRICE_PRO" "price_1RvB1uKG9MsM6fdSnrGm2qIo"
add_env_if_missing "STRIPE_PRICE_ENTERPRISE" "price_1SH7TMKG9MsM6fdSx4pebEXZ"

# SendGrid
add_env_if_missing "SENDGRID_API_KEY" "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"
add_env_if_missing "SENDGRID_DOMAIN" "luneo.app"
add_env_if_missing "SENDGRID_FROM_EMAIL" "no-reply@luneo.app"

# Cloudinary
add_env_if_missing "CLOUDINARY_CLOUD_NAME" "deh4aokbx"
add_env_if_missing "CLOUDINARY_API_KEY" "541766291559917"
add_env_if_missing "CLOUDINARY_API_SECRET" "s0yc_QR4w9IsM6_HRq2hM5SDnfI"

# OAuth
add_env_if_missing "GOOGLE_CLIENT_ID" "212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com"
add_env_if_missing "GOOGLE_CLIENT_SECRET" "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"
add_env_if_missing "GITHUB_CLIENT_ID" "Ov23liJmVOHyn8tfxgLi"
add_env_if_missing "GITHUB_CLIENT_SECRET" "81bbea63bfc5651e048e5e7f62f69c5d4aad55f9"

# App Config
add_env_if_missing "FRONTEND_URL" "https://app.luneo.app"
add_env_if_missing "API_PREFIX" "/api"
add_env_if_missing "NODE_ENV" "production"

echo -e "${GREEN}✅ Variables configurées${NC}"
echo ""

# ==============================================
# 7. VÉRIFICATION DATABASE_URL
# ==============================================
echo -e "${YELLOW}🔍 Vérification DATABASE_URL...${NC}"

DB_URL=$(vercel env ls 2>/dev/null | grep " DATABASE_URL " | head -1 || echo "")
if [ -z "$DB_URL" ] || [[ "$DB_URL" == *"placeholder"* ]] || [[ "$DB_URL" == *"PASSWORD"* ]]; then
    echo -e "${RED}❌ DATABASE_URL non configurée correctement${NC}"
    echo -e "${YELLOW}   Configurez-la dans Vercel Dashboard:${NC}"
    echo -e "${YELLOW}   https://vercel.com/luneos-projects/backend/settings/environment-variables${NC}"
    echo -e "${YELLOW}   Format: postgresql://postgres:[PASSWORD]@db.obrijgptqztacolemsbk.supabase.co:5432/postgres${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Le déploiement peut échouer sans DATABASE_URL valide${NC}"
else
    echo -e "${GREEN}✅ DATABASE_URL configurée${NC}"
fi

echo ""

# ==============================================
# 8. DÉPLOIEMENT
# ==============================================
echo -e "${YELLOW}🚀 Déploiement sur Vercel...${NC}"

vercel --prod --yes

echo ""
echo -e "${GREEN}✅ Déploiement lancé!${NC}"
echo ""
echo -e "${YELLOW}📋 Surveillez le déploiement:${NC}"
echo "   https://vercel.com/luneos-projects/backend"
echo ""




















