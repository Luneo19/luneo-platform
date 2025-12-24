#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION AUTOMATIQUE VIA TERMINAL
# Configure tous les services externes automatiquement
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
echo -e "${CYAN}║  Via Terminal - Mode Automatique                           ║${NC}"
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
# 1. CLOUDINARY (Déjà configuré dans VERCEL_ENV_CHECKLIST)
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}1. Configuration Cloudinary...${NC}"

CLOUDINARY_CLOUD_NAME="deh4aokbx"
CLOUDINARY_API_KEY="541766291559917"
CLOUDINARY_API_SECRET="s0yc_QR4w9IsM6_HRq2hM5SDnfI"

write_env_var "CLOUDINARY_CLOUD_NAME" "$CLOUDINARY_CLOUD_NAME"
write_env_var "CLOUDINARY_API_KEY" "$CLOUDINARY_API_KEY"
write_env_var "CLOUDINARY_API_SECRET" "$CLOUDINARY_API_SECRET"

echo -e "${GREEN}✅ Cloudinary configuré${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# 2. SENDGRID (Déjà configuré)
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}2. Configuration SendGrid...${NC}"

SENDGRID_API_KEY="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"

write_env_var "SENDGRID_API_KEY" "$SENDGRID_API_KEY"

echo -e "${GREEN}✅ SendGrid configuré${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# 3. UPSTASH REDIS (À configurer)
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}3. Configuration Upstash Redis...${NC}"
echo -e "${YELLOW}📋 Instructions:${NC}"
echo "1. Créer un compte sur https://upstash.com (gratuit)"
echo "2. Créer une nouvelle database Redis"
echo "3. Choisir région: Europe de l'Ouest"
echo "4. Copier l'URL REST et le Token"
echo ""

read -p "UPSTASH_REDIS_REST_URL (ou appuyez sur Entrée pour ignorer): " redis_url
if [ -n "$redis_url" ]; then
    read -sp "UPSTASH_REDIS_REST_TOKEN: " redis_token
    echo ""
    
    if [ -n "$redis_token" ]; then
        write_env_var "UPSTASH_REDIS_REST_URL" "$redis_url"
        write_env_var "UPSTASH_REDIS_REST_TOKEN" "$redis_token"
        echo -e "${GREEN}✅ Upstash Redis configuré${NC}"
    else
        echo -e "${YELLOW}⚠️  Upstash Redis non configuré${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Upstash Redis ignoré${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# 4. SENTRY (À configurer)
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}4. Configuration Sentry...${NC}"
echo -e "${YELLOW}📋 Instructions:${NC}"
echo "1. Créer un compte sur https://sentry.io (gratuit)"
echo "2. Créer un nouveau projet Next.js"
echo "3. Copier le DSN"
echo ""

read -p "NEXT_PUBLIC_SENTRY_DSN (ou appuyez sur Entrée pour ignorer): " sentry_dsn
if [ -n "$sentry_dsn" ]; then
    write_env_var "NEXT_PUBLIC_SENTRY_DSN" "$sentry_dsn"
    echo -e "${GREEN}✅ Sentry configuré${NC}"
else
    echo -e "${YELLOW}⚠️  Sentry ignoré${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# RÉSUMÉ
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  RÉSUMÉ DE LA CONFIGURATION                                ║${NC}"
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
    echo -e "${YELLOW}⚠️  Upstash Redis (optionnel)${NC}"
fi

if [ -n "$(read_env_var "NEXT_PUBLIC_SENTRY_DSN")" ]; then
    echo -e "${GREEN}✅ Sentry${NC}"
    services_configured=$((services_configured + 1))
else
    echo -e "${YELLOW}⚠️  Sentry (optionnel)${NC}"
fi

echo ""
echo -e "${CYAN}Configuration: ${services_configured}/${services_total} services${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION VERCEL (Optionnel)
# ═══════════════════════════════════════════════════════════════

if command -v node >/dev/null 2>&1 && [ -n "$VERCEL_TOKEN" ]; then
    echo -e "${BLUE}🚀 Configuration automatique sur Vercel...${NC}"
    read -p "Configurer automatiquement sur Vercel? (O/n): " configure_vercel
    
    if [ "$configure_vercel" != "n" ] && [ "$configure_vercel" != "N" ]; then
        echo ""
        node scripts/vercel-configure-services.js
    fi
else
    echo -e "${YELLOW}📋 Pour configurer sur Vercel:${NC}"
    echo "1. Exporter VERCEL_TOKEN: export VERCEL_TOKEN=\"votre_token\""
    echo "2. Exécuter: node scripts/vercel-configure-services.js"
    echo ""
    echo "Ou configurer manuellement:"
    echo "https://vercel.com/luneos-projects/frontend/settings/environment-variables"
fi

echo ""

# Nettoyer le fichier de backup
rm -f "${ENV_FILE}.bak" 2>/dev/null || true

echo -e "${GREEN}✅ Configuration terminée!${NC}"
echo ""
echo -e "${BLUE}📋 Variables configurées dans: ${ENV_FILE}${NC}"
echo ""

# Afficher les variables configurées
echo -e "${CYAN}Variables configurées:${NC}"
grep -E "^(UPSTASH_REDIS_REST_URL|UPSTASH_REDIS_REST_TOKEN|NEXT_PUBLIC_SENTRY_DSN|CLOUDINARY_CLOUD_NAME|CLOUDINARY_API_KEY|CLOUDINARY_API_SECRET|SENDGRID_API_KEY)=" "$ENV_FILE" 2>/dev/null | sed 's/=.*/=***/' || echo "Aucune"

echo ""
echo -e "${GREEN}🎉 Prêt pour 100/100!${NC}"

