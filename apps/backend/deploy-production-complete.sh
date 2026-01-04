#!/bin/bash

# Script complet pour finaliser et déployer le backend en production
set -e

echo "🚀 Déploiement Production Complet - Backend Railway"
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

# Vérifier les variables critiques
echo "🔍 Vérification des variables critiques..."

MISSING_VARS=()

# Vérifier DATABASE_URL
DB_CHECK=$(railway variables --service backend 2>&1 | grep -A 3 "DATABASE_URL" | grep "postgresql://" > /dev/null && echo "OK" || echo "")
if [ -z "$DB_CHECK" ]; then
    MISSING_VARS+=("DATABASE_URL")
fi

# Vérifier JWT_SECRET
JWT_CHECK=$(railway variables --service backend 2>&1 | grep "JWT_SECRET" | grep -v "JWT_REFRESH" > /dev/null && echo "OK" || echo "")
if [ -z "$JWT_CHECK" ]; then
    MISSING_VARS+=("JWT_SECRET")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Variables manquantes: ${MISSING_VARS[*]}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Variables critiques configurées${NC}"
echo ""

# Vérifier et ajouter les variables de base si manquantes
echo "🔧 Vérification des variables de base..."

railway variables --service backend --set "NODE_ENV=production" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "PORT=3001" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "API_PREFIX=/api" 2>&1 | grep -v "already exists\|Failed" || true

# Frontend URL
FRONTEND_CHECK=$(railway variables --service backend 2>&1 | grep "^FRONTEND_URL" > /dev/null && echo "OK" || echo "")
if [ -z "$FRONTEND_CHECK" ]; then
    railway variables --service backend --set "FRONTEND_URL=https://app.luneo.app" 2>&1 | grep -v "Failed" || true
fi

# CORS
CORS_CHECK=$(railway variables --service backend 2>&1 | grep "^CORS_ORIGIN" > /dev/null && echo "OK" || echo "")
if [ -z "$CORS_CHECK" ]; then
    railway variables --service backend --set "CORS_ORIGIN=https://app.luneo.app,https://luneo.app" 2>&1 | grep -v "Failed" || true
fi

echo -e "${GREEN}✅ Variables de base vérifiées${NC}"
echo ""

# Déployer
echo "🚀 Déploiement en production..."
echo ""

railway up --detach 2>&1 | tail -10

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Déploiement lancé !${NC}"
echo "=========================================="
echo ""
echo "📋 Prochaines étapes :"
echo ""
echo "1. Vérifier les logs :"
echo "   railway logs --follow"
echo ""
echo "2. Obtenir l'URL :"
echo "   railway domain"
echo ""
echo "3. Tester le health check (après le build) :"
echo "   curl \$(railway domain)/health"
echo ""
echo "4. Si besoin, ajouter SENDGRID_API_KEY :"
echo "   railway variables --service backend --set 'SENDGRID_API_KEY=VOTRE_CLE'"
echo ""
echo "5. Ouvrir le Dashboard :"
echo "   railway open"
echo ""














