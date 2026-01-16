#!/bin/bash

##############################################################################
# 🚂 SCRIPT DE DÉPLOIEMENT BACKEND RAILWAY
# Déploie uniquement le backend sur Railway
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
echo -e "${BLUE}  🚂 DÉPLOIEMENT BACKEND - RAILWAY${NC}"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "apps/backend" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis la racine du projet${NC}"
    exit 1
fi

cd apps/backend

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}📦 Installation de Railway CLI...${NC}"
    npm install -g @railway/cli
fi

# Vérifier la connexion
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Projet Railway non lié${NC}"
    echo "   Exécution: railway link"
    railway link
fi

echo -e "${GREEN}✅ Projet Railway lié${NC}"
echo ""

# Vérifier Root Directory
echo -e "${YELLOW}📋 IMPORTANT: Vérifiez que Root Directory = 'apps/backend'${NC}"
echo "   Dashboard: https://railway.app → Settings → Root Directory"
read -p "   Appuyez sur Entrée une fois vérifié..."

# Migrations Prisma
echo ""
echo -e "${YELLOW}📦 Exécution des migrations Prisma...${NC}"
railway run "pnpm prisma migrate deploy" || {
    echo -e "${YELLOW}⚠️  Migrations échouées ou déjà à jour${NC}"
}

# Déploiement
echo ""
echo -e "${YELLOW}🚀 Déploiement sur Railway...${NC}"
railway up

echo ""
echo -e "${GREEN}✅ Backend déployé avec succès !${NC}"
echo ""

# Afficher les logs
echo -e "${YELLOW}📋 Dernières lignes des logs:${NC}"
railway logs --tail 20 || true

echo ""
echo "📋 Vérifiez votre dashboard Railway pour l'URL de déploiement"
echo "   Health check: https://votre-backend.railway.app/api/health"
echo ""

cd ../..
