#!/bin/bash

# ★★★ SCRIPT DE DÉPLOIEMENT VERCEL ★★★
# Déploie l'application frontend sur Vercel

set -e

echo "🚀 Déploiement sur Vercel..."
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
  echo "❌ Erreur: Ce script doit être exécuté depuis le répertoire apps/frontend"
  exit 1
fi

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
  echo "📦 Installation de Vercel CLI..."
  npm install -g vercel
fi

# Vérifier la connexion Vercel
echo "🔐 Vérification de la connexion Vercel..."
if ! vercel whoami &> /dev/null; then
  echo "⚠️  Non connecté à Vercel. Connexion requise..."
  vercel login
fi

# Build de l'application
echo "🔨 Build de l'application..."
npm run build

# Déploiement
echo "🚀 Déploiement sur Vercel..."
vercel --prod

echo ""
echo "✅ Déploiement terminé !"
echo "📝 Vérifiez votre dashboard Vercel pour l'URL de déploiement"
