#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION COMPLÈTE DES SECRETS GITHUB
# Configure tous les secrets depuis VARIABLES_VERCEL_COMPLÈTES.md
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

# Fonction pour configurer un secret
set_secret() {
  local secret_name=$1
  local secret_value=$2
  
  if [ -z "$secret_value" ] || [ "$secret_value" = "_" ] || [[ "$secret_value" == *"à créer"* ]] || [[ "$secret_value" == *"..."* ]]; then
    echo -e "${YELLOW}⏭️  ${secret_name}: valeur non disponible, ignoré${NC}"
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

SUCCESS_COUNT=0
SKIP_COUNT=0

echo -e "${BLUE}📋 Configuration des secrets depuis VARIABLES_VERCEL_COMPLÈTES.md...${NC}"
echo ""

# Secrets Supabase
set_secret "NEXT_PUBLIC_SUPABASE_URL" "https://obrijgptqztacolemsbk.supabase.co"
set_secret "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjYwMjIsImV4cCI6MjA3Njg0MjAyMn0.0dxttYi1WPLuqdkI52a0Rary81wtYdjnBt4F0q4tYV8"
set_secret "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI2NjAyMiwiZXhwIjoyMDc2ODQyMDIyfQ.r8pgz9G88K41Jpseg_vseH9jevqK17zJcNcM6YQR-YE"

# Application URLs
set_secret "NEXT_PUBLIC_API_URL" "https://app.luneo.app/api"
set_secret "NEXT_PUBLIC_APP_URL" "https://app.luneo.app"

# OAuth Google
set_secret "NEXT_PUBLIC_GOOGLE_CLIENT_ID" "212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com"
set_secret "GOOGLE_CLIENT_SECRET" "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"

# OAuth GitHub
set_secret "NEXT_PUBLIC_GITHUB_CLIENT_ID" "Ov23liJmVOHyn8tfxgLi"
set_secret "GITHUB_CLIENT_SECRET" "81bbea63bfc5651e048e5e7f62f69c5d4aad55f9"

# Cloudinary
set_secret "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" "deh4aokbx"
set_secret "CLOUDINARY_API_KEY" "541766291559917"
set_secret "CLOUDINARY_API_SECRET" "s0yc_QR4w9IsM6_HRq2hM5SDnfI"
set_secret "CLOUDINARY_URL" "cloudinary://541766291559917:s0yc_QR4w9IsM6_HRq2hM5SDnfI@deh4aokbx"

# SendGrid
set_secret "SENDGRID_API_KEY" "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"
set_secret "SENDGRID_DOMAIN" "luneo.app"
set_secret "SENDGRID_FROM_NAME" "Luneo"
set_secret "SENDGRID_FROM_EMAIL" "no-reply@luneo.app"

# Sentry
set_secret "NEXT_PUBLIC_SENTRY_DSN" "https://9b98e0a9e22c4d2f88b22edf3d1c7ddf@o4509948310519808.ingest.de.sentry.io/4509948332998736"
set_secret "SENTRY_DSN" "https://9b98e0a9e22c4d2f88b22edf3d1c7ddf@o4509948310519808.ingest.de.sentry.io/4509948332998736"

# Compter les succès
SUCCESS_COUNT=$(gh secret list --repo "$REPO" 2>/dev/null | wc -l | tr -d ' ')

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Secrets configurés: ${SUCCESS_COUNT}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Afficher la liste des secrets configurés
echo -e "${BLUE}📋 Liste des secrets GitHub configurés:${NC}"
gh secret list --repo "$REPO"

echo ""
echo -e "${GREEN}✅ Configuration terminée!${NC}"
echo -e "${BLUE}🔗 Vérifiez sur: https://github.com/${REPO}/settings/secrets/actions${NC}"
echo ""
echo -e "${YELLOW}⚠️  Note: Les secrets Stripe et OpenAI nécessitent des valeurs complètes${NC}"
echo -e "${YELLOW}   Configurez-les manuellement si nécessaire${NC}"

