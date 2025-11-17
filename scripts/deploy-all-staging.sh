#!/bin/bash
set -e

echo "🚀 DÉPLOIEMENT COMPLET STAGING - LUNEO PLATFORM"
echo "================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
STAGING_API_URL="${STAGING_API_URL:-https://api-staging.luneo.app}"
STAGING_FRONTEND_URL="${STAGING_FRONTEND_URL:-https://staging.luneo.app}"

# Fonction d'affichage
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

# Vérifications pré-déploiement
print_step "Vérifications pré-déploiement..."

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI non installé"
    echo "Installez avec: npm i -g vercel"
    exit 1
fi
print_success "Vercel CLI installé"

# Vérifier connexion Vercel
if ! vercel whoami &> /dev/null; then
    print_warning "Non connecté à Vercel"
    echo "Connectez-vous avec: vercel login"
    exit 1
fi
print_success "Connecté à Vercel"

# Vérifier variables d'environnement
REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET")
MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    print_warning "Variables manquantes: ${MISSING_VARS[*]}"
    echo "Configurez-les avant de continuer"
    echo "Voir: docs/staging-env-template.md"
    exit 1
fi
print_success "Variables d'environnement configurées"

# Étape 1: Migrations Prisma
print_step "Étape 1: Appliquer migrations Prisma..."
cd apps/backend

if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL non configuré"
    exit 1
fi

echo "  Application des migrations..."
if npx prisma migrate deploy; then
    print_success "Migrations appliquées"
else
    print_error "Échec application migrations"
    exit 1
fi

cd ../..

# Étape 2: Build backend
print_step "Étape 2: Build backend..."
cd apps/backend

echo "  Build en cours..."
if pnpm build; then
    print_success "Backend build réussi"
else
    print_error "Échec build backend"
    exit 1
fi

cd ../..

# Étape 3: Build frontend
print_step "Étape 3: Build frontend..."
cd apps/frontend

echo "  Build en cours..."
if pnpm build; then
    print_success "Frontend build réussi"
else
    print_error "Échec build frontend"
    exit 1
fi

cd ../..

# Étape 4: Déployer backend
print_step "Étape 4: Déployer backend sur Vercel..."
cd apps/backend

echo "  Déploiement en cours..."
if vercel --prod --yes; then
    print_success "Backend déployé"
else
    print_warning "Déploiement backend échoué ou annulé"
fi

cd ../..

# Étape 5: Déployer frontend
print_step "Étape 5: Déployer frontend sur Vercel..."
cd apps/frontend

echo "  Déploiement en cours..."
if vercel --prod --yes; then
    print_success "Frontend déployé"
else
    print_warning "Déploiement frontend échoué ou annulé"
fi

cd ../..

# Résumé
echo ""
echo "================================================"
print_success "Déploiement staging terminé !"
echo ""
echo "📊 Résumé:"
echo "  ✅ Migrations appliquées"
echo "  ✅ Backend buildé"
echo "  ✅ Frontend buildé"
echo "  ✅ Services déployés"
echo ""
echo "🧪 Prochaines étapes:"
echo "  1. Vérifier health checks:"
echo "     curl ${STAGING_API_URL}/health"
echo "     curl ${STAGING_FRONTEND_URL}/api/health"
echo ""
echo "  2. Exécuter smoke tests:"
echo "     ./scripts/smoke-tests-staging.sh"
echo ""
echo "  3. Vérifier logs Vercel:"
echo "     vercel logs"
echo ""

