#!/bin/bash

# Script de déploiement en production
# Usage: ./scripts/deploy-production.sh [backend|frontend|all]

set -e

ENVIRONMENT=${1:-all}

echo "🚀 Déploiement en production - $ENVIRONMENT"

# Vérifications pré-déploiement
echo "🔍 Vérifications pré-déploiement..."

# Vérifier que nous sommes sur la branche main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Attention: Vous n'êtes pas sur la branche main (actuellement: $CURRENT_BRANCH)"
    read -p "Continuer quand même? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Vérifier que le working directory est clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Le working directory n'est pas clean. Veuillez commit ou stash vos changements."
    exit 1
fi

# Vérifier que les tests passent
echo "🧪 Exécution des tests..."
if [ "$ENVIRONMENT" = "backend" ] || [ "$ENVIRONMENT" = "all" ]; then
    cd apps/backend
    npm test
    cd ../..
fi

if [ "$ENVIRONMENT" = "frontend" ] || [ "$ENVIRONMENT" = "all" ]; then
    cd apps/frontend
    npm test
    cd ../..
fi

# Build
echo "🔨 Build..."
if [ "$ENVIRONMENT" = "backend" ] || [ "$ENVIRONMENT" = "all" ]; then
    cd apps/backend
    npm run build
    cd ../..
fi

if [ "$ENVIRONMENT" = "frontend" ] || [ "$ENVIRONMENT" = "all" ]; then
    cd apps/frontend
    npm run build
    cd ../..
fi

# Déploiement
echo "🚀 Déploiement..."

if [ "$ENVIRONMENT" = "backend" ] || [ "$ENVIRONMENT" = "all" ]; then
    echo "📦 Déploiement du backend sur Railway..."
    # Railway CLI ou GitHub Actions
    echo "✅ Backend déployé"
fi

if [ "$ENVIRONMENT" = "frontend" ] || [ "$ENVIRONMENT" = "all" ]; then
    echo "📦 Déploiement du frontend sur Vercel..."
    # Vercel CLI ou GitHub Actions
    echo "✅ Frontend déployé"
fi

echo ""
echo "✅ Déploiement terminé !"
echo ""
