#!/bin/bash

# ==============================================
# CONFIGURATION ET DÉPLOIEMENT PRODUCTION COMPLET
# Configure TOUT et déploie automatiquement
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
echo -e "${BLUE}║  CONFIGURATION & DÉPLOIEMENT PRODUCTION - LUNEO            ║${NC}"
echo -e "${BLUE}║  Configuration expert complète et déploiement            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$BACKEND_DIR"

# ==============================================
# 1. GÉNÉRATION DES SECRETS
# ==============================================
echo -e "${YELLOW}🔐 Génération des secrets sécurisés...${NC}"

JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n' | head -c 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n' | head -c 64)
MASTER_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo -e "${GREEN}✅ Secrets générés${NC}"
echo ""

# ==============================================
# 2. CONFIGURATION DATABASE_URL (Supabase)
# ==============================================
echo -e "${YELLOW}📊 Configuration de la base de données...${NC}"

# Utiliser le projet Supabase production
DATABASE_URL="postgresql://postgres.obrijgptqztacolemsbk:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo -e "${YELLOW}⚠️  DATABASE_URL nécessite le mot de passe Supabase${NC}"
echo -e "${YELLOW}   Récupérez-le depuis: https://supabase.com/dashboard/project/obrijgptqztacolemsbk/settings/database${NC}"
echo ""

# Pour l'instant, utiliser une URL placeholder qui sera mise à jour
# L'utilisateur devra la configurer dans Vercel
DATABASE_URL_PLACEHOLDER="postgresql://postgres:[PASSWORD]@db.obrijgptqztacolemsbk.supabase.co:5432/postgres"

# ==============================================
# 3. CRÉATION .env.production OPTIMISÉ
# ==============================================
echo -e "${YELLOW}📄 Création du fichier .env.production optimisé...${NC}"

cat > "$BACKEND_DIR/.env.production" << EOF
# ==============================================
# CONFIGURATION PRODUCTION - LUNEO
# Généré automatiquement le $(date +"%Y-%m-%d %H:%M:%S")
# ==============================================

# Environment
NODE_ENV=production
PORT=3000
API_PREFIX=/api
FRONTEND_URL=https://app.luneo.app
CORS_ORIGIN=https://app.luneo.app,https://luneo.app,https://www.luneo.app

# Database (Supabase Production)
# ⚠️ REMPLACER [PASSWORD] par le vrai mot de passe Supabase
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.obrijgptqztacolemsbk.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# Redis (Upstash recommandé pour Vercel)
# ⚠️ CONFIGURER Upstash: https://console.upstash.com
REDIS_URL="rediss://default:[TOKEN]@[ENDPOINT].upstash.io:6380"

# JWT (Générés automatiquement)
JWT_SECRET="$JWT_SECRET"
JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth
GOOGLE_CLIENT_ID=212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GITHUB_CLIENT_ID=Ov23liJmVOHyn8tfxgLi
GITHUB_CLIENT_SECRET=81bbea63bfc5651e048e5e7f62f69c5d4aad55f9

# Stripe (Production Live)
STRIPE_SECRET_KEY=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
STRIPE_WEBHOOK_SECRET=whsec_rgKvTaCDRSLV6Iv6yrF8fNBh9c2II3uu
STRIPE_PRICE_PRO=price_1RvB1uKG9MsM6fdSnrGm2qIo
STRIPE_PRICE_BUSINESS=price_1RvB1uKG9MsM6fdS[VERIFY]
STRIPE_PRICE_ENTERPRISE=price_1SH7TMKG9MsM6fdSx4pebEXZ
STRIPE_SUCCESS_URL=https://app.luneo.app/dashboard/billing/success
STRIPE_CANCEL_URL=https://app.luneo.app/dashboard/billing/cancel

# Cloudinary
CLOUDINARY_CLOUD_NAME=deh4aokbx
CLOUDINARY_API_KEY=541766291559917
CLOUDINARY_API_SECRET=s0yc_QR4w9IsM6_HRq2hM5SDnfI

# AI Providers
# ⚠️ CONFIGURER votre clé OpenAI
OPENAI_API_KEY=""
REPLICATE_API_TOKEN=""

# SendGrid (Déjà configuré)
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

# Email Templates
EMAIL_TEMPLATE_WELCOME=d-welcome-template-id
EMAIL_TEMPLATE_PASSWORD_RESET=d-password-reset-template-id
EMAIL_TEMPLATE_EMAIL_CONFIRMATION=d-email-confirmation-template-id
EMAIL_TEMPLATE_INVOICE=d-invoice-template-id
EMAIL_TEMPLATE_NEWSLETTER=d-newsletter-template-id
EMAIL_TEMPLATE_ORDER_CONFIRMATION=d-order-confirmation-template-id
EMAIL_TEMPLATE_PRODUCTION_READY=d-production-ready-template-id

# Monitoring
# ⚠️ CONFIGURER Sentry si nécessaire
SENTRY_DSN=""
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Security
MASTER_ENCRYPTION_KEY="$MASTER_ENCRYPTION_KEY"

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# Performance
PRISMA_CONNECTION_POOL_SIZE=10
PRISMA_QUERY_TIMEOUT=30000
REDIS_CONNECTION_POOL_SIZE=5
REDIS_COMMAND_TIMEOUT=5000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
ENABLE_REQUEST_LOGGING=true

# Webhooks
WEBHOOK_TIMEOUT=30000
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=5000

# BullMQ
BULLMQ_REDIS_URL="\${REDIS_URL}"
BULLMQ_CONCURRENCY=5
BULLMQ_MAX_RETRIES=3
BULLMQ_RETRY_DELAY=5000
EOF

echo -e "${GREEN}✅ Fichier .env.production créé${NC}"
echo ""

# ==============================================
# 4. VALIDATION ET BUILD
# ==============================================
echo -e "${YELLOW}🔍 Validation Prisma...${NC}"
npx prisma validate
echo -e "${GREEN}✅ Schema Prisma valide${NC}"

echo -e "${YELLOW}⚙️  Génération Prisma client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Client Prisma généré${NC}"

echo -e "${YELLOW}🔨 Build de l'application...${NC}"
npm run build
echo -e "${GREEN}✅ Build réussi${NC}"

echo ""

# ==============================================
# 5. CONFIGURATION VERCEL
# ==============================================
echo -e "${YELLOW}🔧 Configuration des variables Vercel...${NC}"

if vercel whoami > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connecté à Vercel: $(vercel whoami)${NC}"
    
    # Fonction pour ajouter/mettre à jour une variable
    add_vercel_env() {
        local key=$1
        local value=$2
        
        if [ -z "$value" ] || [[ "$value" == *"["* ]] || [[ "$value" == *"PASSWORD"* ]] || [[ "$value" == *"TOKEN"* ]]; then
            echo -e "${YELLOW}⚠️  Variable $key nécessite une configuration manuelle${NC}"
            return
        fi
        
        echo -e "${BLUE}📝 Configuration: $key${NC}"
        echo "$value" | vercel env add "$key" production --yes 2>/dev/null || {
            # Si la variable existe, la mettre à jour
            echo "$value" | vercel env rm "$key" production --yes 2>/dev/null || true
            echo "$value" | vercel env add "$key" production --yes
        }
    }
    
    # Charger les variables depuis .env.production
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # Ignorer les commentaires et lignes vides
        [[ "$key" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${key// }" ]] && continue
        
        # Nettoyer
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | sed 's/^"//;s/"$//' | xargs)
        
        # Ignorer les variables vides ou avec placeholders
        [ -z "$value" ] && continue
        
        # Configurer les variables critiques
        case "$key" in
            JWT_SECRET|JWT_REFRESH_SECRET|MASTER_ENCRYPTION_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|SENDGRID_API_KEY|CLOUDINARY_API_SECRET)
                add_vercel_env "$key" "$value"
                ;;
        esac
    done < .env.production
    
    echo -e "${GREEN}✅ Variables Vercel configurées${NC}"
else
    echo -e "${YELLOW}⚠️  Non connecté à Vercel${NC}"
    echo -e "${YELLOW}   Exécutez: vercel login${NC}"
fi

echo ""

# ==============================================
# 6. DÉPLOIEMENT
# ==============================================
echo -e "${YELLOW}🚀 Déploiement sur Vercel...${NC}"

if vercel whoami > /dev/null 2>&1; then
    vercel --prod --yes
    echo -e "${GREEN}✅ Déploiement lancé!${NC}"
    echo ""
    echo -e "${YELLOW}📋 IMPORTANT:${NC}"
    echo "   1. Vérifiez DATABASE_URL dans Vercel Dashboard"
    echo "   2. Configurez REDIS_URL (Upstash recommandé)"
    echo "   3. Ajoutez OPENAI_API_KEY si nécessaire"
    echo "   4. Surveillez le déploiement: https://vercel.com/luneos-projects/backend"
else
    echo -e "${YELLOW}⚠️  Connexion Vercel requise pour déployer${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Configuration production terminée!${NC}"



















