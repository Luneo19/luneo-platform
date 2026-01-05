#!/bin/bash

# Script d'aide pour déployer le backend sur Railway
# Ce script guide l'utilisateur à travers le processus

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/apps/backend"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚂 DÉPLOIEMENT BACKEND RAILWAY - LUNEO                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérification Railway CLI
echo -e "${CYAN}📋 Étape 1/5: Vérification Railway CLI...${NC}"
if ! command -v railway >/dev/null 2>&1; then
    echo -e "${RED}❌ Railway CLI n'est pas installé${NC}"
    echo -e "${YELLOW}   Installation: npm i -g @railway/cli${NC}"
    echo ""
    read -p "Voulez-vous installer Railway CLI maintenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm i -g @railway/cli
    else
        exit 1
    fi
fi
echo -e "${GREEN}✅ Railway CLI installé: $(railway --version 2>&1 | head -1)${NC}"
echo ""

# Vérification connexion
echo -e "${CYAN}📋 Étape 2/5: Vérification connexion Railway...${NC}"
if ! railway whoami >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Non connecté à Railway${NC}"
    echo -e "${YELLOW}   Connexion en cours...${NC}"
    railway login
else
    echo -e "${GREEN}✅ Connecté: $(railway whoami)${NC}"
fi
echo ""

# Vérification projet lié
echo -e "${CYAN}📋 Étape 3/5: Vérification projet Railway...${NC}"
cd "$ROOT_DIR"

PROJECT_STATUS=$(railway status 2>&1 || echo "NOT_LINKED")
if [[ "$PROJECT_STATUS" == *"No linked project"* ]] || [[ "$PROJECT_STATUS" == "NOT_LINKED" ]]; then
    echo -e "${YELLOW}⚠️  Aucun projet lié${NC}"
    echo -e "${YELLOW}   Ouvrez Railway Dashboard pour obtenir le Project ID${NC}"
    echo -e "${YELLOW}   Ou créez un nouveau projet: railway init${NC}"
    echo ""
    read -p "Project ID Railway (ou 'new' pour créer): " PROJECT_ID
    if [[ "$PROJECT_ID" == "new" ]]; then
        railway init
    else
        railway link -p "$PROJECT_ID"
    fi
else
    echo -e "${GREEN}✅ Projet lié${NC}"
    railway status | head -5
fi
echo ""

# Vérification fichiers de configuration
echo -e "${CYAN}📋 Étape 4/5: Vérification fichiers de configuration...${NC}"
MISSING_FILES=0

if [ ! -f "$ROOT_DIR/Dockerfile" ]; then
    echo -e "${RED}❌ Dockerfile manquant à la racine${NC}"
    MISSING_FILES=1
else
    echo -e "${GREEN}✅ Dockerfile présent${NC}"
fi

if [ ! -f "$ROOT_DIR/nixpacks.toml" ]; then
    echo -e "${YELLOW}⚠️  nixpacks.toml manquant (optionnel)${NC}"
else
    echo -e "${GREEN}✅ nixpacks.toml présent${NC}"
fi

if [ ! -f "$BACKEND_DIR/railway.toml" ]; then
    echo -e "${YELLOW}⚠️  railway.toml manquant dans apps/backend (optionnel)${NC}"
else
    echo -e "${GREEN}✅ railway.toml présent${NC}"
fi

if [ $MISSING_FILES -eq 1 ]; then
    echo -e "${RED}❌ Fichiers de configuration manquants${NC}"
    exit 1
fi
echo ""

# Instructions pour Dashboard
echo -e "${CYAN}📋 Étape 5/5: Configuration Dashboard Railway${NC}"
echo -e "${YELLOW}⚠️  CONFIGURATION REQUISE DANS RAILWAY DASHBOARD:${NC}"
echo ""
echo -e "${BLUE}1. Ouvrez Railway Dashboard:${NC}"
echo "   railway open"
echo ""
echo -e "${BLUE}2. Créez/Configurez le service backend:${NC}"
echo "   - Root Directory: ${GREEN}.${NC} (racine, pas apps/backend)"
echo "   - Builder: ${GREEN}DOCKERFILE${NC} (ou NIXPACKS)"
echo "   - Health Check Path: ${GREEN}/api/v1/health${NC}"
echo ""
echo -e "${BLUE}3. Variables d'environnement OBLIGATOIRES:${NC}"
echo "   - DATABASE_URL (si PostgreSQL ajouté: \${{Postgres.DATABASE_URL}})"
echo "   - NODE_ENV=production"
echo "   - PORT (Railway fournit automatiquement)"
echo "   - JWT_SECRET (générer: openssl rand -base64 32)"
echo "   - JWT_REFRESH_SECRET (générer: openssl rand -base64 32)"
echo ""
echo -e "${BLUE}4. Variables d'environnement RECOMMANDÉES:${NC}"
echo "   - FRONTEND_URL=https://app.luneo.app"
echo "   - CORS_ORIGIN=https://app.luneo.app"
echo "   - API_PREFIX=/api"
echo ""
echo -e "${YELLOW}💡 Après configuration, déployez avec: railway up${NC}"
echo ""

# Option pour déployer maintenant
read -p "Voulez-vous déployer maintenant? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}🚀 Déploiement en cours...${NC}"
    railway up
else
    echo -e "${GREEN}✅ Configuration préparée. Déployez quand vous êtes prêt avec: railway up${NC}"
fi

echo ""
echo -e "${GREEN}✅ Script terminé!${NC}"


