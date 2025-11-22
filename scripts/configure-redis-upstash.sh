#!/bin/bash

# Script pour configurer Upstash Redis dans Vercel
# TODO-006

set -e

echo "🔴 CONFIGURATION UPSTASH REDIS (TODO-006)"
echo ""

cd "$(dirname "$0")/../apps/frontend" || exit 1

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    exit 1
fi

echo "📋 Instructions:"
echo ""
echo "1. Aller sur https://upstash.com"
echo "2. Créer une database Redis (gratuite)"
echo "3. Copier UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN"
echo ""
read -p "Entrez UPSTASH_REDIS_REST_URL: " REDIS_URL
read -p "Entrez UPSTASH_REDIS_REST_TOKEN: " REDIS_TOKEN

if [ -z "$REDIS_URL" ] || [ -z "$REDIS_TOKEN" ]; then
    echo "❌ Les credentials ne peuvent pas être vides"
    exit 1
fi

echo ""
echo "📦 Configuration dans Vercel..."

# Production
echo "$REDIS_URL" | vercel env add UPSTASH_REDIS_REST_URL production 2>&1 || echo "⚠️  Variable existe déjà"
echo "$REDIS_TOKEN" | vercel env add UPSTASH_REDIS_REST_TOKEN production 2>&1 || echo "⚠️  Variable existe déjà"

# Preview
echo "$REDIS_URL" | vercel env add UPSTASH_REDIS_REST_URL preview 2>&1 || echo "⚠️  Variable existe déjà"
echo "$REDIS_TOKEN" | vercel env add UPSTASH_REDIS_REST_TOKEN preview 2>&1 || echo "⚠️  Variable existe déjà"

# Development
echo "$REDIS_URL" | vercel env add UPSTASH_REDIS_REST_URL development 2>&1 || echo "⚠️  Variable existe déjà"
echo "$REDIS_TOKEN" | vercel env add UPSTASH_REDIS_REST_TOKEN development 2>&1 || echo "⚠️  Variable existe déjà"

echo ""
echo "✅ Redis configuré dans Vercel !"
echo ""
echo "🔄 Redéploiement recommandé pour activer Redis"

