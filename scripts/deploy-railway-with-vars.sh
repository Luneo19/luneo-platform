#!/bin/bash

# Script de déploiement Railway avec configuration variables
# Usage: ./scripts/deploy-railway-with-vars.sh [OPENAI_KEY] [ANTHROPIC_KEY] [MISTRAL_KEY]

set -e

OPENAI_KEY="${1:-}"
ANTHROPIC_KEY="${2:-}"
MISTRAL_KEY="${3:-}"

echo "🚀 DÉPLOIEMENT RAILWAY AVEC VARIABLES"
echo "======================================"
echo ""

cd apps/backend

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI non installé"
    exit 1
fi

# Vérifier connexion
if ! railway whoami &> /dev/null; then
    echo "❌ Non connecté à Railway"
    exit 1
fi

echo "✅ Connecté à Railway"
echo ""

# Configurer variables si fournies
if [ -n "$OPENAI_KEY" ]; then
    echo "📝 Configuration OPENAI_API_KEY..."
    railway variables set OPENAI_API_KEY="$OPENAI_KEY" 2>&1 | grep -v "already exists" || true
    echo "✅ OPENAI_API_KEY configuré"
fi

if [ -n "$ANTHROPIC_KEY" ]; then
    echo "📝 Configuration ANTHROPIC_API_KEY..."
    railway variables set ANTHROPIC_API_KEY="$ANTHROPIC_KEY" 2>&1 | grep -v "already exists" || true
    echo "✅ ANTHROPIC_API_KEY configuré"
fi

if [ -n "$MISTRAL_KEY" ]; then
    echo "📝 Configuration MISTRAL_API_KEY..."
    railway variables set MISTRAL_API_KEY="$MISTRAL_KEY" 2>&1 | grep -v "already exists" || true
    echo "✅ MISTRAL_API_KEY configuré"
fi

echo ""
echo "🚀 Déploiement en cours..."
echo ""

# Déployer avec suivi des logs
railway up --service backend 2>&1 | tee /tmp/railway-deploy-$(date +%s).log

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "📊 Suivi des logs..."
railway logs --tail 50
