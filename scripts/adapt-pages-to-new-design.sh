#!/bin/bash

# Script pour adapter automatiquement les pages au nouveau design
# Usage: ./scripts/adapt-pages-to-new-design.sh

echo "🎨 Adaptation des pages au nouveau design Luneo"
echo "================================================"
echo ""

# Liste des pages à adapter
PAGES=(
  "apps/frontend/src/app/(public)/solutions/virtual-try-on/page.tsx"
  "apps/frontend/src/app/(public)/solutions/configurator-3d/page.tsx"
  "apps/frontend/src/app/(public)/solutions/customizer/page.tsx"
  "apps/frontend/src/app/(public)/solutions/ai-design-hub/page.tsx"
  "apps/frontend/src/app/(public)/solutions/ecommerce/page.tsx"
  "apps/frontend/src/app/(public)/solutions/marketing/page.tsx"
  "apps/frontend/src/app/(public)/solutions/branding/page.tsx"
  "apps/frontend/src/app/(public)/solutions/social/page.tsx"
  "apps/frontend/src/app/(public)/use-cases/e-commerce/page.tsx"
  "apps/frontend/src/app/(public)/use-cases/marketing/page.tsx"
  "apps/frontend/src/app/(public)/use-cases/branding/page.tsx"
  "apps/frontend/src/app/(public)/use-cases/print-on-demand/page.tsx"
  "apps/frontend/src/app/(public)/use-cases/dropshipping/page.tsx"
  "apps/frontend/src/app/(public)/use-cases/agency/page.tsx"
)

echo "📋 Pages à adapter: ${#PAGES[@]}"
echo ""

for page in "${PAGES[@]}"; do
  if [ -f "$page" ]; then
    echo "✅ $page existe"
  else
    echo "⚠️  $page n'existe pas"
  fi
done

echo ""
echo "📝 Pour adapter une page manuellement, suivez le pattern dans GUIDE_ADAPTATION_PAGES.md"
echo ""
echo "✅ Pages déjà adaptées:"
echo "  - / (page d'accueil)"
echo "  - /solutions"
echo "  - /use-cases"
echo "  - /features"
echo "  - /demo"
echo "  - /produits"
echo "  - /about"
echo "  - /contact"
echo ""
echo "🎯 Prochaines étapes:"
echo "  1. Adapter les pages solutions/*"
echo "  2. Adapter les pages use-cases/*"
echo "  3. Adapter les pages industries/*"
echo "  4. Adapter les autres pages (blog, changelog, etc.)"
