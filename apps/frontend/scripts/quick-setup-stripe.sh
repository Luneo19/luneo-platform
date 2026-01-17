#!/bin/bash

# Script rapide pour configurer et exécuter le setup Stripe

set -e

echo "🚀 Configuration rapide Stripe pour Luneo"
echo "=========================================="
echo ""

# Vérifier si la clé existe déjà
if [ -f .env.local ] && grep -q "STRIPE_SECRET_KEY" .env.local 2>/dev/null; then
    echo "✅ STRIPE_SECRET_KEY trouvée dans .env.local"
    echo ""
    read -p "Voulez-vous utiliser cette clé ? (o/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
        echo "Configuration annulée"
        exit 0
    fi
else
    echo "⚠️  STRIPE_SECRET_KEY non trouvée"
    echo ""
    echo "Pour obtenir votre clé Stripe :"
    echo "1. Allez sur https://dashboard.stripe.com/apikeys"
    echo "2. Créez ou copiez une clé secrète (sk_test_... ou sk_live_...)"
    echo ""
    read -p "Entrez votre STRIPE_SECRET_KEY: " STRIPE_KEY
    
    if [ -z "$STRIPE_KEY" ]; then
        echo "❌ Clé vide, annulation"
        exit 1
    fi
    
    # Ajouter au .env.local
    if [ ! -f .env.local ]; then
        touch .env.local
    fi
    
    # Supprimer l'ancienne clé si elle existe
    sed -i.bak '/^STRIPE_SECRET_KEY=/d' .env.local 2>/dev/null || true
    
    # Ajouter la nouvelle clé
    echo "STRIPE_SECRET_KEY=$STRIPE_KEY" >> .env.local
    echo ""
    echo "✅ Clé ajoutée dans .env.local"
    echo ""
fi

# Exécuter le script
echo "📦 Exécution du script de création des produits Stripe..."
echo ""

npx tsx scripts/setup-stripe-pricing-complete.ts

echo ""
echo "✅ Terminé !"
echo ""
echo "📝 Prochaines étapes :"
echo "1. Copiez les variables d'environnement affichées ci-dessus"
echo "2. Ajoutez-les dans Vercel (Settings > Environment Variables)"
echo "3. Ou ajoutez-les dans .env.local pour le développement"
echo "4. Redéployez l'application"
