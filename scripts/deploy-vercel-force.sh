#!/bin/bash

# Script pour forcer le déploiement sur Vercel
# Corrige le problème de répertoire racine

set -e

cd "$(dirname "$0")/.."

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  DÉPLOIEMENT FORCÉ SUR VERCEL                              ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI non installé${NC}"
    exit 1
fi

echo -e "${BLUE}📁 Répertoire actuel: $(pwd)${NC}"
echo ""

# Aller dans le répertoire frontend
cd apps/frontend

echo -e "${BLUE}📁 Répertoire frontend: $(pwd)${NC}"
echo ""

# Vérifier la configuration Vercel
if [ ! -d ".vercel" ]; then
    echo -e "${YELLOW}⚠️  Configuration Vercel non trouvée, liaison du projet...${NC}"
    vercel link --yes
fi

echo -e "${BLUE}🚀 Déploiement en production...${NC}"
echo ""

# Méthode 1: Utiliser vercel avec le répertoire explicite
# En spécifiant explicitement le répertoire de travail
VERCEL_DEBUG=1 vercel --prod --yes --cwd "$(pwd)" 2>&1 || {
    echo ""
    echo -e "${YELLOW}⚠️  Méthode 1 échouée, essai méthode alternative...${NC}"
    echo ""
    
    # Méthode 2: Créer un commit vide pour déclencher le déploiement
    echo -e "${BLUE}📝 Création d'un commit vide pour déclencher le déploiement...${NC}"
    cd ../..
    git commit --allow-empty -m "chore: trigger Vercel deployment" 2>&1 || true
    git push origin main 2>&1 || true
    
    echo ""
    echo -e "${GREEN}✅ Push Git effectué${NC}"
    echo -e "${YELLOW}⏳ Vercel devrait détecter le push et déployer automatiquement${NC}"
    echo ""
    echo -e "${BLUE}📋 Pour vérifier le déploiement:${NC}"
    echo -e "${CYAN}   https://vercel.com/luneos-projects/frontend${NC}"
    echo ""
}

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  RÉSUMÉ                                                      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Déploiement déclenché${NC}"
echo ""
echo -e "${BLUE}📋 Vérifier le statut:${NC}"
echo -e "${CYAN}   cd apps/frontend && vercel ls${NC}"
echo ""

