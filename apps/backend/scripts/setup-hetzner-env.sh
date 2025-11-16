#!/bin/bash

# 🔧 Script de Configuration des Variables d'Environnement - Hetzner VPS
# Usage: ./setup-hetzner-env.sh [IP_SERVEUR]

set -e

# Configuration
SERVER_IP=${1:-""}
SERVER_USER="root"
APP_DIR="/opt/luneo/luneo-enterprise/backend"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions de logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Vérification des prérequis
check_prerequisites() {
    log "🔍 Vérification des prérequis..."
    
    if [ -z "$SERVER_IP" ]; then
        error "IP du serveur requise. Usage: ./setup-hetzner-env.sh [IP_SERVEUR]"
    fi
    
    success "Prérequis validés"
}

# Test de connexion au serveur
test_connection() {
    log "🔌 Test de connexion au serveur $SERVER_IP..."
    
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP "echo 'Connexion réussie'" &> /dev/null; then
        error "Impossible de se connecter au serveur $SERVER_IP"
    fi
    
    success "Connexion au serveur réussie"
}

# Configuration interactive des variables d'environnement
configure_environment() {
    log "⚙️ Configuration des variables d'environnement..."
    
    echo ""
    echo "📝 Configuration des variables d'environnement pour la production"
    echo "Veuillez fournir les valeurs suivantes:"
    echo ""
    
    # Base de données
    read -p "🔐 Mot de passe PostgreSQL: " -s POSTGRES_PASSWORD
    echo ""
    read -p "🔐 Mot de passe Redis: " -s REDIS_PASSWORD
    echo ""
    
    # JWT
    read -p "🔐 JWT Secret (32 caractères minimum): " JWT_SECRET
    read -p "🔐 JWT Refresh Secret (32 caractères minimum): " JWT_REFRESH_SECRET
    
    # Sentry (optionnel)
    read -p "📊 Sentry DSN (optionnel): " SENTRY_DSN
    
    # Génération du fichier .env
    log "📝 Génération du fichier .env..."
    
    ssh $SERVER_USER@$SERVER_IP << EOF
        cd $APP_DIR
        
        cat > .env << 'ENV_EOF'
# Database
DATABASE_URL="postgresql://luneo_user:${POSTGRES_PASSWORD}@postgres:5432/luneo_production?schema=public"

# Redis
REDIS_URL="redis://:${REDIS_PASSWORD}@redis:6379"

# JWT
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# OAuth (à configurer plus tard)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Stripe (à configurer plus tard)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Cloudinary (à configurer plus tard)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# AI Providers (à configurer plus tard)
OPENAI_API_KEY=""
REPLICATE_API_TOKEN=""

# SendGrid Configuration
# ⚠️ IMPORTANT: Ne jamais hardcoder les clés API ici !
# Utilisez des variables d'environnement ou un gestionnaire de secrets
SENDGRID_API_KEY="${SENDGRID_API_KEY}"
SENDGRID_DOMAIN="luneo.app"
SENDGRID_FROM_NAME="Luneo"
SENDGRID_FROM_EMAIL="no-reply@luneo.app"
SENDGRID_REPLY_TO="support@luneo.app"

# SMTP Configuration
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_FROM="Luneo <no-reply@luneo.app>"

# Domain Verification Status
DOMAIN_VERIFIED="true"

# DNS Records (DÉJÀ CONFIGURÉS)
SPF_RECORD="v=spf1 include:_spf.sendgrid.net ~all"
DKIM_RECORD="v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..."
DMARC_RECORD="v=DMARC1; p=none; rua=mailto:rapports.dmarc.luneo@gmail.com"

# Email Templates (IDs à configurer dans SendGrid)
EMAIL_TEMPLATE_WELCOME="d-welcome-template-id"
EMAIL_TEMPLATE_PASSWORD_RESET="d-password-reset-template-id"
EMAIL_TEMPLATE_EMAIL_CONFIRMATION="d-email-confirmation-template-id"
EMAIL_TEMPLATE_INVOICE="d-invoice-template-id"
EMAIL_TEMPLATE_NEWSLETTER="d-newsletter-template-id"

# Mailgun Configuration (optionnel, pour fallback)
MAILGUN_API_KEY=""
MAILGUN_DOMAIN=""
MAILGUN_URL="https://api.mailgun.net"

# Legacy Email Configuration (deprecated, use above)
FROM_EMAIL="noreply@luneo.app"

# Monitoring
SENTRY_DSN="${SENTRY_DSN}"
SENTRY_ENVIRONMENT="production"

# App
NODE_ENV="production"
PORT="3000"
API_PREFIX="/api/v1"
CORS_ORIGIN="https://luneo.app"
RATE_LIMIT_TTL="60"
RATE_LIMIT_LIMIT="100"

# Frontend URL (for Stripe redirects)
FRONTEND_URL="https://luneo.app"
ENV_EOF

        echo "✅ Fichier .env généré"
EOF
    
    success "Variables d'environnement configurées"
}

# Redémarrage des services
restart_services() {
    log "🔄 Redémarrage des services..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        cd /opt/luneo/luneo-enterprise/backend
        
        # Redémarrage des services Docker
        docker-compose -f docker-compose.production.yml down
        docker-compose -f docker-compose.production.yml up -d
        
        # Attendre que les services démarrent
        sleep 30
        
        echo "✅ Services redémarrés"
EOF
    
    success "Services redémarrés"
}

# Tests de configuration
test_configuration() {
    log "🧪 Tests de configuration..."
    
    # Attendre que les services soient prêts
    sleep 10
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        # Test de santé
        if curl -f http://localhost:3000/health > /dev/null 2>&1; then
            echo "✅ Health check réussi"
        else
            echo "❌ Health check échoué"
            docker-compose -f /opt/luneo/luneo-enterprise/backend/docker-compose.production.yml logs backend
            exit 1
        fi
        
        # Test de l'API
        if curl -f http://localhost:3000/api/v1 > /dev/null 2>&1; then
            echo "✅ API accessible"
        else
            echo "⚠️ API non accessible (normal si pas de routes définies)"
        fi
EOF
    
    success "Tests de configuration réussis"
}

# Affichage du résumé
show_summary() {
    log "📊 Résumé de la configuration..."
    
    echo ""
    echo "🎉 CONFIGURATION TERMINÉE AVEC SUCCÈS !"
    echo ""
    echo "📍 Serveur: $SERVER_IP"
    echo "🌐 URL API: https://api.luneo.app"
    echo "🔗 Health Check: https://api.luneo.app/health"
    echo "📧 Webhook SendGrid: https://api.luneo.app/webhooks/sendgrid"
    echo ""
    echo "📋 Variables configurées:"
    echo "✅ Base de données PostgreSQL"
    echo "✅ Redis"
    echo "✅ JWT Secrets"
    echo "✅ SendGrid (déjà configuré)"
    echo "✅ SMTP"
    echo ""
    echo "⚠️ Variables à configurer manuellement:"
    echo "🔐 Stripe (paiements)"
    echo "🔐 Google/GitHub OAuth"
    echo "🔐 Cloudinary (images)"
    echo "🔐 OpenAI/Replicate (IA)"
    echo "📊 Sentry (monitoring)"
    echo ""
    echo "🔄 Pour redémarrer les services:"
    echo "ssh $SERVER_USER@$SERVER_IP 'cd /opt/luneo/luneo-enterprise/backend && docker-compose -f docker-compose.production.yml restart'"
    echo ""
}

# Fonction principale
main() {
    echo "🔧 Configuration des Variables d'Environnement - Hetzner VPS"
    echo "📍 Serveur: $SERVER_IP"
    echo ""
    
    check_prerequisites
    test_connection
    configure_environment
    restart_services
    test_configuration
    show_summary
}

# Exécution
main "$@"
