#!/bin/bash
# 🚀 Script de déploiement production complet
# Déploie frontend et backend sur Vercel

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "🚀 Déploiement production Luneo Platform"
echo "========================================"

# Frontend
echo ""
echo "📦 Déploiement Frontend..."
cd apps/frontend
vercel --prod --yes
FRONTEND_URL=$(vercel ls --prod 2>&1 | grep -E "https://" | head -1 | awk '{print $NF}' || echo "https://app.luneo.app")
echo "✅ Frontend déployé: $FRONTEND_URL"

# Backend
echo ""
echo "📦 Déploiement Backend..."
cd ../backend
vercel --prod --yes
BACKEND_URL=$(vercel ls --prod 2>&1 | grep -E "https://" | head -1 | awk '{print $NF}' || echo "https://app.luneo.app/api")
echo "✅ Backend déployé: $BACKEND_URL"

echo ""
echo "✅ Déploiements terminés!"
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
