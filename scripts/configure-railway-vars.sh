#!/bin/bash

# Script pour configurer toutes les variables Railway nécessaires pour Agents IA
# Usage: ./scripts/configure-railway-vars.sh

set -e

echo "🔐 CONFIGURATION VARIABLES RAILWAY - AGENTS IA"
echo "=============================================="
echo ""

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI non installé"
    echo "Installation: npm i -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI détecté"
echo ""

# Vérifier connexion
if ! railway whoami &> /dev/null; then
    echo "❌ Non connecté à Railway"
    echo "Connexion: railway login"
    exit 1
fi

echo "✅ Connecté à Railway"
echo ""

# Variables obligatoires pour Agents IA
echo "📋 Configuration variables Agents IA..."
echo ""

# Database (doit être configuré manuellement avec référence)
echo "⚠️  DATABASE_URL doit être configuré dans Railway Dashboard avec: \${{Postgres.DATABASE_URL}}"
echo ""

# Redis (optionnel mais recommandé)
echo "⚠️  REDIS_URL doit être configuré dans Railway Dashboard avec: \${{Redis.REDIS_URL}}"
echo ""

# LLM Providers (OBLIGATOIRES)
read -p "OPENAI_API_KEY: " OPENAI_KEY
if [ -n "$OPENAI_KEY" ]; then
    railway variables set OPENAI_API_KEY="$OPENAI_KEY"
    echo "✅ OPENAI_API_KEY configuré"
fi

read -p "ANTHROPIC_API_KEY: " ANTHROPIC_KEY
if [ -n "$ANTHROPIC_KEY" ]; then
    railway variables set ANTHROPIC_API_KEY="$ANTHROPIC_KEY"
    echo "✅ ANTHROPIC_API_KEY configuré"
fi

read -p "MISTRAL_API_KEY: " MISTRAL_KEY
if [ -n "$MISTRAL_KEY" ]; then
    railway variables set MISTRAL_API_KEY="$MISTRAL_KEY"
    echo "✅ MISTRAL_API_KEY configuré"
fi

# Variables optionnelles
railway variables set PROMETHEUS_ENABLED="true" 2>&1 | grep -v "already exists" || true
railway variables set METRICS_PORT="9090" 2>&1 | grep -v "already exists" || true
railway variables set USE_VECTOR_STORE="false" 2>&1 | grep -v "already exists" || true
railway variables set RATE_LIMIT_ENABLED="true" 2>&1 | grep -v "already exists" || true
railway variables set CIRCUIT_BREAKER_ENABLED="true" 2>&1 | grep -v "already exists" || true
railway variables set RETRY_MAX_ATTEMPTS="3" 2>&1 | grep -v "already exists" || true
railway variables set CACHE_ENABLED="true" 2>&1 | grep -v "already exists" || true

echo ""
echo "✅ Variables Agents IA configurées!"
echo ""
echo "📋 Variables configurées:"
railway variables | grep -E "(OPENAI|ANTHROPIC|MISTRAL|PROMETHEUS|METRICS|VECTOR|RATE_LIMIT|CIRCUIT|RETRY|CACHE)" || echo "Aucune variable trouvée"
