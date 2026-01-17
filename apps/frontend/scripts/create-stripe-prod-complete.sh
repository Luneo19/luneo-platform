#!/bin/bash
set -e

echo "🚀 Création complète des produits Stripe PRODUCTION"
echo "==================================================="
echo ""

cd "$(dirname "$0")/../.."

# Forcer mode live
stripe config --set test_mode false 2>/dev/null || true

RESULTS_FILE="/tmp/stripe_prod_results.txt"
> "$RESULTS_FILE"

# Professional
echo "📋 Professional"
PRO_JSON=$(stripe products create --name "Luneo Professional" --description "Pour les créateurs et PME" 2>&1)
PRO_ID=$(echo "$PRO_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "$PRO_JSON" | grep -o '"id": "prod_[^"]*"' | head -1 | sed 's/.*"id": "\([^"]*\)".*/\1/')
echo "   ✅ Produit: $PRO_ID"

PRO_M_JSON=$(stripe prices create --product "$PRO_ID" --unit-amount 2900 --currency eur --recurring interval=month --nickname "professional-monthly" 2>&1)
PRO_M_ID=$(echo "$PRO_M_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "$PRO_M_JSON" | grep -o '"id": "price_[^"]*"' | head -1 | sed 's/.*"id": "\([^"]*\)".*/\1/')
echo "   ✅ Mensuel: $PRO_M_ID"

PRO_Y_JSON=$(stripe prices create --product "$PRO_ID" --unit-amount 27840 --currency eur --recurring interval=year --nickname "professional-yearly" 2>&1)
PRO_Y_ID=$(echo "$PRO_Y_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "$PRO_Y_JSON" | grep -o '"id": "price_[^"]*"' | head -1 | sed 's/.*"id": "\([^"]*\)".*/\1/')
echo "   ✅ Annuel: $PRO_Y_ID"
echo ""

# Business
echo "📋 Business"
BUS_JSON=$(stripe products create --name "Luneo Business" --description "Pour les équipes" 2>&1)
BUS_ID=$(echo "$BUS_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "$BUS_JSON" | grep -o '"id": "prod_[^"]*"' | head -1 | sed 's/.*"id": "\([^"]*\)".*/\1/')
echo "   ✅ Produit: $BUS_ID"

BUS_M_JSON=$(stripe prices create --product "$BUS_ID" --unit-amount 9900 --currency eur --recurring interval=month --nickname "business-monthly" 2>&1)
BUS_M_ID=$(echo "$BUS_M_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "$BUS_M_JSON" | grep -o '"id": "price_[^"]*"' | head -1 | sed 's/.*"id": "\([^"]*\)".*/\1/')
echo "   ✅ Mensuel: $BUS_M_ID"

BUS_Y_JSON=$(stripe prices create --product "$BUS_ID" --unit-amount 95040 --currency eur --recurring interval=year --nickname "business-yearly" 2>&1)
BUS_Y_ID=$(echo "$BUS_Y_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "$BUS_Y_JSON" | grep -o '"id": "price_[^"]*"' | head -1 | sed 's/.*"id": "\([^"]*\)".*/\1/')
echo "   ✅ Annuel: $BUS_Y_ID"
echo ""

# Add-ons
echo "🎁 Add-ons"
ADDONS=(
  "extra-designs:Designs supplémentaires:Pack de 100 designs:2000:19200"
  "extra-storage:Stockage supplémentaire:100 GB:500:4800"
  "extra-team-members:Membres d'équipe supplémentaires:10 membres:1000:9600"
  "extra-api-calls:API calls supplémentaires:50K appels:1500:14400"
  "extra-renders-3d:Rendus 3D supplémentaires:50 rendus:2500:24000"
)

for addon in "${ADDONS[@]}"; do
  IFS=':' read -r id name desc monthly yearly <<< "$addon"
  echo "   📦 $name"
  
  PROD_JSON=$(stripe products create --name "$name" --description "$desc" 2>&1)
  PROD_ID=$(echo "$PROD_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "$PROD_JSON" | grep -o '"id": "prod_[^"]*"' | head -1 | sed 's/.*"id": "\([^"]*\)".*/\1/')
  
  M_JSON=$(stripe prices create --product "$PROD_ID" --unit-amount "$monthly" --currency eur --recurring interval=month --nickname "${id}-monthly" 2>&1)
  M_ID=$(echo "$M_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "$M_JSON" | grep -o '"id": "price_[^"]*"' | head -1 | sed 's/.*"id": "\([^"]*\)".*/\1/')
  
  Y_JSON=$(stripe prices create --product "$PROD_ID" --unit-amount "$yearly" --currency eur --recurring interval=year --nickname "${id}-yearly" 2>&1)
  Y_ID=$(echo "$Y_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "$Y_JSON" | grep -o '"id": "price_[^"]*"' | head -1 | sed 's/.*"id": "\([^"]*\)".*/\1/')
  
  echo "      ✅ Produit: $PROD_ID"
  echo "      ✅ Mensuel: $M_ID"
  echo "      ✅ Annuel: $Y_ID"
  echo ""
  
  echo "${id}|${PROD_ID}|${M_ID}|${Y_ID}" >> "$RESULTS_FILE"
done

# Résumé
echo "=============================================="
echo "📋 Variables PRODUCTION"
echo "=============================================="
echo ""
echo "STRIPE_PRODUCT_PROFESSIONAL=$PRO_ID"
echo "STRIPE_PRICE_PROFESSIONAL_MONTHLY=$PRO_M_ID"
echo "STRIPE_PRICE_PROFESSIONAL_YEARLY=$PRO_Y_ID"
echo "STRIPE_PRODUCT_BUSINESS=$BUS_ID"
echo "STRIPE_PRICE_BUSINESS_MONTHLY=$BUS_M_ID"
echo "STRIPE_PRICE_BUSINESS_YEARLY=$BUS_Y_ID"
echo ""

while IFS='|' read -r id prod_id m_id y_id; do
  up=$(echo "$id" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
  echo "STRIPE_ADDON_${up}_PRODUCT_ID=$prod_id"
  echo "STRIPE_ADDON_${up}_MONTHLY=$m_id"
  echo "STRIPE_ADDON_${up}_YEARLY=$y_id"
  echo ""
done < "$RESULTS_FILE"

echo "✅ Produits PRODUCTION créés avec succès !"
