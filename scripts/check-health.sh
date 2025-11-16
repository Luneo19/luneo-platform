#!/bin/bash

# 🏥 Script de Health Check - Luneo
# Vérifie que tous les services sont opérationnels

set -e

echo "🏥 Health Check - Luneo Platform"
echo "================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"

# Function to check service
check_service() {
  local name=$1
  local url=$2
  
  echo -n "Checking $name... "
  
  if curl -f -s -o /dev/null -w "%{http_code}" "$url" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OK${NC}"
    return 0
  else
    echo -e "${RED}✗ FAIL${NC}"
    return 1
  fi
}

# Check services
ERRORS=0

check_service "Frontend" "$FRONTEND_URL" || ((ERRORS++))
check_service "Backend API" "$BACKEND_URL/health" || ((ERRORS++))
check_service "Database" "$BACKEND_URL/health/db" || ((ERRORS++))
check_service "Redis" "$BACKEND_URL/health/redis" || ((ERRORS++))

echo ""
echo "================================="

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All services are healthy!${NC}"
  exit 0
else
  echo -e "${RED}❌ $ERRORS service(s) failing${NC}"
  exit 1
fi



