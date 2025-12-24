#!/bin/bash
# Script de vérification de la configuration production
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
echo "🔍 Vérification de la configuration production..."
ERRORS=0
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Fichier .env.production manquant${NC}"
    exit 1
fi
# Charger les variables de manière sécurisée
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Ignorer les commentaires et lignes vides
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${key// }" ]] && continue
    
    # Nettoyer
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | sed 's/^"//;s/"$//' | xargs)
    
    # Exporter la variable
    export "$key"="$value" 2>/dev/null || true
done < .env.production

REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"["* ]] || [[ "${!var}" == *"PASSWORD"* ]]; then
        echo -e "${RED}❌ Variable $var manquante ou non configurée${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✅ Variable $var configurée${NC}"
    fi
done
if npx prisma validate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Schema Prisma valide${NC}"
else
    echo -e "${RED}❌ Schema Prisma invalide${NC}"
    ERRORS=$((ERRORS + 1))
fi
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Configuration valide!${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS erreur(s) trouvée(s)${NC}"
    exit 1
fi
