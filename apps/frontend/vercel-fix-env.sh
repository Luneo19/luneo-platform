#!/bin/bash

# ========================================
# SCRIPT DE CORRECTION DES VARIABLES VERCEL
# ========================================
# Ce script ajoute les variables d'environnement manquantes à Vercel
# Usage: ./vercel-fix-env.sh

set -e

echo "🔧 CORRECTION DES VARIABLES D'ENVIRONNEMENT VERCEL"
echo "=================================================="
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis apps/frontend"
    exit 1
fi

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "Installez-le avec: npm install -g vercel"
    exit 1
fi

echo "📋 Variables à configurer:"
echo ""
echo "🔴 CRITIQUES:"
echo "  1. NEXT_PUBLIC_SUPABASE_URL"
echo "  2. NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  3. STRIPE_WEBHOOK_SECRET"
echo ""
echo "🟡 IMPORTANTES:"
echo "  4. OPENAI_API_KEY"
echo "  5. BACKEND_URL"
echo ""
echo "Voulez-vous continuer? (y/n)"
read -r response

if [ "$response" != "y" ]; then
    echo "❌ Annulé"
    exit 0
fi

echo ""
echo "🔴 ÉTAPE 1: Variables Supabase (CRITIQUE)"
echo "=========================================="

# NEXT_PUBLIC_SUPABASE_URL
echo ""
echo "📝 NEXT_PUBLIC_SUPABASE_URL"
echo "Entrez la valeur (obligatoire, ex: https://<project>.supabase.co):"
read -r supabase_url
if [ -z "$supabase_url" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL est obligatoire"
    exit 1
fi
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$supabase_url"
echo "✅ NEXT_PUBLIC_SUPABASE_URL ajouté"

# NEXT_PUBLIC_SUPABASE_ANON_KEY
echo ""
echo "📝 NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "Entrez la valeur (obligatoire, clé anon Supabase):"
read -r supabase_anon_key
if [ -z "$supabase_anon_key" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY est obligatoire"
    exit 1
fi
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$supabase_anon_key"
echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY ajouté"

echo ""
echo "🟡 ÉTAPE 2: Variables Importantes"
echo "=================================="

# STRIPE_WEBHOOK_SECRET
echo ""
echo "📝 STRIPE_WEBHOOK_SECRET"
echo "Obtenez cette valeur depuis: https://dashboard.stripe.com/webhooks"
echo "Entrez la valeur (whsec_...):"
read -r stripe_webhook_secret
if [ -n "$stripe_webhook_secret" ]; then
    vercel env add STRIPE_WEBHOOK_SECRET production <<< "$stripe_webhook_secret"
    echo "✅ STRIPE_WEBHOOK_SECRET ajouté"
else
    echo "⚠️  STRIPE_WEBHOOK_SECRET ignoré (vous pouvez l'ajouter plus tard)"
fi

# OPENAI_API_KEY
echo ""
echo "📝 OPENAI_API_KEY"
echo "Obtenez cette valeur depuis: https://platform.openai.com/api-keys"
echo "Entrez la valeur (sk-...) ou appuyez sur Entrée pour ignorer:"
read -r openai_key
if [ -n "$openai_key" ]; then
    vercel env add OPENAI_API_KEY production <<< "$openai_key"
    echo "✅ OPENAI_API_KEY ajouté"
else
    echo "⚠️  OPENAI_API_KEY ignoré (génération AI ne fonctionnera pas)"
fi

# BACKEND_URL
echo ""
echo "📝 BACKEND_URL"
echo "Valeur attendue: https://backend-production-9178.up.railway.app"
echo "Entrez la valeur (ou appuyez sur Entrée pour utiliser la valeur par défaut):"
read -r backend_url
if [ -z "$backend_url" ]; then
    backend_url="https://backend-production-9178.up.railway.app"
fi
vercel env add BACKEND_URL production <<< "$backend_url"
echo "✅ BACKEND_URL ajouté"

echo ""
echo "✅ CORRECTIONS TERMINÉES!"
echo "========================"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Vérifier les variables: vercel env ls"
echo "  2. Redéployer: vercel --prod"
echo "  3. Vérifier les logs: vercel logs <deployment-url>"
echo ""













