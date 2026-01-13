#!/bin/bash

# ==============================================
# 🚀 SCRIPT DE DÉPLOIEMENT PRODUCTION COMPLET
# LUNEO Platform - Déploiement Backend + Frontend
# ==============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Fonctions
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# ==============================================
# 1. VÉRIFICATIONS PRÉ-DÉPLOIEMENT
# ==============================================

log "🔍 Vérifications pré-déploiement..."

# Vérifier Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    error "Node.js 22+ requis. Version actuelle: $(node --version)"
fi
success "Node.js version: $(node --version)"

# Vérifier Git
if ! command -v git &> /dev/null; then
    error "Git n'est pas installé"
fi

# Vérifier branche
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    warn "Vous n'êtes pas sur la branche main/master (actuellement: $CURRENT_BRANCH)"
    read -p "Continuer quand même? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Vérifier modifications non commitées
if [ -n "$(git status --porcelain)" ]; then
    warn "Il y a des modifications non commitées"
    git status --short | head -10
    read -p "Voulez-vous les commiter avant le déploiement? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "📝 Commit des modifications..."
        git add .
        git commit -m "chore: prepare production deployment - $TIMESTAMP" || true
        success "Modifications commitées"
    fi
fi

# Vérifier que le repo est à jour
log "📥 Vérification des mises à jour distantes..."
git fetch origin
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})
if [ "$LOCAL" != "$REMOTE" ]; then
    warn "Votre branche locale n'est pas à jour avec origin"
    read -p "Voulez-vous pull les dernières modifications? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git pull origin "$CURRENT_BRANCH"
        success "Code mis à jour"
    fi
fi

# ==============================================
# 2. BUILD BACKEND
# ==============================================

log "🔨 Build du backend..."
cd "$PROJECT_DIR/apps/backend"

# Installer dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    log "📦 Installation des dépendances backend..."
    npm install
fi

# Générer Prisma Client
log "🔧 Génération du Prisma Client..."
npx prisma generate || warn "Prisma generate a échoué (peut être normal si déjà généré)"

# Build
log "🏗️  Compilation TypeScript..."
if npm run build; then
    success "Build backend réussi"
else
    error "Build backend échoué"
fi

# ==============================================
# 3. BUILD FRONTEND (optionnel)
# ==============================================

log "🔨 Build du frontend..."
cd "$PROJECT_DIR/apps/frontend"

# Installer dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    log "📦 Installation des dépendances frontend..."
    pnpm install
fi

# Générer Prisma Client
log "🔧 Génération du Prisma Client..."
pnpm prisma generate || warn "Prisma generate a échoué (peut être normal si déjà généré)"

# Build (on continue même si ça échoue car le backend est critique)
log "🏗️  Build Next.js..."
if pnpm run build 2>&1 | tee /tmp/frontend-build.log; then
    success "Build frontend réussi"
else
    warn "Build frontend a échoué (vérifiez les erreurs ci-dessus)"
    read -p "Continuer le déploiement quand même? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ==============================================
# 4. PUSH VERS GIT (si modifications)
# ==============================================

cd "$PROJECT_DIR"

if [ -n "$(git status --porcelain)" ]; then
    log "📤 Push des modifications vers Git..."
    read -p "Voulez-vous push vers origin/$CURRENT_BRANCH? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin "$CURRENT_BRANCH"
        success "Code poussé vers Git"
    fi
fi

# ==============================================
# 5. DÉPLOIEMENT
# ==============================================

log "🚀 Déploiement en production..."

# Option 1: GitHub Actions (recommandé)
if command -v gh &> /dev/null; then
    log "📋 Utilisation de GitHub Actions..."
    read -p "Déclencher le workflow GitHub Actions? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "🔄 Déclenchement du workflow production-deploy..."
        if gh workflow run production-deploy.yml --ref "$CURRENT_BRANCH" --field environment=production; then
            success "Workflow GitHub Actions déclenché!"
            log "📊 Suivez le déploiement: https://github.com/$(gh repo view --json owner,name -q '.owner.login + "/" + .name')/actions"
            exit 0
        else
            error "Échec du déclenchement du workflow"
        fi
    fi
fi

# Option 2: Vercel CLI
if command -v vercel &> /dev/null; then
    log "📋 Utilisation de Vercel CLI..."
    read -p "Déployer avec Vercel CLI? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Backend
        log "🚀 Déploiement backend..."
        cd "$PROJECT_DIR/apps/backend"
        vercel --prod --yes || warn "Déploiement backend Vercel échoué"
        
        # Frontend
        log "🚀 Déploiement frontend..."
        cd "$PROJECT_DIR/apps/frontend"
        vercel --prod --yes || warn "Déploiement frontend Vercel échoué"
        
        success "Déploiement Vercel terminé!"
        exit 0
    fi
fi

# Option 3: Instructions manuelles
warn "Aucun outil de déploiement automatique trouvé"
echo ""
echo "📋 Options de déploiement manuel:"
echo ""
echo "1. GitHub Actions (recommandé):"
echo "   - Allez sur: https://github.com/[votre-repo]/actions"
echo "   - Cliquez sur '🚀 Production Deploy'"
echo "   - Cliquez sur 'Run workflow'"
echo "   - Sélectionnez 'production' et cliquez sur 'Run workflow'"
echo ""
echo "2. Vercel Dashboard:"
echo "   - Backend: https://vercel.com/[votre-team]/[backend-project]"
echo "   - Frontend: https://vercel.com/[votre-team]/[frontend-project]"
echo ""
echo "3. Vercel CLI (installer avec: npm i -g vercel):"
echo "   cd apps/backend && vercel --prod"
echo "   cd apps/frontend && vercel --prod"
echo ""

success "✅ Préparation du déploiement terminée!"
echo ""
echo "📊 Résumé:"
echo "   - Backend: ✅ Build réussi"
echo "   - Frontend: $(if [ -f /tmp/frontend-build.log ] && grep -q "Build successful" /tmp/frontend-build.log; then echo "✅ Build réussi"; else echo "⚠️  Build avec erreurs"; fi)"
echo "   - Git: $(git rev-parse --short HEAD)"
echo "   - Branche: $CURRENT_BRANCH"
echo ""
echo "🚀 Prêt pour le déploiement!"
