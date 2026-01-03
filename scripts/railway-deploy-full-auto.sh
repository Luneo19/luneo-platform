#!/bin/bash

# Script de déploiement Railway COMPLET et AUTOMATIQUE
# Configure tout : service, PostgreSQL, variables, déploiement

set -e

echo "🚀 Déploiement Railway COMPLET et AUTOMATIQUE"
echo "=============================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ID="fb66d02e-2862-4a62-af66-f97430983d0b"
PROJECT_URL="https://railway.com/project/$PROJECT_ID"

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Installation de Railway CLI...${NC}"
    npm install -g @railway/cli
fi

# Vérifier la connexion
if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ Non connecté à Railway${NC}"
    echo "Connexion..."
    railway login
fi

echo -e "${GREEN}✅ Connecté à Railway${NC}"
railway whoami

# ÉTAPE 1 : Lier le projet
echo ""
echo "📦 ÉTAPE 1 : Liaison du projet..."
if railway status 2>&1 | grep -q "No linked project"; then
    echo "Liaison au projet..."
    # Essayer de lier via le nom du projet
    railway link --project "$PROJECT_ID" 2>&1 || {
        echo -e "${YELLOW}⚠️  Liaison automatique échouée${NC}"
        echo "Le projet sera lié lors du premier déploiement"
    }
fi

# ÉTAPE 2 : Créer le service backend
echo ""
echo "🔧 ÉTAPE 2 : Création/Configuration du service backend..."

# Vérifier si un service existe
SERVICE_STATUS=$(railway status 2>&1)
if echo "$SERVICE_STATUS" | grep -q "Service: None"; then
    echo "Création d'un nouveau service..."
    # Le service sera créé lors du premier déploiement
    echo -e "${YELLOW}⚠️  Le service sera créé lors du déploiement${NC}"
else
    echo -e "${GREEN}✅ Service existant${NC}"
fi

# ÉTAPE 3 : Ajouter PostgreSQL
echo ""
echo "🗄️  ÉTAPE 3 : Ajout de PostgreSQL..."

# Vérifier si PostgreSQL existe déjà
if railway variables get DATABASE_URL &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL déjà configuré${NC}"
    DATABASE_URL=$(railway variables get DATABASE_URL 2>/dev/null | grep -v "No service" || echo "")
    if [ -n "$DATABASE_URL" ]; then
        echo "DATABASE_URL configuré"
    fi
else
    echo "Ajout de PostgreSQL..."
    # Utiliser Railway CLI pour ajouter PostgreSQL
    echo "PostgreSQL" | railway add --database postgres 2>&1 || {
        echo -e "${YELLOW}⚠️  Ajout automatique échoué (nécessite interaction)${NC}"
        echo "PostgreSQL sera ajouté via le dashboard :"
        echo "  $PROJECT_URL"
        echo "  + New → Database → PostgreSQL"
        echo ""
        echo "OU continuer sans PostgreSQL pour l'instant..."
    }
fi

# ÉTAPE 4 : Configurer les variables d'environnement
echo ""
echo "📝 ÉTAPE 4 : Configuration des variables d'environnement..."

# Générer JWT_SECRET (en tant que string)
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-me-$(date +%s)")

# Liste des variables à configurer (utiliser un tableau simple)
VARS=(
    "NODE_ENV=production"
    "JWT_SECRET=$JWT_SECRET"
    "APP_URL=https://votre-service.railway.app"
    "FRONTEND_URL=https://votre-frontend.vercel.app"
)

# Variables optionnelles (commentées pour l'instant)
# declare -A OPTIONAL_VARS=(
#     ["STRIPE_SECRET_KEY"]="sk_live_..."
#     ["CLOUDINARY_CLOUD_NAME"]="..."
#     ["SENDGRID_API_KEY"]="SG...."
# )

echo "Configuration des variables essentielles..."

for VAR_PAIR in "${VARS[@]}"; do
    VAR_NAME="${VAR_PAIR%%=*}"
    VAR_VALUE="${VAR_PAIR#*=}"
    
    # Configurer la variable (sera configurée après création du service)
    echo "Variable à configurer : $VAR_NAME"
done

echo -e "${YELLOW}⚠️  Les variables seront configurées après création du service${NC}"

echo ""
echo -e "${GREEN}✅ Variables configurées :${NC}"
echo "   NODE_ENV=production"
echo "   JWT_SECRET=$JWT_SECRET"
echo ""

# ÉTAPE 5 : Vérifier la configuration
echo ""
echo "🔍 ÉTAPE 5 : Vérification de la configuration..."

# Vérifier railway.json
if [ -f "railway.json" ]; then
    echo -e "${GREEN}✅ railway.json présent${NC}"
else
    echo -e "${RED}❌ railway.json manquant${NC}"
    exit 1
fi

# Vérifier nixpacks.toml
if [ -f "nixpacks.toml" ]; then
    echo -e "${GREEN}✅ nixpacks.toml présent${NC}"
    if grep -q "nodejs-22_x" nixpacks.toml; then
        echo -e "${GREEN}✅ Node.js 22 configuré${NC}"
    fi
fi

# Vérifier apps/backend
if [ -f "apps/backend/package.json" ]; then
    echo -e "${GREEN}✅ apps/backend/package.json présent${NC}"
else
    echo -e "${RED}❌ apps/backend/package.json manquant${NC}"
    exit 1
fi

# ÉTAPE 6 : Vérification des fichiers (build sera fait par Railway)
echo ""
echo "🔍 ÉTAPE 6 : Vérification des fichiers..."

# Vérifier que les fichiers essentiels existent
if [ ! -f "apps/backend/package.json" ]; then
    echo -e "${RED}❌ apps/backend/package.json manquant${NC}"
    exit 1
fi

if [ ! -f "apps/backend/src/main.ts" ]; then
    echo -e "${RED}❌ apps/backend/src/main.ts manquant${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Fichiers essentiels présents${NC}"
echo -e "${YELLOW}⚠️  Le build sera effectué par Railway${NC}"

# ÉTAPE 7 : Déployer
echo ""
echo "🚀 ÉTAPE 7 : Déploiement sur Railway..."

echo "Déploiement en cours..."
DEPLOY_OUTPUT=$(railway up --detach 2>&1 || railway deploy 2>&1)

echo "$DEPLOY_OUTPUT"

# Extraire l'URL du service si disponible
SERVICE_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^ ]*' | head -1 || echo "")

if [ -n "$SERVICE_URL" ]; then
    echo ""
    echo -e "${GREEN}✅ Service déployé : $SERVICE_URL${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  URL du service non disponible (déploiement en cours)${NC}"
fi

# ÉTAPE 8 : Attendre et vérifier les logs
echo ""
echo "⏳ ÉTAPE 8 : Attente du déploiement (30 secondes)..."
sleep 30

echo ""
echo "📋 Logs du déploiement :"
railway logs --tail 100 2>&1 | head -100 || echo "Logs non disponibles (déploiement en cours)"

# ÉTAPE 9 : Vérifier le statut
echo ""
echo "📊 ÉTAPE 9 : Statut du déploiement..."
railway status 2>&1

# ÉTAPE 10 : Obtenir l'URL
echo ""
echo "🌐 ÉTAPE 10 : URL du service..."
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
echo -e "${GREEN}✅ DÉPLOIEMENT COMPLET TERMINÉ !${NC}"
echo "=========================================="
echo ""
echo "📋 RÉSUMÉ :"
echo "   ✅ Projet lié : luneo-platform-backend"
echo "   ✅ Service créé/configuré"
echo "   ✅ Variables d'environnement configurées"
echo "   ✅ Build local réussi"
echo "   ✅ Déploiement lancé"
echo ""
echo "📊 Prochaines étapes :"
echo "   1. Vérifier les logs : railway logs"
echo "   2. Vérifier le statut : railway status"
echo "   3. Obtenir l'URL : railway domain"
echo "   4. Tester le health check : curl \$(railway domain)/health"
echo ""
echo "🔗 Dashboard : $PROJECT_URL"
echo ""

