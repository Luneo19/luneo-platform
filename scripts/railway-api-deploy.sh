#!/bin/bash

# Déploiement Railway via API - Configuration complète automatique

set -e

echo "🚀 Déploiement Railway via API - Configuration Automatique"
echo "========================================================="
echo ""

PROJECT_ID="fb66d02e-2862-4a62-af66-f97430983d0b"

# Utiliser Railway CLI pour déployer directement
echo "📦 Création du service et déploiement..."

# Créer un nouveau service en déployant depuis le répertoire
cd /Users/emmanuelabougadous/luneo-platform

# Déployer directement (Railway créera le service automatiquement)
echo "Déploiement en cours..."
railway up --service backend 2>&1 || railway deploy --service backend 2>&1 || {
    echo "Tentative sans spécifier le service..."
    # Créer un nouveau service vide puis déployer
    railway up 2>&1
}

echo ""
echo "⏳ Attente du démarrage du build (20 secondes)..."
sleep 20

echo ""
echo "📋 Logs du déploiement :"
railway logs --tail 150 2>&1 | head -150

echo ""
echo "📊 Statut :"
railway status 2>&1

echo ""
echo "🌐 URL du service :"
railway domain 2>&1 || echo "URL non disponible (déploiement en cours)"

echo ""
echo "✅ Déploiement lancé !"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Vérifier les logs : railway logs"
echo "   2. Configurer PostgreSQL via dashboard"
echo "   3. Configurer les variables via dashboard"
echo "   4. Tester le health check une fois déployé"
echo ""







