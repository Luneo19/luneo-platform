#!/bin/bash

# Script de test des routes API créées
# Usage: ./scripts/test-api-routes.sh

BASE_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3001/api}"
TOKEN="${TEST_TOKEN:-}"

echo "🧪 Test des routes API créées"
echo "================================"
echo ""

# Fonction pour tester une route
test_route() {
  local method=$1
  local endpoint=$2
  local description=$3
  local data=$4
  
  echo "Testing: $method $endpoint - $description"
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
  elif [ "$method" = "POST" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data")
  elif [ "$method" = "PUT" ]; then
    response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data")
  elif [ "$method" = "DELETE" ]; then
    response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo "  ✅ Success ($http_code)"
  elif [ "$http_code" -eq 401 ]; then
    echo "  ⚠️  Unauthorized (401) - Token manquant ou invalide"
  elif [ "$http_code" -eq 404 ]; then
    echo "  ⚠️  Not Found (404) - Route peut-être non implémentée"
  else
    echo "  ❌ Error ($http_code)"
    echo "  Response: $body"
  fi
  echo ""
}

# Routes à tester (GET uniquement pour éviter les effets de bord)
echo "📋 Routes Support:"
test_route "GET" "/support/tickets" "Liste des tickets"
test_route "GET" "/support/knowledge-base/articles" "Liste des articles KB"

echo "📋 Routes Collections:"
test_route "GET" "/collections" "Liste des collections"

echo "📋 Routes Team:"
test_route "GET" "/team/members" "Liste des membres"

echo "📋 Routes Favorites:"
test_route "GET" "/favorites" "Liste des favoris"

echo "📋 Routes Cliparts:"
test_route "GET" "/cliparts" "Liste des cliparts"

echo "📋 Routes Designs:"
test_route "GET" "/designs" "Liste des designs"

echo "📋 Routes Notifications:"
test_route "GET" "/notifications" "Liste des notifications"

echo "📋 Routes Referral:"
test_route "GET" "/referral/stats" "Statistiques referral"

echo "📋 Routes Analytics:"
test_route "GET" "/analytics/dashboard" "Dashboard analytics"
test_route "GET" "/analytics/web-vitals" "Web vitals"

echo "📋 Routes Users:"
test_route "GET" "/users/me" "Profil utilisateur"
test_route "GET" "/users/me/sessions" "Sessions utilisateur"

echo ""
echo "✅ Tests terminés"
echo ""
echo "Note: Pour tester avec un token valide, définissez TEST_TOKEN=your_token"
