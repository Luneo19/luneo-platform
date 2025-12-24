#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SCRIPT DE DÉPLOIEMENT AI STUDIO - RÉCUPÈRE DEPUIS VERCEL
# Récupère les variables depuis Vercel si disponibles
# ═══════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SUPABASE_PROJECT_ID="obrijgptqztacolemsbk"
MIGRATION_FILE="apps/frontend/supabase/migrations/ensure_ai_studio_tables.sql"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     DÉPLOIEMENT AI STUDIO - MODE AUTOMATIQUE VERCEL       ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier Vercel
if ! vercel whoami > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Connexion Vercel requise${NC}"
  vercel login
fi

echo -e "${GREEN}✅ Vercel: $(vercel whoami)${NC}"
echo ""

# Charger .env.local si existe
if [ -f "apps/frontend/.env.local" ]; then
  echo -e "${BLUE}📄 Chargement de .env.local...${NC}"
  set -a
  source apps/frontend/.env.local
  set +a
fi

# Récupérer variables depuis Vercel
echo -e "${BLUE}📥 Récupération des variables depuis Vercel...${NC}"

cd apps/frontend

# Créer un .env temporaire depuis Vercel
vercel env pull .env.vercel --environment=production --yes > /dev/null 2>&1 || true

if [ -f ".env.vercel" ]; then
  set -a
  source .env.vercel
  set +a
  echo -e "${GREEN}✅ Variables Vercel chargées${NC}"
  rm -f .env.vercel
fi

cd ../..

# Vérifier variables critiques
MISSING=()

[ -z "$OPENAI_API_KEY" ] && MISSING+=("OPENAI_API_KEY")
[ -z "$REPLICATE_API_TOKEN" ] && MISSING+=("REPLICATE_API_TOKEN")
[ -z "$CLOUDINARY_CLOUD_NAME" ] && MISSING+=("CLOUDINARY_CLOUD_NAME")
[ -z "$CLOUDINARY_API_KEY" ] && MISSING+=("CLOUDINARY_API_KEY")
[ -z "$CLOUDINARY_API_SECRET" ] && MISSING+=("CLOUDINARY_API_SECRET")
[ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] && MISSING+=("NEXT_PUBLIC_SUPABASE_ANON_KEY")
[ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && MISSING+=("SUPABASE_SERVICE_ROLE_KEY")

if [ ${#MISSING[@]} -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Variables manquantes:${NC}"
  for v in "${MISSING[@]}"; do
    echo -e "   • $v"
  done
  echo ""
  echo -e "${CYAN}💡 Ces variables doivent être configurées sur Vercel:${NC}"
  echo -e "${BLUE}   vercel env add [VARIABLE] production${NC}"
  echo ""
  echo -e "${YELLOW}Continuer quand même? (o/N):${NC}"
  read -r response
  if [[ ! "$response" =~ ^[Oo]$ ]]; then
    exit 1
  fi
fi

export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://${SUPABASE_PROJECT_ID}.supabase.co}"

echo ""

# ═══════════════════════════════════════════════════════════════
# 1. MIGRATION SQL (skip si DATABASE_URL non disponible)
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🗄️  Migration SQL...${NC}"

if [ -n "$DATABASE_URL" ] && command -v psql &> /dev/null; then
  echo -e "${CYAN}   Tentative via psql...${NC}"
  if psql "$DATABASE_URL" -f "$MIGRATION_FILE" > /tmp/migration.log 2>&1; then
    echo -e "${GREEN}✅ Migration exécutée${NC}"
  else
    echo -e "${YELLOW}⚠️  Migration manuelle requise${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Migration manuelle requise:${NC}"
  echo -e "${BLUE}   https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 2. CONFIGURATION VERCEL (mise à jour si nécessaire)
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🚀 Configuration Vercel...${NC}"

add_vercel_env() {
  local key=$1
  local value=$2
  local envs=${3:-"production preview"}
  
  [ -z "$value" ] && return
  
  for env in $envs; do
    echo -e "${CYAN}   📝 ${key} (${env})${NC}"
    echo "$value" | vercel env rm "$key" "$env" --yes 2>/dev/null || true
    echo "$value" | vercel env add "$key" "$env" --yes > /dev/null 2>&1 && \
      echo -e "${GREEN}      ✅${NC}" || \
      echo -e "${RED}      ❌${NC}"
  done
}

# Mettre à jour seulement si nouvelles valeurs
if [ -n "$OPENAI_API_KEY" ]; then
  add_vercel_env "OPENAI_API_KEY" "$OPENAI_API_KEY" "production preview"
fi
if [ -n "$REPLICATE_API_TOKEN" ]; then
  add_vercel_env "REPLICATE_API_TOKEN" "$REPLICATE_API_TOKEN" "production preview"
fi
if [ -n "$CLOUDINARY_CLOUD_NAME" ]; then
  add_vercel_env "CLOUDINARY_CLOUD_NAME" "$CLOUDINARY_CLOUD_NAME" "production preview"
fi
if [ -n "$CLOUDINARY_API_KEY" ]; then
  add_vercel_env "CLOUDINARY_API_KEY" "$CLOUDINARY_API_KEY" "production preview"
fi
if [ -n "$CLOUDINARY_API_SECRET" ]; then
  add_vercel_env "CLOUDINARY_API_SECRET" "$CLOUDINARY_API_SECRET" "production preview"
fi
if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  add_vercel_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "production preview"
fi

add_vercel_env "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "production preview development"
if [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  add_vercel_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "production preview development"
fi

[ -n "$UPSTASH_REDIS_REST_URL" ] && add_vercel_env "UPSTASH_REDIS_REST_URL" "$UPSTASH_REDIS_REST_URL" "production preview"
[ -n "$UPSTASH_REDIS_REST_TOKEN" ] && add_vercel_env "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN" "production preview"
[ -n "$SENTRY_DSN" ] && add_vercel_env "SENTRY_DSN" "$SENTRY_DSN" "production preview"
[ -n "$SENTRY_DSN" ] && add_vercel_env "NEXT_PUBLIC_SENTRY_DSN" "$SENTRY_DSN" "production preview development"

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
  tail -30 /tmp/ai-studio-build.log
  exit 1
fi

cd ../..

# ═══════════════════════════════════════════════════════════════
# 4. DÉPLOIEMENT
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🚀 Déploiement Vercel Production...${NC}"
echo ""

cd apps/frontend

if vercel --prod --yes; then
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║           ✅ DÉPLOIEMENT RÉUSSI ! 🎉                        ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${CYAN}🧪 Testez: https://luneo.app/dashboard/ai-studio${NC}"
  echo ""
else
  echo -e "${RED}❌ Déploiement échoué${NC}"
  exit 1
fi

cd ../..

