#!/bin/bash

# Script de déploiement Railway automatisé
# Utilise Railway CLI avec token ou API

set -e

echo "🚀 Déploiement Railway Automatisé - Luneo Platform"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI n'est pas installé${NC}"
    echo "Installation de Railway CLI..."
    npm install -g @railway/cli
    echo -e "${GREEN}✅ Railway CLI installé${NC}"
fi

# Vérifier le token Railway
if [ -z "$RAILWAY_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  RAILWAY_TOKEN non défini${NC}"
    echo ""
    echo "Pour obtenir votre token Railway :"
    echo "1. Aller sur https://railway.app/account/tokens"
    echo "2. Créer un nouveau token"
    echo "3. Exporter : export RAILWAY_TOKEN=votre-token"
    echo ""
    echo "Ou utiliser : railway login"
    echo ""
    
    # Essayer de se connecter
    if railway whoami &> /dev/null; then
        echo -e "${GREEN}✅ Déjà connecté à Railway${NC}"
    else
        echo "Tentative de connexion..."
        railway login
    fi
else
    echo -e "${GREEN}✅ Token Railway détecté${NC}"
    export RAILWAY_TOKEN
fi

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json non trouvé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Vérifications préliminaires OK${NC}"
echo ""

# Vérifier le projet Railway
if [ -z "$RAILWAY_PROJECT_ID" ]; then
    echo "📋 Vérification du projet Railway..."
    
    # Lister les projets
    echo "Projets Railway disponibles :"
    railway projects list || railway link
    
    echo ""
    echo -e "${YELLOW}💡 Astuce: Définir RAILWAY_PROJECT_ID pour automatiser${NC}"
    echo "   export RAILWAY_PROJECT_ID=votre-project-id"
else
    echo -e "${GREEN}✅ Projet Railway configuré: $RAILWAY_PROJECT_ID${NC}"
fi

# Vérifier la base de données
echo ""
echo "🗄️  Vérification de la base de données PostgreSQL..."
if railway variables get DATABASE_URL &> /dev/null; then
    echo -e "${GREEN}✅ DATABASE_URL configuré${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL non configuré${NC}"
    echo "Ajout de PostgreSQL..."
    railway add postgresql || echo "PostgreSQL déjà ajouté ou erreur"
fi

# Variables d'environnement essentielles
echo ""
echo "📝 Vérification des variables d'environnement..."

ESSENTIAL_VARS=(
    "NODE_ENV=production"
    "JWT_SECRET"
)

for var in "${ESSENTIAL_VARS[@]}"; do
    if [[ $var == *"="* ]]; then
        key="${var%%=*}"
        value="${var#*=}"
        if ! railway variables get "$key" &> /dev/null; then
            echo "Configuration de $key..."
            railway variables set "$key=$value" || echo "Erreur pour $key"
        else
            echo -e "${GREEN}✅ $key configuré${NC}"
        fi
    else
        if ! railway variables get "$var" &> /dev/null; then
            echo -e "${YELLOW}⚠️  $var non configuré${NC}"
            echo "   Définir avec: railway variables set $var=valeur"
        else
            echo -e "${GREEN}✅ $var configuré${NC}"
        fi
    fi
done

# Build local (optionnel)
if [ "$1" == "--build" ]; then
    echo ""
    echo "🔨 Build local..."
    cd apps/backend
    pnpm install
    pnpm prisma generate
    pnpm build
    cd ../..
    echo -e "${GREEN}✅ Build local réussi${NC}"
fi

# Migration Prisma
if [ "$1" == "--migrate" ] || [ "$2" == "--migrate" ]; then
    echo ""
    echo "🗄️  Exécution des migrations Prisma..."
    railway run pnpm prisma migrate deploy || {
        echo -e "${YELLOW}⚠️  Migration échouée, tentative alternative...${NC}"
        cd apps/backend
        railway run pnpm prisma migrate deploy
        cd ../..
    }
    echo -e "${GREEN}✅ Migrations appliquées${NC}"
fi

# Déploiement
echo ""
echo "🚂 Déploiement sur Railway..."
echo ""

# Vérifier le statut
railway status || echo "Projet non lié, liaison en cours..."
railway link || echo "Liaison échouée, continuons..."

# Déployer
echo "Déploiement en cours..."
railway up --detach || railway deploy

echo ""
echo -e "${GREEN}✅ Déploiement terminé !${NC}"
echo ""

# Obtenir l'URL du service
SERVICE_URL=$(railway domain 2>/dev/null || railway status 2>/dev/null | grep -o 'https://[^ ]*' | head -1 || echo "Non disponible")

echo "📊 Informations de déploiement :"
echo "   Service URL: $SERVICE_URL"
echo "   Health Check: $SERVICE_URL/health"
echo ""

echo "📋 Commandes utiles :"
echo "   Voir les logs: railway logs"
echo "   Ouvrir le dashboard: railway open"
echo "   Vérifier le statut: railway status"
echo "   Voir les variables: railway variables"
echo ""










