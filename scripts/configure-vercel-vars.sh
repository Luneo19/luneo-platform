#!/bin/bash

# Script pour configurer toutes les variables Vercel nécessaires
# Usage: ./scripts/configure-vercel-vars.sh [BACKEND_URL]

set -e

BACKEND_URL="${1:-https://your-backend.railway.app}"

echo "🔐 CONFIGURATION VARIABLES VERCEL"
echo "=================================="
echo ""

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI non installé"
    echo "Installation: npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLI détecté"
echo ""

# Vérifier connexion
if ! vercel whoami &> /dev/null; then
    echo "❌ Non connecté à Vercel"
    echo "Connexion: vercel login"
    exit 1
fi

echo "✅ Connecté à Vercel"
echo ""

# Variables obligatoires
echo "📋 Configuration variables..."
echo ""

# Backend URL
read -p "NEXT_PUBLIC_API_URL [$BACKEND_URL]: " API_URL
API_URL="${API_URL:-$BACKEND_URL}"

vercel env add NEXT_PUBLIC_API_URL production <<< "$API_URL" || echo "Variable déjà configurée"
vercel env add NEXT_PUBLIC_API_URL preview <<< "$API_URL" || echo "Variable déjà configurée"
vercel env add NEXT_PUBLIC_API_URL development <<< "$API_URL" || echo "Variable déjà configurée"

echo "✅ NEXT_PUBLIC_API_URL configuré: $API_URL"

# Frontend URL
read -p "NEXT_PUBLIC_APP_URL: " APP_URL
if [ -n "$APP_URL" ]; then
    vercel env add NEXT_PUBLIC_APP_URL production <<< "$APP_URL" || echo "Variable déjà configurée"
    vercel env add NEXT_PUBLIC_APP_URL preview <<< "$APP_URL" || echo "Variable déjà configurée"
    vercel env add NEXT_PUBLIC_APP_URL development <<< "$APP_URL" || echo "Variable déjà configurée"
    echo "✅ NEXT_PUBLIC_APP_URL configuré: $APP_URL"
fi

echo ""
echo "✅ Variables Vercel configurées!"
echo ""
echo "📋 Variables configurées:"
vercel env ls | grep -E "(NEXT_PUBLIC_API_URL|NEXT_PUBLIC_APP_URL)" || echo "Aucune variable trouvée"
