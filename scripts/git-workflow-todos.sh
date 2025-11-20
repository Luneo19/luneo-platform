#!/bin/bash

# 🚀 Script de gestion Git pour les TODOs optimisés
# Usage: ./scripts/git-workflow-todos.sh [phase|status|create-branch]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions
print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier qu'on est dans un repo git
if [ ! -d .git ]; then
    print_error "Ce script doit être exécuté dans un repository git"
    exit 1
fi

# Vérifier qu'on est sur develop ou main
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "develop" && "$CURRENT_BRANCH" != "main" ]]; then
    print_warning "Vous êtes sur la branche '$CURRENT_BRANCH'"
    read -p "Continuer quand même? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Fonction: Créer branche pour une phase
create_phase_branch() {
    local phase=$1
    local branch_name=""
    local description=""
    
    case $phase in
        1)
            branch_name="feature/critique-fixes"
            description="Phase 1: Corrections critiques (broken imports, localhost, responsive critique)"
            ;;
        2)
            branch_name="feature/urgent-responsive"
            description="Phase 2: Responsive urgent (pages publiques, dashboard, dark theme)"
            ;;
        3)
            branch_name="feature/important-quality"
            description="Phase 3: Qualité importante (UX/UI, fonctionnalités avancées)"
            ;;
        4)
            branch_name="feature/finish-polish"
            description="Phase 4: Finitions (cleanup, tests, deploy, documentation)"
            ;;
        *)
            print_error "Phase invalide. Utilisez 1, 2, 3 ou 4"
            exit 1
            ;;
    esac
    
    # Vérifier si la branche existe déjà
    if git show-ref --verify --quiet refs/heads/$branch_name; then
        print_warning "La branche '$branch_name' existe déjà"
        read -p "Voulez-vous la supprimer et la recréer? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git branch -D $branch_name 2>/dev/null || true
        else
            print_warning "Basculement vers la branche existante..."
            git checkout $branch_name
            exit 0
        fi
    fi
    
    print_header "Création branche Phase $phase"
    echo -e "${BLUE}Description:${NC} $description"
    echo -e "${BLUE}Branche:${NC} $branch_name"
    echo ""
    
    # Créer et basculer sur la branche
    git checkout -b $branch_name
    
    print_success "Branche '$branch_name' créée et activée"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "  1. Travailler sur les tâches de la Phase $phase"
    echo "  2. Commiter régulièrement avec: git commit -m 'type(scope): description'"
    echo "  3. Pousser avec: git push origin $branch_name"
    echo "  4. Créer une Pull Request vers 'develop'"
}

# Fonction: Afficher le statut des phases
show_status() {
    print_header "Statut des TODOs par Phase"
    
    # Compter les branches existantes
    local phase1_exists=$(git show-ref --verify --quiet refs/heads/feature/critique-fixes && echo "yes" || echo "no")
    local phase2_exists=$(git show-ref --verify --quiet refs/heads/feature/urgent-responsive && echo "yes" || echo "no")
    local phase3_exists=$(git show-ref --verify --quiet refs/heads/feature/important-quality && echo "yes" || echo "no")
    local phase4_exists=$(git show-ref --verify --quiet refs/heads/feature/finish-polish && echo "yes" || echo "no")
    
    echo -e "${BLUE}Phase 1 (Critique):${NC}"
    if [ "$phase1_exists" = "yes" ]; then
        print_success "Branche 'feature/critique-fixes' existe"
        echo "  → 15 tâches critiques (6h 55min)"
    else
        print_warning "Branche non créée"
    fi
    
    echo ""
    echo -e "${BLUE}Phase 2 (Urgent):${NC}"
    if [ "$phase2_exists" = "yes" ]; then
        print_success "Branche 'feature/urgent-responsive' existe"
        echo "  → 25 tâches urgentes (14h)"
    else
        print_warning "Branche non créée"
    fi
    
    echo ""
    echo -e "${BLUE}Phase 3 (Important):${NC}"
    if [ "$phase3_exists" = "yes" ]; then
        print_success "Branche 'feature/important-quality' existe"
        echo "  → 35 tâches importantes (28h)"
    else
        print_warning "Branche non créée"
    fi
    
    echo ""
    echo -e "${BLUE}Phase 4 (Finitions):${NC}"
    if [ "$phase4_exists" = "yes" ]; then
        print_success "Branche 'feature/finish-polish' existe"
        echo "  → 17 tâches de finition (4h)"
    else
        print_warning "Branche non créée"
    fi
    
    echo ""
    echo -e "${YELLOW}📊 Total estimé: 98 tâches • ~53h de développement${NC}"
}

# Fonction: Afficher l'aide
show_help() {
    print_header "Git Workflow TODOs - Aide"
    
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  phase [1-4]     Créer une branche pour une phase spécifique"
    echo "  status           Afficher le statut des phases"
    echo "  help             Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 phase 1      Créer branche Phase 1 (Critique)"
    echo "  $0 phase 2      Créer branche Phase 2 (Urgent)"
    echo "  $0 status       Voir statut des branches"
    echo ""
    echo "Phases:"
    echo "  1 - Critique    (15 tâches, 6h 55min) - Broken imports, responsive critique"
    echo "  2 - Urgent      (25 tâches, 14h) - Responsive pages, dark theme"
    echo "  3 - Important   (35 tâches, 28h) - UX/UI, fonctionnalités avancées"
    echo "  4 - Finitions   (17 tâches, 4h) - Cleanup, tests, deploy"
}

# Main
case "$1" in
    phase)
        if [ -z "$2" ]; then
            print_error "Veuillez spécifier une phase (1, 2, 3 ou 4)"
            echo ""
            show_help
            exit 1
        fi
        create_phase_branch "$2"
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    "")
        print_header "Git Workflow TODOs"
        echo "Utilisez '$0 help' pour voir l'aide"
        echo ""
        show_status
        ;;
    *)
        print_error "Commande inconnue: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

