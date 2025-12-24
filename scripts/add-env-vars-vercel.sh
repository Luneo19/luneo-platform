#!/bin/bash

# Script pour ajouter les variables d'environnement dans Vercel
# Usage: ./add-env-vars-vercel.sh

set -e

echo "🔧 Configuration des variables d'environnement Vercel"
echo "=================================================="
echo ""

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "Installez-le avec: npm i -g vercel"
    exit 1
fi

# Vérifier que l'utilisateur est connecté
if ! vercel whoami &> /dev/null; then
    echo "❌ Vous n'êtes pas connecté à Vercel"
    echo "Connectez-vous avec: vercel login"
    exit 1
fi

PROJECT_NAME="frontend"
TEAM_NAME="luneos-projects"

echo "📋 Variables à ajouter:"
echo "  1. NEXT_PUBLIC_SENTRY_DSN"
echo "  2. NEXT_PUBLIC_GA_ID"
echo ""

# Demander les valeurs
read -p "Entrez le DSN Sentry (ou appuyez sur Entrée pour ignorer): " SENTRY_DSN
read -p "Entrez le Measurement ID Google Analytics (G-XXXXXXXXXX) (ou appuyez sur Entrée pour ignorer): " GA_ID

# Ajouter Sentry DSN
if [ ! -z "$SENTRY_DSN" ]; then
    echo ""
    echo "➕ Ajout de NEXT_PUBLIC_SENTRY_DSN..."
    vercel env add NEXT_PUBLIC_SENTRY_DSN production <<< "$SENTRY_DSN" || echo "⚠️  Erreur lors de l'ajout (peut-être déjà existant)"
    vercel env add NEXT_PUBLIC_SENTRY_DSN preview <<< "$SENTRY_DSN" || echo "⚠️  Erreur lors de l'ajout (peut-être déjà existant)"
    vercel env add NEXT_PUBLIC_SENTRY_DSN development <<< "$SENTRY_DSN" || echo "⚠️  Erreur lors de l'ajout (peut-être déjà existant)"
    echo "✅ NEXT_PUBLIC_SENTRY_DSN ajouté"
fi

# Ajouter Google Analytics ID
if [ ! -z "$GA_ID" ]; then
    echo ""
    echo "➕ Ajout de NEXT_PUBLIC_GA_ID..."
    vercel env add NEXT_PUBLIC_GA_ID production <<< "$GA_ID" || echo "⚠️  Erreur lors de l'ajout (peut-être déjà existant)"
    vercel env add NEXT_PUBLIC_GA_ID preview <<< "$GA_ID" || echo "⚠️  Erreur lors de l'ajout (peut-être déjà existant)"
    echo "✅ NEXT_PUBLIC_GA_ID ajouté"
fi

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "🔄 Pour appliquer les changements, redéployez:"
echo "   vercel --prod"
echo "   ou via le dashboard Vercel: Deployments → Redeploy"

