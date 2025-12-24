#!/bin/bash
set -e

echo "🚀 Starting Vercel build for frontend..."

CURRENT_DIR="$(pwd)"
echo "📍 Current directory: $CURRENT_DIR"
echo "📦 Mode: Vercel standalone deployment"

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

# Ne pas restaurer package.json car Vercel fait un npm install post-build
# Le fichier sera restauré par git après le déploiement
rm -f package.json.backup package.json.bak

# Créer les dossiers pour les packages locaux APRÈS npm install
echo "📁 Setting up local packages..."
mkdir -p node_modules/@luneo/billing-plans
mkdir -p node_modules/@luneo/ai-safety  
mkdir -p node_modules/@luneo/types

# Copier les fichiers de packages
if [ -d "src/lib/packages/billing-plans" ]; then
  echo "📦 Copying @luneo/billing-plans..."
  cp -r src/lib/packages/billing-plans/* node_modules/@luneo/billing-plans/
fi
if [ -d "src/lib/packages/ai-safety" ]; then
  echo "📦 Copying @luneo/ai-safety..."
  cp -r src/lib/packages/ai-safety/* node_modules/@luneo/ai-safety/
fi
if [ -d "src/lib/packages/types" ]; then
  echo "📦 Copying @luneo/types..."
  cp -r src/lib/packages/types/* node_modules/@luneo/types/
fi

# Vérifier que les packages sont bien là
echo "📋 Checking packages..."
ls -la node_modules/@luneo/

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
