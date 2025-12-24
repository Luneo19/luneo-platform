#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION AUTOMATIQUE - MODE NON-INTERACTIF
# Configure automatiquement tous les services disponibles
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
echo -e "${CYAN}║  CONFIGURATION AUTOMATIQUE DES SERVICES                    ║${NC}"
echo -e "${CYAN}║  Mode Automatique - Non-Interactif                          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Créer .env.local si n'existe pas
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}📝 Création du fichier .env.local...${NC}"
    touch "$ENV_FILE"
fi

# Fonction pour lire une variable
read_env_var() {
    grep "^${1}=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2- | tr -d '"' || echo ""
}

# Fonction pour écrire une variable
write_env_var() {
    local var_name=$1
    local var_value=$2
    
    # Supprimer la ligne existante
    sed -i.bak "/^${var_name}=/d" "$ENV_FILE" 2>/dev/null || true
    
    # Ajouter la nouvelle ligne
    echo "${var_name}=\"${var_value}\"" >> "$ENV_FILE"
}

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION AUTOMATIQUE DES SERVICES DISPONIBLES
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}🔧 Configuration automatique en cours...${NC}"
echo ""

# 1. CLOUDINARY (Déjà configuré dans VERCEL_ENV_CHECKLIST)
echo -e "${BLUE}1. Cloudinary...${NC}"
CLOUDINARY_CLOUD_NAME="deh4aokbx"
CLOUDINARY_API_KEY="541766291559917"
CLOUDINARY_API_SECRET="s0yc_QR4w9IsM6_HRq2hM5SDnfI"

write_env_var "CLOUDINARY_CLOUD_NAME" "$CLOUDINARY_CLOUD_NAME"
write_env_var "CLOUDINARY_API_KEY" "$CLOUDINARY_API_KEY"
write_env_var "CLOUDINARY_API_SECRET" "$CLOUDINARY_API_SECRET"
echo -e "${GREEN}   ✅ Configuré${NC}"
echo ""

# 2. SENDGRID (Déjà configuré)
echo -e "${BLUE}2. SendGrid...${NC}"
SENDGRID_API_KEY="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"

write_env_var "SENDGRID_API_KEY" "$SENDGRID_API_KEY"
echo -e "${GREEN}   ✅ Configuré${NC}"
echo ""

# 3. UPSTASH REDIS (À configurer manuellement)
echo -e "${BLUE}3. Upstash Redis...${NC}"
current_redis_url=$(read_env_var "UPSTASH_REDIS_REST_URL")
current_redis_token=$(read_env_var "UPSTASH_REDIS_REST_TOKEN")

if [ -z "$current_redis_url" ] || [ -z "$current_redis_token" ]; then
    echo -e "${YELLOW}   ⚠️  Non configuré${NC}"
    echo -e "${YELLOW}   📋 Pour configurer:${NC}"
    echo -e "${YELLOW}      1. Créer compte: https://upstash.com${NC}"
    echo -e "${YELLOW}      2. Créer database Redis${NC}"
    echo -e "${YELLOW}      3. Exécuter:${NC}"
    echo -e "${CYAN}         echo 'UPSTASH_REDIS_REST_URL=\"https://xxx.upstash.io\"' >> ${ENV_FILE}${NC}"
    echo -e "${CYAN}         echo 'UPSTASH_REDIS_REST_TOKEN=\"xxx\"' >> ${ENV_FILE}${NC}"
else
    echo -e "${GREEN}   ✅ Déjà configuré${NC}"
fi
echo ""

# 4. SENTRY (À configurer manuellement)
echo -e "${BLUE}4. Sentry...${NC}"
current_sentry_dsn=$(read_env_var "NEXT_PUBLIC_SENTRY_DSN")

if [ -z "$current_sentry_dsn" ]; then
    echo -e "${YELLOW}   ⚠️  Non configuré${NC}"
    echo -e "${YELLOW}   📋 Pour configurer:${NC}"
    echo -e "${YELLOW}      1. Créer compte: https://sentry.io${NC}"
    echo -e "${YELLOW}      2. Créer projet Next.js${NC}"
    echo -e "${YELLOW}      3. Exécuter:${NC}"
    echo -e "${CYAN}         echo 'NEXT_PUBLIC_SENTRY_DSN=\"https://xxx@sentry.io/xxx\"' >> ${ENV_FILE}${NC}"
else
    echo -e "${GREEN}   ✅ Déjà configuré${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# RÉSUMÉ
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  RÉSUMÉ                                                    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

services_configured=0
services_total=4

if [ -n "$(read_env_var "CLOUDINARY_CLOUD_NAME")" ]; then
    echo -e "${GREEN}✅ Cloudinary${NC}"
    services_configured=$((services_configured + 1))
else
    echo -e "${RED}❌ Cloudinary${NC}"
fi

if [ -n "$(read_env_var "SENDGRID_API_KEY")" ]; then
    echo -e "${GREEN}✅ SendGrid${NC}"
    services_configured=$((services_configured + 1))
else
    echo -e "${RED}❌ SendGrid${NC}"
fi

if [ -n "$(read_env_var "UPSTASH_REDIS_REST_URL")" ] && [ -n "$(read_env_var "UPSTASH_REDIS_REST_TOKEN")" ]; then
    echo -e "${GREEN}✅ Upstash Redis${NC}"
    services_configured=$((services_configured + 1))
else
    echo -e "${YELLOW}⚠️  Upstash Redis (à configurer)${NC}"
fi

if [ -n "$(read_env_var "NEXT_PUBLIC_SENTRY_DSN")" ]; then
    echo -e "${GREEN}✅ Sentry${NC}"
    services_configured=$((services_configured + 1))
else
    echo -e "${YELLOW}⚠️  Sentry (à configurer)${NC}"
fi

echo ""
echo -e "${CYAN}Configuration: ${services_configured}/${services_total} services${NC}"
echo ""

# Nettoyer le fichier de backup
rm -f "${ENV_FILE}.bak" 2>/dev/null || true

# Vérifier la configuration
echo -e "${BLUE}🔍 Vérification de la configuration...${NC}"
if command -v node >/dev/null 2>&1; then
    node scripts/check-services-config.js
else
    echo -e "${YELLOW}⚠️  Node.js non trouvé, impossible de vérifier${NC}"
fi

echo ""
echo -e "${GREEN}✅ Configuration automatique terminée!${NC}"
echo ""
echo -e "${BLUE}📋 Fichier de configuration: ${ENV_FILE}${NC}"
echo ""

