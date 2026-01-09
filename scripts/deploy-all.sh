#!/bin/bash

# 🚀 Script de déploiement complet - Backend + Frontend
# Ce script orchestre le déploiement complet de l'application

set -e

echo "🚀 Déploiement Complet - Luneo Platform"
echo "=========================================="
echo ""

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

section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Vérifier que nous sommes dans la racine du projet
if [ ! -f "pnpm-workspace.yaml" ]; then
    error "Ce script doit être exécuté depuis la racine du projet"
fi

section "📋 PRÉPARATION"

# Vérifier les prérequis
info "Vérification des prérequis..."

if ! command -v railway &> /dev/null; then
    warn "Railway CLI n'est pas installé"
    read -p "Voulez-vous l'installer maintenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm i -g @railway/cli
        log "Railway CLI installé"
    else
        error "Railway CLI est requis pour déployer le backend"
    fi
fi

if ! command -v vercel &> /dev/null; then
    warn "Vercel CLI n'est pas installé"
    read -p "Voulez-vous l'installer maintenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm i -g vercel
        log "Vercel CLI installé"
    else
        error "Vercel CLI est requis pour déployer le frontend"
    fi
fi

log "Tous les prérequis sont installés"

section "🔐 CONFIGURATION DES VARIABLES D'ENVIRONNEMENT"

read -p "Voulez-vous configurer les variables d'environnement maintenant? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    info "Configuration Railway (Backend)..."
    bash scripts/setup-railway-env.sh
    
    echo ""
    info "Configuration Vercel (Frontend)..."
    bash scripts/setup-vercel-env.sh
else
    warn "Assurez-vous que toutes les variables d'environnement sont configurées avant de déployer"
fi

section "🚀 DÉPLOIEMENT BACKEND (RAILWAY)"

read -p "Voulez-vous déployer le backend maintenant? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    bash scripts/deploy-railway.sh
    
    # Récupérer l'URL du backend
    BACKEND_URL=$(railway domain 2>/dev/null || echo "")
    if [ ! -z "$BACKEND_URL" ]; then
        log "Backend déployé sur: $BACKEND_URL"
        info "N'oubliez pas de mettre à jour NEXT_PUBLIC_API_URL dans Vercel avec: $BACKEND_URL/api"
    fi
else
    warn "Déploiement backend ignoré"
fi

section "🚀 DÉPLOIEMENT FRONTEND (VERCEL)"

read -p "Voulez-vous déployer le frontend maintenant? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    bash scripts/deploy-vercel.sh
else
    warn "Déploiement frontend ignoré"
fi

section "✅ VÉRIFICATION POST-DÉPLOIEMENT"

info "Vérification du health check backend..."
if [ ! -z "$BACKEND_URL" ]; then
    if curl -f "$BACKEND_URL/health" &> /dev/null; then
        log "Backend health check: OK"
    else
        warn "Backend health check: ÉCHEC - Vérifiez les logs avec: railway logs"
    fi
fi

echo ""
log "Déploiement terminé!"
echo ""
info "Commandes utiles:"
info "  - Logs Railway: railway logs"
info "  - Logs Vercel: vercel logs"
info "  - Status Railway: railway status"
info "  - Status Vercel: vercel ls"













