#!/bin/bash
set -e

# Script pour déployer via API Vercel
# Utilise l'API Vercel pour déclencher un déploiement depuis la branche Git

PROJECT_ID="prj_eQ4hMNnXDLlNmsmkfKDSkCdlNQr2"
TEAM_ID="team_hEYzAnyaxsCQkF2sJqEzWKS9"
BRANCH="main"

echo "🚀 Déploiement via API Vercel..."

# Obtenir le token Vercel
if [ -z "$VERCEL_TOKEN" ]; then
  echo "⚠️  VERCEL_TOKEN non défini"
  echo "Pour obtenir votre token:"
  echo "  1. Aller sur: https://vercel.com/account/tokens"
  echo "  2. Créer un nouveau token"
  echo "  3. Exécuter: export VERCEL_TOKEN=votre-token"
  exit 1
fi

# Déclencher un déploiement
echo "📦 Déclenchement du déploiement depuis la branche $BRANCH..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://api.vercel.com/v13/deployments?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"luneo-frontend\",
    \"project\": \"$PROJECT_ID\",
    \"target\": \"production\",
    \"gitSource\": {
      \"type\": \"github\",
      \"repo\": \"Luneo19/luneo-platform\",
      \"ref\": \"$BRANCH\"
    }
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Déploiement déclenché avec succès !"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
  echo "⚠️  Erreur HTTP: $HTTP_CODE"
  echo "$BODY"
fi












