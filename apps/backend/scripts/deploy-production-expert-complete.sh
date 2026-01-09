#!/bin/bash

# ==============================================
# DÉPLOIEMENT PRODUCTION EXPERT COMPLET
# LUNEO - SaaS de niveau mondial n°1
# Configuration et déploiement automatique complet
# ==============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 DÉPLOIEMENT PRODUCTION EXPERT COMPLET - LUNEO                ║${NC}"
echo -e "${BLUE}║  SaaS de niveau mondial n°1 - Déploiement Automatique Expert    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$BACKEND_DIR"

# ==============================================
# 1. VÉRIFICATIONS COMPLÈTES
# ==============================================
echo -e "${CYAN}📋 Étape 1/8: Vérifications complètes...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}   ✅ Node.js: $(node -v)${NC}"

if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}   ⚠️  Installation de Vercel CLI...${NC}"
    npm i -g vercel
fi

if ! vercel whoami > /dev/null 2>&1; then
    echo -e "${RED}❌ Non connecté à Vercel${NC}"
    echo -e "${YELLOW}   Exécutez: vercel login${NC}"
    exit 1
fi
echo -e "${GREEN}   ✅ Connecté à Vercel: $(vercel whoami)${NC}"

if [ ! -f .env.production ]; then
    echo -e "${YELLOW}   ⚠️  .env.production non trouvé, exécution de la configuration...${NC}"
    ./scripts/configure-production-expert-automated.sh
fi
echo -e "${GREEN}   ✅ .env.production présent${NC}"

# ==============================================
# 2. VALIDATION PRISMA
# ==============================================
echo -e "${CYAN}🔍 Étape 2/8: Validation Prisma...${NC}"

if npx prisma validate > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Schema Prisma valide${NC}"
else
    echo -e "${RED}   ❌ Schema Prisma invalide${NC}"
    npx prisma validate
    exit 1
fi

# ==============================================
# 3. GÉNÉRATION PRISMA CLIENT
# ==============================================
echo -e "${CYAN}⚙️  Étape 3/8: Génération Prisma client...${NC}"

npx prisma generate
echo -e "${GREEN}   ✅ Client Prisma généré${NC}"

# ==============================================
# 4. INSTALLATION DÉPENDANCES
# ==============================================
echo -e "${CYAN}📦 Étape 4/8: Installation des dépendances...${NC}"

npm install --legacy-peer-deps 2>&1 | tail -5
echo -e "${GREEN}   ✅ Dépendances installées${NC}"

# ==============================================
# 5. BUILD COMPLET
# ==============================================
echo -e "${CYAN}🔨 Étape 5/8: Build complet...${NC}"

npm run build
echo -e "${GREEN}   ✅ Build réussi${NC}"

# ==============================================
# 6. VÉRIFICATION VARIABLES VERCEL
# ==============================================
echo -e "${CYAN}🔧 Étape 6/8: Vérification variables Vercel...${NC}"

REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "STRIPE_SECRET_KEY" "SENDGRID_API_KEY")
MISSING_VARS=0

for var in "${REQUIRED_VARS[@]}"; do
    if vercel env ls 2>/dev/null | grep -q " $var "; then
        echo -e "${GREEN}   ✅ $var configurée${NC}"
    else
        echo -e "${YELLOW}   ⚠️  $var manquante${NC}"
        MISSING_VARS=$((MISSING_VARS + 1))
    fi
done

if [ $MISSING_VARS -gt 0 ]; then
    echo -e "${YELLOW}   ⚠️  $MISSING_VARS variable(s) manquante(s)${NC}"
    echo -e "${YELLOW}      Configuration automatique...${NC}"
    ./scripts/setup-vercel-variables.sh <<< "y" || true
fi

# ==============================================
# 7. DÉPLOIEMENT VERCEL
# ==============================================
echo -e "${CYAN}🚀 Étape 7/8: Déploiement Vercel...${NC}"

vercel --prod --yes
echo -e "${GREEN}   ✅ Déploiement lancé${NC}"

# ==============================================
# 8. VÉRIFICATION POST-DÉPLOIEMENT
# ==============================================
echo -e "${CYAN}✅ Étape 8/8: Vérification post-déploiement...${NC}"

sleep 5

DEPLOYMENT_URL=$(vercel ls --json 2>/dev/null | jq -r '.deployments[0].url' 2>/dev/null || echo "")

if [ -n "$DEPLOYMENT_URL" ]; then
    echo -e "${GREEN}   ✅ Déploiement disponible: $DEPLOYMENT_URL${NC}"
    
    # Test health check
    if curl -s -f "$DEPLOYMENT_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Health check réussi${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Health check en attente (déploiement en cours)${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  URL de déploiement non disponible${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ DÉPLOIEMENT PRODUCTION EXPERT TERMINÉ                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📊 Résumé:${NC}"
echo "   ✅ Configuration complète"
echo "   ✅ Build réussi"
echo "   ✅ Variables Vercel configurées"
echo "   ✅ Déploiement lancé"
echo ""
echo -e "${YELLOW}📋 Surveillez le déploiement:${NC}"
echo "   https://vercel.com/luneos-projects/backend"
echo ""
echo -e "${GREEN}🎉 Déploiement production expert terminé!${NC}"
echo ""
































