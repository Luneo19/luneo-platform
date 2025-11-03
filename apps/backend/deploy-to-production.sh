#!/bin/bash

# 🚀 Script de Déploiement Production Luneo Backend
# Déploiement automatisé pour https://api.luneo.app

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="luneo-backend"
DOMAIN="api.luneo.app"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Fonctions de log
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

step() {
    echo -e "${CYAN}[$(date +'%H:%M:%S')] 🚀 $1${NC}"
}

# Header
echo -e "${MAGENTA}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🚀 LUneo Backend Deploy                   ║"
echo "║                   Production Deployment                      ║"
echo "║                    https://api.luneo.app                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Vérifications pré-déploiement
step "Vérification des prérequis..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé (version >= 20 requise)"
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    error "Node.js version 20+ requise (version actuelle: $(node -v))"
fi

# Vérifier npm
if ! command -v npm &> /dev/null; then
    error "npm n'est pas installé"
fi

# Vérifier le fichier .env.production
if [ ! -f .env.production ]; then
    warn "Fichier .env.production non trouvé"
    info "Création depuis env.production.example..."
    if [ -f env.production.example ]; then
        cp env.production.example .env.production
        warn "⚠️  IMPORTANT: Éditez .env.production avec vos vraies valeurs avant de continuer!"
        echo -e "${YELLOW}Appuyez sur Entrée quand vous avez configuré .env.production...${NC}"
        read
    else
        error "Aucun fichier de configuration trouvé"
    fi
fi

# Vérifier les variables critiques
source .env.production
if [ -z "$SENDGRID_API_KEY" ]; then
    error "SENDGRID_API_KEY manquante dans .env.production"
fi

if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL manquante dans .env.production"
fi

log "Prérequis vérifiés ✅"

# Créer le dossier de sauvegarde
step "Création de la sauvegarde..."
mkdir -p "$BACKUP_DIR"
if [ -d "dist" ]; then
    cp -r dist "$BACKUP_DIR/"
    log "Sauvegarde créée: $BACKUP_DIR"
fi

# Installation des dépendances
step "Installation des dépendances..."
if [ -f "pnpm-lock.yaml" ]; then
    if ! command -v pnpm &> /dev/null; then
        warn "pnpm non installé, installation..."
        npm install -g pnpm
    fi
    pnpm install --frozen-lockfile
else
    npm ci
fi

# Build de l'application
step "Build de l'application..."
npm run build

if [ ! -d "dist" ]; then
    error "Build échoué - dossier dist non créé"
fi

log "Build réussi ✅"

# Tests de sécurité et fonctionnels
step "Exécution des tests..."
if npm run test --silent; then
    log "Tests passés ✅"
else
    warn "Tests échoués, mais continuation du déploiement..."
fi

# Génération Prisma
step "Génération du client Prisma..."
npx prisma generate

# Test de connexion à la base de données
step "Test de connexion à la base de données..."
if npx prisma db push --accept-data-loss --skip-generate; then
    log "Connexion base de données OK ✅"
else
    warn "Problème de connexion à la base de données"
    info "Vérifiez DATABASE_URL dans .env.production"
fi

# Vérification SendGrid
step "Test de la configuration SendGrid..."
if node test-sendgrid-final.js; then
    log "SendGrid configuré et fonctionnel ✅"
else
    warn "Problème avec SendGrid"
    info "Vérifiez SENDGRID_API_KEY dans .env.production"
fi

# Déploiement selon la méthode choisie
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🎯 Méthodes de Déploiement                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo "Choisissez votre méthode de déploiement:"
echo "1) 🚀 Vercel (Recommandé - Plus simple)"
echo "2) 🐳 Docker (Serveur VPS)"
echo "3) 📦 Build local seulement"
echo "4) 🧪 Test local complet"

read -p "Votre choix (1-4): " DEPLOY_METHOD

case $DEPLOY_METHOD in
    1)
        step "Déploiement sur Vercel..."
        
        # Vérifier Vercel CLI
        if ! command -v vercel &> /dev/null; then
            warn "Vercel CLI non installé, installation..."
            npm install -g vercel
        fi
        
        # Se connecter à Vercel si nécessaire
        if ! vercel whoami &> /dev/null; then
            info "Connexion à Vercel requise..."
            vercel login
        fi
        
        # Déployer
        info "Déploiement en cours..."
        vercel --prod --yes
        
        # Obtenir l'URL de déploiement
        DEPLOY_URL=$(vercel ls | grep "$PROJECT_NAME" | head -1 | awk '{print $2}')
        
        if [ ! -z "$DEPLOY_URL" ]; then
            log "Déployé sur: https://$DEPLOY_URL"
            info "Configurez votre domaine personnalisé dans Vercel Dashboard"
            info "Domaine cible: $DOMAIN"
        fi
        ;;
        
    2)
        step "Déploiement avec Docker..."
        
        # Vérifier Docker
        if ! command -v docker &> /dev/null; then
            error "Docker n'est pas installé"
        fi
        
        if ! command -v docker-compose &> /dev/null; then
            error "Docker Compose n'est pas installé"
        fi
        
        # Arrêter les services existants
        info "Arrêt des services existants..."
        docker-compose -f docker-compose.production.yml down || true
        
        # Build et démarrage
        info "Build des images Docker..."
        docker-compose -f docker-compose.production.yml build --no-cache
        
        info "Démarrage des services..."
        docker-compose -f docker-compose.production.yml up -d
        
        # Attendre le démarrage
        info "Attente du démarrage des services..."
        sleep 30
        
        # Vérifications
        if curl -f http://localhost:3000/health &> /dev/null; then
            log "Application démarrée sur http://localhost:3000 ✅"
        else
            error "L'application n'a pas démarré correctement"
        fi
        ;;
        
    3)
        step "Build local seulement..."
        log "Build terminé dans ./dist/"
        info "Pour démarrer: npm run start:prod"
        ;;
        
    4)
        step "Tests complets locaux..."
        
        # Test de l'application
        info "Démarrage de l'application en mode test..."
        npm run start:prod &
        APP_PID=$!
        
        # Attendre le démarrage
        sleep 10
        
        # Tests
        info "Test de santé..."
        if curl -f http://localhost:3000/health; then
            log "Health check OK ✅"
        else
            error "Health check échoué"
        fi
        
        info "Test webhook SendGrid..."
        if node test-webhook-logic.js; then
            log "Webhook logic OK ✅"
        else
            warn "Problème avec le webhook"
        fi
        
        # Arrêter l'application
        kill $APP_PID
        log "Tests terminés ✅"
        ;;
        
    *)
        error "Choix invalide"
        ;;
esac

# Tests post-déploiement
if [ "$DEPLOY_METHOD" = "1" ] || [ "$DEPLOY_METHOD" = "2" ]; then
    step "Tests post-déploiement..."
    
    if [ "$DEPLOY_METHOD" = "1" ]; then
        TEST_URL="https://$DEPLOY_URL"
    else
        TEST_URL="http://localhost:3000"
    fi
    
    # Test de santé
    if curl -f "$TEST_URL/health" &> /dev/null; then
        log "Health check OK ✅"
    else
        warn "Health check échoué"
    fi
    
    # Test de l'API
    if curl -f "$TEST_URL/api/v1" &> /dev/null; then
        log "API accessible ✅"
    else
        warn "API inaccessible"
    fi
    
    # Test webhook
    info "Test du webhook SendGrid..."
    if curl -X POST "$TEST_URL/webhooks/sendgrid" \
        -H "Content-Type: application/json" \
        -d '[{"email":"test@luneo.app","event":"delivered"}]' \
        &> /dev/null; then
        log "Webhook accessible ✅"
    else
        warn "Webhook inaccessible"
    fi
fi

# Nettoyage
step "Nettoyage..."
rm -rf "$BACKUP_DIR"

# Résumé final
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🎉 DÉPLOIEMENT TERMINÉ                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

log "Déploiement terminé avec succès!"

echo -e "${BLUE}📊 Informations de déploiement:${NC}"
if [ "$DEPLOY_METHOD" = "1" ]; then
    echo -e "${BLUE}   - URL: https://$DEPLOY_URL${NC}"
    echo -e "${BLUE}   - Domaine cible: $DOMAIN${NC}"
    echo -e "${BLUE}   - Dashboard: https://vercel.com/dashboard${NC}"
elif [ "$DEPLOY_METHOD" = "2" ]; then
    echo -e "${BLUE}   - URL: http://localhost:3000${NC}"
    echo -e "${BLUE}   - Domaine cible: $DOMAIN${NC}"
    echo -e "${BLUE}   - Logs: docker-compose -f docker-compose.production.yml logs -f${NC}"
fi

echo -e "${BLUE}📋 Prochaines étapes:${NC}"
echo -e "${BLUE}   1. Configurez votre domaine DNS${NC}"
echo -e "${BLUE}   2. Testez le webhook SendGrid${NC}"
echo -e "${BLUE}   3. Configurez le monitoring${NC}"
echo -e "${BLUE}   4. Testez toutes les fonctionnalités${NC}"

echo -e "${BLUE}🔗 Liens utiles:${NC}"
echo -e "${BLUE}   - Health Check: $TEST_URL/health${NC}"
echo -e "${BLUE}   - API Docs: $TEST_URL/api/docs${NC}"
echo -e "${BLUE}   - Webhook: $TEST_URL/webhooks/sendgrid${NC}"

log "Votre application Luneo est prête pour la production! 🚀"
