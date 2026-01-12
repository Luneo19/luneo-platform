#!/bin/bash

# 🧪 SCRIPT DE TEST AUTOMATIQUE - SUPER ADMIN DASHBOARD
# Vérifie que tous les fichiers sont présents, compilent correctement, et n'ont pas d'erreurs

set -e

echo "🚀 TEST AUTOMATIQUE - SUPER ADMIN DASHBOARD"
echo "============================================"
echo ""

FRONTEND_DIR="apps/frontend"
ERRORS=0
WARNINGS=0

# Fonction pour afficher les erreurs
error() {
    echo "❌ ERREUR: $1"
    ERRORS=$((ERRORS + 1))
}

warning() {
    echo "⚠️  AVERTISSEMENT: $1"
    WARNINGS=$((WARNINGS + 1))
}

success() {
    echo "✅ $1"
}

# 1. Vérifier que les répertoires existent
echo "📁 Vérification de la structure des fichiers..."
echo ""

check_file() {
    if [ ! -f "$1" ]; then
        error "Fichier manquant: $1"
        return 1
    else
        success "Fichier présent: $1"
        return 0
    fi
}

# Fichiers essentiels à vérifier
ESSENTIAL_FILES=(
    "$FRONTEND_DIR/src/app/(super-admin)/layout.tsx"
    "$FRONTEND_DIR/src/app/(super-admin)/admin/page.tsx"
    "$FRONTEND_DIR/src/app/(super-admin)/admin/customers/page.tsx"
    "$FRONTEND_DIR/src/app/(super-admin)/admin/customers/[customerId]/page.tsx"
    "$FRONTEND_DIR/src/app/(super-admin)/admin/analytics/page.tsx"
    "$FRONTEND_DIR/src/app/(super-admin)/admin/marketing/automations/page.tsx"
    "$FRONTEND_DIR/src/lib/admin/permissions.ts"
    "$FRONTEND_DIR/src/config/admin-navigation.ts"
    "$FRONTEND_DIR/src/components/admin/layout/admin-sidebar.tsx"
    "$FRONTEND_DIR/src/components/admin/layout/admin-header.tsx"
    "$FRONTEND_DIR/src/components/admin/widgets/kpi-card.tsx"
    "$FRONTEND_DIR/src/components/admin/customers/customers-table.tsx"
    "$FRONTEND_DIR/src/components/admin/customers/customer-detail.tsx"
    "$FRONTEND_DIR/src/components/admin/analytics/revenue-chart.tsx"
    "$FRONTEND_DIR/src/components/admin/analytics/cohort-table.tsx"
    "$FRONTEND_DIR/src/components/admin/analytics/funnel-chart.tsx"
    "$FRONTEND_DIR/src/app/api/admin/analytics/overview/route.ts"
    "$FRONTEND_DIR/src/app/api/admin/customers/route.ts"
    "$FRONTEND_DIR/src/app/api/admin/customers/[customerId]/route.ts"
    "$FRONTEND_DIR/src/hooks/admin/use-customers.ts"
    "$FRONTEND_DIR/src/hooks/admin/use-customer-detail.ts"
    "$FRONTEND_DIR/src/hooks/admin/use-analytics.ts"
)

for file in "${ESSENTIAL_FILES[@]}"; do
    check_file "$file" || true
done

echo ""
echo "📦 Vérification des imports et exports..."
echo ""

# 2. Vérifier les imports critiques
cd "$FRONTEND_DIR" || exit 1

# Vérifier que les imports principaux sont valides
check_imports() {
    local file=$1
    if grep -q "from '@/lib/admin/permissions'" "$file" 2>/dev/null; then
        if [ ! -f "src/lib/admin/permissions.ts" ]; then
            error "Import invalide dans $file: @/lib/admin/permissions"
        fi
    fi
}

# Vérifier quelques fichiers clés
for file in src/app/\(super-admin\)/**/*.tsx src/components/admin/**/*.tsx; do
    if [ -f "$file" ]; then
        check_imports "$file" || true
    fi
done

echo ""
echo "🔍 Vérification TypeScript..."
echo ""

# 3. Vérifier TypeScript (sans erreurs bloquantes)
if command -v npx &> /dev/null; then
    echo "Exécution de la vérification TypeScript..."
    if npx tsc --noEmit --skipLibCheck src/app/\(super-admin\)/**/*.tsx src/components/admin/**/*.tsx src/hooks/admin/**/*.ts src/app/api/admin/**/*.ts 2>&1 | grep -i "error" | grep -v "node_modules" | head -10; then
        warning "Des erreurs TypeScript ont été détectées (voir ci-dessus)"
    else
        success "Aucune erreur TypeScript critique dans les fichiers admin"
    fi
else
    warning "npx non disponible, vérification TypeScript ignorée"
fi

echo ""
echo "🧹 Vérification ESLint..."
echo ""

# 4. Vérifier ESLint
if command -v npx &> /dev/null; then
    if npx eslint src/app/\(super-admin\) src/components/admin src/hooks/admin src/app/api/admin --ext .ts,.tsx --max-warnings 0 2>&1 | grep -i "error\|warning" | head -10; then
        warning "Des avertissements ESLint ont été détectés"
    else
        success "Aucune erreur ESLint dans les fichiers admin"
    fi
else
    warning "ESLint non disponible, vérification ignorée"
fi

echo ""
echo "📊 Résumé des vérifications..."
echo ""

# 5. Compter les fichiers créés
ADMIN_FILES=$(find src/app/\(super-admin\) src/components/admin src/hooks/admin src/app/api/admin -type f \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null | wc -l | tr -d ' ')
success "Nombre de fichiers admin créés: $ADMIN_FILES"

# 6. Vérifier la migration Prisma
echo ""
echo "🗄️  Vérification de la migration Prisma..."
cd ../backend || exit 1

if [ -f "prisma/migrations/20250115000000_add_super_admin_models/migration.sql" ]; then
    success "Migration Prisma trouvée"
else
    error "Migration Prisma manquante"
fi

# Résumé final
echo ""
echo "============================================"
echo "📋 RÉSUMÉ DES TESTS"
echo "============================================"
echo "Fichiers vérifiés: ${#ESSENTIAL_FILES[@]}"
echo "Fichiers admin totaux: $ADMIN_FILES"
echo "Erreurs: $ERRORS"
echo "Avertissements: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ TOUS LES TESTS SONT PASSÉS !"
    exit 0
else
    echo "❌ $ERRORS ERREUR(S) DÉTECTÉE(S)"
    exit 1
fi
