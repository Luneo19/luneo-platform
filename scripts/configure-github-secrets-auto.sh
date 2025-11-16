#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION AUTOMATIQUE DES SECRETS GITHUB
# Lit depuis VERCEL_ENV_CHECKLIST.md et configure GitHub Secrets
# ═══════════════════════════════════════════════════════════════

set -e

REPO="Luneo19/luneo-platform"
CHECKLIST_FILE="VERCEL_ENV_CHECKLIST.md"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 Configuration automatique des secrets GitHub${NC}"
echo -e "${BLUE}Repository: ${REPO}${NC}"
echo ""

# Fonction pour extraire une valeur depuis le fichier checklist
extract_value() {
  local var_name=$1
  local file=$2
  
  if [ ! -f "$file" ]; then
    return 1
  fi
  
  # Chercher la ligne avec la variable
  local line=$(grep "^\`${var_name}\`" "$file" 2>/dev/null | head -1)
  
  if [ -z "$line" ]; then
    return 1
  fi
  
  # Extraire la valeur après le = (peut être tronquée avec ...)
  local value=$(echo "$line" | sed -n "s/.*= \`\(.*\)\`.*/\1/p")
  
  if [ -n "$value" ] && [ "$value" != "_" ] && [ "$value" != "_(à créer"* ]; then
    echo "$value"
    return 0
  fi
  
  return 1
}

# Fonction pour configurer un secret
set_secret() {
  local secret_name=$1
  local secret_value=$2
  
  if [ -z "$secret_value" ] || [ "$secret_value" = "_" ] || [[ "$secret_value" == *"à créer"* ]] || [[ "$secret_value" == *"..."* ]]; then
    echo -e "${YELLOW}⏭️  ${secret_name}: valeur non disponible ou incomplète, ignoré${NC}"
    return 1
  fi
  
  echo -e "${BLUE}📝 Configuration de ${secret_name}...${NC}"
  
  if echo -n "$secret_value" | gh secret set "$secret_name" --repo "$REPO" 2>/dev/null; then
    echo -e "${GREEN}✅ ${secret_name} configuré${NC}"
    return 0
  else
    echo -e "${RED}❌ Erreur pour ${secret_name}${NC}"
    return 1
  fi
}

# Vérifier que le fichier existe
if [ ! -f "$CHECKLIST_FILE" ]; then
  echo -e "${RED}❌ Fichier ${CHECKLIST_FILE} non trouvé${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Fichier ${CHECKLIST_FILE} trouvé${NC}"
echo ""

# Liste des secrets à configurer depuis le checklist
declare -A SECRETS_MAP=(
  ["NEXT_PUBLIC_SUPABASE_URL"]="https://obrijgptqztacolemsbk.supabase.co"
  ["SUPABASE_SERVICE_ROLE_KEY"]=""
  ["STRIPE_SECRET_KEY"]=""
  ["STRIPE_PUBLISHABLE_KEY"]="pk_live_your_publishable_key"
  ["STRIPE_WEBHOOK_SECRET"]=""
  ["OPENAI_API_KEY"]=""
  ["CLOUDINARY_CLOUD_NAME"]="deh4aokbx"
  ["CLOUDINARY_API_KEY"]="541766291559917"
  ["CLOUDINARY_API_SECRET"]="s0yc_QR4w9IsM6_HRq2hM5SDnfI"
  ["GOOGLE_CLIENT_ID"]="212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com"
  ["GOOGLE_CLIENT_SECRET"]="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"
  ["GITHUB_CLIENT_ID"]="Ov23liJmVOHyn8tfxgLi"
  ["GITHUB_CLIENT_SECRET"]="81bbea63bfc5651e048e5e7f62f69c5d4aad55f9"
  ["SENDGRID_API_KEY"]="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"
)

SUCCESS_COUNT=0
SKIP_COUNT=0
ERROR_COUNT=0

echo -e "${BLUE}📋 Configuration des secrets...${NC}"
echo ""

# Configurer chaque secret
for secret_name in "${!SECRETS_MAP[@]}"; do
  # Essayer d'extraire depuis le fichier
  value=$(extract_value "$secret_name" "$CHECKLIST_FILE")
  
  # Si pas trouvé, utiliser la valeur par défaut du map
  if [ -z "$value" ]; then
    value="${SECRETS_MAP[$secret_name]}"
  fi
  
  # Configurer le secret
  if set_secret "$secret_name" "$value"; then
    ((SUCCESS_COUNT++))
  else
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
echo -e "${BLUE}📋 Liste des secrets GitHub configurés:${NC}"
gh secret list --repo "$REPO"

echo ""
echo -e "${GREEN}✅ Configuration terminée!${NC}"
echo -e "${BLUE}🔗 Vérifiez sur: https://github.com/${REPO}/settings/secrets/actions${NC}"
echo ""
echo -e "${YELLOW}⚠️  Note: Certains secrets nécessitent des valeurs complètes (non tronquées)${NC}"
echo -e "${YELLOW}   Vérifiez manuellement les secrets marqués comme '...' dans le checklist${NC}"

