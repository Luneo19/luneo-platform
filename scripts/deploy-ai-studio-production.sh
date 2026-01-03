#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SCRIPT DE DÉPLOIEMENT AI STUDIO EN PRODUCTION
# Configure toutes les variables et déploie sur Vercel
# ═══════════════════════════════════════════════════════════════

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Déploiement AI Studio en Production${NC}"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "apps/frontend/package.json" ]; then
  echo -e "${RED}❌ Veuillez exécuter ce script depuis la racine du projet${NC}"
  exit 1
fi

cd apps/frontend

# Vérifier connexion Vercel
if ! vercel whoami > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Non connecté à Vercel${NC}"
  echo -e "${YELLOW}   Exécution de: vercel login${NC}"
  vercel login
fi

echo -e "${GREEN}✅ Connecté à Vercel: $(vercel whoami)${NC}"
echo ""

# Fonction pour ajouter/mettre à jour une variable
add_vercel_env() {
  local key=$1
  local value=$2
  local environments=${3:-"production preview development"}
  
  if [ -z "$value" ]; then
    echo -e "${YELLOW}⚠️  Variable $key vide, ignorée${NC}"
    return
  fi
  
  for env in $environments; do
    echo -e "${BLUE}📝 Configuration: $key ($env)${NC}"
    echo "$value" | vercel env add "$key" "$env" --yes 2>/dev/null || {
      # Si la variable existe, la mettre à jour
      echo "$value" | vercel env rm "$key" "$env" --yes 2>/dev/null || true
      echo "$value" | vercel env add "$key" "$env" --yes
    }
  done
}

# Variables requises pour AI Studio
echo -e "${YELLOW}📋 Configuration des variables d'environnement...${NC}"
echo ""

# OpenAI (REQUIS)
if [ -z "$OPENAI_API_KEY" ]; then
  echo -e "${YELLOW}⚠️  OPENAI_API_KEY non définie${NC}"
  read -p "Entrez votre clé API OpenAI (sk-...): " OPENAI_API_KEY
fi
add_vercel_env "OPENAI_API_KEY" "$OPENAI_API_KEY"

# Replicate (REQUIS pour background removal et upscale)
if [ -z "$REPLICATE_API_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  REPLICATE_API_TOKEN non définie${NC}"
  read -p "Entrez votre token Replicate (r8_...): " REPLICATE_API_TOKEN
fi
add_vercel_env "REPLICATE_API_TOKEN" "$REPLICATE_API_TOKEN"

# Cloudinary (REQUIS)
if [ -z "$CLOUDINARY_CLOUD_NAME" ]; then
  echo -e "${YELLOW}⚠️  CLOUDINARY_CLOUD_NAME non définie${NC}"
  read -p "Entrez votre Cloudinary Cloud Name: " CLOUDINARY_CLOUD_NAME
fi
add_vercel_env "CLOUDINARY_CLOUD_NAME" "$CLOUDINARY_CLOUD_NAME"

if [ -z "$CLOUDINARY_API_KEY" ]; then
  echo -e "${YELLOW}⚠️  CLOUDINARY_API_KEY non définie${NC}"
  read -p "Entrez votre Cloudinary API Key: " CLOUDINARY_API_KEY
fi
add_vercel_env "CLOUDINARY_API_KEY" "$CLOUDINARY_API_KEY"

if [ -z "$CLOUDINARY_API_SECRET" ]; then
  echo -e "${YELLOW}⚠️  CLOUDINARY_API_SECRET non définie${NC}"
  read -p "Entrez votre Cloudinary API Secret: " CLOUDINARY_API_SECRET
fi
add_vercel_env "CLOUDINARY_API_SECRET" "$CLOUDINARY_API_SECRET"

# Redis/Upstash (pour cache et rate limiting)
if [ -z "$UPSTASH_REDIS_REST_URL" ]; then
  echo -e "${YELLOW}⚠️  UPSTASH_REDIS_REST_URL non définie (optionnel mais recommandé)${NC}"
  read -p "Entrez votre Upstash Redis REST URL (ou appuyez sur Entrée pour ignorer): " UPSTASH_REDIS_REST_URL
fi
if [ -n "$UPSTASH_REDIS_REST_URL" ]; then
  add_vercel_env "UPSTASH_REDIS_REST_URL" "$UPSTASH_REDIS_REST_URL"
  
  if [ -z "$UPSTASH_REDIS_REST_TOKEN" ]; then
    read -p "Entrez votre Upstash Redis REST Token: " UPSTASH_REDIS_REST_TOKEN
  fi
  if [ -n "$UPSTASH_REDIS_REST_TOKEN" ]; then
    add_vercel_env "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN"
  fi
fi

# Supabase (déjà configuré normalement, mais on vérifie)
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo -e "${YELLOW}⚠️  NEXT_PUBLIC_SUPABASE_URL non définie${NC}"
  read -p "Entrez votre URL Supabase: " NEXT_PUBLIC_SUPABASE_URL
fi
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  add_vercel_env "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "production preview development"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${YELLOW}⚠️  SUPABASE_SERVICE_ROLE_KEY non définie${NC}"
  read -p "Entrez votre Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
fi
if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  add_vercel_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
fi

# Sentry (optionnel mais recommandé)
if [ -z "$SENTRY_DSN" ]; then
  echo -e "${YELLOW}⚠️  SENTRY_DSN non définie (optionnel)${NC}"
  read -p "Entrez votre Sentry DSN (ou appuyez sur Entrée pour ignorer): " SENTRY_DSN
fi
if [ -n "$SENTRY_DSN" ]; then
  add_vercel_env "SENTRY_DSN" "$SENTRY_DSN"
  add_vercel_env "NEXT_PUBLIC_SENTRY_DSN" "$SENTRY_DSN" "production preview development"
fi

echo ""
echo -e "${GREEN}✅ Variables d'environnement configurées${NC}"
echo ""

# Exécuter la migration SQL sur Supabase
echo -e "${YELLOW}📊 Exécution de la migration SQL...${NC}"
echo -e "${YELLOW}   Veuillez exécuter le fichier suivant sur Supabase:${NC}"
echo -e "${BLUE}   apps/frontend/supabase/migrations/ensure_ai_studio_tables.sql${NC}"
echo -e "${YELLOW}   URL: https://supabase.com/dashboard/project/obrijgptqztacolemsbk/sql/new${NC}"
echo ""
read -p "Appuyez sur Entrée une fois la migration exécutée..."

# Build et test local
echo -e "${YELLOW}🔨 Build local...${NC}"
pnpm install
pnpm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build échoué${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Build réussi${NC}"
echo ""

# Déploiement sur Vercel
echo -e "${YELLOW}🚀 Déploiement sur Vercel Production...${NC}"
vercel --prod --yes

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Déploiement réussi!${NC}"
  echo ""
  echo -e "${GREEN}🎉 AI Studio est maintenant opérationnel en production!${NC}"
  echo ""
  echo -e "${BLUE}📋 Prochaines étapes:${NC}"
  echo -e "   1. Vérifier que la migration SQL a été exécutée"
  echo -e "   2. Tester les fonctionnalités sur https://luneo.app/dashboard/ai-studio"
  echo -e "   3. Vérifier les logs Vercel pour d'éventuelles erreurs"
  echo -e "   4. Configurer les alertes Sentry (si configuré)"
else
  echo -e "${RED}❌ Déploiement échoué${NC}"
  exit 1
fi









