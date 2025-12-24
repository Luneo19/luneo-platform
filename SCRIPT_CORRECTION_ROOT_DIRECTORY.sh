#!/bin/bash

##############################################################################
# Script pour corriger le Root Directory via API Vercel
# Utilise le token Vercel depuis les variables d'environnement
##############################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ID="prj_lGBYTHVcIQqZdP1ZFfiqziWhPSo9"
TEAM_ID="team_hEYzAnyaxsCQkF2sJqEzWKS9"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Correction Root Directory via API Vercel${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Récupérer le token Vercel
if [ -z "$VERCEL_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  VERCEL_TOKEN non fourni${NC}"
  echo ""
  echo "Pour utiliser ce script:"
  echo "  1. Créer un token API Vercel:"
  echo "     https://vercel.com/account/tokens"
  echo ""
  echo "  2. Exporter le token:"
  echo "     export VERCEL_TOKEN='votre-token'"
  echo ""
  echo "  3. Exécuter le script:"
  echo "     ./SCRIPT_CORRECTION_ROOT_DIRECTORY.sh"
  echo ""
  exit 1
fi

echo -e "${GREEN}✅ Token Vercel fourni${NC}"
echo ""
echo -e "${BLUE}🔧 Mise à jour du Root Directory...${NC}"
echo "Project ID: $PROJECT_ID"
echo "Team ID: $TEAM_ID"
echo "Root Directory: . (point)"
echo ""

# Mise à jour via API Vercel
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH \
  "https://api.vercel.com/v9/projects/$PROJECT_ID?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rootDirectory":"."}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✅ Root Directory mis à jour avec succès !${NC}"
  echo ""
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  echo -e "${GREEN}🚀 Vous pouvez maintenant déployer:${NC}"
  echo "  cd apps/frontend"
  echo "  vercel --prod --yes"
else
  echo -e "${RED}❌ Erreur HTTP: $HTTP_CODE${NC}"
  echo "$BODY"
  echo ""
  echo "Vérifiez que le token est valide et a les permissions nécessaires."
  exit 1
fi
