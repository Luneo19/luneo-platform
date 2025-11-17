#!/bin/bash

# Script de configuration automatique complète pour Vercel
# Configure toutes les variables d'environnement nécessaires

set -e

echo "🚀 CONFIGURATION AUTOMATIQUE COMPLÈTE VERCEL"
echo "============================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI n'est pas installé${NC}"
    echo "Installez-le avec: npm i -g vercel"
    exit 1
fi

# Vérifier que l'utilisateur est connecté
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Vous n'êtes pas connecté à Vercel${NC}"
    echo "Connectez-vous avec: vercel login"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI détecté${NC}"
echo ""

# Fonction pour ajouter une variable d'environnement
add_env_var() {
    local var_name=$1
    local var_value=$2
    local env_type=$3
    
    echo -e "${YELLOW}📝 Configuration: ${var_name} (${env_type})${NC}"
    
    # Essayer de supprimer d'abord si elle existe
    vercel env rm "${var_name}" "${env_type}" --yes 2>/dev/null || true
    
    # Ajouter la variable (utiliser echo avec pipe)
    if echo "${var_value}" | vercel env add "${var_name}" "${env_type}" 2>&1 | grep -q "Added"; then
        echo -e "  ${GREEN}✅ Succès${NC}"
        return 0
    else
        # Si échec, essayer avec input interactif
        echo -e "  ${YELLOW}⚠️  Tentative alternative...${NC}"
        if vercel env add "${var_name}" "${env_type}" <<< "${var_value}" 2>&1 | grep -q "Added\|already exists"; then
            echo -e "  ${GREEN}✅ Succès${NC}"
            return 0
        else
            echo -e "  ${RED}❌ Échec - Ajoutez manuellement:${NC}"
            echo -e "     vercel env add ${var_name} ${env_type}"
            echo -e "     Valeur: ${var_value}"
            return 1
        fi
    fi
}

# Aller dans le répertoire frontend
cd apps/frontend

echo -e "${GREEN}📦 Configuration du projet FRONTEND${NC}"
echo ""

# Variables Supabase (CRITIQUES)
echo -e "${YELLOW}🔐 Configuration Supabase...${NC}"
SUPABASE_URL="${SUPABASE_URL:-https://obrijgptqztacolemsbk.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjYwMjIsImV4cCI6MjA3Njg0MjAyMn0.0dxttYi1WPLuqdkI52a0Rary81wtYdjnBt4F0q4tYV8}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI2NjAyMiwiZXhwIjoyMDc2ODQyMDIyfQ.r8pgz9G88K41Jpseg_vseH9jevqK17zJcNcM6YQR-YE}"

for env in production preview development; do
    add_env_var "NEXT_PUBLIC_SUPABASE_URL" "${SUPABASE_URL}" "${env}"
    add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "${SUPABASE_ANON_KEY}" "${env}"
    add_env_var "SUPABASE_SERVICE_ROLE_KEY" "${SUPABASE_SERVICE_KEY}" "${env}"
done

# Variables API Backend
echo ""
echo -e "${YELLOW}🔗 Configuration API Backend...${NC}"
BACKEND_URL="${BACKEND_URL:-https://backend-luneos-projects.vercel.app/api}"

for env in production preview development; do
    add_env_var "NEXT_PUBLIC_API_URL" "${BACKEND_URL}" "${env}"
done

# Variables Application
echo ""
echo -e "${YELLOW}🌐 Configuration Application...${NC}"
APP_URL="${APP_URL:-https://frontend-luneos-projects.vercel.app}"

for env in production preview development; do
    add_env_var "NEXT_PUBLIC_APP_URL" "${APP_URL}" "${env}"
done

# Variables optionnelles (si définies)
echo ""
echo -e "${YELLOW}⚙️  Configuration Variables Optionnelles...${NC}"

# Cloudinary (si disponible)
if [ -n "${CLOUDINARY_URL}" ]; then
    for env in production preview development; do
        add_env_var "NEXT_PUBLIC_CLOUDINARY_URL" "${CLOUDINARY_URL}" "${env}"
    done
fi

# Stripe (si disponible)
if [ -n "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}" ]; then
    for env in production preview development; do
        add_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}" "${env}"
    done
fi

# Sentry (si disponible)
if [ -n "${NEXT_PUBLIC_SENTRY_DSN}" ]; then
    for env in production preview development; do
        add_env_var "NEXT_PUBLIC_SENTRY_DSN" "${NEXT_PUBLIC_SENTRY_DSN}" "${env}"
    done
fi

echo ""
echo -e "${GREEN}✅ Configuration terminée !${NC}"
echo ""
echo -e "${YELLOW}📋 Résumé des variables configurées:${NC}"
echo "  ✅ NEXT_PUBLIC_SUPABASE_URL"
echo "  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  ✅ SUPABASE_SERVICE_ROLE_KEY"
echo "  ✅ NEXT_PUBLIC_API_URL"
echo "  ✅ NEXT_PUBLIC_APP_URL"
echo ""
echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
echo "  1. Redéployez l'application sur Vercel"
echo "  2. Testez l'inscription: https://frontend-luneos-projects.vercel.app/register"
echo "  3. Testez la connexion: https://frontend-luneos-projects.vercel.app/login"
echo ""

