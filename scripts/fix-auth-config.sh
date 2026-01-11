#!/bin/bash

# Script pour corriger la configuration d'authentification
# Usage: ./scripts/fix-auth-config.sh

set -e

echo "🔧 CORRECTION CONFIGURATION AUTHENTIFICATION"
echo "=============================================="
echo ""

# 1. Corriger .env.local frontend
echo "📝 Correction .env.local frontend..."
cd apps/frontend

if [ -f .env.local ]; then
    # Retirer /api de NEXT_PUBLIC_API_URL si présent
    sed -i.bak 's|NEXT_PUBLIC_API_URL=http://localhost:3001/api|NEXT_PUBLIC_API_URL=http://localhost:3001|g' .env.local
    sed -i.bak 's|NEXT_PUBLIC_API_URL=https://api.luneo.app/api|NEXT_PUBLIC_API_URL=https://api.luneo.app|g' .env.local
    echo "✅ .env.local corrigé"
else
    echo "⚠️  .env.local non trouvé, création..."
    cat > .env.local << EOF
# URLs (sans /api - les endpoints incluent déjà /api/v1)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    echo "✅ .env.local créé"
fi

cd ../..

# 2. Vérifier configuration Vercel
echo ""
echo "📋 Configuration Vercel requise:"
echo "   NEXT_PUBLIC_API_URL=https://api.luneo.app"
echo "   (sans /api à la fin)"
echo ""

# 3. Tester le backend
echo "🔍 Test backend..."
BACKEND_HEALTH=$(curl -s "https://api.luneo.app/health" 2>&1 | head -1)
if echo "$BACKEND_HEALTH" | grep -q "ok"; then
    echo "✅ Backend accessible"
else
    echo "⚠️  Backend non accessible: $BACKEND_HEALTH"
fi

echo ""
echo "✅ Configuration corrigée !"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Redémarrer le frontend: cd apps/frontend && npm run dev"
echo "   2. Configurer Vercel: NEXT_PUBLIC_API_URL=https://api.luneo.app"
echo "   3. Tester l'inscription sur http://localhost:3000/register"
