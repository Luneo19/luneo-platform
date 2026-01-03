#!/bin/bash
# Script automatique pour configurer le health check Railway
# Ce script configure automatiquement Railway pour utiliser /api/v1/health

set -e

echo "🚀 Configuration automatique du health check Railway..."
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI n'est pas installé${NC}"
    echo "Installation: curl -fsSL https://railway.com/install.sh | sh"
    exit 1
fi

# Vérifier que l'utilisateur est connecté
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vous n'êtes pas connecté à Railway${NC}"
    echo "Connexion..."
    railway login
fi

echo -e "${GREEN}✅ Railway CLI configuré${NC}"
echo ""

# Configuration automatique via railway.toml
echo "📝 Configuration du health check dans railway.toml..."
cd "$(dirname "$0")/../apps/backend"

# Mettre à jour railway.toml pour utiliser /api/v1/health
cat > railway.toml << 'EOF'
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/api/v1/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
# Note: Health check uses HealthController at /api/v1/health (with global prefix)
# IMPORTANT: Railway Root Directory doit être configuré sur apps/backend
startCommand = "node dist/src/main.js"

[env]
NODE_ENV = "production"
# PORT est fourni automatiquement par Railway via $PORT
EOF

echo -e "${GREEN}✅ railway.toml mis à jour${NC}"
echo ""

# Commit et push automatique
echo "📤 Commit et push automatique..."
cd "$(dirname "$0")/.."

git add apps/backend/railway.toml
git commit -m "chore: Configure Railway health check to use /api/v1/health" || echo "Aucun changement à commiter"
git push origin main || echo "Push échoué ou déjà à jour"

echo -e "${GREEN}✅ Changements commités et poussés${NC}"
echo ""

# Déployer automatiquement
echo "🚀 Déploiement automatique sur Railway..."
cd apps/backend
railway up --detach

echo ""
echo -e "${GREEN}✅ Configuration automatique terminée !${NC}"
echo ""
echo "📋 Résumé:"
echo "  - Health check configuré pour utiliser /api/v1/health"
echo "  - Railway.toml mis à jour"
echo "  - Déploiement déclenché"
echo ""
echo "⏳ Attendez 2-3 minutes pour que le déploiement se termine"
echo "   Puis vérifiez les logs: railway logs"
echo ""

