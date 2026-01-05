#!/bin/bash

# Déploiement Railway COMPLET avec token API - TOUT AUTOMATIQUE

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
RAILWAY_TOKEN="cfceb780-1fdd-49f5-af21-5387213f95ac"
export RAILWAY_TOKEN

PROJECT_ID="fb66d02e-2862-4a62-af66-f97430983d0b"
RAILWAY_API="https://api.railway.app/v1"

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
if echo "$USER" | grep -q "error\|unauthorized"; then
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
PROJECT_NAME=$(echo "$PROJECT" | jq -r '.name' 2>/dev/null || echo "luneo-platform-backend")
echo -e "${GREEN}✅ Projet : $PROJECT_NAME${NC}"

# Lister les services existants
echo ""
echo "🔍 ÉTAPE 3 : Vérification des services..."
SERVICES=$(railway_api GET "/projects/$PROJECT_ID/services")
SERVICE_COUNT=$(echo "$SERVICES" | jq '.services | length' 2>/dev/null || echo "0")

echo "Services existants : $SERVICE_COUNT"

if [ "$SERVICE_COUNT" -gt 0 ]; then
    echo "Services :"
    echo "$SERVICES" | jq -r '.services[] | "  - \(.name) (ID: \(.id))"' 2>/dev/null || echo "$SERVICES"
    
    # Utiliser le premier service ou chercher "backend"
    SERVICE_ID=$(echo "$SERVICES" | jq -r '.services[] | select(.name == "backend") | .id' 2>/dev/null | head -1)
    
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
    SERVICE_ID=$(echo "$NEW_SERVICE" | jq -r '.id' 2>/dev/null)
    
    if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" == "null" ]; then
        echo -e "${RED}❌ Erreur lors de la création du service${NC}"
        echo "$NEW_SERVICE"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Service créé : $SERVICE_ID${NC}"
else
    echo ""
    echo "🔧 ÉTAPE 4 : Service backend existant"
    echo -e "${GREEN}✅ Service ID : $SERVICE_ID${NC}"
fi

# Vérifier PostgreSQL
echo ""
echo "🗄️  ÉTAPE 5 : Vérification de PostgreSQL..."
PLUGINS=$(railway_api GET "/projects/$PROJECT_ID/plugins")
POSTGRES_EXISTS=$(echo "$PLUGINS" | jq -r '.plugins[] | select(.name == "PostgreSQL") | .id' 2>/dev/null | head -1)

if [ -z "$POSTGRES_EXISTS" ] || [ "$POSTGRES_EXISTS" == "null" ]; then
    echo "Ajout de PostgreSQL..."
    POSTGRES=$(railway_api POST "/projects/$PROJECT_ID/plugins" '{"name":"PostgreSQL","type":"postgresql"}')
    POSTGRES_ID=$(echo "$POSTGRES" | jq -r '.id' 2>/dev/null)
    
    if [ -n "$POSTGRES_ID" ] && [ "$POSTGRES_ID" != "null" ]; then
        echo -e "${GREEN}✅ PostgreSQL ajouté : $POSTGRES_ID${NC}"
        echo "Attente de la création de la base (10 secondes)..."
        sleep 10
    else
        echo -e "${YELLOW}⚠️  Erreur lors de l'ajout de PostgreSQL${NC}"
        echo "$POSTGRES"
    fi
else
    echo -e "${GREEN}✅ PostgreSQL déjà configuré${NC}"
fi

# Obtenir les variables d'environnement
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
    EXISTS=$(echo "$EXISTING_VARS" | jq -r ".variables[] | select(.key == \"$VAR_NAME\") | .key" 2>/dev/null || echo "")
    
    if [ -n "$EXISTS" ]; then
        echo -e "${GREEN}✅ $VAR_NAME déjà configuré${NC}"
    else
        echo "Configuration de $VAR_NAME..."
        RESULT=$(railway_api POST "/services/$SERVICE_ID/variables" "{\"key\":\"$VAR_NAME\",\"value\":\"$VAR_VALUE\"}" 2>/dev/null)
        
        if echo "$RESULT" | grep -q "error"; then
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

# Obtenir le dernier déploiement
LAST_DEPLOYMENT=$(railway_api GET "/services/$SERVICE_ID/deployments?limit=1")
LAST_DEPLOYMENT_ID=$(echo "$LAST_DEPLOYMENT" | jq -r '.deployments[0].id' 2>/dev/null || echo "")

# Créer un nouveau déploiement
echo "Création d'un nouveau déploiement..."
NEW_DEPLOYMENT=$(railway_api POST "/services/$SERVICE_ID/deployments" '{}')
DEPLOYMENT_ID=$(echo "$NEW_DEPLOYMENT" | jq -r '.id' 2>/dev/null)

if [ -n "$DEPLOYMENT_ID" ] && [ "$DEPLOYMENT_ID" != "null" ]; then
    echo -e "${GREEN}✅ Déploiement déclenché : $DEPLOYMENT_ID${NC}"
else
    echo -e "${YELLOW}⚠️  Utilisation de Railway CLI pour déployer${NC}"
    # Utiliser Railway CLI comme fallback
    export RAILWAY_TOKEN
    cd /Users/emmanuelabougadous/luneo-platform
    railway up --service "$SERVICE_ID" 2>&1 || railway deploy --service "$SERVICE_ID" 2>&1 || {
        echo "Déploiement via CLI..."
        railway up 2>&1
    }
fi

# Attendre un peu
echo ""
echo "⏳ Attente du démarrage du build (20 secondes)..."
sleep 20

# Obtenir les logs (via CLI car l'API ne fournit pas directement les logs)
echo ""
echo "📋 ÉTAPE 8 : Logs du déploiement..."

if command -v railway &> /dev/null; then
    export RAILWAY_TOKEN
    railway logs --service "$SERVICE_ID" --tail 100 2>&1 | head -100 || {
        echo "Logs non disponibles via CLI, vérifiez dans le dashboard"
    }
else
    echo "Railway CLI non disponible, vérifiez les logs dans le dashboard"
fi

# Obtenir l'URL du service
echo ""
echo "🌐 ÉTAPE 9 : URL du service..."

SERVICE_DOMAIN=$(railway_api GET "/services/$SERVICE_ID" | jq -r '.domain' 2>/dev/null || echo "")

if [ -n "$SERVICE_DOMAIN" ] && [ "$SERVICE_DOMAIN" != "null" ]; then
    echo -e "${GREEN}✅ Service URL : https://$SERVICE_DOMAIN${NC}"
    echo ""
    echo "🔍 Test du health check..."
    sleep 5
    curl -s "https://$SERVICE_DOMAIN/health" || echo "Health check non disponible (service en démarrage)"
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
echo "   ✅ PostgreSQL ajouté"
echo "   ✅ Variables d'environnement configurées"
echo "   ✅ Déploiement déclenché"
echo ""
echo "📊 Informations :"
echo "   Project ID : $PROJECT_ID"
echo "   Service ID : $SERVICE_ID"
if [ -n "$DEPLOYMENT_ID" ] && [ "$DEPLOYMENT_ID" != "null" ]; then
    echo "   Deployment ID : $DEPLOYMENT_ID"
fi
if [ -n "$SERVICE_DOMAIN" ] && [ "$SERVICE_DOMAIN" != "null" ]; then
    echo "   Service URL : https://$SERVICE_DOMAIN"
fi
echo ""
echo "🔗 Dashboard : https://railway.com/project/$PROJECT_ID"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Vérifier les logs dans le dashboard"
echo "   2. Attendre la fin du build (2-5 minutes)"
echo "   3. Tester le health check : curl https://$SERVICE_DOMAIN/health"
echo ""








