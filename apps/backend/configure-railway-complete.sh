#!/bin/bash

# Script complet pour configurer Railway avec toutes les variables nécessaires
set -e

echo "🚂 Configuration complète Railway Backend"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que railway est installé
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI détecté${NC}"
echo ""

# Vérifier le projet
echo "📋 Vérification du projet..."
PROJECT_STATUS=$(railway status 2>&1 || echo "NOT_LINKED")

if [[ "$PROJECT_STATUS" == *"NOT_LINKED"* ]] || [[ "$PROJECT_STATUS" == *"No linked project"* ]]; then
    echo -e "${YELLOW}⚠️  Projet non lié, liaison en cours...${NC}"
    railway link -p 0e3eb9ba-6846-4e0e-81d2-bd7da54da971
else
    echo -e "${GREEN}✅ Projet lié${NC}"
    railway status
fi

echo ""

# Générer les secrets JWT
echo "🔐 Génération des secrets JWT..."
JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 32 | tr -d '\n')

echo -e "${GREEN}✅ Secrets JWT générés${NC}"
echo ""

# Note: Pour utiliser les références Railway comme ${{Postgres.DATABASE_URL}},
# il faut les configurer via le Dashboard Railway, pas via CLI
# Le CLI ne supporte pas les références de variables

echo "📝 Configuration des variables d'environnement..."
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "   - DATABASE_URL doit être configuré dans Railway Dashboard avec: \${{Postgres.DATABASE_URL}}"
echo "   - REDIS_URL doit être configuré dans Railway Dashboard avec: \${{Redis.REDIS_URL}} (si Redis ajouté)"
echo ""

# Variables obligatoires de base
echo "🔧 Configuration des variables de base..."

railway variables --set "NODE_ENV=production" 2>&1 | grep -v "already exists" || true
railway variables --set "PORT=3001" 2>&1 | grep -v "already exists" || true
railway variables --set "API_PREFIX=/api" 2>&1 | grep -v "already exists" || true

echo -e "${GREEN}✅ Variables de base configurées${NC}"
echo ""

# JWT
echo "🔐 Configuration des secrets JWT..."
railway variables --set "JWT_SECRET=$JWT_SECRET" 2>&1 | grep -v "already exists" || true
railway variables --set "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET" 2>&1 | grep -v "already exists" || true
railway variables --set "JWT_EXPIRES_IN=15m" 2>&1 | grep -v "already exists" || true
railway variables --set "JWT_REFRESH_EXPIRES_IN=7d" 2>&1 | grep -v "already exists" || true

echo -e "${GREEN}✅ Secrets JWT configurés${NC}"
echo ""

# Frontend/CORS
echo "🌐 Configuration Frontend/CORS..."
railway variables --set "FRONTEND_URL=https://app.luneo.app" 2>&1 | grep -v "already exists" || true
railway variables --set "CORS_ORIGIN=https://app.luneo.app,https://luneo.app" 2>&1 | grep -v "already exists" || true

echo -e "${GREEN}✅ Configuration Frontend/CORS configurée${NC}"
echo ""

# SendGrid (configuration de base)
echo "📧 Configuration SendGrid..."
railway variables --set "SENDGRID_DOMAIN=luneo.app" 2>&1 | grep -v "already exists" || true
railway variables --set "SENDGRID_FROM_NAME=Luneo" 2>&1 | grep -v "already exists" || true
railway variables --set "SENDGRID_FROM_EMAIL=no-reply@luneo.app" 2>&1 | grep -v "already exists" || true
railway variables --set "SENDGRID_REPLY_TO=support@luneo.app" 2>&1 | grep -v "already exists" || true
railway variables --set "SMTP_HOST=smtp.sendgrid.net" 2>&1 | grep -v "already exists" || true
railway variables --set "SMTP_PORT=587" 2>&1 | grep -v "already exists" || true
railway variables --set "SMTP_SECURE=false" 2>&1 | grep -v "already exists" || true
railway variables --set "SMTP_FROM=Luneo <no-reply@luneo.app>" 2>&1 | grep -v "already exists" || true
railway variables --set "DOMAIN_VERIFIED=true" 2>&1 | grep -v "already exists" || true

echo -e "${YELLOW}⚠️  SENDGRID_API_KEY doit être ajoutée manuellement${NC}"
echo -e "${GREEN}✅ Configuration SendGrid configurée${NC}"
echo ""

# Rate Limiting
echo "🛡️  Configuration Rate Limiting..."
railway variables --set "RATE_LIMIT_TTL=60" 2>&1 | grep -v "already exists" || true
railway variables --set "RATE_LIMIT_LIMIT=100" 2>&1 | grep -v "already exists" || true

echo -e "${GREEN}✅ Configuration Rate Limiting configurée${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}🎉 Configuration terminée !${NC}"
echo "=========================================="
echo ""
echo "📋 Variables configurées automatiquement :"
echo "   ✅ NODE_ENV, PORT, API_PREFIX"
echo "   ✅ JWT_SECRET, JWT_REFRESH_SECRET"
echo "   ✅ FRONTEND_URL, CORS_ORIGIN"
echo "   ✅ Configuration SendGrid (sauf API_KEY)"
echo "   ✅ Rate Limiting"
echo ""
echo "📝 Variables à configurer MANUELLEMENT dans Railway Dashboard :"
echo ""
echo "   1. DATABASE_URL = \${{Postgres.DATABASE_URL}}"
echo "   2. REDIS_URL = \${{Redis.REDIS_URL}} (si Redis ajouté)"
echo "   3. SENDGRID_API_KEY = SG.xxx... (votre clé SendGrid)"
echo "   4. STRIPE_SECRET_KEY = sk_live_... (si utilisé)"
echo "   5. OPENAI_API_KEY = sk-... (si utilisé)"
echo "   6. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (si utilisé)"
echo ""
echo "🔗 Ouvrir Railway Dashboard :"
echo "   railway open"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Configurer DATABASE_URL dans Railway Dashboard"
echo "   2. Ajouter les autres clés API nécessaires"
echo "   3. Exécuter les migrations : railway run 'cd apps/backend && pnpm prisma migrate deploy'"
echo "   4. Déployer : railway up"
echo ""



















