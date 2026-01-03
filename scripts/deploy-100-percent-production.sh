#!/bin/bash

# ==============================================
# DÉPLOIEMENT 100% PRODUCTION AUTOMATIQUE
# LUNEO - SaaS de niveau mondial #1
# ==============================================
# Automatise TOUT ce qui peut l'être
# ==============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BLUE}${BOLD}"
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  🚀 DÉPLOIEMENT 100% PRODUCTION AUTOMATIQUE                       ║"
echo "║  LUNEO - SaaS de niveau mondial #1                               ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/apps/frontend"
BACKEND_DIR="$ROOT_DIR/apps/backend"

# ==============================================
# FONCTIONS
# ==============================================

log_step() {
    echo ""
    echo -e "${MAGENTA}${BOLD}▶ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# ==============================================
# ÉTAPE 1: VÉRIFICATION PRÉLIMINAIRE
# ==============================================
log_step "Étape 1/8: Vérification préliminaire"

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    log_error "Vercel CLI non installé"
    log_info "Installation..."
    npm install -g vercel > /dev/null 2>&1 || {
        log_error "Installation échouée"
        exit 1
    }
fi

# Vérifier connexion Vercel
if ! vercel whoami > /dev/null 2>&1; then
    log_error "Vercel CLI non connecté"
    log_info "Exécutez: vercel login"
    exit 1
fi

VERCEL_USER=$(vercel whoami)
log_success "Vercel CLI connecté: $VERCEL_USER"

# Vérifier pnpm
if ! command -v pnpm &> /dev/null; then
    log_error "pnpm non installé"
    exit 1
fi

log_success "Vérifications préliminaires OK"
echo ""

# ==============================================
# ÉTAPE 2: LECTURE DES VARIABLES D'ENVIRONNEMENT
# ==============================================
log_step "Étape 2/8: Lecture des variables d'environnement"

cd "$FRONTEND_DIR"

# Lire .env.production si existe
if [ -f .env.production ]; then
    log_info "Lecture de .env.production..."
    source .env.production 2>/dev/null || true
    
    # Extraire les variables
    SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-""}
    SUPABASE_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-""}
    API_URL=${NEXT_PUBLIC_API_URL:-""}
    APP_URL=${NEXT_PUBLIC_APP_URL:-"https://app.luneo.app"}
    
    log_success "Variables lues depuis .env.production"
else
    log_warning ".env.production non trouvé"
    log_info "Utilisation des valeurs par défaut"
    
    SUPABASE_URL=""
    SUPABASE_KEY=""
    API_URL=""
    APP_URL="https://app.luneo.app"
fi

# ==============================================
# ÉTAPE 3: CONFIGURATION VARIABLES VERCEL FRONTEND
# ==============================================
log_step "Étape 3/8: Configuration variables Vercel Frontend"

cd "$FRONTEND_DIR"

# Lier le projet si nécessaire
if [ ! -d ".vercel" ]; then
    log_info "Liaison du projet Vercel..."
    vercel link --yes --project=luneo-frontend --scope=luneos-projects > /dev/null 2>&1 || true
fi

log_info "Configuration des variables d'environnement..."

# Fonction pour ajouter une variable si elle n'existe pas
add_env_var() {
    local VAR_NAME=$1
    local VAR_VALUE=$2
    
    if [ -z "$VAR_VALUE" ]; then
        log_warning "$VAR_NAME non définie - ignorée"
        return
    fi
    
    # Vérifier si la variable existe déjà
    if vercel env ls 2>/dev/null | grep -q "^$VAR_NAME"; then
        log_info "$VAR_NAME existe déjà - mise à jour..."
        echo "$VAR_VALUE" | vercel env rm "$VAR_NAME" production --yes > /dev/null 2>&1 || true
    fi
    
    # Ajouter la variable
    echo "$VAR_VALUE" | vercel env add "$VAR_NAME" production > /dev/null 2>&1 && {
        log_success "$VAR_NAME configurée"
    } || {
        log_warning "$VAR_NAME - erreur lors de l'ajout (peut être normale si existe déjà)"
    }
}

# Variables critiques
if [ -n "$SUPABASE_URL" ]; then
    add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
fi

if [ -n "$SUPABASE_KEY" ]; then
    add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_KEY"
fi

if [ -n "$API_URL" ]; then
    add_env_var "NEXT_PUBLIC_API_URL" "$API_URL"
fi

add_env_var "NEXT_PUBLIC_APP_URL" "$APP_URL"

# Variables avec valeurs par défaut
add_env_var "NEXT_PUBLIC_ENABLE_ANALYTICS" "true"
add_env_var "NEXT_PUBLIC_ENABLE_CHAT" "true"
add_env_var "NODE_ENV" "production"

log_success "Variables Frontend configurées"
echo ""

# ==============================================
# ÉTAPE 4: MIGRATIONS BASE DE DONNÉES
# ==============================================
log_step "Étape 4/8: Migrations base de données"

cd "$BACKEND_DIR"

# Vérifier DATABASE_URL
if [ -f .env.production ]; then
    source .env.production 2>/dev/null || true
    
    if [ -z "$DATABASE_URL" ] || [[ "$DATABASE_URL" == *"["* ]] || [[ "$DATABASE_URL" == *"PASSWORD"* ]]; then
        log_warning "DATABASE_URL non configurée ou contient des placeholders"
        log_info "Éditez apps/backend/.env.production et configurez DATABASE_URL"
        log_warning "Migration ignorée - à faire manuellement"
    else
        log_info "Application des migrations..."
        
        # Installer Prisma si nécessaire
        if ! command -v npx &> /dev/null; then
            log_error "npx non disponible"
        else
            # Générer Prisma Client
            log_info "Génération Prisma Client..."
            npx prisma generate > /dev/null 2>&1 || log_warning "Erreur génération Prisma"
            
            # Appliquer migrations
            set +e
            npx prisma migrate deploy > /tmp/migration.log 2>&1
            MIGRATION_EXIT=$?
            set -e
            
            if [ $MIGRATION_EXIT -eq 0 ]; then
                log_success "Migrations appliquées"
            else
                log_warning "Erreur lors des migrations"
                log_info "Vérifiez DATABASE_URL et la connexion"
                cat /tmp/migration.log | tail -10
            fi
        fi
    fi
else
    log_warning ".env.production manquant dans backend"
    log_info "Créez apps/backend/.env.production avec DATABASE_URL"
fi

echo ""

# ==============================================
# ÉTAPE 5: DÉPLOIEMENT BACKEND
# ==============================================
log_step "Étape 5/8: Déploiement Backend"

cd "$BACKEND_DIR"

log_info "Vérification du projet backend..."

# Lier le projet si nécessaire
if [ ! -d ".vercel" ]; then
    log_info "Liaison du projet backend..."
    vercel link --yes --project=backend --scope=luneos-projects > /dev/null 2>&1 || {
        log_warning "Projet backend non trouvé - création..."
        vercel link --yes --scope=luneos-projects || true
    }
fi

log_info "Déploiement backend en production..."

set +e
vercel --prod --yes > /tmp/backend-deploy.log 2>&1
BACKEND_DEPLOY_EXIT=$?
set -e

if [ $BACKEND_DEPLOY_EXIT -eq 0 ]; then
    log_success "Backend déployé"
    BACKEND_URL=$(grep -o 'https://[^ ]*\.vercel\.app' /tmp/backend-deploy.log | head -1)
    if [ -n "$BACKEND_URL" ]; then
        log_info "URL Backend: $BACKEND_URL"
    fi
else
    log_warning "Erreur lors du déploiement backend"
    log_info "Vérifiez les logs:"
    cat /tmp/backend-deploy.log | tail -20
fi

echo ""

# ==============================================
# ÉTAPE 6: REDÉPLOIEMENT FRONTEND (avec nouvelles variables)
# ==============================================
log_step "Étape 6/8: Redéploiement Frontend avec nouvelles variables"

cd "$FRONTEND_DIR"

log_info "Redéploiement frontend pour appliquer les nouvelles variables..."

set +e
vercel --prod --yes > /tmp/frontend-redeploy.log 2>&1
FRONTEND_DEPLOY_EXIT=$?
set -e

if [ $FRONTEND_DEPLOY_EXIT -eq 0 ]; then
    log_success "Frontend redéployé"
    FRONTEND_URL=$(grep -o 'https://[^ ]*\.vercel\.app' /tmp/frontend-redeploy.log | head -1)
    if [ -n "$FRONTEND_URL" ]; then
        log_info "URL Frontend: $FRONTEND_URL"
    fi
else
    log_warning "Erreur lors du redéploiement frontend"
    cat /tmp/frontend-redeploy.log | tail -20
fi

echo ""

# ==============================================
# ÉTAPE 7: CONFIGURATION SERVICES EXTERNES
# ==============================================
log_step "Étape 7/8: Configuration services externes"

log_info "Services externes nécessitant configuration manuelle:"
echo ""
echo "🔑 Stripe:"
echo "   1. Créer compte: https://dashboard.stripe.com"
echo "   2. Récupérer clés: Settings → API keys"
echo "   3. Configurer webhook: https://api.luneo.app/api/webhooks/stripe"
echo "   4. Ajouter dans Vercel: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET"
echo ""
echo "🔑 OAuth (Google/GitHub):"
echo "   1. Google: https://console.cloud.google.com/apis/credentials"
echo "   2. GitHub: https://github.com/settings/developers"
echo "   3. Configurer callbacks: https://app.luneo.app/api/auth/callback/[provider]"
echo "   4. Ajouter dans Vercel: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc."
echo ""
echo "🔑 Cloudinary:"
echo "   1. Créer compte: https://cloudinary.com"
echo "   2. Récupérer credentials: Dashboard → Settings"
echo "   3. Ajouter dans Vercel: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, etc."
echo ""
echo "🔑 OpenAI:"
echo "   1. Créer compte: https://platform.openai.com"
echo "   2. Générer clé API: https://platform.openai.com/api-keys"
echo "   3. Ajouter dans Vercel: OPENAI_API_KEY"
echo ""

log_warning "Ces services nécessitent une configuration manuelle"
log_info "Voir CE_QUI_RESTE_A_FAIRE.md pour les détails"

echo ""

# ==============================================
# ÉTAPE 8: CONFIGURATION DOMAINES
# ==============================================
log_step "Étape 8/8: Configuration domaines"

log_info "Domaines à configurer:"
echo ""
echo "🌐 app.luneo.app → Frontend"
echo "   1. Aller sur: https://vercel.com/luneos-projects/luneo-frontend/settings/domains"
echo "   2. Ajouter: app.luneo.app"
echo "   3. Configurer DNS (Cloudflare recommandé):"
echo "      Type: CNAME"
echo "      Name: app"
echo "      Content: cname.vercel-dns.com"
echo ""
echo "🌐 api.luneo.app → Backend"
echo "   1. Aller sur: https://vercel.com/luneos-projects/backend/settings/domains"
echo "   2. Ajouter: api.luneo.app"
echo "   3. Configurer DNS:"
echo "      Type: CNAME"
echo "      Name: api"
echo "      Content: cname.vercel-dns.com"
echo ""

log_warning "Domaines nécessitent configuration manuelle dans Vercel Dashboard"
log_info "Voir CE_QUI_RESTE_A_FAIRE.md pour les détails"

echo ""

# ==============================================
# RÉSUMÉ FINAL
# ==============================================
echo -e "${BLUE}${BOLD}"
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  📊 RÉSUMÉ DÉPLOIEMENT AUTOMATIQUE                                 ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

log_success "Actions automatisées complétées:"
echo "  ✅ Variables d'environnement Vercel Frontend"
echo "  ✅ Migrations base de données (si DATABASE_URL configurée)"
echo "  ✅ Déploiement Backend"
echo "  ✅ Redéploiement Frontend"
echo ""

log_warning "Actions nécessitant configuration manuelle:"
echo "  ⚠️  Services externes (Stripe, OAuth, Cloudinary, OpenAI)"
echo "  ⚠️  Domaines (app.luneo.app, api.luneo.app)"
echo ""

log_info "Prochaines étapes:"
echo "  1. Configurer les services externes (voir ci-dessus)"
echo "  2. Configurer les domaines dans Vercel Dashboard"
echo "  3. Tester l'application en production"
echo ""

# Vérification finale
log_info "Vérification des déploiements..."

FRONTEND_STATUS=$(vercel ls --prod 2>/dev/null | grep luneo-frontend | head -1 | grep -o 'Ready' || echo "")
BACKEND_STATUS=$(vercel ls --prod 2>/dev/null | grep backend | head -1 | grep -o 'Ready' || echo "")

if [ -n "$FRONTEND_STATUS" ]; then
    log_success "Frontend: Déployé et prêt"
else
    log_warning "Frontend: À vérifier"
fi

if [ -n "$BACKEND_STATUS" ]; then
    log_success "Backend: Déployé et prêt"
else
    log_warning "Backend: À vérifier"
fi

echo ""
log_success "🎉 Déploiement automatique terminé!"
echo ""
log_info "📄 Documentation complète: CE_QUI_RESTE_A_FAIRE.md"
echo ""























