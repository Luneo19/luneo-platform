#!/bin/bash
# Script pour créer les produits Stripe en PRODUCTION avec Stripe CLI

set -e

STRIPE_KEY="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"

echo "🚀 Création des produits Stripe en PRODUCTION"
echo "=============================================="
echo ""

cd "$(dirname "$0")/../.."

# Créer Professional
echo "📋 Plan: Luneo Professional"
PRO_PROD=$(stripe products create \
  --api-key "$STRIPE_KEY" \
  --name "Luneo Professional" \
  --description "Pour les créateurs et PME qui veulent passer à la vitesse supérieure" \
  2>&1 | grep -o '"id": "prod_[^"]*"' | cut -d'"' -f4)

echo "   ✅ Produit: $PRO_PROD"

PRO_MONTHLY=$(stripe prices create \
  --api-key "$STRIPE_KEY" \
  --product "$PRO_PROD" \
  --unit-amount 2900 \
  --currency eur \
  --recurring interval=month \
  --nickname "professional-monthly" \
  2>&1 | grep -o '"id": "price_[^"]*"' | cut -d'"' -f4)

PRO_YEARLY=$(stripe prices create \
  --api-key "$STRIPE_KEY" \
  --product "$PRO_PROD" \
  --unit-amount 27840 \
  --currency eur \
  --recurring interval=year \
  --nickname "professional-yearly" \
  2>&1 | grep -o '"id": "price_[^"]*"' | cut -d'"' -f4)

echo "   ✅ Prix mensuel: $PRO_MONTHLY"
echo "   ✅ Prix annuel: $PRO_YEARLY"
echo ""

# Créer Business
echo "📋 Plan: Luneo Business"
BUS_PROD=$(stripe products create \
  --api-key "$STRIPE_KEY" \
  --name "Luneo Business" \
  --description "Pour les équipes qui ont besoin de collaboration et de volume" \
  2>&1 | grep -o '"id": "prod_[^"]*"' | cut -d'"' -f4)

echo "   ✅ Produit: $BUS_PROD"

BUS_MONTHLY=$(stripe prices create \
  --api-key "$STRIPE_KEY" \
  --product "$BUS_PROD" \
  --unit-amount 9900 \
  --currency eur \
  --recurring interval=month \
  --nickname "business-monthly" \
  2>&1 | grep -o '"id": "price_[^"]*"' | cut -d'"' -f4)

BUS_YEARLY=$(stripe prices create \
  --api-key "$STRIPE_KEY" \
  --product "$BUS_PROD" \
  --unit-amount 95040 \
  --currency eur \
  --recurring interval=year \
  --nickname "business-yearly" \
  2>&1 | grep -o '"id": "price_[^"]*"' | cut -d'"' -f4)

echo "   ✅ Prix mensuel: $BUS_MONTHLY"
echo "   ✅ Prix annuel: $BUS_YEARLY"
echo ""

echo "=============================================="
echo "📋 Variables d'environnement PRODUCTION"
echo "=============================================="
echo ""
echo "STRIPE_PRODUCT_PROFESSIONAL=$PRO_PROD"
echo "STRIPE_PRICE_PROFESSIONAL_MONTHLY=$PRO_MONTHLY"
echo "STRIPE_PRICE_PROFESSIONAL_YEARLY=$PRO_YEARLY"
echo "STRIPE_PRODUCT_BUSINESS=$BUS_PROD"
echo "STRIPE_PRICE_BUSINESS_MONTHLY=$BUS_MONTHLY"
echo "STRIPE_PRICE_BUSINESS_YEARLY=$BUS_YEARLY"
echo ""
echo "✅ Produits PRODUCTION créés !"
