#!/bin/bash

##############################################################################
# LUNEO - Ajout Complet Variables Vercel
# Ajoute toutes les variables d'environnement avec les valeurs
##############################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd /Users/emmanuelabougadous/luneo-platform/apps/frontend

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Configuration Variables d'Environnement Vercel${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Fonction pour ajouter une variable pour tous les environnements
add_var() {
  local name=$1
  local value=$2
  
  echo -e "${GREEN}📝 Ajout: ${name}${NC}"
  
  for env in production preview development; do
    echo "$value" | vercel env add "$name" "$env" 2>/dev/null && echo "  ✅ $env" || echo "  ⚠️  $env (existe déjà ou erreur)"
  done
  echo ""
}

# Variables Supabase
echo -e "${BLUE}🔐 Configuration Supabase...${NC}"
add_var "NEXT_PUBLIC_SUPABASE_URL" "https://obrijgptqztacolemsbk.supabase.co"
add_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjYwMjIsImV4cCI6MjA3Njg0MjAyMn0.0dxttYi1WPLuqdkI52a0Rary81wtYdjnBt4F0q4tYV8"
add_var "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI2NjAyMiwiZXhwIjoyMDc2ODQyMDIyfQ.r8pgz9G88K41Jpseg_vseH9jevqK17zJcNcM6YQR-YE"

# Variables Application
echo -e "${BLUE}🌐 Configuration Application...${NC}"
add_var "NEXT_PUBLIC_API_URL" "https://app.luneo.app/api"
add_var "NEXT_PUBLIC_APP_URL" "https://app.luneo.app"

# Variables OAuth Google
echo -e "${BLUE}🔑 Configuration OAuth Google...${NC}"
add_var "NEXT_PUBLIC_GOOGLE_CLIENT_ID" "212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com"
add_var "GOOGLE_CLIENT_SECRET" "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"

# Variables OAuth GitHub
echo -e "${BLUE}🔑 Configuration OAuth GitHub...${NC}"
add_var "NEXT_PUBLIC_GITHUB_CLIENT_ID" "Ov23liJmVOHyn8tfxgLi"
add_var "GITHUB_CLIENT_SECRET" "81bbea63bfc5651e048e5e7f62f69c5d4aad55f9"

# Variables Stripe (⚠️ À remplacer par vos vraies clés)
echo -e "${YELLOW}💳 Configuration Stripe...${NC}"
echo -e "${YELLOW}⚠️  ATTENTION: Remplacez les valeurs par vos vraies clés Stripe !${NC}"
echo ""
echo "Pour ajouter Stripe manuellement:"
echo "  vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production"
echo "  vercel env add STRIPE_SECRET_KEY production"
echo "  vercel env add STRIPE_WEBHOOK_SECRET production"
echo ""

echo -e "${GREEN}✅ Variables critiques configurées !${NC}"
echo ""
echo "📋 Pour voir toutes les variables: vercel env ls"
echo ""




