#!/bin/bash

# Script pour mettre à jour les variables d'environnement Vercel
# Avec les nouvelles configurations gratuites (Neon, Upstash, Cloudinary)

set -e

echo "🚀 Mise à Jour des Variables Vercel"
echo "===================================="
echo ""

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé."
    echo "   Installation: npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLI installé"
echo ""

# Credentials à configurer
DATABASE_URL="postgresql://neondb_owner:npg_6vgw4tFMpTxo@ep-solitary-moon-abw2l1e0-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
REDIS_URL="rediss://default:AVMtAAIncDJmZTJmNGVkMzdhZGE0MmI5YjBhMzU4N2QyOTBmNTU2YXAyMjEyOTM@moved-gelding-21293.upstash.io:6379"
UPSTASH_REST_URL="https://moved-gelding-21293.upstash.io"
UPSTASH_REST_TOKEN="AVMtAAIncDJmZTJmNGVkMzdhZGE0MmI5YjBhMzU4N2QyOTBmNTU2YXAyMjEyOTM"
CLOUDINARY_CLOUD_NAME="deh4aokbx"
CLOUDINARY_API_KEY="541766291559917"
CLOUDINARY_API_SECRET="s0yc_QR4w9IsM6_HRq2hM5SDnfI"

echo "📋 Variables à configurer sur Vercel:"
echo ""
echo "1. DATABASE_URL (Neon)"
echo "2. REDIS_URL (Upstash)"
echo "3. UPSTASH_REDIS_REST_URL (Upstash REST)"
echo "4. UPSTASH_REDIS_REST_TOKEN (Upstash REST)"
echo "5. CLOUDINARY_CLOUD_NAME"
echo "6. CLOUDINARY_API_KEY"
echo "7. CLOUDINARY_API_SECRET"
echo ""

read -p "Voulez-vous configurer ces variables via Vercel CLI? (oui/non): " use_cli

if [ "$use_cli" = "oui" ]; then
    echo ""
    echo "🔧 Configuration via Vercel CLI..."
    echo ""
    
    # Aller dans le répertoire frontend
    cd apps/frontend
    
    # Ajouter les variables
    echo "Ajout des variables d'environnement..."
    
    vercel env add DATABASE_URL production <<< "$DATABASE_URL" 2>/dev/null || \
    vercel env rm DATABASE_URL production --yes 2>/dev/null && \
    vercel env add DATABASE_URL production <<< "$DATABASE_URL"
    
    vercel env add REDIS_URL production <<< "$REDIS_URL" 2>/dev/null || \
    vercel env rm REDIS_URL production --yes 2>/dev/null && \
    vercel env add REDIS_URL production <<< "$REDIS_URL"
    
    vercel env add UPSTASH_REDIS_REST_URL production <<< "$UPSTASH_REST_URL" 2>/dev/null || \
    vercel env rm UPSTASH_REDIS_REST_URL production --yes 2>/dev/null && \
    vercel env add UPSTASH_REDIS_REST_URL production <<< "$UPSTASH_REST_URL"
    
    vercel env add UPSTASH_REDIS_REST_TOKEN production <<< "$UPSTASH_REST_TOKEN" 2>/dev/null || \
    vercel env rm UPSTASH_REDIS_REST_TOKEN production --yes 2>/dev/null && \
    vercel env add UPSTASH_REDIS_REST_TOKEN production <<< "$UPSTASH_REST_TOKEN"
    
    vercel env add CLOUDINARY_CLOUD_NAME production <<< "$CLOUDINARY_CLOUD_NAME" 2>/dev/null || \
    vercel env rm CLOUDINARY_CLOUD_NAME production --yes 2>/dev/null && \
    vercel env add CLOUDINARY_CLOUD_NAME production <<< "$CLOUDINARY_CLOUD_NAME"
    
    vercel env add CLOUDINARY_API_KEY production <<< "$CLOUDINARY_API_KEY" 2>/dev/null || \
    vercel env rm CLOUDINARY_API_KEY production --yes 2>/dev/null && \
    vercel env add CLOUDINARY_API_KEY production <<< "$CLOUDINARY_API_KEY"
    
    vercel env add CLOUDINARY_API_SECRET production <<< "$CLOUDINARY_API_SECRET" 2>/dev/null || \
    vercel env rm CLOUDINARY_API_SECRET production --yes 2>/dev/null && \
    vercel env add CLOUDINARY_API_SECRET production <<< "$CLOUDINARY_API_SECRET"
    
    echo ""
    echo "✅ Variables configurées via CLI!"
    echo ""
    echo "⚠️  IMPORTANT: Répétez pour Preview et Development:"
    echo "   vercel env add [VARIABLE] preview"
    echo "   vercel env add [VARIABLE] development"
else
    echo ""
    echo "📝 Configuration manuelle via Vercel Dashboard"
    echo ""
    echo "1. Allez sur: https://vercel.com/dashboard"
    echo "2. Sélectionnez votre projet"
    echo "3. Settings → Environment Variables"
    echo "4. Ajoutez/modifiez ces variables:"
    echo ""
    echo "DATABASE_URL=$DATABASE_URL"
    echo "REDIS_URL=$REDIS_URL"
    echo "UPSTASH_REDIS_REST_URL=$UPSTASH_REST_URL"
    echo "UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REST_TOKEN"
    echo "CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME"
    echo "CLOUDINARY_API_KEY=$CLOUDINARY_API_KEY"
    echo "CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET"
    echo ""
    echo "⚠️  Sélectionnez 'All Environments' (Production, Preview, Development)"
fi

echo ""
echo "📋 Après configuration, redéployez:"
echo "   vercel --prod"
echo ""

