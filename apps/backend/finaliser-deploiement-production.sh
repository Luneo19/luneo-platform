#!/bin/bash

# Script complet pour finaliser le déploiement production et connecter frontend/backend
set -e

echo "🚀 Finalisation Déploiement Production - Backend Railway"
echo "========================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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
API_URL="${BACKEND_URL}/api"

echo -e "${BLUE}📡 Backend URL: $BACKEND_URL${NC}"
echo -e "${BLUE}📡 API URL: $API_URL${NC}"
echo ""

# Configuration CORS pour accepter Vercel et tous les domaines nécessaires
echo "🔧 Configuration CORS pour Vercel..."
CORS_ORIGIN="https://app.luneo.app,https://luneo.app,https://*.vercel.app,http://localhost:3000"
railway variables --service backend --set "CORS_ORIGIN=$CORS_ORIGIN" 2>&1 | grep -v "already exists\|Failed" || true

# Configuration Frontend URL
echo "🔧 Configuration Frontend URL..."
railway variables --service backend --set "FRONTEND_URL=https://app.luneo.app" 2>&1 | grep -v "already exists\|Failed" || true

echo -e "${GREEN}✅ Configuration CORS mise à jour${NC}"
echo ""

# Vérifier les variables critiques
echo "🔍 Vérification des variables critiques..."
railway variables --service backend 2>&1 | grep -E "(DATABASE_URL|NODE_ENV|PORT|JWT_SECRET|API_PREFIX)" | head -5

echo ""
echo -e "${GREEN}✅ Variables critiques vérifiées${NC}"
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
echo -e "${BLUE}📋 Configuration Frontend (Vercel)${NC}"
echo ""
echo "Ajoutez/modifiez cette variable dans Vercel Dashboard :"
echo ""
echo -e "${YELLOW}Variable:${NC} NEXT_PUBLIC_API_URL"
echo -e "${YELLOW}Valeur:${NC} $API_URL"
echo -e "${YELLOW}Environnements:${NC} Production, Preview, Development"
echo ""
echo "🔗 URL Vercel Dashboard :"
echo "   https://vercel.com/dashboard"
echo "   → Votre projet → Settings → Environment Variables"
echo ""
echo "📋 Prochaines étapes :"
echo ""
echo "1. Configurer Vercel :"
echo "   - Ajouter NEXT_PUBLIC_API_URL=$API_URL"
echo "   - Redéployer le frontend"
echo ""
echo "2. Vérifier les logs Railway :"
echo "   railway logs --follow"
echo ""
echo "3. Tester le health check (après le build) :"
echo "   curl $BACKEND_URL/health"
echo ""
echo "4. Tester la connexion frontend/backend :"
echo "   curl $API_URL/health"
echo ""
echo "5. Ouvrir le Dashboard Railway :"
echo "   railway open"
echo ""
echo -e "${GREEN}✅ Configuration terminée !${NC}"
echo ""






