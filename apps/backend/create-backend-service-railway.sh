#!/bin/bash

# Script pour créer et configurer le service backend Railway via CLI
set -e

echo "🚂 Création et Configuration du Service Backend Railway"
echo "======================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Vérifier que railway est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé"
    exit 1
fi

# Vérifier le projet
PROJECT_STATUS=$(railway status 2>&1)
if [[ "$PROJECT_STATUS" == *"No linked project"* ]]; then
    echo "⚠️  Projet non lié, liaison en cours..."
    railway link -p 0e3eb9ba-6846-4e0e-81d2-bd7da54da971
fi

echo "📋 Étape 1 : Création du service backend..."
echo "   (Le service backend devrait déjà exister si vous avez utilisé 'railway add')"
echo ""

# Essayer de lier le service backend
echo "📋 Étape 2 : Liaison au service backend..."
railway service link backend 2>&1 | grep -v "not found" || {
    echo "⚠️  Le service backend n'existe pas encore"
    echo "   Création en cours..."
    echo "" | railway add --service backend 2>&1 || true
    sleep 2
    railway service link backend 2>&1 || true
}

echo ""
echo "📋 Étape 3 : Vérification du service..."
railway status

echo ""
echo "📋 Étape 4 : Configuration des variables d'environnement..."
echo ""

# Récupérer les variables du service Postgres pour les copier
echo "   Récupération des variables depuis Postgres..."
POSTGRES_VARS=$(railway variables --service Postgres 2>&1 || echo "")

# Générer les secrets JWT
JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 32 | tr -d '\n')

echo "   Configuration des variables..."

# Variables de base
railway variables --service backend --set "NODE_ENV=production" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "PORT=3001" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "API_PREFIX=/api" 2>&1 | grep -v "already exists\|Failed" || true

# JWT
railway variables --service backend --set "JWT_SECRET=$JWT_SECRET" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "JWT_EXPIRES_IN=15m" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "JWT_REFRESH_EXPIRES_IN=7d" 2>&1 | grep -v "already exists\|Failed" || true

# Frontend/CORS
railway variables --service backend --set "FRONTEND_URL=https://app.luneo.app" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "CORS_ORIGIN=https://app.luneo.app,https://luneo.app" 2>&1 | grep -v "already exists\|Failed" || true

# SendGrid
railway variables --service backend --set "SENDGRID_DOMAIN=luneo.app" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "SENDGRID_FROM_NAME=Luneo" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "SENDGRID_FROM_EMAIL=no-reply@luneo.app" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "SENDGRID_REPLY_TO=support@luneo.app" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "SMTP_HOST=smtp.sendgrid.net" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "SMTP_PORT=587" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "SMTP_SECURE=false" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "SMTP_FROM=Luneo <no-reply@luneo.app>" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "DOMAIN_VERIFIED=true" 2>&1 | grep -v "already exists\|Failed" || true

# Rate Limiting
railway variables --service backend --set "RATE_LIMIT_TTL=60" 2>&1 | grep -v "already exists\|Failed" || true
railway variables --service backend --set "RATE_LIMIT_LIMIT=100" 2>&1 | grep -v "already exists\|Failed" || true

echo ""
echo -e "${GREEN}✅ Variables configurées${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}🎉 Configuration terminée !${NC}"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT - Actions manuelles requises :"
echo ""
echo "1. DATABASE_URL doit être configurée dans Railway Dashboard"
echo "   Avec la valeur : \${{Postgres.DATABASE_URL}}"
echo ""
echo "2. SENDGRID_API_KEY doit être ajoutée avec votre vraie clé"
echo ""
echo "3. Optionnel : REDIS_URL = \${{Redis.REDIS_URL}} (si Redis ajouté)"
echo ""
echo "📋 Commandes suivantes :"
echo "   railway open  # Ouvrir le Dashboard pour configurer DATABASE_URL"
echo "   railway run 'cd apps/backend && pnpm prisma migrate deploy'  # Migrations"
echo "   railway up  # Déployer"
echo ""



















