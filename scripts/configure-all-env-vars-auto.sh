#!/bin/bash

# Script automatique pour configurer TOUTES les variables d'environnement critiques
# Génère des valeurs sécurisées et les configure dans Vercel

set -e

echo "🔧 CONFIGURATION AUTOMATIQUE DES VARIABLES CRITIQUES"
echo "====================================================="
echo ""

cd apps/backend

# Génération de valeurs sécurisées
echo "📝 Génération de valeurs sécurisées..."

# Générer JWT_SECRET (64 caractères base64)
JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n' | head -c 64)
echo "✅ JWT_SECRET généré"

# Générer JWT_REFRESH_SECRET (64 caractères base64)
JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d '\n' | head -c 64)
echo "✅ JWT_REFRESH_SECRET généré"

# REDIS_URL par défaut (Upstash ou localhost)
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
echo "✅ REDIS_URL configuré"

# DATABASE_URL - Demander à l'utilisateur ou utiliser une valeur par défaut
if [ -z "$DATABASE_URL" ]; then
    echo ""
    echo "⚠️  DATABASE_URL est REQUIS pour le backend"
    echo "Format: postgresql://user:password@host:port/database"
    echo ""
    read -p "Entrez votre DATABASE_URL (ou 'skip' pour utiliser une valeur par défaut temporaire): " DATABASE_URL_INPUT
    
    if [ "$DATABASE_URL_INPUT" = "skip" ] || [ -z "$DATABASE_URL_INPUT" ]; then
        echo "⚠️  Utilisation d'une valeur par défaut temporaire"
        echo "⚠️  Vous DEVEZ configurer une vraie DATABASE_URL plus tard"
        DATABASE_URL="postgresql://user:password@localhost:5432/luneo"
    else
        DATABASE_URL="$DATABASE_URL_INPUT"
    fi
fi

echo ""
echo "🔐 Configuration des variables dans Vercel..."
echo ""

# Fonction pour ajouter/mettre à jour une variable
add_or_update_var() {
    local var_name=$1
    local var_value=$2
    local description=$3
    
    echo "  Configuring $var_name..."
    
    # Vérifier si la variable existe déjà
    if vercel env ls production 2>&1 | grep -q "^$var_name"; then
        echo "    ⚠️  Variable existe déjà, mise à jour..."
        echo "$var_value" | vercel env rm "$var_name" production --yes 2>&1 | grep -v "Encrypted" || true
        sleep 1
    fi
    
    # Ajouter la variable
    echo "$var_value" | vercel env add "$var_name" production 2>&1 | grep -v "Encrypted" || {
        echo "    ❌ Erreur lors de la configuration de $var_name"
        return 1
    }
    
    echo "    ✅ $var_name configuré"
    return 0
}

# Configurer les variables critiques
add_or_update_var "DATABASE_URL" "$DATABASE_URL" "URL de connexion PostgreSQL"
add_or_update_var "JWT_SECRET" "$JWT_SECRET" "Secret pour signer les JWT"
add_or_update_var "JWT_REFRESH_SECRET" "$JWT_REFRESH_SECRET" "Secret pour refresh tokens"
add_or_update_var "REDIS_URL" "$REDIS_URL" "URL de connexion Redis"

echo ""
echo "✅ Toutes les variables critiques configurées"
echo ""
echo "📋 Variables configurées:"
echo "  - DATABASE_URL: ${DATABASE_URL:0:30}..."
echo "  - JWT_SECRET: ${JWT_SECRET:0:20}..."
echo "  - JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:0:20}..."
echo "  - REDIS_URL: $REDIS_URL"
echo ""
echo "🚀 Redéploiement du backend..."
echo ""

