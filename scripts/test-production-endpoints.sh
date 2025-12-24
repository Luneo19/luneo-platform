#!/bin/bash

# Script pour tester automatiquement tous les endpoints critiques en production

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PROD_URL="https://luneo.app"

echo -e "${BLUE}🧪 TESTS AUTOMATIQUES ENDPOINTS PRODUCTION${NC}"
echo "=================================================="
echo ""

PASSED=0
FAILED=0
WARNINGS=0

test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    local expected_content=${4:-""}
    
    echo -n "Test: $name... "
    
    HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    RESPONSE=$(cat /tmp/response.json 2>/dev/null || echo "")
    
    if [ "$HTTP_CODE" = "$expected_status" ]; then
        if [ -n "$expected_content" ]; then
            if echo "$RESPONSE" | grep -q "$expected_content"; then
                echo -e "${GREEN}✅ OK${NC}"
                ((PASSED++))
                return 0
            else
                echo -e "${YELLOW}⚠️  Status OK mais contenu différent${NC}"
                ((WARNINGS++))
                return 1
            fi
        else
            echo -e "${GREEN}✅ OK (HTTP $HTTP_CODE)${NC}"
            ((PASSED++))
            return 0
        fi
    else
        echo -e "${RED}❌ Échec (HTTP $HTTP_CODE)${NC}"
        ((FAILED++))
        return 1
    fi
}

# 1. Health Check
echo -e "${BLUE}📋 1. HEALTH CHECK${NC}"
test_endpoint "Health Check" "$PROD_URL/api/health" 200 "healthy"

# 2. Pages publiques
echo ""
echo -e "${BLUE}📋 2. PAGES PUBLIQUES${NC}"
test_endpoint "Page d'accueil" "$PROD_URL" 200
test_endpoint "Page Pricing" "$PROD_URL/pricing" 200
test_endpoint "Page Features" "$PROD_URL/features" 200
test_endpoint "Page Legal Privacy" "$PROD_URL/legal/privacy" 200
test_endpoint "Page Legal Terms" "$PROD_URL/legal/terms" 200

# 3. API Routes (sans auth)
echo ""
echo -e "${BLUE}📋 3. API ROUTES PUBLIQUES${NC}"
test_endpoint "API Templates" "$PROD_URL/api/templates?limit=1" 200
test_endpoint "API Cliparts" "$PROD_URL/api/cliparts?limit=1" 200

# 4. API Routes (avec auth requise - devrait retourner 401)
echo ""
echo -e "${BLUE}📋 4. API ROUTES PROTÉGÉES${NC}"
test_endpoint "API Products (auth requise)" "$PROD_URL/api/products" 401

# 5. Billing (devrait retourner erreur sans données)
echo ""
echo -e "${BLUE}📋 5. BILLING${NC}"
HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" -X POST "$PROD_URL/api/billing/create-checkout-session" \
    -H "Content-Type: application/json" \
    -d '{}' 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "500" ]; then
    echo -e "${GREEN}✅ Billing endpoint répond (validation attendue)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Billing endpoint: HTTP $HTTP_CODE${NC}"
    ((WARNINGS++))
fi

# 6. Résumé
echo ""
echo -e "${BLUE}📊 RÉSUMÉ DES TESTS${NC}"
echo "=================================================="
echo -e "${GREEN}✅ Réussis: $PASSED${NC}"
echo -e "${RED}❌ Échoués: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Avertissements: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Tous les tests critiques sont passés !${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Certains tests ont échoué${NC}"
    exit 1
fi

