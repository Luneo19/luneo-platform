#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SCRIPT COMPLET DE DÉPLOIEMENT AI STUDIO
# Automatise: Migration SQL + Variables Vercel + Déploiement
# ═══════════════════════════════════════════════════════════════

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
MIGRATION_FILE="apps/frontend/supabase/migrations/ensure_ai_studio_tables.sql"
SUPABASE_PROJECT_ID="obrijgptqztacolemsbk"
SUPABASE_API_URL="https://${SUPABASE_PROJECT_ID}.supabase.co"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     DÉPLOIEMENT AI STUDIO - AUTOMATISATION COMPLÈTE        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. VÉRIFICATIONS PRÉLIMINAIRES
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}📋 Vérifications préliminaires...${NC}"

# Vérifier répertoire
if [ ! -f "apps/frontend/package.json" ]; then
  echo -e "${RED}❌ Veuillez exécuter ce script depuis la racine du projet${NC}"
  exit 1
fi

# Vérifier fichier migration
if [ ! -f "$MIGRATION_FILE" ]; then
  echo -e "${RED}❌ Fichier de migration introuvable: $MIGRATION_FILE${NC}"
  exit 1
fi

# Vérifier connexion Vercel
if ! vercel whoami > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Non connecté à Vercel${NC}"
  echo -e "${YELLOW}   Connexion en cours...${NC}"
  vercel login
fi

echo -e "${GREEN}✅ Vercel: $(vercel whoami)${NC}"

# Vérifier Supabase CLI (optionnel)
if command -v supabase &> /dev/null; then
  echo -e "${GREEN}✅ Supabase CLI détecté${NC}"
  HAS_SUPABASE_CLI=true
else
  echo -e "${YELLOW}⚠️  Supabase CLI non installé (on utilisera l'API REST)${NC}"
  HAS_SUPABASE_CLI=false
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 2. EXÉCUTION MIGRATION SQL
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🗄️  Exécution de la migration SQL...${NC}"

# Méthode 1: Via Supabase CLI (si disponible)
if [ "$HAS_SUPABASE_CLI" = true ]; then
  echo -e "${CYAN}   Utilisation de Supabase CLI...${NC}"
  
  # Vérifier si on est lié à un projet
  if supabase projects list > /dev/null 2>&1; then
    echo -e "${CYAN}   Exécution via CLI...${NC}"
    # Note: Supabase CLI nécessite une configuration spécifique
    # Pour l'instant, on passe à la méthode manuelle
    echo -e "${YELLOW}⚠️  Supabase CLI nécessite une configuration de projet${NC}"
    HAS_SUPABASE_CLI=false
  else
    HAS_SUPABASE_CLI=false
  fi
fi

# Méthode 2: Via script dédié
if [ "$HAS_SUPABASE_CLI" = false ]; then
  echo -e "${CYAN}   Utilisation du script de migration dédié...${NC}"
  
  # Exécuter le script de migration
  if [ -f "scripts/execute-supabase-migration.sh" ]; then
    bash scripts/execute-supabase-migration.sh
  else
    echo -e "${YELLOW}⚠️  Script de migration introuvable${NC}"
    echo -e "${CYAN}   Exécution manuelle requise:${NC}"
    echo -e "${BLUE}   1. Allez sur: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new${NC}"
    echo -e "${BLUE}   2. Copiez le contenu de: ${MIGRATION_FILE}${NC}"
    echo -e "${BLUE}   3. Collez et exécutez${NC}"
    echo ""
    read -p "Appuyez sur Entrée une fois la migration exécutée..."
  fi
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 3. COLLECTE DES VARIABLES D'ENVIRONNEMENT
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🔐 Configuration des variables d'environnement...${NC}"
echo ""

# Fonction pour lire une variable avec cache
read_env_var() {
  local key=$1
  local description=$2
  local is_secret=${3:-false}
  local default_value=$4
  
  # Vérifier si déjà définie
  if [ -n "${!key}" ]; then
    echo -e "${GREEN}✅ ${key} déjà définie${NC}"
    return
  fi
  
  # Lire depuis .env.local si existe
  if [ -f "apps/frontend/.env.local" ]; then
    local value=$(grep "^${key}=" apps/frontend/.env.local | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [ -n "$value" ]; then
      eval "export ${key}=\"${value}\""
      echo -e "${GREEN}✅ ${key} chargée depuis .env.local${NC}"
      return
    fi
  fi
  
  # Demander à l'utilisateur
  if [ "$is_secret" = true ]; then
    read -sp "${CYAN}${description}${NC}: " value
    echo ""
  else
    if [ -n "$default_value" ]; then
      read -p "${CYAN}${description} [${default_value}]:${NC} " value
      value=${value:-$default_value}
    else
      read -p "${CYAN}${description}:${NC} " value
    fi
  fi
  
  if [ -n "$value" ]; then
    eval "export ${key}=\"${value}\""
  fi
}

# Variables obligatoires
read_env_var "OPENAI_API_KEY" "Clé API OpenAI (sk-...)" true
read_env_var "REPLICATE_API_TOKEN" "Token Replicate (r8_...)" true
read_env_var "CLOUDINARY_CLOUD_NAME" "Cloudinary Cloud Name"
read_env_var "CLOUDINARY_API_KEY" "Cloudinary API Key" true
read_env_var "CLOUDINARY_API_SECRET" "Cloudinary API Secret" true

# Variables Supabase
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  NEXT_PUBLIC_SUPABASE_URL="https://${SUPABASE_PROJECT_ID}.supabase.co"
  echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}${NC}"
fi

read_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase Anon Key (eyJ...)" true
read_env_var "SUPABASE_SERVICE_ROLE_KEY" "Supabase Service Role Key (eyJ...)" true

# Variables optionnelles
read_env_var "UPSTASH_REDIS_REST_URL" "Upstash Redis REST URL (optionnel)" false ""
read_env_var "UPSTASH_REDIS_REST_TOKEN" "Upstash Redis REST Token (optionnel)" true ""

if [ -n "$UPSTASH_REDIS_REST_URL" ] && [ -z "$UPSTASH_REDIS_REST_TOKEN" ]; then
  read_env_var "UPSTASH_REDIS_REST_TOKEN" "Upstash Redis REST Token" true
fi

read_env_var "SENTRY_DSN" "Sentry DSN (optionnel)" false ""

echo ""

# ═══════════════════════════════════════════════════════════════
# 4. CONFIGURATION VERCEL
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🚀 Configuration des variables Vercel...${NC}"

# Fonction pour ajouter/mettre à jour une variable Vercel
add_vercel_env() {
  local key=$1
  local value=$2
  local environments=${3:-"production preview development"}
  
  if [ -z "$value" ]; then
    echo -e "${YELLOW}⚠️  Variable $key vide, ignorée${NC}"
    return
  fi
  
  for env in $environments; do
    echo -e "${CYAN}   📝 ${key} (${env})${NC}"
    
    # Supprimer si existe
    echo "$value" | vercel env rm "$key" "$env" --yes 2>/dev/null || true
    
    # Ajouter
    echo "$value" | vercel env add "$key" "$env" --yes > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}      ✅ Configurée${NC}"
    else
      echo -e "${RED}      ❌ Échec${NC}"
    fi
  done
}

# Variables publiques (NEXT_PUBLIC_*)
add_vercel_env "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "production preview development"
add_vercel_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "production preview development"

if [ -n "$SENTRY_DSN" ]; then
  add_vercel_env "NEXT_PUBLIC_SENTRY_DSN" "$SENTRY_DSN" "production preview development"
fi

# Variables privées (server-side only)
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
# 5. BUILD ET VÉRIFICATION
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🔨 Build et vérification...${NC}"

cd apps/frontend

# Installer les dépendances
echo -e "${CYAN}   Installation des dépendances...${NC}"
pnpm install --no-frozen-lockfile > /dev/null 2>&1 || pnpm install

# Build
echo -e "${CYAN}   Build en cours...${NC}"
if pnpm run build > /tmp/ai-studio-build.log 2>&1; then
  echo -e "${GREEN}✅ Build réussi${NC}"
else
  echo -e "${RED}❌ Build échoué${NC}"
  echo -e "${YELLOW}   Logs:${NC}"
  tail -20 /tmp/ai-studio-build.log
  exit 1
fi

cd ../..

echo ""

# ═══════════════════════════════════════════════════════════════
# 6. DÉPLOIEMENT VERCEL
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🚀 Déploiement sur Vercel Production...${NC}"
echo ""

cd apps/frontend

# Déploiement
if vercel --prod --yes; then
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║           ✅ DÉPLOIEMENT RÉUSSI ! 🎉                        ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${CYAN}📋 Prochaines étapes:${NC}"
  echo -e "   1. ✅ Migration SQL exécutée"
  echo -e "   2. ✅ Variables d'environnement configurées"
  echo -e "   3. ✅ Application déployée"
  echo ""
  echo -e "${CYAN}🧪 Tests à effectuer:${NC}"
  echo -e "   • https://luneo.app/dashboard/ai-studio"
  echo -e "   • Tester Text-to-Design"
  echo -e "   • Tester Background Removal"
  echo -e "   • Tester Upscale"
  echo -e "   • Tester Extract Colors"
  echo -e "   • Tester Smart Crop"
  echo ""
  echo -e "${CYAN}📊 Monitoring:${NC}"
  echo -e "   • Vercel: https://vercel.com/dashboard"
  if [ -n "$SENTRY_DSN" ]; then
    echo -e "   • Sentry: https://sentry.io"
  fi
  echo ""
else
  echo -e "${RED}❌ Déploiement échoué${NC}"
  exit 1
fi

cd ../..

