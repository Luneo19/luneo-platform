#!/bin/bash
# Configuration des variables Vercel
set -e
if [ ! -f .env.production ]; then
    echo "❌ Fichier .env.production non trouvé"
    exit 1
fi
echo "📋 Configuration des variables Vercel..."
echo "⚠️  Ce script nécessite que vous soyez connecté à Vercel"
echo "   Exécutez: vercel login"
echo ""
read -p "Continuer? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi
while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    value=$(echo "$value" | sed 's/^"//;s/"$//')
    echo "Configuring: $key"
    echo "$value" | vercel env add "$key" production 2>/dev/null || echo "   (déjà configuré ou erreur)"
done < .env.production
echo ""
echo "✅ Variables Vercel configurées!"





























