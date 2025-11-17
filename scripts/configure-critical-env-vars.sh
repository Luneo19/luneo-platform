#!/bin/bash

# Script pour configurer les variables d'environnement critiques
# Objectif: Résoudre FUNCTION_INVOCATION_FAILED

set -e

echo "🔧 CONFIGURATION DES VARIABLES CRITIQUES"
echo "========================================"
echo ""
echo "Ce script va vous guider pour configurer les variables critiques"
echo "nécessaires au démarrage du backend."
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd apps/backend

# Fonction pour ajouter une variable
add_env_var() {
    local var_name=$1
    local description=$2
    local is_secret=$3
    
    echo ""
    echo -e "${YELLOW}Variable: $var_name${NC}"
    echo "Description: $description"
    
    if [ "$is_secret" = "true" ]; then
        echo -e "${RED}⚠️  Cette variable est sensible. Ne la partagez jamais.${NC}"
    fi
    
    read -p "Valeur pour $var_name (ou 'skip' pour ignorer): " var_value
    
    if [ "$var_value" = "skip" ] || [ -z "$var_value" ]; then
        echo -e "${YELLOW}⚠️  Variable $var_name ignorée${NC}"
        return 1
    fi
    
    echo "Configuration de $var_name..."
    vercel env add "$var_name" production <<< "$var_value" 2>&1 | grep -v "Encrypted" || true
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $var_name configurée${NC}"
        return 0
    else
        echo -e "${RED}❌ Erreur lors de la configuration de $var_name${NC}"
        return 1
    fi
}

echo "📋 VARIABLES CRITIQUES À CONFIGURER"
echo "===================================="
echo ""
echo "1. DATABASE_URL - URL de connexion PostgreSQL"
echo "   Format: postgresql://user:password@host:port/database"
echo ""
echo "2. JWT_SECRET - Secret pour signer les JWT (minimum 32 caractères)"
echo "   Générer avec: openssl rand -base64 32"
echo ""
echo "3. JWT_REFRESH_SECRET - Secret pour refresh tokens (minimum 32 caractères)"
echo "   Générer avec: openssl rand -base64 32"
echo ""
echo "4. REDIS_URL - URL de connexion Redis (optionnel mais recommandé)"
echo "   Format: redis://host:port ou redis://:password@host:port"
echo "   Valeur par défaut: redis://localhost:6379"
echo ""

read -p "Voulez-vous configurer ces variables maintenant? (o/n): " confirm

if [ "$confirm" != "o" ] && [ "$confirm" != "O" ]; then
    echo "Configuration annulée."
    exit 0
fi

# Variables critiques
add_env_var "DATABASE_URL" "URL de connexion PostgreSQL (ESSENTIEL)" "true"
add_env_var "JWT_SECRET" "Secret pour signer les JWT (ESSENTIEL, min 32 chars)" "true"
add_env_var "JWT_REFRESH_SECRET" "Secret pour refresh tokens (ESSENTIEL, min 32 chars)" "true"
add_env_var "REDIS_URL" "URL de connexion Redis (Important)" "true"

echo ""
echo "✅ Configuration terminée"
echo ""
echo "📋 PROCHAINES ÉTAPES:"
echo "1. Redéployer le backend: cd apps/backend && vercel --prod"
echo "2. Vérifier les logs: vercel logs production"
echo "3. Tester les routes: curl https://backend-luneos-projects.vercel.app/health"
echo ""

