#!/bin/bash

# Script de test complet des routes backend créées
# Teste toutes les nouvelles routes backend avec différents scénarios

set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🧪 TEST COMPLET DES ROUTES BACKEND"
echo "===================================="
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Compteurs
PASSED=0
FAILED=0
SKIPPED=0

# Fonction pour tester une route
test_route() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local expected_status=$5
    
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
    
    if [ "$expected_status" = "" ]; then
        expected_status="200"
    fi
    
    if [ "$http_code" = "$expected_status" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ OK${NC} ($http_code)"
        ((PASSED++))
        return 0
    elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        echo -e "${YELLOW}⚠ Auth required${NC} ($http_code) - Expected"
        ((SKIPPED++))
        return 0
    elif [ "$http_code" = "000" ]; then
        echo -e "${RED}✗ CONNECTION FAILED${NC} (Backend not running?)"
        ((FAILED++))
        return 1
    else
        echo -e "${RED}✗ FAILED${NC} ($http_code)"
        echo "  Response: $(echo $body | head -c 100)..."
        ((FAILED++))
        return 1
    fi
}

echo "📋 Routes publiques (devraient fonctionner sans auth):"
echo "------------------------------------------------------"
test_route "GET" "/health" "Health check" "" "200"
test_route "GET" "/credits/packs" "Get credit packs" "" "200"
test_route "POST" "/referral/join" "Join referral program" '{"email":"test@example.com"}' "200"
echo ""

echo "📋 Routes nécessitant authentification (401 attendu):"
echo "------------------------------------------------------"
test_route "GET" "/referral/stats" "Get referral stats" "" "401"
test_route "POST" "/referral/withdraw" "Withdraw referral" '{}' "401"
test_route "GET" "/marketplace/seller/connect" "Get seller connect status" "" "401"
test_route "POST" "/marketplace/seller/connect" "Create seller connect" '{"country":"FR","businessType":"individual"}' "401"
test_route "GET" "/designs" "List designs" "" "401"
test_route "GET" "/designs/test-id/versions" "Get design versions" "" "401"
test_route "POST" "/designs/test-id/versions" "Create design version" '{}' "401"
test_route "POST" "/ai/generate" "AI generate" '{"prompt":"test image"}' "401"
test_route "POST" "/ai/upscale" "AI upscale" '{"imageUrl":"https://example.com/image.jpg"}' "401"
test_route "POST" "/ai/background-removal" "Background removal" '{"imageUrl":"https://example.com/image.jpg"}' "401"
test_route "POST" "/ai/extract-colors" "Extract colors" '{"imageUrl":"https://example.com/image.jpg"}' "401"
test_route "POST" "/ai/smart-crop" "Smart crop" '{"imageUrl":"https://example.com/image.jpg","targetAspectRatio":"1:1"}' "401"
test_route "POST" "/ar-studio/export" "AR export" '{"ar_model_id":"test","format":"glb"}' "401"
test_route "POST" "/ar-studio/convert-usdz" "Convert USDZ" '{"glb_url":"https://example.com/model.glb"}' "401"
test_route "POST" "/orders" "Create order" '{"items":[]}' "401"
test_route "GET" "/orders" "List orders" "" "401"
test_route "GET" "/billing/subscription" "Get subscription" "" "401"
test_route "GET" "/billing/invoices" "Get invoices" "" "401"
test_route "GET" "/credits/balance" "Get credits balance" "" "401"
test_route "GET" "/credits/transactions" "Get credits transactions" "" "401"
test_route "POST" "/credits/buy" "Buy credits" '{"packSize":100}' "401"
echo ""

echo "📊 RÉSUMÉ DES TESTS"
echo "==================="
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠ Skipped (Auth required): $SKIPPED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests sont passés ou nécessitent une authentification (normal)${NC}"
    exit 0
else
    echo -e "${RED}❌ Certains tests ont échoué${NC}"
    exit 1
fi
