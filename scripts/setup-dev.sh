#!/bin/bash

# Script de configuration de l'environnement de développement
# Usage: ./scripts/setup-dev.sh

set -e

echo "🚀 Configuration de l'environnement de développement Luneo Platform..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js 20+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ requis. Version actuelle: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) détecté"

# Vérifier pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installation de pnpm..."
    npm install -g pnpm@8
fi

echo "✅ pnpm $(pnpm -v) détecté"

# Installer les dépendances
echo "📦 Installation des dépendances..."
pnpm install --frozen-lockfile

# Configuration de la base de données
echo "🗄️  Configuration de la base de données..."
cd apps/backend

if [ ! -f .env ]; then
    echo "📝 Création du fichier .env depuis .env.example..."
    cp .env.example .env
    echo "⚠️  Veuillez configurer les variables d'environnement dans apps/backend/.env"
fi

# Générer le client Prisma
echo "🔧 Génération du client Prisma..."
npx prisma generate

# Appliquer les migrations (optionnel, commenté par défaut)
# echo "🔄 Application des migrations..."
# npx prisma migrate dev

cd ../..

# Configuration du frontend
echo "🎨 Configuration du frontend..."
cd apps/frontend

if [ ! -f .env.local ]; then
    echo "📝 Création du fichier .env.local depuis .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env.local
    fi
    echo "⚠️  Veuillez configurer les variables d'environnement dans apps/frontend/.env.local"
fi

cd ../..

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Configurez les variables d'environnement dans apps/backend/.env"
echo "   2. Configurez les variables d'environnement dans apps/frontend/.env.local"
echo "   3. Lancez la base de données: docker-compose up -d (si applicable)"
echo "   4. Appliquez les migrations: cd apps/backend && npx prisma migrate dev"
echo "   5. Démarrez le backend: cd apps/backend && npm run start:dev"
echo "   6. Démarrez le frontend: cd apps/frontend && npm run dev"
echo ""
