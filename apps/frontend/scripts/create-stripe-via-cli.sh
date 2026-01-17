#!/bin/bash
# Script pour créer les produits Stripe via CLI ou API directe

set -e

echo "🚀 Création des produits Stripe pour Luneo"
echo "=========================================="
echo ""

# Essayer d'utiliser Stripe CLI d'abord
if command -v stripe &> /dev/null; then
    echo "✅ Stripe CLI détecté"
    
    # Essayer de récupérer la clé depuis Stripe CLI
    STRIPE_KEY=$(stripe config --get test_mode_api_key 2>/dev/null || stripe config --get live_mode_api_key 2>/dev/null || echo "")
    
    if [ -n "$STRIPE_KEY" ]; then
        echo "✅ Clé trouvée dans Stripe CLI"
        export STRIPE_SECRET_KEY="$STRIPE_KEY"
    fi
fi

# Si pas de clé CLI, utiliser celle du .env.local
if [ -z "$STRIPE_SECRET_KEY" ] && [ -f .env.local ]; then
    STRIPE_KEY=$(grep "^STRIPE_SECRET_KEY=" .env.local 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')
    if [ -n "$STRIPE_KEY" ] && [ "$STRIPE_KEY" != "sk_test_..." ] && [ "$STRIPE_KEY" != "sk_live_your_secret_key" ]; then
        export STRIPE_SECRET_KEY="$STRIPE_KEY"
        echo "✅ Clé trouvée dans .env.local"
    fi
fi

# Si toujours pas de clé, demander à l'utilisateur
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "⚠️  Aucune clé Stripe trouvée"
    echo ""
    echo "Option 1: Utiliser Stripe CLI"
    echo "  stripe login"
    echo ""
    echo "Option 2: Fournir la clé directement"
    read -p "Entrez votre STRIPE_SECRET_KEY (sk_test_... ou sk_live_...): " STRIPE_KEY
    if [ -n "$STRIPE_KEY" ]; then
        export STRIPE_SECRET_KEY="$STRIPE_KEY"
    else
        echo "❌ Clé non fournie, arrêt"
        exit 1
    fi
fi

echo ""
echo "📦 Création des produits via script TypeScript..."
echo ""

# Exécuter le script TypeScript avec la clé
STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" npx tsx scripts/setup-stripe-pricing-complete.ts
