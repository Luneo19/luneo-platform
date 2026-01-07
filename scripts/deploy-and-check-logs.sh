#!/bin/bash
# Déploiement et vérification des logs via API Railway

set -e

PROJECT_ID="9b6c45fe-e44b-4fad-ba21-e88df51a39e4"
RAILWAY_TOKEN="${RAILWAY_TOKEN:-}"
RAILWAY_API_URL="https://backboard.railway.com/graphql/v2"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Déploiement et vérification des logs${NC}"
echo ""

# Obtenir les services
echo -e "${BLUE}📋 Récupération des services...${NC}"
SERVICES_QUERY='{"query":"query { project(id: \"'$PROJECT_ID'\") { services { edges { node { id name } } } } }"}'
SERVICES_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$SERVICES_QUERY" \
  "$RAILWAY_API_URL")

if command -v jq &> /dev/null; then
    SERVICE_IDS=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[].node.id' 2>/dev/null || echo "")
    SERVICE_NAMES=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[].node.name' 2>/dev/null || echo "")
else
    SERVICE_IDS=$(echo "$SERVICES_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 || echo "")
fi

if [ -z "$SERVICE_IDS" ]; then
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
    
    if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" = "null" ]; then
        echo -e "${RED}❌ Impossible de créer le service${NC}"
        echo "Réponse: $CREATE_RESPONSE"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Service créé: $SERVICE_ID${NC}"
else
    # Utiliser le premier service ou celui nommé "backend"
    if command -v jq &> /dev/null; then
        SERVICE_ID=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[] | select(.node.name == "backend" or .node.name == null) | .node.id' | head -1)
        if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" = "null" ]; then
            SERVICE_ID=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[0].node.id' 2>/dev/null || echo "")
        fi
    else
        SERVICE_ID=$(echo "$SERVICE_IDS" | head -1)
    fi
    
    echo -e "${GREEN}✅ Service trouvé: $SERVICE_ID${NC}"
fi
echo ""

# Déclencher un nouveau déploiement
echo -e "${BLUE}📋 Déclenchement d'un nouveau déploiement...${NC}"
DEPLOY_MUTATION='{"query":"mutation { deploymentCreate(input: { serviceId: \"'$SERVICE_ID'\", restart: true }) { id status } }"}'
DEPLOY_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DEPLOY_MUTATION" \
  "$RAILWAY_API_URL")

if echo "$DEPLOY_RESPONSE" | grep -q "errors"; then
    echo -e "${YELLOW}⚠️  Erreur lors du déploiement${NC}"
    echo "$DEPLOY_RESPONSE" | grep -o '"message":"[^"]*' | head -1 | cut -d'"' -f4 || echo "$DEPLOY_RESPONSE"
else
    if command -v jq &> /dev/null; then
        DEPLOYMENT_ID=$(echo "$DEPLOY_RESPONSE" | jq -r '.data.deploymentCreate.id' 2>/dev/null || echo "")
    else
        DEPLOYMENT_ID=$(echo "$DEPLOY_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4 || echo "")
    fi
    
    if [ -n "$DEPLOYMENT_ID" ] && [ "$DEPLOYMENT_ID" != "null" ]; then
        echo -e "${GREEN}✅ Déploiement déclenché: $DEPLOYMENT_ID${NC}"
    else
        echo -e "${GREEN}✅ Déploiement déclenché${NC}"
    fi
fi
echo ""

# Attendre un peu
echo -e "${BLUE}⏳ Attente de 15 secondes pour le démarrage...${NC}"
sleep 15
echo ""

# Obtenir les logs récents
echo -e "${BLUE}📋 Récupération des logs récents...${NC}"
LOGS_QUERY='{"query":"query { deployments(input: { serviceId: \"'$SERVICE_ID'\", limit: 1 }) { edges { node { id status logs { edges { node { message timestamp } } } } } } }"}'
LOGS_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$LOGS_QUERY" \
  "$RAILWAY_API_URL")

if command -v jq &> /dev/null; then
    echo "$LOGS_RESPONSE" | jq -r '.data.deployments.edges[0].node.logs.edges[].node.message' 2>/dev/null | tail -50 || echo "Aucun log disponible"
else
    echo "$LOGS_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4 | tail -50 || echo "Aucun log disponible"
fi
echo ""

# Obtenir le domaine
echo -e "${BLUE}📋 Récupération du domaine...${NC}"
DOMAIN_QUERY='{"query":"query { service(id: \"'$SERVICE_ID'\") { domains { serviceDomain } } }"}'
DOMAIN_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DOMAIN_QUERY" \
  "$RAILWAY_API_URL")

if command -v jq &> /dev/null; then
    DOMAIN=$(echo "$DOMAIN_RESPONSE" | jq -r '.data.service.domains[0].serviceDomain' 2>/dev/null || echo "")
else
    DOMAIN=$(echo "$DOMAIN_RESPONSE" | grep -o '"serviceDomain":"[^"]*' | head -1 | cut -d'"' -f4 || echo "")
fi

if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "null" ]; then
    DOMAIN_URL="https://$DOMAIN"
    echo -e "${GREEN}✅ Domain: $DOMAIN_URL${NC}"
    echo ""
    echo -e "${BLUE}🔍 Test du health check...${NC}"
    HEALTH_RESPONSE=$(curl -s "$DOMAIN_URL/api/v1/health" 2>/dev/null || echo "")
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN_URL/api/v1/health" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Health check OK (HTTP $HTTP_CODE)${NC}"
        echo "$HEALTH_RESPONSE" | head -5
    else
        echo -e "${YELLOW}⚠️  Health check: HTTP $HTTP_CODE${NC}"
        echo "$HEALTH_RESPONSE" | head -5
    fi
else
    echo -e "${YELLOW}⚠️  Domain pas encore disponible${NC}"
fi
echo ""

echo -e "${GREEN}✅ Vérification terminée !${NC}"
echo ""
echo "📋 Résumé:"
echo "  - Service ID: $SERVICE_ID"
if [ -n "$DEPLOYMENT_ID" ] && [ "$DEPLOYMENT_ID" != "null" ]; then
    echo "  - Deployment ID: $DEPLOYMENT_ID"
fi
if [ -n "$DOMAIN_URL" ]; then
    echo "  - Domain: $DOMAIN_URL"
fi
echo ""





