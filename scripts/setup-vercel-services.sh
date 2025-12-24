#!/bin/bash

# Script pour configurer automatiquement les services Vercel
# TODO-006 à TODO-010

set -e

echo "🔧 Configuration des services Vercel..."
echo ""

cd "$(dirname "$0")/../apps/frontend" || exit 1

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    exit 1
fi

echo "✅ Vercel CLI détecté"
echo ""

# TODO-006: Upstash Redis
echo "📦 TODO-006: Configuration Upstash Redis"
echo "⚠️  Action manuelle requise:"
echo "   1. Aller sur https://upstash.com"
echo "   2. Créer une database Redis"
echo "   3. Copier UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN"
echo "   4. Exécuter:"
echo "      echo 'VOTRE_URL' | vercel env add UPSTASH_REDIS_REST_URL production"
echo "      echo 'VOTRE_TOKEN' | vercel env add UPSTASH_REDIS_REST_TOKEN production"
echo ""

# TODO-007: OpenAI
echo "🤖 TODO-007: Configuration OpenAI"
echo "⚠️  Action manuelle requise:"
echo "   1. Aller sur https://platform.openai.com/api-keys"
echo "   2. Créer une API key"
echo "   3. Exécuter:"
echo "      echo 'VOTRE_KEY' | vercel env add OPENAI_API_KEY production"
echo ""

# TODO-008: Cloudinary (déjà configuré)
echo "☁️  TODO-008: Configuration Cloudinary"
echo "✅ Déjà configuré dans Vercel (détecté)"
echo ""

# TODO-009: SendGrid
echo "📧 TODO-009: Vérification domaine SendGrid"
echo "⚠️  Action manuelle requise:"
echo "   1. Aller sur https://app.sendgrid.com/settings/sender_auth"
echo "   2. Vérifier domaine luneo.app"
echo ""

# TODO-010: Sentry
echo "🐛 TODO-010: Configuration Sentry"
echo "⚠️  Action manuelle requise:"
echo "   1. Aller sur https://sentry.io"
echo "   2. Créer un projet"
echo "   3. Copier le DSN"
echo "   4. Exécuter:"
echo "      echo 'VOTRE_DSN' | vercel env add NEXT_PUBLIC_SENTRY_DSN production"
echo ""

echo "✅ Script terminé"
echo ""
echo "📋 Résumé:"
echo "   - Cloudinary: ✅ Déjà configuré"
echo "   - Redis: ⏳ Action manuelle requise"
echo "   - OpenAI: ⏳ Action manuelle requise"
echo "   - SendGrid: ⏳ Action manuelle requise"
echo "   - Sentry: ⏳ Action manuelle requise"

