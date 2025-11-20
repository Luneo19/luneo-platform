#!/bin/bash

# 🚀 Script de préparation au déploiement
# Vérifie et prépare tout pour le déploiement production

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  Préparation au Déploiement${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Vérifier qu'on est sur main
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    echo -e "${YELLOW}⚠️  Vous êtes sur '$CURRENT_BRANCH'${NC}"
    echo -e "${YELLOW}Recommandé: être sur 'main' pour le déploiement${NC}\n"
fi

# 1. Vérifier les dépendances
echo -e "${BLUE}1. Vérification des dépendances...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installation des dépendances root...${NC}"
    npm install
else
    echo -e "${GREEN}✅ Dépendances root installées${NC}"
fi

if [ ! -d "apps/frontend/node_modules" ]; then
    echo -e "${YELLOW}Installation des dépendances frontend...${NC}"
    cd apps/frontend
    npm install
    cd ../..
else
    echo -e "${GREEN}✅ Dépendances frontend installées${NC}"
fi

# 2. Vérifier les variables d'environnement
echo -e "\n${BLUE}2. Vérification des variables d'environnement...${NC}"
ENV_FILE="apps/frontend/.env.local"
if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}✅ Fichier .env.local trouvé${NC}"
    
    # Vérifier les variables critiques
    REQUIRED_VARS=(
        "NEXT_PUBLIC_APP_URL"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
    
    MISSING_VARS=()
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^${var}=" "$ENV_FILE"; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ Variables critiques présentes${NC}"
    else
        echo -e "${YELLOW}⚠️  Variables manquantes:${NC}"
        for var in "${MISSING_VARS[@]}"; do
            echo -e "   - $var"
        done
    fi
else
    echo -e "${YELLOW}⚠️  Fichier .env.local non trouvé${NC}"
    echo -e "${YELLOW}Créer .env.local avec les variables nécessaires${NC}"
fi

# 3. Build
echo -e "\n${BLUE}3. Build de production...${NC}"
cd apps/frontend

if npm run build 2>&1 | tee /tmp/build.log; then
    echo -e "${GREEN}✅ Build réussi${NC}"
    
    # Vérifier la taille du build
    if [ -d ".next" ]; then
        BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
        echo -e "${BLUE}   Taille du build: $BUILD_SIZE${NC}"
    fi
else
    echo -e "${RED}❌ Build échoué${NC}"
    echo -e "${YELLOW}Vérifier les erreurs ci-dessus${NC}"
    exit 1
fi

cd ../..

# 4. Lint
echo -e "\n${BLUE}4. Vérification lint...${NC}"
cd apps/frontend

if npm run lint 2>&1 | tail -20; then
    echo -e "${GREEN}✅ Lint OK${NC}"
else
    echo -e "${YELLOW}⚠️  Erreurs lint (non bloquant)${NC}"
fi

cd ../..

# 5. Type check
echo -e "\n${BLUE}5. Vérification TypeScript...${NC}"
cd apps/frontend

if npx tsc --noEmit 2>&1 | tail -20; then
    echo -e "${GREEN}✅ TypeScript OK${NC}"
else
    echo -e "${YELLOW}⚠️  Erreurs TypeScript (vérifier)${NC}"
fi

cd ../..

# Résumé
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Préparation terminée${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

echo -e "${BLUE}Prochaines étapes:${NC}"
echo -e "1. Vérifier les résultats ci-dessus"
echo -e "2. Tester manuellement (responsive, fonctionnalités)"
echo -e "3. Déployer sur Vercel"
echo -e "   - Via dashboard: https://vercel.com"
echo -e "   - Via CLI: vercel --prod"
echo ""

