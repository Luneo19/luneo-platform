#!/bin/bash
# Script pour configurer les branches protégées sur GitHub
# Usage: ./scripts/setup-branch-protection.sh [repo-owner/repo-name]

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Récupérer le nom du repo depuis git remote ou argument
if [ -z "$1" ]; then
    REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
    if [ -z "$REPO_URL" ]; then
        echo -e "${RED}❌ Erreur: Impossible de déterminer le repository${NC}"
        echo "Usage: $0 <owner/repo-name>"
        exit 1
    fi
    
    # Extraire owner/repo depuis l'URL
    if [[ $REPO_URL == *"github.com"* ]]; then
        REPO=$(echo $REPO_URL | sed -E 's/.*github.com[:/]([^/]+\/[^/]+)\.git$/\1/' | sed -E 's/.*github.com[:/]([^/]+\/[^/]+)$/\1/')
    else
        echo -e "${RED}❌ Erreur: URL du repository non reconnue${NC}"
        exit 1
    fi
else
    REPO="$1"
fi

echo -e "${YELLOW}🔒 Configuration des branches protégées pour: ${REPO}${NC}"

# Vérifier l'authentification
if ! gh auth status &>/dev/null; then
    echo -e "${RED}❌ Erreur: Non authentifié avec GitHub CLI${NC}"
    echo "Exécutez: gh auth login"
    exit 1
fi

# Fonction pour créer une règle de protection de branche
setup_branch_protection() {
    local BRANCH=$1
    local REQUIRED_REVIEWS=${2:-1}
    local REQUIRE_CODE_OWNERS=${3:-true}
    
    echo -e "\n${YELLOW}📋 Configuration de la protection pour la branche: ${BRANCH}${NC}"
    
    # Vérifier si la branche existe
    if ! gh api "repos/${REPO}/branches/${BRANCH}" &>/dev/null; then
        echo -e "${YELLOW}⚠️  La branche ${BRANCH} n'existe pas encore. Elle sera protégée lors de sa création.${NC}"
    fi
    
    # Configuration de la protection de branche
    gh api "repos/${REPO}/branches/${BRANCH}/protection" \
        --method PUT \
        --field required_status_checks='{"strict":true,"contexts":["build","test","lint","check-secrets"]}' \
        --field enforce_admins=true \
        --field required_pull_request_reviews='{"required_approving_review_count":'${REQUIRED_REVIEWS}',"dismiss_stale_reviews":true,"require_code_owner_reviews":'${REQUIRE_CODE_OWNERS}',"require_last_push_approval":false}' \
        --field restrictions='{"users":[],"teams":[]}' \
        --field required_linear_history=false \
        --field allow_force_pushes=false \
        --field allow_deletions=false \
        --field required_conversation_resolution=true \
        --field lock_branch=false \
        --field allow_fork_syncing=false \
        2>&1 | while read line; do
            if [[ $line == *"error"* ]] || [[ $line == *"Error"* ]]; then
                echo -e "${RED}❌ $line${NC}"
            else
                echo -e "${GREEN}✅ $line${NC}"
            fi
        done
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Protection configurée pour ${BRANCH}${NC}"
    else
        echo -e "${RED}❌ Erreur lors de la configuration de ${BRANCH}${NC}"
        return 1
    fi
}

# Configurer la protection pour main
echo -e "\n${YELLOW}🔒 Configuration de la protection pour 'main'...${NC}"
setup_branch_protection "main" 2 true

# Configurer la protection pour develop (si elle existe)
if gh api "repos/${REPO}/branches/develop" &>/dev/null; then
    echo -e "\n${YELLOW}🔒 Configuration de la protection pour 'develop'...${NC}"
    setup_branch_protection "develop" 1 true
else
    echo -e "\n${YELLOW}ℹ️  La branche 'develop' n'existe pas encore${NC}"
fi

echo -e "\n${GREEN}✅ Configuration terminée !${NC}"
echo -e "\n${YELLOW}📝 Vérification:${NC}"
echo "Vous pouvez vérifier la configuration sur:"
echo "https://github.com/${REPO}/settings/branches"

