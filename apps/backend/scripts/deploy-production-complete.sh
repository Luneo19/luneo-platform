#!/bin/bash
# Déploiement production complet
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
echo -e "${YELLOW}🚀 Déploiement production...${NC}"
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Fichier .env.production non trouvé${NC}"
    exit 1
fi
echo -e "${YELLOW}📦 Génération Prisma...${NC}"
npx prisma generate
echo -e "${YELLOW}🔨 Build...${NC}"
npm run build
echo -e "${YELLOW}🚀 Déploiement Vercel...${NC}"
vercel --prod
echo -e "${GREEN}✅ Déploiement terminé!${NC}"





























