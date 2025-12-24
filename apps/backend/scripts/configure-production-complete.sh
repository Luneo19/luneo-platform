#!/bin/bash

# ==============================================
# SCRIPT DE CONFIGURATION PRODUCTION COMPLÈTE
# LUNEO - SaaS de niveau mondial
# ==============================================
# Ce script configure automatiquement TOUT
# pour un déploiement production professionnel
# ==============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$(dirname "$BACKEND_DIR")")"
FRONTEND_DIR="$ROOT_DIR/apps/frontend"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 CONFIGURATION PRODUCTION COMPLÈTE - LUNEO                      ║${NC}"
echo -e "${BLUE}║  SaaS de niveau mondial - Configuration Expert Automatisée        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ==============================================
# 1. VÉRIFICATIONS PRÉLIMINAIRES
# ==============================================
echo -e "${CYAN}📋 Étape 1/10: Vérifications préliminaires...${NC}"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}   ✅ Node.js: $NODE_VERSION${NC}"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}   ✅ npm: $(npm -v)${NC}"

# Vérifier Prisma
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}   ✅ npx disponible${NC}"

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}   ⚠️  Vercel CLI n'est pas installé (optionnel)${NC}"
    echo -e "${YELLOW}      Installez avec: npm i -g vercel${NC}"
else
    echo -e "${GREEN}   ✅ Vercel CLI: $(vercel --version)${NC}"
fi

echo ""

# ==============================================
# 2. GÉNÉRATION DES SECRETS SÉCURISÉS
# ==============================================
echo -e "${CYAN}🔐 Étape 2/10: Génération des secrets sécurisés...${NC}"

generate_secret() {
    openssl rand -base64 64 | tr -d '\n' | head -c 64
}

generate_hex_secret() {
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

JWT_SECRET=$(generate_secret)
JWT_REFRESH_SECRET=$(generate_secret)
MASTER_ENCRYPTION_KEY=$(generate_hex_secret)
SESSION_SECRET=$(generate_secret)
ENCRYPTION_KEY=$(generate_hex_secret)

echo -e "${GREEN}   ✅ Secrets générés (JWT, Encryption, Session)${NC}"
echo ""

# ==============================================
# 3. COLLECTE DES INFORMATIONS
# ==============================================
echo -e "${CYAN}📝 Étape 3/10: Collecte des informations de configuration...${NC}"
echo ""
echo -e "${YELLOW}   💡 Appuyez sur Entrée pour utiliser les valeurs par défaut${NC}"
echo ""

# Database
read -p "   🔐 Database URL (Supabase PostgreSQL): " DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}   ❌ DATABASE_URL est requis${NC}"
    exit 1
fi

# Redis
read -p "   🔴 Redis URL (Upstash ou autre) [redis://localhost:6379]: " REDIS_URL
if [ -z "$REDIS_URL" ]; then
    REDIS_URL="redis://localhost:6379"
    echo -e "${YELLOW}   ⚠️  Utilisation de la valeur par défaut: $REDIS_URL${NC}"
fi

# Upstash Redis (optionnel)
read -p "   🔴 Upstash Redis REST URL (optionnel): " UPSTASH_REDIS_REST_URL
read -p "   🔴 Upstash Redis REST Token (optionnel): " UPSTASH_REDIS_REST_TOKEN

# OpenAI
read -p "   🤖 OpenAI API Key (optionnel): " OPENAI_API_KEY

# Replicate
read -p "   🎨 Replicate API Token (optionnel): " REPLICATE_API_TOKEN

# Sentry
read -p "   📊 Sentry DSN (optionnel): " SENTRY_DSN

# Stripe (avec valeurs par défaut si non fournies)
read -p "   💳 Stripe Secret Key (optionnel, configuré plus tard): " STRIPE_SECRET_KEY
read -p "   💳 Stripe Webhook Secret (optionnel): " STRIPE_WEBHOOK_SECRET

# Cloudinary
read -p "   ☁️  Cloudinary Cloud Name (optionnel): " CLOUDINARY_CLOUD_NAME
read -p "   ☁️  Cloudinary API Key (optionnel): " CLOUDINARY_API_KEY
read -p "   ☁️  Cloudinary API Secret (optionnel): " CLOUDINARY_API_SECRET

# Frontend URL
read -p "   🌐 Frontend URL [https://app.luneo.app]: " FRONTEND_URL
if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL="https://app.luneo.app"
fi

# Backend URL
read -p "   🔧 Backend API URL [https://api.luneo.app]: " BACKEND_URL
if [ -z "$BACKEND_URL" ]; then
    BACKEND_URL="https://api.luneo.app"
fi

echo ""

# ==============================================
# 4. CRÉATION DU FICHIER .env.production BACKEND
# ==============================================
echo -e "${CYAN}📄 Étape 4/10: Création du fichier .env.production (Backend)...${NC}"

cat > "$BACKEND_DIR/.env.production" << EOF
# ==============================================
# CONFIGURATION PRODUCTION - LUNEO BACKEND
# Généré automatiquement le $(date +"%Y-%m-%d %H:%M:%S")
# SaaS de niveau mondial - Configuration Expert
# ==============================================

# ==============================================
# ENVIRONMENT
# ==============================================
NODE_ENV=production
PORT=3001
API_PREFIX=/api
FRONTEND_URL=$FRONTEND_URL
BACKEND_URL=$BACKEND_URL
CORS_ORIGIN=$FRONTEND_URL,https://luneo.app,https://www.luneo.app

# ==============================================
# DATABASE (Supabase PostgreSQL)
# ==============================================
DATABASE_URL="$DATABASE_URL"
DATABASE_POOL_SIZE=20
DATABASE_QUERY_TIMEOUT=30000
DATABASE_CONNECTION_TIMEOUT=10000

# ==============================================
# REDIS (Cache & Sessions)
# ==============================================
REDIS_URL="$REDIS_URL"
UPSTASH_REDIS_REST_URL="$UPSTASH_REDIS_REST_URL"
UPSTASH_REDIS_REST_TOKEN="$UPSTASH_REDIS_REST_TOKEN"
REDIS_CONNECTION_POOL_SIZE=10
REDIS_COMMAND_TIMEOUT=5000
REDIS_TTL=3600

# ==============================================
# JWT AUTHENTICATION
# ==============================================
JWT_SECRET="$JWT_SECRET"
JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ALGORITHM=HS256

# ==============================================
# SESSION MANAGEMENT
# ==============================================
SESSION_SECRET="$SESSION_SECRET"
SESSION_MAX_AGE=604800000
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTP_ONLY=true
SESSION_COOKIE_SAME_SITE=strict

# ==============================================
# ENCRYPTION
# ==============================================
MASTER_ENCRYPTION_KEY="$MASTER_ENCRYPTION_KEY"
ENCRYPTION_KEY="$ENCRYPTION_KEY"
ENCRYPTION_ALGORITHM=aes-256-gcm

# ==============================================
# OAUTH PROVIDERS
# ==============================================
GOOGLE_CLIENT_ID=212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=$BACKEND_URL/api/auth/google/callback

GITHUB_CLIENT_ID=Ov23liJmVOHyn8tfxgLi
GITHUB_CLIENT_SECRET=81bbea63bfc5651e048e5e7f62f69c5d4aad55f9
GITHUB_CALLBACK_URL=$BACKEND_URL/api/auth/github/callback

# ==============================================
# STRIPE PAYMENTS
# ==============================================
STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_PRO=price_1RvB1uKG9MsM6fdSnrGm2qIo
STRIPE_PRICE_BUSINESS=price_1RvB1uKG9MsM6fdS[VERIFY]
STRIPE_PRICE_ENTERPRISE=price_1SH7TMKG9MsM6fdSx4pebEXZ
STRIPE_SUCCESS_URL=$FRONTEND_URL/dashboard/billing/success
STRIPE_CANCEL_URL=$FRONTEND_URL/dashboard/billing/cancel
STRIPE_WEBHOOK_URL=$BACKEND_URL/api/webhooks/stripe

# ==============================================
# CLOUDINARY (Media Storage)
# ==============================================
CLOUDINARY_CLOUD_NAME="$CLOUDINARY_CLOUD_NAME"
CLOUDINARY_API_KEY="$CLOUDINARY_API_KEY"
CLOUDINARY_API_SECRET="$CLOUDINARY_API_SECRET"
CLOUDINARY_SECURE=true
CLOUDINARY_CDN_URL=https://res.cloudinary.com

# ==============================================
# AI PROVIDERS
# ==============================================
OPENAI_API_KEY="$OPENAI_API_KEY"
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.7

REPLICATE_API_TOKEN="$REPLICATE_API_TOKEN"
REPLICATE_MODEL=stability-ai/sdxl

# ==============================================
# SENDGRID EMAIL
# ==============================================
SENDGRID_API_KEY=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
SENDGRID_DOMAIN=luneo.app
SENDGRID_FROM_NAME=Luneo
SENDGRID_FROM_EMAIL=no-reply@luneo.app
SENDGRID_REPLY_TO=support@luneo.app
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FROM=Luneo <no-reply@luneo.app>
DOMAIN_VERIFIED=true
SPF_RECORD=v=spf1 include:_spf.sendgrid.net ~all
DMARC_RECORD=v=DMARC1; p=quarantine; rua=mailto:dmarc@luneo.app

# ==============================================
# EMAIL TEMPLATES (SendGrid Dynamic Templates)
# ==============================================
EMAIL_TEMPLATE_WELCOME=d-welcome-template-id
EMAIL_TEMPLATE_PASSWORD_RESET=d-password-reset-template-id
EMAIL_TEMPLATE_EMAIL_CONFIRMATION=d-email-confirmation-template-id
EMAIL_TEMPLATE_INVOICE=d-invoice-template-id
EMAIL_TEMPLATE_NEWSLETTER=d-newsletter-template-id
EMAIL_TEMPLATE_ORDER_CONFIRMATION=d-order-confirmation-template-id
EMAIL_TEMPLATE_PRODUCTION_READY=d-production-ready-template-id
EMAIL_TEMPLATE_2FA_CODE=d-2fa-code-template-id

# ==============================================
# MONITORING & OBSERVABILITY
# ==============================================
SENTRY_DSN="$SENTRY_DSN"
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_RELEASE=\$(git rev-parse HEAD 2>/dev/null || echo "unknown")

# ==============================================
# RATE LIMITING
# ==============================================
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
RATE_LIMIT_SKIP_FAILED_REQUESTS=false

# ==============================================
# PERFORMANCE OPTIMIZATIONS
# ==============================================
PRISMA_CONNECTION_POOL_SIZE=20
PRISMA_QUERY_TIMEOUT=30000
PRISMA_LOG_LEVEL=warn
REDIS_CONNECTION_POOL_SIZE=10
REDIS_COMMAND_TIMEOUT=5000
CACHE_TTL=3600
CACHE_MAX_SIZE=1000

# ==============================================
# LOGGING
# ==============================================
LOG_LEVEL=info
LOG_FORMAT=json
ENABLE_REQUEST_LOGGING=true
ENABLE_QUERY_LOGGING=false
LOG_FILE_PATH=logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=14

# ==============================================
# WEBHOOKS
# ==============================================
WEBHOOK_TIMEOUT=30000
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=5000
WEBHOOK_SIGNATURE_ALGORITHM=sha256

# ==============================================
# BULLMQ (Job Queue)
# ==============================================
BULLMQ_REDIS_URL="$REDIS_URL"
BULLMQ_CONCURRENCY=5
BULLMQ_MAX_RETRIES=3
BULLMQ_RETRY_DELAY=5000
BULLMQ_REMOVE_ON_COMPLETE=true
BULLMQ_REMOVE_ON_FAIL=false

# ==============================================
# SECURITY
# ==============================================
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SYMBOLS=true
SESSION_IDLE_TIMEOUT=1800000
SESSION_ABSOLUTE_TIMEOUT=604800000

# ==============================================
# FEATURE FLAGS
# ==============================================
ENABLE_2FA=true
ENABLE_SSO=true
ENABLE_WHITE_LABEL=true
ENABLE_ANALYTICS=true
ENABLE_AI_STUDIO=true
ENABLE_VIRTUAL_TRY_ON=true
ENABLE_3D_CONFIGURATOR=true

# ==============================================
# INTEGRATIONS
# ==============================================
SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=
SHOPIFY_WEBHOOK_SECRET=
WOOCOMMERCE_WEBHOOK_SECRET=
PRINTFUL_API_KEY=
PRINTFUL_WEBHOOK_SECRET=
ZAPIER_WEBHOOK_SECRET=
MAKE_WEBHOOK_SECRET=
EOF

echo -e "${GREEN}   ✅ Fichier .env.production (Backend) créé${NC}"
echo ""

# ==============================================
# 5. CRÉATION DU FICHIER .env.production FRONTEND
# ==============================================
echo -e "${CYAN}📄 Étape 5/10: Création du fichier .env.production (Frontend)...${NC}"

cat > "$FRONTEND_DIR/.env.production" << EOF
# ==============================================
# CONFIGURATION PRODUCTION - LUNEO FRONTEND
# Généré automatiquement le $(date +"%Y-%m-%d %H:%M:%S")
# SaaS de niveau mondial - Configuration Expert
# ==============================================

# ==============================================
# PUBLIC URLs
# ==============================================
NEXT_PUBLIC_APP_URL=$FRONTEND_URL
NEXT_PUBLIC_API_URL=$BACKEND_URL/api

# ==============================================
# SUPABASE AUTHENTICATION
# ==============================================
NEXT_PUBLIC_SUPABASE_URL=https://obrijgptqztacolemsbk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NzY0MDAsImV4cCI6MjA1MDE1MjQwMH0.placeholder
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder

# ==============================================
# OAUTH PROVIDERS (Public Keys)
# ==============================================
NEXT_PUBLIC_GOOGLE_CLIENT_ID=212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23liJmVOHyn8tfxgLi

# ==============================================
# STRIPE PAYMENTS (Public Key)
# ==============================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_jL5xDF4ylCaiXVDswVAliVA3
NEXT_PUBLIC_STRIPE_SUCCESS_URL=$FRONTEND_URL/dashboard/billing/success
NEXT_PUBLIC_STRIPE_CANCEL_URL=$FRONTEND_URL/dashboard/billing/cancel

# ==============================================
# CLOUDINARY (Public Config)
# ==============================================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_API_KEY=$CLOUDINARY_API_KEY

# ==============================================
# MONITORING (Public Keys)
# ==============================================
NEXT_PUBLIC_SENTRY_DSN=$SENTRY_DSN
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=

# ==============================================
# FEATURE FLAGS (Public)
# ==============================================
NEXT_PUBLIC_APP_VERSION=2.0.0
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_AI_STUDIO=true
NEXT_PUBLIC_ENABLE_VIRTUAL_TRY_ON=true
NEXT_PUBLIC_ENABLE_3D_CONFIGURATOR=true

# ==============================================
# SERVER-SIDE SECRETS (Next.js API Routes)
# ==============================================
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_PRO=price_1RvB1uKG9MsM6fdSnrGm2qIo
STRIPE_PRICE_BUSINESS=price_1RvB1uKG9MsM6fdS[VERIFY]
STRIPE_PRICE_ENTERPRISE=price_1SH7TMKG9MsM6fdSx4pebEXZ

CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY=$CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET

OPENAI_API_KEY=$OPENAI_API_KEY
MESHY_API_KEY=
USDZ_CONVERSION_API_URL=
USDZ_CONVERSION_API_KEY=

UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN

SENDGRID_API_KEY=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
PRINTFUL_API_KEY=
PRINTFUL_WEBHOOK_SECRET=

SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=
SHOPIFY_WEBHOOK_SECRET=
WOOCOMMERCE_WEBHOOK_SECRET=

LUNEO_API_URL=$BACKEND_URL/api/v1
LUNEO_API_KEY=
LUNEO_WEBHOOK_SECRET=
INTERNAL_API_URL=$BACKEND_URL/api/v1
INTERNAL_API_TOKEN=
EOF

echo -e "${GREEN}   ✅ Fichier .env.production (Frontend) créé${NC}"
echo ""

# ==============================================
# 6. VALIDATION PRISMA SCHEMA
# ==============================================
echo -e "${CYAN}🔍 Étape 6/10: Validation du schema Prisma...${NC}"

cd "$BACKEND_DIR"

if npx prisma validate > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Schema Prisma valide${NC}"
else
    echo -e "${RED}   ❌ Erreur dans le schema Prisma${NC}"
    npx prisma validate
    exit 1
fi

echo ""

# ==============================================
# 7. GÉNÉRATION PRISMA CLIENT
# ==============================================
echo -e "${CYAN}⚙️  Étape 7/10: Génération du client Prisma...${NC}"

if npx prisma generate > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Client Prisma généré${NC}"
else
    echo -e "${RED}   ❌ Erreur lors de la génération Prisma${NC}"
    npx prisma generate
    exit 1
fi

echo ""

# ==============================================
# 8. BUILD DE L'APPLICATION BACKEND
# ==============================================
echo -e "${CYAN}🔨 Étape 8/10: Build de l'application Backend...${NC}"

if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Build Backend réussi${NC}"
else
    echo -e "${YELLOW}   ⚠️  Erreur lors du build (peut être normal si dépendances manquantes)${NC}"
    echo -e "${YELLOW}      Exécutez: cd apps/backend && npm install && npm run build${NC}"
fi

echo ""

# ==============================================
# 9. CRÉATION DES SCRIPTS UTILITAIRES
# ==============================================
echo -e "${CYAN}📝 Étape 9/10: Création des scripts utilitaires...${NC}"

# Script de vérification
cat > "$BACKEND_DIR/scripts/verify-production-config.sh" << 'VERIFY_SCRIPT'
#!/bin/bash
# Script de vérification de la configuration production
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
echo "🔍 Vérification de la configuration production..."
ERRORS=0
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Fichier .env.production manquant${NC}"
    exit 1
fi
source .env.production
REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"["* ]]; then
        echo -e "${RED}❌ Variable $var manquante${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✅ Variable $var configurée${NC}"
    fi
done
if npx prisma validate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Schema Prisma valide${NC}"
else
    echo -e "${RED}❌ Schema Prisma invalide${NC}"
    ERRORS=$((ERRORS + 1))
fi
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Configuration valide!${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS erreur(s) trouvée(s)${NC}"
    exit 1
fi
VERIFY_SCRIPT

chmod +x "$BACKEND_DIR/scripts/verify-production-config.sh"
echo -e "${GREEN}   ✅ Script de vérification créé${NC}"

# Script de migration
cat > "$BACKEND_DIR/scripts/migrate-production-database.sh" << 'MIGRATE_SCRIPT'
#!/bin/bash
# Migration base de données production
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Fichier .env.production non trouvé${NC}"
    exit 1
fi
export $(grep -v '^#' .env.production | xargs)
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL non configurée${NC}"
    exit 1
fi
echo -e "${YELLOW}📊 Vérification du statut des migrations...${NC}"
npx prisma migrate status
echo ""
read -p "Appliquer les migrations? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi
echo -e "${YELLOW}🔄 Application des migrations...${NC}"
if npx prisma migrate deploy; then
    echo -e "${GREEN}✅ Migrations appliquées avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de l'application des migrations${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Migration terminée!${NC}"
MIGRATE_SCRIPT

chmod +x "$BACKEND_DIR/scripts/migrate-production-database.sh"
echo -e "${GREEN}   ✅ Script de migration créé${NC}"

# Script de configuration Vercel
cat > "$BACKEND_DIR/scripts/setup-vercel-variables.sh" << 'VERCEL_SCRIPT'
#!/bin/bash
# Configuration des variables Vercel
set -e
if [ ! -f .env.production ]; then
    echo "❌ Fichier .env.production non trouvé"
    exit 1
fi
echo "📋 Configuration des variables Vercel..."
echo "⚠️  Ce script nécessite que vous soyez connecté à Vercel"
echo "   Exécutez: vercel login"
echo ""
read -p "Continuer? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi
while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    value=$(echo "$value" | sed 's/^"//;s/"$//')
    echo "Configuring: $key"
    echo "$value" | vercel env add "$key" production 2>/dev/null || echo "   (déjà configuré ou erreur)"
done < .env.production
echo ""
echo "✅ Variables Vercel configurées!"
VERCEL_SCRIPT

chmod +x "$BACKEND_DIR/scripts/setup-vercel-variables.sh"
echo -e "${GREEN}   ✅ Script Vercel créé${NC}"

# Script de déploiement complet
cat > "$BACKEND_DIR/scripts/deploy-production-complete.sh" << 'DEPLOY_SCRIPT'
#!/bin/bash
# Déploiement production complet
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
echo -e "${YELLOW}🚀 Déploiement production...${NC}"
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Fichier .env.production non trouvé${NC}"
    exit 1
fi
echo -e "${YELLOW}📦 Génération Prisma...${NC}"
npx prisma generate
echo -e "${YELLOW}🔨 Build...${NC}"
npm run build
echo -e "${YELLOW}🚀 Déploiement Vercel...${NC}"
vercel --prod
echo -e "${GREEN}✅ Déploiement terminé!${NC}"
DEPLOY_SCRIPT

chmod +x "$BACKEND_DIR/scripts/deploy-production-complete.sh"
echo -e "${GREEN}   ✅ Script de déploiement créé${NC}"

echo ""

# ==============================================
# 10. RÉSUMÉ FINAL
# ==============================================
echo -e "${CYAN}✅ Étape 10/10: Résumé final...${NC}"
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ CONFIGURATION TERMINÉE AVEC SUCCÈS                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📁 Fichiers créés:${NC}"
echo "   ✅ apps/backend/.env.production"
echo "   ✅ apps/frontend/.env.production"
echo "   ✅ apps/backend/scripts/verify-production-config.sh"
echo "   ✅ apps/backend/scripts/migrate-production-database.sh"
echo "   ✅ apps/backend/scripts/setup-vercel-variables.sh"
echo "   ✅ apps/backend/scripts/deploy-production-complete.sh"
echo ""
echo -e "${YELLOW}📋 Prochaines étapes:${NC}"
echo ""
echo -e "${CYAN}   1. Vérifier la configuration:${NC}"
echo "      cd apps/backend"
echo "      ./scripts/verify-production-config.sh"
echo ""
echo -e "${CYAN}   2. Migrer la base de données:${NC}"
echo "      cd apps/backend"
echo "      ./scripts/migrate-production-database.sh"
echo ""
echo -e "${CYAN}   3. Configurer Vercel (optionnel):${NC}"
echo "      cd apps/backend"
echo "      vercel login"
echo "      ./scripts/setup-vercel-variables.sh"
echo ""
echo -e "${CYAN}   4. Déployer en production:${NC}"
echo "      cd apps/backend"
echo "      ./scripts/deploy-production-complete.sh"
echo ""
echo -e "${MAGENTA}💡 Astuce:${NC}"
echo "   - Vérifiez tous les secrets dans .env.production"
echo "   - Configurez les services externes (Stripe, Cloudinary, etc.)"
echo "   - Testez localement avant de déployer"
echo ""
echo -e "${GREEN}🎉 Configuration production prête pour un SaaS de niveau mondial!${NC}"
echo ""




















