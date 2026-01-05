#!/bin/bash
# Vérification du statut Railway et des logs

set -e

PROJECT_ID="9b6c45fe-e44b-4fad-ba21-e88df51a39e4"
RAILWAY_TOKEN="05658a48-024e-420d-b818-d2ef00fdd1f0"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

export RAILWAY_TOKEN

echo -e "${BLUE}🔍 Vérification du statut Railway${NC}"
echo ""

cd /Users/emmanuelabougadous/luneo-platform/apps/backend

# Vérifier le statut
echo -e "${BLUE}📋 Statut du projet...${NC}"
railway status 2>&1 || echo "⚠️  Impossible d'obtenir le statut"
echo ""

# Lister les services
echo -e "${BLUE}📋 Services disponibles...${NC}"
railway service list 2>&1 || echo "⚠️  Aucun service trouvé"
echo ""

# Si un service est disponible, obtenir les logs
SERVICE_ID=$(railway service 2>&1 | grep -o '[a-f0-9-]\{36\}' | head -1 || echo "")

if [ -n "$SERVICE_ID" ]; then
    echo -e "${GREEN}✅ Service trouvé: $SERVICE_ID${NC}"
    echo ""
    
    echo -e "${BLUE}📋 Derniers logs (50 lignes)...${NC}"
    railway logs --service "$SERVICE_ID" --tail 50 2>&1 | head -60 || echo "⚠️  Impossible d'obtenir les logs"
    echo ""
    
    echo -e "${BLUE}📋 Logs récents avec filtres...${NC}"
    railway logs --service "$SERVICE_ID" --tail 200 2>&1 | grep -E "(Bootstrap|Starting|Application|listening|Health|Routes|Error|error|Failed|NestJS)" | head -30 || echo "⚠️  Aucun log filtré trouvé"
    echo ""
    
    echo -e "${BLUE}📋 Domaine...${NC}"
    railway domain --service "$SERVICE_ID" 2>&1 || echo "⚠️  Domaine pas encore disponible"
    echo ""
else
    echo -e "${YELLOW}⚠️  Aucun service trouvé${NC}"
    echo ""
    echo "📋 Pour créer un service:"
    echo "  1. Allez sur https://railway.app/project/$PROJECT_ID"
    echo "  2. Cliquez sur 'New' → 'GitHub Repo'"
    echo "  3. Sélectionnez: luneo-platform"
    echo "  4. Configurez Root Directory: apps/backend"
    echo ""
fi

echo -e "${GREEN}✅ Vérification terminée${NC}"
echo ""



