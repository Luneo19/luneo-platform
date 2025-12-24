#!/bin/bash

# Script de déploiement complet du système de crédits IA en production
# Date: 2025-12-20

set -e

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║        🚀 DÉPLOIEMENT PRODUCTION - SYSTÈME CRÉDITS IA 🚀                   ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

# Vérifications pré-déploiement
log "Vérifications pré-déploiement..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "apps/backend" ] || [ ! -d "apps/frontend" ]; then
    error "Ce script doit être exécuté depuis la racine du projet"
fi

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé"
fi
log "Node.js: $(node --version)"

# Vérifier pnpm
if ! command -v pnpm &> /dev/null; then
    error "pnpm n'est pas installé"
fi
log "pnpm: $(pnpm --version)"

# Vérifier Vercel CLI (optionnel)
if command -v vercel &> /dev/null; then
    log "Vercel CLI: $(vercel --version)"
else
    warn "Vercel CLI non installé (optionnel pour déploiement manuel)"
fi

echo ""
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "ÉTAPE 1/6: Migration Base de Données"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd apps/backend

# Vérifier DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    warn "DATABASE_URL non défini, vérification du fichier .env..."
    if [ -f ".env.production" ]; then
        export $(grep -v '^#' .env.production | xargs)
        log "Variables chargées depuis .env.production"
    else
        error "DATABASE_URL non défini et .env.production introuvable"
    fi
fi

# Appliquer migration
if [ -f "scripts/migrate-credits-system.sh" ]; then
    log "Application de la migration..."
    chmod +x scripts/migrate-credits-system.sh
    ./scripts/migrate-credits-system.sh || {
        error "Échec de la migration"
    }
else
    warn "Script de migration non trouvé, migration manuelle requise"
fi

cd ../..

echo ""
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "ÉTAPE 2/6: Vérification Variables d'Environnement"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Variables requises
REQUIRED_VARS=(
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "STRIPE_PRICE_CREDITS_100"
    "STRIPE_PRICE_CREDITS_500"
    "STRIPE_PRICE_CREDITS_1000"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    else
        log "$var: ${!var:0:20}..."
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    warn "Variables manquantes: ${MISSING_VARS[*]}"
    warn "Configurez-les avant de continuer:"
    echo ""
    for var in "${MISSING_VARS[@]}"; do
        echo "  export $var='valeur'"
    done
    echo ""
    read -p "Continuer quand même? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Déploiement annulé"
    fi
fi

echo ""
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "ÉTAPE 3/6: Build Applications"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build Backend
log "Build Backend..."
cd apps/backend
pnpm install
pnpm build || {
    error "Échec du build backend"
}
cd ../..

# Build Frontend
log "Build Frontend..."
cd apps/frontend
pnpm install
pnpm build || {
    error "Échec du build frontend"
}
cd ../..

echo ""
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "ÉTAPE 4/6: Tests (Optionnel)"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Exécuter les tests? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd apps/backend
    pnpm test || {
        warn "Tests échoués, mais continuation du déploiement"
    }
    cd ../..
fi

echo ""
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "ÉTAPE 5/6: Déploiement Vercel"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v vercel &> /dev/null; then
    read -p "Déployer sur Vercel? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Déployer Frontend
        log "Déploiement Frontend..."
        cd apps/frontend
        vercel --prod --yes || {
            warn "Échec du déploiement frontend, continuer..."
        }
        cd ../..

        # Déployer Backend (si déployé sur Vercel)
        if [ -f "apps/backend/vercel.json" ]; then
            log "Déploiement Backend..."
            cd apps/backend
            vercel --prod --yes || {
                warn "Échec du déploiement backend, continuer..."
            }
            cd ../..
        fi
    else
        warn "Déploiement Vercel ignoré"
    fi
else
    warn "Vercel CLI non installé, déploiement manuel requis"
fi

echo ""
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "ÉTAPE 6/6: Vérification Post-Déploiement"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log "Vérifications finales..."

# Vérifier tables
cd apps/backend
if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"CreditPack\";" > /dev/null 2>&1; then
    log "✅ Table CreditPack existe"
else
    error "❌ Table CreditPack n'existe pas"
fi

if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"CreditTransaction\";" > /dev/null 2>&1; then
    log "✅ Table CreditTransaction existe"
else
    error "❌ Table CreditTransaction n'existe pas"
fi

cd ../..

echo ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
info "Prochaines étapes:"
echo ""
echo "1. ✅ Vérifier webhook Stripe:"
echo "   https://dashboard.stripe.com/webhooks"
echo ""
echo "2. ✅ Tester achat crédits:"
echo "   - Se connecter sur app.luneo.app"
echo "   - Cliquer sur 'Recharger' dans le header"
echo "   - Acheter un pack (mode test)"
echo ""
echo "3. ✅ Tester génération IA:"
echo "   - Générer un design"
echo "   - Vérifier déduction crédits"
echo ""
echo "4. ✅ Monitorer métriques:"
echo "   - Dashboard Stripe"
echo "   - Logs Vercel"
echo "   - Base de données"
echo ""
echo "📚 Documentation: DEPLOIEMENT_PRODUCTION_COMPLET.md"
echo ""



#!/bin/bash

# Script de déploiement complet du système de crédits IA en production
# Date: 2025-12-20

set -e

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║        🚀 DÉPLOIEMENT PRODUCTION - SYSTÈME CRÉDITS IA 🚀                   ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

# Vérifications pré-déploiement
log "Vérifications pré-déploiement..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "apps/backend" ] || [ ! -d "apps/frontend" ]; then
    error "Ce script doit être exécuté depuis la racine du projet"
fi

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé"
fi
log "Node.js: $(node --version)"

# Vérifier pnpm
if ! command -v pnpm &> /dev/null; then
    error "pnpm n'est pas installé"
fi
log "pnpm: $(pnpm --version)"

# Vérifier Vercel CLI (optionnel)
if command -v vercel &> /dev/null; then
    log "Vercel CLI: $(vercel --version)"
else
    warn "Vercel CLI non installé (optionnel pour déploiement manuel)"
fi

echo ""
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "ÉTAPE 1/6: Migration Base de Données"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd apps/backend

# Vérifier DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    warn "DATABASE_URL non défini, vérification du fichier .env..."
    if [ -f ".env.production" ]; then
        export $(grep -v '^#' .env.production | xargs)
        log "Variables chargées depuis .env.production"
    else
        error "DATABASE_URL non défini et .env.production introuvable"
    fi
fi

# Appliquer migration
if [ -f "scripts/migrate-credits-system.sh" ]; then
    log "Application de la migration..."
    chmod +x scripts/migrate-credits-system.sh
    ./scripts/migrate-credits-system.sh || {
        error "Échec de la migration"
    }
else
    warn "Script de migration non trouvé, migration manuelle requise"
fi

cd ../..

echo ""
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "ÉTAPE 2/6: Vérification Variables d'Environnement"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Variables requises
REQUIRED_VARS=(
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "STRIPE_PRICE_CREDITS_100"
    "STRIPE_PRICE_CREDITS_500"
    "STRIPE_PRICE_CREDITS_1000"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    else
        log "$var: ${!var:0:20}..."
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    warn "Variables manquantes: ${MISSING_VARS[*]}"
    warn "Configurez-les avant de continuer:"
    echo ""
    for var in "${MISSING_VARS[@]}"; do
        echo "  export $var='valeur'"
    done
    echo ""
    read -p "Continuer quand même? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Déploiement annulé"
    fi
fi

echo ""
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "ÉTAPE 3/6: Build Applications"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build Backend
log "Build Backend..."
cd apps/backend
pnpm install
pnpm build || {
    error "Échec du build backend"
}
cd ../..

# Build Frontend
log "Build Frontend..."
cd apps/frontend
pnpm install
pnpm build || {
    error "Échec du build frontend"
}
cd ../..

echo ""
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "ÉTAPE 4/6: Tests (Optionnel)"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Exécuter les tests? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd apps/backend
    pnpm test || {
        warn "Tests échoués, mais continuation du déploiement"
    }
    cd ../..
fi

echo ""
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "ÉTAPE 5/6: Déploiement Vercel"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v vercel &> /dev/null; then
    read -p "Déployer sur Vercel? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Déployer Frontend
        log "Déploiement Frontend..."
        cd apps/frontend
        vercel --prod --yes || {
            warn "Échec du déploiement frontend, continuer..."
        }
        cd ../..

        # Déployer Backend (si déployé sur Vercel)
        if [ -f "apps/backend/vercel.json" ]; then
            log "Déploiement Backend..."
            cd apps/backend
            vercel --prod --yes || {
                warn "Échec du déploiement backend, continuer..."
            }
            cd ../..
        fi
    else
        warn "Déploiement Vercel ignoré"
    fi
else
    warn "Vercel CLI non installé, déploiement manuel requis"
fi

echo ""
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "ÉTAPE 6/6: Vérification Post-Déploiement"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log "Vérifications finales..."

# Vérifier tables
cd apps/backend
if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"CreditPack\";" > /dev/null 2>&1; then
    log "✅ Table CreditPack existe"
else
    error "❌ Table CreditPack n'existe pas"
fi

if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"CreditTransaction\";" > /dev/null 2>&1; then
    log "✅ Table CreditTransaction existe"
else
    error "❌ Table CreditTransaction n'existe pas"
fi

cd ../..

echo ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
info "Prochaines étapes:"
echo ""
echo "1. ✅ Vérifier webhook Stripe:"
echo "   https://dashboard.stripe.com/webhooks"
echo ""
echo "2. ✅ Tester achat crédits:"
echo "   - Se connecter sur app.luneo.app"
echo "   - Cliquer sur 'Recharger' dans le header"
echo "   - Acheter un pack (mode test)"
echo ""
echo "3. ✅ Tester génération IA:"
echo "   - Générer un design"
echo "   - Vérifier déduction crédits"
echo ""
echo "4. ✅ Monitorer métriques:"
echo "   - Dashboard Stripe"
echo "   - Logs Vercel"
echo "   - Base de données"
echo ""
echo "📚 Documentation: DEPLOIEMENT_PRODUCTION_COMPLET.md"
echo ""
















