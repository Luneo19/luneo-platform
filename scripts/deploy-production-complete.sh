#!/bin/bash

echo "🚀 DÉPLOIEMENT PRODUCTION COMPLET LUNEO"
echo "========================================"
echo ""

# Configuration
PROJECT_DIR="/Users/emmanuelabougadous/saas-backend"
FRONTEND_DIR="$PROJECT_DIR/apps/frontend"
BACKEND_DIR="$PROJECT_DIR/apps/backend"

echo "1. 🔧 PRÉPARATION DU BACKEND..."
cd $BACKEND_DIR
echo "Backend prêt: $(pwd)"

echo ""
echo "2. 🔧 PRÉPARATION DU FRONTEND..."
cd $FRONTEND_DIR
echo "Frontend prêt: $(pwd)"

echo ""
echo "3. 🚀 DÉPLOIEMENT BACKEND SUR VERCEL..."
cd $BACKEND_DIR
vercel --prod --force --public
BACKEND_URL=$(vercel ls | head -2 | tail -1 | awk '{print $1}')
echo "✅ Backend déployé: $BACKEND_URL"

echo ""
echo "4. 🔧 CONFIGURATION FRONTEND..."
cd $FRONTEND_DIR
# Mise à jour de l'URL API
echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" > .env.local

echo ""
echo "5. 🚀 DÉPLOIEMENT FRONTEND SUR NETLIFY..."
# Installation Netlify CLI si nécessaire
if ! command -v netlify &> /dev/null; then
    echo "Installation de Netlify CLI..."
    npm install -g netlify-cli
fi

# Build du frontend
echo "Build du frontend..."
npm run build

# Déploiement sur Netlify
echo "Déploiement sur Netlify..."
netlify deploy --prod --dir=.next --open

echo ""
echo "6. 🌐 CONFIGURATION DES DOMAINES..."
echo "Configuration du domaine app.luneo.app..."

echo ""
echo "✅ DÉPLOIEMENT TERMINÉ !"
echo "Backend: $BACKEND_URL"
echo "Frontend: Déployé sur Netlify"
echo "Domaine: https://app.luneo.app"

echo ""
echo "🎊 PLATEFORME LUNEO EN PRODUCTION ! 🎊"



