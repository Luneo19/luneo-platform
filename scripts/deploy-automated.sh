#!/bin/bash

# Script de déploiement automatisé complet
# Usage: ./scripts/deploy-automated.sh

set -e

echo "🚀 DÉPLOIEMENT AUTOMATISÉ COMPLET"
echo "=================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Fonction de logging
log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    log_error "Railway CLI non installé"
    echo "Installation: npm i -g @railway/cli"
    exit 1
fi
log_info "Railway CLI détecté"

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    log_error "Vercel CLI non installé"
    echo "Installation: npm i -g vercel"
    exit 1
fi
log_info "Vercel CLI détecté"

# Vérifier connexion Railway
echo ""
echo "🔐 Vérification connexion Railway..."
if railway whoami &> /dev/null; then
    RAILWAY_USER=$(railway whoami 2>&1 | head -1)
    log_info "Connecté à Railway: $RAILWAY_USER"
else
    log_warn "Non connecté à Railway"
    echo "Tentative de connexion..."
    railway login || {
        log_error "Échec connexion Railway"
        exit 1
    }
fi

# Vérifier connexion Vercel
echo ""
echo "🔐 Vérification connexion Vercel..."
if vercel whoami &> /dev/null; then
    VERCEL_USER=$(vercel whoami 2>&1 | head -1)
    log_info "Connecté à Vercel: $VERCEL_USER"
else
    log_warn "Non connecté à Vercel"
    echo "Tentative de connexion..."
    vercel login || {
        log_error "Échec connexion Vercel"
        exit 1
    }
fi

# Vérifier projet Railway
echo ""
echo "📋 Vérification projet Railway..."
cd apps/backend
if railway status &> /dev/null; then
    log_info "Projet Railway lié"
    railway status
else
    log_warn "Projet Railway non lié"
    echo "Liaison du projet..."
    # Utiliser le projet ID existant si disponible
    if [ -n "$RAILWAY_PROJECT_ID" ]; then
        railway link -p "$RAILWAY_PROJECT_ID" || {
            log_error "Échec liaison projet Railway"
            exit 1
        }
    else
        log_error "RAILWAY_PROJECT_ID non défini"
        exit 1
    fi
fi

# Vérifier variables Railway
echo ""
echo "📋 Vérification variables Railway..."
MISSING_VARS=()
REQUIRED_VARS=("DATABASE_URL" "OPENAI_API_KEY" "ANTHROPIC_API_KEY" "MISTRAL_API_KEY")

for var in "${REQUIRED_VARS[@]}"; do
    if ! railway variables get "$var" &> /dev/null; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    log_warn "Variables manquantes: ${MISSING_VARS[*]}"
    echo "Veuillez les configurer dans Railway Dashboard"
    echo "Ou exécutez: ./scripts/configure-railway-vars.sh"
fi

# Déploiement Railway
echo ""
echo "🚀 Déploiement Railway..."
railway up --service backend 2>&1 | tee /tmp/railway-deploy.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    log_info "Déploiement Railway réussi"
    
    # Récupérer l'URL du déploiement
    BACKEND_URL=$(railway status 2>&1 | grep -i "url\|domain" | head -1 | awk '{print $NF}' || echo "")
    if [ -n "$BACKEND_URL" ]; then
        log_info "Backend URL: $BACKEND_URL"
        export BACKEND_URL
    fi
else
    log_error "Échec déploiement Railway"
    echo "Logs:"
    tail -50 /tmp/railway-deploy.log
    exit 1
fi

# Vérifier health check
echo ""
echo "🏥 Vérification health check..."
sleep 10 # Attendre que le déploiement soit prêt

if [ -n "$BACKEND_URL" ]; then
    HEALTH_CHECK=$(curl -s "$BACKEND_URL/health" || echo "FAILED")
    if [[ "$HEALTH_CHECK" == *"ok"* ]] || [[ "$HEALTH_CHECK" == *"status"* ]]; then
        log_info "Health check OK"
    else
        log_warn "Health check échoué ou URL non accessible"
    fi
fi

# Déploiement Vercel
echo ""
echo "🚀 Déploiement Vercel..."
cd ../frontend

# Vérifier projet Vercel
if [ -f ".vercel/project.json" ]; then
    log_info "Projet Vercel détecté"
else
    log_warn "Projet Vercel non initialisé"
    vercel link || {
        log_error "Échec liaison projet Vercel"
        exit 1
    }
fi

# Configurer variables Vercel si backend URL disponible
if [ -n "$BACKEND_URL" ]; then
    echo "Configuration NEXT_PUBLIC_API_URL..."
    echo "$BACKEND_URL" | vercel env add NEXT_PUBLIC_API_URL production 2>&1 | grep -v "already exists" || true
fi

# Déployer
vercel --prod 2>&1 | tee /tmp/vercel-deploy.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    log_info "Déploiement Vercel réussi"
    
    # Récupérer l'URL du déploiement
    FRONTEND_URL=$(vercel ls --json 2>/dev/null | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    if [ -n "$FRONTEND_URL" ]; then
        log_info "Frontend URL: https://$FRONTEND_URL"
        export FRONTEND_URL
    fi
else
    log_error "Échec déploiement Vercel"
    echo "Logs:"
    tail -50 /tmp/vercel-deploy.log
    exit 1
fi

# Tests E2E
echo ""
echo "🧪 Exécution tests E2E..."
cd ../..

if [ -n "$BACKEND_URL" ]; then
    # Attendre que le backend soit complètement prêt
    sleep 5
    
    # Exécuter tests (sans token pour l'instant, tests basiques)
    ./scripts/test-e2e-agents.sh "$BACKEND_URL" 2>&1 | tee /tmp/e2e-tests.log
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_info "Tests E2E réussis"
    else
        log_warn "Certains tests E2E ont échoué"
        echo "Logs:"
        tail -50 /tmp/e2e-tests.log
    fi
else
    log_warn "Impossible d'exécuter tests E2E (BACKEND_URL non disponible)"
fi

# Résumé
echo ""
echo "=================================="
echo "📊 RÉSUMÉ DÉPLOIEMENT"
echo "=================================="
echo ""
echo "Backend Railway:"
echo "  - URL: ${BACKEND_URL:-Non disponible}"
echo "  - Status: ✅ Déployé"
echo ""
echo "Frontend Vercel:"
echo "  - URL: https://${FRONTEND_URL:-Non disponible}"
echo "  - Status: ✅ Déployé"
echo ""
echo "Tests E2E:"
echo "  - Status: Voir logs ci-dessus"
echo ""
echo "=================================="
log_info "Déploiement terminé!"
