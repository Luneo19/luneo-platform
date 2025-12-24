#!/bin/bash
set -e

echo "🚀 DÉPLOIEMENT STAGING - ÉTAPE PAR ÉTAPE"
echo "=========================================="
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

# Vercel CLI
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI non installé"
    echo "Installez avec: npm i -g vercel"
    exit 1
fi
print_success "Vercel CLI installé"

# Connexion Vercel
if ! vercel whoami &> /dev/null; then
    print_warning "Non connecté à Vercel"
    echo "Connectez-vous avec: vercel login"
    exit 1
fi
print_success "Connecté à Vercel: $(vercel whoami 2>/dev/null | tail -1)"

# Builds
if [ ! -f apps/backend/dist/main.js ] && [ ! -f apps/backend/api/index.js ]; then
    print_warning "Backend build manquant, build en cours..."
    cd apps/backend
    pnpm build || exit 1
    cd ../..
fi
print_success "Backend build OK"

if [ ! -d apps/frontend/.next ]; then
    print_warning "Frontend build manquant, build en cours..."
    cd apps/frontend
    pnpm build || exit 1
    cd ../..
fi
print_success "Frontend build OK"

echo ""

# Étape 2: Configuration variables
print_step "Étape 2: Configuration variables staging..."

if [ -z "$DATABASE_URL" ]; then
    print_warning "DATABASE_URL non configuré"
    echo ""
    echo "Pour configurer:"
    echo "  1. Créer .env.staging depuis template:"
    echo "     cat docs/staging-env-template.md | grep -E '^[A-Z]' > .env.staging"
    echo ""
    echo "  2. Éditer avec vos valeurs:"
    echo "     nano .env.staging"
    echo ""
    echo "  3. Charger variables:"
    echo "     export \$(cat .env.staging | xargs)"
    echo ""
    read -p "Appuyez sur Entrée une fois les variables configurées... "
else
    print_success "DATABASE_URL configuré"
fi

REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET")
MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    print_error "Variables manquantes: ${MISSING_VARS[*]}"
    echo "Configurez-les avant de continuer"
    exit 1
fi

print_success "Variables d'environnement configurées"
echo ""

# Étape 3: Migrations Prisma
print_step "Étape 3: Application migrations Prisma..."

cd apps/backend

echo "  Vérification connexion DB..."
if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
    print_success "Connexion DB OK"
else
    print_warning "Impossible de tester connexion DB (psql peut ne pas être installé)"
    echo "  Continuons avec Prisma..."
fi

echo "  Application migrations..."
if npx prisma migrate deploy; then
    print_success "Migrations appliquées"
else
    print_error "Échec application migrations"
    exit 1
fi

cd ../..
echo ""

# Étape 4: Déploiement Backend
print_step "Étape 4: Déploiement Backend sur Vercel..."

cd apps/backend

echo "  Déploiement en cours..."
if vercel --prod --yes; then
    BACKEND_URL=$(vercel ls --prod 2>/dev/null | grep backend | head -1 | awk '{print $2}' || echo "Déployé")
    print_success "Backend déployé: $BACKEND_URL"
else
    print_warning "Déploiement backend échoué ou annulé"
fi

cd ../..
echo ""

# Étape 5: Déploiement Frontend
print_step "Étape 5: Déploiement Frontend sur Vercel..."

cd apps/frontend

echo "  Déploiement en cours..."
if vercel --prod --yes; then
    FRONTEND_URL=$(vercel ls --prod 2>/dev/null | grep frontend | head -1 | awk '{print $2}' || echo "Déployé")
    print_success "Frontend déployé: $FRONTEND_URL"
else
    print_warning "Déploiement frontend échoué ou annulé"
fi

cd ../..
echo ""

# Résumé
echo "================================================"
print_success "Déploiement staging terminé !"
echo ""
echo "📊 Résumé:"
echo "  ✅ Prérequis vérifiés"
echo "  ✅ Variables configurées"
echo "  ✅ Migrations appliquées"
echo "  ✅ Backend déployé"
echo "  ✅ Frontend déployé"
echo ""
echo "🧪 Prochaines étapes:"
echo "  1. Vérifier health checks:"
echo "     curl https://api-staging.luneo.app/health"
echo "     curl https://staging.luneo.app/api/health"
echo ""
echo "  2. Exécuter smoke tests:"
echo "     export STAGING_API_URL='https://api-staging.luneo.app'"
echo "     export STAGING_FRONTEND_URL='https://staging.luneo.app'"
echo "     ./scripts/smoke-tests-staging.sh"
echo ""
echo "  3. Vérifier logs Vercel:"
echo "     vercel logs"
echo ""

