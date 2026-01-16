#!/bin/bash

##############################################################################
# 🌐 SCRIPT DE DÉPLOIEMENT FRONTEND VERCEL
# Déploie uniquement le frontend sur Vercel
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo -e "${BLUE}  🌐 DÉPLOIEMENT FRONTEND - VERCEL${NC}"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "apps/frontend" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis la racine du projet${NC}"
    exit 1
fi

cd apps/frontend

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}📦 Installation de Vercel CLI...${NC}"
    npm install -g vercel
fi

# Vérifier la connexion
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Non connecté à Vercel${NC}"
    vercel login
fi

echo -e "${GREEN}✅ Connecté à Vercel${NC}"
echo ""

# Vérifier Root Directory
echo -e "${YELLOW}📋 IMPORTANT: Vérifiez que Root Directory = 'apps/frontend'${NC}"
echo "   Dashboard: https://vercel.com/dashboard → Settings → General"
read -p "   Appuyez sur Entrée une fois vérifié..."

# Build de vérification
echo ""
echo -e "${YELLOW}🔨 Build de vérification...${NC}"
npm run build

echo ""
echo -e "${YELLOW}🚀 Déploiement sur Vercel (production)...${NC}"
vercel --prod --yes

echo ""
echo -e "${GREEN}✅ Frontend déployé avec succès !${NC}"
echo ""
echo "📋 Vérifiez votre dashboard Vercel pour l'URL de déploiement"
echo ""

cd ../..
