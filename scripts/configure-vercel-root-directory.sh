#!/bin/bash
set -e

echo "🔧 CONFIGURATION ROOT DIRECTORY VERCEL"
echo "======================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier si token Vercel est fourni
if [ -z "$VERCEL_TOKEN" ]; then
    print_warning "VERCEL_TOKEN non fourni"
    echo ""
    echo "Pour utiliser ce script:"
    echo "  1. Créer un token API Vercel:"
    echo "     https://vercel.com/account/tokens"
    echo ""
    echo "  2. Exporter le token:"
    echo "     export VERCEL_TOKEN='votre_token'"
    echo ""
    echo "  3. Exécuter le script:"
    echo "     ./scripts/configure-vercel-root-directory.sh"
    echo ""
    exit 1
fi

print_success "Token Vercel fourni"

# Récupérer project ID et team ID
cd apps/frontend

if [ ! -f .vercel/project.json ]; then
    print_error ".vercel/project.json non trouvé"
    echo "Liez d'abord le projet: vercel link"
    exit 1
fi

PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
TEAM_ID=$(cat .vercel/project.json | grep -o '"orgId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ] || [ -z "$TEAM_ID" ]; then
    print_error "Impossible de récupérer PROJECT_ID ou TEAM_ID"
    exit 1
fi

print_success "Project ID: $PROJECT_ID"
print_success "Team ID: $TEAM_ID"

echo ""
print_step "Mise à jour Root Directory via API Vercel..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH \
  "https://api.vercel.com/v9/projects/$PROJECT_ID?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rootDirectory":"apps/frontend"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    print_success "Root Directory configuré avec succès !"
    echo ""
    echo "📊 Réponse:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    print_error "Échec configuration (HTTP $HTTP_CODE)"
    echo ""
    echo "Réponse:"
    echo "$BODY"
    exit 1
fi

echo ""
print_success "Configuration terminée !"
echo ""
echo "🚀 Vous pouvez maintenant déployer:"
echo "   cd apps/frontend && vercel --prod --yes"

