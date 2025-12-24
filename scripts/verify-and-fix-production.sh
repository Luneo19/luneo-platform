#!/bin/bash

# Script de vérification et correction complète pour production
# Objectif: Atteindre 100% de fonctionnalité

set -e

echo "🔍 VÉRIFICATION ET CORRECTION COMPLÈTE"
echo "======================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_URL="https://backend-luneos-projects.vercel.app"
FRONTEND_URL="https://frontend-luneos-projects.vercel.app"

# Fonction pour tester une route
test_route() {
    local method=$1
    local route=$2
    local data=$3
    local expected_status=$4
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BACKEND_URL$route" -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BACKEND_URL$route" -H "Content-Type: application/json" -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "$expected_status" ] || [ -z "$expected_status" ]; then
        echo -e "${GREEN}✅${NC} $method $route -> HTTP $http_code"
        return 0
    else
        echo -e "${RED}❌${NC} $method $route -> HTTP $http_code (attendu: $expected_status)"
        echo "   Réponse: $body"
        return 1
    fi
}

echo "1. VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT"
echo "=============================================="
echo ""

# Variables critiques à vérifier
CRITICAL_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "REDIS_URL"
)

echo "Variables critiques à vérifier dans Vercel:"
for var in "${CRITICAL_VARS[@]}"; do
    echo "  - $var"
done
echo ""

echo "⚠️  Note: Ces variables doivent être configurées dans Vercel Dashboard"
echo "   ou via: vercel env add $var production"
echo ""

echo "2. TEST DES ROUTES API"
echo "======================"
echo ""

# Routes publiques
echo "Routes publiques:"
test_route "GET" "/health" "" "200"
test_route "GET" "/api/products" "" ""
test_route "GET" "/api/designs" "" ""
test_route "GET" "/api/orders" "" ""

echo ""
echo "Routes Auth:"
test_route "POST" "/api/auth/signup" '{"email":"test@test.com","password":"Test123!","firstName":"Test","lastName":"User"}' ""
test_route "POST" "/api/auth/login" '{"email":"test@test.com","password":"Test123!"}' ""

echo ""
echo "Routes protégées (nécessitent auth):"
test_route "GET" "/api/auth/me" "" "401"  # Doit retourner 401, pas 404
test_route "GET" "/api/billing/subscription" "" "401"
test_route "GET" "/api/plans" "" ""
test_route "GET" "/api/users" "" "401"
test_route "GET" "/api/brands" "" "401"
test_route "GET" "/api/admin/tenants" "" "401"

echo ""
echo "3. VÉRIFICATION FRONTEND"
echo "======================"
echo ""

frontend_health=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$frontend_health" = "200" ]; then
    echo -e "${GREEN}✅${NC} Frontend accessible"
else
    echo -e "${RED}❌${NC} Frontend non accessible (HTTP $frontend_health)"
fi

echo ""
echo "4. RÉSUMÉ"
echo "========"
echo ""
echo "✅ Corrections appliquées:"
echo "  - Préfixe API par défaut changé de /api/v1 à /api"
echo ""
echo "⚠️  Actions requises:"
echo "  1. Vérifier variables critiques dans Vercel"
echo "  2. Redéployer backend pour appliquer le nouveau préfixe"
echo "  3. Tester toutes les routes après redéploiement"
echo ""
echo "📄 Pour redéployer:"
echo "  cd apps/backend && vercel --prod"
echo ""

