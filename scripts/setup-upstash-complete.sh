#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION COMPLÈTE UPSTASH REDIS - MODE AUTOMATIQUE
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
echo -e "${CYAN}║  CONFIGURATION UPSTASH REDIS - MODE AUTOMATIQUE           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Créer .env.local si n'existe pas
if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
fi

# Fonction pour écrire une variable
write_env_var() {
    local var_name=$1
    local var_value=$2
    
    # Supprimer la ligne existante
    sed -i.bak "/^${var_name}=/d" "$ENV_FILE" 2>/dev/null || true
    
    # Ajouter la nouvelle ligne
    echo "${var_name}=\"${var_value}\"" >> "$ENV_FILE"
}

echo -e "${BLUE}📋 Instructions pour configurer Upstash Redis:${NC}"
echo ""
echo -e "${CYAN}1. Ouvrir Upstash Console:${NC}"
echo -e "${YELLOW}   👉 https://console.upstash.com${NC}"
echo ""

# Ouvrir le navigateur
if command -v open >/dev/null 2>&1; then
    echo -e "${BLUE}🌐 Ouverture de Upstash Console...${NC}"
    open "https://console.upstash.com" 2>/dev/null || true
    echo ""
fi

echo -e "${CYAN}2. Créer une database Redis:${NC}"
echo -e "${YELLOW}   - Cliquer 'Create Database'${NC}"
echo -e "${YELLOW}   - Name: luneo-production-redis${NC}"
echo -e "${YELLOW}   - Type: Regional${NC}"
echo -e "${YELLOW}   - Region: Europe (Ireland)${NC}"
echo -e "${YELLOW}   - Eviction: allkeys-lru${NC}"
echo ""

echo -e "${CYAN}3. Récupérer les credentials REST API:${NC}"
echo -e "${YELLOW}   - Dans la page de la database${NC}"
echo -e "${YELLOW}   - Onglet 'REST API'${NC}"
echo -e "${YELLOW}   - Copier 'UPSTASH_REDIS_REST_URL'${NC}"
echo -e "${YELLOW}   - Copier 'UPSTASH_REDIS_REST_TOKEN'${NC}"
echo ""

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Entrez les credentials:${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

read -p "UPSTASH_REDIS_REST_URL: " redis_url

if [ -z "$redis_url" ]; then
    echo -e "${RED}❌ URL non fournie${NC}"
    exit 1
fi

read -sp "UPSTASH_REDIS_REST_TOKEN: " redis_token
echo ""

if [ -z "$redis_token" ]; then
    echo -e "${RED}❌ Token non fourni${NC}"
    exit 1
fi

# Configurer
echo ""
echo -e "${BLUE}🔧 Configuration en cours...${NC}"

write_env_var "UPSTASH_REDIS_REST_URL" "$redis_url"
write_env_var "UPSTASH_REDIS_REST_TOKEN" "$redis_token"

# Nettoyer le fichier de backup
rm -f "${ENV_FILE}.bak" 2>/dev/null || true

echo -e "${GREEN}✅ Upstash Redis configuré!${NC}"
echo ""

# Vérifier
if command -v node >/dev/null 2>&1; then
    echo -e "${BLUE}🔍 Vérification...${NC}"
    node scripts/check-services-config.js
fi

echo ""
echo -e "${GREEN}🎉 Configuration terminée!${NC}"
echo ""
echo -e "${BLUE}📋 Prochaines étapes:${NC}"
echo -e "${YELLOW}1. Copier ces variables sur Vercel${NC}"
echo -e "${YELLOW}2. Redéployer l'application${NC}"
echo ""

