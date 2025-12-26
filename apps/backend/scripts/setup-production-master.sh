#!/bin/bash

# ==============================================
# SCRIPT MAÎTRE - CONFIGURATION PRODUCTION
# Exécute TOUT en séquence automatiquement
# ==============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CONFIGURATION PRODUCTION MASTER - LUNEO                  ║${NC}"
echo -e "${BLUE}║  SaaS de niveau mondial - Tout automatique               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$BACKEND_DIR"

# Étape 1: Configuration complète
echo -e "${YELLOW}ÉTAPE 1/5: Configuration complète...${NC}"
./scripts/configure-production-complete.sh

# Étape 2: Vérification
echo -e "${YELLOW}ÉTAPE 2/5: Vérification...${NC}"
./scripts/verify-production-config.sh

# Étape 3: Migration base de données
echo -e "${YELLOW}ÉTAPE 3/5: Migration base de données...${NC}"
read -p "Appliquer les migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./scripts/migrate-production-database.sh
fi

# Étape 4: Configuration Vercel
echo -e "${YELLOW}ÉTAPE 4/5: Configuration Vercel...${NC}"
read -p "Configurer Vercel? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./scripts/setup-vercel-variables.sh
fi

# Étape 5: Déploiement
echo -e "${YELLOW}ÉTAPE 5/5: Déploiement...${NC}"
read -p "Déployer maintenant? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./scripts/deploy-production-complete.sh
fi

echo ""
echo -e "${GREEN}✅ Configuration production complète terminée!${NC}"
echo ""




















