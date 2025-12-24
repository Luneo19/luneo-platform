#!/bin/bash

# Script simple pour forcer le déploiement via le dashboard Vercel
# Ouvre les pages de redeploy directement

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  FORCE DÉPLOIEMENT - GUIDE RAPIDE                          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📋 Pour forcer le déploiement, utilisez le Dashboard Vercel:${NC}"
echo ""
echo -e "${CYAN}FRONTEND:${NC}"
echo -e "${GREEN}   1. Ouvrir: https://vercel.com/luneos-projects/frontend${NC}"
echo -e "${YELLOW}   2. Cliquer sur 'Deployments'${NC}"
echo -e "${YELLOW}   3. Cliquer sur les 3 points (⋯) du dernier déploiement${NC}"
echo -e "${YELLOW}   4. Cliquer sur 'Redeploy'${NC}"
echo ""
echo -e "${CYAN}BACKEND:${NC}"
echo -e "${GREEN}   1. Ouvrir: https://vercel.com/luneos-projects/backend${NC}"
echo -e "${YELLOW}   2. Cliquer sur 'Deployments'${NC}"
echo -e "${YELLOW}   3. Cliquer sur les 3 points (⋯) du dernier déploiement${NC}"
echo -e "${YELLOW}   4. Cliquer sur 'Redeploy'${NC}"
echo ""

# Essayer d'ouvrir les pages dans le navigateur (macOS)
if command -v open &> /dev/null; then
    echo -e "${BLUE}🌐 Ouverture des dashboards dans le navigateur...${NC}"
    open "https://vercel.com/luneos-projects/frontend" 2>/dev/null || true
    sleep 1
    open "https://vercel.com/luneos-projects/backend" 2>/dev/null || true
    echo -e "${GREEN}✅ Dashboards ouverts${NC}"
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ALTERNATIVE: VIA CLI                                       ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Si vous avez corrigé le Root Directory dans les paramètres Vercel:${NC}"
echo ""
echo -e "${CYAN}# Frontend${NC}"
echo -e "${GREEN}cd apps/frontend${NC}"
echo -e "${GREEN}vercel --prod --yes${NC}"
echo ""
echo -e "${CYAN}# Backend${NC}"
echo -e "${GREEN}cd apps/backend${NC}"
echo -e "${GREEN}vercel --prod --yes${NC}"
echo ""

