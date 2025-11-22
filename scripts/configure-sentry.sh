#!/bin/bash

# Script pour configurer Sentry dans Vercel
# TODO-010

set -e

echo "🐛 CONFIGURATION SENTRY (TODO-010)"
echo ""

cd "$(dirname "$0")/../apps/frontend" || exit 1

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    exit 1
fi

echo "📋 Instructions:"
echo ""
echo "1. Aller sur https://sentry.io"
echo "2. Créer un projet Next.js"
echo "3. Copier le DSN (format: https://xxx@xxx.ingest.sentry.io/xxx)"
echo ""
read -p "Entrez NEXT_PUBLIC_SENTRY_DSN: " SENTRY_DSN

if [ -z "$SENTRY_DSN" ]; then
    echo "❌ Le DSN ne peut pas être vide"
    exit 1
fi

echo ""
echo "📦 Configuration dans Vercel..."

# Production
echo "$SENTRY_DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN production 2>&1 || echo "⚠️  Variable existe déjà"

# Preview
echo "$SENTRY_DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN preview 2>&1 || echo "⚠️  Variable existe déjà"

# Development
echo "$SENTRY_DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN development 2>&1 || echo "⚠️  Variable existe déjà"

echo ""
echo "✅ Sentry configuré dans Vercel !"
echo ""
echo "🔄 Redéploiement recommandé pour activer Sentry"

