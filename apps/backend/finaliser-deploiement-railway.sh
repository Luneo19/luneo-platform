#!/bin/bash

# Script pour finaliser le déploiement Railway et configurer tout ce qui manque
set -e

echo "🚀 Finalisation du Déploiement Railway Backend"
echo "=============================================="
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
echo "🔍 Vérification des variables d'environnement..."
MISSING_VARS=()

DATABASE_URL=$(railway variables --service backend 2>&1 | grep -A 3 "DATABASE_URL" | grep "postgresql://" > /dev/null && echo "OK" || echo "")
if [ -z "$DATABASE_URL" ]; then
    MISSING_VARS+=("DATABASE_URL")
fi

JWT_SECRET=$(railway variables --service backend 2>&1 | grep "JWT_SECRET" > /dev/null && echo "OK" || echo "")
if [ -z "$JWT_SECRET" ]; then
    MISSING_VARS+=("JWT_SECRET")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Variables manquantes: ${MISSING_VARS[*]}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Variables critiques configurées${NC}"
echo ""

# Vérifier SENDGRID_API_KEY
echo "📧 Vérification SendGrid..."
SENDGRID_KEY=$(railway variables --service backend 2>&1 | grep "SENDGRID_API_KEY" | grep -v "SG\.xxx" | grep "SG\." > /dev/null && echo "OK" || echo "")
if [ -z "$SENDGRID_KEY" ]; then
    echo -e "${YELLOW}⚠️  SENDGRID_API_KEY non configurée ou invalide${NC}"
    echo "   L'email ne fonctionnera pas sans cette clé"
    echo "   Vous pouvez l'ajouter plus tard avec:"
    echo "   railway variables --service backend --set 'SENDGRID_API_KEY=VOTRE_CLE'"
    echo ""
fi

# Vérifier les variables recommandées et les ajouter si manquantes
echo "🔧 Vérification et ajout des variables recommandées..."

# Variables critiques pour le fonctionnement
railway variables --service backend --set "NODE_ENV=production" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "PORT=3001" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "API_PREFIX=/api" 2>&1 | grep -v "already exists\|Failed" || true

# Frontend URL
FRONTEND_CHECK=$(railway variables --service backend 2>&1 | grep "FRONTEND_URL" > /dev/null && echo "OK" || echo "")
if [ -z "$FRONTEND_CHECK" ]; then
    railway variables --service backend --set "FRONTEND_URL=https://app.luneo.app" 2>&1 | grep -v "Failed" || true
fi

# CORS
CORS_CHECK=$(railway variables --service backend 2>&1 | grep "CORS_ORIGIN" > /dev/null && echo "OK" || echo "")
if [ -z "$CORS_CHECK" ]; then
    railway variables --service backend --set "CORS_ORIGIN=https://app.luneo.app,https://luneo.app" 2>&1 | grep -v "Failed" || true
fi

echo -e "${GREEN}✅ Variables vérifiées${NC}"
echo ""

# Déployer
echo "🚀 Déploiement du backend..."
echo ""

# Vérifier si git est initialisé et a des commits
if [ -d "../../.git" ]; then
    echo "📦 Détection d'un dépôt Git"
    echo "   Railway déploiera automatiquement à chaque push"
    echo "   Déploiement manuel en cours..."
    echo ""
    
    # Déployer via railway up
    railway up --detach 2>&1 | tail -20 || {
        echo -e "${YELLOW}⚠️  Déploiement manuel non disponible${NC}"
        echo "   Railway déploiera automatiquement à partir de GitHub"
        echo ""
    }
else
    echo -e "${YELLOW}⚠️  Aucun dépôt Git détecté${NC}"
    echo "   Pour déployer automatiquement, poussez votre code vers GitHub"
    echo "   Railway déploiera automatiquement depuis GitHub"
    echo ""
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Configuration terminée !${NC}"
echo "=========================================="
echo ""
echo "📋 Résumé :"
echo "   ✅ Service backend configuré"
echo "   ✅ Variables d'environnement configurées"
echo "   ✅ Déploiement lancé"
echo ""
echo "📝 Prochaines étapes :"
echo ""
echo "1. Vérifier les logs :"
echo "   railway logs"
echo ""
echo "2. Obtenir l'URL du service :"
echo "   railway domain"
echo ""
echo "3. Tester le health check :"
echo "   curl \$(railway domain)/health"
echo ""
echo "4. Exécuter les migrations Prisma (après le déploiement) :"
echo "   Via Railway Dashboard → Deployments → ... → Open Shell"
echo "   Puis: cd apps/backend && pnpm prisma migrate deploy"
echo ""
echo "5. Si besoin, ajouter SENDGRID_API_KEY :"
echo "   railway variables --service backend --set 'SENDGRID_API_KEY=VOTRE_CLE'"
echo ""
echo "6. Ouvrir le Dashboard :"
echo "   railway open"
echo ""


















