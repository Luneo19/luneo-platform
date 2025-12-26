#!/bin/bash

# Script de vérification post-déploiement
# Usage: ./scripts/verify-production.sh [api-url]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="${1:-http://localhost:3000}"
HEALTH_URL="$API_URL/health"
METRICS_URL="$API_URL/health/metrics"

echo -e "${GREEN}🔍 LUNEO Backend - Vérification Production${NC}"
echo "=========================================="
echo "API URL: $API_URL"
echo ""

# Test 1: Health check
echo -e "${YELLOW}1. Health Check${NC}"
if curl -f -s "$HEALTH_URL" > /dev/null; then
  echo -e "${GREEN}✅ Health check passed${NC}"
  curl -s "$HEALTH_URL" | jq '.' 2>/dev/null || curl -s "$HEALTH_URL"
else
  echo -e "${RED}❌ Health check failed${NC}"
  exit 1
fi

# Test 2: Metrics endpoint
echo -e "\n${YELLOW}2. Metrics Endpoint${NC}"
if curl -f -s "$METRICS_URL" > /dev/null; then
  echo -e "${GREEN}✅ Metrics endpoint accessible${NC}"
  
  # Check for key metrics
  METRICS=$(curl -s "$METRICS_URL")
  if echo "$METRICS" | grep -q "http_requests_total"; then
    echo -e "${GREEN}✅ HTTP metrics found${NC}"
  else
    echo -e "${YELLOW}⚠️  HTTP metrics not found${NC}"
  fi
else
  echo -e "${RED}❌ Metrics endpoint failed${NC}"
fi

# Test 3: API endpoints (if token provided)
if [ -n "$API_TOKEN" ]; then
  echo -e "\n${YELLOW}3. API Endpoints${NC}"
  
  # Test authenticated endpoint
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/brands" \
    -H "Authorization: Bearer $API_TOKEN")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ API endpoint accessible (HTTP $HTTP_CODE)${NC}"
  else
    echo -e "${YELLOW}⚠️  API endpoint returned HTTP $HTTP_CODE${NC}"
  fi
else
  echo -e "\n${YELLOW}3. API Endpoints${NC}"
  echo -e "${YELLOW}⏭️  Skipped (API_TOKEN not set)${NC}"
fi

# Test 4: DTO validation
echo -e "\n${YELLOW}4. DTO Validation${NC}"
if [ -n "$API_TOKEN" ]; then
  # Test invalid DTO (should return 400 with clear error)
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/marketplace/artisans" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}')
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✅ DTO validation working (HTTP 400 for invalid input)${NC}"
  else
    echo -e "${YELLOW}⚠️  DTO validation returned HTTP $HTTP_CODE${NC}"
  fi
else
  echo -e "${YELLOW}⏭️  Skipped (API_TOKEN not set)${NC}"
fi

# Test 5: Database connection
echo -e "\n${YELLOW}5. Database Connection${NC}"
if command -v psql &> /dev/null && [ -n "$DATABASE_URL" ]; then
  if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection OK${NC}"
  else
    echo -e "${RED}❌ Database connection failed${NC}"
  fi
else
  echo -e "${YELLOW}⏭️  Skipped (psql not available or DATABASE_URL not set)${NC}"
fi

# Test 6: Redis connection
echo -e "\n${YELLOW}6. Redis Connection${NC}"
if command -v redis-cli &> /dev/null && [ -n "$REDIS_URL" ]; then
  if redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis connection OK${NC}"
  else
    echo -e "${RED}❌ Redis connection failed${NC}"
  fi
else
  echo -e "${YELLOW}⏭️  Skipped (redis-cli not available or REDIS_URL not set)${NC}"
fi

# Summary
echo -e "\n${GREEN}✅ Vérification terminée${NC}"
echo ""
echo "Next steps:"
echo "1. Check Grafana dashboards"
echo "2. Check Sentry for errors"
echo "3. Monitor logs"
echo "4. Verify business metrics"





















