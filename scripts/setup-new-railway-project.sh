#!/bin/bash
# Script pour créer un nouveau projet Railway et déployer le backend

set -e

echo "🚀 Configuration d'un nouveau projet Railway pour Luneo Backend"
echo ""

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/apps/backend"

cd "$BACKEND_DIR"

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé"
    echo "Installation: curl -fsSL https://railway.com/install.sh | sh"
    exit 1
fi

# Vérifier que l'utilisateur est connecté
if ! railway whoami &> /dev/null; then
    echo "⚠️  Vous n'êtes pas connecté à Railway"
    echo "Connexion..."
    railway login
fi

echo "✅ Railway CLI configuré"
echo ""

# Supprimer l'ancien lien s'il existe
echo "🔗 Suppression de l'ancien lien..."
railway unlink 2>/dev/null || true

# Créer un nouveau projet
echo "📦 Création d'un nouveau projet Railway..."
PROJECT_NAME="luneo-backend-production"

# Note: railway init nécessite une interaction, donc on va utiliser railway link
# après avoir créé le projet manuellement ou via l'interface web

echo ""
echo "📋 Instructions pour finaliser la configuration:"
echo ""
echo "1. Allez sur https://railway.app/new"
echo "2. Créez un nouveau projet nommé: $PROJECT_NAME"
echo "3. Ajoutez un nouveau service (GitHub Repo)"
echo "4. Sélectionnez ce repository"
echo "5. Configurez le Root Directory sur: apps/backend"
echo "6. Le fichier railway.toml sera automatiquement détecté"
echo ""
echo "OU utilisez Railway CLI interactivement:"
echo "   cd $BACKEND_DIR"
echo "   railway link"
echo "   (Sélectionnez le projet $PROJECT_NAME)"
echo ""
echo "Ensuite, le déploiement se fera automatiquement avec:"
echo "   railway up --detach"
echo ""
echo "✅ Configuration dans railway.toml:"
echo "   - healthcheckPath = /api/v1/health"
echo "   - startCommand = node dist/src/main.js"
echo "   - builder = NIXPACKS"
echo ""


