#!/bin/bash
# Script automatique pour configurer le health check Railway via API GraphQL
# Ce script configure automatiquement Railway pour utiliser /api/v1/health

set -e

echo "🚀 Configuration automatique du health check Railway via API GraphQL..."
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI n'est pas installé${NC}"
    echo "Installation: curl -fsSL https://railway.com/install.sh | sh"
    exit 1
fi

# Vérifier que l'utilisateur est connecté
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vous n'êtes pas connecté à Railway${NC}"
    echo "Connexion..."
    railway login
fi

echo -e "${GREEN}✅ Railway CLI configuré${NC}"
echo ""

# Obtenir le répertoire racine du projet
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/apps/backend"

# Obtenir les informations du service Railway
echo -e "${BLUE}📋 Récupération des informations du service Railway...${NC}"
cd "$BACKEND_DIR"

RAILWAY_STATUS=$(railway status 2>&1)
PROJECT_NAME=$(echo "$RAILWAY_STATUS" | grep "Project:" | awk '{print $2}' || echo "")
SERVICE_NAME=$(echo "$RAILWAY_STATUS" | grep "Service:" | awk '{print $2}' || echo "")

echo -e "${GREEN}✅ Projet: ${PROJECT_NAME}${NC}"
echo -e "${GREEN}✅ Service: ${SERVICE_NAME}${NC}"
echo ""

# Obtenir le token Railway
echo -e "${BLUE}🔑 Récupération du token Railway...${NC}"

# Méthode 1: Depuis la variable d'environnement
if [ -n "$RAILWAY_TOKEN" ]; then
    echo -e "${GREEN}✅ Token Railway trouvé dans RAILWAY_TOKEN${NC}"
    API_TOKEN="$RAILWAY_TOKEN"
# Méthode 2: Depuis le fichier de configuration Railway
elif [ -f "$HOME/.railway/config.json" ]; then
    API_TOKEN=$(cat "$HOME/.railway/config.json" | grep -o '"token":"[^"]*' | cut -d'"' -f4 | head -1 || echo "")
    if [ -n "$API_TOKEN" ]; then
        echo -e "${GREEN}✅ Token Railway trouvé dans ~/.railway/config.json${NC}"
    fi
fi

# Méthode 3: Essayer d'obtenir le token via Railway CLI (si disponible)
if [ -z "$API_TOKEN" ]; then
    # Essayer de récupérer le token depuis Railway CLI
    RAILWAY_WHOAMI_JSON=$(railway whoami --json 2>/dev/null || echo "")
    if [ -n "$RAILWAY_WHOAMI_JSON" ]; then
        API_TOKEN=$(echo "$RAILWAY_WHOAMI_JSON" | grep -o '"token":"[^"]*' | cut -d'"' -f4 | head -1 || echo "")
        if [ -n "$API_TOKEN" ]; then
            echo -e "${GREEN}✅ Token Railway trouvé via Railway CLI${NC}"
        fi
    fi
fi

if [ -z "$API_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Token Railway non trouvé${NC}"
    echo ""
    echo "Pour obtenir un token Railway :"
    echo "1. Allez sur https://railway.app/account/tokens"
    echo "2. Créez un nouveau token"
    echo "3. Exportez-le : export RAILWAY_TOKEN='votre-token'"
    echo "4. Relancez ce script"
    echo ""
    echo "Ou configurez-le manuellement dans Railway Dashboard :"
    echo "  Settings → Health Check → Path: /api/v1/health"
    echo ""
    echo "Tentative de configuration via railway.toml uniquement..."
    
    # Fallback: Mettre à jour seulement railway.toml et redéployer
    echo -e "${BLUE}📝 Configuration du health check dans railway.toml...${NC}"
    cat > "$BACKEND_DIR/railway.toml" << 'EOF'
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/api/v1/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
# Note: Health check uses HealthController at /api/v1/health (with global prefix)
# IMPORTANT: Railway Root Directory doit être configuré sur apps/backend
startCommand = "node dist/src/main.js"

[env]
NODE_ENV = "production"
# PORT est fourni automatiquement par Railway via $PORT
EOF
    
    echo -e "${GREEN}✅ railway.toml mis à jour${NC}"
    echo ""
    echo -e "${BLUE}🚀 Déploiement automatique sur Railway...${NC}"
    cd "$BACKEND_DIR"
    railway up --detach
    
    echo ""
    echo -e "${GREEN}✅ Déploiement déclenché avec railway.toml mis à jour${NC}"
    echo "⏳ Attendez 2-3 minutes pour que Railway prenne en compte la nouvelle configuration"
    echo ""
    exit 0
fi

# URL de l'API GraphQL Railway
RAILWAY_API_URL="https://backboard.railway.com/graphql/v2"

echo ""
echo -e "${BLUE}🔍 Récupération de l'ID du projet et du service...${NC}"

# Requête GraphQL pour obtenir les projets
PROJECTS_QUERY='{
  "query": "query { projects { edges { node { id name } } } }"
}'

PROJECTS_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PROJECTS_QUERY" \
  "$RAILWAY_API_URL" 2>/dev/null || echo "")

if [ -z "$PROJECTS_RESPONSE" ]; then
    echo -e "${RED}❌ Erreur lors de la récupération des projets${NC}"
    echo "Vérifiez que votre token Railway est valide"
    exit 1
fi

# Extraire l'ID du projet (chercher par nom ou utiliser le premier)
if command -v jq &> /dev/null; then
    PROJECT_ID=$(echo "$PROJECTS_RESPONSE" | jq -r '.data.projects.edges[]?.node | select(.name == "'"$PROJECT_NAME"'") | .id' | head -1)
    if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
        PROJECT_ID=$(echo "$PROJECTS_RESPONSE" | jq -r '.data.projects.edges[0].node.id' 2>/dev/null || echo "")
    fi
else
    # Fallback sans jq (extraction basique)
    PROJECT_ID=$(echo "$PROJECTS_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4 || echo "")
fi

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
    echo -e "${RED}❌ Impossible de trouver l'ID du projet${NC}"
    echo "Réponse API: $PROJECTS_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ ID du projet: ${PROJECT_ID}${NC}"

# Requête GraphQL pour obtenir les services du projet
SERVICES_QUERY=$(cat <<EOF
{
  "query": "query { project(id: \\\"$PROJECT_ID\\\") { services { edges { node { id name } } } } }"
}
EOF
)

SERVICES_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$SERVICES_QUERY" \
  "$RAILWAY_API_URL" 2>/dev/null || echo "")

if [ -z "$SERVICES_RESPONSE" ]; then
    echo -e "${RED}❌ Erreur lors de la récupération des services${NC}"
    exit 1
fi

# Extraire l'ID du service
if command -v jq &> /dev/null; then
    SERVICE_ID=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[]?.node | select(.name == "'"$SERVICE_NAME"'") | .id' | head -1)
    if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" = "null" ]; then
        SERVICE_ID=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[0].node.id' 2>/dev/null || echo "")
    fi
else
    # Fallback sans jq
    SERVICE_ID=$(echo "$SERVICES_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4 || echo "")
fi

if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" = "null" ]; then
    echo -e "${RED}❌ Impossible de trouver l'ID du service${NC}"
    echo "Réponse API: $SERVICES_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ ID du service: ${SERVICE_ID}${NC}"
echo ""

# Mettre à jour le health check path
echo -e "${BLUE}🔧 Configuration du health check path à /api/v1/health...${NC}"

UPDATE_MUTATION=$(cat <<EOF
{
  "query": "mutation { serviceUpdate(input: { id: \\\"$SERVICE_ID\\\", healthcheckPath: \\\"/api/v1/health\\\" }) { service { id healthcheckPath } } }"
}
EOF
)

UPDATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_MUTATION" \
  "$RAILWAY_API_URL" 2>/dev/null || echo "")

if [ -z "$UPDATE_RESPONSE" ]; then
    echo -e "${RED}❌ Erreur lors de la mise à jour du health check path${NC}"
    exit 1
fi

# Vérifier la réponse
if echo "$UPDATE_RESPONSE" | grep -q "errors"; then
    echo -e "${RED}❌ Erreur lors de la mise à jour:${NC}"
    echo "$UPDATE_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4 || echo "$UPDATE_RESPONSE"
    exit 1
fi

# Extraire le healthcheckPath mis à jour
if command -v jq &> /dev/null; then
    UPDATED_PATH=$(echo "$UPDATE_RESPONSE" | jq -r '.data.serviceUpdate.service.healthcheckPath' 2>/dev/null || echo "")
else
    UPDATED_PATH=$(echo "$UPDATE_RESPONSE" | grep -o '"healthcheckPath":"[^"]*' | cut -d'"' -f4 || echo "")
fi

if [ "$UPDATED_PATH" = "/api/v1/health" ]; then
    echo -e "${GREEN}✅ Health check path configuré avec succès !${NC}"
    echo -e "${GREEN}   Path: ${UPDATED_PATH}${NC}"
else
    echo -e "${YELLOW}⚠️  Health check path mis à jour mais valeur inattendue: ${UPDATED_PATH}${NC}"
fi

echo ""
echo -e "${GREEN}✅ Configuration automatique terminée !${NC}"
echo ""
echo "📋 Résumé:"
echo "  - Health check path configuré: /api/v1/health"
echo "  - Service ID: ${SERVICE_ID}"
echo "  - Project ID: ${PROJECT_ID}"
echo ""
echo "⏳ Railway va redéployer automatiquement avec la nouvelle configuration"
echo "   Attendez 2-3 minutes puis vérifiez:"
echo "   - Logs: railway logs"
echo "   - Health check: curl https://\$(railway domain)/api/v1/health"
echo ""

