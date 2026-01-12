#!/bin/bash

# 🚀 Script d'Installation Automatique - Toutes les Dépendances
# Pour atteindre le score 90/100

set -e

echo "🚀 INSTALLATION AUTOMATIQUE DES DÉPENDANCES"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm n'est pas installé. Installation de pnpm...${NC}"
    npm install -g pnpm
fi

echo -e "${BLUE}📦 Installation des dépendances Backend...${NC}"
cd apps/backend

# Install new dependencies for OAuth and Export
echo "  → Installation passport-google-oauth20, passport-github2, exceljs, pdfkit..."
pnpm add passport-google-oauth20@^2.0.0 passport-github2@^0.1.12 exceljs@^4.4.0 pdfkit@^0.14.0

# Install axios if not already installed (for CAPTCHA service)
if ! grep -q "axios" package.json; then
    echo "  → Installation axios..."
    pnpm add axios
fi

cd ../..

echo ""
echo -e "${BLUE}📦 Installation des dépendances Frontend...${NC}"
cd apps/frontend

# Frontend dependencies are mostly already installed
# Just ensure we have all necessary packages
echo "  → Vérification des dépendances frontend..."
pnpm install

cd ../..

echo ""
echo -e "${BLUE}📦 Installation des dépendances racine...${NC}"
pnpm install

echo ""
echo -e "${GREEN}✅ Installation terminée avec succès !${NC}"
echo ""
echo "📋 Prochaines étapes :"
echo "  1. Configurer les variables d'environnement (voir .env.example)"
echo "  2. Exécuter les migrations Prisma"
echo "  3. Démarrer les services"
echo ""
