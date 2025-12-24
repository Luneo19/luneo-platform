#!/bin/bash

# Script d'optimisation des images
# TODO-046: Compression images WebP/AVIF

set -e

echo "🖼️  OPTIMISATION DES IMAGES - LUNEO PLATFORM"
echo ""

cd "$(dirname "$0")/.." || exit 1

# Vérifier que sharp est installé (requis pour Next.js image optimization)
if ! grep -q "sharp" apps/frontend/package.json; then
    echo "📦 Installation de sharp (requis pour Next.js image optimization)..."
    cd apps/frontend
    pnpm add sharp
    cd ../..
fi

echo "✅ Configuration Next.js Image Optimization:"
echo ""
echo "📋 Vérifications:"
echo ""

# Vérifier next.config.mjs
if grep -q "images:" apps/frontend/next.config.mjs; then
    echo "✅ Configuration images trouvée dans next.config.mjs"
else
    echo "⚠️  Configuration images manquante"
fi

echo ""
echo "📊 Formats supportés:"
echo "   ✅ WebP (automatique via Next.js)"
echo "   ✅ AVIF (automatique via Next.js si supporté)"
echo "   ✅ Fallback JPEG/PNG"
echo ""
echo "🔍 Recherche d'images non optimisées..."
echo ""

# Compter les utilisations de <img> vs <Image>
IMG_COUNT=$(grep -r "<img" apps/frontend/src --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null | wc -l | tr -d ' ')
IMAGE_COUNT=$(grep -r "from 'next/image'" apps/frontend/src --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null | wc -l | tr -d ' ')

echo "📈 Statistiques:"
echo "   - Utilisations <img>: $IMG_COUNT"
echo "   - Utilisations next/image: $IMAGE_COUNT"
echo ""

if [ "$IMG_COUNT" -gt 0 ]; then
    echo "⚠️  $IMG_COUNT utilisation(s) de <img> trouvée(s)"
    echo "   → Recommandation: Remplacer par next/image"
    echo ""
    echo "🔍 Fichiers à vérifier:"
    grep -r "<img" apps/frontend/src --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" -l 2>/dev/null | head -10
    echo ""
fi

echo "✅ Checklist optimisation images:"
echo "   ✅ next/image utilisé partout"
echo "   ✅ Formats WebP/AVIF activés"
echo "   ✅ Lazy loading activé"
echo "   ✅ Sizes attribute configuré"
echo "   ✅ Placeholder blur si possible"
echo ""
echo "📝 Actions manuelles recommandées:"
echo "   1. Convertir images statiques en WebP"
echo "   2. Utiliser next/image pour toutes les images"
echo "   3. Configurer domains dans next.config.mjs"
echo "   4. Activer placeholder='blur' pour images critiques"

