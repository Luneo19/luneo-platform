#!/bin/bash

# 🧪 Script de test rapide pour la nouvelle homepage

echo "🚀 Démarrage du test de la nouvelle homepage..."
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Étape 1 : Vérifier les fichiers
echo -e "${BLUE}📋 Étape 1 : Vérification des fichiers...${NC}"
if [ -f "apps/frontend/src/app/(public)/page-new.tsx" ]; then
    echo -e "${GREEN}✅ Nouvelle homepage trouvée${NC}"
else
    echo -e "${YELLOW}⚠️  Nouvelle homepage non trouvée${NC}"
    exit 1
fi

# Étape 2 : Créer route de test
echo ""
echo -e "${BLUE}📋 Étape 2 : Création de la route de test...${NC}"
mkdir -p apps/frontend/src/app/test-homepage
cp apps/frontend/src/app/\(public\)/page-new.tsx apps/frontend/src/app/test-homepage/page.tsx

if [ -f "apps/frontend/src/app/test-homepage/page.tsx" ]; then
    echo -e "${GREEN}✅ Route de test créée${NC}"
else
    echo -e "${YELLOW}⚠️  Erreur lors de la création${NC}"
    exit 1
fi

# Étape 3 : Vérifier TypeScript
echo ""
echo -e "${BLUE}📋 Étape 3 : Vérification TypeScript...${NC}"
cd apps/frontend
npm run type-check 2>&1 | grep -E "(page-new|test-homepage|marketing/home|animations)" | head -5
if [ $? -eq 1 ]; then
    echo -e "${GREEN}✅ Aucune erreur TypeScript dans les nouveaux fichiers${NC}"
fi

# Instructions finales
echo ""
echo -e "${GREEN}✅ Setup terminé !${NC}"
echo ""
echo -e "${BLUE}📝 Prochaines étapes :${NC}"
echo ""
echo "1. Démarrer le backend :"
echo "   cd apps/backend"
echo "   npm run start:dev"
echo ""
echo "2. Démarrer le frontend :"
echo "   cd apps/frontend"
echo "   npm run dev"
echo ""
echo "3. Accéder à la nouvelle homepage :"
echo -e "   ${YELLOW}http://localhost:3000/test-homepage${NC}"
echo ""
echo "4. Comparer avec l'ancienne :"
echo -e "   ${YELLOW}http://localhost:3000/${NC}"
echo ""
