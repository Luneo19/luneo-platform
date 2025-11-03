#!/bin/bash

echo "🚀 DÉPLOIEMENT PUBLIC LUNEO"
echo "=========================="
echo ""

# Configuration des variables
FRONTEND_DIR="/Users/emmanuelabougadous/saas-backend/apps/frontend"
BACKEND_DIR="/Users/emmanuelabougadous/saas-backend/apps/backend"

echo "1. Déploiement du backend..."
cd $BACKEND_DIR
vercel --prod --force --public
BACKEND_URL=$(vercel ls | head -2 | tail -1 | awk '{print $1}')
echo "Backend déployé: $BACKEND_URL"

echo ""
echo "2. Configuration de l'API URL..."
cd $FRONTEND_DIR
echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" > .env.local

echo ""
echo "3. Déploiement du frontend..."
vercel --prod --force --public
FRONTEND_URL=$(vercel ls | head -2 | tail -1 | awk '{print $1}')
echo "Frontend déployé: $FRONTEND_URL"

echo ""
echo "4. Configuration des domaines..."
vercel domains add app.luneo.app

echo ""
echo "✅ DÉPLOIEMENT TERMINÉ !"
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
echo "Domaine: https://app.luneo.app"



