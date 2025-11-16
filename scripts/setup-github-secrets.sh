#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION AUTOMATIQUE DES SECRETS GITHUB
# Pour Luneo Platform - Configuration complète
# ═══════════════════════════════════════════════════════════════

set -e

REPO="Luneo19/luneo-platform"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 Configuration des secrets GitHub pour ${REPO}${NC}"
echo ""

# Liste des secrets à configurer
declare -a SECRETS=(
  "SHOPIFY_API_KEY"
  "SHOPIFY_API_SECRET"
  "JWT_SECRET"
  "JWT_PUBLIC_KEY"
  "OPENAI_API_KEY"
  "CLOUDINARY_URL"
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
  "STRIPE_SECRET_KEY"
  "STRIPE_PUBLISHABLE_KEY"
  "SENTRY_DSN"
  "DATABASE_URL"
  "DIRECT_URL"
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "REDIS_URL"
  "UPSTASH_REDIS_REST_URL"
  "UPSTASH_REDIS_REST_TOKEN"
  "SMTP_HOST"
  "SMTP_PORT"
  "SMTP_USER"
  "SMTP_PASSWORD"
  "SENDGRID_API_KEY"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "GITHUB_CLIENT_ID"
  "GITHUB_CLIENT_SECRET"
)

# Fonction pour vérifier si un secret existe déjà
check_secret_exists() {
  local secret_name=$1
  gh secret list --repo "$REPO" | grep -q "^${secret_name}" && return 0 || return 1
}

# Fonction pour configurer un secret
set_secret() {
  local secret_name=$1
  local secret_value=$2
  
  if [ -z "$secret_value" ]; then
    echo -e "${YELLOW}⚠️  ${secret_name}: valeur vide, ignoré${NC}"
    return 1
  fi
  
  echo -e "${BLUE}📝 Configuration de ${secret_name}...${NC}"
  
  if echo -n "$secret_value" | gh secret set "$secret_name" --repo "$REPO"; then
    echo -e "${GREEN}✅ ${secret_name} configuré avec succès${NC}"
    return 0
  else
    echo -e "${RED}❌ Erreur lors de la configuration de ${secret_name}${NC}"
    return 1
  fi
}

# Fonction pour lire depuis un fichier .env
read_from_env_file() {
  local env_file=$1
  local secret_name=$2
  
  if [ ! -f "$env_file" ]; then
    return 1
  fi
  
  # Chercher la variable dans le fichier
  local value=$(grep "^${secret_name}=" "$env_file" 2>/dev/null | cut -d'=' -f2- | sed 's/^"//;s/"$//' | sed "s/^'//;s/'$//")
  
  if [ -n "$value" ]; then
    echo "$value"
    return 0
  fi
  
  return 1
}

# Chercher les fichiers .env locaux
ENV_FILES=(
  "apps/backend/.env.local"
  "apps/backend/.env"
  "apps/frontend/.env.local"
  "apps/frontend/.env"
  ".env.local"
  ".env"
)

echo -e "${BLUE}🔍 Recherche de fichiers .env locaux...${NC}"
FOUND_ENV_FILE=""
for env_file in "${ENV_FILES[@]}"; do
  if [ -f "$env_file" ]; then
    echo -e "${GREEN}✅ Fichier trouvé: ${env_file}${NC}"
    FOUND_ENV_FILE="$env_file"
    break
  fi
done

if [ -z "$FOUND_ENV_FILE" ]; then
  echo -e "${YELLOW}⚠️  Aucun fichier .env trouvé, mode interactif${NC}"
fi

echo ""
echo -e "${BLUE}📋 Configuration des secrets...${NC}"
echo ""

SUCCESS_COUNT=0
SKIP_COUNT=0
ERROR_COUNT=0

for secret in "${SECRETS[@]}"; do
  secret_value=""
  
  # Essayer de lire depuis le fichier .env
  if [ -n "$FOUND_ENV_FILE" ]; then
    secret_value=$(read_from_env_file "$FOUND_ENV_FILE" "$secret")
  fi
  
  # Si pas trouvé dans .env, demander à l'utilisateur
  if [ -z "$secret_value" ]; then
    # Vérifier si le secret existe déjà
    if check_secret_exists "$secret"; then
      echo -e "${YELLOW}⚠️  ${secret} existe déjà. Voulez-vous le mettre à jour? (y/N)${NC}"
      read -r update_choice
      if [ "$update_choice" != "y" ] && [ "$update_choice" != "Y" ]; then
        echo -e "${YELLOW}⏭️  ${secret} ignoré${NC}"
        ((SKIP_COUNT++))
        continue
      fi
    fi
    
    echo -e "${BLUE}💬 Entrez la valeur pour ${secret} (ou appuyez sur Entrée pour ignorer):${NC}"
    read -s secret_value
    echo ""
  fi
  
  # Configurer le secret
  if [ -n "$secret_value" ]; then
    if set_secret "$secret" "$secret_value"; then
      ((SUCCESS_COUNT++))
    else
      ((ERROR_COUNT++))
    fi
  else
    echo -e "${YELLOW}⏭️  ${secret} ignoré (valeur vide)${NC}"
    ((SKIP_COUNT++))
  fi
  
  echo ""
done

# Résumé
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Secrets configurés: ${SUCCESS_COUNT}${NC}"
echo -e "${YELLOW}⏭️  Secrets ignorés: ${SKIP_COUNT}${NC}"
echo -e "${RED}❌ Erreurs: ${ERROR_COUNT}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Afficher la liste des secrets configurés
echo -e "${BLUE}📋 Liste des secrets configurés:${NC}"
gh secret list --repo "$REPO"

echo ""
echo -e "${GREEN}✅ Configuration terminée!${NC}"
echo -e "${BLUE}🔗 Vérifiez sur: https://github.com/${REPO}/settings/secrets/actions${NC}"

