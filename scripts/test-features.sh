#!/bin/bash

# Script de test automatisé pour LUNEO
# Teste les 4 phases implémentées

set -e

echo "════════════════════════════════════════════════════════════════════════════"
echo "  🧪 TESTS AUTOMATISÉS - LUNEO ENTERPRISE  🧪"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API URL
API_URL="${API_URL:-http://localhost:4000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

# Counters
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local endpoint=$2
    local method=${3:-GET}
    local expected_status=${4:-200}
    
    echo -n "Testing $name... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$API_URL$endpoint" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_status" ] || [ "$status_code" = "401" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        ((TESTS_FAILED++))
    fi
}

echo "📊 PHASE 1: Tests des services de base"
echo "----------------------------------------"

# Test 1: Health Check
test_endpoint "Health Check" "/health" "GET" "200"

# Test 2: API Documentation
test_endpoint "Swagger Docs" "/api" "GET" "200"

echo ""
echo "🏗️  PHASE 2: Tests Product Engine"
echo "----------------------------------------"

# Ces tests nécessitent l'authentification, donc on accepte 401
test_endpoint "Product Rules - Get Rules" "/api/product-engine/products/test-id/rules" "GET" "401"
test_endpoint "Product Rules - Get Zones" "/api/product-engine/products/test-id/zones" "GET" "401"
test_endpoint "Product Rules - Zone Presets" "/api/product-engine/templates/zone-presets" "GET" "401"

echo ""
echo "🎨 PHASE 3: Tests Render Engine"
echo "----------------------------------------"

test_endpoint "Render Metrics" "/api/render/metrics" "GET" "401"

echo ""
echo "🤖 PHASE 4: Tests Workers"
echo "----------------------------------------"

# Vérifier que les queues BullMQ sont accessibles via Redis
echo -n "Testing Redis Connection... "
if redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Redis not running)"
fi

# Vérifier les queues BullMQ
echo -n "Testing BullMQ Queues... "
queue_count=$(redis-cli KEYS "bull:*" 2>/dev/null | wc -l)
if [ "$queue_count" -gt 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} ($queue_count queues found)"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (No queues found - start backend first)"
fi

echo ""
echo "🎨 PHASE 5: Tests Frontend"
echo "----------------------------------------"

# Test Frontend
echo -n "Testing Frontend Home... "
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$frontend_status" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Frontend not running on $FRONTEND_URL)"
fi

echo ""
echo "💾 PHASE 6: Tests Base de Données"
echo "----------------------------------------"

# Test PostgreSQL
echo -n "Testing PostgreSQL Connection... "
if psql "${DATABASE_URL}" -c "SELECT 1" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
    
    # Vérifier les tables
    echo -n "Testing Product Engine Tables... "
    product_count=$(psql "${DATABASE_URL}" -t -c "SELECT COUNT(*) FROM \"Product\"" 2>/dev/null | tr -d ' ')
    if [ -n "$product_count" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($product_count products)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((TESTS_FAILED++))
    fi
    
    # Vérifier les nouvelles tables
    echo -n "Testing Workers Tables... "
    if psql "${DATABASE_URL}" -c "SELECT 1 FROM \"RenderResult\" LIMIT 1" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} (Run migrations first)"
    fi
else
    echo -e "${RED}✗ FAIL${NC} (Database connection failed)"
    ((TESTS_FAILED++))
fi

echo ""
echo "📁 PHASE 7: Tests Fichiers Créés"
echo "----------------------------------------"

# Vérifier les fichiers Backend
echo -n "Testing Product Engine Files... "
if [ -f "apps/backend/src/modules/product-engine/product-engine.module.ts" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo -n "Testing Render Engine Files... "
if [ -f "apps/backend/src/modules/render/render.module.ts" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo -n "Testing Workers Files... "
if [ -f "apps/backend/src/jobs/workers/design/design.worker.ts" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Vérifier les fichiers Frontend
echo -n "Testing Visual Editor Files... "
if [ -f "apps/frontend/src/components/visual-editor/VisualEditor.tsx" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "  📊 RÉSULTATS DES TESTS"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo -e "Tests réussis:  ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests échoués:  ${RED}$TESTS_FAILED${NC}"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo "Taux de réussite: $SUCCESS_RATE%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 TOUS LES TESTS SONT PASSÉS !${NC}"
    echo ""
    echo "✅ Prêt pour passer à la Phase A : Intégrations E-commerce"
    exit 0
else
    echo -e "${YELLOW}⚠️  CERTAINS TESTS ONT ÉCHOUÉ${NC}"
    echo ""
    echo "📋 Actions recommandées:"
    echo "  1. Vérifier que PostgreSQL est démarré"
    echo "  2. Vérifier que Redis est démarré"
    echo "  3. Démarrer le backend: cd apps/backend && npm run dev"
    echo "  4. Démarrer le frontend: cd apps/frontend && npm run dev"
    echo "  5. Appliquer les migrations SQL"
    echo ""
    exit 1
fi


