#!/bin/bash
# Script de déploiement complet sur Railway avec token et toutes les variables

set -e

PROJECT_ID="9b6c45fe-e44b-4fad-ba21-e88df51a39e4"
RAILWAY_TOKEN="${RAILWAY_TOKEN:-}"
RAILWAY_API_URL="https://backboard.railway.com/graphql/v2"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/apps/backend"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$BACKEND_DIR"

echo -e "${BLUE}🚀 Déploiement complet sur Railway${NC}"
echo ""

# Étape 1: Lier le projet avec Railway CLI
echo -e "${BLUE}📋 Étape 1: Liaison du projet Railway...${NC}"
export RAILWAY_TOKEN

if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI n'est pas installé${NC}"
    exit 1
fi

# Lier le projet
railway link --project "$PROJECT_ID" 2>&1 || {
    echo -e "${YELLOW}⚠️  Projet déjà lié ou erreur de liaison${NC}"
}

echo -e "${GREEN}✅ Projet lié${NC}"
echo ""

# Étape 2: Obtenir l'ID du service
echo -e "${BLUE}📋 Étape 2: Récupération de l'ID du service...${NC}"

SERVICES_QUERY=$(cat <<EOF
{
  "query": "query { project(id: \"$PROJECT_ID\") { services { edges { node { id name } } } } }"
}
EOF
)

SERVICES_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$SERVICES_QUERY" \
  "$RAILWAY_API_URL")

if command -v jq &> /dev/null; then
    SERVICE_ID=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[]?.node.id' | head -1)
    SERVICE_NAME=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[]?.node.name' | head -1)
else
    SERVICE_ID=$(echo "$SERVICES_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4 || echo "")
fi

if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" = "null" ]; then
    echo -e "${YELLOW}⚠️  Aucun service trouvé, création d'un nouveau service...${NC}"
    
    CREATE_SERVICE_MUTATION=$(cat <<EOF
{
  "query": "mutation { serviceCreate(input: { projectId: \"$PROJECT_ID\", name: \"backend\" }) { service { id name } } }"
}
EOF
)
    
    CREATE_RESPONSE=$(curl -s -X POST \
      -H "Authorization: Bearer $RAILWAY_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$CREATE_SERVICE_MUTATION" \
      "$RAILWAY_API_URL")
    
    if command -v jq &> /dev/null; then
        SERVICE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.serviceCreate.service.id' 2>/dev/null || echo "")
    else
        SERVICE_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4 || echo "")
    fi
fi

if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" = "null" ]; then
    echo -e "${RED}❌ Impossible de créer ou trouver le service${NC}"
    echo "Réponse: $CREATE_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Service ID: ${SERVICE_ID}${NC}"
echo ""

# Étape 3: Configurer le health check path
echo -e "${BLUE}📋 Étape 3: Configuration du health check path...${NC}"

UPDATE_HEALTH_MUTATION=$(cat <<EOF
{
  "query": "mutation { serviceUpdate(input: { id: \"$SERVICE_ID\", healthcheckPath: \"/api/v1/health\" }) { service { id healthcheckPath } } }"
}
EOF
)

UPDATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_HEALTH_MUTATION" \
  "$RAILWAY_API_URL")

if echo "$UPDATE_RESPONSE" | grep -q "errors"; then
    echo -e "${YELLOW}⚠️  Erreur: $(echo "$UPDATE_RESPONSE" | grep -o '"message":"[^"]*' | head -1)${NC}"
else
    echo -e "${GREEN}✅ Health check path configuré: /api/v1/health${NC}"
fi
echo ""

# Étape 4: Configurer le Root Directory
echo -e "${BLUE}📋 Étape 4: Configuration du Root Directory...${NC}"

UPDATE_ROOT_DIR_MUTATION=$(cat <<EOF
{
  "query": "mutation { serviceUpdate(input: { id: \"$SERVICE_ID\", rootDirectory: \"apps/backend\" }) { service { id rootDirectory } } }"
}
EOF
)

ROOT_DIR_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_ROOT_DIR_MUTATION" \
  "$RAILWAY_API_URL")

if echo "$ROOT_DIR_RESPONSE" | grep -q "errors"; then
    echo -e "${YELLOW}⚠️  Erreur lors de la configuration du Root Directory${NC}"
else
    echo -e "${GREEN}✅ Root Directory configuré: apps/backend${NC}"
fi
echo ""

# Étape 5: Configurer les variables d'environnement essentielles
echo -e "${BLUE}📋 Étape 5: Configuration des variables d'environnement essentielles...${NC}"

ESSENTIAL_VARS=(
    "NODE_ENV=production"
    "API_PREFIX=/api/v1"
)

for VAR_LINE in "${ESSENTIAL_VARS[@]}"; do
    VAR_NAME=$(echo "$VAR_LINE" | cut -d'=' -f1)
    VAR_VALUE=$(echo "$VAR_LINE" | cut -d'=' -f2-)
    
    # Échapper les guillemets et backslashes pour JSON
    VAR_VALUE_JSON=$(echo "$VAR_VALUE" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
    
    SET_VAR_MUTATION=$(cat <<EOF
{
  "query": "mutation { variableUpsert(input: { serviceId: \"$SERVICE_ID\", name: \"$VAR_NAME\", value: \"$VAR_VALUE_JSON\" }) { variable { id name } } }"
}
EOF
)
    
    VAR_RESPONSE=$(curl -s -X POST \
      -H "Authorization: Bearer $RAILWAY_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$SET_VAR_MUTATION" \
      "$RAILWAY_API_URL")
    
    if echo "$VAR_RESPONSE" | grep -q "errors"; then
        echo -e "${YELLOW}⚠️  Erreur pour $VAR_NAME${NC}"
    else
        echo -e "${GREEN}✅ $VAR_NAME=${VAR_VALUE}${NC}"
    fi
done
echo ""

# Étape 6: Lire et configurer les variables depuis .env si disponible
echo -e "${BLUE}📋 Étape 6: Lecture des variables depuis .env...${NC}"

ENV_FILES=(
    "$BACKEND_DIR/.env.local"
    "$BACKEND_DIR/.env"
    "$PROJECT_ROOT/.env.local"
    "$PROJECT_ROOT/.env"
)

ENV_FILE=""
for FILE in "${ENV_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        ENV_FILE="$FILE"
        break
    fi
done

if [ -n "$ENV_FILE" ]; then
    echo -e "${GREEN}✅ Fichier .env trouvé: $ENV_FILE${NC}"
    
    # Lire les variables (ignorer commentaires et lignes vides)
    ENV_VARS=$(grep -v '^#' "$ENV_FILE" | grep -v '^$' | grep '=' || echo "")
    
    if [ -n "$ENV_VARS" ]; then
        VAR_COUNT=$(echo "$ENV_VARS" | wc -l | tr -d ' ')
        echo -e "${BLUE}   Configuration de ${VAR_COUNT} variables...${NC}"
        
        IFS=$'\n'
        CONFIGURED=0
        SKIPPED=0
        
        for VAR_LINE in $ENV_VARS; do
            VAR_NAME=$(echo "$VAR_LINE" | cut -d'=' -f1 | xargs)
            VAR_VALUE=$(echo "$VAR_LINE" | cut -d'=' -f2- | xargs)
            
            # Ignorer les variables vides
            if [ -z "$VAR_NAME" ] || [ -z "$VAR_VALUE" ]; then
                SKIPPED=$((SKIPPED + 1))
                continue
            fi
            
            # Ignorer les variables déjà configurées
            if [ "$VAR_NAME" = "NODE_ENV" ] || [ "$VAR_NAME" = "API_PREFIX" ]; then
                SKIPPED=$((SKIPPED + 1))
                continue
            fi
            
            # Échapper les guillemets et backslashes pour JSON
            VAR_VALUE_JSON=$(echo "$VAR_VALUE" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
            
            SET_VAR_MUTATION=$(cat <<EOF
{
  "query": "mutation { variableUpsert(input: { serviceId: \"$SERVICE_ID\", name: \"$VAR_NAME\", value: \"$VAR_VALUE_JSON\" }) { variable { id name } } }"
}
EOF
)
            
            VAR_RESPONSE=$(curl -s -X POST \
              -H "Authorization: Bearer $RAILWAY_TOKEN" \
              -H "Content-Type: application/json" \
              -d "$SET_VAR_MUTATION" \
              "$RAILWAY_API_URL")
            
            if echo "$VAR_RESPONSE" | grep -q "errors"; then
                echo -e "${YELLOW}⚠️  Erreur pour $VAR_NAME${NC}"
            else
                CONFIGURED=$((CONFIGURED + 1))
                if [ $((CONFIGURED % 20)) -eq 0 ]; then
                    echo -e "${BLUE}   ${CONFIGURED} variables configurées...${NC}"
                fi
            fi
        done
        
        echo -e "${GREEN}✅ ${CONFIGURED} variables configurées (${SKIPPED} ignorées)${NC}"
    else
        echo -e "${YELLOW}⚠️  Aucune variable trouvée dans $ENV_FILE${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Aucun fichier .env trouvé${NC}"
    echo "   Les variables essentielles ont été configurées"
fi
echo ""

# Étape 7: Déclencher le déploiement
echo -e "${BLUE}📋 Étape 7: Déclenchement du déploiement...${NC}"

railway up --detach 2>&1 | head -15

echo ""
echo -e "${GREEN}✅ Déploiement déclenché !${NC}"
echo ""
echo "📋 Résumé:"
echo "  - Project ID: $PROJECT_ID"
echo "  - Service ID: $SERVICE_ID"
echo "  - Health Check Path: /api/v1/health"
echo "  - Root Directory: apps/backend"
echo ""
echo "⏳ Attendez 2-3 minutes pour le build..."
echo ""
echo "🔍 Vérification:"
echo "  - Logs: railway logs"
echo "  - Status: railway status"
echo "  - Domain: railway domain"
echo ""

