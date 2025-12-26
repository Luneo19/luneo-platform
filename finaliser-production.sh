#!/bin/bash

# ==============================================
# FINALISATION PRODUCTION - ACTIONS RESTANTES
# LUNEO - SaaS de niveau mondial #1
# ==============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 FINALISATION PRODUCTION - ACTIONS RESTANTES                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/apps/frontend"
BACKEND_DIR="$ROOT_DIR/apps/backend"

# ==============================================
# FONCTIONS
# ==============================================

log_step() {
    echo ""
    echo -e "${MAGENTA}▶ $1${NC}"
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
log_step "Étape 1/5: Vérification préliminaire"

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    log_error "Vercel CLI non installé"
    log_info "Installation: npm install -g vercel"
    exit 1
fi

# Vérifier connexion Vercel
if ! vercel whoami > /dev/null 2>&1; then
    log_error "Vercel CLI non connecté"
    log_info "Connexion: vercel login"
    exit 1
fi

log_success "Vercel CLI connecté: $(vercel whoami)"

# ==============================================
# ÉTAPE 2: VARIABLES D'ENVIRONNEMENT VERCEL
# ==============================================
log_step "Étape 2/5: Configuration variables d'environnement Vercel"

cd "$FRONTEND_DIR"

log_warning "Les variables d'environnement doivent être configurées manuellement"
log_info "Options:"
echo ""
echo "Option 1 - Via Dashboard (Recommandé):"
echo "  1. Aller sur: https://vercel.com/luneos-projects/luneo-frontend/settings/environment-variables"
echo "  2. Ajouter les variables suivantes:"
echo ""
echo "Variables critiques:"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - NEXT_PUBLIC_API_URL"
echo "  - NEXT_PUBLIC_APP_URL"
echo ""
echo "Option 2 - Via CLI:"
echo "  vercel env add NEXT_PUBLIC_SUPABASE_URL production"
echo "  # Répéter pour chaque variable"
echo ""

read -p "Voulez-vous configurer les variables maintenant? (o/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Oo]$ ]]; then
    log_info "Configuration interactive des variables..."
    
    read -p "NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL
    read -p "NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_KEY
    read -p "NEXT_PUBLIC_API_URL: " API_URL
    read -p "NEXT_PUBLIC_APP_URL: " APP_URL
    
    if [ -n "$SUPABASE_URL" ]; then
        echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
    fi
    if [ -n "$SUPABASE_KEY" ]; then
        echo "$SUPABASE_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
    fi
    if [ -n "$API_URL" ]; then
        echo "$API_URL" | vercel env add NEXT_PUBLIC_API_URL production
    fi
    if [ -n "$APP_URL" ]; then
        echo "$APP_URL" | vercel env add NEXT_PUBLIC_APP_URL production
    fi
    
    log_success "Variables configurées"
else
    log_warning "Variables non configurées - À faire manuellement"
fi

# ==============================================
# ÉTAPE 3: MIGRATIONS BASE DE DONNÉES
# ==============================================
log_step "Étape 3/5: Migrations base de données"

cd "$BACKEND_DIR"

# Vérifier DATABASE_URL
if [ -f .env.production ]; then
    source .env.production 2>/dev/null || true
    
    if [ -z "$DATABASE_URL" ] || [[ "$DATABASE_URL" == *"["* ]] || [[ "$DATABASE_URL" == *"PASSWORD"* ]]; then
        log_warning "DATABASE_URL non configurée ou contient des placeholders"
        log_info "Éditez .env.production et configurez DATABASE_URL"
        log_warning "Migration ignorée"
    else
        log_info "Application des migrations..."
        
        if npx prisma migrate deploy > /dev/null 2>&1; then
            log_success "Migrations appliquées"
        else
            log_warning "Erreur lors des migrations"
            log_info "Tentative avec affichage des erreurs..."
            npx prisma migrate deploy || log_warning "Migration échouée - à faire manuellement"
        fi
    fi
else
    log_warning ".env.production manquant"
    log_info "Créez le fichier avec DATABASE_URL"
fi

# ==============================================
# ÉTAPE 4: DÉPLOIEMENT BACKEND
# ==============================================
log_step "Étape 4/5: Déploiement Backend"

cd "$BACKEND_DIR"

log_info "Vérification du projet Vercel backend..."

if vercel link --yes --project=backend > /dev/null 2>&1; then
    log_success "Projet backend lié"
else
    log_warning "Projet backend non trouvé ou déjà lié"
fi

read -p "Voulez-vous déployer le backend maintenant? (o/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Oo]$ ]]; then
    log_info "Déploiement backend en production..."
    
    if vercel --prod --yes > /tmp/backend-deploy.log 2>&1; then
        log_success "Backend déployé"
        DEPLOYMENT_URL=$(grep -o 'https://[^ ]*\.vercel\.app' /tmp/backend-deploy.log | head -1)
        log_info "URL: $DEPLOYMENT_URL"
    else
        log_warning "Erreur lors du déploiement"
        cat /tmp/backend-deploy.log | tail -20
    fi
else
    log_warning "Déploiement backend ignoré"
    log_info "Pour déployer plus tard: cd apps/backend && vercel --prod"
fi

# ==============================================
# ÉTAPE 5: VÉRIFICATION FINALE
# ==============================================
log_step "Étape 5/5: Vérification finale"

cd "$ROOT_DIR"

log_info "Vérification des déploiements..."

FRONTEND_DEPLOY=$(vercel ls --prod 2>/dev/null | grep luneo-frontend | head -1 | grep -o 'Ready' || echo "")
BACKEND_DEPLOY=$(vercel ls --prod 2>/dev/null | grep backend | head -1 | grep -o 'Ready' || echo "")

if [ -n "$FRONTEND_DEPLOY" ]; then
    log_success "Frontend déployé et prêt"
else
    log_warning "Frontend non déployé ou erreur"
fi

if [ -n "$BACKEND_DEPLOY" ]; then
    log_success "Backend déployé et prêt"
else
    log_warning "Backend non déployé"
fi

# ==============================================
# RÉSUMÉ FINAL
# ==============================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  📊 RÉSUMÉ FINAL                                                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

log_info "Actions restantes:"
echo ""
echo "🔴 CRITIQUE:"
echo "  1. Configurer variables d'environnement Vercel"
echo "     → https://vercel.com/luneos-projects/luneo-frontend/settings/environment-variables"
echo ""
echo "  2. Appliquer migrations base de données"
echo "     → cd apps/backend && npx prisma migrate deploy"
echo ""
echo "  3. Déployer backend (si pas fait)"
echo "     → cd apps/backend && vercel --prod"
echo ""
echo "🟡 IMPORTANT:"
echo "  4. Configurer services externes (Stripe, OAuth, Cloudinary)"
echo "  5. Configurer domaines (app.luneo.app, api.luneo.app)"
echo ""
echo "📄 Rapport détaillé: CE_QUI_RESTE_A_FAIRE.md"
echo ""

log_success "Script terminé!"





















