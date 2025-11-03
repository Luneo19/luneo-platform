#!/bin/bash

echo "🚀 Déploiement de l'API Luneo - Version Simple"
echo "=============================================="

# Vérifier que l'API fonctionne localement
echo "📋 Test de l'API locale..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ API locale fonctionne"
else
    echo "❌ API locale ne fonctionne pas"
    echo "Lancez d'abord: node api/index.js"
    exit 1
fi

echo ""
echo "🎯 VOTRE API EST PRÊTE !"
echo "========================="
echo ""
echo "📍 URL locale: http://localhost:3000"
echo "📍 Health check: http://localhost:3000/health"
echo "📍 API docs: http://localhost:3000/api"
echo ""
echo "🔧 Endpoints disponibles:"
echo "  - GET  /health                    # Vérification de santé"
echo "  - GET  /api                       # Documentation API"
echo "  - POST /api/auth/login            # Connexion utilisateur"
echo "  - GET  /api/products              # Liste des produits"
echo "  - GET  /api/stripe/products       # Produits Stripe"
echo ""
echo "🧪 Test de connexion:"
echo "curl -X POST http://localhost:3000/api/auth/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"test@example.com\",\"password\":\"password\"}'"
echo ""
echo "✅ Votre API Luneo est opérationnelle !"
echo "Vous pouvez maintenant l'utiliser pour vos tests et intégrations."


