#!/bin/bash

# Script d'automatisation complète pour production
# Configure tout automatiquement via CLI et API

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 AUTOMATISATION COMPLÈTE PRODUCTION - LUNEO${NC}"
echo "=================================================="
echo ""

# Vérifications préalables
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 n'est pas installé${NC}"
        return 1
    fi
    return 0
}

# 1. Vérifier Vercel CLI
echo -e "${BLUE}📋 1. VÉRIFICATION DES OUTILS${NC}"
if ! check_command vercel; then
    echo "Installation: npm i -g vercel"
    exit 1
fi

# Vérifier authentification Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Vercel non authentifié${NC}"
    echo "Exécutez: vercel login"
    exit 1
fi

VERCEL_USER=$(vercel whoami 2>/dev/null | head -1)
echo -e "${GREEN}✅ Vercel CLI: $VERCEL_USER${NC}"

# 2. Vérifier les variables d'environnement critiques
echo ""
echo -e "${BLUE}🔐 2. VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT${NC}"

PROJECT_NAME="luneo-frontend"
SCOPE="luneos-projects"

# Variables critiques à vérifier
CRITICAL_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "NEXT_PUBLIC_APP_URL"
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
    "UPSTASH_REDIS_REST_URL"
    "UPSTASH_REDIS_REST_TOKEN"
)

MISSING_VARS=()

for var in "${CRITICAL_VARS[@]}"; do
    if vercel env ls --scope $SCOPE 2>/dev/null | grep -q "$var"; then
        echo -e "${GREEN}✅ $var${NC}"
    else
        echo -e "${YELLOW}⚠️  $var manquante${NC}"
        MISSING_VARS+=("$var")
    fi
done

# 3. Configuration Stripe Webhook
echo ""
echo -e "${BLUE}💳 3. CONFIGURATION STRIPE WEBHOOK${NC}"

# Vérifier si Stripe CLI est installé
if command -v stripe &> /dev/null; then
    echo -e "${GREEN}✅ Stripe CLI détecté${NC}"
    
    # Vérifier si webhook secret existe déjà
    if vercel env ls --scope $SCOPE 2>/dev/null | grep -q "STRIPE_WEBHOOK_SECRET"; then
        echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET déjà configuré${NC}"
    else
        echo -e "${YELLOW}⚠️  STRIPE_WEBHOOK_SECRET manquant${NC}"
        echo ""
        echo -e "${YELLOW}📝 Pour configurer le webhook Stripe:${NC}"
        echo "1. Allez sur: https://dashboard.stripe.com/webhooks"
        echo "2. Créez un endpoint: https://luneo.app/api/stripe/webhook"
        echo "3. Sélectionnez les événements:"
        echo "   - checkout.session.completed"
        echo "   - customer.subscription.created"
        echo "   - customer.subscription.updated"
        echo "   - customer.subscription.deleted"
        echo "   - invoice.payment_succeeded"
        echo "   - invoice.payment_failed"
        echo "4. Copiez le webhook secret (whsec_...)"
        echo "5. Exécutez: vercel env add STRIPE_WEBHOOK_SECRET production"
    fi
else
    echo -e "${YELLOW}⚠️  Stripe CLI non installé${NC}"
    echo "Installation optionnelle: brew install stripe/stripe-cli/stripe"
    echo ""
    echo -e "${YELLOW}📝 Configuration manuelle du webhook:${NC}"
    echo "URL: https://dashboard.stripe.com/webhooks"
fi

# 4. Test des endpoints critiques
echo ""
echo -e "${BLUE}🧪 4. TESTS DES ENDPOINTS CRITIQUES${NC}"

PROD_URL="https://luneo.app"

# Test health check
echo -n "Health check... "
HEALTH_RESPONSE=$(curl -s "$PROD_URL/api/health" 2>/dev/null || echo "ERROR")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${YELLOW}⚠️  Réponse: ${HEALTH_RESPONSE:0:50}...${NC}"
fi

# Test site principal
echo -n "Site principal... "
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" 2>/dev/null || echo "000")
if [ "$SITE_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ OK (HTTP $SITE_STATUS)${NC}"
else
    echo -e "${YELLOW}⚠️  HTTP $SITE_STATUS${NC}"
fi

# 5. Vérification des déploiements
echo ""
echo -e "${BLUE}🚀 5. VÉRIFICATION DES DÉPLOIEMENTS${NC}"

LATEST_DEPLOY=$(vercel ls --scope $SCOPE 2>/dev/null | grep "Ready" | head -1 | awk '{print $NF}')
if [ -n "$LATEST_DEPLOY" ]; then
    echo -e "${GREEN}✅ Dernier déploiement: $LATEST_DEPLOY${NC}"
else
    echo -e "${YELLOW}⚠️  Aucun déploiement récent trouvé${NC}"
fi

# 6. Résumé et actions restantes
echo ""
echo -e "${BLUE}📊 RÉSUMÉ${NC}"
echo "=================================================="

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ Toutes les variables critiques sont configurées${NC}"
else
    echo -e "${YELLOW}⚠️  Variables manquantes: ${#MISSING_VARS[@]}${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
fi

echo ""
echo -e "${BLUE}🎯 ACTIONS RESTANTES${NC}"

if vercel env ls --scope $SCOPE 2>/dev/null | grep -q "STRIPE_WEBHOOK_SECRET"; then
    echo -e "${GREEN}✅ Stripe webhook configuré${NC}"
else
    echo -e "${YELLOW}⚠️  Configurer Stripe webhook (voir instructions ci-dessus)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Automatisation terminée !${NC}"
echo ""
echo -e "${BLUE}📝 Prochaines étapes:${NC}"
echo "1. Configurer Stripe webhook si nécessaire"
echo "2. Tester les fonctionnalités critiques manuellement"
echo "3. Configurer monitoring (Sentry, Vercel Analytics)"

