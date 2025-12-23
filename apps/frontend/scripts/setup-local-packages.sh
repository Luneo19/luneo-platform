#!/bin/bash
set -e

echo "📦 Setting up local packages for Vercel build..."

# Créer les dossiers pour les packages locaux
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
echo "✅ Local packages setup complete"
ls -la node_modules/@luneo/ 2>/dev/null || echo "⚠️ No @luneo packages found"
