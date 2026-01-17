#!/bin/bash
# Script pour créer les produits Stripe en PRODUCTION via Stripe CLI

set -e

echo "🚀 Création des produits Stripe en PRODUCTION via Stripe CLI"
echo "============================================================"
echo ""

cd "$(dirname "$0")/../.."

# S'assurer qu'on est en mode live
stripe config --set test_mode false 2>/dev/null || true

# Créer Professional
echo "📋 Plan: Luneo Professional"
PRO_OUTPUT=$(stripe products create \
  --name "Luneo Professional" \
  --description "Pour les créateurs et PME qui veulent passer à la vitesse supérieure" \
  2>&1)

PRO_PROD=$(echo "$PRO_OUTPUT" | grep -o '"id": "prod_[^"]*"' | head -1 | cut -d'"' -f4)
echo "$PRO_OUTPUT" | grep -E "(id|name|created)" | head -5

PRO_MONTHLY_OUTPUT=$(stripe prices create \
  --product "$PRO_PROD" \
  --unit-amount 2900 \
  --currency eur \
  --recurring interval=month \
  --nickname "professional-monthly" \
  2>&1)

PRO_MONTHLY=$(echo "$PRO_MONTHLY_OUTPUT" | grep -o '"id": "price_[^"]*"' | cut -d'"' -f4)
echo "   ✅ Prix mensuel: $PRO_MONTHLY"

PRO_YEARLY_OUTPUT=$(stripe prices create \
  --product "$PRO_PROD" \
  --unit-amount 27840 \
  --currency eur \
  --recurring interval=year \
  --nickname "professional-yearly" \
  2>&1)

PRO_YEARLY=$(echo "$PRO_YEARLY_OUTPUT" | grep -o '"id": "price_[^"]*"' | cut -d'"' -f4)
echo "   ✅ Prix annuel: $PRO_YEARLY"
echo ""

# Créer Business
echo "📋 Plan: Luneo Business"
BUS_OUTPUT=$(stripe products create \
  --name "Luneo Business" \
  --description "Pour les équipes qui ont besoin de collaboration et de volume" \
  2>&1)

BUS_PROD=$(echo "$BUS_OUTPUT" | grep -o '"id": "prod_[^"]*"' | head -1 | cut -d'"' -f4)
echo "$BUS_OUTPUT" | grep -E "(id|name|created)" | head -5

BUS_MONTHLY_OUTPUT=$(stripe prices create \
  --product "$BUS_PROD" \
  --unit-amount 9900 \
  --currency eur \
  --recurring interval=month \
  --nickname "business-monthly" \
  2>&1)

BUS_MONTHLY=$(echo "$BUS_MONTHLY_OUTPUT" | grep -o '"id": "price_[^"]*"' | cut -d'"' -f4)
echo "   ✅ Prix mensuel: $BUS_MONTHLY"

BUS_YEARLY_OUTPUT=$(stripe prices create \
  --product "$BUS_PROD" \
  --unit-amount 95040 \
  --currency eur \
  --recurring interval=year \
  --nickname "business-yearly" \
  2>&1)

BUS_YEARLY=$(echo "$BUS_YEARLY_OUTPUT" | grep -o '"id": "price_[^"]*"' | cut -d'"' -f4)
echo "   ✅ Prix annuel: $BUS_YEARLY"
echo ""

echo "============================================================"
echo "📋 Variables d'environnement PRODUCTION"
echo "============================================================"
echo ""
echo "STRIPE_PRODUCT_PROFESSIONAL=$PRO_PROD"
echo "STRIPE_PRICE_PROFESSIONAL_MONTHLY=$PRO_MONTHLY"
echo "STRIPE_PRICE_PROFESSIONAL_YEARLY=$PRO_YEARLY"
echo "STRIPE_PRODUCT_BUSINESS=$BUS_PROD"
echo "STRIPE_PRICE_BUSINESS_MONTHLY=$BUS_MONTHLY"
echo "STRIPE_PRICE_BUSINESS_YEARLY=$BUS_YEARLY"
echo ""
echo "✅ Produits PRODUCTION créés !"
