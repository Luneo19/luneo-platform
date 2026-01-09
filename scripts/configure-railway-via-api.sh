#!/bin/bash
# Script pour configurer Railway Service via API GraphQL

set -e

RAILWAY_TOKEN="${RAILWAY_TOKEN:-05658a48-024e-420d-b818-d2ef00fdd1f0}"
PROJECT_ID="0e3eb9ba-6846-4e0e-81d2-bd7da54da971"
SERVICE_ID="a82f89f4-464d-42ef-b3ee-05f53decc0f4"

echo "🔧 Configuration du service Railway via API GraphQL..."
echo ""

# Railway API GraphQL endpoint
RAILWAY_API="https://backboard.railway.app/graphql/v1"

# Note: Railway API nécessite des mutations spécifiques
# Pour l'instant, nous documentons la configuration requise

echo "⚠️  Railway API GraphQL nécessite des mutations complexes"
echo "   qui ne sont pas toujours publiquement documentées"
echo ""
echo "✅ SOLUTION RECOMMANDÉE: Configuration via Dashboard"
echo ""
echo "📋 Configuration requise dans Railway Dashboard:"
echo "   URL: https://railway.com/project/${PROJECT_ID}/service/${SERVICE_ID}/settings"
echo ""
echo "1. Section 'Source' → 'Root Directory':"
echo "   - Laissez VIDE (pas 'apps/backend')"
echo ""
echo "2. Section 'Build' → 'Builder':"
echo "   - Nixpacks"
echo ""
echo "3. Section 'Deploy' → 'Start Command':"
echo "   - cd apps/backend && node dist/src/main.js"
echo ""
echo "4. Cliquez sur 'Update'"






