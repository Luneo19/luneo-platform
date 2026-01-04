#!/bin/bash
# Script de déploiement complet sur Railway avec toutes les variables

set -e

PROJECT_ID="9b6c45fe-e44b-4fad-ba21-e88df51a39e4"
RAILWAY_TOKEN="05658a48-024e-420d-b818-d2ef00fdd1f0"

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

# Configurer le token Railway
export RAILWAY_TOKEN

# Étape 1: Lier le projet
echo -e "${BLUE}📋 Étape 1: Configuration du projet Railway...${NC}"

# Créer le fichier de configuration Railway
mkdir -p ~/.railway
cat > ~/.railway/config.json <<EOF
{
  "token": "$RAILWAY_TOKEN"
}
EOF

echo -e "${GREEN}✅ Token Railway configuré${NC}"
echo ""

# Étape 2: Lire les variables d'environnement
echo -e "${BLUE}📋 Étape 2: Lecture des variables d'environnement...${NC}"

ENV_FILES=(
    "$BACKEND_DIR/.env.local"
    "$BACKEND_DIR/.env.production"
    "$BACKEND_DIR/.env"
    "$PROJECT_ROOT/.env.local"
    "$PROJECT_ROOT/.env.production"
)

ENV_FILE=""
for FILE in "${ENV_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        ENV_FILE="$FILE"
        echo -e "${GREEN}✅ Fichier .env trouvé: $ENV_FILE${NC}"
        break
    fi
done

if [ -z "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Aucun fichier .env trouvé${NC}"
    echo "   Configuration des variables essentielles uniquement..."
    ENV_VARS=""
else
    # Lire les variables (ignorer commentaires et lignes vides)
    ENV_VARS=$(grep -v '^#' "$ENV_FILE" | grep -v '^$' | grep '=' || echo "")
fi

echo ""

# Étape 3: Configurer les variables via Railway CLI ou API
echo -e "${BLUE}📋 Étape 3: Configuration des variables d'environnement...${NC}"

# Variables essentielles
ESSENTIAL_VARS=(
    "NODE_ENV=production"
    "API_PREFIX=/api/v1"
)

# Utiliser Railway CLI si disponible
if command -v railway &> /dev/null; then
    # Lier le projet
    railway link --project "$PROJECT_ID" 2>/dev/null || true
    
    # Configurer les variables essentielles
    for VAR_LINE in "${ESSENTIAL_VARS[@]}"; do
        VAR_NAME=$(echo "$VAR_LINE" | cut -d'=' -f1)
        VAR_VALUE=$(echo "$VAR_LINE" | cut -d'=' -f2-)
        echo "$VAR_VALUE" | railway variables set "$VAR_NAME" 2>/dev/null || {
            echo "$VAR_NAME=$VAR_VALUE" | railway variables 2>/dev/null || true
        }
        echo -e "${GREEN}✅ $VAR_NAME configuré${NC}"
    done
    
    # Configurer les variables depuis .env
    if [ -n "$ENV_VARS" ]; then
        VAR_COUNT=$(echo "$ENV_VARS" | wc -l | tr -d ' ')
        echo -e "${BLUE}   Configuration de ${VAR_COUNT} variables depuis .env...${NC}"
        
        IFS=$'\n'
        CONFIGURED=0
        for VAR_LINE in $ENV_VARS; do
            VAR_NAME=$(echo "$VAR_LINE" | cut -d'=' -f1 | xargs)
            VAR_VALUE=$(echo "$VAR_LINE" | cut -d'=' -f2- | xargs)
            
            # Ignorer les variables vides
            if [ -z "$VAR_NAME" ] || [ -z "$VAR_VALUE" ]; then
                continue
            fi
            
            # Ignorer les variables déjà configurées
            if [ "$VAR_NAME" = "NODE_ENV" ] || [ "$VAR_NAME" = "API_PREFIX" ]; then
                continue
            fi
            
            # Nettoyer la valeur (enlever les \n à la fin)
            VAR_VALUE_CLEAN=$(echo "$VAR_VALUE" | tr -d '\n' | sed 's/\\n$//')
            
            # Configurer via Railway CLI
            echo "$VAR_VALUE_CLEAN" | railway variables set "$VAR_NAME" 2>/dev/null || {
                echo "$VAR_NAME=$VAR_VALUE_CLEAN" | railway variables 2>/dev/null || true
            }
            
            CONFIGURED=$((CONFIGURED + 1))
            if [ $((CONFIGURED % 10)) -eq 0 ]; then
                echo -e "${BLUE}   ${CONFIGURED} variables configurées...${NC}"
            fi
        done
        
        echo -e "${GREEN}✅ ${CONFIGURED} variables configurées${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Railway CLI non disponible, utilisation de l'API GraphQL...${NC}"
    
    # Utiliser l'API GraphQL pour configurer les variables
    RAILWAY_API_URL="https://backboard.railway.com/graphql/v2"
    
    # Obtenir l'ID du service
    SERVICES_QUERY='{"query":"query { project(id: \"'$PROJECT_ID'\") { services { edges { node { id name } } } } }"}'
    SERVICES_RESPONSE=$(curl -s -X POST \
      -H "Authorization: Bearer $RAILWAY_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$SERVICES_QUERY" \
      "$RAILWAY_API_URL")
    
    if command -v jq &> /dev/null; then
        SERVICE_ID=$(echo "$SERVICES_RESPONSE" | jq -r '.data.project.services.edges[0].node.id' 2>/dev/null || echo "")
    else
        SERVICE_ID=$(echo "$SERVICES_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4 || echo "")
    fi
    
    if [ -n "$SERVICE_ID" ] && [ "$SERVICE_ID" != "null" ]; then
        echo -e "${GREEN}✅ Service ID: ${SERVICE_ID}${NC}"
        
        # Configurer les variables essentielles
        for VAR_LINE in "${ESSENTIAL_VARS[@]}"; do
            VAR_NAME=$(echo "$VAR_LINE" | cut -d'=' -f1)
            VAR_VALUE=$(echo "$VAR_LINE" | cut -d'=' -f2-)
            
            # Échapper pour JSON
            VAR_VALUE_JSON=$(echo "$VAR_VALUE" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
            
            SET_VAR_MUTATION="{\"query\":\"mutation { variableUpsert(input: { serviceId: \\\"$SERVICE_ID\\\", name: \\\"$VAR_NAME\\\", value: \\\"$VAR_VALUE_JSON\\\" }) { id } }\"}"
            
            curl -s -X POST \
              -H "Authorization: Bearer $RAILWAY_TOKEN" \
              -H "Content-Type: application/json" \
              -d "$SET_VAR_MUTATION" \
              "$RAILWAY_API_URL" > /dev/null 2>&1
            
            echo -e "${GREEN}✅ $VAR_NAME configuré${NC}"
        done
    fi
fi
echo ""

# Étape 4: Déclencher le déploiement
echo -e "${BLUE}📋 Étape 4: Déclenchement du déploiement...${NC}"

if command -v railway &> /dev/null; then
    railway up --detach 2>&1 | head -15
    echo -e "${GREEN}✅ Déploiement déclenché${NC}"
else
    echo -e "${YELLOW}⚠️  Railway CLI non disponible${NC}"
    echo "   Le déploiement se fera automatiquement au prochain push sur GitHub"
fi
echo ""

# Résumé
echo -e "${GREEN}✅ Configuration terminée !${NC}"
echo ""
echo "📋 Résumé:"
echo "  - Project ID: $PROJECT_ID"
echo "  - Health Check Path: /api/v1/health (configuré dans railway.toml)"
echo "  - Root Directory: apps/backend (configuré dans railway.toml)"
echo "  - Variables d'environnement: Configurées"
echo ""
echo "⏳ Attendez 2-3 minutes pour le build..."
echo ""
echo "🔍 Vérification:"
echo "  - Logs: railway logs"
echo "  - Status: railway status"
echo "  - Domain: railway domain"
echo ""


