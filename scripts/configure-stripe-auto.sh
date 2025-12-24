#!/bin/bash

# Script de configuration Stripe avec paramètres
# Usage: ./scripts/configure-stripe-auto.sh pk_test_... sk_test_... whsec_... [price_pro] [price_business] [price_enterprise]

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ $# -lt 3 ]; then
    echo -e "${RED}❌ Usage: $0 <publishable_key> <secret_key> <webhook_secret> [price_pro] [price_business] [price_enterprise]${NC}"
    echo ""
    echo "Exemple:"
    echo "  $0 pk_test_... sk_test_... whsec_... price_... price_... price_..."
    exit 1
fi

STRIPE_PUBLISHABLE_KEY=$1
STRIPE_SECRET_KEY=$2
STRIPE_WEBHOOK_SECRET=$3
STRIPE_PRICE_PRO=${4:-""}
STRIPE_PRICE_BUSINESS=${5:-""}
STRIPE_PRICE_ENTERPRISE=${6:-""}

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  💳 CONFIGURATION STRIPE AUTOMATIQUE${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI non installé${NC}"
    exit 1
fi

# Fonction pour configurer une variable
configure_var() {
    local project=$1
    local name=$2
    local env=$3
    local value=$4
    
    if [ -z "$value" ]; then
        return
    fi
    
    echo -e "${YELLOW}📝 ${name} (${env}) pour ${project}${NC}"
    cd "apps/${project}"
    echo "${value}" | vercel env add "${name}" "${env}" 2>&1 | grep -v "Retrieving\|project" || true
    cd ../..
    echo -e "${GREEN}✅ Configuré${NC}"
    echo ""
}

# Configurer pour chaque environnement
for env in production preview development; do
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Configuration ${env}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Frontend
    configure_var "frontend" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "${env}" "${STRIPE_PUBLISHABLE_KEY}"
    
    # Backend
    configure_var "backend" "STRIPE_SECRET_KEY" "${env}" "${STRIPE_SECRET_KEY}"
    configure_var "backend" "STRIPE_WEBHOOK_SECRET" "${env}" "${STRIPE_WEBHOOK_SECRET}"
    
    # Price IDs (si fournis)
    if [ -n "$STRIPE_PRICE_PRO" ]; then
        configure_var "backend" "STRIPE_PRICE_PRO" "${env}" "${STRIPE_PRICE_PRO}"
    fi
    if [ -n "$STRIPE_PRICE_BUSINESS" ]; then
        configure_var "backend" "STRIPE_PRICE_BUSINESS" "${env}" "${STRIPE_PRICE_BUSINESS}"
    fi
    if [ -n "$STRIPE_PRICE_ENTERPRISE" ]; then
        configure_var "backend" "STRIPE_PRICE_ENTERPRISE" "${env}" "${STRIPE_PRICE_ENTERPRISE}"
    fi
done

echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ CONFIGURATION STRIPE TERMINÉE !${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Variables configurées:${NC}"
echo "  ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (frontend)"
echo "  ✅ STRIPE_SECRET_KEY (backend)"
echo "  ✅ STRIPE_WEBHOOK_SECRET (backend)"
if [ -n "$STRIPE_PRICE_PRO" ]; then
    echo "  ✅ STRIPE_PRICE_PRO (backend)"
fi
if [ -n "$STRIPE_PRICE_BUSINESS" ]; then
    echo "  ✅ STRIPE_PRICE_BUSINESS (backend)"
fi
if [ -n "$STRIPE_PRICE_ENTERPRISE" ]; then
    echo "  ✅ STRIPE_PRICE_ENTERPRISE (backend)"
fi
echo ""
echo -e "${YELLOW}🔄 Prochaines étapes:${NC}"
echo "  1. Redéployez les projets sur Vercel"
echo "  2. Testez le checkout sur /dashboard/plans"
echo ""

