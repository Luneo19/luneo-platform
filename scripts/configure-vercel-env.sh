#!/bin/bash

# Script pour configurer les variables d'environnement Vercel
# Usage: ./scripts/configure-vercel-env.sh [production|preview|development]

set -e

ENVIRONMENT=${1:-production}
PROJECT_TYPE=${2:-backend} # backend ou frontend

echo "🚀 Configuration Variables Vercel - $PROJECT_TYPE ($ENVIRONMENT)"
echo "================================================================"
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

# Aller dans le répertoire approprié
if [ "$PROJECT_TYPE" = "backend" ]; then
    cd apps/backend
    PROJECT_NAME="backend"
else
    cd apps/frontend
    PROJECT_NAME="frontend"
fi

# Vérifier que le projet est lié
if [ ! -f .vercel/project.json ]; then
    echo "⚠️  Projet Vercel non lié"
    echo "   Lier le projet: vercel link"
    read -p "Voulez-vous lier le projet maintenant? (oui/non): " link_project
    if [ "$link_project" = "oui" ]; then
        vercel link
    else
        echo "❌ Configuration annulée"
    exit 1
    fi
fi

echo "📋 Configuration des variables pour $PROJECT_TYPE..."
echo ""

# Fonction pour configurer une variable
configure_var() {
    local VAR_NAME=$1
    local VAR_VALUE=$2
    local ENV=$3
    
    if [ -z "$VAR_VALUE" ]; then
        echo "⚠️  $VAR_NAME: valeur vide, ignorée"
        return
    fi
    
    echo "📝 Configuration: $VAR_NAME"
    echo "$VAR_VALUE" | vercel env add "$VAR_NAME" "$ENV" --yes 2>&1 | grep -v "Already exists" || true
    echo "✅ $VAR_NAME configuré"
    echo ""
}

# Variables Backend
if [ "$PROJECT_TYPE" = "backend" ]; then
    echo "🔧 Configuration Backend..."
    echo ""
    
    # Database
    read -p "DATABASE_URL (PostgreSQL): " DATABASE_URL
    configure_var "DATABASE_URL" "$DATABASE_URL" "$ENVIRONMENT"
    
    # Redis
    read -p "REDIS_HOST (ou REDIS_URL): " REDIS_HOST
    if [ -n "$REDIS_HOST" ]; then
        configure_var "REDIS_HOST" "$REDIS_HOST" "$ENVIRONMENT"
    fi
    
    read -p "REDIS_PORT (défaut: 6379): " REDIS_PORT
    configure_var "REDIS_PORT" "${REDIS_PORT:-6379}" "$ENVIRONMENT"
    
    # JWT
    echo "🔐 Génération des clés JWT..."
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    
    configure_var "JWT_SECRET" "$JWT_SECRET" "$ENVIRONMENT"
    configure_var "JWT_REFRESH_SECRET" "$JWT_REFRESH_SECRET" "$ENVIRONMENT"
    configure_var "JWT_EXPIRES_IN" "15m" "$ENVIRONMENT"
    configure_var "JWT_REFRESH_EXPIRES_IN" "7d" "$ENVIRONMENT"
    
    # AWS S3
    read -p "AWS_ACCESS_KEY_ID: " AWS_ACCESS_KEY_ID
    configure_var "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID" "$ENVIRONMENT"
    
    read -p "AWS_SECRET_ACCESS_KEY: " AWS_SECRET_ACCESS_KEY
    configure_var "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY" "$ENVIRONMENT"
    
    read -p "AWS_REGION (ex: eu-west-1): " AWS_REGION
    configure_var "AWS_REGION" "$AWS_REGION" "$ENVIRONMENT"
    
    read -p "AWS_S3_BUCKET: " AWS_S3_BUCKET
    configure_var "AWS_S3_BUCKET" "$AWS_S3_BUCKET" "$ENVIRONMENT"
    
    # App
    read -p "NODE_ENV (production/preview/development): " NODE_ENV
    configure_var "NODE_ENV" "${NODE_ENV:-production}" "$ENVIRONMENT"
    
    read -p "PORT (défaut: 3001): " PORT
    configure_var "PORT" "${PORT:-3001}" "$ENVIRONMENT"
    
    read -p "FRONTEND_URL (ex: https://app.luneo.app): " FRONTEND_URL
    configure_var "FRONTEND_URL" "$FRONTEND_URL" "$ENVIRONMENT"
    
    read -p "CORS_ORIGIN (ex: https://app.luneo.app): " CORS_ORIGIN
    configure_var "CORS_ORIGIN" "$CORS_ORIGIN" "$ENVIRONMENT"
    
    # Stripe (optionnel)
    read -p "STRIPE_SECRET_KEY (optionnel): " STRIPE_SECRET_KEY
    if [ -n "$STRIPE_SECRET_KEY" ]; then
        configure_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" "$ENVIRONMENT"
    fi

# Variables Frontend
else
    echo "🔧 Configuration Frontend..."
echo ""
    
    read -p "NEXT_PUBLIC_API_URL (ex: https://api.luneo.app): " NEXT_PUBLIC_API_URL
    configure_var "NEXT_PUBLIC_API_URL" "$NEXT_PUBLIC_API_URL" "$ENVIRONMENT"
    
    read -p "NEXT_PUBLIC_WIDGET_URL (ex: https://cdn.luneo.app/widget/v1/luneo-widget.iife.js): " NEXT_PUBLIC_WIDGET_URL
    configure_var "NEXT_PUBLIC_WIDGET_URL" "$NEXT_PUBLIC_WIDGET_URL" "$ENVIRONMENT"
    
    read -p "NEXT_PUBLIC_APP_URL (ex: https://app.luneo.app): " NEXT_PUBLIC_APP_URL
    configure_var "NEXT_PUBLIC_APP_URL" "$NEXT_PUBLIC_APP_URL" "$ENVIRONMENT"
fi

echo ""
echo "✅ Configuration terminée pour $PROJECT_TYPE ($ENVIRONMENT)"
echo ""
echo "📋 Pour vérifier les variables:"
echo "   vercel env ls"
