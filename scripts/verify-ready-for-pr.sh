#!/bin/bash

# ✅ Script de vérification - Prêt pour Pull Requests
# Vérifie que tout est en ordre avant de créer les PRs

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  Vérification - Prêt pour Pull Requests${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

ERRORS=0
WARNINGS=0

# 1. Vérifier les branches
echo -e "${BLUE}1. Vérification des branches...${NC}"
BRANCHES=(
    "feature/critique-fixes"
    "feature/urgent-responsive"
    "feature/important-quality"
    "feature/finish-polish"
)

for branch in "${BRANCHES[@]}"; do
    if git show-ref --verify --quiet refs/heads/$branch; then
        echo -e "${GREEN}✅ Branche '$branch' existe${NC}"
        
        # Vérifier si poussée
        if git show-ref --verify --quiet refs/remotes/origin/$branch; then
            echo -e "${GREEN}   → Poussée sur origin${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Non poussée sur origin${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
        
        # Compter les commits
        COMMITS=$(git log --oneline origin/main..$branch 2>/dev/null | wc -l | tr -d ' ')
        if [ "$COMMITS" -gt 0 ]; then
            echo -e "${GREEN}   → $COMMITS commits${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Aucun commit nouveau${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${RED}❌ Branche '$branch' n'existe pas${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# 2. Vérifier la documentation
echo -e "\n${BLUE}2. Vérification de la documentation...${NC}"
DOCS=(
    "docs/NEXT_STEPS.md"
    "docs/FINAL_REPORT.md"
    "docs/DEPLOYMENT_CHECKLIST.md"
    "docs/QUICK_START_DEPLOYMENT.md"
    "CHANGELOG.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✅ $doc${NC}"
    else
        echo -e "${YELLOW}⚠️  $doc manquant${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

# 3. Vérifier les fichiers créés
echo -e "\n${BLUE}3. Vérification des fichiers créés...${NC}"
FILES=(
    "apps/frontend/src/components/notifications/NotificationCenter.tsx"
    "apps/frontend/src/components/ui/skeletons/TeamSkeleton.tsx"
    "apps/frontend/src/components/ui/empty-states/EmptyState.tsx"
    "apps/frontend/src/hooks/useInfiniteScroll.ts"
    "apps/frontend/src/lib/services/webhook.service.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file manquant${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# 4. Vérifier les scripts
echo -e "\n${BLUE}4. Vérification des scripts...${NC}"
REQUIRED_SCRIPTS=(
    "scripts/prepare-deployment.sh"
)

OPTIONAL_SCRIPTS=(
    "scripts/git-workflow-todos.sh"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ -f "$script" ] && [ -x "$script" ]; then
        echo -e "${GREEN}✅ $script (exécutable)${NC}"
    elif [ -f "$script" ]; then
        echo -e "${YELLOW}⚠️  $script (non exécutable)${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}❌ $script manquant${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

for script in "${OPTIONAL_SCRIPTS[@]}"; do
    if [ -f "$script" ] && [ -x "$script" ]; then
        echo -e "${GREEN}✅ $script (exécutable)${NC}"
    elif [ -f "$script" ]; then
        echo -e "${YELLOW}⚠️  $script (non exécutable)${NC}"
    else
        echo -e "${BLUE}ℹ️  $script (optionnel, non présent)${NC}"
    fi
done

# 5. Vérifier git status
echo -e "\n${BLUE}5. Vérification git status...${NC}"
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✅ Working directory propre${NC}"
else
    echo -e "${YELLOW}⚠️  Changements non commités:${NC}"
    git status --short | head -5
    WARNINGS=$((WARNINGS + 1))
fi

# Résumé
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ TOUT EST PRÊT POUR LES PULL REQUESTS !${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}\n"
    echo -e "${BLUE}Prochaines étapes:${NC}"
    echo -e "1. Créer les 4 Pull Requests sur GitHub"
    echo -e "2. Utiliser les descriptions dans docs/NEXT_STEPS.md"
    echo -e "3. Merge dans l'ordre: Phase 1 → 2 → 3 → 4"
    echo ""
    echo -e "${BLUE}Liens PRs:${NC}"
    echo -e "  • Phase 1: https://github.com/Luneo19/luneo-platform/pull/new/feature/critique-fixes"
    echo -e "  • Phase 2: https://github.com/Luneo19/luneo-platform/pull/new/feature/urgent-responsive"
    echo -e "  • Phase 3: https://github.com/Luneo19/luneo-platform/pull/new/feature/important-quality"
    echo -e "  • Phase 4: https://github.com/Luneo19/luneo-platform/pull/new/feature/finish-polish"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  PRÊT AVEC $WARNINGS AVERTISSEMENT(S)${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}\n"
    echo -e "${YELLOW}Vérifier les avertissements ci-dessus${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS ERREUR(S) TROUVÉE(S)${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}\n"
    echo -e "${RED}Corriger les erreurs avant de créer les PRs${NC}"
    exit 1
fi

