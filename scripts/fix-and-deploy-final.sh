#!/bin/bash

# Script final pour corriger et déployer

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  SOLUTION FINALE - CORRECTION ET DÉPLOIEMENT              ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}🔴 PROBLÈME:${NC}"
echo -e "${RED}   Vercel cherche: ~/luneo-platform/apps/frontend/apps/frontend${NC}"
echo -e "${RED}   Mais le chemin devrait être: apps/frontend${NC}"
echo ""

echo -e "${BLUE}💡 CAUSE:${NC}"
echo -e "${YELLOW}   Il y a un .git dans apps/frontend qui fait que Vercel CLI${NC}"
echo -e "${YELLOW}   détecte apps/frontend comme repo root${NC}"
echo -e "${YELLOW}   + Root Directory dans Vercel = apps/frontend${NC}"
echo -e "${YELLOW}   = Doublon: apps/frontend/apps/frontend${NC}"
echo ""

echo -e "${GREEN}✅ SOLUTION APPLIQUÉE:${NC}"
echo -e "${CYAN}   1. Suppression du .git dans apps/frontend${NC}"
echo -e "${CYAN}   2. Vidage du project-settings.json local${NC}"
echo ""

echo -e "${BLUE}📋 ACTION REQUISE DANS VERCEL:${NC}"
echo -e "${YELLOW}   Le Root Directory dans Vercel doit être VIDE${NC}"
echo ""
echo -e "${CYAN}   Étapes:${NC}"
echo -e "${GREEN}   1. https://vercel.com/luneos-projects/frontend/settings/build-and-deployment${NC}"
echo -e "${GREEN}   2. Section 'Root Directory'${NC}"
echo -e "${GREEN}   3. EFFACER 'apps/frontend'${NC}"
echo -e "${GREEN}   4. Laisser VIDE${NC}"
echo -e "${GREEN}   5. Sauvegarder${NC}"
echo ""

# Ouvrir la page
if command -v open &> /dev/null; then
    open "https://vercel.com/luneos-projects/frontend/settings/build-and-deployment" 2>/dev/null || true
    echo -e "${GREEN}✅ Page ouverte dans le navigateur${NC}"
fi

echo ""
echo -e "${YELLOW}⏳ Après avoir vidé le Root Directory dans Vercel,${NC}"
echo -e "${YELLOW}   appuyez sur Entrée pour déployer...${NC}"
read -r

echo ""
echo -e "${BLUE}🚀 Déploiement...${NC}"
echo ""

cd apps/frontend

# Déployer avec logs complets
vercel --prod --yes 2>&1 | tee /tmp/vercel-frontend-deploy.log

EXIT_CODE=${PIPESTATUS[0]}

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Frontend déployé avec succès!${NC}"
    
    DEPLOY_URL=$(grep -o 'https://[^ ]*\.vercel\.app' /tmp/vercel-frontend-deploy.log | head -1)
    if [ -n "$DEPLOY_URL" ]; then
        echo -e "${CYAN}🌐 URL: ${DEPLOY_URL}${NC}"
    fi
else
    echo ""
    echo -e "${RED}❌ Erreur de déploiement${NC}"
    echo -e "${YELLOW}📋 Logs sauvegardés dans: /tmp/vercel-frontend-deploy.log${NC}"
    echo ""
    echo -e "${YELLOW}🔍 Dernières erreurs:${NC}"
    grep -i "error\|failed\|✖" /tmp/vercel-frontend-deploy.log | tail -5 || echo "Aucune erreur spécifique"
fi

cd ../..

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  RÉSUMÉ                                                      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend: Déployé${NC}"
else
    echo -e "${RED}❌ Frontend: Échec${NC}"
    echo -e "${YELLOW}   Assurez-vous d'avoir vidé le Root Directory dans Vercel${NC}"
fi

echo -e "${GREEN}✅ Backend: Déjà déployé${NC}"
echo ""

