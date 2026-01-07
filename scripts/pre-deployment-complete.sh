#!/bin/bash

# Script complet pour toutes les actions recommandées avant déploiement
# Usage: ./scripts/pre-deployment-complete.sh

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Configuration Complète Avant Déploiement${NC}"
echo "=============================================="
echo ""

# Fonction pour afficher le statut
print_step() {
    echo -e "${BLUE}📋 Étape $1: $2${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo ""
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo ""
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    echo ""
}

# Étape 1: Vérifications initiales
print_step "1" "Vérifications initiales"
./scripts/run-all-checks.sh
echo ""

# Étape 2: Configuration Vercel
print_step "2" "Configuration Variables Vercel"
echo "Choisissez le type de projet:"
echo "  1) Backend"
echo "  2) Frontend"
echo "  3) Les deux"
read -p "Votre choix (1/2/3): " vercel_choice

if [ "$vercel_choice" = "1" ] || [ "$vercel_choice" = "3" ]; then
    echo ""
    echo "Configuration Backend Vercel..."
    read -p "Environnement (production/preview/development) [production]: " env_backend
    env_backend=${env_backend:-production}
    ./scripts/configure-vercel-env.sh "$env_backend" "backend"
    print_success "Backend Vercel configuré"
fi

if [ "$vercel_choice" = "2" ] || [ "$vercel_choice" = "3" ]; then
    echo ""
    echo "Configuration Frontend Vercel..."
    read -p "Environnement (production/preview/development) [production]: " env_frontend
    env_frontend=${env_frontend:-production}
    ./scripts/configure-vercel-env.sh "$env_frontend" "frontend"
    print_success "Frontend Vercel configuré"
fi

echo ""

# Étape 3: Configuration Railway
print_step "3" "Configuration Variables Railway"
read -p "Voulez-vous configurer Railway maintenant? (oui/non): " configure_railway
if [ "$configure_railway" = "oui" ]; then
    ./scripts/configure-railway-env.sh
    print_success "Railway configuré"
else
    print_warning "Railway ignoré (peut être configuré plus tard)"
fi
echo ""

# Étape 4: Vérification Redis
print_step "4" "Vérification Redis pour BullMQ"
read -p "URL Redis (ou appuyez sur Entrée pour utiliser REDIS_URL de l'environnement): " redis_url
if [ -n "$redis_url" ]; then
    ./scripts/verify-redis.sh "$redis_url"
else
    if [ -n "$REDIS_URL" ]; then
        ./scripts/verify-redis.sh "$REDIS_URL"
    elif [ -n "$REDIS_HOST" ]; then
        ./scripts/verify-redis.sh "redis://$REDIS_HOST:${REDIS_PORT:-6379}"
    else
        print_warning "Redis URL non fournie, test ignoré"
        echo "Pour tester Redis plus tard: ./scripts/verify-redis.sh <REDIS_URL>"
    fi
fi
echo ""

# Étape 5: Configuration S3
print_step "5" "Configuration S3 pour Storage"
read -p "Voulez-vous configurer S3 maintenant? (oui/non): " configure_s3
if [ "$configure_s3" = "oui" ]; then
    ./scripts/configure-s3.sh
    print_success "S3 configuré"
else
    print_warning "S3 ignoré (peut être configuré plus tard)"
    echo "Pour configurer S3 plus tard: ./scripts/configure-s3.sh"
fi
echo ""

# Étape 6: Test des endpoints
print_step "6" "Test des Endpoints API"
read -p "URL de l'API (défaut: http://localhost:3001): " api_url
api_url=${api_url:-http://localhost:3001}

read -p "API Key (ou appuyez sur Entrée pour utiliser 'test-api-key'): " api_key
api_key=${api_key:-test-api-key}

echo ""
echo "⚠️  Note: Les tests nécessitent que l'API soit démarrée"
read -p "L'API est-elle démarrée? (oui/non): " api_running

if [ "$api_running" = "oui" ]; then
    ./scripts/test-endpoints.sh "$api_url" "$api_key"
    print_success "Tests des endpoints terminés"
else
    print_warning "Tests des endpoints ignorés (API non démarrée)"
    echo "Pour tester plus tard: ./scripts/test-endpoints.sh <API_URL> <API_KEY>"
fi
echo ""

# Résumé final
echo "=============================================="
echo -e "${GREEN}✅ Configuration Complète Terminée${NC}"
echo "=============================================="
echo ""
echo "📋 Résumé des actions:"
echo "  ✅ Vérifications initiales"
if [ "$vercel_choice" = "1" ] || [ "$vercel_choice" = "3" ]; then
    echo "  ✅ Backend Vercel configuré"
fi
if [ "$vercel_choice" = "2" ] || [ "$vercel_choice" = "3" ]; then
    echo "  ✅ Frontend Vercel configuré"
fi
if [ "$configure_railway" = "oui" ]; then
    echo "  ✅ Railway configuré"
fi
if [ "$configure_s3" = "oui" ]; then
    echo "  ✅ S3 configuré"
fi
echo ""
echo "🎯 Prochaines étapes pour déploiement:"
echo "  1. Vérifier les variables d'environnement:"
echo "     - Vercel: vercel env ls"
echo "     - Railway: railway variables"
echo ""
echo "  2. Déployer:"
echo "     - Backend (Railway): cd apps/backend && railway up"
echo "     - Frontend (Vercel): cd apps/frontend && vercel --prod"
echo ""
echo "  3. Tester en production:"
echo "     - ./scripts/test-endpoints.sh <PRODUCTION_API_URL> <API_KEY>"
echo ""





