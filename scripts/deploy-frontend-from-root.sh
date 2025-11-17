#!/bin/bash
set -e

echo "🚀 DÉPLOIEMENT FRONTEND DEPUIS RACINE"
echo "======================================"
echo ""

cd "$(dirname "$0")/.."

echo "📋 Configuration..."
echo "  Root Directory: apps/frontend"
echo ""

# Créer un vercel.json temporaire à la racine si nécessaire
if [ ! -f vercel.json ]; then
  echo "📝 Création vercel.json à la racine..."
  cat > vercel.json << 'EOF'
{
  "buildCommand": "cd apps/frontend && pnpm build",
  "installCommand": "pnpm install",
  "outputDirectory": "apps/frontend/.next",
  "framework": "nextjs"
}
EOF
fi

echo "🚀 Déploiement frontend..."
cd apps/frontend

# Lier au projet Vercel
vercel link --yes 2>&1 | grep -v "Already linked" || true

# Déployer
vercel --prod --yes

cd ../..

echo ""
echo "✅ Déploiement frontend terminé !"

