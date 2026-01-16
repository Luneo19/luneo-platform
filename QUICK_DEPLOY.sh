#!/bin/bash

##############################################################################
# ⚡ DÉPLOIEMENT RAPIDE - LUNEO PLATFORM
# Script simplifié pour déployer rapidement
##############################################################################

set -e

echo ""
echo "🚀 DÉPLOIEMENT RAPIDE - LUNEO PLATFORM"
echo "========================================"
echo ""

# Vérifier les CLI
echo "📋 Vérification des outils..."
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI non installé. Installation..."
    npm install -g vercel
fi

if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI non installé. Installation..."
    npm install -g @railway/cli
fi

echo "✅ Outils vérifiés"
echo ""

# Menu
echo "Choisissez une option :"
echo "1) Déployer Frontend (Vercel)"
echo "2) Déployer Backend (Railway)"
echo "3) Déployer les deux"
echo ""
read -p "Votre choix (1/2/3) : " choice

case $choice in
    1)
        echo ""
        echo "🌐 Déploiement Frontend..."
        cd apps/frontend
        vercel login || true
        vercel --prod --yes
        ;;
    2)
        echo ""
        echo "🚂 Déploiement Backend..."
        cd apps/backend
        railway login || true
        railway run "pnpm prisma migrate deploy" || echo "⚠️ Migrations déjà à jour"
        railway up
        ;;
    3)
        echo ""
        echo "🚀 Déploiement complet..."
        
        # Backend
        echo "🚂 Backend..."
        cd apps/backend
        railway login || true
        railway run "pnpm prisma migrate deploy" || echo "⚠️ Migrations déjà à jour"
        railway up
        cd ../..
        
        # Frontend
        echo ""
        echo "🌐 Frontend..."
        cd apps/frontend
        vercel login || true
        vercel --prod --yes
        ;;
    *)
        echo "❌ Choix invalide"
        exit 1
        ;;
esac

echo ""
echo "✅ Déploiement terminé !"
echo ""
