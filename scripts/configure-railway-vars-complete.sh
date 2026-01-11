#!/bin/bash

# Script pour configurer toutes les variables Railway nécessaires
# Usage: ./scripts/configure-railway-vars-complete.sh

set -e

echo "🔐 CONFIGURATION VARIABLES RAILWAY - COMPLÈTE"
echo "=============================================="
echo ""

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI non installé"
    exit 1
fi

cd apps/backend

# Vérifier connexion
if ! railway whoami &> /dev/null; then
    echo "❌ Non connecté à Railway"
    exit 1
fi

echo "✅ Connecté à Railway"
echo ""

# Demander les clés API
echo "📋 Configuration des clés API LLM..."
echo ""

read -p "OPENAI_API_KEY: " OPENAI_KEY
if [ -n "$OPENAI_KEY" ]; then
    railway variables set OPENAI_API_KEY="$OPENAI_KEY" 2>&1 | grep -v "already exists" || true
    echo "✅ OPENAI_API_KEY configuré"
else
    echo "⚠️  OPENAI_API_KEY non fourni"
fi

read -p "ANTHROPIC_API_KEY: " ANTHROPIC_KEY
if [ -n "$ANTHROPIC_KEY" ]; then
    railway variables set ANTHROPIC_API_KEY="$ANTHROPIC_KEY" 2>&1 | grep -v "already exists" || true
    echo "✅ ANTHROPIC_API_KEY configuré"
else
    echo "⚠️  ANTHROPIC_API_KEY non fourni"
fi

read -p "MISTRAL_API_KEY: " MISTRAL_KEY
if [ -n "$MISTRAL_KEY" ]; then
    railway variables set MISTRAL_API_KEY="$MISTRAL_KEY" 2>&1 | grep -v "already exists" || true
    echo "✅ MISTRAL_API_KEY configuré"
else
    echo "⚠️  MISTRAL_API_KEY non fourni"
fi

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📋 Variables configurées:"
railway variables 2>&1 | grep -E "(OPENAI|ANTHROPIC|MISTRAL)" || echo "Aucune variable trouvée"
