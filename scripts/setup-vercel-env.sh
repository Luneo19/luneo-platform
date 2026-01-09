#!/bin/bash

# 🔐 Script de configuration des variables d'environnement Vercel
# Ce script aide à configurer toutes les variables nécessaires

set -e

echo "🔐 Configuration des variables d'environnement Vercel"
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

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    error "Vercel CLI n'est pas installé. Installez-le avec: npm i -g vercel"
fi

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "apps/frontend/package.json" ]; then
    error "Ce script doit être exécuté depuis la racine du projet"
fi

cd apps/frontend

# Vérifier que Vercel est lié
if [ ! -f ".vercel/project.json" ]; then
    warn "Vercel n'est pas lié. Exécutez d'abord: vercel link"
    read -p "Voulez-vous lier maintenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        vercel link
    else
        error "Vous devez lier Vercel avant de configurer les variables"
    fi
fi

echo ""
info "Ce script va vous demander les valeurs pour chaque variable d'environnement"
echo "Les variables seront configurées pour l'environnement PRODUCTION"
echo ""

# Variables OBLIGATOIRES
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 VARIABLES OBLIGATOIRES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "NEXT_PUBLIC_API_URL (ex: https://your-backend.up.railway.app/api): " NEXT_PUBLIC_API_URL
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    error "NEXT_PUBLIC_API_URL est obligatoire"
fi
echo "$NEXT_PUBLIC_API_URL" | vercel env add NEXT_PUBLIC_API_URL production
log "NEXT_PUBLIC_API_URL configuré"

read -p "NEXT_PUBLIC_APP_URL (ex: https://app.luneo.app): " NEXT_PUBLIC_APP_URL
if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
    error "NEXT_PUBLIC_APP_URL est obligatoire"
fi
echo "$NEXT_PUBLIC_APP_URL" | vercel env add NEXT_PUBLIC_APP_URL production
log "NEXT_PUBLIC_APP_URL configuré"

read -p "NEXT_PUBLIC_SUPABASE_URL (ex: https://your-project.supabase.co): " NEXT_PUBLIC_SUPABASE_URL
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    error "NEXT_PUBLIC_SUPABASE_URL est obligatoire"
fi
echo "$NEXT_PUBLIC_SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
log "NEXT_PUBLIC_SUPABASE_URL configuré"

read -p "NEXT_PUBLIC_SUPABASE_ANON_KEY: " NEXT_PUBLIC_SUPABASE_ANON_KEY
if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    error "NEXT_PUBLIC_SUPABASE_ANON_KEY est obligatoire"
fi
echo "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
log "NEXT_PUBLIC_SUPABASE_ANON_KEY configuré"

# Variables RECOMMANDÉES
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 VARIABLES RECOMMANDÉES (optionnel - appuyez sur Entrée pour ignorer)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_...): " NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
if [ ! -z "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]; then
    echo "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
    log "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY configuré"
fi

read -p "STRIPE_SECRET_KEY (sk_live_...): " STRIPE_SECRET_KEY
if [ ! -z "$STRIPE_SECRET_KEY" ]; then
    echo "$STRIPE_SECRET_KEY" | vercel env add STRIPE_SECRET_KEY production
    log "STRIPE_SECRET_KEY configuré"
fi

read -p "STRIPE_WEBHOOK_SECRET (whsec_...): " STRIPE_WEBHOOK_SECRET
if [ ! -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "$STRIPE_WEBHOOK_SECRET" | vercel env add STRIPE_WEBHOOK_SECRET production
    log "STRIPE_WEBHOOK_SECRET configuré"
fi

read -p "NEXT_PUBLIC_GOOGLE_CLIENT_ID: " NEXT_PUBLIC_GOOGLE_CLIENT_ID
if [ ! -z "$NEXT_PUBLIC_GOOGLE_CLIENT_ID" ]; then
    echo "$NEXT_PUBLIC_GOOGLE_CLIENT_ID" | vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production
    log "NEXT_PUBLIC_GOOGLE_CLIENT_ID configuré"
fi

read -p "NEXT_PUBLIC_GITHUB_CLIENT_ID: " NEXT_PUBLIC_GITHUB_CLIENT_ID
if [ ! -z "$NEXT_PUBLIC_GITHUB_CLIENT_ID" ]; then
    echo "$NEXT_PUBLIC_GITHUB_CLIENT_ID" | vercel env add NEXT_PUBLIC_GITHUB_CLIENT_ID production
    log "NEXT_PUBLIC_GITHUB_CLIENT_ID configuré"
fi

read -p "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: " NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
if [ ! -z "$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" ]; then
    echo "$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" | vercel env add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME production
    log "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME configuré"
fi

read -p "NEXT_PUBLIC_GA_ID (G-XXXXXXXXXX): " NEXT_PUBLIC_GA_ID
if [ ! -z "$NEXT_PUBLIC_GA_ID" ]; then
    echo "$NEXT_PUBLIC_GA_ID" | vercel env add NEXT_PUBLIC_GA_ID production
    log "NEXT_PUBLIC_GA_ID configuré"
fi

read -p "NEXT_PUBLIC_SENTRY_DSN (https://...): " NEXT_PUBLIC_SENTRY_DSN
if [ ! -z "$NEXT_PUBLIC_SENTRY_DSN" ]; then
    echo "$NEXT_PUBLIC_SENTRY_DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN production
    log "NEXT_PUBLIC_SENTRY_DSN configuré"
fi

echo ""
log "Configuration terminée!"
echo ""
info "Vérifiez toutes les variables avec: vercel env ls"
info "Déployez avec: vercel --prod"













