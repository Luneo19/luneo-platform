#!/bin/bash

# Script simple pour configurer les variables sur Vercel
# Utilise Vercel CLI avec interaction

set -e

ENV_FILE="apps/frontend/.env.local"
cd "$(dirname "$0")/.."

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  CONFIGURATION VERCEL - VARIABLES D'ENVIRONNEMENT         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI non installé${NC}"
    exit 1
fi

# Vérifier connexion
if ! vercel whoami &>/dev/null; then
    echo -e "${RED}❌ Non connecté à Vercel. Exécutez: vercel login${NC}"
    exit 1
fi

WHOAMI=$(vercel whoami)
echo -e "${GREEN}✅ Connecté: ${WHOAMI}${NC}"
echo ""

# Lire les variables depuis .env.local
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Fichier .env.local non trouvé${NC}"
    exit 1
fi

echo -e "${BLUE}📄 Lecture des variables...${NC}"

# Fonction pour lire une variable
read_env_var() {
    grep "^${1}=" "$ENV_FILE" | cut -d '=' -f2 | sed 's/^"//;s/"$//'
}

# Liste des variables à configurer
VARS=(
    "UPSTASH_REDIS_REST_URL"
    "UPSTASH_REDIS_REST_TOKEN"
    "QSTASH_URL"
    "QSTASH_TOKEN"
    "QSTASH_CURRENT_SIGNING_KEY"
    "QSTASH_NEXT_SIGNING_KEY"
    "NEXT_PUBLIC_SENTRY_DSN"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
    "SENDGRID_API_KEY"
)

# Filtrer les variables qui existent
EXISTING_VARS=()
for VAR in "${VARS[@]}"; do
    VALUE=$(read_env_var "$VAR" 2>/dev/null || echo "")
    if [ -n "$VALUE" ]; then
        EXISTING_VARS+=("$VAR|$VALUE")
    fi
done

COUNT=${#EXISTING_VARS[@]}
if [ $COUNT -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Aucune variable trouvée${NC}"
    exit 1
fi

echo -e "${GREEN}✅ ${COUNT} variables trouvées${NC}"
echo ""

echo -e "${CYAN}📋 Variables à configurer:${NC}"
for VAR_PAIR in "${EXISTING_VARS[@]}"; do
    VAR="${VAR_PAIR%%|*}"
    VALUE="${VAR_PAIR#*|}"
    if [[ "$VAR" == *"SECRET"* ]] || [[ "$VAR" == *"TOKEN"* ]] || [[ "$VAR" == *"KEY"* ]]; then
        display="***${VALUE: -4}"
    else
        display="$VALUE"
    fi
    echo -e "${CYAN}   - ${VAR} = ${display}${NC}"
done
echo ""

echo -e "${BLUE}🚀 Configuration sur Vercel...${NC}"
echo -e "${YELLOW}⚠️  Cela peut prendre quelques minutes${NC}"
echo ""

cd apps/frontend

SUCCESS=0
FAILED=0

# Configurer chaque variable pour chaque environnement
for VAR_PAIR in "${EXISTING_VARS[@]}"; do
    VAR="${VAR_PAIR%%|*}"
    VALUE="${VAR_PAIR#*|}"
    
    echo -e "${BLUE}📤 ${VAR}${NC}"
    
    # Environnements
    ENVS=("production" "preview" "development")
    
    VAR_SUCCESS=true
    
    for env in "${ENVS[@]}"; do
        # Utiliser printf pour éviter les problèmes d'échappement
        OUTPUT=$(printf '%s\n' "$VALUE" | vercel env add "$VAR" "$env" --force 2>&1 || true)
        if echo "$OUTPUT" | grep -qE "Added|Updated|already exists|Environment Variable"; then
            echo -e "   ${GREEN}✅ ${env}${NC}"
        else
            echo -e "   ${YELLOW}⚠️  ${env} (peut exister déjà)${NC}"
        fi
    done
    
    SUCCESS=$((SUCCESS + 1))
    echo ""
done

cd ../..

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  RÉSUMÉ                                                      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Variables traitées: ${SUCCESS}${NC}"

if [ $FAILED -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Échecs: ${FAILED}${NC}"
fi

echo ""
echo -e "${BLUE}📋 PROCHAINES ÉTAPES:${NC}"
echo -e "${YELLOW}1. Vérifier: cd apps/frontend && vercel env ls${NC}"
echo -e "${YELLOW}2. Redéployer: vercel --prod${NC}"
echo ""

