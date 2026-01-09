#!/bin/bash

# Déploiement Railway avec Project Token

set -e

echo "🚀 Déploiement Railway avec Project Token"
echo "=========================================="
echo ""

PROJECT_TOKEN="cfceb780-1fdd-49f5-af21-5387213f95ac"
PROJECT_ID="fb66d02e-2862-4a62-af66-f97430983d0b"

# Utiliser Railway CLI avec le token de projet
export RAILWAY_TOKEN="$PROJECT_TOKEN"

cd /Users/emmanuelabougadous/luneo-platform

echo "📦 Liaison du projet..."
railway link --project "$PROJECT_ID" 2>&1 || echo "Projet déjà lié ou erreur"

echo ""
echo "🔧 Création du service backend..."
# Créer un service en déployant
railway up --service backend 2>&1 || railway deploy --service backend 2>&1 || {
    echo "Création d'un nouveau service..."
    railway up 2>&1
}

echo ""
echo "⏳ Attente du démarrage (20 secondes)..."
sleep 20

echo ""
echo "📋 Logs :"
railway logs --tail 150 2>&1 | head -150

echo ""
echo "📊 Statut :"
railway status 2>&1

echo ""
echo "🌐 URL :"
railway domain 2>&1 || echo "URL non disponible"

echo ""
echo "✅ Déploiement lancé !"











