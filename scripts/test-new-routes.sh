#!/bin/bash

# Script de test des nouvelles routes backend
# Teste les routes créées récemment

set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "🧪 TEST DES NOUVELLES ROUTES BACKEND"
echo "===================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour tester une route
test_route() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -n "Testing $method $endpoint ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL$endpoint" \
            -H "Content-Type: application/json" 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BACKEND_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null || echo "000")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ OK${NC} ($http_code)"
        return 0
    elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        echo -e "${YELLOW}⚠ Auth required${NC} ($http_code) - Expected"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} ($http_code)"
        echo "  Response: $body" | head -c 200
        echo ""
        return 1
    fi
}

# Tests des routes publiques (sans auth)
echo "📋 Routes publiques:"
test_route "GET" "/health" "Health check"
test_route "GET" "/credits/packs" "Get credit packs" ""

echo ""
echo "📋 Routes nécessitant authentification (401 attendu):"
test_route "GET" "/referral/stats" "Get referral stats"
test_route "POST" "/referral/withdraw" "Withdraw referral" '{}'
test_route "GET" "/marketplace/seller/connect" "Get seller connect status"
test_route "POST" "/marketplace/seller/connect" "Create seller connect" '{"country":"FR","businessType":"individual"}'
test_route "POST" "/ai/smart-crop" "Smart crop" '{"imageUrl":"https://example.com/image.jpg","targetAspectRatio":"1:1"}'
test_route "POST" "/ai/generate" "AI generate" '{"prompt":"test image"}'
test_route "POST" "/ai/upscale" "AI upscale" '{"imageUrl":"https://example.com/image.jpg"}'
test_route "POST" "/ai/background-removal" "Background removal" '{"imageUrl":"https://example.com/image.jpg"}'
test_route "POST" "/ai/extract-colors" "Extract colors" '{"imageUrl":"https://example.com/image.jpg"}'

echo ""
echo "📋 Routes publiques (POST):"
test_route "POST" "/referral/join" "Join referral program" '{"email":"test@example.com"}'

echo ""
echo "✅ Tests terminés!"
echo ""
echo "Note: Les routes nécessitant une authentification retourneront 401/403,"
echo "      ce qui est normal si vous n'avez pas fourni de token JWT valide."
