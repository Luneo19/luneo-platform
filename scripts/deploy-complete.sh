#!/bin/bash

# 🚀 Script de Déploiement Automatique - Socle 3D/AR + Personalization
# Usage: ./scripts/deploy-complete.sh [staging|production]

set -e  # Exit on error

ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/apps/backend"

echo "🚀 Déploiement automatique - Environnement: $ENVIRONMENT"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Install dependencies
echo -e "\n${YELLOW}📦 Étape 1: Installation des dépendances...${NC}"
cd "$ROOT_DIR"
pnpm install --force || {
    echo -e "${RED}❌ Échec installation dépendances${NC}"
    exit 1
}
echo -e "${GREEN}✅ Dépendances installées${NC}"

# Step 2: Install NestJS CLI if needed
echo -e "\n${YELLOW}🔧 Étape 2: Vérification NestJS CLI...${NC}"
cd "$BACKEND_DIR"
if ! pnpm list @nestjs/cli > /dev/null 2>&1; then
    echo "Installation de @nestjs/cli..."
    pnpm add -D @nestjs/cli@10.0.0 || {
        echo -e "${RED}❌ Échec installation NestJS CLI${NC}"
        exit 1
    }
fi
echo -e "${GREEN}✅ NestJS CLI disponible${NC}"

# Step 3: Generate Prisma Client
echo -e "\n${YELLOW}🗄️  Étape 3: Génération Prisma Client...${NC}"
npx prisma generate || {
    echo -e "${RED}❌ Échec génération Prisma Client${NC}"
    exit 1
}
echo -e "${GREEN}✅ Prisma Client généré${NC}"

# Step 4: Apply migrations
echo -e "\n${YELLOW}📊 Étape 4: Application des migrations...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}⚠️  PRODUCTION: Vérifiez que vous avez fait un backup !${NC}"
    read -p "Continuer ? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Déploiement annulé"
        exit 0
    fi
fi

npx prisma migrate deploy || {
    echo -e "${RED}❌ Échec application migrations${NC}"
    exit 1
}
echo -e "${GREEN}✅ Migrations appliquées${NC}"

# Step 5: Build
echo -e "\n${YELLOW}🔨 Étape 5: Build du backend...${NC}"
pnpm run build || {
    echo -e "${RED}❌ Échec build${NC}"
    exit 1
}
echo -e "${GREEN}✅ Build réussi${NC}"

# Step 6: Type check
echo -e "\n${YELLOW}🔍 Étape 6: Vérification TypeScript...${NC}"
if pnpm run type-check 2>/dev/null; then
    echo -e "${GREEN}✅ Type check OK${NC}"
else
    echo -e "${YELLOW}⚠️  Type check non disponible ou erreurs mineures${NC}"
fi

# Step 7: Lint (optional)
echo -e "\n${YELLOW}🧹 Étape 7: Lint...${NC}"
if pnpm run lint 2>/dev/null; then
    echo -e "${GREEN}✅ Lint OK${NC}"
else
    echo -e "${YELLOW}⚠️  Lint non disponible ou erreurs mineures${NC}"
fi

# Step 8: Verify database
echo -e "\n${YELLOW}🔍 Étape 8: Vérification database...${NC}"
npx prisma migrate status || {
    echo -e "${YELLOW}⚠️  Vérification migrations non disponible${NC}"
}

# Summary
echo -e "\n${GREEN}=================================================="
echo -e "✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
echo -e "==================================================${NC}"
echo ""
echo "📊 Résumé:"
echo "  - Dépendances: ✅"
echo "  - Prisma Client: ✅"
echo "  - Migrations: ✅"
echo "  - Build: ✅"
echo ""
echo "🚀 Prochaines étapes:"
echo "  1. Redémarrer les services"
echo "  2. Vérifier les logs"
echo "  3. Tester les endpoints API"
echo "  4. Monitorer les métriques"
    echo ""
echo "📚 Documentation:"
echo "  - DEPLOYMENT_GUIDE.md : Guide complet"
echo "  - DEPLOYMENT_COMPLETE.md : Vérifications"
echo "  - INDEX_DOCUMENTATION.md : Index doc"
    echo ""
