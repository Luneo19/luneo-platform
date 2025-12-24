#!/bin/bash

# Script pour configurer toutes les variables d'environnement sur Vercel
# Utilise Vercel CLI avec la syntaxe correcte

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

ENV_FILE="apps/frontend/.env.local"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  CONFIGURATION AUTOMATIQUE VERCEL                          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier que Vercel CLI est connecté
if ! vercel whoami &>/dev/null; then
    echo -e "${RED}❌ Non connecté à Vercel. Exécutez: vercel login${NC}"
    exit 1
fi

WHOAMI=$(vercel whoami)
echo -e "${GREEN}✅ Connecté à Vercel en tant que: ${WHOAMI}${NC}"
echo ""

# Vérifier que le fichier .env.local existe
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Fichier .env.local non trouvé${NC}"
    exit 1
fi

echo -e "${BLUE}📄 Lecture des variables depuis .env.local...${NC}"

# Fonction pour lire une variable depuis .env.local
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
        EXISTING_VARS+=("$VAR")
    fi
done

if [ ${#EXISTING_VARS[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Aucune variable trouvée${NC}"
    exit 1
fi

echo -e "${GREEN}✅ ${#EXISTING_VARS[@]} variables trouvées${NC}"
echo ""

echo -e "${CYAN}📋 Variables à configurer:${NC}"
for VAR in "${EXISTING_VARS[@]}"; do
    VALUE=$(read_env_var "$VAR")
    DISPLAY_VALUE="$VALUE"
    if [[ "$VAR" == *"SECRET"* ]] || [[ "$VAR" == *"TOKEN"* ]] || [[ "$VAR" == *"KEY"* ]]; then
        DISPLAY_VALUE="***${VALUE: -4}"
    fi
    echo -e "${CYAN}   - ${VAR} = ${DISPLAY_VALUE}${NC}"
done
echo ""

echo -e "${BLUE}🚀 Configuration des variables sur Vercel...${NC}"
echo -e "${YELLOW}⚠️  Cela peut prendre quelques minutes${NC}"
echo ""

cd apps/frontend

SUCCESS=0
FAILED=0

# Configurer chaque variable pour chaque environnement
for VAR in "${EXISTING_VARS[@]}"; do
    VALUE=$(read_env_var "$VAR")
    
    echo -e "${BLUE}📤 Configuration de ${VAR}...${NC}"
    
    # Pour chaque environnement
    for ENV in production preview development; do
        echo -e "   ${CYAN}→ ${ENV}${NC}"
        
        # Utiliser echo pour passer la valeur à vercel env add
        if echo "$VALUE" | vercel env add "$VAR" "$ENV" --yes 2>&1 | grep -q "Added\|Updated\|already exists"; then
            echo -e "      ${GREEN}✅${NC}"
        else
            # Vérifier si la variable existe déjà
            if vercel env ls | grep -q "^${VAR}"; then
                echo -e "      ${YELLOW}⚠️  Existe déjà${NC}"
            else
                echo -e "      ${RED}❌ Erreur${NC}"
                FAILED=$((FAILED + 1))
                continue
            fi
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
echo -e "${GREEN}✅ Succès: ${SUCCESS}${NC}"

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Échecs: ${FAILED}${NC}"
fi

echo ""
echo -e "${BLUE}📋 PROCHAINES ÉTAPES:${NC}"
echo -e "${YELLOW}1. Vérifier: vercel env ls${NC}"
echo -e "${YELLOW}2. Redéployer: vercel --prod${NC}"
echo -e "${YELLOW}3. Tester les services en production${NC}"
echo ""

