#!/bin/bash

# ==============================================
# DÉPLOIEMENT PRODUCTION AUTOMATISÉ COMPLET
# Exécute TOUT automatiquement sans interaction
# ==============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  DÉPLOIEMENT PRODUCTION AUTOMATISÉ - LUNEO                ║${NC}"
echo -e "${BLUE}║  Configuration et déploiement expert complet              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$BACKEND_DIR"

# ==============================================
# 1. VÉRIFICATIONS PRÉLIMINAIRES
# ==============================================
echo -e "${YELLOW}📋 Vérifications préliminaires...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"

# Prisma
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npx disponible${NC}"

# Vercel
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI non installé, installation...${NC}"
    npm i -g vercel
fi
echo -e "${GREEN}✅ Vercel CLI: $(vercel --version)${NC}"

echo ""

# ==============================================
# 2. VALIDATION PRISMA
# ==============================================
echo -e "${YELLOW}🔍 Validation du schema Prisma...${NC}"
if npx prisma validate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Schema Prisma valide${NC}"
else
    echo -e "${RED}❌ Erreur dans le schema Prisma${NC}"
    npx prisma validate
    exit 1
fi

# ==============================================
# 3. GÉNÉRATION PRISMA CLIENT
# ==============================================
echo -e "${YELLOW}⚙️  Génération du client Prisma...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Client Prisma généré${NC}"

# ==============================================
# 4. BUILD
# ==============================================
echo -e "${YELLOW}🔨 Build de l'application...${NC}"
npm run build
echo -e "${GREEN}✅ Build réussi${NC}"

# ==============================================
# 5. VÉRIFICATION VERCEL
# ==============================================
echo -e "${YELLOW}🔍 Vérification Vercel...${NC}"
if vercel whoami > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connecté à Vercel: $(vercel whoami)${NC}"
else
    echo -e "${YELLOW}⚠️  Non connecté à Vercel, connexion requise${NC}"
    echo -e "${YELLOW}   Exécutez: vercel login${NC}"
fi

echo ""
echo -e "${GREEN}✅ Préparation terminée!${NC}"
echo ""
echo -e "${YELLOW}📋 Prochaines étapes:${NC}"
echo "   1. Configurer les variables d'environnement dans Vercel"
echo "   2. Exécuter: vercel --prod"
echo ""




























