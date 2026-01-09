#!/bin/bash
# Script de déploiement Railway via API directe avec analyse des logs

set -e

PROJECT_ID="${RAILWAY_PROJECT_ID:-0e3eb9ba-6846-4e0e-81d2-bd7da54da971}"
RAILWAY_TOKEN="${RAILWAY_TOKEN:-3d86d8f3-3b3f-41bf-b3ed-45975ddf4a91}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Déploiement Railway via API directe${NC}"
echo "Project ID: $PROJECT_ID"
echo ""

# Test d'authentification
echo -e "${BLUE}📋 Test d'authentification...${NC}"
AUTH_TEST=$(curl -s -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { me { id email } }"}')

if echo "$AUTH_TEST" | grep -q "Not Authorized"; then
  echo -e "${RED}❌ Token Railway invalide ou expiré${NC}"
  echo ""
  echo "Pour obtenir un nouveau token Railway:"
  echo "  1. Allez sur https://railway.app/account/tokens"
  echo "  2. Créez un nouveau token"
  echo "  3. Exportez-le: export RAILWAY_TOKEN='votre-token'"
  echo ""
  echo "Ou utilisez Railway CLI:"
  echo "  railway login"
  echo "  railway link --project $PROJECT_ID"
  echo "  railway up --ci"
  exit 1
fi

echo -e "${GREEN}✅ Authentification réussie${NC}"
echo ""

# Récupérer les services du projet
echo -e "${BLUE}📋 Récupération des services...${NC}"
SERVICES_QUERY='{"query":"query { project(id: \"'$PROJECT_ID'\") { id name services { edges { node { id name } } } } }"}'
SERVICES_RESPONSE=$(curl -s -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$SERVICES_QUERY")

echo "$SERVICES_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SERVICES_RESPONSE"
echo ""

# Récupérer les logs récents
echo -e "${BLUE}📋 Analyse des logs récents...${NC}"
LOGS_QUERY='{"query":"query { project(id: \"'$PROJECT_ID'\") { deployments(first: 5) { edges { node { id status createdAt buildLogs { data } } } } } }"}'
LOGS_RESPONSE=$(curl -s -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$LOGS_QUERY")

echo "$LOGS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGS_RESPONSE"
echo ""

echo -e "${YELLOW}⚠️  Si le token est invalide, utilisez Railway CLI:${NC}"
echo "  railway login"
echo "  railway link --project $PROJECT_ID"
echo "  railway up --ci"


