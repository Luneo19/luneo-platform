#!/bin/bash

# 🚀 LUNEO - Script de Setup Complet
# Ce script configure l'environnement de développement complet

set -e

echo "════════════════════════════════════════════════════════════════════════════"
echo "  🏗️ LUNEO - SETUP ENVIRONNEMENT DÉVELOPPEMENT PROFESSIONNEL  🏗️"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification des prérequis
check_prerequisites() {
    print_status "Vérification des prérequis..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js n'est pas installé. Veuillez installer Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ requis. Version actuelle: $(node -v)"
        exit 1
    fi
    
    # npm
    if ! command -v npm &> /dev/null; then
        print_error "npm n'est pas installé"
        exit 1
    fi
    
    # Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker n'est pas installé. Nécessaire pour le développement complet"
    fi
    
    # Git
    if ! command -v git &> /dev/null; then
        print_error "Git n'est pas installé"
        exit 1
    fi
    
    print_success "Prérequis vérifiés"
}

# Installation des dépendances globales
install_global_deps() {
    print_status "Installation des dépendances globales..."
    
    # Turborepo
    if ! command -v turbo &> /dev/null; then
        npm install -g turbo@latest
        print_success "Turborepo installé"
    fi
    
    # TypeScript
    if ! command -v tsc &> /dev/null; then
        npm install -g typescript@latest
        print_success "TypeScript installé"
    fi
    
    # Prisma CLI
    if ! command -v prisma &> /dev/null; then
        npm install -g prisma@latest
        print_success "Prisma CLI installé"
    fi
}

# Installation des dépendances du workspace
install_workspace_deps() {
    print_status "Installation des dépendances du workspace..."
    
    npm install
    print_success "Dépendances du workspace installées"
}

# Configuration de l'environnement
setup_environment() {
    print_status "Configuration de l'environnement..."
    
    # Copie des fichiers d'environnement
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Fichier .env créé à partir de .env.example"
        else
            print_warning "Fichier .env.example non trouvé"
        fi
    fi
    
    # Configuration des apps
    for app in apps/*/; do
        if [ -d "$app" ]; then
            app_name=$(basename "$app")
            if [ ! -f "$app/.env" ] && [ -f "$app/.env.example" ]; then
                cp "$app/.env.example" "$app/.env"
                print_success "Fichier .env créé pour $app_name"
            fi
        fi
    done
}

# Build des packages partagés
build_packages() {
    print_status "Build des packages partagés..."
    
    turbo build --filter="@luneo/types"
    turbo build --filter="@luneo/ui"
    print_success "Packages partagés construits"
}

# Configuration de la base de données
setup_database() {
    print_status "Configuration de la base de données..."
    
    cd apps/backend
    if [ -f "prisma/schema.prisma" ]; then
        npx prisma generate
        print_success "Client Prisma généré"
        
        # Migration en mode développement
        if [ "$NODE_ENV" != "production" ]; then
            npx prisma migrate dev --name init
            print_success "Migrations appliquées"
        fi
    fi
    cd ../..
}

# Configuration de Docker
setup_docker() {
    if command -v docker &> /dev/null; then
        print_status "Configuration de Docker..."
        
        if [ -f "docker-compose.dev.yml" ]; then
            docker-compose -f docker-compose.dev.yml pull
            print_success "Images Docker téléchargées"
        fi
    fi
}

# Configuration des hooks Git
setup_git_hooks() {
    print_status "Configuration des hooks Git..."
    
    if [ -d ".git" ]; then
        # Pre-commit hook
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 Vérification avant commit..."
npm run lint
npm run type-check
EOF
        chmod +x .git/hooks/pre-commit
        print_success "Hook pre-commit configuré"
    fi
}

# Test de l'installation
test_installation() {
    print_status "Test de l'installation..."
    
    # Test des scripts
    npm run type-check
    print_success "Vérification TypeScript réussie"
    
    npm run lint
    print_success "Linting réussi"
    
    print_success "Installation testée avec succès"
}

# Affichage des prochaines étapes
show_next_steps() {
    echo ""
    echo "════════════════════════════════════════════════════════════════════════════"
    echo "  ✅ SETUP TERMINÉ AVEC SUCCÈS !  ✅"
    echo "════════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "🚀 PROCHAINES ÉTAPES :"
    echo ""
    echo "1. Configuration de l'environnement :"
    echo "   • Éditez les fichiers .env dans chaque app"
    echo "   • Configurez vos clés API (OpenAI, Stripe, etc.)"
    echo ""
    echo "2. Démarrage du développement :"
    echo "   npm run dev          # Démarre tous les services"
    echo "   npm run dev:api      # API uniquement"
    echo "   npm run dev:frontend # Frontend uniquement"
    echo ""
    echo "3. Commandes utiles :"
    echo "   npm run build        # Build complet"
    echo "   npm run test         # Tests"
    echo "   npm run lint         # Linting"
    echo "   npm run type-check   # Vérification TypeScript"
    echo ""
    echo "4. Documentation :"
    echo "   • docs/README.md     # Documentation complète"
    echo "   • docs/ARCHITECTURE.md # Architecture du projet"
    echo ""
    echo "🎯 Bon développement avec Luneo !"
    echo ""
}

# Fonction principale
main() {
    check_prerequisites
    install_global_deps
    install_workspace_deps
    setup_environment
    build_packages
    setup_database
    setup_docker
    setup_git_hooks
    test_installation
    show_next_steps
}

# Exécution
main "$@"


