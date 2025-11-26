#!/bin/bash
set -e

echo "🚀 Starting Vercel build for frontend..."

CURRENT_DIR="$(pwd)"
echo "📍 Current directory: $CURRENT_DIR"
echo "📦 Mode: Vercel standalone deployment"

# Remplacer les dépendances workspace:* par des versions compatibles npm
echo "🔧 Converting workspace dependencies..."
cp package.json package.json.backup

# Supprimer les dépendances workspace qui ne sont pas nécessaires pour le build
sed -i.bak 's/"@luneo\/types": "workspace:\*",//g' package.json
sed -i.bak 's/"@luneo\/ai-safety": "workspace:\*",//g' package.json
sed -i.bak 's/"@luneo\/billing-plans": "workspace:\*",//g' package.json
# Nettoyer les lignes vides
sed -i.bak '/^$/d' package.json

echo "📦 Installing dependencies with npm..."
npm install --legacy-peer-deps 2>&1 | tail -100 || {
  echo "⚠️ npm install failed, trying with --force..."
  npm install --legacy-peer-deps --force 2>&1 | tail -100
}

# Restaurer package.json pour que le build fonctionne
mv package.json.backup package.json
rm -f package.json.bak

# Build Next.js
echo "🏗️  Building frontend..."

if [ -f "./node_modules/.bin/next" ]; then
  echo "✅ Using next from node_modules"
  NODE_OPTIONS="--max-old-space-size=4096" ./node_modules/.bin/next build
else
  echo "✅ Using npx next"
  NODE_OPTIONS="--max-old-space-size=4096" npx --yes next@15 build
fi

echo "✅ Build completed successfully!"
