#!/bin/bash
# Script de vérification des secrets dans le code
# Usage: ./scripts/check-secrets.sh

set -e

echo "🔒 Vérification des secrets dans le code..."

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Vérifier les fichiers .env trackés
echo -e "\n${YELLOW}1. Vérification des fichiers .env trackés...${NC}"
ENV_FILES=$(git ls-files | grep -E '\.env$|\.env\.[^e]' || true)
if [ -n "$ENV_FILES" ]; then
    echo -e "${RED}❌ ERREUR: Des fichiers .env sont trackés dans git:${NC}"
    echo "$ENV_FILES"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Aucun fichier .env tracké${NC}"
fi

# Chercher des patterns de secrets hardcodés
echo -e "\n${YELLOW}2. Recherche de secrets hardcodés...${NC}"
SECRET_PATTERNS=(
    "sk_live_[a-zA-Z0-9]{32,}"
    "sk_test_[a-zA-Z0-9]{32,}"
    "rk_live_[a-zA-Z0-9]{32,}"
    "rk_test_[a-zA-Z0-9]{32,}"
    "AIza[0-9A-Za-z\\-_]{35}"
    "AKIA[0-9A-Z]{16}"
    "ghp_[a-zA-Z0-9]{36}"
    "gho_[a-zA-Z0-9]{36}"
    "ghu_[a-zA-Z0-9]{36}"
    "ghs_[a-zA-Z0-9]{36}"
    "ghr_[a-zA-Z0-9]{36}"
    "xox[baprs]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-z0-9]{32}"
)

FOUND_SECRETS=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    MATCHES=$(grep -r -E "$pattern" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=build . 2>/dev/null || true)
    if [ -n "$MATCHES" ]; then
        echo -e "${RED}❌ Pattern suspect trouvé: $pattern${NC}"
        echo "$MATCHES" | head -5
        FOUND_SECRETS=$((FOUND_SECRETS + 1))
    fi
done

if [ $FOUND_SECRETS -eq 0 ]; then
    echo -e "${GREEN}✅ Aucun secret hardcodé détecté${NC}"
else
    ERRORS=$((ERRORS + FOUND_SECRETS))
fi

# Vérifier les variables d'environnement critiques dans le code
echo -e "\n${YELLOW}3. Vérification des références aux variables d'environnement...${NC}"
REQUIRED_ENV_VARS=(
    "SHOPIFY_API_KEY"
    "SHOPIFY_API_SECRET"
    "JWT_SECRET"
    "JWT_PUBLIC_KEY"
    "OPENAI_API_KEY"
    "CLOUDINARY_URL"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "STRIPE_SECRET_KEY"
    "SENTRY_DSN"
)

MISSING_REFS=0
for var in "${REQUIRED_ENV_VARS[@]}"; do
    # Chercher si la variable est référencée dans le code (mais pas hardcodée)
    REFS=$(grep -r "$var" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=build . 2>/dev/null | grep -v "process.env" | grep -v "configService.get" | grep -v "ConfigService" | grep -v "env.example" | grep -v "SECRETS_CHECKLIST" || true)
    if [ -n "$REFS" ]; then
        echo -e "${YELLOW}⚠️  Variable $var référencée de manière suspecte:${NC}"
        echo "$REFS" | head -3
    fi
done

# Vérifier .gitignore
echo -e "\n${YELLOW}4. Vérification du .gitignore...${NC}"
if grep -q "\.env" .gitignore; then
    echo -e "${GREEN}✅ .gitignore contient .env${NC}"
else
    echo -e "${RED}❌ .gitignore ne contient pas .env${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Résumé
echo -e "\n${YELLOW}=== Résumé ===${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Aucune erreur détectée${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS erreur(s) détectée(s)${NC}"
    echo -e "${YELLOW}Veuillez corriger les erreurs avant de commiter.${NC}"
    exit 1
fi

