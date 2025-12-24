#!/bin/bash
# Script pour ajouter STRIPE_WEBHOOK_SECRET dans Vercel
# Utilisez: vercel env add STRIPE_WEBHOOK_SECRET production

echo "Pour ajouter le webhook secret dans Vercel:"
echo "1. Exécutez: vercel env add STRIPE_WEBHOOK_SECRET production"
echo "2. Collez le secret (whsec_...)"
echo ""
echo "Ou via le dashboard Vercel:"
echo "1. Allez dans Settings > Environment Variables"
echo "2. Ajoutez STRIPE_WEBHOOK_SECRET"
echo "3. Valeur: (récupérez depuis https://dashboard.stripe.com/webhooks)"
