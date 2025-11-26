#!/bin/bash

echo "🔄 FORCE REDEPLOY FRONTEND"
echo "=========================="
echo ""

# Option 1: Via Git
echo "📤 Option 1: Push Git pour déclencher déploiement..."
cd /Users/emmanuelabougadous/luneo-platform
git commit --allow-empty -m "Force redeploy $(date +%Y%m%d-%H%M%S)" 2>/dev/null
git push origin main

echo ""
echo "⏳ Attente 20 secondes..."
sleep 20

# Option 2: Vérifier les déploiements
echo ""
echo "📋 Vérification des déploiements récents:"
cd apps/frontend
vercel ls 2>&1 | head -5

echo ""
echo "💡 Si aucun nouveau déploiement n'apparaît:"
echo "   1. Allez sur: https://vercel.com/luneos-projects/frontend/deployments"
echo "   2. Cliquez sur 'Redeploy' sur le dernier déploiement"
echo "   3. Ou créez un nouveau déploiement depuis le dashboard"

