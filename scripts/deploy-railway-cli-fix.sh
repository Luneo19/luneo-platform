#!/bin/bash
# Script de déploiement Railway avec CLI - Configuration et correction automatique

set -e

PROJECT_ID="${RAILWAY_PROJECT_ID:-0e3eb9ba-6846-4e0e-81d2-bd7da54da971}"
RAILWAY_TOKEN="${RAILWAY_TOKEN:-3d86d8f3-3b3f-41bf-b3ed-45975ddf4a91}"
export RAILWAY_TOKEN

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Déploiement Railway avec CLI${NC}"
echo "Project ID: $PROJECT_ID"
echo ""

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
  echo -e "${RED}❌ Railway CLI n'est pas installé${NC}"
  echo ""
  echo "Installation:"
  echo "  npm i -g @railway/cli"
  echo "  ou"
  echo "  brew install railway"
  exit 1
fi

echo -e "${GREEN}✅ Railway CLI installé${NC}"
echo ""

# Configurer le token dans le fichier de configuration Railway
if [ -n "$RAILWAY_TOKEN" ]; then
  echo -e "${BLUE}📋 Configuration du token Railway...${NC}"
  mkdir -p ~/.railway
  cat > ~/.railway/config.json <<EOF
{"token":"$RAILWAY_TOKEN"}
EOF
  echo -e "${GREEN}✅ Token configuré${NC}"
else
  echo -e "${YELLOW}⚠️  Aucun token Railway fourni${NC}"
  echo "Utilisez: export RAILWAY_TOKEN='votre-token'"
fi

echo ""

# Vérifier l'authentification
echo -e "${BLUE}📋 Vérification de l'authentification...${NC}"
if railway whoami &>/dev/null; then
  echo -e "${GREEN}✅ Authentifié${NC}"
  railway whoami
else
  echo -e "${YELLOW}⚠️  Authentification échouée${NC}"
  echo ""
  echo "Le token peut être invalide ou expiré."
  echo ""
  echo "Options:"
  echo "  1. Login interactif (recommandé):"
  echo "     railway login"
  echo ""
  echo "  2. Obtenir un nouveau token:"
  echo "     https://railway.app/account/tokens"
  echo ""
  exit 1
fi

echo ""

# Vérifier le projet lié
echo -e "${BLUE}📋 Vérification du projet lié...${NC}"
CURRENT_PROJECT=$(railway status 2>/dev/null | grep -i "project" | head -1 || echo "")

if echo "$CURRENT_PROJECT" | grep -q "$PROJECT_ID"; then
  echo -e "${GREEN}✅ Projet déjà lié: $PROJECT_ID${NC}"
else
  echo -e "${YELLOW}⚠️  Lien du projet...${NC}"
  railway link --project "$PROJECT_ID" || {
    echo -e "${RED}❌ Impossible de lier le projet${NC}"
    echo ""
    echo "Vérifiez que:"
    echo "  1. Le project ID est correct: $PROJECT_ID"
    echo "  2. Vous avez accès à ce projet"
    echo "  3. Le projet existe toujours"
    exit 1
  }
fi

echo ""

# Lister les services
echo -e "${BLUE}📋 Services disponibles:${NC}"
railway status || true
echo ""

# Déclencher le déploiement
echo -e "${BLUE}📋 Déclenchement du déploiement...${NC}"
echo ""

# Essayer de trouver le service backend
SERVICE_NAME=$(railway status 2>/dev/null | grep -i "backend\|api\|service" | head -1 | awk '{print $1}' || echo "")

if [ -n "$SERVICE_NAME" ]; then
  echo -e "${GREEN}✅ Service trouvé: $SERVICE_NAME${NC}"
  railway up --ci --service "$SERVICE_NAME" || railway up --ci
else
  echo -e "${YELLOW}⚠️  Déploiement sans spécifier de service${NC}"
  railway up --ci
fi

echo ""
echo -e "${GREEN}✅ Déploiement déclenché${NC}"
echo ""
echo "📋 Commandes utiles:"
echo "  railway logs          # Voir les logs"
echo "  railway status        # Voir le statut"
echo "  railway domain        # Voir le domaine"
echo ""

