#!/bin/bash
set -e

echo "🚀 DÉPLOIEMENT PROFESSIONNEL SUR VERCEL"
echo "========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Étape 1: Vérification prérequis
print_step "Étape 1: Vérification prérequis..."

if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI non installé"
    exit 1
fi
print_success "Vercel CLI installé"

if ! vercel whoami &> /dev/null; then
    print_error "Non connecté à Vercel"
    exit 1
fi
VERCEL_USER=$(vercel whoami 2>/dev/null | tail -1)
print_success "Connecté à Vercel: $VERCEL_USER"

echo ""

# Étape 2: Build backend
print_step "Étape 2: Build backend..."

cd apps/backend

if [ ! -f dist/main.js ] && [ ! -f api/index.js ]; then
    print_warning "Build manquant, build en cours..."
    if pnpm build; then
        print_success "Backend build réussi"
    else
        print_error "Échec build backend"
        exit 1
    fi
else
    print_success "Backend build déjà présent"
fi

cd ../..
echo ""

# Étape 3: Build frontend
print_step "Étape 3: Build frontend..."

cd apps/frontend

if [ ! -d .next ]; then
    print_warning "Build manquant, build en cours..."
    if pnpm build; then
        print_success "Frontend build réussi"
    else
        print_error "Échec build frontend"
        exit 1
    fi
else
    print_success "Frontend build déjà présent"
fi

cd ../..
echo ""

# Étape 4: Déploiement Backend
print_step "Étape 4: Déploiement Backend sur Vercel..."

cd apps/backend

print_warning "Liaison au projet Vercel..."
vercel link --yes --scope=$VERCEL_USER 2>&1 | grep -v "Already linked" || true

echo "  Déploiement en cours..."
if vercel --prod --yes; then
    print_success "Backend déployé avec succès"
    BACKEND_URL=$(vercel ls --prod 2>/dev/null | grep -i backend | head -1 | awk '{print $2}' || echo "Déployé")
    echo "  URL: $BACKEND_URL"
else
    print_error "Échec déploiement backend"
    exit 1
fi

cd ../..
echo ""

# Étape 5: Déploiement Frontend
print_step "Étape 5: Déploiement Frontend sur Vercel..."

cd apps/frontend

print_warning "Liaison au projet Vercel..."
vercel link --yes --scope=$VERCEL_USER 2>&1 | grep -v "Already linked" || true

echo "  Déploiement en cours..."
if vercel --prod --yes; then
    print_success "Frontend déployé avec succès"
    FRONTEND_URL=$(vercel ls --prod 2>/dev/null | grep -i frontend | head -1 | awk '{print $2}' || echo "Déployé")
    echo "  URL: $FRONTEND_URL"
else
    print_error "Échec déploiement frontend"
    exit 1
fi

cd ../..
echo ""

# Résumé
echo "================================================"
print_success "Déploiement professionnel terminé !"
echo ""
echo "📊 Résumé:"
echo "  ✅ Backend déployé"
echo "  ✅ Frontend déployé"
echo ""
echo "🧪 Prochaines étapes:"
echo "  1. Configurer variables d'environnement dans Vercel Dashboard"
echo "  2. Vérifier health checks"
echo "  3. Exécuter smoke tests"
echo ""
echo "📚 Documentation:"
echo "  - Variables requises: docs/staging-env-template.md"
echo "  - Guide déploiement: .github/DEPLOYMENT_READY.md"
echo ""

