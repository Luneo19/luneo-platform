#!/bin/bash

# 🚀 Script de Déploiement en Production
# Déploie le backend et frontend sur Vercel/Railway

set -e

echo "🚀 DÉPLOIEMENT EN PRODUCTION"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifications préalables
echo -e "${YELLOW}📋 Vérifications préalables...${NC}"

# Vérifier que les variables d'environnement sont définies
if [ -z "$VERCEL_TOKEN" ] && [ -z "$RAILWAY_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  Aucun token de déploiement trouvé. Utilisation des variables d'environnement locales.${NC}"
fi

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️  Installation des dépendances...${NC}"
  pnpm install
fi

# Build backend
echo -e "\n${YELLOW}🔨 Build du backend...${NC}"
cd apps/backend
pnpm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erreur lors du build du backend${NC}"
  exit 1
fi
cd ../..

# Build frontend
echo -e "\n${YELLOW}🔨 Build du frontend...${NC}"
cd apps/frontend
pnpm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erreur lors du build du frontend${NC}"
  exit 1
fi
cd ../..

# Vérifier les migrations Prisma
echo -e "\n${YELLOW}📦 Vérification des migrations Prisma...${NC}"
cd apps/backend
if [ -d "prisma/migrations" ]; then
  echo "Migrations Prisma détectées"
  echo "⚠️  Assurez-vous d'appliquer les migrations en production"
fi
cd ../..

# Déploiement Vercel (Frontend)
if [ ! -z "$VERCEL_TOKEN" ]; then
  echo -e "\n${YELLOW}🌐 Déploiement sur Vercel (Frontend)...${NC}"
  
  # Vérifier que Vercel CLI est installé
  if ! command -v vercel &> /dev/null; then
    echo "Installation de Vercel CLI..."
    npm install -g vercel
  fi
  
  # Déployer le frontend
  cd apps/frontend
  vercel --prod --token "$VERCEL_TOKEN" --yes
  cd ../..
  
  echo -e "${GREEN}✅ Frontend déployé sur Vercel${NC}"
else
  echo -e "${YELLOW}⚠️  VERCEL_TOKEN non défini, déploiement Vercel ignoré${NC}"
fi

# Déploiement Railway (Backend)
if [ ! -z "$RAILWAY_TOKEN" ]; then
  echo -e "\n${YELLOW}🚂 Déploiement sur Railway (Backend)...${NC}"
  
  # Vérifier que Railway CLI est installé
  if ! command -v railway &> /dev/null; then
    echo "Installation de Railway CLI..."
    npm install -g @railway/cli
  fi
  
  # Déployer le backend
  cd apps/backend
  railway up --token "$RAILWAY_TOKEN"
  cd ../..
  
  echo -e "${GREEN}✅ Backend déployé sur Railway${NC}"
else
  echo -e "${YELLOW}⚠️  RAILWAY_TOKEN non défini, déploiement Railway ignoré${NC}"
fi

echo -e "\n${GREEN}✅ Déploiement terminé !${NC}"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Vérifier les variables d'environnement en production"
echo "  2. Appliquer les migrations Prisma"
echo "  3. Tester les endpoints API"
echo "  4. Vérifier le dashboard webhooks"
echo ""
