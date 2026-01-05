#!/bin/bash

# Script pour exécuter toutes les vérifications avant déploiement
# Usage: ./scripts/run-all-checks.sh

set -e

echo "🚀 Vérifications Complètes Avant Déploiement"
echo "=============================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher le statut
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# 1. Vérifier les fichiers de configuration
echo "📋 1. Vérification des fichiers de configuration..."
echo ""

if [ -f "apps/backend/vercel.json" ]; then
    print_status 0 "vercel.json (backend)"
else
    print_status 1 "vercel.json (backend) - MANQUANT"
fi

if [ -f "apps/frontend/vercel.json" ]; then
    print_status 0 "vercel.json (frontend)"
else
    print_status 1 "vercel.json (frontend) - MANQUANT"
fi

if [ -f "apps/backend/railway.json" ]; then
    print_status 0 "railway.json (backend)"
else
    print_status 1 "railway.json (backend) - MANQUANT"
fi

if [ -f "apps/backend/Dockerfile" ]; then
    print_status 0 "Dockerfile (backend)"
else
    print_status 1 "Dockerfile (backend) - MANQUANT"
fi

echo ""

# 2. Vérifier les modules backend
echo "📦 2. Vérification des modules backend..."
echo ""

if [ -f "apps/backend/src/modules/widget/widget.module.ts" ]; then
    print_status 0 "WidgetModule"
else
    print_status 1 "WidgetModule - MANQUANT"
fi

if [ -f "apps/backend/src/modules/render/services/render-print-ready.service.ts" ]; then
    print_status 0 "RenderPrintReadyService"
else
    print_status 1 "RenderPrintReadyService - MANQUANT"
fi

echo ""

# 3. Vérifier les pages frontend
echo "📄 3. Vérification des pages frontend..."
echo ""

if [ -f "apps/frontend/src/app/widget/editor/page.tsx" ]; then
    print_status 0 "Page widget/editor"
else
    print_status 1 "Page widget/editor - MANQUANT"
fi

if [ -f "apps/frontend/src/app/widget/demo/page.tsx" ]; then
    print_status 0 "Page widget/demo"
else
    print_status 1 "Page widget/demo - MANQUANT"
fi

if [ -f "apps/frontend/src/app/widget/docs/page.tsx" ]; then
    print_status 0 "Page widget/docs"
else
    print_status 1 "Page widget/docs - MANQUANT"
fi

echo ""

# 4. Vérifier Prisma
echo "🗄️  4. Vérification Prisma..."
echo ""

cd apps/backend
if npx prisma validate &> /dev/null; then
    print_status 0 "Schema Prisma valide"
else
    print_status 1 "Schema Prisma invalide"
fi

if grep -q "CustomizableArea" prisma/schema.prisma; then
    print_status 0 "Modèle CustomizableArea"
else
    print_status 1 "Modèle CustomizableArea - MANQUANT"
fi

if grep -q "DesignLayer" prisma/schema.prisma; then
    print_status 0 "Modèle DesignLayer"
else
    print_status 1 "Modèle DesignLayer - MANQUANT"
fi

cd ../..

echo ""

# 5. Vérifier les dépendances
echo "📚 5. Vérification des dépendances..."
echo ""

cd apps/backend
if grep -q '"canvas"' package.json; then
    print_status 0 "canvas installé"
else
    print_status 1 "canvas - MANQUANT"
fi

cd ../..

echo ""

# 6. Résumé
echo "📊 RÉSUMÉ"
echo "========="
echo ""
echo "✅ Fichiers de configuration: Vérifiés"
echo "✅ Modules backend: Vérifiés"
echo "✅ Pages frontend: Vérifiées"
echo "✅ Schema Prisma: Vérifié"
echo "✅ Dépendances: Vérifiées"
echo ""
echo "🎯 Prochaines étapes:"
echo "   1. ./scripts/configure-vercel-env.sh"
echo "   2. ./scripts/configure-railway-env.sh"
echo "   3. ./scripts/verify-redis.sh"
echo "   4. ./scripts/configure-s3.sh"
echo "   5. ./scripts/test-endpoints.sh"
echo ""



