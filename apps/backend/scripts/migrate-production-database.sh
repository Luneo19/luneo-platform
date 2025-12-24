#!/bin/bash
# Migration base de données production
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Fichier .env.production non trouvé${NC}"
    exit 1
fi
export $(grep -v '^#' .env.production | xargs)
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL non configurée${NC}"
    exit 1
fi
echo -e "${YELLOW}📊 Vérification du statut des migrations...${NC}"
npx prisma migrate status
echo ""
read -p "Appliquer les migrations? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi
echo -e "${YELLOW}🔄 Application des migrations...${NC}"
if npx prisma migrate deploy; then
    echo -e "${GREEN}✅ Migrations appliquées avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de l'application des migrations${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Migration terminée!${NC}"



















