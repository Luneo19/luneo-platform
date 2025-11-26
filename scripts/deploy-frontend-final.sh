#!/bin/bash
set -e

echo "🚀 Déploiement Frontend sur Vercel"
echo ""

# Vérifications
echo "📋 Vérifications pré-déploiement:"
echo "  ✓ Repo root: $(git rev-parse --show-toplevel)"
echo "  ✓ Package.json frontend: $(ls apps/frontend/package.json)"
echo "  ✓ Next.js présent: $(grep -o '"next": "[^"]*"' apps/frontend/package.json)"
echo "  ✓ pnpm configuré: $(grep -o '"packageManager": "[^"]*"' apps/frontend/package.json)"
echo ""

echo "⚠️  IMPORTANT: Le Root Directory dans Vercel doit être 'apps/frontend'"
echo "   Vérifiez: https://vercel.com/luneos-projects/frontend/settings/build-and-deployment"
echo "   Root Directory → Entrer: apps/frontend"
echo "   Puis Save"
echo ""
read -p "Appuyez sur Entrée une fois le Root Directory configuré..."

cd apps/frontend
echo ""
echo "🚀 Déploiement en cours..."
vercel --prod --yes

