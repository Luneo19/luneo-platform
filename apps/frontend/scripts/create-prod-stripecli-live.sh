#!/bin/bash
set -e

echo "🚀 Création produits Stripe PRODUCTION via Stripe CLI"
echo "====================================================="
echo ""

cd "$(dirname "$0")/../.."

# Forcer mode live
stripe config --set test_mode false 2>/dev/null || true

# Fonction pour extraire JSON
extract_json() {
  echo "$1" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['id'] if isinstance(data, dict) else data[0]['id'] if isinstance(data, list) and len(data) > 0 else '')" 2>/dev/null || echo "$1" | grep -o '"id": "[^"]*"' | head -1 | sed 's/.*"id": "\([^"]*\)".*/\1/'
}

# Professional
echo "📋 Professional"
PRO_PROD_JSON=$(stripe products create --name "Luneo Professional" --description "Pour les créateurs et PME" 2>&1)
PRO_PROD=$(extract_json "$PRO_PROD_JSON")
echo "   Produit: $PRO_PROD"

PRO_MONTHLY_JSON=$(stripe prices create --product "$PRO_PROD" --unit-amount 2900 --currency eur --recurring interval=month --nickname "professional-monthly" 2>&1)
PRO_MONTHLY=$(extract_json "$PRO_MONTHLY_JSON")

PRO_YEARLY_JSON=$(stripe prices create --product "$PRO_PROD" --unit-amount 27840 --currency eur --recurring interval=year --nickname "professional-yearly" 2>&1)
PRO_YEARLY=$(extract_json "$PRO_YEARLY_JSON")

echo "   Mensuel: $PRO_MONTHLY"
echo "   Annuel: $PRO_YEARLY"
echo ""

# Business  
echo "📋 Business"
BUS_PROD_JSON=$(stripe products create --name "Luneo Business" --description "Pour les équipes" 2>&1)
BUS_PROD=$(extract_json "$BUS_PROD_JSON")
echo "   Produit: $BUS_PROD"

BUS_MONTHLY_JSON=$(stripe prices create --product "$BUS_PROD" --unit-amount 9900 --currency eur --recurring interval=month --nickname "business-monthly" 2>&1)
BUS_MONTHLY=$(extract_json "$BUS_MONTHLY_JSON")

BUS_YEARLY_JSON=$(stripe prices create --product "$BUS_PROD" --unit-amount 95040 --currency eur --recurring interval=year --nickname "business-yearly" 2>&1)
BUS_YEARLY=$(extract_json "$BUS_YEARLY_JSON")

echo "   Mensuel: $BUS_MONTHLY"
echo "   Annuel: $BUS_YEARLY"
echo ""

echo "=============================================="
echo "📋 Variables PRODUCTION"
echo "=============================================="
echo ""
echo "STRIPE_PRODUCT_PROFESSIONAL=$PRO_PROD"
echo "STRIPE_PRICE_PROFESSIONAL_MONTHLY=$PRO_MONTHLY"
echo "STRIPE_PRICE_PROFESSIONAL_YEARLY=$PRO_YEARLY"
echo "STRIPE_PRODUCT_BUSINESS=$BUS_PROD"
echo "STRIPE_PRICE_BUSINESS_MONTHLY=$BUS_MONTHLY"
echo "STRIPE_PRICE_BUSINESS_YEARLY=$BUS_YEARLY"
