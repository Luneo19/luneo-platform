#!/bin/bash

# Configuration automatique complète Vercel
# Configure toutes les variables nécessaires pour le projet

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 CONFIGURATION AUTOMATIQUE COMPLÈTE VERCEL${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

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

echo -e "${GREEN}✅ Vercel CLI prêt${NC}"
echo ""

# Aller dans le répertoire frontend
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${SCRIPT_DIR}/../apps/frontend" || {
    echo -e "${RED}❌ Répertoire apps/frontend non trouvé${NC}"
    exit 1
}

echo -e "${GREEN}📦 Configuration du projet FRONTEND${NC}"
echo ""

# Variables Supabase (CRITIQUES)
SUPABASE_URL="https://obrijgptqztacolemsbk.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjYwMjIsImV4cCI6MjA3Njg0MjAyMn0.0dxttYi1WPLuqdkI52a0Rary81wtYdjnBt4F0q4tYV8"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI2NjAyMiwiZXhwIjoyMDc2ODQyMDIyfQ.r8pgz9G88K41Jpseg_vseH9jevqK17zJcNcM6YQR-YE"

# Fonction pour configurer une variable
configure_var() {
    local name=$1
    local value=$2
    local env=$3
    
    echo -e "${YELLOW}📝 ${name} (${env})${NC}"
    
    # Supprimer si existe
    vercel env rm "${name}" "${env}" --yes 2>/dev/null || true
    
    # Ajouter
    if echo "${value}" | vercel env add "${name}" "${env}" 2>&1 | grep -q "Added\|already exists"; then
        echo -e "  ${GREEN}✅ Configuré${NC}"
    else
        echo -e "  ${RED}❌ Échec - Ajoutez manuellement${NC}"
        echo "     vercel env add ${name} ${env}"
    fi
}

# Configurer pour chaque environnement
for env in production preview development; do
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Configuration ${env}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Supabase (CRITIQUE)
    configure_var "NEXT_PUBLIC_SUPABASE_URL" "${SUPABASE_URL}" "${env}"
    configure_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "${SUPABASE_ANON_KEY}" "${env}"
    configure_var "SUPABASE_SERVICE_ROLE_KEY" "${SUPABASE_SERVICE_KEY}" "${env}"
    
    # API Backend
    configure_var "NEXT_PUBLIC_API_URL" "https://backend-luneos-projects.vercel.app/api" "${env}"
    
    # App URL
    configure_var "NEXT_PUBLIC_APP_URL" "https://frontend-luneos-projects.vercel.app" "${env}"
done

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ CONFIGURATION TERMINÉE !${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Variables configurées:${NC}"
echo "  ✓ NEXT_PUBLIC_SUPABASE_URL"
echo "  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  ✓ SUPABASE_SERVICE_ROLE_KEY"
echo "  ✓ NEXT_PUBLIC_API_URL"
echo "  ✓ NEXT_PUBLIC_APP_URL"
echo ""
echo -e "${YELLOW}🔄 Prochaines étapes:${NC}"
echo "  1. Redéployez sur Vercel (ou poussez un commit)"
echo "  2. Testez l'inscription: https://frontend-luneos-projects.vercel.app/register"
echo "  3. Testez la connexion: https://frontend-luneos-projects.vercel.app/login"
echo ""

