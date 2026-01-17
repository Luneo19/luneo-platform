#!/bin/bash
# Script pour créer les produits Stripe en PRODUCTION via CLI

set -e

echo "🚀 Création des produits Stripe en PRODUCTION via CLI"
echo "======================================================"
echo ""

cd "$(dirname "$0")/../.."

# Vérifier que Stripe CLI est configuré
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI non installé"
    exit 1
fi

echo "✅ Stripe CLI détecté"
echo ""

# Créer les produits via Stripe CLI
echo "📦 Création des plans de base..."
echo ""

# Starter (gratuit - pas de prix)
echo "📋 Plan: Luneo Starter"
STARTER_PROD=$(stripe products create \
  --name "Luneo Starter" \
  --description "Parfait pour découvrir Luneo et créer vos premiers designs" \
  --metadata "plan_id=starter,type=subscription_plan,environment=production" \
  2>&1 | grep -o '"id": "prod_[^"]*"' | cut -d'"' -f4)

echo "   ✅ Produit: $STARTER_PROD"
echo ""

# Professional
echo "📋 Plan: Luneo Professional"
PRO_PROD=$(stripe products create \
  --name "Luneo Professional" \
  --description "Pour les créateurs et PME qui veulent passer à la vitesse supérieure" \
  --metadata "plan_id=professional,type=subscription_plan,environment=production" \
  2>&1 | grep -o '"id": "prod_[^"]*"' | cut -d'"' -f4)

PRO_MONTHLY=$(stripe prices create \
  --product "$PRO_PROD" \
  --unit-amount 2900 \
  --currency eur \
  --recurring interval=month \
  --nickname "professional-monthly" \
  --metadata "plan_id=professional,billing_cycle=monthly,environment=production" \
  2>&1 | grep -o '"id": "price_[^"]*"' | cut -d'"' -f4)

PRO_YEARLY=$(stripe prices create \
  --product "$PRO_PROD" \
  --unit-amount 27840 \
  --currency eur \
  --recurring interval=year \
  --nickname "professional-yearly" \
  --metadata "plan_id=professional,billing_cycle=yearly,environment=production" \
  2>&1 | grep -o '"id": "price_[^"]*"' | cut -d'"' -f4)

echo "   ✅ Produit: $PRO_PROD"
echo "   ✅ Prix mensuel: $PRO_MONTHLY (29€/mois)"
echo "   ✅ Prix annuel: $PRO_YEARLY (278.40€/an)"
echo ""

# Business
echo "📋 Plan: Luneo Business"
BUS_PROD=$(stripe products create \
  --name "Luneo Business" \
  --description "Pour les équipes qui ont besoin de collaboration et de volume" \
  --metadata "plan_id=business,type=subscription_plan,environment=production" \
  2>&1 | grep -o '"id": "prod_[^"]*"' | cut -d'"' -f4)

BUS_MONTHLY=$(stripe prices create \
  --product "$BUS_PROD" \
  --unit-amount 9900 \
  --currency eur \
  --recurring interval=month \
  --nickname "business-monthly" \
  --metadata "plan_id=business,billing_cycle=monthly,environment=production" \
  2>&1 | grep -o '"id": "price_[^"]*"' | cut -d'"' -f4)

BUS_YEARLY=$(stripe prices create \
  --product "$BUS_PROD" \
  --unit-amount 95040 \
  --currency eur \
  --recurring interval=year \
  --nickname "business-yearly" \
  --metadata "plan_id=business,billing_cycle=yearly,environment=production" \
  2>&1 | grep -o '"id": "price_[^"]*"' | cut -d'"' -f4)

echo "   ✅ Produit: $BUS_PROD"
echo "   ✅ Prix mensuel: $BUS_MONTHLY (99€/mois)"
echo "   ✅ Prix annuel: $BUS_YEARLY (950.40€/an)"
echo ""

# Afficher les variables
echo ""
echo "============================================================"
echo "📋 Variables d'environnement PRODUCTION"
echo "============================================================"
echo ""
echo "# Plans"
echo "STRIPE_PRODUCT_STARTER=$STARTER_PROD"
echo "STRIPE_PRODUCT_PROFESSIONAL=$PRO_PROD"
echo "STRIPE_PRICE_PROFESSIONAL_MONTHLY=$PRO_MONTHLY"
echo "STRIPE_PRICE_PROFESSIONAL_YEARLY=$PRO_YEARLY"
echo "STRIPE_PRODUCT_BUSINESS=$BUS_PROD"
echo "STRIPE_PRICE_BUSINESS_MONTHLY=$BUS_MONTHLY"
echo "STRIPE_PRICE_BUSINESS_YEARLY=$BUS_YEARLY"
echo ""
echo "✅ Produits PRODUCTION créés avec succès !"
