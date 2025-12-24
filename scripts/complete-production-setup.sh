#!/bin/bash

# Script complet d'automatisation production
# Exécute toutes les vérifications et configurations automatiques

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🚀 AUTOMATISATION COMPLÈTE PRODUCTION - LUNEO${NC}"
echo "=================================================="
echo ""

# 1. Vérification préalable
echo -e "${BLUE}📋 1. VÉRIFICATIONS PRÉALABLES${NC}"
cd "$PROJECT_ROOT"

if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI non installé${NC}"
    exit 1
fi

if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Vercel non authentifié${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI configuré${NC}"
echo ""

# 2. Vérification des variables d'environnement
echo -e "${BLUE}🔐 2. VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT${NC}"
"$SCRIPT_DIR/automate-production-setup.sh" 2>&1 | grep -E "✅|⚠️|❌" | head -15
echo ""

# 3. Tests des endpoints
echo -e "${BLUE}🧪 3. TESTS DES ENDPOINTS${NC}"
"$SCRIPT_DIR/test-production-endpoints.sh"
echo ""

# 4. Configuration Stripe Webhook (si Stripe CLI disponible)
if command -v stripe &> /dev/null; then
    echo -e "${BLUE}💳 4. CONFIGURATION STRIPE WEBHOOK${NC}"
    read -p "Configurer le webhook Stripe automatiquement? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        "$SCRIPT_DIR/setup-stripe-webhook-auto.sh"
    else
        echo -e "${YELLOW}⚠️  Configuration Stripe webhook ignorée${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠️  Stripe CLI non installé - Configuration webhook manuelle requise${NC}"
    echo ""
fi

# 5. Résumé final
echo -e "${BLUE}📊 RÉSUMÉ FINAL${NC}"
echo "=================================================="
echo ""
echo -e "${GREEN}✅ Vérifications terminées${NC}"
echo -e "${GREEN}✅ Tests exécutés${NC}"
echo ""
echo -e "${BLUE}📝 Actions restantes (si nécessaire):${NC}"
echo "1. Configurer Stripe webhook (si non fait)"
echo "2. Redéployer après configuration: cd apps/frontend && vercel --prod"
echo "3. Configurer monitoring (Sentry, Vercel Analytics)"
echo ""
echo -e "${GREEN}🎉 Automatisation terminée !${NC}"

