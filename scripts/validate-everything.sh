#!/bin/bash

# ✅ Validation Complète - Luneo Platform
# Vérifie que tout est prêt pour la production

set -e

echo "✅ VALIDATION COMPLÈTE - LUNEO PLATFORM"
echo "========================================"
echo ""

ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check
check() {
  local name=$1
  local command=$2
  local severity=${3:-error}
  
  echo -n "  → $name... "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OK${NC}"
    return 0
  else
    if [ "$severity" = "warning" ]; then
      echo -e "${YELLOW}⚠ WARNING${NC}"
      ((WARNINGS++))
    else
      echo -e "${RED}✗ FAIL${NC}"
      ((ERRORS++))
    fi
    return 1
  fi
}

# 1. Environment
echo "1️⃣  ENVIRONMENT"
echo "=============="
check "Node.js 20+" "node -v | grep -E '^v(20|2[1-9]|[3-9][0-9])'"
check "npm installed" "npm -v"
check "Git installed" "git --version"
check "Docker available" "docker --version" warning

echo ""

# 2. Configuration Files
echo "2️⃣  CONFIGURATION"
echo "================"
check ".env.local exists (frontend)" "test -f apps/frontend/.env.local" warning
check ".env exists (backend)" "test -f apps/backend/.env" warning
check "docker-compose.yml" "test -f docker-compose.yml"
check "Makefile" "test -f Makefile"
check "playwright.config.ts" "test -f apps/frontend/playwright.config.ts"

echo ""

# 3. Dependencies
echo "3️⃣  DEPENDENCIES"
echo "==============="
check "Frontend node_modules" "test -d apps/frontend/node_modules" warning
check "Backend node_modules" "test -d apps/backend/node_modules" warning

echo ""

# 4. Code Quality
echo "4️⃣  CODE QUALITY"
echo "==============="
cd apps/frontend
check "TypeScript check" "npm run type-check" warning
check "ESLint check" "npm run lint:check" warning
cd ../..

echo ""

# 5. Build
echo "5️⃣  BUILD TEST"
echo "============"
cd apps/frontend
check "Frontend build" "npm run build" warning
cd ../..

echo ""

# 6. Security
echo "6️⃣  SECURITY CHECKS"
echo "=================="
check "No console.log in components" "! grep -r 'console.log' apps/frontend/src/components" warning
check "No any types in routes" "! grep -r ': any' apps/frontend/src/app/api" warning
check "globals.css fixed" "! grep -r 'font-feature-settings' apps/frontend/src/styles/globals.css"

echo ""

# 7. Pages Created
echo "7️⃣  PAGES CREATED"
echo "================"
check "forgot-password" "test -f apps/frontend/src/app/\(auth\)/forgot-password/page.tsx"
check "legal/cookies" "test -f apps/frontend/src/app/\(public\)/legal/cookies/page.tsx"
check "legal/gdpr" "test -f apps/frontend/src/app/\(public\)/legal/gdpr/page.tsx"
check "enterprise" "test -f apps/frontend/src/app/\(public\)/enterprise/page.tsx"
check "changelog" "test -f apps/frontend/src/app/\(public\)/changelog/page.tsx"

echo ""

# 8. Documentation
echo "8️⃣  DOCUMENTATION"
echo "================"
check "README.md" "test -f README.md"
check "LIRE EN PREMIER" "test -f 🎯_LIRE_EN_PREMIER.md"
check "AUDIT TERMINÉ" "test -f ✅_AUDIT_TERMINE.md"
check "RAPPORT FINAL" "test -f 🏆_RAPPORT_COMPLET_FINAL.md"

echo ""
echo "========================================"
echo ""

# Results
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}🎉 PARFAIT ! Tout est validé !${NC}"
  echo ""
  echo "✅ 0 erreur, 0 warning"
  echo "🚀 Prêt pour la production !"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Validation OK avec warnings${NC}"
  echo ""
  echo "✅ 0 erreur"
  echo "⚠️  $WARNINGS warning(s)"
  echo "🟡 Production possible, mais vérifier les warnings"
  exit 0
else
  echo -e "${RED}❌ Validation échouée${NC}"
  echo ""
  echo "❌ $ERRORS erreur(s)"
  echo "⚠️  $WARNINGS warning(s)"
  echo ""
  echo "Actions requises:"
  echo "  1. Corriger les erreurs ci-dessus"
  echo "  2. Relancer: ./scripts/validate-everything.sh"
  exit 1
fi



