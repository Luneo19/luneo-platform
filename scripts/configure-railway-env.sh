#!/bin/bash

# Script pour configurer les variables d'environnement Railway
# Usage: ./scripts/configure-railway-env.sh

set -e

echo "🚀 Configuration Variables Railway - Backend"
echo "=============================================="
echo ""

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI non installé"
    echo "   Installation: npm i -g @railway/cli"
    exit 1
fi

# Vérifier connexion
if ! railway whoami &> /dev/null; then
    echo "❌ Non connecté à Railway"
    echo "   Exécuter: railway login"
    exit 1
fi

echo "✅ Railway CLI connecté: $(railway whoami)"
echo ""

cd apps/backend

# Vérifier que le projet est lié
if ! railway status &> /dev/null; then
    echo "⚠️  Projet Railway non lié"
    echo "   Lier le projet: railway link"
    read -p "Voulez-vous lier le projet maintenant? (oui/non): " link_project
    if [ "$link_project" = "oui" ]; then
        railway link
    else
        echo "❌ Configuration annulée"
        exit 1
    fi
fi

echo "📋 Configuration des variables Railway..."
echo ""

# Fonction pour configurer une variable
configure_var() {
    local VAR_NAME=$1
    local VAR_VALUE=$2
    
    if [ -z "$VAR_VALUE" ]; then
        echo "⚠️  $VAR_NAME: valeur vide, ignorée"
        return
    fi
    
    echo "📝 Configuration: $VAR_NAME"
    echo "$VAR_VALUE" | railway variables set "$VAR_NAME" 2>&1 || true
    echo "✅ $VAR_NAME configuré"
    echo ""
}

# Database (Railway génère automatiquement DATABASE_URL si PostgreSQL ajouté)
echo "💡 Note: DATABASE_URL est généré automatiquement si PostgreSQL est ajouté"
echo "   Pour utiliser: railway variables set DATABASE_URL=\${{Postgres.DATABASE_URL}}"
echo ""

# Redis
read -p "REDIS_HOST (ou utiliser Railway Redis service): " REDIS_HOST
if [ -n "$REDIS_HOST" ]; then
    configure_var "REDIS_HOST" "$REDIS_HOST"
else
    echo "💡 Pour utiliser Railway Redis: railway variables set REDIS_HOST=\${{Redis.REDIS_HOST}}"
fi

read -p "REDIS_PORT (défaut: 6379): " REDIS_PORT
configure_var "REDIS_PORT" "${REDIS_PORT:-6379}"

# JWT
echo "🔐 Génération des clés JWT..."
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')

configure_var "JWT_SECRET" "$JWT_SECRET"
configure_var "JWT_REFRESH_SECRET" "$JWT_REFRESH_SECRET"
configure_var "JWT_EXPIRES_IN" "15m"
configure_var "JWT_REFRESH_EXPIRES_IN" "7d"

# AWS S3
read -p "AWS_ACCESS_KEY_ID: " AWS_ACCESS_KEY_ID
configure_var "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"

read -p "AWS_SECRET_ACCESS_KEY: " AWS_SECRET_ACCESS_KEY
configure_var "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"

read -p "AWS_REGION (ex: eu-west-1): " AWS_REGION
configure_var "AWS_REGION" "$AWS_REGION"

read -p "AWS_S3_BUCKET: " AWS_S3_BUCKET
configure_var "AWS_S3_BUCKET" "$AWS_S3_BUCKET"

# App
configure_var "NODE_ENV" "production"
configure_var "PORT" "3001"

read -p "FRONTEND_URL (ex: https://app.luneo.app): " FRONTEND_URL
configure_var "FRONTEND_URL" "$FRONTEND_URL"

read -p "CORS_ORIGIN (ex: https://app.luneo.app): " CORS_ORIGIN
configure_var "CORS_ORIGIN" "$CORS_ORIGIN"

# Stripe (optionnel)
read -p "STRIPE_SECRET_KEY (optionnel): " STRIPE_SECRET_KEY
if [ -n "$STRIPE_SECRET_KEY" ]; then
    configure_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
fi

echo ""
echo "✅ Configuration terminée"
echo ""
echo "📋 Pour vérifier les variables:"
echo "   railway variables"


