#!/bin/bash

# Script pour corriger le problème de routing backend
# Usage: ./scripts/fix-backend-routing.sh

set -e

echo "🔧 CORRECTION ROUTING BACKEND"
echo "=============================="
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

# Vérifier variables d'environnement
echo "📋 Vérification variables Railway..."
API_PREFIX=$(railway variables 2>&1 | grep "API_PREFIX" | awk '{print $2}' || echo "")
if [ -z "$API_PREFIX" ]; then
    echo "⚠️  API_PREFIX non configuré, utilisation de la valeur par défaut: /api/v1"
    echo "   Pour configurer: railway variables set API_PREFIX=/api/v1"
else
    echo "✅ API_PREFIX configuré: $API_PREFIX"
fi

echo ""
echo "🚀 Redéploiement backend..."
railway up --service backend 2>&1 | tee /tmp/railway-redeploy-routing.log

echo ""
echo "⏳ Attente du déploiement (30 secondes)..."
sleep 30

echo ""
echo "🔍 Test des endpoints..."
echo ""

# Test health
echo "1. Test /health..."
HEALTH=$(curl -s "https://api.luneo.app/health" 2>&1 | head -1)
if echo "$HEALTH" | grep -q "ok"; then
    echo "   ✅ Health check OK"
else
    echo "   ⚠️  Health check: $HEALTH"
fi

# Test signup
echo "2. Test /api/v1/auth/signup..."
SIGNUP_RESPONSE=$(curl -s "https://api.luneo.app/api/v1/auth/signup" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test-routing@test.com","password":"Test123!","firstName":"Test","lastName":"Routing"}' \
    2>&1)

if echo "$SIGNUP_RESPONSE" | grep -q "409\|already exists\|User already exists"; then
    echo "   ✅ Endpoint accessible (utilisateur existe déjà - normal)"
elif echo "$SIGNUP_RESPONSE" | grep -q "201\|user\|success"; then
    echo "   ✅ Endpoint accessible (inscription réussie)"
elif echo "$SIGNUP_RESPONSE" | grep -q "404\|Not Found"; then
    echo "   ❌ Endpoint non trouvé (404)"
    echo "   Réponse: $SIGNUP_RESPONSE"
else
    echo "   ⚠️  Réponse inattendue: $SIGNUP_RESPONSE"
fi

echo ""
echo "📋 Logs Railway (dernières 20 lignes)..."
railway logs --tail 20 2>&1 | tail -20

echo ""
echo "✅ Correction terminée !"
