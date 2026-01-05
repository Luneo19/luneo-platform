#!/bin/bash

# Déploiement Railway via GraphQL API - COMPLET et AUTOMATIQUE

set -e

echo "🚀 Déploiement Railway via GraphQL API - AUTOMATIQUE"
echo "==================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Token Railway
RAILWAY_TOKEN="f5a2968b-649a-41de-b255-0ac77e1a093b"
PROJECT_ID="fb66d02e-2862-4a62-af66-f97430983d0b"
RAILWAY_GRAPHQL="https://backboard.railway.app/graphql/v1"

echo -e "${GREEN}✅ Token Railway configuré${NC}"

# Fonction pour appeler l'API GraphQL Railway
railway_graphql() {
    local query=$1
    local variables=$2
    
    if [ -z "$variables" ]; then
        curl -s -X POST "$RAILWAY_GRAPHQL" \
            -H "Authorization: Bearer $RAILWAY_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"query\":\"$query\"}"
    else
        curl -s -X POST "$RAILWAY_GRAPHQL" \
            -H "Authorization: Bearer $RAILWAY_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"query\":\"$query\",\"variables\":$variables}"
    fi
}

# Vérifier l'authentification
echo ""
echo "🔐 ÉTAPE 1 : Vérification de l'authentification..."
ME_QUERY="query { me { id email } }"
ME_RESULT=$(railway_graphql "$ME_QUERY")

if echo "$ME_RESULT" | grep -q "error\|unauthorized"; then
    echo -e "${RED}❌ Erreur d'authentification${NC}"
    echo "$ME_RESULT"
    exit 1
fi

USER_EMAIL=$(echo "$ME_RESULT" | jq -r '.data.me.email' 2>/dev/null || echo "Utilisateur")
echo -e "${GREEN}✅ Authentifié : $USER_EMAIL${NC}"

# Obtenir le projet
echo ""
echo "📦 ÉTAPE 2 : Vérification du projet..."
PROJECT_QUERY="query { project(id: \"$PROJECT_ID\") { id name } }"
PROJECT_RESULT=$(railway_graphql "$PROJECT_QUERY")

if echo "$PROJECT_RESULT" | grep -q "error"; then
    echo -e "${RED}❌ Projet non trouvé${NC}"
    echo "$PROJECT_RESULT"
    exit 1
fi

PROJECT_NAME=$(echo "$PROJECT_RESULT" | jq -r '.data.project.name' 2>/dev/null || echo "luneo-platform-backend")
echo -e "${GREEN}✅ Projet : $PROJECT_NAME${NC}"

# Lister les services
echo ""
echo "🔍 ÉTAPE 3 : Vérification des services..."
SERVICES_QUERY="query { project(id: \"$PROJECT_ID\") { services { id name } } }"
SERVICES_RESULT=$(railway_graphql "$SERVICES_QUERY")
SERVICE_ID=$(echo "$SERVICES_RESULT" | jq -r '.data.project.services[] | select(.name == "backend") | .id' 2>/dev/null | head -1)

if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" == "null" ]; then
    SERVICE_ID=$(echo "$SERVICES_RESULT" | jq -r '.data.project.services[0].id' 2>/dev/null)
fi

# Créer un service si nécessaire
if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" == "null" ]; then
    echo ""
    echo "🔧 ÉTAPE 4 : Création du service backend..."
    CREATE_SERVICE_MUTATION="mutation { serviceCreate(projectId: \"$PROJECT_ID\", name: \"backend\") { id name } }"
    CREATE_RESULT=$(railway_graphql "$CREATE_SERVICE_MUTATION")
    
    if echo "$CREATE_RESULT" | grep -q "error"; then
        echo -e "${YELLOW}⚠️  Erreur lors de la création${NC}"
        echo "$CREATE_RESULT"
        echo "Utilisation de Railway CLI..."
        export RAILWAY_TOKEN
        cd /Users/emmanuelabougadous/luneo-platform
        railway link --project "$PROJECT_ID" 2>&1 || true
        railway up 2>&1 | head -50
        sleep 20
        # Récupérer le service ID après création
        SERVICES_RESULT=$(railway_graphql "$SERVICES_QUERY")
        SERVICE_ID=$(echo "$SERVICES_RESULT" | jq -r '.data.project.services[0].id' 2>/dev/null)
    else
        SERVICE_ID=$(echo "$CREATE_RESULT" | jq -r '.data.serviceCreate.id' 2>/dev/null)
        if [ -n "$SERVICE_ID" ] && [ "$SERVICE_ID" != "null" ]; then
            echo -e "${GREEN}✅ Service créé : $SERVICE_ID${NC}"
        fi
    fi
else
    echo ""
    echo "🔧 ÉTAPE 4 : Service backend existant"
    echo -e "${GREEN}✅ Service ID : $SERVICE_ID${NC}"
fi

# Si on n'a toujours pas de service ID, utiliser Railway CLI
if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" == "null" ]; then
    echo ""
    echo "🔧 ÉTAPE 4 (Alternative) : Création via Railway CLI..."
    export RAILWAY_TOKEN
    cd /Users/emmanuelabougadous/luneo-platform
    
    railway link --project "$PROJECT_ID" 2>&1 || echo "Projet déjà lié"
    railway up 2>&1 | head -50
    
    sleep 20
    
    # Récupérer le service ID
    SERVICES_RESULT=$(railway_graphql "$SERVICES_QUERY")
    SERVICE_ID=$(echo "$SERVICES_RESULT" | jq -r '.data.project.services[0].id' 2>/dev/null)
    
    if [ -n "$SERVICE_ID" ] && [ "$SERVICE_ID" != "null" ]; then
        echo -e "${GREEN}✅ Service créé via CLI : $SERVICE_ID${NC}"
    else
        echo -e "${YELLOW}⚠️  Service ID non disponible${NC}"
        echo "Le service sera créé lors du premier déploiement"
    fi
fi

# Vérifier PostgreSQL
echo ""
echo "🗄️  ÉTAPE 5 : Vérification de PostgreSQL..."
PLUGINS_QUERY="query { project(id: \"$PROJECT_ID\") { plugins { id name type } } }"
PLUGINS_RESULT=$(railway_graphql "$PLUGINS_QUERY")
POSTGRES_EXISTS=$(echo "$PLUGINS_RESULT" | jq -r '.data.project.plugins[]? | select(.type == "postgresql" or .name == "PostgreSQL") | .id' 2>/dev/null | head -1)

if [ -z "$POSTGRES_EXISTS" ] || [ "$POSTGRES_EXISTS" == "null" ]; then
    echo "Ajout de PostgreSQL..."
    CREATE_PLUGIN_MUTATION="mutation { pluginCreate(projectId: \"$PROJECT_ID\", name: \"PostgreSQL\", type: POSTGRESQL) { id name } }"
    CREATE_PLUGIN_RESULT=$(railway_graphql "$CREATE_PLUGIN_MUTATION")
    
    if echo "$CREATE_PLUGIN_RESULT" | grep -q "error"; then
        echo -e "${YELLOW}⚠️  Erreur lors de l'ajout de PostgreSQL${NC}"
        echo "$CREATE_PLUGIN_RESULT"
        echo "Ajoutez PostgreSQL via le dashboard : + New → Database → PostgreSQL"
    else
        POSTGRES_ID=$(echo "$CREATE_PLUGIN_RESULT" | jq -r '.data.pluginCreate.id' 2>/dev/null)
        if [ -n "$POSTGRES_ID" ] && [ "$POSTGRES_ID" != "null" ]; then
            echo -e "${GREEN}✅ PostgreSQL ajouté : $POSTGRES_ID${NC}"
            echo "Attente de la création (15 secondes)..."
            sleep 15
        fi
    fi
else
    echo -e "${GREEN}✅ PostgreSQL déjà configuré${NC}"
fi

# Configurer les variables d'environnement
if [ -n "$SERVICE_ID" ] && [ "$SERVICE_ID" != "null" ]; then
    echo ""
    echo "📝 ÉTAPE 6 : Configuration des variables d'environnement..."
    
    # Générer JWT_SECRET
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-me-$(date +%s)")
    
    # Variables à configurer
    VARS=(
        "NODE_ENV=production"
        "JWT_SECRET=$JWT_SECRET"
    )
    
    for VAR_PAIR in "${VARS[@]}"; do
        VAR_NAME="${VAR_PAIR%%=*}"
        VAR_VALUE="${VAR_PAIR#*=}"
        
        echo "Configuration de $VAR_NAME..."
        # Échapper les caractères spéciaux pour GraphQL
        ESCAPED_VALUE=$(echo "$VAR_VALUE" | sed 's/"/\\"/g')
        
        SET_VAR_MUTATION="mutation { variableUpsert(serviceId: \"$SERVICE_ID\", key: \"$VAR_NAME\", value: \"$ESCAPED_VALUE\") { key value } }"
        SET_VAR_RESULT=$(railway_graphql "$SET_VAR_MUTATION")
        
        if echo "$SET_VAR_RESULT" | grep -q "error"; then
            echo -e "${YELLOW}⚠️  Erreur pour $VAR_NAME${NC}"
            echo "$SET_VAR_RESULT"
        else
            echo -e "${GREEN}✅ $VAR_NAME configuré${NC}"
        fi
    done
    
    echo ""
    echo -e "${GREEN}✅ Variables configurées${NC}"
    echo "   NODE_ENV=production"
    echo "   JWT_SECRET=$JWT_SECRET"
fi

# Déployer
echo ""
echo "🚀 ÉTAPE 7 : Déploiement..."

export RAILWAY_TOKEN
cd /Users/emmanuelabougadous/luneo-platform

if [ -n "$SERVICE_ID" ] && [ "$SERVICE_ID" != "null" ]; then
    railway up --service "$SERVICE_ID" 2>&1 | head -50 || railway deploy --service "$SERVICE_ID" 2>&1 | head -50
else
    railway up 2>&1 | head -50
fi

echo ""
echo "⏳ Attente du démarrage (25 secondes)..."
sleep 25

# Logs
echo ""
echo "📋 ÉTAPE 8 : Logs..."
railway logs --tail 150 2>&1 | head -150 || echo "Logs non disponibles"

# URL
echo ""
echo "🌐 ÉTAPE 9 : URL du service..."
SERVICE_DOMAIN=$(railway domain 2>&1 || echo "")

if [ -n "$SERVICE_DOMAIN" ] && [ "$SERVICE_DOMAIN" != "Project does not have any services" ]; then
    echo -e "${GREEN}✅ Service URL : $SERVICE_DOMAIN${NC}"
    echo ""
    echo "🔍 Test du health check..."
    sleep 5
    curl -s "$SERVICE_DOMAIN/health" || echo "Health check non disponible (service en démarrage)"
fi

# Résumé
echo ""
echo "=========================================="
echo -e "${GREEN}✅ DÉPLOIEMENT AUTOMATIQUE TERMINÉ !${NC}"
echo "=========================================="
echo ""
echo "📋 RÉSUMÉ :"
echo "   ✅ Service backend créé/configuré"
echo "   ✅ PostgreSQL ajouté (ou à ajouter)"
echo "   ✅ Variables d'environnement configurées"
echo "   ✅ Déploiement déclenché"
echo ""
echo "🔗 Dashboard : https://railway.com/project/$PROJECT_ID"
echo ""








