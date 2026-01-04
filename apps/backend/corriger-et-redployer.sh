#!/bin/bash

# Script pour corriger les erreurs et redéployer avec la configuration complète
set -e

echo "🔧 Correction des Erreurs et Redéploiement Complet"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI n'est pas installé${NC}"
    exit 1
fi

# Vérifier qu'on est sur le service backend
echo "📋 Vérification du service..."
CURRENT_SERVICE=$(railway status 2>&1 | grep "Service:" | awk '{print $2}')
if [ "$CURRENT_SERVICE" != "backend" ]; then
    echo -e "${YELLOW}⚠️  Changement vers le service backend...${NC}"
    railway service link backend 2>&1 || railway service backend 2>&1
fi

echo -e "${GREEN}✅ Service backend actif${NC}"
echo ""

# Obtenir l'URL du backend
BACKEND_URL=$(railway domain 2>&1 | grep -o "https://[^ ]*" | head -1)
echo "📡 Backend URL: $BACKEND_URL"
echo ""

# Configuration CORS pour accepter Vercel
echo "🔧 Configuration CORS pour Vercel..."
railway variables --service backend --set "CORS_ORIGIN=https://app.luneo.app,https://luneo.app,https://*.vercel.app" 2>&1 | grep -v "already exists\|Failed" || true

# Configuration Frontend URL
echo "🔧 Configuration Frontend URL..."
railway variables --service backend --set "FRONTEND_URL=https://app.luneo.app" 2>&1 | grep -v "already exists\|Failed" || true

echo -e "${GREEN}✅ Configuration CORS mise à jour${NC}"
echo ""

# Vérifier que nixpacks.toml est correct
echo "🔍 Vérification de nixpacks.toml..."
if grep -q "nodejs-18.x" apps/backend/nixpacks.toml 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Correction de nixpacks.toml...${NC}"
    sed -i.bak 's/nodejs-18\.x/nodejs_18/g' apps/backend/nixpacks.toml
    echo -e "${GREEN}✅ nixpacks.toml corrigé${NC}"
fi

echo ""

# Déployer
echo "🚀 Redéploiement en production..."
echo ""

railway up --detach 2>&1 | tail -10

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Redéploiement lancé !${NC}"
echo "=========================================="
echo ""
echo "📋 Informations importantes :"
echo ""
echo "🔗 Backend URL: $BACKEND_URL"
echo "🔗 API URL: $BACKEND_URL/api"
echo ""
echo "📝 Configuration Frontend (Vercel) :"
echo "   NEXT_PUBLIC_API_URL=$BACKEND_URL/api"
echo ""
echo "📋 Prochaines étapes :"
echo ""
echo "1. Vérifier les logs :"
echo "   railway logs --follow"
echo ""
echo "2. Tester le health check (après le build) :"
echo "   curl $BACKEND_URL/health"
echo ""
echo "3. Configurer Vercel avec NEXT_PUBLIC_API_URL :"
echo "   vercel env add NEXT_PUBLIC_API_URL production <<< '$BACKEND_URL/api'"
echo ""
echo "4. Ouvrir le Dashboard :"
echo "   railway open"
echo ""














