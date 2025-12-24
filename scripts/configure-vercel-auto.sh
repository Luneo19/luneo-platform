#!/bin/bash

# Script pour configurer automatiquement toutes les variables Vercel
# Avec les services gratuits (Neon, Upstash, Cloudinary)

set -e

# Variables à configurer
DATABASE_URL="postgresql://neondb_owner:npg_6vgw4tFMpTxo@ep-solitary-moon-abw2l1e0-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
REDIS_URL="rediss://default:AVMtAAIncDJmZTJmNGVkMzdhZGE0MmI5YjBhMzU4N2QyOTBmNTU2YXAyMjEyOTM@moved-gelding-21293.upstash.io:6379"
UPSTASH_REST_URL="https://moved-gelding-21293.upstash.io"
UPSTASH_REST_TOKEN="AVMtAAIncDJmZTJmNGVkMzdhZGE0MmI5YjBhMzU4N2QyOTBmNTU2YXAyMjEyOTM"
CLOUDINARY_CLOUD_NAME="deh4aokbx"
CLOUDINARY_API_KEY="541766291559917"
CLOUDINARY_API_SECRET="s0yc_QR4w9IsM6_HRq2hM5SDnfI"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="deh4aokbx"

echo "🚀 Configuration Automatique Vercel"
echo "===================================="
echo ""

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI non installé"
    echo "   Installation: npm i -g vercel"
    exit 1
fi

# Vérifier connexion
if ! vercel whoami &> /dev/null; then
    echo "❌ Non connecté à Vercel"
    echo "   Exécuter: vercel login"
    exit 1
fi

echo "✅ Vercel CLI connecté: $(vercel whoami)"
echo ""

# Aller dans le répertoire frontend
cd apps/frontend

# Vérifier que le projet est lié
if [ ! -f .vercel/project.json ]; then
    echo "⚠️  Projet Vercel non lié"
    echo "   Lier le projet: vercel link"
    echo "   OU créer un nouveau projet: vercel"
    read -p "Voulez-vous lier le projet maintenant? (oui/non): " link_project
    if [ "$link_project" = "oui" ]; then
        vercel link
    else
        echo "❌ Configuration annulée"
        exit 1
    fi
fi

ENVIRONMENTS=("production" "preview" "development")

echo "📋 Configuration de 8 variables sur ${#ENVIRONMENTS[@]} environnements..."
echo ""

# Fonction pour configurer une variable
configure_var() {
    local VAR_NAME=$1
    local VAR_VALUE=$2
    
    echo "🔧 Configuration de $VAR_NAME..."
    
    for ENV in "${ENVIRONMENTS[@]}"; do
        echo "   → $ENV..."
        # Supprimer l'ancienne si elle existe, puis ajouter la nouvelle
        echo "$VAR_VALUE" | vercel env add "$VAR_NAME" "$ENV" 2>/dev/null || {
            # Si la variable existe déjà, la supprimer puis la recréer
            vercel env rm "$VAR_NAME" "$ENV" --yes 2>/dev/null || true
            echo "$VAR_VALUE" | vercel env add "$VAR_NAME" "$ENV"
        }
    done
    echo "   ✅ $VAR_NAME configuré"
    echo ""
}

# Configurer toutes les variables
configure_var "DATABASE_URL" "$DATABASE_URL"
configure_var "REDIS_URL" "$REDIS_URL"
configure_var "UPSTASH_REDIS_REST_URL" "$UPSTASH_REST_URL"
configure_var "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REST_TOKEN"
configure_var "CLOUDINARY_CLOUD_NAME" "$CLOUDINARY_CLOUD_NAME"
configure_var "CLOUDINARY_API_KEY" "$CLOUDINARY_API_KEY"
configure_var "CLOUDINARY_API_SECRET" "$CLOUDINARY_API_SECRET"
configure_var "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" "$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"

echo "🎉 Toutes les variables sont configurées!"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Redéployer: vercel --prod"
echo "  2. Vérifier les logs dans Vercel Dashboard"
echo ""

