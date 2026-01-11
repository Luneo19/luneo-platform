#!/bin/bash

# Script pour corriger et déployer Railway
# Usage: ./scripts/fix-railway-deploy.sh [OPENAI_KEY] [ANTHROPIC_KEY] [MISTRAL_KEY]

set -e

OPENAI_KEY="${1:-}"
ANTHROPIC_KEY="${2:-}"
MISTRAL_KEY="${3:-}"

echo "🔧 CORRECTION ET DÉPLOIEMENT RAILWAY"
echo "===================================="
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

# Configurer variables si fournies via Railway Dashboard ou CLI interactif
if [ -n "$OPENAI_KEY" ] || [ -n "$ANTHROPIC_KEY" ] || [ -n "$MISTRAL_KEY" ]; then
    echo "📝 Configuration variables..."
    echo ""
    echo "⚠️  Pour configurer les variables, utilisez Railway Dashboard:"
    echo "   https://railway.app"
    echo ""
    echo "Ou utilisez la commande interactive:"
    echo "   railway variables add"
    echo ""
    echo "Variables à configurer:"
    echo "   - OPENAI_API_KEY"
    echo "   - ANTHROPIC_API_KEY"
    echo "   - MISTRAL_API_KEY"
    echo ""
    read -p "Appuyez sur Entrée pour continuer le déploiement..."
fi

echo ""
echo "🚀 Déploiement en cours..."
echo ""

# Déployer
railway up --service backend 2>&1 | tee /tmp/railway-deploy-$(date +%s).log

echo ""
echo "✅ Déploiement lancé!"
echo ""
echo "📊 Suivi des logs en temps réel..."
echo ""

# Suivre les logs
railway logs --tail 100 --follow 2>&1 | head -100
