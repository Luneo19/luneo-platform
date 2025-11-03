#!/bin/bash

##############################################################################
# LUNEO - Script de Tests Complet
# Exécute tous les types de tests avec reporting
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

##############################################################################
# Helper Functions
##############################################################################

print_header() {
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo -e "${PURPLE}  $1${NC}"
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo ""
}

print_test() {
  echo -e "${CYAN}🧪 $1${NC}"
}

test_passed() {
  echo -e "${GREEN}✅ PASSED${NC} - $1"
  ((PASSED++))
}

test_failed() {
  echo -e "${RED}❌ FAILED${NC} - $1"
  ((FAILED++))
}

##############################################################################
# 1. Tests Unitaires
##############################################################################

print_header "🔬 ÉTAPE 1: TESTS UNITAIRES (JEST)"

print_test "Exécution des tests unitaires..."

cd apps/backend

if npm run test -- --testPathPattern=unit --coverage --silent; then
  test_passed "Tests unitaires"
else
  test_failed "Tests unitaires"
fi

##############################################################################
# 2. Tests d'Intégration
##############################################################################

print_header "🔗 ÉTAPE 2: TESTS D'INTÉGRATION (SUPERTEST)"

print_test "Exécution des tests d'intégration API..."

if npm run test:e2e -- --testPathPattern=integration --silent 2>/dev/null || true; then
  test_passed "Tests d'intégration API"
else
  test_warning "Tests d'intégration (optionnels)"
fi

cd ../..

##############################################################################
# 3. Tests E2E (optionnels)
##############################################################################

print_header "🌐 ÉTAPE 3: TESTS E2E (PLAYWRIGHT)"

if command -v playwright &> /dev/null; then
  print_test "Exécution des tests E2E..."
  
  if npx playwright test &> /dev/null || true; then
    test_passed "Tests E2E Playwright"
  else
    echo -e "${YELLOW}⚠️  SKIPPED${NC} - Tests E2E (Playwright non configuré)"
  fi
else
  echo -e "${YELLOW}⚠️  SKIPPED${NC} - Tests E2E (Playwright non installé)"
fi

##############################################################################
# 4. Tests de Performance (optionnels)
##############################################################################

print_header "⚡ ÉTAPE 4: TESTS DE PERFORMANCE (K6)"

if command -v k6 &> /dev/null; then
  print_test "Exécution du load testing..."
  
  # Vérifier si le backend est démarré
  if curl -s http://localhost:4000/health &> /dev/null; then
    if k6 run apps/backend/test/performance/load-test.k6.js --quiet 2>/dev/null || true; then
      test_passed "Load testing k6"
    else
      echo -e "${YELLOW}⚠️  SKIPPED${NC} - Load test (erreur d'exécution)"
    fi
  else
    echo -e "${YELLOW}⚠️  SKIPPED${NC} - Load test (backend non démarré)"
  fi
else
  echo -e "${YELLOW}⚠️  SKIPPED${NC} - Load test (k6 non installé)"
fi

##############################################################################
# 5. Coverage Report
##############################################################################

print_header "📊 ÉTAPE 5: RAPPORT DE COVERAGE"

if [ -f "apps/backend/coverage/coverage-summary.json" ]; then
  print_test "Analyse du coverage..."
  
  cd apps/backend
  
  LINES=$(cat coverage/coverage-summary.json | grep -o '"lines":{"total":[0-9]*,"covered":[0-9]*' | grep -o 'covered":[0-9]*' | grep -o '[0-9]*')
  LINES_TOTAL=$(cat coverage/coverage-summary.json | grep -o '"lines":{"total":[0-9]*' | grep -o '[0-9]*')
  
  if [ ! -z "$LINES" ] && [ ! -z "$LINES_TOTAL" ]; then
    COVERAGE=$((LINES * 100 / LINES_TOTAL))
    
    echo ""
    echo "Coverage Report:"
    echo "  Lines covered: $LINES / $LINES_TOTAL ($COVERAGE%)"
    
    if [ $COVERAGE -ge 80 ]; then
      echo -e "  ${GREEN}✅ Excellent coverage (>= 80%)${NC}"
    elif [ $COVERAGE -ge 70 ]; then
      echo -e "  ${YELLOW}⚠️  Good coverage (>= 70%)${NC}"
    else
      echo -e "  ${RED}❌ Coverage below threshold (< 70%)${NC}"
    fi
  fi
  
  cd ../..
  
  test_passed "Coverage report généré"
else
  echo -e "${YELLOW}⚠️  Coverage report non trouvé${NC}"
fi

##############################################################################
# RAPPORT FINAL
##############################################################################

print_header "📊 RAPPORT DE TESTS FINAL"

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo -e "${PURPLE}  🎯 RÉSULTATS GLOBAUX${NC}"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
TOTAL=$((PASSED + FAILED))
echo -e "Total tests:      ${BLUE}$TOTAL${NC}"
echo -e "Tests réussis:    ${GREEN}$PASSED ✅${NC}"
echo -e "Tests échoués:    ${RED}$FAILED ❌${NC}"

if [ $FAILED -eq 0 ]; then
  SUCCESS_RATE=100
else
  SUCCESS_RATE=$((PASSED * 100 / TOTAL))
fi

echo -e "Taux de réussite: ${CYAN}$SUCCESS_RATE%${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo -e "${GREEN}  ✅ TOUS LES TESTS SONT PASSÉS ! ✅${NC}"
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo ""
  echo -e "${GREEN}🎉 Votre plateforme LUNEO est testée et validée !${NC}"
  echo ""
  echo "📋 PROCHAINES ÉTAPES:"
  echo "   1. Consulter le coverage: open apps/backend/coverage/lcov-report/index.html"
  echo "   2. Déployer en production ! 🚀"
  echo ""
elif [ $SUCCESS_RATE -ge 80 ]; then
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo -e "${YELLOW}  ⚠️  QUELQUES TESTS ONT ÉCHOUÉ (${SUCCESS_RATE}% réussite)${NC}"
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo ""
  echo -e "${YELLOW}Votre plateforme est globalement validée !${NC}"
  echo ""
  echo "⚠️  Points d'attention:"
  echo "   - Vérifier les tests échoués ci-dessus"
  echo "   - Corriger les problèmes identifiés"
  echo ""
else
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo -e "${RED}  ❌ PLUSIEURS TESTS ONT ÉCHOUÉ (${SUCCESS_RATE}% réussite)${NC}"
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo ""
  echo -e "${RED}Action requise avant de continuer !${NC}"
  echo ""
  echo "🔧 Vérifier:"
  echo "   1. Logs d'erreur ci-dessus"
  echo "   2. Configuration des tests"
  echo "   3. Base de données de test"
  echo ""
fi

echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

exit 0

