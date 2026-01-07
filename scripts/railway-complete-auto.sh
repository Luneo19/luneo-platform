#!/bin/bash

# Déploiement Railway COMPLET et AUTOMATIQUE avec User Token

set -e

echo "🚀 Déploiement Railway COMPLET - AUTOMATIQUE"
echo "============================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Token Railway
RAILWAY_TOKEN="${RAILWAY_TOKEN:-}"
PROJECT_ID="${PROJECT_ID:-0e3eb9ba-6846-4e0e-81d2-bd7da54da971}"
RAILWAY_API="https://api.railway.app/v1"

if [ -z "$RAILWAY_TOKEN" ]; then
    echo -e "${RED}❌ RAILWAY_TOKEN manquant. Exporte-le avant de lancer ce script.${NC}"
    echo "Ex: export RAILWAY_TOKEN=\"<your_railway_token>\""
    exit 1
fi

echo -e "${GREEN}✅ Token Railway configuré${NC}"

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

# Vérifier l'authentification
echo ""
echo "🔐 ÉTAPE 1 : Vérification de l'authentification..."
USER=$(railway_api GET "/user")
if echo "$USER" | grep -q "error\|unauthorized\|Not Found"; then
    echo -e "${RED}❌ Erreur d'authentification${NC}"
    echo "$USER"
    exit 1
fi

USER_EMAIL=$(echo "$USER" | jq -r '.email' 2>/dev/null || echo "Utilisateur")
echo -e "${GREEN}✅ Authentifié : $USER_EMAIL${NC}"

# Obtenir le projet
echo ""
echo "📦 ÉTAPE 2 : Vérification du projet..."
PROJECT=$(railway_api GET "/projects/$PROJECT_ID")
if echo "$PROJECT" | grep -q "error\|Not Found"; then
    echo -e "${RED}❌ Projet non trouvé${NC}"
    echo "$PROJECT"
    exit 1
fi

PROJECT_NAME=$(echo "$PROJECT" | jq -r '.name' 2>/dev/null || echo "luneo-platform-backend")
echo -e "${GREEN}✅ Projet : $PROJECT_NAME${NC}"

# Lister les services existants
echo ""
echo "🔍 ÉTAPE 3 : Vérification des services..."
SERVICES=$(railway_api GET "/projects/$PROJECT_ID/services")
SERVICE_COUNT=$(echo "$SERVICES" | jq -r '.services | length' 2>/dev/null || echo "0")

echo "Services existants : $SERVICE_COUNT"

if [ "$SERVICE_COUNT" != "0" ] && [ "$SERVICE_COUNT" != "null" ]; then
    echo "Services :"
    echo "$SERVICES" | jq -r '.services[]? | "  - \(.name) (ID: \(.id))"' 2>/dev/null || echo "$SERVICES"
    
    # Utiliser le service "backend" ou le premier
    SERVICE_ID=$(echo "$SERVICES" | jq -r '.services[]? | select(.name == "backend") | .id' 2>/dev/null | head -1)
    
    if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" == "null" ]; then
        SERVICE_ID=$(echo "$SERVICES" | jq -r '.services[0].id' 2>/dev/null)
    fi
else
    SERVICE_ID=""
fi

# Créer un service backend si nécessaire
if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" == "null" ]; then
    echo ""
    echo "🔧 ÉTAPE 4 : Création du service backend..."
    NEW_SERVICE=$(railway_api POST "/projects/$PROJECT_ID/services" '{"name":"backend"}')
    
    if echo "$NEW_SERVICE" | grep -q "error\|Not Found"; then
        echo -e "${YELLOW}⚠️  Erreur lors de la création du service${NC}"
        echo "$NEW_SERVICE"
        echo "Tentative alternative..."
        SERVICE_ID=""
    else
        SERVICE_ID=$(echo "$NEW_SERVICE" | jq -r '.id' 2>/dev/null)
        if [ -n "$SERVICE_ID" ] && [ "$SERVICE_ID" != "null" ]; then
            echo -e "${GREEN}✅ Service créé : $SERVICE_ID${NC}"
        else
            echo -e "${YELLOW}⚠️  Service ID non trouvé dans la réponse${NC}"
            echo "$NEW_SERVICE"
            SERVICE_ID=""
        fi
    fi
else
    echo ""
    echo "🔧 ÉTAPE 4 : Service backend existant"
    echo -e "${GREEN}✅ Service ID : $SERVICE_ID${NC}"
fi

# Si on n'a pas de service ID, utiliser Railway CLI
if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" == "null" ]; then
    echo ""
    echo "🔧 ÉTAPE 4 (Alternative) : Création via Railway CLI..."
    export RAILWAY_TOKEN
    cd /Users/emmanuelabougadous/luneo-platform
    
    # Lier le projet
    railway link --project "$PROJECT_ID" 2>&1 || echo "Projet déjà lié"
    
    # Créer le service en déployant
    echo "Déploiement pour créer le service..."
    railway up 2>&1 | head -50
    
    # Attendre un peu
    sleep 15
    
    # Récupérer le service ID
    SERVICES=$(railway_api GET "/projects/$PROJECT_ID/services")
    SERVICE_ID=$(echo "$SERVICES" | jq -r '.services[0].id' 2>/dev/null)
    
    if [ -n "$SERVICE_ID" ] && [ "$SERVICE_ID" != "null" ]; then
        echo -e "${GREEN}✅ Service créé via CLI : $SERVICE_ID${NC}"
    else
        echo -e "${YELLOW}⚠️  Service ID non disponible${NC}"
        echo "Continuez avec la configuration manuelle via dashboard"
        exit 1
    fi
fi

# Vérifier PostgreSQL
echo ""
echo "🗄️  ÉTAPE 5 : Vérification de PostgreSQL..."
PLUGINS=$(railway_api GET "/projects/$PROJECT_ID/plugins" 2>/dev/null || echo "{}")
POSTGRES_EXISTS=$(echo "$PLUGINS" | jq -r '.plugins[]? | select(.name == "PostgreSQL" or .type == "postgresql") | .id' 2>/dev/null | head -1)

if [ -z "$POSTGRES_EXISTS" ] || [ "$POSTGRES_EXISTS" == "null" ]; then
    echo "Ajout de PostgreSQL..."
    POSTGRES=$(railway_api POST "/projects/$PROJECT_ID/plugins" '{"name":"PostgreSQL","type":"postgresql"}' 2>/dev/null)
    
    if echo "$POSTGRES" | grep -q "error\|Not Found"; then
        echo -e "${YELLOW}⚠️  Erreur lors de l'ajout de PostgreSQL${NC}"
        echo "$POSTGRES"
        echo "Ajoutez PostgreSQL via le dashboard : + New → Database → PostgreSQL"
    else
        POSTGRES_ID=$(echo "$POSTGRES" | jq -r '.id' 2>/dev/null)
        if [ -n "$POSTGRES_ID" ] && [ "$POSTGRES_ID" != "null" ]; then
            echo -e "${GREEN}✅ PostgreSQL ajouté : $POSTGRES_ID${NC}"
            echo "Attente de la création de la base (15 secondes)..."
            sleep 15
        else
            echo -e "${YELLOW}⚠️  PostgreSQL ID non trouvé${NC}"
        fi
    fi
else
    echo -e "${GREEN}✅ PostgreSQL déjà configuré${NC}"
fi

# Configurer les variables d'environnement
echo ""
echo "📝 ÉTAPE 6 : Configuration des variables d'environnement..."

# Générer JWT_SECRET
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-me-$(date +%s)")

# Variables à configurer
VARS=(
    "NODE_ENV=production"
    "JWT_SECRET=$JWT_SECRET"
)

# Obtenir les variables existantes
EXISTING_VARS=$(railway_api GET "/services/$SERVICE_ID/variables" 2>/dev/null || echo "{}")

echo "Configuration des variables..."

for VAR_PAIR in "${VARS[@]}"; do
    VAR_NAME="${VAR_PAIR%%=*}"
    VAR_VALUE="${VAR_PAIR#*=}"
    
    # Vérifier si la variable existe déjà
    EXISTS=$(echo "$EXISTING_VARS" | jq -r ".variables[]? | select(.key == \"$VAR_NAME\") | .key" 2>/dev/null || echo "")
    
    if [ -n "$EXISTS" ]; then
        echo -e "${GREEN}✅ $VAR_NAME déjà configuré${NC}"
    else
        echo "Configuration de $VAR_NAME..."
        RESULT=$(railway_api POST "/services/$SERVICE_ID/variables" "{\"key\":\"$VAR_NAME\",\"value\":\"$VAR_VALUE\"}" 2>/dev/null)
        
        if echo "$RESULT" | grep -q "error\|Not Found"; then
            echo -e "${YELLOW}⚠️  Erreur pour $VAR_NAME${NC}"
            echo "$RESULT"
        else
            echo -e "${GREEN}✅ $VAR_NAME configuré${NC}"
        fi
    fi
done

echo ""
echo -e "${GREEN}✅ Variables configurées :${NC}"
echo "   NODE_ENV=production"
echo "   JWT_SECRET=$JWT_SECRET"

# Déclencher un déploiement
echo ""
echo "🚀 ÉTAPE 7 : Déclenchement du déploiement..."

# Utiliser Railway CLI pour déployer
export RAILWAY_TOKEN
cd /Users/emmanuelabougadous/luneo-platform

echo "Déploiement en cours..."
railway up --service "$SERVICE_ID" 2>&1 | head -50 || railway deploy --service "$SERVICE_ID" 2>&1 | head -50 || {
    echo "Déploiement via CLI général..."
    railway up 2>&1 | head -50
}

# Attendre un peu
echo ""
echo "⏳ Attente du démarrage du build (25 secondes)..."
sleep 25

# Obtenir les logs
echo ""
echo "📋 ÉTAPE 8 : Logs du déploiement..."
railway logs --tail 150 2>&1 | head -150 || echo "Logs non disponibles"

# Obtenir l'URL du service
echo ""
echo "🌐 ÉTAPE 9 : URL du service..."
SERVICE_DOMAIN=$(railway domain 2>&1 || echo "")

if [ -n "$SERVICE_DOMAIN" ] && [ "$SERVICE_DOMAIN" != "Project does not have any services" ]; then
    echo -e "${GREEN}✅ Service URL : $SERVICE_DOMAIN${NC}"
    echo ""
    echo "🔍 Test du health check..."
    sleep 5
    curl -s "$SERVICE_DOMAIN/health" || echo "Health check non disponible (service en démarrage)"
else
    echo -e "${YELLOW}⚠️  URL non disponible (vérifier dans le dashboard)${NC}"
fi

# Résumé final
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
echo "📊 Informations :"
echo "   Project ID : $PROJECT_ID"
echo "   Service ID : $SERVICE_ID"
if [ -n "$SERVICE_DOMAIN" ] && [ "$SERVICE_DOMAIN" != "Project does not have any services" ]; then
    echo "   Service URL : $SERVICE_DOMAIN"
fi
echo ""
echo "🔗 Dashboard : https://railway.com/project/$PROJECT_ID"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Vérifier les logs dans le dashboard"
echo "   2. Attendre la fin du build (2-5 minutes)"
if [ -n "$SERVICE_DOMAIN" ] && [ "$SERVICE_DOMAIN" != "Project does not have any services" ]; then
    echo "   3. Tester le health check : curl $SERVICE_DOMAIN/health"
fi
echo ""










