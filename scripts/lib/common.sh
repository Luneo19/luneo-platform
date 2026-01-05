#!/bin/bash
# Common functions and utilities for deployment scripts
# Source this file in other scripts: source "$(dirname "$0")/lib/common.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Check if command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        error "$1 n'est pas installé"
    fi
    success "$1 détecté"
}

# Check prerequisites
check_prerequisites() {
    log "🔍 Vérification des prérequis..."
    check_command node
    check_command pnpm
    [ -n "$VERCEL_TOKEN" ] || warning "VERCEL_TOKEN non défini"
    success "Prérequis vérifiés"
}

# Build backend
build_backend() {
    log "📦 Build du backend..."
    cd apps/backend || error "apps/backend introuvable"
    
    pnpm install --frozen-lockfile || error "Échec installation dépendances backend"
    [ -f "prisma/schema.prisma" ] && pnpm prisma generate || warning "Prisma schema non trouvé"
    pnpm build || error "Échec build backend"
    
    cd ../..
    success "Backend construit"
}

# Build frontend
build_frontend() {
    log "📦 Build du frontend..."
    cd apps/frontend || error "apps/frontend introuvable"
    
    pnpm install --frozen-lockfile || error "Échec installation dépendances frontend"
    pnpm build || error "Échec build frontend"
    
    cd ../..
    success "Frontend construit"
}

# Deploy to Vercel
deploy_vercel() {
    local app_dir="${1:-apps/frontend}"
    local project_name="${2:-frontend}"
    
    log "🚀 Déploiement sur Vercel ($project_name)..."
    cd "$app_dir" || error "$app_dir introuvable"
    
    check_command vercel
    vercel --prod --yes --token="${VERCEL_TOKEN}" || error "Échec déploiement Vercel"
    
    cd ../..
    success "$project_name déployé sur Vercel"
}

# Deploy to Hetzner
deploy_hetzner() {
    local server_ip="${HETZNER_IP:-116.203.31.129}"
    local server_user="${HETZNER_USER:-root}"
    local app_path="${HETZNER_PATH:-/opt/luneo}"
    
    log "🚀 Déploiement sur Hetzner..."
    
    cd apps/backend || error "apps/backend introuvable"
    tar -czf ../../backend-deploy.tar.gz dist/ node_modules/ prisma/ package.json || error "Échec création archive"
    cd ../..
    
    scp -o StrictHostKeyChecking=no backend-deploy.tar.gz "${server_user}@${server_ip}:${app_path}/" || error "Échec upload"
    
    ssh -o StrictHostKeyChecking=no "${server_user}@${server_ip}" << EOF
        cd ${app_path}
        tar -xzf backend-deploy.tar.gz
        rm backend-deploy.tar.gz
        pm2 restart luneo-api || pm2 start dist/main.js --name luneo-api
        pm2 save
EOF
    
    rm backend-deploy.tar.gz
    success "Backend déployé sur Hetzner"
}

# Run tests
run_tests() {
    log "🧪 Exécution des tests..."
    pnpm test || warning "Tests échoués"
    success "Tests terminés"
}


#!/bin/bash
# Common functions and utilities for deployment scripts
# Source this file in other scripts: source "$(dirname "$0")/lib/common.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Check if command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        error "$1 n'est pas installé"
    fi
    success "$1 détecté"
}

# Check prerequisites
check_prerequisites() {
    log "🔍 Vérification des prérequis..."
    check_command node
    check_command pnpm
    [ -n "$VERCEL_TOKEN" ] || warning "VERCEL_TOKEN non défini"
    success "Prérequis vérifiés"
}

# Build backend
build_backend() {
    log "📦 Build du backend..."
    cd apps/backend || error "apps/backend introuvable"
    
    pnpm install --frozen-lockfile || error "Échec installation dépendances backend"
    [ -f "prisma/schema.prisma" ] && pnpm prisma generate || warning "Prisma schema non trouvé"
    pnpm build || error "Échec build backend"
    
    cd ../..
    success "Backend construit"
}

# Build frontend
build_frontend() {
    log "📦 Build du frontend..."
    cd apps/frontend || error "apps/frontend introuvable"
    
    pnpm install --frozen-lockfile || error "Échec installation dépendances frontend"
    pnpm build || error "Échec build frontend"
    
    cd ../..
    success "Frontend construit"
}

# Deploy to Vercel
deploy_vercel() {
    local app_dir="${1:-apps/frontend}"
    local project_name="${2:-frontend}"
    
    log "🚀 Déploiement sur Vercel ($project_name)..."
    cd "$app_dir" || error "$app_dir introuvable"
    
    check_command vercel
    vercel --prod --yes --token="${VERCEL_TOKEN}" || error "Échec déploiement Vercel"
    
    cd ../..
    success "$project_name déployé sur Vercel"
}

# Deploy to Hetzner
deploy_hetzner() {
    local server_ip="${HETZNER_IP:-116.203.31.129}"
    local server_user="${HETZNER_USER:-root}"
    local app_path="${HETZNER_PATH:-/opt/luneo}"
    
    log "🚀 Déploiement sur Hetzner..."
    
    cd apps/backend || error "apps/backend introuvable"
    tar -czf ../../backend-deploy.tar.gz dist/ node_modules/ prisma/ package.json || error "Échec création archive"
    cd ../..
    
    scp -o StrictHostKeyChecking=no backend-deploy.tar.gz "${server_user}@${server_ip}:${app_path}/" || error "Échec upload"
    
    ssh -o StrictHostKeyChecking=no "${server_user}@${server_ip}" << EOF
        cd ${app_path}
        tar -xzf backend-deploy.tar.gz
        rm backend-deploy.tar.gz
        pm2 restart luneo-api || pm2 start dist/main.js --name luneo-api
        pm2 save
EOF
    
    rm backend-deploy.tar.gz
    success "Backend déployé sur Hetzner"
}

# Run tests
run_tests() {
    log "🧪 Exécution des tests..."
    pnpm test || warning "Tests échoués"
    success "Tests terminés"
}

























