#!/bin/bash
set -e

echo "🚀 Starting Vercel build for frontend..."

CURRENT_DIR="$(pwd)"
echo "📍 Current directory: $CURRENT_DIR"
echo "📦 Mode: Vercel standalone deployment"

# Créer les dossiers pour les packages locaux
echo "📁 Creating local package directories..."
mkdir -p node_modules/@luneo/billing-plans/dist
mkdir -p node_modules/@luneo/ai-safety/dist  
mkdir -p node_modules/@luneo/types/dist

# Copier les fichiers de packages depuis src/lib/packages si ils existent
if [ -d "src/lib/packages/billing-plans" ]; then
  cp -r src/lib/packages/billing-plans/* node_modules/@luneo/billing-plans/
fi
if [ -d "src/lib/packages/ai-safety" ]; then
  cp -r src/lib/packages/ai-safety/* node_modules/@luneo/ai-safety/
fi
if [ -d "src/lib/packages/types" ]; then
  cp -r src/lib/packages/types/* node_modules/@luneo/types/
fi

# Supprimer les dépendances workspace du package.json temporairement
echo "🔧 Converting workspace dependencies..."
cp package.json package.json.backup
sed -i.bak 's/"@luneo\/types": "workspace:\*",//g' package.json
sed -i.bak 's/"@luneo\/ai-safety": "workspace:\*",//g' package.json
sed -i.bak 's/"@luneo\/billing-plans": "workspace:\*",//g' package.json

echo "📦 Installing dependencies with npm..."
npm install --legacy-peer-deps 2>&1 | tail -100 || {
  echo "⚠️ npm install failed, trying with --force..."
  npm install --legacy-peer-deps --force 2>&1 | tail -100
}

# Restaurer package.json
mv package.json.backup package.json
rm -f package.json.bak

# Re-copier les packages locaux après npm install (ils peuvent avoir été écrasés)
if [ -d "src/lib/packages/billing-plans" ]; then
  cp -r src/lib/packages/billing-plans/* node_modules/@luneo/billing-plans/
fi
if [ -d "src/lib/packages/ai-safety" ]; then
  cp -r src/lib/packages/ai-safety/* node_modules/@luneo/ai-safety/
fi
if [ -d "src/lib/packages/types" ]; then
  cp -r src/lib/packages/types/* node_modules/@luneo/types/
fi

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
