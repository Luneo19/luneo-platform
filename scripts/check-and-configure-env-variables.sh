#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# VÉRIFICATION ET CONFIGURATION VARIABLES D'ENVIRONNEMENT VERCEL
# Pour Luneo Platform - Production Ready
# ═══════════════════════════════════════════════════════════════

set -e

echo "🔍 Vérification des variables d'environnement Vercel..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables requises
declare -A REQUIRED_VARS=(
  ["NEXT_PUBLIC_SUPABASE_URL"]="URL Supabase"
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="Clé anonyme Supabase"
  ["SUPABASE_SERVICE_ROLE_KEY"]="Clé service Supabase"
  ["STRIPE_SECRET_KEY"]="Clé secrète Stripe"
  ["STRIPE_PUBLISHABLE_KEY"]="Clé publique Stripe"
  ["STRIPE_WEBHOOK_SECRET"]="Secret webhook Stripe"
  ["OPENAI_API_KEY"]="Clé API OpenAI"
  ["CLOUDINARY_CLOUD_NAME"]="Nom cloud Cloudinary"
  ["CLOUDINARY_API_KEY"]="Clé API Cloudinary"
  ["CLOUDINARY_API_SECRET"]="Secret API Cloudinary"
  ["GOOGLE_CLIENT_ID"]="Client ID Google OAuth"
  ["GOOGLE_CLIENT_SECRET"]="Secret Google OAuth"
  ["GITHUB_CLIENT_ID"]="Client ID GitHub OAuth"
  ["GITHUB_CLIENT_SECRET"]="Secret GitHub OAuth"
  ["MASTER_ENCRYPTION_KEY"]="Clé master chiffrement"
)

# Variables optionnelles
declare -A OPTIONAL_VARS=(
  ["SENDGRID_API_KEY"]="Clé API SendGrid (emails)"
  ["REDIS_URL"]="URL Redis (caching)"
  ["SENTRY_DSN"]="DSN Sentry (monitoring)"
  ["VERCEL_ANALYTICS_ID"]="ID Vercel Analytics"
)

# Charger les variables depuis .env.production.local
if [ -f "apps/frontend/.env.production.local" ]; then
  echo -e "${BLUE}📄 Chargement depuis .env.production.local...${NC}"
  source apps/frontend/.env.production.local
else
  echo -e "${YELLOW}⚠️  Fichier .env.production.local non trouvé${NC}"
fi

# Vérifier les variables requises
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}VARIABLES REQUISES (CRITIQUES)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

MISSING_COUNT=0

for var in "${!REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "${RED}❌ $var${NC} - ${REQUIRED_VARS[$var]} - ${RED}MANQUANTE${NC}"
    ((MISSING_COUNT++))
  else
    # Masquer les 3/4 de la valeur
    value="${!var}"
    visible_length=$((${#value} / 4))
    masked="${value:0:$visible_length}$( printf '%*s' $(( ${#value} - $visible_length )) | tr ' ' '*' )"
    echo -e "${GREEN}✅ $var${NC} - ${masked}"
  fi
done

echo ""

# Vérifier les variables optionnelles
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}VARIABLES OPTIONNELLES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

for var in "${!OPTIONAL_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "${YELLOW}⚠️  $var${NC} - ${OPTIONAL_VARS[$var]} - ${YELLOW}Non configurée${NC}"
  else
    value="${!var}"
    visible_length=$((${#value} / 4))
    masked="${value:0:$visible_length}$( printf '%*s' $(( ${#value} - $visible_length )) | tr ' ' '*' )"
    echo -e "${GREEN}✅ $var${NC} - ${masked}"
  fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Résumé
if [ $MISSING_COUNT -eq 0 ]; then
  echo -e "${GREEN}✅ TOUTES LES VARIABLES REQUISES SONT CONFIGURÉES !${NC}"
  echo ""
  echo -e "${GREEN}🎉 Prêt pour production !${NC}"
else
  echo -e "${RED}❌ $MISSING_COUNT VARIABLE(S) MANQUANTE(S)${NC}"
  echo ""
  echo -e "${YELLOW}⚠️  Action requise:${NC}"
  echo -e "${YELLOW}   1. Aller sur https://vercel.com/luneos-projects/frontend/settings/environment-variables${NC}"
  echo -e "${YELLOW}   2. Ajouter les variables manquantes${NC}"
  echo -e "${YELLOW}   3. Redéployer: npx vercel --prod${NC}"
  exit 1
fi

# Générer MASTER_ENCRYPTION_KEY si manquante
if [ -z "$MASTER_ENCRYPTION_KEY" ]; then
  echo ""
  echo -e "${YELLOW}🔐 Génération de MASTER_ENCRYPTION_KEY...${NC}"
  NEW_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  echo -e "${GREEN}Nouvelle clé générée:${NC} $NEW_KEY"
  echo ""
  echo -e "${YELLOW}⚠️  Ajoutez cette variable sur Vercel:${NC}"
  echo -e "Variable: MASTER_ENCRYPTION_KEY"
  echo -e "Valeur: $NEW_KEY"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Vérification terminée !${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

