#!/bin/bash

# Script d'audit complet de toutes les pages
# Teste toutes les pages principales et identifie les erreurs

set -e

BASE_URL="${1:-https://luneo.app}"
echo "🔍 Audit complet des pages - Base URL: $BASE_URL"
echo ""

# Pages principales à tester
PAGES=(
  "/"
  "/pricing"
  "/about"
  "/solutions"
  "/integrations"
  "/industries"
  "/use-cases"
  "/help"
  "/contact"
  "/register"
  "/login"
  "/dashboard"
  "/api/health"
  "/api/public/marketing"
  "/api/public/plans"
)

ERRORS=0
SUCCESS=0

echo "📋 Test des pages principales..."
echo ""

for page in "${PAGES[@]}"; do
  url="${BASE_URL}${page}"
  echo -n "Testing $page... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1 || echo "000")
  
  if [ "$response" = "200" ] || [ "$response" = "301" ] || [ "$response" = "302" ]; then
    echo "✅ OK ($response)"
    ((SUCCESS++))
  else
    echo "❌ ERROR ($response)"
    ((ERRORS++))
    echo "   URL: $url"
  fi
done

echo ""
echo "📊 Résultats:"
echo "   ✅ Succès: $SUCCESS"
echo "   ❌ Erreurs: $ERRORS"
echo ""

# Test des APIs
echo "🔌 Test des APIs..."
echo ""

APIS=(
  "/api/health"
  "/api/public/marketing"
  "/api/public/plans"
)

for api in "${APIS[@]}"; do
  url="${BASE_URL}${api}"
  echo -n "Testing $api... "
  
  response=$(curl -s "$url" 2>&1)
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1 || echo "000")
  
  if [ "$http_code" = "200" ]; then
    # Vérifier que la réponse est du JSON valide
    if echo "$response" | jq . > /dev/null 2>&1; then
      echo "✅ OK (JSON valide)"
      ((SUCCESS++))
    else
      echo "⚠️  WARNING (HTTP 200 mais JSON invalide)"
      ((ERRORS++))
    fi
  else
    echo "❌ ERROR ($http_code)"
    ((ERRORS++))
  fi
done

echo ""
echo "📊 Résultats finaux:"
echo "   ✅ Succès: $SUCCESS"
echo "   ❌ Erreurs: $ERRORS"
echo ""

if [ $ERRORS -gt 0 ]; then
  echo "⚠️  Des erreurs ont été détectées!"
  exit 1
else
  echo "✅ Tous les tests sont passés!"
  exit 0
fi









