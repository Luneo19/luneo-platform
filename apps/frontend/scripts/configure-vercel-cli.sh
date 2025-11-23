#!/bin/bash

##############################################################################
# Configuration Vercel via CLI
# Configure le Root Directory et les variables d'environnement
##############################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd /Users/emmanuelabougadous/luneo-platform/apps/frontend

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Configuration Vercel via CLI${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo -e "${YELLOW}⚠️  Installation de Vercel CLI...${NC}"
  npm install -g vercel
fi

echo -e "${GREEN}✅ Vercel CLI prêt${NC}"
echo ""

# Vérifier la connexion
echo "🔐 Vérification de la connexion..."
vercel whoami || {
  echo -e "${YELLOW}⚠️  Non connecté. Connexion requise...${NC}"
  vercel login
}

echo ""
echo "📋 Configuration du projet..."
echo ""

# Lier le projet si nécessaire
if [ ! -f ".vercel/project.json" ]; then
  echo "🔗 Liaison du projet..."
  vercel link --yes
fi

echo ""
echo -e "${BLUE}📝 Configuration des variables d'environnement...${NC}"
echo ""

# Fonction pour ajouter une variable
add_env() {
  local name=$1
  local value=$2
  local envs=${3:-"production preview development"}
  
  echo -e "${GREEN}📝 Ajout: ${name}${NC}"
  for env in $envs; do
    echo "$value" | vercel env add "$name" "$env" 2>/dev/null && echo "  ✅ $env" || echo "  ⚠️  $env (existe déjà ou erreur)"
  done
}

# Variables Supabase
echo "🔐 Supabase..."
add_env "NEXT_PUBLIC_SUPABASE_URL" "https://obrijgptqztacolemsbk.supabase.co"
add_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjYwMjIsImV4cCI6MjA3Njg0MjAyMn0.0dxttYi1WPLuqdkI52a0Rary81wtYdjnBt4F0q4tYV8"
add_env "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI2NjAyMiwiZXhwIjoyMDc2ODQyMDIyfQ.r8pgz9G88K41Jpseg_vseH9jevqK17zJcNcM6YQR-YE"

# Variables Application
echo ""
echo "🌐 Application..."
add_env "NEXT_PUBLIC_API_URL" "https://app.luneo.app/api"
add_env "NEXT_PUBLIC_APP_URL" "https://app.luneo.app"

# Variables OAuth
echo ""
echo "🔑 OAuth Google..."
add_env "NEXT_PUBLIC_GOOGLE_CLIENT_ID" "212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com"
add_env "GOOGLE_CLIENT_SECRET" "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"

echo ""
echo "🔑 OAuth GitHub..."
add_env "NEXT_PUBLIC_GITHUB_CLIENT_ID" "Ov23liJmVOHyn8tfxgLi"
add_env "GITHUB_CLIENT_SECRET" "81bbea63bfc5651e048e5e7f62f69c5d4aad55f9"

echo ""
echo -e "${YELLOW}⚠️  Variables Stripe nécessitent vos vraies clés:${NC}"
echo "  vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production preview development"
echo "  vercel env add STRIPE_SECRET_KEY production preview development"
echo "  vercel env add STRIPE_WEBHOOK_SECRET production preview development"
echo ""

echo -e "${GREEN}✅ Configuration terminée !${NC}"
echo ""
echo "📋 Pour voir toutes les variables: vercel env ls"
echo ""




