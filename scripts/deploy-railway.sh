#!/bin/bash

# Script de déploiement Railway
# Ce script prépare et déploie l'application sur Railway

set -e

echo "🚀 Déploiement Railway - Luneo Platform"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI n'est pas installé${NC}"
    echo "Installation de Railway CLI..."
    npm install -g @railway/cli
fi

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json non trouvé${NC}"
    echo "Assurez-vous d'être dans le répertoire racine du projet"
    exit 1
fi

echo -e "${GREEN}✅ Vérifications préliminaires OK${NC}"
echo ""

# Vérifier les variables d'environnement requises
echo "📋 Vérification des variables d'environnement..."
echo ""

REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "NODE_ENV"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Variables d'environnement manquantes:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Ces variables doivent être configurées dans Railway Dashboard"
    echo ""
fi

# Build local (optionnel, pour tester)
if [ "$1" == "--build" ]; then
    echo "🔨 Build local..."
    cd apps/backend
    pnpm install
    pnpm prisma generate
    pnpm build
    cd ../..
    echo -e "${GREEN}✅ Build local réussi${NC}"
    echo ""
fi

# Migration Prisma (optionnel)
if [ "$1" == "--migrate" ]; then
    echo "🗄️  Exécution des migrations Prisma..."
    cd apps/backend
    pnpm prisma migrate deploy
    cd ../..
    echo -e "${GREEN}✅ Migrations appliquées${NC}"
    echo ""
fi

# Déploiement Railway
echo "🚂 Déploiement sur Railway..."
echo ""

# Vérifier si Railway est connecté
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway n'est pas connecté${NC}"
    echo "Connexion à Railway..."
    railway login
fi

# Déployer
echo "Déploiement en cours..."
railway up

echo ""
echo -e "${GREEN}✅ Déploiement terminé !${NC}"
echo ""
echo "📊 Prochaines étapes:"
echo "   1. Vérifier les logs: railway logs"
echo "   2. Vérifier le health check: railway open"
echo "   3. Tester l'API: curl \$(railway domain)/health"
echo ""






