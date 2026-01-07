#!/bin/bash

# Script complet pour corriger et déployer sur Railway via API

set -e

echo "🔧 Correction et Déploiement Railway Complet"
echo "============================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Vérifier le token Railway
if [ -z "$RAILWAY_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  RAILWAY_TOKEN non défini${NC}"
    echo ""
    echo "Pour obtenir votre token :"
    echo "1. Aller sur https://railway.app/account/tokens"
    echo "2. Créer un nouveau token"
    echo "3. Exporter : export RAILWAY_TOKEN=votre-token"
    echo ""
    echo "OU utiliser Railway CLI :"
    railway whoami || railway login
    echo ""
    echo "Tentative de déploiement via CLI..."
    
    # Utiliser CLI si disponible
    if command -v railway &> /dev/null; then
        echo "Déploiement via Railway CLI..."
        cd /Users/emmanuelabougadous/luneo-platform
        
        # Créer un nouveau service en déployant
        echo "Création du service et déploiement..."
        railway up --service backend 2>&1 || railway deploy --service backend 2>&1 || {
            echo "Tentative sans spécifier le service..."
            railway up 2>&1 || railway deploy 2>&1
        }
        
        echo ""
        echo "Attente de 20 secondes pour le build..."
        sleep 20
        
        echo ""
        echo "📋 Logs du déploiement :"
        railway logs --tail 100 2>&1 | head -100 || echo "Logs non disponibles"
        
        echo ""
        echo "📊 Statut :"
        railway status 2>&1
        
        echo ""
        echo "🌐 URL du service :"
        railway domain 2>&1 || echo "URL non disponible (déploiement en cours)"
        
        exit 0
    else
        echo -e "${RED}❌ Railway CLI non installé et token non fourni${NC}"
        exit 1
    fi
fi

# Si on a le token, utiliser l'API
RAILWAY_API="https://api.railway.app/v1"

echo -e "${GREEN}✅ Utilisation de l'API Railway${NC}"

# Fonction pour appeler l'API
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

# Obtenir le projet
PROJECT_ID="fb66d02e-2862-4a62-af66-f97430983d0b"
echo "Projet ID: $PROJECT_ID"

# Lister les services
echo ""
echo "📦 Services du projet :"
SERVICES=$(railway_api GET "/projects/$PROJECT_ID/services")
echo "$SERVICES" | jq -r '.services[] | "\(.id) - \(.name) - \(.status)"' 2>/dev/null || echo "$SERVICES"

# Obtenir le premier service ou créer un nouveau
SERVICE_ID=$(echo "$SERVICES" | jq -r '.services[0].id' 2>/dev/null || echo "")

if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" == "null" ]; then
    echo ""
    echo "Création d'un nouveau service..."
    # Créer un service via l'API
    NEW_SERVICE=$(railway_api POST "/projects/$PROJECT_ID/services" '{"name":"backend"}')
    SERVICE_ID=$(echo "$NEW_SERVICE" | jq -r '.id' 2>/dev/null)
    echo "Service créé: $SERVICE_ID"
else
    echo ""
    echo "Utilisation du service existant: $SERVICE_ID"
fi

# Obtenir les déploiements
echo ""
echo "📋 Derniers déploiements :"
DEPLOYMENTS=$(railway_api GET "/services/$SERVICE_ID/deployments?limit=5")
echo "$DEPLOYMENTS" | jq -r '.deployments[] | "\(.id) - \(.status) - \(.createdAt)"' 2>/dev/null || echo "$DEPLOYMENTS"

# Obtenir les logs du dernier déploiement
LAST_DEPLOYMENT_ID=$(echo "$DEPLOYMENTS" | jq -r '.deployments[0].id' 2>/dev/null)
if [ -n "$LAST_DEPLOYMENT_ID" ] && [ "$LAST_DEPLOYMENT_ID" != "null" ]; then
    echo ""
    echo "📋 Logs du dernier déploiement ($LAST_DEPLOYMENT_ID) :"
    # Les logs nécessitent une autre API ou Railway CLI
    echo "Utilisez 'railway logs' pour voir les logs complets"
fi

# Déclencher un nouveau déploiement
echo ""
echo "🚀 Déclenchement d'un nouveau déploiement..."
NEW_DEPLOYMENT=$(railway_api POST "/services/$SERVICE_ID/deployments" '{}')
DEPLOYMENT_ID=$(echo "$NEW_DEPLOYMENT" | jq -r '.id' 2>/dev/null || echo "")

if [ -n "$DEPLOYMENT_ID" ] && [ "$DEPLOYMENT_ID" != "null" ]; then
    echo -e "${GREEN}✅ Déploiement déclenché: $DEPLOYMENT_ID${NC}"
else
    echo -e "${YELLOW}⚠️  Utilisez Railway CLI pour déployer${NC}"
    echo "  railway up"
fi

echo ""
echo "✅ Script terminé"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Vérifier les logs : railway logs"
echo "   2. Vérifier le statut : railway status"
echo "   3. Dashboard : https://railway.com/project/$PROJECT_ID"










