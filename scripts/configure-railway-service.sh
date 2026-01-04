#!/bin/bash
# Script pour configurer Railway Service via API GraphQL

RAILWAY_TOKEN="${RAILWAY_TOKEN:-05658a48-024e-420d-b818-d2ef00fdd1f0}"
PROJECT_ID="0e3eb9ba-6846-4e0e-81d2-bd7da54da971"
SERVICE_ID="a82f89f4-464d-42ef-b3ee-05f53decc0f4"

echo "🔧 Configuration du service Railway via API..."

# Note: Railway API GraphQL nécessite des mutations spécifiques
# qui ne sont pas toujours documentées publiquement

echo "⚠️  Railway CLI/API ne permet pas de configurer Root Directory directement"
echo ""
echo "✅ Solution: Configuration manuelle requise dans Dashboard"
echo ""
echo "Ou utilisation de railway.toml avec configuration as code"

