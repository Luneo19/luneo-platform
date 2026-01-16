#!/bin/bash
set -e

echo "🔧 CONFIGURATION VERCEL - IGNORER BUILDS DEPENDABOT"
echo "=================================================="
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
    echo "     ./scripts/configure-vercel-ignore-dependabot.sh"
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
print_step "Configuration de l'Ignored Build Step via API Vercel..."

# Commande pour ignorer les builds Dependabot
IGNORE_BUILD_STEP='git log -1 --pretty=format:"%an" | grep -q "dependabot" && exit 1 || exit 0'

# Note: L'API Vercel v9 ne supporte pas directement la modification de "ignoredBuildStep"
# Il faut utiliser l'API v2 ou configurer via Dashboard
print_warning "L'API Vercel ne permet pas de modifier 'ignoredBuildStep' directement"
echo ""
echo "📝 INSTRUCTIONS MANUELLES:"
echo ""
echo "1. Aller sur: https://vercel.com/luneos-projects/frontend/settings/git"
echo ""
echo "2. Trouver la section 'Ignored Build Step'"
echo ""
echo "3. Ajouter cette commande:"
echo ""
echo "   ${GREEN}$IGNORE_BUILD_STEP${NC}"
echo ""
echo "4. Cliquer sur 'Save'"
echo ""
echo "✅ Après configuration, les builds Dependabot seront automatiquement ignorés"
echo ""

# Alternative: Afficher les informations du projet pour faciliter l'accès
echo ""
print_step "Informations du projet Vercel:"
echo "  Project ID: $PROJECT_ID"
echo "  Team ID: $TEAM_ID"
echo "  Dashboard: https://vercel.com/luneos-projects/frontend/settings/git"
echo ""

print_success "Script terminé !"
echo ""
echo "💡 Astuce: Vous pouvez aussi utiliser le script .vercelignore-build-step.sh"
echo "   dans la section 'Ignored Build Step' pour une solution plus avancée."
