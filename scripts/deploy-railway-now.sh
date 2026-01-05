#!/bin/bash

# Script de déploiement Railway immédiat
# Crée un nouveau projet si nécessaire et déploie

set -e

echo "🚀 Déploiement Railway Immédiat"
echo "================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI non installé${NC}"
    echo "Installation..."
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

# Vérifier si un projet est déjà lié
if railway status &> /dev/null; then
    echo ""
    echo -e "${GREEN}✅ Projet déjà lié${NC}"
    railway status
else
    echo ""
    echo -e "${YELLOW}⚠️  Aucun projet lié${NC}"
    echo "Création d'un nouveau projet..."
    
    # Créer un nouveau projet (nécessite interaction, donc on utilise init)
    PROJECT_NAME="luneo-platform-$(date +%s)"
    echo "Nom du projet: $PROJECT_NAME"
    
    # Essayer de créer via init (peut nécessiter interaction)
    railway init "$PROJECT_NAME" --yes 2>&1 || {
        echo -e "${YELLOW}⚠️  Création interactive requise${NC}"
        echo ""
        echo "Pour créer un projet manuellement :"
        echo "1. Aller sur https://railway.app/new"
        echo "2. Créer un nouveau projet"
        echo "3. Lier avec: railway link --project PROJECT_ID"
        echo ""
        echo "Ou utiliser l'API Railway avec un token"
        exit 1
    }
fi

# Vérifier PostgreSQL
echo ""
echo "🗄️  Vérification de PostgreSQL..."
if railway variables get DATABASE_URL &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL configuré${NC}"
else
    echo "Ajout de PostgreSQL..."
    railway add postgresql || echo "PostgreSQL déjà ajouté"
fi

# Configurer les variables essentielles
echo ""
echo "📝 Configuration des variables d'environnement..."

# Générer un JWT_SECRET si nécessaire
if ! railway variables get JWT_SECRET &> /dev/null; then
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-me-$(date +%s)")
    railway variables set JWT_SECRET="$JWT_SECRET"
    echo -e "${GREEN}✅ JWT_SECRET configuré${NC}"
else
    echo -e "${GREEN}✅ JWT_SECRET déjà configuré${NC}"
fi

# NODE_ENV
if ! railway variables get NODE_ENV &> /dev/null; then
    railway variables set NODE_ENV=production
    echo -e "${GREEN}✅ NODE_ENV configuré${NC}"
else
    echo -e "${GREEN}✅ NODE_ENV déjà configuré${NC}"
fi

# Déployer
echo ""
echo "🚂 Déploiement en cours..."
railway up --detach || railway deploy

echo ""
echo -e "${GREEN}✅ Déploiement terminé !${NC}"
echo ""

# Obtenir l'URL
SERVICE_URL=$(railway domain 2>/dev/null || echo "Vérifier dans le dashboard Railway")

echo "📊 Informations :"
echo "   Service URL: $SERVICE_URL"
echo "   Health Check: $SERVICE_URL/health"
echo ""
echo "📋 Commandes utiles :"
echo "   Logs: railway logs"
echo "   Status: railway status"
echo "   Dashboard: railway open"
echo ""








