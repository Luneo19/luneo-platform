#!/bin/bash

##############################################################################
# LUNEO - Configuration Variables d'Environnement Vercel via CLI
# Configure toutes les variables nécessaires avant le déploiement
##############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo -e "${BLUE}  Configuration Variables d'Environnement Vercel${NC}"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Vérifier que vercel CLI est installé
if ! command -v vercel &> /dev/null; then
  echo -e "${YELLOW}⚠️  Vercel CLI n'est pas installé${NC}"
  echo "Installation..."
  npm install -g vercel
fi

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
  echo "❌ Erreur: package.json non trouvé. Êtes-vous dans apps/frontend ?"
  exit 1
fi

echo -e "${GREEN}✅ Vercel CLI détecté${NC}"
echo ""

# Variables critiques (à remplacer par vos vraies valeurs)
echo "📝 Configuration des variables d'environnement..."
echo ""
echo "⚠️  IMPORTANT: Vous devez remplacer les valeurs placeholder par vos vraies clés !"
echo ""

# Variables Supabase
echo "🔐 Configuration Supabase..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://obrijgptqztacolemsbk.supabase.co" || echo "Variable existe déjà"
vercel env add NEXT_PUBLIC_SUPABASE_SUPABASE_URL preview <<< "https://obrijgptqztacolemsbk.supabase.co" || echo "Variable existe déjà"
vercel env add NEXT_PUBLIC_SUPABASE_URL development <<< "https://obrijgptqztacolemsbk.supabase.co" || echo "Variable existe déjà"

echo ""
echo "⚠️  Vous devez maintenant ajouter manuellement les variables suivantes:"
echo ""
echo "Variables à ajouter via CLI (copier-coller une par une):"
echo ""
echo "# Supabase"
echo 'vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production'
echo 'vercel env add SUPABASE_SERVICE_ROLE_KEY production'
echo ""
echo "# Application"
echo 'vercel env add NEXT_PUBLIC_API_URL production'
echo 'vercel env add NEXT_PUBLIC_APP_URL production'
echo ""
echo "# OAuth"
echo 'vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production'
echo 'vercel env add GOOGLE_CLIENT_SECRET production'
echo 'vercel env add NEXT_PUBLIC_GITHUB_CLIENT_ID production'
echo 'vercel env add GITHUB_CLIENT_SECRET production'
echo ""
echo "# Stripe"
echo 'vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production'
echo 'vercel env add STRIPE_SECRET_KEY production'
echo 'vercel env add STRIPE_WEBHOOK_SECRET production'
echo ""
echo "Pour chaque variable, Vercel vous demandera la valeur."
echo "Copiez-la depuis VARIABLES_VERCEL_COMPLÈTES.md"
echo ""




