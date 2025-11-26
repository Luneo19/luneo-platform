#!/bin/bash
set -e

echo "🚀 DÉPLOIEMENT INTELLIGENT FRONTEND"
echo "===================================="
echo ""

REPO_ROOT="/Users/emmanuelabougadous/luneo-platform"
FRONTEND_DIR="$REPO_ROOT/apps/frontend"

cd "$REPO_ROOT"

# Méthode 1: Déploiement depuis la racine avec vercel.json racine
echo "📋 Méthode 1: Déploiement depuis la racine du repo..."
echo "   (Utilise vercel.json à la racine qui pointe vers apps/frontend)"
echo ""

# Vérifier que vercel.json existe à la racine
if [ ! -f "$REPO_ROOT/vercel.json" ]; then
    echo "❌ vercel.json manquant à la racine!"
    exit 1
fi

# Lier le projet Vercel depuis la racine si nécessaire
if [ ! -f "$REPO_ROOT/.vercel/project.json" ]; then
    echo "🔗 Liaison du projet Vercel depuis la racine..."
    cd "$REPO_ROOT"
    vercel link --yes --project=frontend --scope=luneos-projects 2>&1 | grep -E "(Linked|Error)" || true
fi

# Déployer depuis la racine
echo ""
echo "🚀 Déploiement en cours depuis la racine..."
cd "$REPO_ROOT"
vercel --prod --yes --cwd . 2>&1 | tee /tmp/vercel-deploy.log

# Vérifier le résultat
if grep -q "Error\|error" /tmp/vercel-deploy.log; then
    echo ""
    echo "⚠️  Erreur détectée, tentative avec méthode alternative..."
    
    # Méthode 2: Push Git pour déclencher déploiement automatique
    echo ""
    echo "📤 Méthode 2: Push Git pour déclencher déploiement automatique..."
    git commit --allow-empty -m "Deploy frontend via Git - $(date +%Y%m%d-%H%M%S)" 2>/dev/null || true
    git push origin main
    
    echo ""
    echo "✅ Push Git effectué"
    echo "⏳ Le déploiement devrait se déclencher automatiquement dans quelques secondes"
    echo "🔗 Surveillez: https://vercel.com/luneos-projects/frontend/deployments"
else
    echo ""
    echo "✅ Déploiement réussi!"
fi

