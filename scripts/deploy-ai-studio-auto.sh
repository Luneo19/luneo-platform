#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SCRIPT DE DÉPLOIEMENT AI STUDIO - MODE AUTOMATIQUE
# Lit les variables depuis .env.local ou variables d'environnement
# ═══════════════════════════════════════════════════════════════

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SUPABASE_PROJECT_ID="obrijgptqztacolemsbk"
MIGRATION_FILE="apps/frontend/supabase/migrations/ensure_ai_studio_tables.sql"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     DÉPLOIEMENT AI STUDIO - MODE AUTOMATIQUE                ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Charger .env.local si existe
if [ -f "apps/frontend/.env.local" ]; then
  echo -e "${BLUE}📄 Chargement de .env.local...${NC}"
  export $(grep -v '^#' apps/frontend/.env.local | xargs)
fi

# Vérifier variables obligatoires
MISSING_VARS=()

check_var() {
  local var=$1
  local name=$2
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$name")
  fi
}

check_var "OPENAI_API_KEY" "OPENAI_API_KEY"
check_var "REPLICATE_API_TOKEN" "REPLICATE_API_TOKEN"
check_var "CLOUDINARY_CLOUD_NAME" "CLOUDINARY_CLOUD_NAME"
check_var "CLOUDINARY_API_KEY" "CLOUDINARY_API_KEY"
check_var "CLOUDINARY_API_SECRET" "CLOUDINARY_API_SECRET"
check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_var "SUPABASE_SERVICE_ROLE_KEY" "SUPABASE_SERVICE_ROLE_KEY"

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo -e "${RED}❌ Variables manquantes:${NC}"
  for var in "${MISSING_VARS[@]}"; do
    echo -e "   • $var"
  done
  echo ""
  echo -e "${YELLOW}💡 Ajoutez-les dans apps/frontend/.env.local ou exportez-les${NC}"
  exit 1
fi

# Définir valeurs par défaut
export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://${SUPABASE_PROJECT_ID}.supabase.co}"

echo -e "${GREEN}✅ Toutes les variables requises sont présentes${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. MIGRATION SQL
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🗄️  Migration SQL...${NC}"

# Afficher instructions pour migration manuelle
echo -e "${CYAN}   📋 Instructions pour la migration:${NC}"
echo -e "${BLUE}   1. Ouvrez: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new${NC}"
echo -e "${BLUE}   2. Copiez le contenu de: ${MIGRATION_FILE}${NC}"
echo -e "${BLUE}   3. Collez et exécutez${NC}"
echo ""
echo -e "${YELLOW}   ⚠️  La migration doit être exécutée manuellement${NC}"
echo -e "${YELLOW}      (Supabase ne permet pas l'exécution SQL via API REST)${NC}"
echo ""
read -p "Appuyez sur Entrée une fois la migration exécutée..." || true
echo ""

# ═══════════════════════════════════════════════════════════════
# 2. CONFIGURATION VERCEL
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🚀 Configuration Vercel...${NC}"

if ! vercel whoami > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Non connecté à Vercel${NC}"
  vercel login
fi

echo -e "${GREEN}✅ Connecté à Vercel: $(vercel whoami)${NC}"
echo ""

# Fonction pour ajouter variable Vercel
add_vercel_env() {
  local key=$1
  local value=$2
  local environments=${3:-"production preview development"}
  
  if [ -z "$value" ]; then
    echo -e "${YELLOW}⚠️  ${key} vide, ignorée${NC}"
    return
  fi
  
  for env in $environments; do
    echo -e "${CYAN}   📝 ${key} (${env})${NC}"
    echo "$value" | vercel env rm "$key" "$env" --yes 2>/dev/null || true
    echo "$value" | vercel env add "$key" "$env" --yes > /dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}      ✅${NC}"
    else
      echo -e "${RED}      ❌${NC}"
    fi
  done
}

# Variables publiques
add_vercel_env "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "production preview development"
add_vercel_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "production preview development"

if [ -n "$SENTRY_DSN" ]; then
  add_vercel_env "NEXT_PUBLIC_SENTRY_DSN" "$SENTRY_DSN" "production preview development"
fi

# Variables privées
add_vercel_env "OPENAI_API_KEY" "$OPENAI_API_KEY"
add_vercel_env "REPLICATE_API_TOKEN" "$REPLICATE_API_TOKEN"
add_vercel_env "CLOUDINARY_CLOUD_NAME" "$CLOUDINARY_CLOUD_NAME"
add_vercel_env "CLOUDINARY_API_KEY" "$CLOUDINARY_API_KEY"
add_vercel_env "CLOUDINARY_API_SECRET" "$CLOUDINARY_API_SECRET"
add_vercel_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"

if [ -n "$UPSTASH_REDIS_REST_URL" ]; then
  add_vercel_env "UPSTASH_REDIS_REST_URL" "$UPSTASH_REDIS_REST_URL"
  add_vercel_env "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN"
fi

if [ -n "$SENTRY_DSN" ]; then
  add_vercel_env "SENTRY_DSN" "$SENTRY_DSN"
fi

echo ""
echo -e "${GREEN}✅ Variables Vercel configurées${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# 3. BUILD
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🔨 Build...${NC}"

cd apps/frontend

pnpm install --no-frozen-lockfile > /dev/null 2>&1 || pnpm install

if pnpm run build > /tmp/ai-studio-build.log 2>&1; then
  echo -e "${GREEN}✅ Build réussi${NC}"
else
  echo -e "${RED}❌ Build échoué${NC}"
  tail -20 /tmp/ai-studio-build.log
  exit 1
fi

cd ../..

# ═══════════════════════════════════════════════════════════════
# 4. DÉPLOIEMENT
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🚀 Déploiement Vercel...${NC}"
echo ""

cd apps/frontend

if vercel --prod --yes; then
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║           ✅ DÉPLOIEMENT RÉUSSI ! 🎉                        ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${CYAN}🧪 Testez: https://luneo.app/dashboard/ai-studio${NC}"
else
  echo -e "${RED}❌ Déploiement échoué${NC}"
  exit 1
fi

cd ../..









