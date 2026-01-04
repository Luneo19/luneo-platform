#!/bin/bash

# ==============================================
# VÉRIFICATION COMPLÈTE DE L'ÉTAT PRODUCTION
# LUNEO - SaaS de niveau mondial #1
# ==============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$(dirname "$BACKEND_DIR")")"
FRONTEND_DIR="$ROOT_DIR/apps/frontend"

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# ==============================================
# FONCTIONS
# ==============================================

check_pass() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    WARNING_CHECKS=$((WARNING_CHECKS + 1))
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# ==============================================
# BANNER
# ==============================================
clear
echo -e "${BLUE}${BOLD}"
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  🔍 VÉRIFICATION COMPLÈTE DE L'ÉTAT PRODUCTION                    ║"
echo "║  LUNEO - SaaS de niveau mondial #1                                ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# ==============================================
# 1. VÉRIFICATION DES FICHIERS DE CONFIGURATION
# ==============================================
echo -e "${MAGENTA}${BOLD}📁 1. FICHIERS DE CONFIGURATION${NC}"
echo ""

# Backend .env.production
if [ -f "$BACKEND_DIR/.env.production" ]; then
    check_pass "Backend .env.production existe"
    
    # Vérifier les variables critiques
    source "$BACKEND_DIR/.env.production" 2>/dev/null || true
    
    if [ -n "$DATABASE_URL" ] && [[ ! "$DATABASE_URL" == *"["* ]]; then
        check_pass "DATABASE_URL configurée"
    else
        check_fail "DATABASE_URL non configurée ou invalide"
    fi
    
    if [ -n "$JWT_SECRET" ] && [[ ! "$JWT_SECRET" == *"["* ]]; then
        check_pass "JWT_SECRET configurée"
    else
        check_fail "JWT_SECRET non configurée ou invalide"
    fi
    
    if [ -n "$REDIS_URL" ]; then
        check_pass "REDIS_URL configurée"
    else
        check_warn "REDIS_URL non configurée (optionnel)"
    fi
else
    check_fail "Backend .env.production manquant"
fi

# Frontend .env.production
if [ -f "$FRONTEND_DIR/.env.production" ]; then
    check_pass "Frontend .env.production existe"
else
    check_fail "Frontend .env.production manquant"
fi

echo ""

# ==============================================
# 2. VÉRIFICATION DES SCRIPTS
# ==============================================
echo -e "${MAGENTA}${BOLD}🔧 2. SCRIPTS UTILITAIRES${NC}"
echo ""

REQUIRED_SCRIPTS=(
    "verify-production-config.sh"
    "migrate-production-database.sh"
    "setup-vercel-variables.sh"
    "deploy-production-complete.sh"
    "health-check.sh"
    "monitor-production.sh"
    "backup-database.sh"
    "security-audit.sh"
    "master-production-setup.sh"
    "setup-production-complete.sh"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ -f "$BACKEND_DIR/scripts/$script" ] && [ -x "$BACKEND_DIR/scripts/$script" ]; then
        check_pass "Script $script existe et est exécutable"
    else
        check_fail "Script $script manquant ou non exécutable"
    fi
done

echo ""

# ==============================================
# 3. VÉRIFICATION PRISMA
# ==============================================
echo -e "${MAGENTA}${BOLD}🗄️  3. BASE DE DONNÉES (PRISMA)${NC}"
echo ""

cd "$BACKEND_DIR"

if command -v npx &> /dev/null; then
    if npx prisma validate > /dev/null 2>&1; then
        check_pass "Schema Prisma valide"
    else
        check_fail "Schema Prisma invalide"
    fi
    
    if [ -d "node_modules/.prisma" ] || [ -d "node_modules/@prisma" ]; then
        check_pass "Client Prisma généré"
    else
        check_warn "Client Prisma non généré (exécutez: npx prisma generate)"
    fi
else
    check_fail "npx non disponible"
fi

echo ""

# ==============================================
# 4. VÉRIFICATION DES BUILDS
# ==============================================
echo -e "${MAGENTA}${BOLD}🔨 4. BUILDS${NC}"
echo ""

# Backend build
if [ -d "$BACKEND_DIR/dist" ]; then
    check_pass "Build Backend présent"
else
    check_warn "Build Backend absent (exécutez: npm run build)"
fi

# Frontend build
if [ -d "$FRONTEND_DIR/.next" ]; then
    check_pass "Build Frontend présent"
else
    check_warn "Build Frontend absent (exécutez: pnpm run build)"
fi

echo ""

# ==============================================
# 5. VÉRIFICATION DOCKER
# ==============================================
echo -e "${MAGENTA}${BOLD}🐳 5. DOCKER${NC}"
echo ""

if [ -f "$BACKEND_DIR/Dockerfile.production" ]; then
    check_pass "Dockerfile.production existe"
else
    check_warn "Dockerfile.production manquant"
fi

if [ -f "$BACKEND_DIR/docker-compose.production.yml" ]; then
    check_pass "docker-compose.production.yml existe"
else
    check_warn "docker-compose.production.yml manquant"
fi

if [ -f "$BACKEND_DIR/nginx.production.conf" ]; then
    check_pass "nginx.production.conf existe"
else
    check_warn "nginx.production.conf manquant"
fi

echo ""

# ==============================================
# 6. VÉRIFICATION CI/CD
# ==============================================
echo -e "${MAGENTA}${BOLD}🔄 6. CI/CD${NC}"
echo ""

if [ -f "$ROOT_DIR/.github/workflows/production-deploy.yml" ]; then
    check_pass "GitHub Actions workflow existe"
else
    check_warn "GitHub Actions workflow manquant"
fi

echo ""

# ==============================================
# 7. VÉRIFICATION VERCEL
# ==============================================
echo -e "${MAGENTA}${BOLD}🚀 7. DÉPLOIEMENT VERCEL${NC}"
echo ""

if command -v vercel &> /dev/null; then
    check_pass "Vercel CLI installé"
    
    # Vérifier si connecté
    if vercel whoami > /dev/null 2>&1; then
        check_pass "Vercel CLI connecté"
        
        # Vérifier les projets
        BACKEND_PROJECT=$(vercel ls 2>/dev/null | grep -i backend || echo "")
        FRONTEND_PROJECT=$(vercel ls 2>/dev/null | grep -i frontend || echo "")
        
        if [ -n "$BACKEND_PROJECT" ]; then
            check_pass "Projet Backend Vercel trouvé"
        else
            check_warn "Projet Backend Vercel non trouvé"
        fi
        
        if [ -n "$FRONTEND_PROJECT" ]; then
            check_pass "Projet Frontend Vercel trouvé"
        else
            check_warn "Projet Frontend Vercel non trouvé"
        fi
    else
        check_warn "Vercel CLI non connecté (exécutez: vercel login)"
    fi
else
    check_warn "Vercel CLI non installé"
fi

echo ""

# ==============================================
# 8. VÉRIFICATION DES SERVICES EXTERNES
# ==============================================
echo -e "${MAGENTA}${BOLD}🌐 8. SERVICES EXTERNES${NC}"
echo ""

if [ -f "$BACKEND_DIR/.env.production" ]; then
    source "$BACKEND_DIR/.env.production" 2>/dev/null || true
    
    if [ -n "$STRIPE_SECRET_KEY" ] && [[ ! "$STRIPE_SECRET_KEY" == *"["* ]]; then
        check_pass "Stripe configuré"
    else
        check_warn "Stripe non configuré"
    fi
    
    if [ -n "$OPENAI_API_KEY" ] && [[ ! "$OPENAI_API_KEY" == *"["* ]]; then
        check_pass "OpenAI configuré"
    else
        check_warn "OpenAI non configuré (optionnel)"
    fi
    
    if [ -n "$CLOUDINARY_CLOUD_NAME" ]; then
        check_pass "Cloudinary configuré"
    else
        check_warn "Cloudinary non configuré (optionnel)"
    fi
    
    if [ -n "$SENTRY_DSN" ]; then
        check_pass "Sentry configuré"
    else
        check_warn "Sentry non configuré (optionnel)"
    fi
fi

echo ""

# ==============================================
# 9. VÉRIFICATION DOCUMENTATION
# ==============================================
echo -e "${MAGENTA}${BOLD}📚 9. DOCUMENTATION${NC}"
echo ""

if [ -f "$ROOT_DIR/PRODUCTION_COMPLETE_SETUP.md" ]; then
    check_pass "PRODUCTION_COMPLETE_SETUP.md existe"
else
    check_warn "PRODUCTION_COMPLETE_SETUP.md manquant"
fi

if [ -f "$ROOT_DIR/DEPLOYMENT_GUIDE_COMPLETE.md" ]; then
    check_pass "DEPLOYMENT_GUIDE_COMPLETE.md existe"
else
    check_warn "DEPLOYMENT_GUIDE_COMPLETE.md manquant"
fi

echo ""

# ==============================================
# RÉSUMÉ FINAL
# ==============================================
echo -e "${BLUE}${BOLD}"
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  📊 RÉSUMÉ DE LA VÉRIFICATION                                     ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

echo -e "${CYAN}Total des vérifications: $TOTAL_CHECKS${NC}"
echo -e "${GREEN}✅ Réussies: $PASSED_CHECKS${NC}"
echo -e "${YELLOW}⚠️  Avertissements: $WARNING_CHECKS${NC}"
echo -e "${RED}❌ Échecs: $FAILED_CHECKS${NC}"
echo ""

# Calcul du pourcentage
if [ $TOTAL_CHECKS -gt 0 ]; then
    PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo -e "${CYAN}Taux de réussite: $PERCENTAGE%${NC}"
    echo ""
fi

# État global
if [ $FAILED_CHECKS -eq 0 ] && [ $WARNING_CHECKS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✅ TOUT EST CONFIGURÉ ET PRÊT POUR PRODUCTION!${NC}"
    echo ""
    echo -e "${CYAN}Prochaines étapes:${NC}"
    echo "   1. Migrer la base de données: ./scripts/migrate-production-database.sh"
    echo "   2. Configurer Vercel: ./scripts/setup-vercel-variables.sh"
    echo "   3. Déployer: ./scripts/deploy-production-complete.sh"
elif [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${YELLOW}${BOLD}⚠️  CONFIGURATION PRESQUE COMPLÈTE${NC}"
    echo ""
    echo -e "${CYAN}Certains éléments optionnels manquent mais la configuration de base est OK.${NC}"
    echo ""
    echo -e "${CYAN}Pour compléter:${NC}"
    echo "   1. Exécutez: ./scripts/master-production-setup.sh"
    echo "   2. Configurez les services optionnels manquants"
else
    echo -e "${RED}${BOLD}❌ CONFIGURATION INCOMPLÈTE${NC}"
    echo ""
    echo -e "${CYAN}Actions requises:${NC}"
    echo "   1. Exécutez: ./scripts/master-production-setup.sh"
    echo "   2. Corrigez les erreurs listées ci-dessus"
    echo "   3. Relancez cette vérification"
fi

echo ""

# Code de sortie
if [ $FAILED_CHECKS -eq 0 ]; then
    exit 0
else
    exit 1
fi





























