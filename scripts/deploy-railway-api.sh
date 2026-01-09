#!/bin/bash

# Déploiement Railway via API
# Utilise l'API Railway directement avec un token

set -e

echo "🚀 Déploiement Railway via API"
echo "=============================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier le token
if [ -z "$RAILWAY_TOKEN" ]; then
    echo -e "${RED}❌ RAILWAY_TOKEN requis${NC}"
    echo ""
    echo "Pour obtenir votre token :"
    echo "1. Aller sur https://railway.app/account/tokens"
    echo "2. Créer un nouveau token"
    echo "3. Exporter : export RAILWAY_TOKEN=votre-token"
    exit 1
fi

RAILWAY_API="https://api.railway.app/v1"

# Fonction pour appeler l'API Railway
railway_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $RAILWAY_TOKEN" \
            -H "Content-Type: application/json" \
            "$RAILWAY_API$endpoint"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $RAILWAY_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$RAILWAY_API$endpoint"
    fi
}

# Obtenir l'utilisateur
echo "🔍 Vérification de l'authentification..."
USER=$(railway_api GET "/user")
if echo "$USER" | grep -q "error"; then
    echo -e "${RED}❌ Erreur d'authentification${NC}"
    echo "$USER"
    exit 1
fi

echo -e "${GREEN}✅ Authentifié${NC}"

# Lister les projets
echo ""
echo "📋 Projets disponibles :"
PROJECTS=$(railway_api GET "/projects")
echo "$PROJECTS" | jq -r '.projects[] | "\(.id) - \(.name)"' 2>/dev/null || echo "$PROJECTS"

# Si PROJECT_ID est défini, l'utiliser
if [ -n "$RAILWAY_PROJECT_ID" ]; then
    PROJECT_ID="$RAILWAY_PROJECT_ID"
    echo ""
    echo -e "${GREEN}✅ Utilisation du projet: $PROJECT_ID${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Définir RAILWAY_PROJECT_ID${NC}"
    echo "   export RAILWAY_PROJECT_ID=votre-project-id"
    exit 1
fi

# Obtenir les services du projet
echo ""
echo "🔍 Services du projet..."
SERVICES=$(railway_api GET "/projects/$PROJECT_ID/services")
echo "$SERVICES" | jq -r '.services[] | "\(.id) - \(.name)"' 2>/dev/null || echo "$SERVICES"

# Déclencher un déploiement
if [ -n "$RAILWAY_SERVICE_ID" ]; then
    echo ""
    echo "🚀 Déclenchement du déploiement..."
    DEPLOYMENT=$(railway_api POST "/services/$RAILWAY_SERVICE_ID/deployments" '{}')
    echo "$DEPLOYMENT" | jq '.' 2>/dev/null || echo "$DEPLOYMENT"
    echo -e "${GREEN}✅ Déploiement déclenché${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Définir RAILWAY_SERVICE_ID pour déployer${NC}"
    echo "   export RAILWAY_SERVICE_ID=votre-service-id"
fi

echo ""
echo -e "${GREEN}✅ Script terminé${NC}"











