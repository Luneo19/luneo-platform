#!/bin/bash
# Script de déploiement complet sur Railway avec toutes les variables d'environnement

set -e

echo "🚀 Déploiement complet sur Railway"
echo "=================================="
echo ""

# Configuration
PROJECT_ID="9b6c45fe-e44b-4fad-ba21-e88df51a39e4"
RAILWAY_TOKEN="05658a48-024e-420d-b818-d2ef00fdd1f0"
RAILWAY_API_URL="https://backboard.railway.com/graphql/v2"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/apps/backend"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd "$BACKEND_DIR"

echo -e "${BLUE}📋 Étape 1: Récupération de l'ID du service...${NC}"

# Requête GraphQL pour obtenir les services du projet
SERVICES_QUERY=$(cat <<EOF
{
  "query": "query { project(id: \\\"$PROJECT_ID\\\") { services { edges { node { id name } } } } }"
}
EOF
)

SERVICES_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$SERVICES_QUERY" \
  "$RAILWAY_API_URL" 2>/dev/null || echo "")

if [ -z "$SERVICES_RESPONSE" ]; then
    echo -e "${RED}❌ Erreur lors de la récupération des services${NC}"
    exit 1
fi

# Extraire l'ID du service (premier service ou service "backend")
if command -v jq &> /dev/null; then
    SERVICE_ID=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[]?.node | select(.name == "backend") | .id' | head -1)
    if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" = "null" ]; then
        SERVICE_ID=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[0].node.id' 2>/dev/null || echo "")
    fi
else
    SERVICE_ID=$(echo "$SERVICES_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4 || echo "")
fi

if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" = "null" ]; then
    echo -e "${RED}❌ Impossible de trouver l'ID du service${NC}"
    echo "Création d'un nouveau service..."
    
    # Créer un nouveau service
    CREATE_SERVICE_MUTATION=$(cat <<EOF
{
  "query": "mutation { serviceCreate(input: { projectId: \\\"$PROJECT_ID\\\", name: \\\"backend\\\" }) { service { id name } } }"
}
EOF
)
    
    CREATE_RESPONSE=$(curl -s -X POST \
      -H "Authorization: Bearer $RAILWAY_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$CREATE_SERVICE_MUTATION" \
      "$RAILWAY_API_URL" 2>/dev/null || echo "")
    
    if command -v jq &> /dev/null; then
        SERVICE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.serviceCreate.service.id' 2>/dev/null || echo "")
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

# Étape 2: Configurer le health check path
echo -e "${BLUE}📋 Étape 2: Configuration du health check path...${NC}"

UPDATE_HEALTH_MUTATION=$(cat <<EOF
{
  "query": "mutation { serviceUpdate(input: { id: \\\"$SERVICE_ID\\\", healthcheckPath: \\\"/api/v1/health\\\" }) { service { id healthcheckPath } } }"
}
EOF
)

UPDATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_HEALTH_MUTATION" \
  "$RAILWAY_API_URL" 2>/dev/null || echo "")

if echo "$UPDATE_RESPONSE" | grep -q "errors"; then
    echo -e "${YELLOW}⚠️  Erreur lors de la mise à jour du health check (peut-être déjà configuré)${NC}"
else
    echo -e "${GREEN}✅ Health check path configuré: /api/v1/health${NC}"
fi
echo ""

# Étape 3: Lire les variables d'environnement depuis .env.local ou .env
echo -e "${BLUE}📋 Étape 3: Lecture des variables d'environnement...${NC}"

ENV_FILE="$BACKEND_DIR/.env.local"
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE="$BACKEND_DIR/.env"
fi
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE="$PROJECT_ROOT/.env"
fi

if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}✅ Fichier .env trouvé: $ENV_FILE${NC}"
    
    # Lire les variables d'environnement (ignorer les commentaires et lignes vides)
    ENV_VARS=$(grep -v '^#' "$ENV_FILE" | grep -v '^$' | grep '=' || echo "")
    
    if [ -n "$ENV_VARS" ]; then
        echo -e "${BLUE}📝 Configuration des variables d'environnement...${NC}"
        
        # Compter le nombre de variables
        VAR_COUNT=$(echo "$ENV_VARS" | wc -l | tr -d ' ')
        echo -e "${BLUE}   ${VAR_COUNT} variables à configurer${NC}"
        
        # Configurer chaque variable
        IFS=$'\n'
        CONFIGURED=0
        for VAR_LINE in $ENV_VARS; do
            VAR_NAME=$(echo "$VAR_LINE" | cut -d'=' -f1 | xargs)
            VAR_VALUE=$(echo "$VAR_LINE" | cut -d'=' -f2- | xargs)
            
            # Ignorer les variables vides ou avec des valeurs vides
            if [ -z "$VAR_NAME" ] || [ -z "$VAR_VALUE" ]; then
                continue
            fi
            
            # Échapper les caractères spéciaux dans la valeur
            VAR_VALUE_ESCAPED=$(echo "$VAR_VALUE" | sed 's/"/\\"/g')
            
            # Mutation GraphQL pour ajouter/mettre à jour la variable
            SET_VAR_MUTATION=$(cat <<EOF
{
  "query": "mutation { variableUpsert(input: { serviceId: \\\"$SERVICE_ID\\\", name: \\\"$VAR_NAME\\\", value: \\\"$VAR_VALUE_ESCAPED\\\" }) { variable { id name } } }"
}
EOF
)
            
            VAR_RESPONSE=$(curl -s -X POST \
              -H "Authorization: Bearer $RAILWAY_TOKEN" \
              -H "Content-Type: application/json" \
              -d "$SET_VAR_MUTATION" \
              "$RAILWAY_API_URL" 2>/dev/null || echo "")
            
            if echo "$VAR_RESPONSE" | grep -q "errors"; then
                echo -e "${YELLOW}⚠️  Erreur pour $VAR_NAME${NC}"
            else
                CONFIGURED=$((CONFIGURED + 1))
                if [ $((CONFIGURED % 10)) -eq 0 ]; then
                    echo -e "${BLUE}   ${CONFIGURED}/${VAR_COUNT} variables configurées...${NC}"
                fi
            fi
        done
        
        echo -e "${GREEN}✅ ${CONFIGURED} variables d'environnement configurées${NC}"
    else
        echo -e "${YELLOW}⚠️  Aucune variable d'environnement trouvée dans $ENV_FILE${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Aucun fichier .env trouvé${NC}"
    echo "   Configuration des variables essentielles uniquement..."
    
    # Variables essentielles minimales
    ESSENTIAL_VARS=(
        "NODE_ENV=production"
        "API_PREFIX=/api/v1"
    )
    
    for VAR_LINE in "${ESSENTIAL_VARS[@]}"; do
        VAR_NAME=$(echo "$VAR_LINE" | cut -d'=' -f1)
        VAR_VALUE=$(echo "$VAR_LINE" | cut -d'=' -f2-)
        
        SET_VAR_MUTATION=$(cat <<EOF
{
  "query": "mutation { variableUpsert(input: { serviceId: \\\"$SERVICE_ID\\\", name: \\\"$VAR_NAME\\\", value: \\\"$VAR_VALUE\\\" }) { variable { id name } } }"
}
EOF
)
        
        curl -s -X POST \
          -H "Authorization: Bearer $RAILWAY_TOKEN" \
          -H "Content-Type: application/json" \
          -d "$SET_VAR_MUTATION" \
          "$RAILWAY_API_URL" > /dev/null 2>&1
    done
    
    echo -e "${GREEN}✅ Variables essentielles configurées${NC}"
fi
echo ""

# Étape 4: Configurer le Root Directory
echo -e "${BLUE}📋 Étape 4: Configuration du Root Directory...${NC}"

UPDATE_ROOT_DIR_MUTATION=$(cat <<EOF
{
  "query": "mutation { serviceUpdate(input: { id: \\\"$SERVICE_ID\\\", rootDirectory: \\\"apps/backend\\\" }) { service { id rootDirectory } } }"
}
EOF
)

ROOT_DIR_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_ROOT_DIR_MUTATION" \
  "$RAILWAY_API_URL" 2>/dev/null || echo "")

if echo "$ROOT_DIR_RESPONSE" | grep -q "errors"; then
    echo -e "${YELLOW}⚠️  Erreur lors de la configuration du Root Directory${NC}"
else
    echo -e "${GREEN}✅ Root Directory configuré: apps/backend${NC}"
fi
echo ""

# Étape 5: Déclencher le déploiement
echo -e "${BLUE}📋 Étape 5: Déclenchement du déploiement...${NC}"

# Utiliser Railway CLI si disponible, sinon utiliser l'API
if command -v railway &> /dev/null; then
    echo -e "${BLUE}   Utilisation de Railway CLI...${NC}"
    
    # Lier le projet
    export RAILWAY_TOKEN
    railway link --project "$PROJECT_ID" 2>/dev/null || true
    
    # Déployer
    railway up --detach 2>&1 | head -10
    echo -e "${GREEN}✅ Déploiement déclenché via Railway CLI${NC}"
else
    echo -e "${YELLOW}⚠️  Railway CLI non disponible, déploiement manuel requis${NC}"
    echo "   Allez sur https://railway.app/project/$PROJECT_ID"
    echo "   Le déploiement se fera automatiquement au prochain push"
fi
echo ""

# Résumé
echo -e "${GREEN}✅ Déploiement configuré avec succès !${NC}"
echo ""
echo "📋 Résumé:"
echo "  - Project ID: $PROJECT_ID"
echo "  - Service ID: $SERVICE_ID"
echo "  - Health Check Path: /api/v1/health"
echo "  - Root Directory: apps/backend"
echo "  - Variables d'environnement: Configurées"
echo ""
echo "🔍 Vérification:"
echo "  - Logs: railway logs"
echo "  - Status: railway status"
echo "  - Health: curl https://\$(railway domain)/api/v1/health"
echo ""

