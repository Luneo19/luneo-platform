#!/bin/bash

##############################################################################
# LUNEO - Ajout Automatique Variables Vercel
# Ajoute toutes les variables d'environnement via CLI
##############################################################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Ajout Variables d'Environnement Vercel${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo -e "${YELLOW}⚠️  Installation de Vercel CLI...${NC}"
  npm install -g vercel
fi

echo -e "${GREEN}✅ Vercel CLI prêt${NC}"
echo ""

# Fonction pour ajouter une variable
add_env_var() {
  local var_name=$1
  local var_value=$2
  local env_type=${3:-production}
  
  echo -e "${BLUE}📝 Ajout: ${var_name} (${env_type})${NC}"
  
  # Vérifier si la variable existe déjà
  if vercel env ls | grep -q "^${var_name}"; then
    echo -e "${YELLOW}  ⚠️  Variable existe déjà, mise à jour...${NC}"
    echo "$var_value" | vercel env rm "$var_name" "$env_type" --yes 2>/dev/null || true
  fi
  
  echo "$var_value" | vercel env add "$var_name" "$env_type" <<< "$var_value" || {
    echo -e "${YELLOW}  ⚠️  Échec, ajout manuel requis${NC}"
    echo "  Commande: vercel env add $var_name $env_type"
    echo "  Valeur: $var_value"
  }
}

# Variables Supabase (CRITIQUES)
echo -e "${GREEN}🔐 Configuration Supabase...${NC}"
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "https://obrijgptqztacolemsbk.supabase.co" "production"
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "https://obrijgptqztacolemsbk.supabase.co" "preview"
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "https://obrijgptqztacolemsbk.supabase.co" "development"

echo ""
echo -e "${YELLOW}⚠️  Variables suivantes nécessitent vos vraies valeurs:${NC}"
echo ""
echo "Pour ajouter manuellement, exécutez:"
echo ""
echo "# Supabase"
echo 'vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production'
echo 'vercel env add SUPABASE_SERVICE_ROLE_KEY production'
echo ""
echo "# Application"
echo 'vercel env add NEXT_PUBLIC_API_URL production <<< "https://app.luneo.app/api"'
echo 'vercel env add NEXT_PUBLIC_APP_URL production <<< "https://app.luneo.app"'
echo ""
echo "# OAuth Google"
echo 'vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production <<< "212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com"'
echo 'vercel env add GOOGLE_CLIENT_SECRET production <<< "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"'
echo ""
echo "# OAuth GitHub"
echo 'vercel env add NEXT_PUBLIC_GITHUB_CLIENT_ID production <<< "Ov23liJmVOHyn8tfxgLi"'
echo 'vercel env add GITHUB_CLIENT_SECRET production <<< "81bbea63bfc5651e048e5e7f62f69c5d4aad55f9"'
echo ""
echo "# Stripe (remplacer par vos vraies clés)"
echo 'vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production'
echo 'vercel env add STRIPE_SECRET_KEY production'
echo 'vercel env add STRIPE_WEBHOOK_SECRET production'
echo ""

echo -e "${GREEN}✅ Configuration de base terminée${NC}"
echo ""
echo "📄 Pour la liste complète, voir: VARIABLES_VERCEL_COMPLÈTES.md"
echo ""




