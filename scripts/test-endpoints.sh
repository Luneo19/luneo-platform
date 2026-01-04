#!/bin/bash

# Script pour tester les endpoints widget API
# Usage: ./scripts/test-endpoints.sh [API_URL] [API_KEY]

set -e

API_URL=${1:-"http://localhost:3001"}
API_KEY=${2:-"test-api-key"}

echo "🧪 Test des Endpoints Widget API"
echo "=================================="
echo ""
echo "API URL: $API_URL"
echo "API Key: $API_KEY"
echo ""

# Fonction pour tester un endpoint
test_endpoint() {
    local METHOD=$1
    local ENDPOINT=$2
    local DATA=$3
    local DESCRIPTION=$4
    
    echo "📡 Test: $DESCRIPTION"
    echo "   $METHOD $ENDPOINT"
    
    if [ "$METHOD" = "GET" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" \
            -X GET \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            "$API_URL$ENDPOINT" 2>&1)
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" \
            -X "$METHOD" \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            -d "$DATA" \
            "$API_URL$ENDPOINT" 2>&1)
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
        echo "   ✅ Succès ($HTTP_CODE)"
        echo "   Réponse: $(echo "$BODY" | head -c 200)..."
    elif [ "$HTTP_CODE" -eq 404 ]; then
        echo "   ⚠️  Not Found ($HTTP_CODE) - Endpoint peut-être non déployé"
    elif [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
        echo "   ⚠️  Unauthorized ($HTTP_CODE) - Vérifier API Key"
    else
        echo "   ❌ Erreur ($HTTP_CODE)"
        echo "   Réponse: $BODY"
    fi
    echo ""
}

# Test Health Check
test_endpoint "GET" "/api/v1/health" "" "Health Check"

# Test Widget Product Config
test_endpoint "GET" "/api/widget/products/demo-product-123" "" "Get Product Config"

# Test Widget Save Design
DESIGN_DATA='{
  "productId": "demo-product-123",
  "designData": {
    "id": "test-design-123",
    "productId": "demo-product-123",
    "canvas": {
      "width": 800,
      "height": 600,
      "backgroundColor": "#ffffff"
    },
    "layers": [
      {
        "id": "layer-1",
        "type": "text",
        "position": { "x": 100, "y": 100 },
        "rotation": 0,
        "scale": { "x": 1, "y": 1 },
        "opacity": 1,
        "visible": true,
        "locked": false,
        "data": {
          "content": "Test Design",
          "fontFamily": "Arial",
          "fontSize": 24,
          "color": "#000000"
        }
      }
    ],
    "metadata": {
      "createdAt": "2024-12-19T00:00:00Z",
      "updatedAt": "2024-12-19T00:00:00Z"
    }
  }
}'

test_endpoint "POST" "/api/widget/designs" "$DESIGN_DATA" "Save Design"

# Test Widget Load Design
test_endpoint "GET" "/api/widget/designs/test-design-123" "" "Load Design"

# Test Render Print-Ready
RENDER_DATA='{
  "designId": "test-design-123",
  "productId": "demo-product-123",
  "width": 210,
  "height": 297,
  "dpi": 300,
  "format": "png"
}'

test_endpoint "POST" "/render/print-ready" "$RENDER_DATA" "Render Print-Ready"

echo "✅ Tests terminés"
echo ""
echo "📋 Résumé:"
echo "   - Health Check: Vérifie que l'API répond"
echo "   - Widget Product Config: Récupère la config produit"
echo "   - Widget Save Design: Sauvegarde un design"
echo "   - Widget Load Design: Charge un design"
echo "   - Render Print-Ready: Génère un rendu"


