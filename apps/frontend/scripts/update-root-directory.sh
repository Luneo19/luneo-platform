#!/bin/bash

##############################################################################
# Script pour mettre à jour le Root Directory via API Vercel
# Nécessite le token Vercel
##############################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ID="prj_lGBYTHVcIQqZdP1ZFfiqziWhPSo9"
TEAM_ID="team_hEYzAnyaxsCQkF2sJqEzWKS9"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Mise à jour Root Directory via API Vercel${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Demander le token Vercel
if [ -z "$VERCEL_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  Token Vercel requis${NC}"
  echo ""
  echo "Pour obtenir votre token:"
  echo "  1. Aller sur: https://vercel.com/account/tokens"
  echo "  2. Créer un nouveau token"
  echo "  3. Exécuter: export VERCEL_TOKEN=votre-token"
  echo ""
  echo "OU passez le token en paramètre:"
  echo "  ./update-root-directory.sh votre-token"
  echo ""
  
  if [ -n "$1" ]; then
    VERCEL_TOKEN="$1"
    echo -e "${GREEN}✅ Token fourni en paramètre${NC}"
  else
    echo "Entrez votre token Vercel (ou appuyez sur Ctrl+C pour annuler):"
    read -s VERCEL_TOKEN
    echo ""
  fi
fi

if [ -z "$VERCEL_TOKEN" ]; then
  echo -e "${YELLOW}❌ Token non fourni. Annulation.${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}🔧 Mise à jour du Root Directory...${NC}"
echo "Project ID: $PROJECT_ID"
echo "Team ID: $TEAM_ID"
echo "Root Directory: apps/frontend"
echo ""

# Mise à jour via API Vercel
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH \
  "https://api.vercel.com/v10/projects/$PROJECT_ID?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rootDirectory": "apps/frontend",
    "buildCommand": "pnpm run build",
    "installCommand": "pnpm install --frozen-lockfile",
    "outputDirectory": ".next"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✅ Root Directory mis à jour avec succès !${NC}"
  echo ""
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  echo -e "${GREEN}🚀 Vous pouvez maintenant déployer:${NC}"
  echo "  cd /Users/emmanuelabougadous/luneo-platform/apps/frontend"
  echo "  vercel --prod"
else
  echo -e "${YELLOW}⚠️  Erreur HTTP: $HTTP_CODE${NC}"
  echo "$BODY"
  echo ""
  echo "Vérifiez que le token est valide et a les permissions nécessaires."
fi




