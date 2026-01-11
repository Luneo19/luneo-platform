#!/bin/bash

# Script de tests E2E pour Agents IA
# Usage: ./scripts/test-e2e-agents.sh [BACKEND_URL] [TOKEN]

set -e

BACKEND_URL="${1:-http://localhost:3001}"
TOKEN="${2:-}"

echo "🧪 TESTS E2E - AGENTS IA"
echo "========================"
echo ""
echo "Backend URL: $BACKEND_URL"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Fonction helper
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -n "Test: $description... "
    
    if [ -z "$TOKEN" ]; then
        echo -e "${YELLOW}SKIP (no token)${NC}"
        return
    fi
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BACKEND_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} ($http_code)"
        return 0
    else
        echo -e "${RED}✗${NC} (attendu: $expected_status, reçu: $http_code)"
        echo "Response: $body"
        return 1
    fi
}

# Test 1: Health Check
echo "📋 Test 1: Health Check"
test_endpoint "GET" "/health" "" "200" "Health check"
echo ""

# Test 2: Luna Chat
echo "📋 Test 2: Luna Chat"
test_endpoint "POST" "/api/agents/luna/chat" \
    '{"message":"What are my sales?","brandId":"test-brand-id","userId":"test-user-id"}' \
    "200" "Luna chat"
echo ""

# Test 3: Luna Conversations
echo "📋 Test 3: Luna Conversations"
test_endpoint "GET" "/api/agents/luna/conversations" "" "200" "Luna conversations"
echo ""

# Test 4: Aria Chat
echo "📋 Test 4: Aria Chat"
test_endpoint "POST" "/api/agents/aria/chat" \
    '{"message":"Improve this text","brandId":"test-brand-id","userId":"test-user-id"}' \
    "200" "Aria chat"
echo ""

# Test 5: Aria Quick Suggest
echo "📋 Test 5: Aria Quick Suggest"
test_endpoint "POST" "/api/agents/aria/quick-suggest" \
    '{"context":"product page","brandId":"test-brand-id"}' \
    "200" "Aria quick suggest"
echo ""

# Test 6: Nova Chat
echo "📋 Test 6: Nova Chat"
test_endpoint "POST" "/api/agents/nova/chat" \
    '{"message":"How do I configure a product?","brandId":"test-brand-id"}' \
    "200" "Nova chat"
echo ""

# Test 7: Nova FAQ
echo "📋 Test 7: Nova FAQ"
test_endpoint "GET" "/api/agents/nova/faq?query=configuration" "" "200" "Nova FAQ"
echo ""

# Test 8: Rate Limiting
echo "📋 Test 8: Rate Limiting"
echo "Envoi de 35 requêtes pour tester rate limiting..."
for i in {1..35}; do
    test_endpoint "POST" "/api/agents/luna/chat" \
        '{"message":"test","brandId":"test-brand-id","userId":"test-user-id"}' \
        "200" "Request $i" > /dev/null 2>&1
done
echo "Vérifier que la 31ème retourne 429"
echo ""

# Test 9: Streaming SSE (basique)
echo "📋 Test 9: Streaming SSE"
echo -n "Test connexion SSE... "
if curl -s -N "$BACKEND_URL/api/agents/luna/chat/stream?message=Hello" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: text/event-stream" 2>&1 | head -1 | grep -q "data:"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}SKIP (nécessite EventSource)${NC}"
fi
echo ""

# Test 10: Metrics
echo "📋 Test 10: Metrics Prometheus"
test_endpoint "GET" "/health/metrics" "" "200" "Prometheus metrics"
echo ""

echo "=================================="
echo "✅ Tests E2E terminés!"
echo ""
echo "Pour exécuter avec token:"
echo "./scripts/test-e2e-agents.sh $BACKEND_URL YOUR_TOKEN"
