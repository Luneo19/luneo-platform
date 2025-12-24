#!/bin/bash

# Script de configuration complète Stripe
# Configure toutes les variables Stripe nécessaires

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  💳 CONFIGURATION STRIPE COMPLÈTE${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI non installé${NC}"
    echo "Installez: npm i -g vercel"
    exit 1
fi

# Vérifier connexion
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Non connecté à Vercel${NC}"
    echo "Connectez-vous: vercel login"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI prêt${NC}"
echo ""

echo -e "${YELLOW}📋 Instructions:${NC}"
echo "  1. Allez sur https://dashboard.stripe.com/apikeys"
echo "  2. Copiez votre Publishable Key (pk_test_... ou pk_live_...)"
echo "  3. Copiez votre Secret Key (sk_test_... ou sk_live_...)"
echo "  4. Allez sur https://dashboard.stripe.com/webhooks"
echo "  5. Créez un webhook endpoint pour: https://backend-luneos-projects.vercel.app/api/stripe/webhook"
echo "  6. Copiez le Webhook Secret (whsec_...)"
echo ""

read -p "Appuyez sur Entrée quand vous avez les clés..." 

# Fonction pour configurer une variable
configure_var() {
    local project=$1
    local name=$2
    local env=$3
    local description=$4
    local value=$5
    
    echo -e "${YELLOW}📝 Configuration: ${name} (${env}) pour ${project}${NC}"
    
    if [ -z "$value" ]; then
        echo -e "   ${description}"
        read -p "   Valeur: " value
    fi
    
    if [ -n "$value" ] && [ "$value" != "skip" ]; then
        cd "apps/${project}"
        echo "${value}" | vercel env add "${name}" "${env}" 2>&1 | grep -v "Retrieving\|project" || true
        cd ../..
        echo -e "  ${GREEN}✅ Configuré${NC}"
    else
        echo -e "  ${YELLOW}⏭️  Ignoré${NC}"
    fi
    echo ""
}

# Collecter les valeurs
echo -e "${BLUE}💳 Saisie des clés Stripe${NC}"
echo ""

read -p "Publishable Key (pk_test_... ou pk_live_...): " STRIPE_PUBLISHABLE_KEY
read -p "Secret Key (sk_test_... ou sk_live_...): " STRIPE_SECRET_KEY
read -p "Webhook Secret (whsec_...): " STRIPE_WEBHOOK_SECRET

echo ""
read -p "Avez-vous créé les Price IDs dans Stripe? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Price ID Pro Mensuel (price_...): " STRIPE_PRICE_PRO
    read -p "Price ID Business Mensuel (price_...): " STRIPE_PRICE_BUSINESS
    read -p "Price ID Enterprise Mensuel (price_...): " STRIPE_PRICE_ENTERPRISE
else
    echo -e "${YELLOW}⚠️  Vous devrez créer les Price IDs plus tard${NC}"
    STRIPE_PRICE_PRO=""
    STRIPE_PRICE_BUSINESS=""
    STRIPE_PRICE_ENTERPRISE=""
fi

echo ""
echo -e "${GREEN}🔧 Configuration en cours...${NC}"
echo ""

# Configurer pour chaque environnement
for env in production preview development; do
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Configuration ${env}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Frontend
    configure_var "frontend" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "${env}" "Clé publique Stripe" "${STRIPE_PUBLISHABLE_KEY}"
    
    # Backend
    configure_var "backend" "STRIPE_SECRET_KEY" "${env}" "Clé secrète Stripe" "${STRIPE_SECRET_KEY}"
    configure_var "backend" "STRIPE_WEBHOOK_SECRET" "${env}" "Secret webhook Stripe" "${STRIPE_WEBHOOK_SECRET}"
    
    # Price IDs (si fournis)
    if [ -n "$STRIPE_PRICE_PRO" ]; then
        configure_var "backend" "STRIPE_PRICE_PRO" "${env}" "Price ID Pro" "${STRIPE_PRICE_PRO}"
    fi
    if [ -n "$STRIPE_PRICE_BUSINESS" ]; then
        configure_var "backend" "STRIPE_PRICE_BUSINESS" "${env}" "Price ID Business" "${STRIPE_PRICE_BUSINESS}"
    fi
    if [ -n "$STRIPE_PRICE_ENTERPRISE" ]; then
        configure_var "backend" "STRIPE_PRICE_ENTERPRISE" "${env}" "Price ID Enterprise" "${STRIPE_PRICE_ENTERPRISE}"
    fi
done

echo ""
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
echo "  3. Utilisez la carte de test: 4242 4242 4242 4242"
echo ""
echo -e "${BLUE}📄 Guide complet: .github/GUIDE_STRIPE_COMPLET.md${NC}"
echo ""

