#!/bin/bash
# Configuration du service Railway via API GraphQL

set -e

PROJECT_ID="9b6c45fe-e44b-4fad-ba21-e88df51a39e4"
RAILWAY_TOKEN="${RAILWAY_TOKEN:-}"
RAILWAY_API_URL="https://backboard.railway.com/graphql/v2"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Configuration du service Railway via API${NC}"
echo ""

# Obtenir les services
SERVICES_QUERY='{"query":"query { project(id: \"'$PROJECT_ID'\") { services { edges { node { id name } } } } }"}'
SERVICES_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$SERVICES_QUERY" \
  "$RAILWAY_API_URL")

if command -v jq &> /dev/null; then
    SERVICE_ID=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[]?.node | select(.name == "backend" or .name == null) | .id' | head -1)
    if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" = "null" ]; then
        SERVICE_ID=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[0].node.id' 2>/dev/null || echo "")
    fi
    SERVICE_NAME=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[]?.node | select(.name == "backend" or .name == null) | .name' | head -1)
else
    SERVICE_ID=$(echo "$SERVICES_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4 || echo "")
fi

if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" = "null" ]; then
    echo -e "${RED}❌ Aucun service trouvé${NC}"
    echo "Création d'un nouveau service..."
    
    CREATE_SERVICE_MUTATION='{"query":"mutation { serviceCreate(input: { projectId: \"'$PROJECT_ID'\", name: \"backend\" }) { id name } }"}'
    CREATE_RESPONSE=$(curl -s -X POST \
      -H "Authorization: Bearer $RAILWAY_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$CREATE_SERVICE_MUTATION" \
      "$RAILWAY_API_URL")
    
    if command -v jq &> /dev/null; then
        SERVICE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.serviceCreate.id' 2>/dev/null || echo "")
    else
        SERVICE_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4 || echo "")
    fi
fi

if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" = "null" ]; then
    echo -e "${RED}❌ Impossible de créer ou trouver le service${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Service ID: ${SERVICE_ID}${NC}"
echo ""

# Configurer le health check path
echo -e "${BLUE}📋 Configuration du health check path...${NC}"
UPDATE_HEALTH_MUTATION='{"query":"mutation { serviceUpdate(input: { id: \"'$SERVICE_ID'\", healthcheckPath: \"/api/v1/health\" }) { id healthcheckPath } }"}'
UPDATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_HEALTH_MUTATION" \
  "$RAILWAY_API_URL")

if echo "$UPDATE_RESPONSE" | grep -q "errors"; then
    ERROR_MSG=$(echo "$UPDATE_RESPONSE" | grep -o '"message":"[^"]*' | head -1 | cut -d'"' -f4 || echo "Unknown error")
    echo -e "${YELLOW}⚠️  Erreur: $ERROR_MSG${NC}"
else
    echo -e "${GREEN}✅ Health check path configuré: /api/v1/health${NC}"
fi
echo ""

# Configurer le root directory
echo -e "${BLUE}📋 Configuration du root directory...${NC}"
UPDATE_ROOT_DIR_MUTATION='{"query":"mutation { serviceUpdate(input: { id: \"'$SERVICE_ID'\", rootDirectory: \"apps/backend\" }) { id rootDirectory } }"}'
ROOT_DIR_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_ROOT_DIR_MUTATION" \
  "$RAILWAY_API_URL")

if echo "$ROOT_DIR_RESPONSE" | grep -q "errors"; then
    ERROR_MSG=$(echo "$ROOT_DIR_RESPONSE" | grep -o '"message":"[^"]*' | head -1 | cut -d'"' -f4 || echo "Unknown error")
    echo -e "${YELLOW}⚠️  Erreur: $ERROR_MSG${NC}"
else
    echo -e "${GREEN}✅ Root directory configuré: apps/backend${NC}"
fi
echo ""

echo -e "${GREEN}✅ Configuration terminée !${NC}"
echo ""
echo "📋 Service configuré:"
echo "  - Service ID: $SERVICE_ID"
echo "  - Health Check Path: /api/v1/health"
echo "  - Root Directory: apps/backend"
echo ""





