#!/bin/bash

# Script d'installation des dépendances pour l'implémentation complète
# Usage: ./scripts/install-dependencies.sh

set -e

echo "🚀 Installation des dépendances pour Luneo Platform..."

# Backend dependencies
echo "📦 Installation des dépendances backend..."
cd apps/backend
npm install speakeasy@^2.0.0 qrcode@^1.5.3
npm install --save-dev @types/speakeasy@^2.0.10 @types/qrcode@^1.5.5
cd ../..

# Frontend dependencies (si nécessaire)
echo "📦 Vérification des dépendances frontend..."
cd apps/frontend
# Aucune dépendance supplémentaire nécessaire pour le frontend
cd ../..

echo "✅ Dépendances installées avec succès!"
echo ""
echo "Prochaines étapes:"
echo "1. Exécuter la migration Prisma: cd apps/backend && npx prisma migrate dev"
echo "2. Générer le client Prisma: npx prisma generate"
echo "3. Redémarrer les serveurs de développement"
