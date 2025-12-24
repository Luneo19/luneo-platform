#!/bin/bash

# Script de déploiement professionnel sur Vercel
# Corrige les erreurs et déploie sans simplification

set -e  # Exit on error

echo "🚀 Déploiement professionnel sur Vercel"
echo "========================================"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifications pré-déploiement
echo -e "${YELLOW}📋 Vérifications pré-déploiement...${NC}"

# 1. Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI n'est pas installé${NC}"
    echo "Installez-le avec: npm i -g vercel"
    exit 1
fi
echo -e "${GREEN}✅ Vercel CLI installé${NC}"

# 2. Build backend
echo -e "${YELLOW}🔨 Build backend...${NC}"
cd apps/backend
if npm run build; then
    echo -e "${GREEN}✅ Build backend réussi${NC}"
else
    echo -e "${RED}❌ Build backend échoué${NC}"
    exit 1
fi

# 3. Build frontend
echo -e "${YELLOW}🔨 Build frontend...${NC}"
cd ../frontend
if npm run build; then
    echo -e "${GREEN}✅ Build frontend réussi${NC}"
else
    echo -e "${RED}❌ Build frontend échoué${NC}"
    exit 1
fi

# 4. Tests
echo -e "${YELLOW}🧪 Exécution des tests...${NC}"
cd ../backend
if npm run test -- --passWithNoTests; then
    echo -e "${GREEN}✅ Tests passent${NC}"
else
    echo -e "${RED}❌ Tests échoués${NC}"
    exit 1
fi

# 5. Déploiement Frontend
echo -e "${YELLOW}🚀 Déploiement frontend sur Vercel...${NC}"
cd ../frontend
if vercel --prod --yes; then
    echo -e "${GREEN}✅ Frontend déployé avec succès${NC}"
else
    echo -e "${RED}❌ Déploiement frontend échoué${NC}"
    exit 1
fi

# 6. Déploiement Backend (optionnel, si déployé séparément)
read -p "Déployer le backend séparément? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🚀 Déploiement backend sur Vercel...${NC}"
    cd ../backend
    if vercel --prod --yes; then
        echo -e "${GREEN}✅ Backend déployé avec succès${NC}"
    else
        echo -e "${RED}❌ Déploiement backend échoué${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}🎉 Déploiement terminé avec succès!${NC}"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Vérifier les variables d'environnement sur Vercel"
echo "2. Tester les endpoints en production"
echo "3. Vérifier les logs Vercel"
echo "4. Configurer les domaines personnalisés si nécessaire"

