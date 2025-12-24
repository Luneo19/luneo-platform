#!/bin/bash

# Script simplifié pour configurer les variables Vercel
# Utilise une approche directe sans vérifications complexes

set -e

echo "🚀 CONFIGURATION AUTOMATIQUE VERCEL"
echo "===================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI non installé${NC}"
    echo "Installez: npm i -g vercel"
    exit 1
fi

# Vérifier connexion
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Non connecté à Vercel${NC}"
    echo "Connectez-vous: vercel login"
    exit 1
fi

cd apps/frontend

echo -e "${GREEN}✅ Configuration des variables critiques...${NC}"
echo ""

# Variables Supabase
SUPABASE_URL="https://obrijgptqztacolemsbk.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjYwMjIsImV4cCI6MjA3Njg0MjAyMn0.0dxttYi1WPLuqdkI52a0Rary81wtYdjnBt4F0q4tYV8"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI2NjAyMiwiZXhwIjoyMDc2ODQyMDIyfQ.r8pgz9G88K41Jpseg_vseH9jevqK17zJcNcM6YQR-YE"

# Fonction simple pour ajouter
add_var() {
    local name=$1
    local value=$2
    local env=$3
    
    echo -e "${YELLOW}→ ${name} (${env})${NC}"
    
    # Supprimer si existe
    vercel env rm "${name}" "${env}" --yes 2>/dev/null || true
    
    # Ajouter
    echo "${value}" | vercel env add "${name}" "${env}" 2>&1 | grep -v "Retrieving\|project" || true
    
    echo -e "  ${GREEN}✓${NC}"
}

# Configurer pour les 3 environnements
for env in production preview development; do
    echo -e "\n${GREEN}📦 Configuration ${env}...${NC}"
    
    add_var "NEXT_PUBLIC_SUPABASE_URL" "${SUPABASE_URL}" "${env}"
    add_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "${SUPABASE_ANON_KEY}" "${env}"
    add_var "SUPABASE_SERVICE_ROLE_KEY" "${SUPABASE_SERVICE_KEY}" "${env}"
    add_var "NEXT_PUBLIC_API_URL" "https://backend-luneos-projects.vercel.app/api" "${env}"
    add_var "NEXT_PUBLIC_APP_URL" "https://frontend-luneos-projects.vercel.app" "${env}"
done

echo ""
echo -e "${GREEN}✅ Configuration terminée !${NC}"
echo ""
echo "📋 Variables configurées:"
echo "  ✓ NEXT_PUBLIC_SUPABASE_URL"
echo "  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  ✓ SUPABASE_SERVICE_ROLE_KEY"
echo "  ✓ NEXT_PUBLIC_API_URL"
echo "  ✓ NEXT_PUBLIC_APP_URL"
echo ""
echo "🔄 Redéployez maintenant sur Vercel !"

