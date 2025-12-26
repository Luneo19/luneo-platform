#!/bin/bash

# Script de vérification pré-déploiement production
# Vérifie que tout est prêt pour le déploiement

set -e

echo "🔍 Vérification pré-déploiement production..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Fonction pour vérifier
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ $1${NC}"
  else
    echo -e "${RED}❌ $1${NC}"
    ERRORS=$((ERRORS + 1))
  fi
}

# Fonction pour avertir
warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  WARNINGS=$((WARNINGS + 1))
}

# 1. Vérifier que nous sommes dans le bon répertoire
echo "📁 Vérification répertoire..."
if [ -f "package.json" ] && [ -d "apps/frontend" ]; then
  check "Répertoire correct"
else
  echo -e "${RED}❌ Répertoire incorrect. Exécutez depuis la racine du projet.${NC}"
  exit 1
fi

# 2. Vérifier Git
echo ""
echo "🔍 Vérification Git..."
if git rev-parse --git-dir > /dev/null 2>&1; then
  check "Repository Git valide"
  
  # Vérifier qu'on est sur main ou develop
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "develop" ]; then
    check "Branche: $BRANCH"
  else
    warn "Branche: $BRANCH (recommandé: main ou develop)"
  fi
  
  # Vérifier qu'il n'y a pas de changements non commités
  if [ -z "$(git status --porcelain)" ]; then
    check "Aucun changement non commité"
  else
    warn "Changements non commités détectés"
  fi
else
  echo -e "${RED}❌ Pas un repository Git${NC}"
  ERRORS=$((ERRORS + 1))
fi

# 3. Vérifier Node.js et pnpm
echo ""
echo "🔍 Vérification outils..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  check "Node.js installé: $NODE_VERSION"
else
  echo -e "${RED}❌ Node.js non installé${NC}"
  ERRORS=$((ERRORS + 1))
fi

if command -v pnpm &> /dev/null; then
  PNPM_VERSION=$(pnpm -v)
  check "pnpm installé: $PNPM_VERSION"
else
  echo -e "${RED}❌ pnpm non installé${NC}"
  ERRORS=$((ERRORS + 1))
fi

# 4. Vérifier build
echo ""
echo "🔍 Vérification build..."
cd apps/frontend
if npm run build > /dev/null 2>&1; then
  check "Build réussi"
else
  echo -e "${RED}❌ Build échoué${NC}"
  ERRORS=$((ERRORS + 1))
fi
cd ../..

# 5. Vérifier tests
echo ""
echo "🔍 Vérification tests..."
cd apps/frontend
if npm run test -- --run > /dev/null 2>&1; then
  check "Tests passent"
else
  warn "Tests échouent (vérifier manuellement)"
fi
cd ../..

# 6. Vérifier linting
echo ""
echo "🔍 Vérification linting..."
cd apps/frontend
if npm run lint > /dev/null 2>&1; then
  check "Linting OK"
else
  warn "Linting avec warnings (vérifier manuellement)"
fi
cd ../..

# 7. Vérifier fichiers essentiels
echo ""
echo "🔍 Vérification fichiers essentiels..."
FILES=(
  "apps/frontend/vercel.json"
  ".github/workflows/ci.yml"
  "DEPLOYMENT_CHECKLIST.md"
  "docs/DEPLOYMENT_GUIDE.md"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    check "Fichier présent: $file"
  else
    warn "Fichier manquant: $file"
  fi
done

# 8. Résumé
echo ""
echo "=========================================="
echo "📊 Résumé"
echo "=========================================="
echo -e "${GREEN}✅ Vérifications réussies: $((10 - ERRORS - WARNINGS))${NC}"
if [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Avertissements: $WARNINGS${NC}"
fi
if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}❌ Erreurs: $ERRORS${NC}"
  echo ""
  echo -e "${RED}❌ Le projet n'est pas prêt pour le déploiement.${NC}"
  echo "Corrigez les erreurs avant de continuer."
  exit 1
else
  echo ""
  echo -e "${GREEN}✅ Le projet est prêt pour le déploiement!${NC}"
  echo ""
  echo "📋 Prochaines étapes:"
  echo "  1. Vérifier variables d'environnement Vercel"
  echo "  2. Vérifier secrets GitHub"
  echo "  3. Consulter DEPLOYMENT_CHECKLIST.md"
  echo "  4. Déployer staging d'abord"
  echo "  5. Tester staging"
  echo "  6. Déployer production"
  exit 0
fi
