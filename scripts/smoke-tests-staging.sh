#!/bin/bash
set -e

echo "🧪 SMOKE TESTS STAGING - LUNEO PLATFORM"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
STAGING_API_URL="${STAGING_API_URL:-https://api-staging.luneo.app}"
STAGING_FRONTEND_URL="${STAGING_FRONTEND_URL:-https://staging.luneo.app}"
TEST_SHOP="${TEST_SHOP:-test.myshopify.com}"
TEST_BRAND_ID="${TEST_BRAND_ID:-test-brand-id}"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  API: ${STAGING_API_URL}"
echo "  Frontend: ${STAGING_FRONTEND_URL}"
echo ""

# Compteurs
PASSED=0
FAILED=0

# Fonction de test
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=${4:-}
    
    echo -n "  Test: $name... "
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
        echo "    Response: $body"
        ((FAILED++))
        return 1
    fi
}

# Tests
echo -e "${YELLOW}🏥 Health Checks${NC}"
test_endpoint "API Health" "${STAGING_API_URL}/health"
test_endpoint "Frontend Health" "${STAGING_FRONTEND_URL}/api/health"

echo ""
echo -e "${YELLOW}🛍️  Shopify Integration${NC}"
test_endpoint "Shopify Install Endpoint" \
    "${STAGING_API_URL}/api/shopify/install?shop=${TEST_SHOP}&brandId=${TEST_BRAND_ID}"

echo ""
echo -e "${YELLOW}📦 Widget Integration${NC}"
test_endpoint "Widget Token Endpoint" \
    "${STAGING_API_URL}/api/v1/embed/token?shop=${TEST_SHOP}"

echo ""
echo -e "${YELLOW}🔐 Security${NC}"
test_endpoint "JWT Rotation Status" \
    "${STAGING_API_URL}/api/security/jwt/rotation/status"

# Résumé
echo ""
echo "========================================"
echo -e "${GREEN}✅ Tests réussis: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Tests échoués: $FAILED${NC}"
else
    echo -e "${GREEN}✅ Tous les tests sont passés !${NC}"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi

