#!/bin/bash

# Script d'analyse de bundle pour Next.js
# TODO-045: Bundle analyzer complet

set -e

echo "🔍 ANALYSE DE BUNDLE - LUNEO PLATFORM"
echo ""

cd "$(dirname "$0")/../apps/frontend" || exit 1

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    pnpm install
fi

# Vérifier que @next/bundle-analyzer est installé
if ! grep -q "@next/bundle-analyzer" package.json; then
    echo "❌ @next/bundle-analyzer n'est pas installé"
    echo "📦 Installation..."
    pnpm add -D @next/bundle-analyzer
fi

echo "🔨 Build avec analyse..."
echo ""

# Build avec analyse
ANALYZE=true pnpm run build

echo ""
echo "✅ Analyse terminée !"
echo ""
echo "📊 Résultats:"
echo "   - Rapport client: .next/analyze/client.html"
echo "   - Rapport serveur: .next/analyze/server.html"
echo ""
echo "🌐 Ouvrir les rapports:"
echo "   - Client: open .next/analyze/client.html"
echo "   - Serveur: open .next/analyze/server.html"
echo ""
echo "💡 Actions recommandées:"
echo "   1. Identifier les bundles > 200KB"
echo "   2. Vérifier les dépendances dupliquées"
echo "   3. Optimiser les imports dynamiques"
echo "   4. Code-split les routes lourdes"

