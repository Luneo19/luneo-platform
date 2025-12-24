#!/bin/bash

# Script pour configurer Stripe et OpenAI dans Vercel
# Usage: ./scripts/configure-stripe-openai.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  💳 Configuration Stripe et OpenAI${NC}"
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
    local description=$4
    
    echo -e "${YELLOW}📝 Configuration: ${name} (${env}) pour ${project}${NC}"
    echo -e "   ${description}"
    read -p "   Valeur (ou 'skip' pour ignorer): " value
    
    if [ "$value" != "skip" ] && [ -n "$value" ]; then
        cd "apps/${project}"
        echo "${value}" | vercel env add "${name}" "${env}" 2>&1 | grep -v "Retrieving\|project" || true
        cd ../..
        echo -e "  ${GREEN}✅ Configuré${NC}"
    else
        echo -e "  ${YELLOW}⏭️  Ignoré${NC}"
    fi
    echo ""
}

echo -e "${GREEN}💳 Configuration Stripe${NC}"
echo ""

# Stripe Frontend
echo -e "${BLUE}Frontend (Stripe Publishable Key)${NC}"
configure_var "frontend" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "production" "Clé publique Stripe (pk_test_... ou pk_live_...)"

# Stripe Backend
echo -e "${BLUE}Backend (Stripe Secret Key)${NC}"
configure_var "backend" "STRIPE_SECRET_KEY" "production" "Clé secrète Stripe (sk_test_... ou sk_live_...)"

echo -e "${BLUE}Backend (Stripe Webhook Secret)${NC}"
configure_var "backend" "STRIPE_WEBHOOK_SECRET" "production" "Secret webhook Stripe (whsec_...)"

# Répéter pour preview et development
read -p "Configurer aussi pour preview et development? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    configure_var "frontend" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "preview" "Clé publique Stripe (preview)"
    configure_var "backend" "STRIPE_SECRET_KEY" "preview" "Clé secrète Stripe (preview)"
    configure_var "backend" "STRIPE_WEBHOOK_SECRET" "preview" "Secret webhook Stripe (preview)"
    
    configure_var "frontend" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "development" "Clé publique Stripe (dev)"
    configure_var "backend" "STRIPE_SECRET_KEY" "development" "Clé secrète Stripe (dev)"
    configure_var "backend" "STRIPE_WEBHOOK_SECRET" "development" "Secret webhook Stripe (dev)"
fi

echo ""
echo -e "${GREEN}🤖 Configuration OpenAI${NC}"
echo ""

configure_var "backend" "OPENAI_API_KEY" "production" "Clé API OpenAI (sk-...)"

read -p "Configurer aussi pour preview et development? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    configure_var "backend" "OPENAI_API_KEY" "preview" "Clé API OpenAI (preview)"
    configure_var "backend" "OPENAI_API_KEY" "development" "Clé API OpenAI (dev)"
fi

echo ""
echo -e "${GREEN}✅ Configuration terminée !${NC}"
echo ""
echo -e "${YELLOW}📋 Prochaines étapes:${NC}"
echo "  1. Redéployez les projets sur Vercel"
echo "  2. Testez le billing checkout"
echo "  3. Testez la génération AI"
echo ""

