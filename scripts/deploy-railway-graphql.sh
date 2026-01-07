#!/bin/bash
# Script de déploiement Railway via API GraphQL directe

set -e

PROJECT_ID="${RAILWAY_PROJECT_ID:-0e3eb9ba-6846-4e0e-81d2-bd7da54da971}"
RAILWAY_TOKEN="${RAILWAY_TOKEN:-3d86d8f3-3b3f-41bf-b3ed-45975ddf4a91}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

RAILWAY_GRAPHQL="https://backboard.railway.app/graphql/v2"

echo -e "${BLUE}🚀 Déploiement Railway via API GraphQL${NC}"
echo "Project ID: $PROJECT_ID"
echo ""

# Fonction pour appeler l'API GraphQL
railway_graphql() {
    local query=$1
    curl -s -X POST "$RAILWAY_GRAPHQL" \
        -H "Authorization: Bearer $RAILWAY_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"$query\"}"
}

# Test d'authentification
echo -e "${BLUE}📋 Test d'authentification...${NC}"
AUTH_RESPONSE=$(railway_graphql "query { me { id email } }")

if echo "$AUTH_RESPONSE" | grep -q "Not Authorized\|Unauthorized"; then
    echo -e "${RED}❌ Token Railway invalide ou expiré${NC}"
    echo ""
    echo "Réponse API:"
    echo "$AUTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$AUTH_RESPONSE"
    echo ""
    echo "Pour obtenir un nouveau token:"
    echo "  1. Allez sur https://railway.app/account/tokens"
    echo "  2. Créez un nouveau token"
    echo "  3. Exportez-le: export RAILWAY_TOKEN='votre-token'"
    exit 1
fi

echo -e "${GREEN}✅ Authentification réussie${NC}"
ME_INFO=$(echo "$AUTH_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('me', {}).get('email', 'Unknown'))" 2>/dev/null || echo "Unknown")
echo "Utilisateur: $ME_INFO"
echo ""

# Récupérer les services du projet
echo -e "${BLUE}📋 Récupération des services...${NC}"
SERVICES_QUERY="query { project(id: \\\"$PROJECT_ID\\\") { id name services { edges { node { id name } } } } }"
SERVICES_RESPONSE=$(railway_graphql "$SERVICES_QUERY")

if echo "$SERVICES_RESPONSE" | grep -q "errors\|null"; then
    echo -e "${RED}❌ Erreur lors de la récupération des services${NC}"
    echo "$SERVICES_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SERVICES_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Services récupérés${NC}"
echo "$SERVICES_RESPONSE" | python3 -m json.tool 2>/dev/null | grep -A 5 "services" || echo "$SERVICES_RESPONSE"
echo ""

# Récupérer les déploiements récents et leurs logs
echo -e "${BLUE}📋 Analyse des déploiements récents...${NC}"
DEPLOYMENTS_QUERY="query { project(id: \\\"$PROJECT_ID\\\") { deployments(first: 5) { edges { node { id status createdAt buildLogs { data } } } } } }"
DEPLOYMENTS_RESPONSE=$(railway_graphql "$DEPLOYMENTS_QUERY")

echo "$DEPLOYMENTS_RESPONSE" | python3 -m json.tool 2>/dev/null | head -100 || echo "$DEPLOYMENTS_RESPONSE"
echo ""

# Essayer de déclencher un nouveau déploiement
echo -e "${BLUE}📋 Déclenchement d'un nouveau déploiement...${NC}"
echo -e "${YELLOW}⚠️  Le déclenchement via API nécessite l'ID du service${NC}"
echo ""
echo "Pour déclencher un déploiement, utilisez Railway CLI:"
echo "  railway login"
echo "  railway link --project $PROJECT_ID"
echo "  railway up --ci"
echo ""
echo "Ou utilisez le dashboard Railway:"
echo "  https://railway.app/project/$PROJECT_ID"

