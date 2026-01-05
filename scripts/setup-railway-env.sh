#!/bin/bash

# 🔐 Script de configuration des variables d'environnement Railway
# Ce script aide à configurer toutes les variables nécessaires

set -e

echo "🔐 Configuration des variables d'environnement Railway"
echo "======================================================"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de log
log() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    error "Railway CLI n'est pas installé. Installez-le avec: npm i -g @railway/cli"
fi

# Vérifier que Railway est lié
if ! railway status &> /dev/null; then
    error "Railway n'est pas lié. Exécutez d'abord: railway link"
fi

echo ""
info "Ce script va vous demander les valeurs pour chaque variable d'environnement"
echo ""

# Variables OBLIGATOIRES
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 VARIABLES OBLIGATOIRES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "DATABASE_URL (postgresql://user:password@host:port/database): " DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL est obligatoire"
fi
railway variables set DATABASE_URL="$DATABASE_URL"
log "DATABASE_URL configuré"

read -p "JWT_SECRET (minimum 32 caractères): " JWT_SECRET
if [ -z "$JWT_SECRET" ] || [ ${#JWT_SECRET} -lt 32 ]; then
    error "JWT_SECRET doit faire au moins 32 caractères"
fi
railway variables set JWT_SECRET="$JWT_SECRET"
log "JWT_SECRET configuré"

read -p "JWT_REFRESH_SECRET (minimum 32 caractères): " JWT_REFRESH_SECRET
if [ -z "$JWT_REFRESH_SECRET" ] || [ ${#JWT_REFRESH_SECRET} -lt 32 ]; then
    error "JWT_REFRESH_SECRET doit faire au moins 32 caractères"
fi
railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
log "JWT_REFRESH_SECRET configuré"

railway variables set NODE_ENV="production"
log "NODE_ENV configuré"

# Variables RECOMMANDÉES
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 VARIABLES RECOMMANDÉES (optionnel - appuyez sur Entrée pour ignorer)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "CORS_ORIGIN (ex: https://app.luneo.app,https://luneo.app): " CORS_ORIGIN
if [ ! -z "$CORS_ORIGIN" ]; then
    railway variables set CORS_ORIGIN="$CORS_ORIGIN"
    log "CORS_ORIGIN configuré"
fi

read -p "FRONTEND_URL (ex: https://app.luneo.app): " FRONTEND_URL
if [ ! -z "$FRONTEND_URL" ]; then
    railway variables set FRONTEND_URL="$FRONTEND_URL"
    log "FRONTEND_URL configuré"
fi

read -p "REDIS_URL (ex: redis://host:port): " REDIS_URL
if [ ! -z "$REDIS_URL" ]; then
    railway variables set REDIS_URL="$REDIS_URL"
    log "REDIS_URL configuré"
fi

read -p "STRIPE_SECRET_KEY (sk_live_...): " STRIPE_SECRET_KEY
if [ ! -z "$STRIPE_SECRET_KEY" ]; then
    railway variables set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
    log "STRIPE_SECRET_KEY configuré"
fi

read -p "STRIPE_WEBHOOK_SECRET (whsec_...): " STRIPE_WEBHOOK_SECRET
if [ ! -z "$STRIPE_WEBHOOK_SECRET" ]; then
    railway variables set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
    log "STRIPE_WEBHOOK_SECRET configuré"
fi

read -p "SENTRY_DSN (https://...): " SENTRY_DSN
if [ ! -z "$SENTRY_DSN" ]; then
    railway variables set SENTRY_DSN="$SENTRY_DSN"
    railway variables set SENTRY_ENVIRONMENT="production"
    log "SENTRY_DSN configuré"
fi

echo ""
log "Configuration terminée!"
echo ""
info "Vérifiez toutes les variables avec: railway variables"
info "Déployez avec: railway up"










