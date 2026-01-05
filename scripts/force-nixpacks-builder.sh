#!/bin/bash
# Script pour forcer l'utilisation de Nixpacks via Railway API

set -e

PROJECT_ID="9b6c45fe-e44b-4fad-ba21-e88df51a39e4"
RAILWAY_TOKEN="05658a48-024e-420d-b818-d2ef00fdd1f0"
RAILWAY_API_URL="https://backboard.railway.com/graphql/v2"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Forcer l'utilisation de Nixpacks${NC}"
echo ""

# Obtenir le service ID
SERVICES_QUERY='{"query":"query { project(id: \"'$PROJECT_ID'\") { services { edges { node { id name } } } } }"}'
SERVICES_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$SERVICES_QUERY" \
  "$RAILWAY_API_URL")

if command -v jq &> /dev/null; then
    SERVICE_ID=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[]?.node | select(.name == "lavish-enchantment") | .id' 2>/dev/null || echo "")
    if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" = "null" ]; then
        SERVICE_ID=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[0].node.id' 2>/dev/null || echo "")
    fi
else
    SERVICE_ID=$(echo "$SERVICES_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4 || echo "")
fi

if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" = "null" ]; then
    echo -e "${RED}❌ Service non trouvé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Service ID: ${SERVICE_ID}${NC}"
echo ""

# Forcer Nixpacks (via buildSettings)
echo -e "${BLUE}📋 Configuration du builder sur Nixpacks...${NC}"

# Note: L'API Railway GraphQL peut nécessiter une mutation spécifique
# Pour l'instant, on va donner les instructions manuelles
echo -e "${YELLOW}⚠️  L'API Railway ne permet pas de changer le builder directement${NC}"
echo ""
echo -e "${BLUE}📋 Instructions manuelles:${NC}"
echo ""
echo "1. Allez sur Railway Dashboard:"
echo "   https://railway.com/project/$PROJECT_ID/service/$SERVICE_ID"
echo ""
echo "2. Cliquez sur 'Settings'"
echo ""
echo "3. Section 'Build' → 'Builder'"
echo ""
echo "4. Changez de 'Railpack' à 'Nixpacks'"
echo ""
echo "5. Sauvegardez"
echo ""
echo "6. Railway redéploiera automatiquement"
echo ""



