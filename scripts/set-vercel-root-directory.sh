#!/bin/bash

# Script pour configurer le Root Directory Vercel via API
PROJECT_ID="prj_lGBYTHVcIQqZdP1ZFfiqziWhPSo9"
TEAM_ID="team_hEYzAnyaxsCQkF2sJqEzWKS9"
ROOT_DIRECTORY="apps/frontend"

# Vérifier si le token Vercel est disponible
if [ -z "$VERCEL_TOKEN" ]; then
    echo "⚠️  VERCEL_TOKEN non défini. Veuillez l'exporter:"
    echo "   export VERCEL_TOKEN='votre_token'"
    exit 1
fi

echo "🔧 Configuration du Root Directory pour le projet Vercel..."
echo "   Project ID: $PROJECT_ID"
echo "   Root Directory: $ROOT_DIRECTORY"

# Mettre à jour le projet via l'API Vercel
curl -X PATCH "https://api.vercel.com/v9/projects/$PROJECT_ID?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"rootDirectory\": \"$ROOT_DIRECTORY\"}" \
  | jq '.' || echo "Erreur lors de la configuration"

echo "✅ Configuration terminée"
