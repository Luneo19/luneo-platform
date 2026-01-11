#!/bin/bash

# Script de déploiement Railway pour Backend
# Usage: ./scripts/deploy-railway.sh

set -e

echo "🚀 DÉPLOIEMENT RAILWAY - BACKEND"
echo "=================================="
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
echo "🔐 Vérification connexion Railway..."
if ! railway whoami &> /dev/null; then
    echo "❌ Non connecté à Railway"
    echo "Connexion: railway login"
    exit 1
fi

echo "✅ Connecté à Railway"
echo ""

# Variables d'environnement requises
REQUIRED_VARS=(
    "DATABASE_URL"
    "REDIS_URL"
    "OPENAI_API_KEY"
    "ANTHROPIC_API_KEY"
    "MISTRAL_API_KEY"
    "FRONTEND_URL"
)

echo "📋 Vérification variables d'environnement..."
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! railway variables get "$var" &> /dev/null; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "⚠️  Variables manquantes:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Pour ajouter: railway variables set $var=value"
    read -p "Continuer quand même? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Variables d'environnement OK"
echo ""

# Déploiement
echo "🚀 Déploiement en cours..."
cd apps/backend

railway up --service backend

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "📊 Vérifications:"
echo "1. Health check: curl https://your-app.railway.app/health"
echo "2. Metrics: curl https://your-app.railway.app/health/metrics"
echo "3. Logs: railway logs"
