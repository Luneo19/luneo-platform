#!/bin/bash
set -e

echo "🚀 DÉPLOIEMENT STAGING - LUNEO PLATFORM"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
STAGING_DB_URL="${DATABASE_URL:-postgresql://user:pass@localhost:5432/luneo_staging}"
STAGING_API_URL="${STAGING_API_URL:-https://api-staging.luneo.app}"
STAGING_FRONTEND_URL="${STAGING_FRONTEND_URL:-https://staging.luneo.app}"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Database: ${STAGING_DB_URL}"
echo "  API: ${STAGING_API_URL}"
echo "  Frontend: ${STAGING_FRONTEND_URL}"
echo ""

# Vérifications pré-déploiement
echo -e "${YELLOW}🔍 Vérifications pré-déploiement...${NC}"

# Vérifier que DATABASE_URL est configuré
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL non configuré${NC}"
    echo "   Exportez DATABASE_URL avant d'exécuter ce script"
    exit 1
fi
echo -e "${GREEN}✅ DATABASE_URL configuré${NC}"

# Vérifier connexion DB
echo "  Test connexion database..."
if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connexion database OK${NC}"
else
    echo -e "${RED}❌ Impossible de se connecter à la database${NC}"
    exit 1
fi

# Étape 1: Appliquer migrations Prisma
echo ""
echo -e "${YELLOW}📦 Étape 1: Appliquer migrations Prisma...${NC}"
cd apps/backend

# Vérifier status migrations
echo "  Vérification status migrations..."
npx prisma migrate status

# Appliquer migrations
echo "  Application des migrations..."
npx prisma migrate deploy

# Vérifier que ShopifyInstall table existe
echo "  Vérification table ShopifyInstall..."
if psql "$DATABASE_URL" -c "\d \"ShopifyInstall\"" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Table ShopifyInstall créée${NC}"
else
    echo -e "${RED}❌ Table ShopifyInstall non trouvée${NC}"
    exit 1
fi

cd ../..

# Étape 2: Vérifier variables d'environnement
echo ""
echo -e "${YELLOW}🔐 Étape 2: Vérification variables d'environnement...${NC}"

REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "REDIS_URL"
    "SHOPIFY_API_KEY"
    "SHOPIFY_API_SECRET"
    "MASTER_ENCRYPTION_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Variables manquantes:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Configurez ces variables avant de continuer"
    exit 1
fi

echo -e "${GREEN}✅ Toutes les variables requises sont configurées${NC}"

# Étape 3: Health checks
echo ""
echo -e "${YELLOW}🏥 Étape 3: Health checks...${NC}"

# Test API health
if command -v curl &> /dev/null; then
    echo "  Test API health..."
    if curl -f -s "${STAGING_API_URL}/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API health check OK${NC}"
    else
        echo -e "${YELLOW}⚠️  API health check échoué (peut être normal si pas encore déployé)${NC}"
    fi
fi

# Résumé
echo ""
echo -e "${GREEN}✅ Déploiement staging préparé !${NC}"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Déployer backend: cd apps/backend && vercel --prod --env=staging"
echo "  2. Déployer frontend: cd apps/frontend && vercel --prod --env=staging"
echo "  3. Déployer worker: cd apps/worker-ia && pnpm start"
echo "  4. Exécuter smoke tests: voir .github/DEPLOYMENT_STAGING_GUIDE.md"
echo ""

