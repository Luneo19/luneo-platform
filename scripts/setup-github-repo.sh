#!/bin/bash
# Script pour créer le repository GitHub et configurer les branches protégées
# Usage: ./scripts/setup-github-repo.sh [repo-name] [owner] [--yes]

set -e

# Vérifier le flag --yes
AUTO_YES=false
if [[ "$*" == *"--yes"* ]] || [[ "$*" == *"-y"* ]]; then
    AUTO_YES=true
fi

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME=${1:-"luneo-platform"}
OWNER=${2:-"Luneo19"}
REPO="${OWNER}/${REPO_NAME}"

echo -e "${BLUE}🚀 Configuration du repository GitHub: ${REPO}${NC}"

# Vérifier l'authentification
if ! gh auth status &>/dev/null; then
    echo -e "${RED}❌ Erreur: Non authentifié avec GitHub CLI${NC}"
    echo "Exécutez: gh auth login"
    exit 1
fi

# Vérifier si le repository existe déjà
if gh repo view "$REPO" &>/dev/null; then
    echo -e "${GREEN}✅ Le repository ${REPO} existe déjà${NC}"
else
    echo -e "${YELLOW}📦 Création du repository ${REPO}...${NC}"
    
    # Demander confirmation (sauf si --yes)
    if [ "$AUTO_YES" = false ]; then
        read -p "Créer le repository ${REPO}? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Annulé${NC}"
            exit 0
        fi
    else
        echo -e "${BLUE}✅ Mode automatique activé${NC}"
    fi
    
    # Créer le repository (privé par défaut pour la sécurité)
    gh repo create "$REPO" \
        --private \
        --description "Luneo Platform - Plateforme IA de personnalisation produits" \
        --homepage "https://luneo.app" \
        --source=. \
        --remote=origin \
        --push 2>&1 | while read line; do
            if [[ $line == *"error"* ]] || [[ $line == *"Error"* ]]; then
                echo -e "${RED}❌ $line${NC}"
            else
                echo -e "${GREEN}✅ $line${NC}"
            fi
        done
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Repository créé avec succès${NC}"
    else
        echo -e "${RED}❌ Erreur lors de la création du repository${NC}"
        echo -e "${YELLOW}💡 Le repository existe peut-être déjà. Continuez avec la configuration des branches protégées.${NC}"
    fi
fi

# Attendre un peu pour que GitHub synchronise
sleep 2

# Configurer les branches protégées
echo -e "\n${BLUE}🔒 Configuration des branches protégées...${NC}"

# Fonction pour créer une règle de protection de branche
setup_branch_protection() {
    local BRANCH=$1
    local REQUIRED_REVIEWS=${2:-1}
    local REQUIRE_CODE_OWNERS=${3:-true}
    
    echo -e "\n${YELLOW}📋 Configuration de la protection pour: ${BRANCH}${NC}"
    
    # Vérifier si la branche existe
    if ! gh api "repos/${REPO}/branches/${BRANCH}" &>/dev/null; then
        echo -e "${YELLOW}⚠️  La branche ${BRANCH} n'existe pas encore${NC}"
        echo -e "${BLUE}💡 Créez la branche d'abord ou elle sera protégée lors de sa création${NC}"
        return 0
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
            if [[ $line == *"error"* ]] || [[ $line == *"Error"* ]] || [[ $line == *"404"* ]]; then
                echo -e "${RED}❌ $line${NC}"
            elif [[ $line == *"200"* ]] || [[ $line == *"201"* ]]; then
                echo -e "${GREEN}✅ Protection configurée${NC}"
            else
                echo -e "${BLUE}ℹ️  $line${NC}"
            fi
        done
}

# Configurer la protection pour main
setup_branch_protection "main" 2 true

# Configurer la protection pour develop (si elle existe)
if gh api "repos/${REPO}/branches/develop" &>/dev/null 2>&1; then
    setup_branch_protection "develop" 1 true
else
    echo -e "\n${YELLOW}ℹ️  La branche 'develop' n'existe pas encore${NC}"
fi

echo -e "\n${GREEN}✅ Configuration terminée !${NC}"
echo -e "\n${BLUE}📝 Vérification:${NC}"
echo "Repository: https://github.com/${REPO}"
echo "Branches protégées: https://github.com/${REPO}/settings/branches"

