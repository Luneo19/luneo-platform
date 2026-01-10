#!/bin/bash

# Script de surveillance du build Railway
# Usage: ./scripts/monitor-railway-build.sh

echo "🔍 SURVEILLANCE BUILD RAILWAY - LUNEO PLATFORM"
echo "=============================================="
echo ""
echo "📊 Vérifications pré-build..."
echo ""

# Vérifier les fichiers critiques
echo "1. Vérification DiscountService..."
if [ -f "apps/backend/src/modules/orders/services/discount.service.ts" ]; then
    echo "   ✅ DiscountService existe"
else
    echo "   ❌ ERREUR: DiscountService manquant"
    exit 1
fi

echo ""
echo "2. Vérification StorageModule..."
if [ -f "apps/backend/src/libs/storage/storage.module.ts" ]; then
    echo "   ✅ StorageModule existe"
else
    echo "   ❌ ERREUR: StorageModule manquant"
    exit 1
fi

echo ""
echo "3. Vérification imports dans ArStudioModule..."
if grep -q "StorageModule" apps/backend/src/modules/ar/ar-studio.module.ts; then
    echo "   ✅ StorageModule importé dans ArStudioModule"
else
    echo "   ❌ ERREUR: StorageModule non importé"
    exit 1
fi

echo ""
echo "4. Vérification imports dans OrdersModule..."
if grep -q "DiscountService" apps/backend/src/modules/orders/orders.module.ts; then
    echo "   ✅ DiscountService importé dans OrdersModule"
else
    echo "   ❌ ERREUR: DiscountService non importé"
    exit 1
fi

echo ""
echo "5. Vérification useAuth migration..."
if grep -q "API_BASE_URL" apps/frontend/src/hooks/useAuth.tsx; then
    echo "   ✅ useAuth migré vers backend"
else
    echo "   ⚠️  WARNING: useAuth pourrait ne pas être migré"
fi

echo ""
echo "✅ Toutes les vérifications pré-build sont OK"
echo ""
echo "📋 PROCHAINES ÉTAPES:"
echo "1. Vérifier les logs Railway dans le dashboard"
echo "2. Surveiller les erreurs suivantes:"
echo "   - 'Module not found'"
echo "   - 'Cannot find module'"
echo "   - 'Dependency injection'"
echo "   - 'TypeError'"
echo "   - 'SyntaxError'"
echo ""
echo "3. Si erreur détectée, consulter SURVEILLANCE_BUILD.md pour les actions correctives"
echo ""
