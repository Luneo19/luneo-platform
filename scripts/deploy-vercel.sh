#!/bin/bash

# Script de déploiement Vercel pour Frontend
# Usage: ./scripts/deploy-vercel.sh

set -e

echo "🚀 DÉPLOIEMENT VERCEL - FRONTEND"
echo "================================="
echo ""

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI non installé"
    echo "Installation: npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLI détecté"
echo ""

# Vérifier connexion
echo "🔐 Vérification connexion Vercel..."
if ! vercel whoami &> /dev/null; then
    echo "❌ Non connecté à Vercel"
    echo "Connexion: vercel login"
    exit 1
fi

echo "✅ Connecté à Vercel"
echo ""

# Variables d'environnement requises
REQUIRED_VARS=(
    "NEXT_PUBLIC_API_URL"
    "NEXT_PUBLIC_APP_URL"
)

echo "📋 Vérification variables d'environnement..."
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! vercel env ls | grep -q "$var"; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "⚠️  Variables manquantes:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Pour ajouter: vercel env add $var"
    read -p "Continuer quand même? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Variables d'environnement OK"
echo ""

# Déploiement
echo "🚀 Déploiement en cours..."
cd apps/frontend

vercel --prod

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "📊 Vérifications:"
echo "1. Vérifier build réussi"
echo "2. Tester routes principales"
echo "3. Vérifier API calls"
echo "4. Vérifier logs: vercel logs"
