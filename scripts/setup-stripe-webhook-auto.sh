#!/bin/bash

# Script pour configurer automatiquement le webhook Stripe
# Utilise l'API Stripe pour créer le webhook et configurer Vercel

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}💳 CONFIGURATION AUTOMATIQUE STRIPE WEBHOOK${NC}"
echo "=================================================="
echo ""

# Vérifier Stripe CLI
if ! command -v stripe &> /dev/null; then
    echo -e "${YELLOW}⚠️  Stripe CLI non installé${NC}"
    echo ""
    echo "Installation:"
    echo "  macOS: brew install stripe/stripe-cli/stripe"
    echo "  Linux: https://stripe.com/docs/stripe-cli"
    echo ""
    echo "Ou utilisez l'API Stripe directement:"
    echo "  curl https://api.stripe.com/v1/webhook_endpoints \\"
    echo "    -u sk_live_...: \\"
    echo "    -d url=https://luneo.app/api/stripe/webhook \\"
    echo "    -d 'enabled_events[]=checkout.session.completed' \\"
    echo "    -d 'enabled_events[]=customer.subscription.created'"
    exit 1
fi

# Vérifier authentification Stripe
if ! stripe config --list &> /dev/null; then
    echo -e "${RED}❌ Stripe CLI non authentifié${NC}"
    echo "Exécutez: stripe login"
    exit 1
fi

# URL du webhook
WEBHOOK_URL="https://luneo.app/api/stripe/webhook"

# Événements à écouter
EVENTS=(
    "checkout.session.completed"
    "customer.subscription.created"
    "customer.subscription.updated"
    "customer.subscription.deleted"
    "invoice.payment_succeeded"
    "invoice.payment_failed"
    "payment_intent.succeeded"
    "payment_intent.payment_failed"
)

echo -e "${BLUE}📋 Configuration du webhook:${NC}"
echo "  URL: $WEBHOOK_URL"
echo "  Événements: ${#EVENTS[@]}"
echo ""

# Créer le webhook via Stripe CLI
echo -e "${BLUE}🔧 Création du webhook...${NC}"

# Construire la commande
STRIPE_CMD="stripe webhook_endpoints create"
STRIPE_CMD="$STRIPE_CMD --url=$WEBHOOK_URL"

for event in "${EVENTS[@]}"; do
    STRIPE_CMD="$STRIPE_CMD --enabled-event=$event"
done

# Exécuter la commande
WEBHOOK_OUTPUT=$(eval $STRIPE_CMD 2>&1) || {
    echo -e "${RED}❌ Erreur lors de la création du webhook${NC}"
    echo "$WEBHOOK_OUTPUT"
    exit 1
}

# Extraire le webhook secret
WEBHOOK_SECRET=$(echo "$WEBHOOK_OUTPUT" | grep -o "whsec_[a-zA-Z0-9]*" | head -1)

if [ -z "$WEBHOOK_SECRET" ]; then
    echo -e "${YELLOW}⚠️  Webhook secret non trouvé dans la sortie${NC}"
    echo "Sortie: $WEBHOOK_OUTPUT"
    echo ""
    echo -e "${YELLOW}📝 Veuillez copier manuellement le webhook secret depuis:${NC}"
    echo "https://dashboard.stripe.com/webhooks"
else
    echo -e "${GREEN}✅ Webhook créé avec succès${NC}"
    echo -e "${GREEN}✅ Secret: ${WEBHOOK_SECRET:0:20}...${NC}"
    
    # Ajouter le secret à Vercel
    echo ""
    echo -e "${BLUE}🔐 Ajout du secret à Vercel...${NC}"
    
    if vercel env add STRIPE_WEBHOOK_SECRET production --scope luneos-projects <<< "$WEBHOOK_SECRET" 2>&1 | grep -q "Added"; then
        echo -e "${GREEN}✅ Secret ajouté à Vercel (Production)${NC}"
    else
        echo -e "${YELLOW}⚠️  Ajout manuel requis:${NC}"
        echo "  vercel env add STRIPE_WEBHOOK_SECRET production"
        echo "  (Collez: $WEBHOOK_SECRET)"
    fi
    
    # Ajouter aussi pour Preview et Development
    echo "$WEBHOOK_SECRET" | vercel env add STRIPE_WEBHOOK_SECRET preview --scope luneos-projects 2>&1 | grep -q "Added" && echo -e "${GREEN}✅ Secret ajouté (Preview)${NC}" || true
    echo "$WEBHOOK_SECRET" | vercel env add STRIPE_WEBHOOK_SECRET development --scope luneos-projects 2>&1 | grep -q "Added" && echo -e "${GREEN}✅ Secret ajouté (Development)${NC}" || true
fi

echo ""
echo -e "${GREEN}🎉 Configuration Stripe webhook terminée !${NC}"
echo ""
echo -e "${BLUE}📝 Prochaines étapes:${NC}"
echo "1. Redéployer: cd apps/frontend && vercel --prod"
echo "2. Tester le webhook: stripe trigger checkout.session.completed"

