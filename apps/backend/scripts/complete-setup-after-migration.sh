#!/bin/bash

# Script complet après migration DB manuelle
# Exécute: régénération Prisma, build, création Stripe, déploiement

set -e

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║        🚀 SETUP COMPLET APRÈS MIGRATION DB 🚀                              ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Vérifier que la migration a été appliquée
log "Vérification migration DB..."
if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"CreditPack\";" > /dev/null 2>&1; then
    log "✅ Table CreditPack existe"
else
    error "❌ Migration DB non appliquée. Veuillez appliquer la migration SQL manuellement d'abord."
fi

# 1. Régénérer Prisma
log "Régénération Prisma Client..."
npx prisma generate || error "Échec génération Prisma"

# 2. Build Backend
log "Build Backend..."
pnpm build || error "Échec build backend"

# 3. Créer produits Stripe
log "Création produits Stripe..."
if [ -n "$STRIPE_SECRET_KEY" ]; then
    node scripts/create-stripe-products.js || warn "Échec création produits Stripe (peut être fait manuellement)"
else
    warn "STRIPE_SECRET_KEY non défini, saut création produits"
fi

# 4. Déployer
log "Déploiement..."
read -p "Déployer sur Vercel? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v vercel &> /dev/null; then
        vercel --prod --yes || warn "Échec déploiement Vercel"
    else
        warn "Vercel CLI non installé"
    fi
fi

log "🎉 Setup terminé!"



#!/bin/bash

# Script complet après migration DB manuelle
# Exécute: régénération Prisma, build, création Stripe, déploiement

set -e

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║        🚀 SETUP COMPLET APRÈS MIGRATION DB 🚀                              ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Vérifier que la migration a été appliquée
log "Vérification migration DB..."
if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"CreditPack\";" > /dev/null 2>&1; then
    log "✅ Table CreditPack existe"
else
    error "❌ Migration DB non appliquée. Veuillez appliquer la migration SQL manuellement d'abord."
fi

# 1. Régénérer Prisma
log "Régénération Prisma Client..."
npx prisma generate || error "Échec génération Prisma"

# 2. Build Backend
log "Build Backend..."
pnpm build || error "Échec build backend"

# 3. Créer produits Stripe
log "Création produits Stripe..."
if [ -n "$STRIPE_SECRET_KEY" ]; then
    node scripts/create-stripe-products.js || warn "Échec création produits Stripe (peut être fait manuellement)"
else
    warn "STRIPE_SECRET_KEY non défini, saut création produits"
fi

# 4. Déployer
log "Déploiement..."
read -p "Déployer sur Vercel? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v vercel &> /dev/null; then
        vercel --prod --yes || warn "Échec déploiement Vercel"
    else
        warn "Vercel CLI non installé"
    fi
fi

log "🎉 Setup terminé!"

























