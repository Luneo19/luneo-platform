#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# VÉRIFICATION COMPLÈTE DE TOUS LES SERVICES
# Vérifie dans .env.local, Vercel, et fichiers de config
# ═══════════════════════════════════════════════════════════════

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

FRONTEND_DIR="apps/frontend"
ENV_FILE="${FRONTEND_DIR}/.env.local"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  VÉRIFICATION COMPLÈTE DES SERVICES                         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Fonction pour lire une variable depuis .env.local
read_env_var() {
    if [ -f "$ENV_FILE" ]; then
        grep "^${1}=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2- | tr -d '"' || echo ""
    else
        echo ""
    fi
}

# Fonction pour vérifier dans les fichiers de config
check_in_files() {
    local var_name=$1
    local found=false
    
    # Vérifier dans sentry.config.js (backend)
    if grep -q "$var_name" apps/backend/sentry.config.js 2>/dev/null; then
        found=true
    fi
    
    # Vérifier dans VERCEL_ENV_CHECKLIST.md
    if grep -qi "$var_name" VERCEL_ENV_CHECKLIST.md 2>/dev/null; then
        found=true
    fi
    
    echo "$found"
}

echo -e "${BLUE}1. Vérification Cloudinary...${NC}"
cloud_name=$(read_env_var "CLOUDINARY_CLOUD_NAME")
cloud_key=$(read_env_var "CLOUDINARY_API_KEY")
cloud_secret=$(read_env_var "CLOUDINARY_API_SECRET")

if [ -n "$cloud_name" ] && [ -n "$cloud_key" ] && [ -n "$cloud_secret" ]; then
    echo -e "${GREEN}   ✅ Configuré dans .env.local${NC}"
else
    echo -e "${RED}   ❌ Non configuré dans .env.local${NC}"
fi
echo ""

echo -e "${BLUE}2. Vérification SendGrid...${NC}"
sendgrid_key=$(read_env_var "SENDGRID_API_KEY")

if [ -n "$sendgrid_key" ]; then
    echo -e "${GREEN}   ✅ Configuré dans .env.local${NC}"
else
    echo -e "${RED}   ❌ Non configuré dans .env.local${NC}"
fi
echo ""

echo -e "${BLUE}3. Vérification Upstash Redis...${NC}"
redis_url=$(read_env_var "UPSTASH_REDIS_REST_URL")
redis_token=$(read_env_var "UPSTASH_REDIS_REST_TOKEN")

if [ -n "$redis_url" ] && [ -n "$redis_token" ]; then
    echo -e "${GREEN}   ✅ Configuré dans .env.local${NC}"
    echo -e "${CYAN}      URL: ${redis_url:0:30}...${NC}"
else
    echo -e "${YELLOW}   ⚠️  Non configuré dans .env.local${NC}"
    
    # Vérifier dans VERCEL_ENV_CHECKLIST.md
    if grep -qi "REDIS_URL" VERCEL_ENV_CHECKLIST.md 2>/dev/null; then
        echo -e "${YELLOW}      ℹ️  REDIS_URL trouvé dans VERCEL_ENV_CHECKLIST.md${NC}"
        echo -e "${YELLOW}      ⚠️  Note: Le code utilise UPSTASH_REDIS_REST_URL (pas REDIS_URL)${NC}"
    fi
fi
echo ""

echo -e "${BLUE}4. Vérification Sentry...${NC}"
sentry_dsn=$(read_env_var "NEXT_PUBLIC_SENTRY_DSN")

if [ -n "$sentry_dsn" ]; then
    echo -e "${GREEN}   ✅ Configuré dans .env.local${NC}"
    echo -e "${CYAN}      DSN: ${sentry_dsn:0:40}...${NC}"
else
    echo -e "${YELLOW}   ⚠️  Non configuré dans .env.local${NC}"
    
    # Vérifier dans sentry.config.js (backend)
    backend_dsn=$(grep -o 'https://[^"]*@[^"]*' apps/backend/sentry.config.js 2>/dev/null | head -1 || echo "")
    if [ -n "$backend_dsn" ]; then
        echo -e "${YELLOW}      ℹ️  DSN Sentry trouvé dans apps/backend/sentry.config.js${NC}"
        echo -e "${CYAN}         Backend DSN: ${backend_dsn:0:50}...${NC}"
        echo -e "${YELLOW}      ⚠️  Note: Le frontend nécessite NEXT_PUBLIC_SENTRY_DSN${NC}"
        echo -e "${YELLOW}      💡 Vous pouvez utiliser le même DSN ou créer un projet séparé${NC}"
    fi
fi
echo ""

# Résumé
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  RÉSUMÉ                                                    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

services_configured=0
services_total=4

if [ -n "$cloud_name" ] && [ -n "$cloud_key" ] && [ -n "$cloud_secret" ]; then
    echo -e "${GREEN}✅ Cloudinary${NC}"
    services_configured=$((services_configured + 1))
else
    echo -e "${RED}❌ Cloudinary${NC}"
fi

if [ -n "$sendgrid_key" ]; then
    echo -e "${GREEN}✅ SendGrid${NC}"
    services_configured=$((services_configured + 1))
else
    echo -e "${RED}❌ SendGrid${NC}"
fi

if [ -n "$redis_url" ] && [ -n "$redis_token" ]; then
    echo -e "${GREEN}✅ Upstash Redis${NC}"
    services_configured=$((services_configured + 1))
else
    echo -e "${YELLOW}⚠️  Upstash Redis (non configuré dans .env.local)${NC}"
fi

if [ -n "$sentry_dsn" ]; then
    echo -e "${GREEN}✅ Sentry${NC}"
    services_configured=$((services_configured + 1))
else
    echo -e "${YELLOW}⚠️  Sentry (non configuré dans .env.local)${NC}"
    if [ -n "$backend_dsn" ]; then
        echo -e "${CYAN}   ℹ️  DSN disponible dans backend, peut être réutilisé${NC}"
    fi
fi

echo ""
echo -e "${CYAN}Configuration locale: ${services_configured}/${services_total} services${NC}"
echo ""

# Suggestions
if [ $services_configured -lt $services_total ]; then
    echo -e "${YELLOW}💡 SUGGESTIONS:${NC}"
    echo ""
    
    if [ -z "$redis_url" ] || [ -z "$redis_token" ]; then
        echo -e "${YELLOW}Pour Upstash Redis:${NC}"
        echo -e "${CYAN}  1. Créer compte: https://upstash.com${NC}"
        echo -e "${CYAN}  2. Créer database Redis${NC}"
        echo -e "${CYAN}  3. Ajouter dans .env.local:${NC}"
        echo -e "${CYAN}     UPSTASH_REDIS_REST_URL=\"https://xxx.upstash.io\"${NC}"
        echo -e "${CYAN}     UPSTASH_REDIS_REST_TOKEN=\"xxx\"${NC}"
        echo ""
    fi
    
    if [ -z "$sentry_dsn" ]; then
        echo -e "${YELLOW}Pour Sentry:${NC}"
        if [ -n "$backend_dsn" ]; then
            echo -e "${CYAN}  Option 1: Réutiliser le DSN backend${NC}"
            echo -e "${CYAN}    echo 'NEXT_PUBLIC_SENTRY_DSN=\"${backend_dsn}\"' >> ${ENV_FILE}${NC}"
            echo ""
            echo -e "${CYAN}  Option 2: Créer un nouveau projet frontend${NC}"
        else
            echo -e "${CYAN}  1. Créer compte: https://sentry.io${NC}"
            echo -e "${CYAN}  2. Créer projet Next.js${NC}"
        fi
        echo -e "${CYAN}  3. Ajouter dans .env.local:${NC}"
        echo -e "${CYAN}     NEXT_PUBLIC_SENTRY_DSN=\"https://xxx@sentry.io/xxx\"${NC}"
        echo ""
    fi
fi

echo ""
echo -e "${BLUE}📋 Note: Les variables peuvent être configurées sur Vercel${NC}"
echo -e "${BLUE}   même si elles ne sont pas dans .env.local${NC}"
echo ""

