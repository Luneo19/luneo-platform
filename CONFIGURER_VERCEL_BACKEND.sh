#!/bin/bash

# Script pour configurer Vercel avec l'URL du backend Railway
set -e

echo "🔧 Configuration Vercel pour Backend Railway"
echo "==========================================="
echo ""

BACKEND_URL="https://backend-production-9178.up.railway.app"
API_URL="${BACKEND_URL}/api"

echo "📡 Backend URL: $BACKEND_URL"
echo "📡 API URL: $API_URL"
echo ""

echo "📋 Instructions pour configurer Vercel :"
echo ""
echo "1. Aller sur : https://vercel.com/dashboard"
echo "2. Sélectionner votre projet frontend"
echo "3. Settings → Environment Variables"
echo "4. Ajouter/Modifier cette variable :"
echo ""
echo "   Variable: NEXT_PUBLIC_API_URL"
echo "   Valeur: $API_URL"
echo "   Environnements: Production, Preview, Development"
echo ""
echo "5. Redéployer le frontend"
echo ""
echo "✅ Une fois configuré, le frontend sera connecté au backend !"
echo ""






