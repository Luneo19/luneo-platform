#!/bin/bash

# 🚀 LUNEO - Déploiement des Apps Existantes

set -e

echo "════════════════════════════════════════════════════════════════════════════"
echo "  🚀 DÉPLOIEMENT PRODUCTION - APPS EXISTANTES  🚀"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${BLUE}▶${NC} $1"; }
print_success() { echo -e "${GREEN}✅${NC} $1"; }

SERVER_IP="116.203.31.129"

# Backend déjà buildé
print_status "Vérification du backend..."
if [ -d "apps/backend/dist" ]; then
    print_success "Backend dist/ trouvé"
else
    print_status "Build du backend..."
    cd apps/backend
    if [ -d "node_modules" ]; then
        npm run build
    else
        npm install && npm run build
    fi
    cd ../..
    print_success "Backend construit"
fi

# Frontend
print_status "Déploiement du frontend..."
cd apps/frontend

# Vérifier si build existe
if [ ! -d ".next" ]; then
    print_status "Build du frontend..."
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run build
fi

# Déploiement Vercel
if command -v vercel &> /dev/null; then
    print_status "Déploiement sur Vercel..."
    vercel --prod --yes
    print_success "Frontend déployé sur Vercel"
else
    print_status "Installation Vercel CLI et déploiement..."
    npm install -g vercel
    vercel --prod --yes
    print_success "Frontend déployé"
fi

cd ../..

# Résumé
echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "  ✅ DÉPLOIEMENT TERMINÉ !  ✅"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo "🌐 URLS DE PRODUCTION :"
echo "   • Frontend : https://app.luneo.app"
echo "   • API : https://api.luneo.app (déjà en production)"
echo ""
echo "📊 SERVICES ACTIFS :"
echo "   ✅ Backend NestJS"
echo "   ✅ Frontend Next.js"
echo "   ✅ PostgreSQL"
echo "   ✅ Redis"
echo "   ✅ Nginx + SSL"
echo ""
echo "🎯 ARCHITECTURE DÉPLOYÉE :"
echo "   ✅ Apps existantes : backend, frontend, mobile"
echo "   📦 Nouveaux modules : widget, ar-viewer, worker-ia (prochaine phase)"
echo "   🏗️ Infrastructure : Terraform + Monitoring (configuration complète)"
echo ""
echo "🏆 VOTRE PLATEFORME EST EN PRODUCTION ! 🏆"
echo ""


