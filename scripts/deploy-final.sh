#!/bin/bash

# 🚀 Script de déploiement final - Backend + Frontend
# Toutes les corrections ont été appliquées, le build fonctionne !

set -e

echo "🚀 DÉPLOIEMENT FINAL - LUNEO PLATFORM"
echo "======================================"
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
echo "📋 VÉRIFICATIONS PRÉ-DÉPLOIEMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vérifier Railway
info "Vérification Railway..."
cd apps/backend
if railway status &> /dev/null; then
    BACKEND_URL=$(railway domain 2>/dev/null | grep -o 'https://[^ ]*' || echo "")
    if [ ! -z "$BACKEND_URL" ]; then
        log "Backend Railway: $BACKEND_URL"
    else
        warn "URL backend non trouvée"
    fi
else
    error "Railway non lié. Exécutez: railway link"
fi

# Vérifier Vercel
info "Vérification Vercel..."
cd ../frontend
if [ -f ".vercel/project.json" ]; then
    log "Vercel lié au projet"
    
    # Vérifier NEXT_PUBLIC_API_URL
    API_URL=$(vercel env ls production 2>/dev/null | grep "NEXT_PUBLIC_API_URL" | grep "Production" || echo "")
    if [ ! -z "$API_URL" ]; then
        log "NEXT_PUBLIC_API_URL configuré"
        info "Vérifiez qu'il pointe vers: $BACKEND_URL/api"
    else
        warn "NEXT_PUBLIC_API_URL non configuré"
    fi
else
    error "Vercel non lié. Exécutez: vercel link"
fi

cd ../..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DÉPLOIEMENT BACKEND (RAILWAY)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Voulez-vous déployer le backend maintenant? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd apps/backend
    info "Déploiement Railway..."
    railway up
    log "Backend déployé"
    
    # Attendre un peu pour que le déploiement se stabilise
    info "Attente de la stabilisation du déploiement..."
    sleep 10
    
    # Tester le health check
    BACKEND_URL=$(railway domain 2>/dev/null | grep -o 'https://[^ ]*' || echo "")
    if [ ! -z "$BACKEND_URL" ]; then
        info "Test du health check..."
        if curl -sf "$BACKEND_URL/health" &> /dev/null; then
            log "Health check: OK"
        else
            warn "Health check: ÉCHEC - Vérifiez les logs avec: railway logs"
        fi
    fi
    
    cd ../..
else
    warn "Déploiement backend ignoré"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 MISE À JOUR NEXT_PUBLIC_API_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -z "$BACKEND_URL" ]; then
    API_URL="$BACKEND_URL/api"
    info "Backend URL: $API_URL"
    
    read -p "Voulez-vous mettre à jour NEXT_PUBLIC_API_URL avec $API_URL? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd apps/frontend
        echo "$API_URL" | vercel env add NEXT_PUBLIC_API_URL production
        log "NEXT_PUBLIC_API_URL mis à jour"
        cd ../..
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DÉPLOIEMENT FRONTEND (VERCEL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Voulez-vous déployer le frontend maintenant? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd apps/frontend
    
    # Vérifier que le build fonctionne
    info "Vérification du build local..."
    if pnpm run build &> /dev/null; then
        log "Build local: OK"
    else
        error "Le build local échoue. Corrigez les erreurs avant de déployer."
    fi
    
    info "Déploiement Vercel..."
    vercel --prod
    log "Frontend déployé"
    
    cd ../..
else
    warn "Déploiement frontend ignoré"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DÉPLOIEMENT TERMINÉ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log "Déploiement terminé!"
echo ""
info "Commandes utiles:"
info "  - Logs Railway: cd apps/backend && railway logs"
info "  - Logs Vercel: cd apps/frontend && vercel logs"
info "  - Health check: curl $BACKEND_URL/health"
info "  - Status Railway: railway status"
info "  - Status Vercel: vercel ls"













