#!/bin/bash

##############################################################################
# 🚀 SCRIPT DE DÉPLOIEMENT PRODUCTION COMPLET
# Déploie Frontend (Vercel) + Backend (Railway)
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
echo -e "${BLUE}  🚀 DÉPLOIEMENT PRODUCTION - LUNEO PLATFORM${NC}"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

##############################################################################
# VÉRIFICATIONS PRÉ-DÉPLOIEMENT
##############################################################################

echo -e "${YELLOW}📋 Vérifications pré-déploiement...${NC}"
echo ""

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI non installé${NC}"
    echo "   Installation: npm install -g vercel"
    exit 1
fi
echo -e "${GREEN}✅ Vercel CLI installé${NC}"

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI non installé${NC}"
    echo "   Installation: npm install -g @railway/cli"
    exit 1
fi
echo -e "${GREEN}✅ Railway CLI installé${NC}"

# Vérifier la connexion Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Non connecté à Vercel${NC}"
    echo "   Connexion requise..."
    vercel login
fi
echo -e "${GREEN}✅ Connecté à Vercel${NC}"

# Vérifier la connexion Railway
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Projet Railway non lié${NC}"
    echo "   Exécutez: cd apps/backend && railway link"
    exit 1
fi
echo -e "${GREEN}✅ Projet Railway lié${NC}"

echo ""
echo -e "${GREEN}✅ Toutes les vérifications passées${NC}"
echo ""

##############################################################################
# DÉPLOIEMENT BACKEND (RAILWAY)
##############################################################################

echo "═══════════════════════════════════════════════════════════════════════════"
echo -e "${BLUE}  🚂 ÉTAPE 1: DÉPLOIEMENT BACKEND (RAILWAY)${NC}"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

cd apps/backend

echo -e "${YELLOW}📦 Vérification des migrations Prisma...${NC}"
echo "   Exécution: railway run 'pnpm prisma migrate deploy'"
read -p "   Appuyez sur Entrée pour continuer (ou Ctrl+C pour annuler)..."

railway run "pnpm prisma migrate deploy" || {
    echo -e "${YELLOW}⚠️  Migrations échouées ou déjà à jour${NC}"
}

echo ""
echo -e "${YELLOW}🚀 Déploiement sur Railway...${NC}"
railway up

echo ""
echo -e "${GREEN}✅ Backend déployé sur Railway${NC}"
echo ""

# Attendre un peu pour que le déploiement démarre
sleep 5

# Vérifier les logs
echo -e "${YELLOW}📋 Vérification des logs (dernières 20 lignes)...${NC}"
railway logs --tail 20 || true

cd ../..

##############################################################################
# DÉPLOIEMENT FRONTEND (VERCEL)
##############################################################################

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo -e "${BLUE}  🌐 ÉTAPE 2: DÉPLOIEMENT FRONTEND (VERCEL)${NC}"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

cd apps/frontend

# Vérifier Root Directory
echo -e "${YELLOW}📋 Vérification Root Directory Vercel...${NC}"
echo "   Le Root Directory doit être: apps/frontend"
echo "   Vérifiez: https://vercel.com/dashboard → Settings → General"
read -p "   Appuyez sur Entrée une fois vérifié..."

# Build local pour vérifier
echo ""
echo -e "${YELLOW}🔨 Build local de vérification...${NC}"
npm run build || {
    echo -e "${RED}❌ Build échoué. Corrigez les erreurs avant de continuer.${NC}"
    exit 1
}
echo -e "${GREEN}✅ Build local réussi${NC}"

echo ""
echo -e "${YELLOW}🚀 Déploiement sur Vercel (production)...${NC}"
vercel --prod --yes

echo ""
echo -e "${GREEN}✅ Frontend déployé sur Vercel${NC}"
echo ""

cd ../..

##############################################################################
# RÉSUMÉ
##############################################################################

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo -e "${GREEN}  ✅ DÉPLOIEMENT TERMINÉ${NC}"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

echo -e "${BLUE}📋 Prochaines étapes:${NC}"
echo ""
echo "1. Vérifier les déploiements:"
echo "   - Vercel: https://vercel.com/dashboard"
echo "   - Railway: https://railway.app"
echo ""
echo "2. Tester les endpoints:"
echo "   - Frontend: https://votre-projet.vercel.app"
echo "   - Backend Health: https://votre-backend.railway.app/api/health"
echo ""
echo "3. Vérifier les logs:"
echo "   - Vercel: vercel logs"
echo "   - Railway: railway logs"
echo ""
echo -e "${GREEN}🎉 Déploiement réussi !${NC}"
echo ""
