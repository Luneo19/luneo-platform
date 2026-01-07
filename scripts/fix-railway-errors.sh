#!/bin/bash

# Script pour identifier et corriger les erreurs Railway

set -e

echo "🔍 Diagnostic et Correction des Erreurs Railway"
echo "==============================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ID="0e3eb9ba-6846-4e0e-81d2-bd7da54da971"

echo "📋 Problèmes potentiels identifiés :"
echo ""

# 1. Vérifier le start command
echo "1. Vérification du start command..."
if grep -q "cd apps/backend && pnpm start" railway.json; then
    echo -e "${YELLOW}⚠️  Problème potentiel : Le start command utilise 'cd apps/backend'${NC}"
    echo "   Railway pourrait ne pas être dans le bon répertoire"
    echo "   Solution : Utiliser le working directory dans Railway"
fi

# 2. Vérifier le chemin Prisma
echo ""
echo "2. Vérification du chemin Prisma..."
if [ -f "apps/backend/prisma/schema.prisma" ]; then
    echo -e "${GREEN}✅ Schema Prisma trouvé${NC}"
else
    echo -e "${RED}❌ Schema Prisma non trouvé${NC}"
fi

# 3. Vérifier les variables d'environnement requises
echo ""
echo "3. Variables d'environnement requises..."
echo "   - DATABASE_URL (pour Prisma)"
echo "   - NODE_ENV"
echo "   - JWT_SECRET"
echo "   - PORT (fourni automatiquement par Railway)"

# 4. Vérifier le main.ts pour les chemins
echo ""
echo "4. Vérification des chemins dans main.ts..."
if grep -q "process.cwd()" apps/backend/src/main.ts; then
    echo -e "${YELLOW}⚠️  Utilisation de process.cwd() - peut causer des problèmes${NC}"
fi

echo ""
echo "🔧 Corrections à appliquer :"
echo ""










