#!/bin/bash

# 🧪 Test All - Luneo
# Lance tous les tests (type-check, lint, build, E2E)

set -e

echo "🧪 Running All Tests - Luneo"
echo "============================="
echo ""

ERRORS=0

# Frontend tests
echo "🎨 FRONTEND"
echo "-----------"
cd apps/frontend

echo "  → Type check..."
npm run type-check || ((ERRORS++))

echo "  → Lint..."
npm run lint:check || ((ERRORS++))

echo "  → Build..."
npm run build || ((ERRORS++))

echo "  → E2E tests..."
npm run test:e2e || ((ERRORS++))

cd ../..

# Backend tests
echo ""
echo "🔧 BACKEND"
echo "----------"
cd apps/backend

echo "  → Type check..."
npm run build || ((ERRORS++))

cd ../..

echo ""
echo "============================="

if [ $ERRORS -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ $ERRORS test(s) failed"
  exit 1
fi



