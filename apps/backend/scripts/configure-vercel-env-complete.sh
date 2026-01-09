#!/bin/bash

# ==============================================
# CONFIGURATION COMPLÈTE VERCEL ENV
# Configure toutes les variables nécessaires
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
echo -e "${BLUE}║  CONFIGURATION VERCEL ENV COMPLÈTE - LUNEO               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$BACKEND_DIR"

# Vérifier connexion Vercel
if ! vercel whoami > /dev/null 2>&1; then
    echo -e "${RED}❌ Non connecté à Vercel${NC}"
    echo -e "${YELLOW}   Exécutez: vercel login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Connecté à Vercel: $(vercel whoami)${NC}"
echo ""

# Fonction pour mettre à jour une variable
update_env() {
    local key=$1
    local value=$2
    local env=${3:-production}
    
    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠️  Variable $key vide (ignorée)${NC}"
        return
    fi
    
    echo -e "${BLUE}📝 Configuration: $key (${env})${NC}"
    
    # Supprimer l'ancienne si elle existe
    echo "y" | vercel env rm "$key" "$env" --yes 2>/dev/null || true
    
    # Ajouter la nouvelle
    echo "$value" | vercel env add "$key" "$env" --yes
    
    echo -e "${GREEN}✅ $key configuré${NC}"
}

# Générer les secrets
echo -e "${YELLOW}🔐 Génération des secrets...${NC}"
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n' | head -c 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n' | head -c 64)
MASTER_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo -e "${GREEN}✅ Secrets générés${NC}"
echo ""

# Configuration des variables critiques
echo -e "${YELLOW}📋 Configuration des variables critiques...${NC}"

# JWT Secrets
update_env "JWT_SECRET" "$JWT_SECRET" "production"
update_env "JWT_REFRESH_SECRET" "$JWT_REFRESH_SECRET" "production"

# Master Encryption Key
update_env "MASTER_ENCRYPTION_KEY" "$MASTER_ENCRYPTION_KEY" "production"

# Stripe (depuis variables d'environnement)
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${YELLOW}⚠️  STRIPE_SECRET_KEY non définie, nécessite configuration manuelle${NC}"
else
    update_env "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" "production"
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo -e "${YELLOW}⚠️  STRIPE_WEBHOOK_SECRET non définie, nécessite configuration manuelle${NC}"
else
    update_env "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET" "production"
fi

# SendGrid
if [ -z "$SENDGRID_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  SENDGRID_API_KEY non définie, nécessite configuration manuelle${NC}"
else
    update_env "SENDGRID_API_KEY" "$SENDGRID_API_KEY" "production"
fi

# Cloudinary
if [ -z "$CLOUDINARY_CLOUD_NAME" ]; then
    echo -e "${YELLOW}⚠️  CLOUDINARY_CLOUD_NAME non définie, nécessite configuration manuelle${NC}"
else
    update_env "CLOUDINARY_CLOUD_NAME" "$CLOUDINARY_CLOUD_NAME" "production"
fi

if [ -z "$CLOUDINARY_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  CLOUDINARY_API_KEY non définie, nécessite configuration manuelle${NC}"
else
    update_env "CLOUDINARY_API_KEY" "$CLOUDINARY_API_KEY" "production"
fi

if [ -z "$CLOUDINARY_API_SECRET" ]; then
    echo -e "${YELLOW}⚠️  CLOUDINARY_API_SECRET non définie, nécessite configuration manuelle${NC}"
else
    update_env "CLOUDINARY_API_SECRET" "$CLOUDINARY_API_SECRET" "production"
fi

# OAuth
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo -e "${YELLOW}⚠️  GOOGLE_CLIENT_ID non définie, nécessite configuration manuelle${NC}"
else
    update_env "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID" "production"
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo -e "${YELLOW}⚠️  GOOGLE_CLIENT_SECRET non définie, nécessite configuration manuelle${NC}"
else
    update_env "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET" "production"
fi

if [ -z "$GITHUB_CLIENT_ID" ]; then
    echo -e "${YELLOW}⚠️  GITHUB_CLIENT_ID non définie, nécessite configuration manuelle${NC}"
else
    update_env "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID" "production"
fi

if [ -z "$GITHUB_CLIENT_SECRET" ]; then
    echo -e "${YELLOW}⚠️  GITHUB_CLIENT_SECRET non définie, nécessite configuration manuelle${NC}"
else
    update_env "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET" "production"
fi

# Stripe Prices
update_env "STRIPE_PRICE_PRO" "price_1RvB1uKG9MsM6fdSnrGm2qIo" "production"
update_env "STRIPE_PRICE_ENTERPRISE" "price_1SH7TMKG9MsM6fdSx4pebEXZ" "production"

# App Config
update_env "NODE_ENV" "production" "production"
update_env "API_PREFIX" "/api" "production"
update_env "FRONTEND_URL" "https://app.luneo.app" "production"
update_env "CORS_ORIGIN" "https://app.luneo.app,https://luneo.app,https://www.luneo.app" "production"

# SendGrid Domain Config
update_env "SENDGRID_DOMAIN" "luneo.app" "production"
update_env "SENDGRID_FROM_NAME" "Luneo" "production"
update_env "SENDGRID_FROM_EMAIL" "no-reply@luneo.app" "production"
update_env "SENDGRID_REPLY_TO" "support@luneo.app" "production"
update_env "SMTP_HOST" "smtp.sendgrid.net" "production"
update_env "SMTP_PORT" "587" "production"
update_env "SMTP_SECURE" "false" "production"
update_env "SMTP_FROM" "Luneo <no-reply@luneo.app>" "production"
update_env "DOMAIN_VERIFIED" "true" "production"

# Rate Limiting
update_env "RATE_LIMIT_TTL" "60" "production"
update_env "RATE_LIMIT_LIMIT" "100" "production"

echo ""
echo -e "${YELLOW}⚠️  Variables nécessitant configuration manuelle:${NC}"
echo "   - DATABASE_URL (Supabase - récupérer depuis dashboard)"
echo "   - REDIS_URL (Upstash recommandé)"
echo "   - OPENAI_API_KEY (optionnel)"
echo "   - SENTRY_DSN (optionnel)"
echo ""
echo -e "${GREEN}✅ Variables critiques configurées!${NC}"
echo ""
echo -e "${YELLOW}📋 Prochaine étape:${NC}"
echo "   1. Configurer DATABASE_URL dans Vercel Dashboard"
echo "   2. Exécuter: vercel --prod"
echo ""

































