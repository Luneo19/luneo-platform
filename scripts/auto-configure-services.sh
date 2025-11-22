#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SCRIPT DE CONFIGURATION AUTOMATIQUE DES SERVICES EXTERNES
# Pour Luneo Platform - Configuration complète
# ═══════════════════════════════════════════════════════════════

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="apps/frontend"
ENV_FILE="${FRONTEND_DIR}/.env.local"
ENV_EXAMPLE="${FRONTEND_DIR}/.env.example"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  CONFIGURATION AUTOMATIQUE DES SERVICES EXTERNES          ║${NC}"
echo -e "${CYAN}║  Luneo Platform - Production Ready                        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Fonction pour vérifier si une commande existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Vérifier les prérequis
echo -e "${BLUE}🔍 Vérification des prérequis...${NC}"
if ! command_exists node; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi
if ! command_exists npm; then
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Prérequis OK${NC}"
echo ""

# Créer .env.local si n'existe pas
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}📝 Création du fichier .env.local...${NC}"
    touch "$ENV_FILE"
fi

# Fonction pour lire une variable d'environnement
read_env_var() {
    local var_name=$1
    local current_value=$(grep "^${var_name}=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2- | tr -d '"' || echo "")
    echo "$current_value"
}

# Fonction pour écrire une variable d'environnement
write_env_var() {
    local var_name=$1
    local var_value=$2
    
    # Supprimer la ligne existante si elle existe
    sed -i.bak "/^${var_name}=/d" "$ENV_FILE" 2>/dev/null || true
    
    # Ajouter la nouvelle ligne
    echo "${var_name}=\"${var_value}\"" >> "$ENV_FILE"
}

# Fonction pour demander une valeur à l'utilisateur
ask_for_value() {
    local var_name=$1
    local description=$2
    local current_value=$3
    local is_secret=${4:-false}
    
    if [ -n "$current_value" ]; then
        if [ "$is_secret" = true ]; then
            echo -e "${CYAN}${description}${NC} (actuel: ${GREEN}***${NC})"
        else
            echo -e "${CYAN}${description}${NC} (actuel: ${GREEN}${current_value}${NC})"
        fi
        read -p "Conserver cette valeur? (O/n): " keep
        if [ "$keep" != "n" ] && [ "$keep" != "N" ]; then
            echo "$current_value"
            return
        fi
    fi
    
    if [ "$is_secret" = true ]; then
        read -sp "${CYAN}${description}: ${NC}" value
        echo ""
    else
        read -p "${CYAN}${description}: ${NC}" value
    fi
    
    echo "$value"
}

# ═══════════════════════════════════════════════════════════════
# 1. UPSTASH REDIS
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  1. CONFIGURATION UPSTASH REDIS                              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

current_redis_url=$(read_env_var "UPSTASH_REDIS_REST_URL")
current_redis_token=$(read_env_var "UPSTASH_REDIS_REST_TOKEN")

if [ -z "$current_redis_url" ] || [ -z "$current_redis_token" ]; then
    echo -e "${YELLOW}⚠️  Upstash Redis n'est pas configuré${NC}"
    echo ""
    echo -e "${CYAN}📋 Instructions:${NC}"
    echo "1. Créer un compte sur https://upstash.com"
    echo "2. Créer une nouvelle database Redis"
    echo "3. Choisir la région Europe de l'Ouest"
    echo "4. Copier l'URL REST et le Token"
    echo ""
    
    redis_url=$(ask_for_value "UPSTASH_REDIS_REST_URL" "URL REST Upstash Redis (ex: https://xxx.upstash.io)" "$current_redis_url")
    redis_token=$(ask_for_value "UPSTASH_REDIS_REST_TOKEN" "Token Upstash Redis" "$current_redis_token" true)
    
    if [ -n "$redis_url" ] && [ -n "$redis_token" ]; then
        write_env_var "UPSTASH_REDIS_REST_URL" "$redis_url"
        write_env_var "UPSTASH_REDIS_REST_TOKEN" "$redis_token"
        echo -e "${GREEN}✅ Upstash Redis configuré${NC}"
    else
        echo -e "${YELLOW}⚠️  Upstash Redis non configuré (sera ignoré)${NC}"
    fi
else
    echo -e "${GREEN}✅ Upstash Redis déjà configuré${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 2. SENTRY
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  2. CONFIGURATION SENTRY                                    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

current_sentry_dsn=$(read_env_var "NEXT_PUBLIC_SENTRY_DSN")

if [ -z "$current_sentry_dsn" ]; then
    echo -e "${YELLOW}⚠️  Sentry n'est pas configuré${NC}"
    echo ""
    echo -e "${CYAN}📋 Instructions:${NC}"
    echo "1. Créer un compte sur https://sentry.io"
    echo "2. Créer un nouveau projet Next.js"
    echo "3. Copier le DSN"
    echo ""
    
    sentry_dsn=$(ask_for_value "NEXT_PUBLIC_SENTRY_DSN" "DSN Sentry (ex: https://xxx@sentry.io/xxx)" "$current_sentry_dsn")
    
    if [ -n "$sentry_dsn" ]; then
        write_env_var "NEXT_PUBLIC_SENTRY_DSN" "$sentry_dsn"
        echo -e "${GREEN}✅ Sentry configuré${NC}"
    else
        echo -e "${YELLOW}⚠️  Sentry non configuré (sera ignoré)${NC}"
    fi
else
    echo -e "${GREEN}✅ Sentry déjà configuré${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 3. CLOUDINARY
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  3. CONFIGURATION CLOUDINARY                                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

current_cloud_name=$(read_env_var "CLOUDINARY_CLOUD_NAME")
current_cloud_key=$(read_env_var "CLOUDINARY_API_KEY")
current_cloud_secret=$(read_env_var "CLOUDINARY_API_SECRET")

if [ -z "$current_cloud_name" ] || [ -z "$current_cloud_key" ] || [ -z "$current_cloud_secret" ]; then
    echo -e "${YELLOW}⚠️  Cloudinary n'est pas complètement configuré${NC}"
    echo ""
    echo -e "${CYAN}📋 Instructions:${NC}"
    echo "1. Vérifier votre compte sur https://cloudinary.com"
    echo "2. Aller dans Settings → Security"
    echo "3. Copier Cloud Name, API Key et API Secret"
    echo ""
    
    cloud_name=$(ask_for_value "CLOUDINARY_CLOUD_NAME" "Cloud Name Cloudinary" "$current_cloud_name")
    cloud_key=$(ask_for_value "CLOUDINARY_API_KEY" "API Key Cloudinary" "$current_cloud_key")
    cloud_secret=$(ask_for_value "CLOUDINARY_API_SECRET" "API Secret Cloudinary" "$current_cloud_secret" true)
    
    if [ -n "$cloud_name" ] && [ -n "$cloud_key" ] && [ -n "$cloud_secret" ]; then
        write_env_var "CLOUDINARY_CLOUD_NAME" "$cloud_name"
        write_env_var "CLOUDINARY_API_KEY" "$cloud_key"
        write_env_var "CLOUDINARY_API_SECRET" "$cloud_secret"
        echo -e "${GREEN}✅ Cloudinary configuré${NC}"
    else
        echo -e "${YELLOW}⚠️  Cloudinary non configuré (sera ignoré)${NC}"
    fi
else
    echo -e "${GREEN}✅ Cloudinary déjà configuré${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 4. SENDGRID
# ═══════════════════════════════════════════════════════════════

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  4. CONFIGURATION SENDGRID                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

current_sendgrid_key=$(read_env_var "SENDGRID_API_KEY")

if [ -z "$current_sendgrid_key" ]; then
    echo -e "${YELLOW}⚠️  SendGrid n'est pas configuré${NC}"
    echo ""
    echo -e "${CYAN}📋 Instructions:${NC}"
    echo "1. Vérifier votre compte sur https://sendgrid.com"
    echo "2. Aller dans Settings → API Keys"
    echo "3. Créer une nouvelle API Key avec permissions 'Mail Send'"
    echo "4. Copier l'API Key (ne sera affichée qu'une fois!)"
    echo ""
    
    sendgrid_key=$(ask_for_value "SENDGRID_API_KEY" "API Key SendGrid (ex: SG.xxx)" "$current_sendgrid_key" true)
    
    if [ -n "$sendgrid_key" ]; then
        write_env_var "SENDGRID_API_KEY" "$sendgrid_key"
        echo -e "${GREEN}✅ SendGrid configuré${NC}"
    else
        echo -e "${YELLOW}⚠️  SendGrid non configuré (sera ignoré)${NC}"
    fi
else
    echo -e "${GREEN}✅ SendGrid déjà configuré${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# RÉSUMÉ FINAL
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  RÉSUMÉ DE LA CONFIGURATION                                  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier chaque service
services_configured=0
services_total=4

if [ -n "$(read_env_var "UPSTASH_REDIS_REST_URL")" ] && [ -n "$(read_env_var "UPSTASH_REDIS_REST_TOKEN")" ]; then
    echo -e "${GREEN}✅ Upstash Redis${NC}"
    services_configured=$((services_configured + 1))
else
    echo -e "${RED}❌ Upstash Redis${NC}"
fi

if [ -n "$(read_env_var "NEXT_PUBLIC_SENTRY_DSN")" ]; then
    echo -e "${GREEN}✅ Sentry${NC}"
    services_configured=$((services_configured + 1))
else
    echo -e "${RED}❌ Sentry${NC}"
fi

if [ -n "$(read_env_var "CLOUDINARY_CLOUD_NAME")" ] && [ -n "$(read_env_var "CLOUDINARY_API_KEY")" ] && [ -n "$(read_env_var "CLOUDINARY_API_SECRET")" ]; then
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

echo ""
echo -e "${CYAN}Configuration: ${services_configured}/${services_total} services${NC}"
echo ""

# Instructions pour Vercel
if [ $services_configured -gt 0 ]; then
    echo -e "${BLUE}📋 PROCHAINES ÉTAPES:${NC}"
    echo ""
    echo "1. Copier les variables depuis ${ENV_FILE} vers Vercel:"
    echo "   https://vercel.com/luneos-projects/frontend/settings/environment-variables"
    echo ""
    echo "2. Ajouter toutes les variables configurées:"
    grep -E "^(UPSTASH_REDIS_REST_URL|UPSTASH_REDIS_REST_TOKEN|NEXT_PUBLIC_SENTRY_DSN|CLOUDINARY_CLOUD_NAME|CLOUDINARY_API_KEY|CLOUDINARY_API_SECRET|SENDGRID_API_KEY)=" "$ENV_FILE" 2>/dev/null || true
    echo ""
    echo "3. Sélectionner: Production, Preview, Development"
    echo ""
    echo "4. Redéployer l'application"
    echo ""
fi

# Nettoyer le fichier de backup
rm -f "${ENV_FILE}.bak" 2>/dev/null || true

echo -e "${GREEN}✅ Configuration terminée!${NC}"
echo ""

