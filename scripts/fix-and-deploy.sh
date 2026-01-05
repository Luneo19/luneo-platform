#!/bin/bash

# 🔧 Script de correction et déploiement automatique
# Corrige les problèmes identifiés et déploie

set -e

echo "🔧 Correction et Déploiement - Luneo Platform"
echo "=============================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Vérifier que nous sommes dans la racine
if [ ! -f "pnpm-workspace.yaml" ]; then
    error "Ce script doit être exécuté depuis la racine du projet"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 DIAGNOSTIC"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vérifier Railway
info "Vérification Railway..."
cd apps/backend
if railway status &> /dev/null; then
    BACKEND_URL=$(railway domain 2>/dev/null | grep -o 'https://[^ ]*' || echo "")
    if [ ! -z "$BACKEND_URL" ]; then
        log "Backend Railway: $BACKEND_URL"
        
        # Tester le health check
        if curl -sf "$BACKEND_URL/health" &> /dev/null; then
            log "Health check: OK"
        else
            warn "Health check: ÉCHEC - L'application ne répond pas"
            info "Vérifiez les logs avec: railway logs"
        fi
    fi
else
    warn "Railway non lié"
fi

# Vérifier Vercel
info "Vérification Vercel..."
cd ../frontend
if [ -f ".vercel/project.json" ]; then
    log "Vercel lié au projet"
    
    # Vérifier NEXT_PUBLIC_API_URL
    API_URL=$(vercel env ls 2>/dev/null | grep "NEXT_PUBLIC_API_URL" | grep "Production" || echo "")
    if [ ! -z "$API_URL" ]; then
        log "NEXT_PUBLIC_API_URL configuré"
    else
        warn "NEXT_PUBLIC_API_URL non configuré en production"
    fi
else
    warn "Vercel non lié"
fi

cd ../..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 CORRECTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Correction 1: nixpacks.toml - copier le lockfile
info "Correction nixpacks.toml..."
if [ -f "pnpm-lock.yaml" ] && [ ! -f "apps/backend/pnpm-lock.yaml" ]; then
    cp pnpm-lock.yaml apps/backend/pnpm-lock.yaml
    log "pnpm-lock.yaml copié dans apps/backend/"
else
    log "pnpm-lock.yaml déjà présent"
fi

# Correction 2: Mettre à jour NEXT_PUBLIC_API_URL si nécessaire
info "Vérification NEXT_PUBLIC_API_URL..."
cd apps/frontend
if [ -f ".vercel/project.json" ]; then
    BACKEND_URL=$(cd ../backend && railway domain 2>/dev/null | grep -o 'https://[^ ]*' || echo "")
    if [ ! -z "$BACKEND_URL" ]; then
        API_URL="$BACKEND_URL/api"
        info "Backend URL détectée: $API_URL"
        
        read -p "Voulez-vous mettre à jour NEXT_PUBLIC_API_URL avec $API_URL? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "$API_URL" | vercel env add NEXT_PUBLIC_API_URL production
            log "NEXT_PUBLIC_API_URL mis à jour"
        fi
    fi
fi

cd ../..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DÉPLOIEMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Déployer Backend
read -p "Voulez-vous déployer le backend sur Railway? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd apps/backend
    info "Déploiement Railway..."
    railway up
    log "Backend déployé"
    cd ../..
fi

# Déployer Frontend
read -p "Voulez-vous déployer le frontend sur Vercel? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd apps/frontend
    info "Déploiement Vercel..."
    vercel --prod
    log "Frontend déployé"
    cd ../..
fi

echo ""
log "Terminé!"
echo ""
info "Commandes utiles:"
info "  - Logs Railway: cd apps/backend && railway logs"
info "  - Logs Vercel: cd apps/frontend && vercel logs <deployment-url>"
info "  - Health check: curl \$(cd apps/backend && railway domain)/health"










