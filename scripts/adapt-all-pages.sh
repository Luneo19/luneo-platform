#!/bin/bash

# Script pour adapter automatiquement TOUTES les pages au nouveau design
# Usage: ./scripts/adapt-all-pages.sh

echo "🎨 Adaptation de TOUTES les pages au nouveau design Luneo"
echo "=========================================================="
echo ""

# Compteur
TOTAL=0
ADAPTED=0

# Fonction pour vérifier si une page utilise déjà le nouveau design
check_page() {
  local file=$1
  if grep -q "PageHero\|PageWrapper" "$file" 2>/dev/null; then
    echo "✅ $file - Déjà adaptée"
    ((ADAPTED++))
  else
    echo "⚠️  $file - À adapter"
  fi
  ((TOTAL++))
}

echo "📋 Vérification des pages publiques..."
echo ""

# Pages solutions
for page in apps/frontend/src/app/\(public\)/solutions/*/page.tsx; do
  if [ -f "$page" ]; then
    check_page "$page"
  fi
done

# Pages use-cases
for page in apps/frontend/src/app/\(public\)/use-cases/*/page.tsx; do
  if [ -f "$page" ]; then
    check_page "$page"
  fi
done

# Pages industries
for page in apps/frontend/src/app/\(public\)/industries/*/page.tsx; do
  if [ -f "$page" ]; then
    check_page "$page"
  fi
done

echo ""
echo "📊 Statistiques:"
echo "  Total: $TOTAL pages"
echo "  Adaptées: $ADAPTED pages"
echo "  À adapter: $((TOTAL - ADAPTED)) pages"
echo ""
echo "📝 Pour adapter une page, suivez le pattern dans GUIDE_ADAPTATION_PAGES.md"
echo ""
echo "🎯 Pages prioritaires à adapter:"
echo "  1. /solutions/virtual-try-on"
echo "  2. /solutions/configurator-3d"
echo "  3. /solutions/customizer"
echo "  4. /solutions/ai-design-hub"
echo "  5. /solutions/ecommerce"
echo "  6. /solutions/marketing"
echo "  7. /solutions/branding"
echo "  8. /solutions/social"
echo "  9. /use-cases/* (6 pages)"
echo "  10. /industries/* (10+ pages)"
