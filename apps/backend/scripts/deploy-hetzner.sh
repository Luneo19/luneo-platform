#!/bin/bash

# 🚀 Script de Déploiement Automatique - Luneo Backend sur Hetzner VPS
# Usage: ./deploy-hetzner.sh [IP_SERVEUR]

set -e

# Configuration
SERVER_IP=${1:-""}
SERVER_USER="root"
APP_DIR="/opt/luneo/luneo-enterprise/backend"
BACKUP_DIR="/opt/luneo/backups"

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
        error "IP du serveur requise. Usage: ./deploy-hetzner.sh [IP_SERVEUR]"
    fi
    
    if ! command -v ssh &> /dev/null; then
        error "SSH n'est pas installé"
    fi
    
    if ! command -v scp &> /dev/null; then
        error "SCP n'est pas installé"
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

# Installation des dépendances sur le serveur
install_dependencies() {
    log "📦 Installation des dépendances sur le serveur..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        # Mise à jour du système
        apt update && apt upgrade -y
        
        # Installation des dépendances de base
        apt install -y curl wget git nginx certbot python3-certbot-nginx ufw
        
        # Installation de Node.js 20 si pas déjà installé
        if ! command -v node &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y nodejs
        fi
        
        # Installation de pnpm si pas déjà installé
        if ! command -v pnpm &> /dev/null; then
            npm install -g pnpm
        fi
        
        # Installation de Docker si pas déjà installé
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
        fi
        
        # Installation de Docker Compose si pas déjà installé
        if ! command -v docker-compose &> /dev/null; then
            curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        
        echo "✅ Dépendances installées"
EOF
    
    success "Dépendances installées sur le serveur"
}

# Configuration du firewall
configure_firewall() {
    log "🔥 Configuration du firewall..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        ufw allow ssh
        ufw allow 80
        ufw allow 443
        ufw allow 3000
        ufw --force enable
        echo "✅ Firewall configuré"
EOF
    
    success "Firewall configuré"
}

# Préparation du répertoire de l'application
prepare_app_directory() {
    log "📁 Préparation du répertoire de l'application..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        # Création des répertoires
        mkdir -p /opt/luneo
        mkdir -p /opt/luneo/backups
        
        # Si le projet existe déjà, faire une sauvegarde
        if [ -d "/opt/luneo/luneo-enterprise" ]; then
            echo "📦 Sauvegarde de l'ancienne version..."
            cp -r /opt/luneo/luneo-enterprise /opt/luneo/backups/luneo-enterprise-$(date +%Y%m%d-%H%M%S)
        fi
        
        echo "✅ Répertoire préparé"
EOF
    
    success "Répertoire de l'application préparé"
}

# Upload des fichiers
upload_files() {
    log "📤 Upload des fichiers vers le serveur..."
    
    # Créer un archive temporaire
    log "📦 Création de l'archive..."
    tar -czf luneo-backend.tar.gz --exclude=node_modules --exclude=.git --exclude=dist .
    
    # Upload de l'archive
    log "🚀 Upload vers le serveur..."
    scp luneo-backend.tar.gz $SERVER_USER@$SERVER_IP:/opt/luneo/
    
    # Extraction sur le serveur
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        cd /opt/luneo
        rm -rf luneo-enterprise
        mkdir -p luneo-enterprise/backend
        cd luneo-enterprise/backend
        tar -xzf /opt/luneo/luneo-backend.tar.gz
        rm /opt/luneo/luneo-backend.tar.gz
        echo "✅ Fichiers uploadés et extraits"
EOF
    
    # Nettoyage local
    rm luneo-backend.tar.gz
    
    success "Fichiers uploadés vers le serveur"
}

# Configuration de l'environnement
configure_environment() {
    log "⚙️ Configuration de l'environnement..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        cd /opt/luneo/luneo-enterprise/backend
        
        # Copier le fichier d'environnement de production
        if [ ! -f ".env" ]; then
            cp env.production.example .env
            echo "📝 Fichier .env créé à partir de l'exemple"
            echo "⚠️ N'oubliez pas de configurer les variables d'environnement !"
        fi
        
        echo "✅ Environnement configuré"
EOF
    
    success "Environnement configuré"
}

# Installation des dépendances Node.js
install_node_dependencies() {
    log "📦 Installation des dépendances Node.js..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        cd /opt/luneo/luneo-enterprise/backend
        
        # Installation des dépendances
        pnpm install --prod
        
        # Build de l'application
        pnpm run build
        
        echo "✅ Dépendances Node.js installées et build terminé"
EOF
    
    success "Dépendances Node.js installées"
}

# Configuration et démarrage des services Docker
start_docker_services() {
    log "🐳 Démarrage des services Docker..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        cd /opt/luneo/luneo-enterprise/backend
        
        # Arrêt des services existants
        docker-compose -f docker-compose.production.yml down || true
        
        # Build et démarrage des services
        docker-compose -f docker-compose.production.yml build --no-cache
        docker-compose -f docker-compose.production.yml up -d
        
        # Attendre que les services démarrent
        sleep 30
        
        echo "✅ Services Docker démarrés"
EOF
    
    success "Services Docker démarrés"
}

# Configuration Nginx
configure_nginx() {
    log "🌐 Configuration de Nginx..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        # Configuration Nginx pour l'API
        cat > /etc/nginx/sites-available/luneo-api << 'NGINX_EOF'
server {
    listen 80;
    server_name api.luneo.app;

    # Proxy vers l'application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
NGINX_EOF

        # Activer le site
        ln -sf /etc/nginx/sites-available/luneo-api /etc/nginx/sites-enabled/
        
        # Tester la configuration
        nginx -t
        
        # Recharger Nginx
        systemctl reload nginx
        
        echo "✅ Nginx configuré"
EOF
    
    success "Nginx configuré"
}

# Tests de déploiement
test_deployment() {
    log "🧪 Tests de déploiement..."
    
    # Attendre que les services soient prêts
    sleep 10
    
    # Test de santé local
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        # Test de santé sur le port local
        if curl -f http://localhost:3000/health > /dev/null 2>&1; then
            echo "✅ Health check local réussi"
        else
            echo "❌ Health check local échoué"
            exit 1
        fi
        
        # Vérifier les logs des services
        echo "📋 Logs des services Docker:"
        docker-compose -f /opt/luneo/luneo-enterprise/backend/docker-compose.production.yml logs --tail=10
EOF
    
    success "Tests de déploiement réussis"
}

# Configuration SSL avec Let's Encrypt
configure_ssl() {
    log "🔒 Configuration SSL avec Let's Encrypt..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        # Obtenir le certificat SSL
        certbot --nginx -d api.luneo.app --non-interactive --agree-tos --email admin@luneo.app
        
        # Vérifier le renouvellement automatique
        certbot renew --dry-run
        
        echo "✅ SSL configuré"
EOF
    
    success "SSL configuré avec Let's Encrypt"
}

# Création du script de déploiement rapide
create_deploy_script() {
    log "📝 Création du script de déploiement rapide..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        cat > /opt/luneo/deploy.sh << 'DEPLOY_EOF'
#!/bin/bash
# Script de déploiement rapide

cd /opt/luneo/luneo-enterprise/backend

echo "🚀 Déploiement rapide..."

# Pull des dernières modifications
git pull origin main

# Build et redémarrage
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

# Tests de santé
sleep 10
curl -f https://api.luneo.app/health || echo "❌ Health check failed"

echo "✅ Déploiement terminé !"
DEPLOY_EOF

        chmod +x /opt/luneo/deploy.sh
        
        echo "✅ Script de déploiement créé"
EOF
    
    success "Script de déploiement rapide créé"
}

# Affichage du résumé
show_summary() {
    log "📊 Résumé du déploiement..."
    
    echo ""
    echo "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
    echo ""
    echo "📍 Serveur: $SERVER_IP"
    echo "🌐 URL API: https://api.luneo.app"
    echo "🔗 Health Check: https://api.luneo.app/health"
    echo "📧 Webhook SendGrid: https://api.luneo.app/webhooks/sendgrid"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "1. Configurer les variables d'environnement dans /opt/luneo/luneo-enterprise/backend/.env"
    echo "2. Configurer le webhook SendGrid avec l'URL: https://api.luneo.app/webhooks/sendgrid"
    echo "3. Tester l'API: curl https://api.luneo.app/health"
    echo ""
    echo "🔄 Pour les futurs déploiements:"
    echo "ssh $SERVER_USER@$SERVER_IP '/opt/luneo/deploy.sh'"
    echo ""
}

# Fonction principale
main() {
    echo "🚀 Déploiement Luneo Backend sur Hetzner VPS"
    echo "📍 Serveur: $SERVER_IP"
    echo ""
    
    check_prerequisites
    test_connection
    install_dependencies
    configure_firewall
    prepare_app_directory
    upload_files
    configure_environment
    install_node_dependencies
    start_docker_services
    configure_nginx
    test_deployment
    configure_ssl
    create_deploy_script
    show_summary
}

# Exécution
main "$@"
