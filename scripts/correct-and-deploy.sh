#!/bin/bash

# Script pour corriger le Root Directory et déployer

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  CORRECTION ET DÉPLOIEMENT COMPLET                         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}⚠️  PROBLÈME IDENTIFIÉ:${NC}"
echo -e "${RED}   Frontend: Root Directory mal configuré${NC}"
echo -e "${RED}   Cherche: ~/luneo-platform/apps/frontend/apps/frontend${NC}"
echo -e "${GREEN}   Devrait être: apps/frontend${NC}"
echo ""

echo -e "${BLUE}📋 SOLUTION:${NC}"
echo ""
echo -e "${CYAN}1. CORRIGER LE ROOT DIRECTORY (OBLIGATOIRE):${NC}"
echo -e "${YELLOW}   Frontend:${NC}"
echo -e "${GREEN}   → https://vercel.com/luneos-projects/frontend/settings${NC}"
echo -e "${YELLOW}   → Section 'General' → 'Root Directory'${NC}"
echo -e "${YELLOW}   → Définir: ${CYAN}apps/frontend${NC}"
echo -e "${YELLOW}   → Sauvegarder${NC}"
echo ""
echo -e "${CYAN}2. ENSUITE, EXÉCUTER:${NC}"
echo -e "${GREEN}   node scripts/deploy-with-logs.js${NC}"
echo ""

# Essayer d'ouvrir la page de settings
if command -v open &> /dev/null; then
    echo -e "${BLUE}🌐 Ouverture de la page de settings...${NC}"
    open "https://vercel.com/luneos-projects/frontend/settings" 2>/dev/null || true
    echo -e "${GREEN}✅ Page ouverte dans le navigateur${NC}"
    echo ""
    echo -e "${YELLOW}⏳ Après avoir corrigé le Root Directory, appuyez sur Entrée pour continuer...${NC}"
    read -r
fi

echo ""
echo -e "${BLUE}🚀 Déploiement du frontend...${NC}"
cd apps/frontend

# Déployer avec logs complets
vercel --prod --yes 2>&1 | tee /tmp/vercel-deploy.log

DEPLOY_EXIT_CODE=${PIPESTATUS[0]}

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Frontend déployé avec succès!${NC}"
    
    # Extraire l'URL du déploiement
    DEPLOY_URL=$(grep -o 'https://[^ ]*' /tmp/vercel-deploy.log | head -1)
    if [ -n "$DEPLOY_URL" ]; then
        echo -e "${CYAN}🌐 URL: ${DEPLOY_URL}${NC}"
    fi
else
    echo ""
    echo -e "${RED}❌ Erreur de déploiement${NC}"
    echo -e "${YELLOW}📋 Logs complets sauvegardés dans: /tmp/vercel-deploy.log${NC}"
    echo ""
    echo -e "${YELLOW}🔍 Analyse des erreurs:${NC}"
    grep -i "error\|failed\|✖" /tmp/vercel-deploy.log | head -10 || echo "Aucune erreur spécifique trouvée"
fi

cd ../..

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  RÉSUMÉ                                                      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend: Déployé${NC}"
else
    echo -e "${RED}❌ Frontend: Échec (voir logs ci-dessus)${NC}"
fi

echo -e "${GREEN}✅ Backend: Déjà déployé${NC}"
echo ""
echo -e "${BLUE}📋 Vérifier:${NC}"
echo -e "${CYAN}   Frontend: https://vercel.com/luneos-projects/frontend${NC}"
echo -e "${CYAN}   Backend: https://vercel.com/luneos-projects/backend${NC}"
echo ""

