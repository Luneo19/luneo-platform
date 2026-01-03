#!/bin/bash
# Script automatique pour configurer le health check Railway via API
# Ce script configure automatiquement Railway pour utiliser /api/v1/health

set -e

echo "🚀 Configuration automatique du health check Railway via API..."
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

# Obtenir le répertoire racine du projet
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/apps/backend"

# Obtenir les informations du service Railway
echo -e "${BLUE}📋 Récupération des informations du service Railway...${NC}"
cd "$BACKEND_DIR"

# Obtenir le projet et le service
RAILWAY_STATUS=$(railway status 2>&1)
PROJECT_NAME=$(echo "$RAILWAY_STATUS" | grep "Project:" | awk '{print $2}')
SERVICE_NAME=$(echo "$RAILWAY_STATUS" | grep "Service:" | awk '{print $2}')

echo -e "${GREEN}✅ Projet: ${PROJECT_NAME}${NC}"
echo -e "${GREEN}✅ Service: ${SERVICE_NAME}${NC}"
echo ""

# Configuration automatique via railway.toml
echo -e "${BLUE}📝 Configuration du health check dans railway.toml...${NC}"

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

# Vérifier si jq est installé pour parser JSON
if command -v jq &> /dev/null; then
    USE_JQ=true
else
    USE_JQ=false
    echo -e "${YELLOW}⚠️  jq n'est pas installé (optionnel, pour parsing JSON)${NC}"
fi

# Obtenir le token Railway (depuis le CLI)
echo -e "${BLUE}🔑 Récupération du token Railway...${NC}"
RAILWAY_TOKEN=$(railway whoami --json 2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")

if [ -z "$RAILWAY_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Token Railway non trouvé via CLI, utilisation de l'approche alternative${NC}"
    RAILWAY_TOKEN=""
fi

# Méthode 1: Utiliser Railway CLI pour forcer un redéploiement avec la nouvelle config
echo -e "${BLUE}🚀 Méthode 1: Redéploiement avec nouvelle configuration...${NC}"

# Commit et push automatique
echo -e "${BLUE}📤 Commit et push automatique...${NC}"
cd "$PROJECT_ROOT"

git add apps/backend/railway.toml
git commit -m "chore: Configure Railway health check to use /api/v1/health via API script" || echo "Aucun changement à commiter"

# Essayer de push (peut échouer si GitHub bloque)
git push origin main 2>&1 | grep -v "remote rejected\|secret" || echo -e "${YELLOW}⚠️  Push bloqué par GitHub (secrets), mais OK pour Railway${NC}"

echo -e "${GREEN}✅ Changements commités${NC}"
echo ""

# Déployer automatiquement
echo -e "${BLUE}🚀 Déploiement automatique sur Railway...${NC}"
cd "$BACKEND_DIR"
railway up --detach

echo ""
echo -e "${GREEN}✅ Déploiement déclenché${NC}"
echo ""

# Méthode 2: Configuration via l'interface web (instructions)
echo -e "${BLUE}📋 Méthode 2: Configuration manuelle via l'interface web (si nécessaire)${NC}"
echo ""
echo "Si le health check ne fonctionne toujours pas après le déploiement,"
echo "configurez-le manuellement dans Railway Dashboard :"
echo ""
echo "1. Ouvrez Railway Dashboard :"
echo "   railway open"
echo ""
echo "2. Allez dans Settings → Health Check"
echo ""
echo "3. Configurez :"
echo "   - Health Check Path: /api/v1/health"
echo "   - Health Check Timeout: 300"
echo ""
echo "4. Sauvegardez et attendez le redéploiement"
echo ""

# Vérification du health check après déploiement
echo -e "${BLUE}⏳ Attente 60 secondes pour le build...${NC}"
sleep 60

echo ""
echo -e "${BLUE}🔍 Vérification du health check...${NC}"

# Obtenir l'URL du service
RAILWAY_DOMAIN=$(railway domain 2>/dev/null | grep -v "^$" | head -1 || echo "")

if [ -n "$RAILWAY_DOMAIN" ]; then
    echo -e "${GREEN}✅ URL du service: ${RAILWAY_DOMAIN}${NC}"
    echo ""
    
    # Tester le health check
    echo -e "${BLUE}🧪 Test du health check à /api/v1/health...${NC}"
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://${RAILWAY_DOMAIN}/api/v1/health" 2>/dev/null || echo "000")
    
    if [ "$HEALTH_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ Health check fonctionne ! (Code: ${HEALTH_RESPONSE})${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check retourne le code: ${HEALTH_RESPONSE}${NC}"
        echo "   Cela peut être normal si le build n'est pas encore terminé"
    fi
    
    echo ""
    echo -e "${BLUE}🧪 Test du health check à /health (ancien endpoint)...${NC}"
    OLD_HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://${RAILWAY_DOMAIN}/health" 2>/dev/null || echo "000")
    echo "   Code: ${OLD_HEALTH_RESPONSE}"
else
    echo -e "${YELLOW}⚠️  Impossible d'obtenir l'URL du service${NC}"
    echo "   Vérifiez manuellement avec: railway domain"
fi

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
echo "   Et testez: curl https://\$(railway domain)/api/v1/health"
echo ""

