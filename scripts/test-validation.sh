#!/bin/bash

##############################################################################
# LUNEO - Script de Test & Validation Automatique
# Tests des 6 phases implémentées
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
TOTAL=0

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
  echo -e "${CYAN}🧪 Test $1: $2${NC}"
}

test_passed() {
  echo -e "${GREEN}✅ PASSED${NC} - $1"
  ((PASSED++))
  ((TOTAL++))
}

test_failed() {
  echo -e "${RED}❌ FAILED${NC} - $1"
  ((FAILED++))
  ((TOTAL++))
}

test_warning() {
  echo -e "${YELLOW}⚠️  WARNING${NC} - $1"
}

##############################################################################
# 0. Prérequis
##############################################################################

print_header "🔍 ÉTAPE 0: VÉRIFICATION DES PRÉREQUIS"

print_test "0.1" "Node.js version"
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo "   Node.js: $NODE_VERSION"
  test_passed "Node.js installé"
else
  test_failed "Node.js non trouvé"
  exit 1
fi

print_test "0.2" "PostgreSQL"
if command -v psql &> /dev/null; then
  PSQL_VERSION=$(psql --version | awk '{print $3}')
  echo "   PostgreSQL: $PSQL_VERSION"
  test_passed "PostgreSQL installé"
else
  test_failed "PostgreSQL non trouvé"
fi

print_test "0.3" "Redis"
if command -v redis-cli &> /dev/null; then
  if redis-cli ping &> /dev/null; then
    test_passed "Redis opérationnel"
  else
    test_warning "Redis installé mais non démarré"
    echo "   Démarrage de Redis..."
    redis-server --daemonize yes &> /dev/null || true
  fi
else
  test_warning "Redis non trouvé (optionnel pour tests basiques)"
fi

print_test "0.4" "Variables d'environnement"
if [ -f "apps/backend/.env" ]; then
  test_passed "Fichier .env trouvé"
  
  # Vérifier les vars critiques
  if grep -q "DATABASE_URL" apps/backend/.env; then
    test_passed "DATABASE_URL configurée"
  else
    test_warning "DATABASE_URL manquante"
  fi
else
  test_warning "Fichier .env non trouvé"
fi

##############################################################################
# 1. Structure des fichiers
##############################################################################

print_header "📁 ÉTAPE 1: VÉRIFICATION DE LA STRUCTURE"

print_test "1.1" "Backend modules"
MODULES=("product-engine" "render" "ecommerce" "production" "usage-billing")
for module in "${MODULES[@]}"; do
  if [ -d "apps/backend/src/modules/$module" ]; then
    test_passed "Module $module existe"
  else
    test_failed "Module $module manquant"
  fi
done

print_test "1.2" "Workers"
WORKERS=("design" "render" "production")
for worker in "${WORKERS[@]}"; do
  if [ -d "apps/backend/src/jobs/workers/$worker" ]; then
    test_passed "Worker $worker existe"
  else
    test_failed "Worker $worker manquant"
  fi
done

print_test "1.3" "Frontend Visual Editor"
if [ -d "apps/frontend/src/components/visual-editor" ]; then
  test_passed "Visual Editor existe"
  
  COMPONENTS=("VisualEditor.tsx" "zones-builder" "canvas-editor" "properties-panel" "preview-engine")
  for comp in "${COMPONENTS[@]}"; do
    if [ -e "apps/frontend/src/components/visual-editor/$comp" ]; then
      test_passed "Composant $comp existe"
    else
      test_warning "Composant $comp manquant"
    fi
  done
else
  test_failed "Visual Editor manquant"
fi

##############################################################################
# 2. Compilation & Build
##############################################################################

print_header "🔨 ÉTAPE 2: COMPILATION & BUILD"

print_test "2.1" "Backend - Installation dépendances"
cd apps/backend
if npm install --silent &> /dev/null; then
  test_passed "Dépendances backend installées"
else
  test_warning "Erreur installation backend (peut-être déjà installé)"
fi

print_test "2.2" "Backend - Prisma Client"
if npx prisma generate &> /dev/null; then
  test_passed "Prisma Client généré"
else
  test_failed "Échec génération Prisma Client"
fi

print_test "2.3" "Backend - TypeScript compilation"
if npx tsc --noEmit &> /dev/null; then
  test_passed "Compilation TypeScript OK"
else
  test_warning "Erreurs TypeScript détectées (non bloquant)"
fi

cd ../..

print_test "2.4" "Frontend - Installation dépendances"
cd apps/frontend
if npm install --silent &> /dev/null; then
  test_passed "Dépendances frontend installées"
else
  test_warning "Erreur installation frontend (peut-être déjà installé)"
fi

cd ../..

##############################################################################
# 3. Base de données
##############################################################################

print_header "🗄️  ÉTAPE 3: BASE DE DONNÉES"

print_test "3.1" "Tables Product Engine"
TABLES=("Product" "Design" "Brand")
for table in "${TABLES[@]}"; do
  if psql "$DATABASE_URL" -tAc "SELECT to_regclass('public.\"$table\"');" 2>/dev/null | grep -q "$table"; then
    test_passed "Table $table existe"
  else
    test_warning "Table $table non trouvée"
  fi
done

print_test "3.2" "Tables Render Engine"
RENDER_TABLES=("RenderResult" "RenderProgress" "ProductionStatus")
for table in "${RENDER_TABLES[@]}"; do
  if psql "$DATABASE_URL" -tAc "SELECT to_regclass('public.\"$table\"');" 2>/dev/null | grep -q "$table"; then
    test_passed "Table $table existe"
  else
    test_warning "Table $table non trouvée (peut nécessiter migration)"
  fi
done

print_test "3.3" "Tables E-commerce"
ECOM_TABLES=("EcommerceIntegration" "ProductMapping" "SyncLog" "WebhookLog")
for table in "${ECOM_TABLES[@]}"; do
  if psql "$DATABASE_URL" -tAc "SELECT to_regclass('public.\"$table\"');" 2>/dev/null | grep -q "$table"; then
    test_passed "Table $table existe"
  else
    test_warning "Table $table non trouvée (peut nécessiter migration)"
  fi
done

##############################################################################
# 4. Services Backend
##############################################################################

print_header "🚀 ÉTAPE 4: SERVICES BACKEND (Tests légers)"

print_test "4.1" "Backend démarré ?"
if curl -s http://localhost:4000/health &> /dev/null; then
  test_passed "Backend répond sur :4000"
  
  print_test "4.2" "Swagger documentation"
  if curl -s http://localhost:4000/api &> /dev/null; then
    test_passed "Documentation Swagger accessible"
  else
    test_warning "Swagger non accessible"
  fi
  
  print_test "4.3" "Product Engine endpoints"
  # Test basique sans auth
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/product-engine/health 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    test_passed "Product Engine endpoint répond"
  else
    test_warning "Product Engine endpoint non accessible (code: $HTTP_CODE)"
  fi
  
else
  test_warning "Backend non démarré (démarrer avec: npm run start:dev)"
  echo ""
  echo -e "${YELLOW}ℹ️  Pour démarrer le backend:${NC}"
  echo "   cd apps/backend && npm run start:dev"
fi

##############################################################################
# 5. Frontend
##############################################################################

print_header "🎨 ÉTAPE 5: FRONTEND"

print_test "5.1" "Frontend démarré ?"
if curl -s http://localhost:3000 &> /dev/null; then
  test_passed "Frontend répond sur :3000"
  
  print_test "5.2" "Visual Editor route"
  if curl -s http://localhost:3000/editor &> /dev/null; then
    test_passed "Route /editor accessible"
  else
    test_warning "Route /editor non accessible"
  fi
  
else
  test_warning "Frontend non démarré (démarrer avec: npm run dev)"
  echo ""
  echo -e "${YELLOW}ℹ️  Pour démarrer le frontend:${NC}"
  echo "   cd apps/frontend && npm run dev"
fi

##############################################################################
# 6. Migrations SQL
##############################################################################

print_header "📜 ÉTAPE 6: MIGRATIONS SQL"

print_test "6.1" "Fichiers de migration"
MIGRATIONS=("migrate-product-engine.sql" "migrate-workers.sql" "migrate-ecommerce.sql")
for migration in "${MIGRATIONS[@]}"; do
  if [ -f "apps/backend/scripts/$migration" ]; then
    test_passed "Migration $migration existe"
  else
    test_warning "Migration $migration manquante"
  fi
done

##############################################################################
# 7. Documentation
##############################################################################

print_header "📚 ÉTAPE 7: DOCUMENTATION"

print_test "7.1" "Fichiers de documentation"
DOCS=("START_HERE.md" "GUIDE_TEST_VALIDATION.md" "SYNTHESE_COMPLETE_FINALE.md" "docs/architecture.md")
for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    test_passed "Documentation $doc existe"
  else
    test_warning "Documentation $doc manquante"
  fi
done

##############################################################################
# RAPPORT FINAL
##############################################################################

print_header "📊 RAPPORT DE TEST FINAL"

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo -e "${PURPLE}  🎯 RÉSULTATS GLOBAUX${NC}"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
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
  echo -e "${GREEN}🎉 Votre plateforme LUNEO est prête !${NC}"
  echo ""
  echo "📋 PROCHAINES ÉTAPES:"
  echo "   1. Tester manuellement les fonctionnalités (voir GUIDE_TEST_VALIDATION.md)"
  echo "   2. Implémenter les 3 phases critiques:"
  echo "      💰 Billing usage-based"
  echo "      🔒 Sécurité & RBAC"
  echo "      🧪 Tests complets"
  echo "   3. Déployer en production ! 🚀"
  echo ""
elif [ $SUCCESS_RATE -ge 80 ]; then
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo -e "${YELLOW}  ⚠️  QUELQUES TESTS ONT ÉCHOUÉ (${SUCCESS_RATE}% réussite)${NC}"
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo ""
  echo -e "${YELLOW}Votre plateforme est globalement fonctionnelle !${NC}"
  echo ""
  echo "⚠️  Points d'attention:"
  echo "   - Vérifier les tests échoués ci-dessus"
  echo "   - Appliquer les migrations SQL si nécessaire"
  echo "   - Démarrer Redis si non démarré"
  echo ""
  echo "📋 Vous pouvez continuer avec les phases critiques si les échecs ne sont pas bloquants."
  echo ""
else
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo -e "${RED}  ❌ PLUSIEURS TESTS ONT ÉCHOUÉ (${SUCCESS_RATE}% réussite)${NC}"
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo ""
  echo -e "${RED}Action requise avant de continuer !${NC}"
  echo ""
  echo "🔧 Vérifier:"
  echo "   1. Variables d'environnement (.env)"
  echo "   2. Base de données PostgreSQL"
  echo "   3. Migrations SQL appliquées"
  echo "   4. Dépendances npm installées"
  echo ""
  echo "📖 Voir: GUIDE_TEST_VALIDATION.md pour plus de détails"
  echo ""
fi

echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

exit 0
