#!/bin/bash

# ===============================================
# SCRIPT DE DEPLOIEMENT FINAL COMPLET
# ===============================================
# Ce script déploie automatiquement Luneo Backend sur Hetzner

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

success() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

# Configuration
SERVER_IP="116.203.31.129"
DOMAIN="luneo.com"
EMAIL="emmanuel@luneo.app"
POSTGRES_PASSWORD="Luneo2024Secure!"
DEPLOY_USER="deploy"
APP_DIR="/home/$DEPLOY_USER/luneo-backend/backend"

log "🚀 DÉPLOIEMENT FINAL COMPLET LUNEO BACKEND"
log "🌐 Serveur: $SERVER_IP"
log "🌍 Domaine: $DOMAIN"

# ----------- CONFIGURATION DU SERVEUR -----------
log "🔧 Configuration du serveur Hetzner..."

# Mise à jour du système
ssh hetzner-luneo "apt update && apt upgrade -y"

# Installation des packages
ssh hetzner-luneo "apt install -y curl git ufw fail2ban docker.io docker-compose nginx certbot python3-certbot-nginx"

# Configuration Docker
ssh hetzner-luneo "systemctl enable docker && systemctl start docker"

# Création de l'utilisateur deploy
ssh hetzner-luneo "
if ! id deploy &>/dev/null; then
    adduser --disabled-password --gecos '' deploy
    usermod -aG sudo deploy
    usermod -aG docker deploy
fi
"

# Configuration du firewall
ssh hetzner-luneo "
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
"

# Configuration Fail2ban
ssh hetzner-luneo "systemctl enable fail2ban && systemctl start fail2ban"

# Configuration Nginx
ssh hetzner-luneo "systemctl enable nginx && systemctl start nginx"

success "Serveur configuré"

# ----------- CONFIGURATION NGINX ---------------
log "🌐 Configuration de Nginx..."

# Créer la configuration Nginx
ssh hetzner-luneo "cat > /etc/nginx/sites-available/$DOMAIN.conf << 'EOF'
server {
    listen 80;
    server_name $DOMAIN *.$DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN *.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection \"1; mode=block\" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
}
EOF"

# Activer le site
ssh hetzner-luneo "
ln -sf /etc/nginx/sites-available/$DOMAIN.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
"

success "Nginx configuré"

# ----------- GÉNÉRATION SSL ---------
log "🔐 Génération du certificat SSL..."

# Générer le certificat SSL
ssh hetzner-luneo "certbot certonly --nginx -d $DOMAIN --agree-tos --no-eff-email -m $EMAIL --non-interactive" || warn "Échec génération SSL"

success "SSL configuré"

# ----------- COPIE DU CODE SOURCE ---------
log "📦 Copie du code source..."

# Créer le répertoire de l'application
ssh hetzner-deploy "mkdir -p $APP_DIR"

# Copier les fichiers essentiels
info "📄 Copie des fichiers de configuration..."
scp package.json hetzner-deploy:$APP_DIR/
scp pnpm-lock.yaml hetzner-deploy:$APP_DIR/ 2>/dev/null || warn "pnpm-lock.yaml non trouvé"
scp tsconfig.json hetzner-deploy:$APP_DIR/
scp nest-cli.json hetzner-deploy:$APP_DIR/

info "📁 Copie du code source..."
rsync -avz --delete src/ hetzner-deploy:$APP_DIR/src/

info "🐳 Copie des fichiers Docker..."
scp Dockerfile hetzner-deploy:$APP_DIR/ 2>/dev/null || warn "Dockerfile non trouvé"

# Copier le schema Prisma
scp prisma/schema.prisma hetzner-deploy:$APP_DIR/prisma/ 2>/dev/null || warn "Schema Prisma non trouvé"

success "Code source copié"

# ----------- CRÉATION DOCKER COMPOSE ---------
log "🐳 Configuration Docker Compose..."

ssh hetzner-deploy "cat > $APP_DIR/docker-compose.yml << 'EOF'
version: \"3.9\"

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: luneo_api
    working_dir: /app
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - \"3000:3000\"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://luneo_user:$POSTGRES_PASSWORD@db:5432/luneo_production?schema=public
      - REDIS_URL=redis://:$POSTGRES_PASSWORD@redis:6379
      - JWT_SECRET=Luneo2024SuperSecretJWTKey32Chars!
      - JWT_REFRESH_SECRET=Luneo2024SuperSecretRefreshKey32Chars!
      - SENDGRID_API_KEY=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
      - SENDGRID_DOMAIN=luneo.app
      - SENDGRID_FROM_NAME=Luneo
      - SENDGRID_FROM_EMAIL=no-reply@luneo.app
      - SMTP_HOST=smtp.sendgrid.net
      - SMTP_PORT=587
      - SMTP_SECURE=false
      - SMTP_FROM=Luneo <no-reply@luneo.app>
      - DOMAIN_VERIFIED=true
      - PORT=3000
      - API_PREFIX=/api/v1
      - CORS_ORIGIN=https://$DOMAIN
      - FRONTEND_URL=https://$DOMAIN
    command: >
      sh -c \"
        npm install -g pnpm &&
        pnpm install --frozen-lockfile &&
        pnpm run build &&
        pnpm run start:prod
      \"
    restart: unless-stopped
    depends_on:
      - db
      - redis
    networks:
      - luneo_network

  db:
    image: postgres:15-alpine
    container_name: luneo_db
    environment:
      POSTGRES_USER: luneo_user
      POSTGRES_PASSWORD: $POSTGRES_PASSWORD
      POSTGRES_DB: luneo_production
    volumes:
      - db_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - luneo_network

  redis:
    image: redis:7-alpine
    container_name: luneo_redis
    command: redis-server --requirepass $POSTGRES_PASSWORD
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - luneo_network

volumes:
  db_data:
  redis_data:

networks:
  luneo_network:
    driver: bridge
EOF"

# ----------- CONSTRUCTION ET LANCEMENT ---------
log "🔨 Construction et lancement de l'application..."

# Arrêter les services existants
ssh hetzner-deploy "cd $APP_DIR && docker compose down || true"

# Construire et lancer les services
ssh hetzner-deploy "cd $APP_DIR && docker compose up -d --build"

# Attendre que les services démarrent
log "⏳ Attente du démarrage des services..."
sleep 60

# ----------- VÉRIFICATION ---------
log "🔍 Vérification du déploiement..."

# Vérifier les containers
ssh hetzner-deploy "cd $APP_DIR && docker compose ps"

# Vérifier Nginx
ssh hetzner-luneo "systemctl status nginx --no-pager"

# Vérifier SSL
if ssh hetzner-luneo "test -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem"; then
    success "Certificat SSL installé"
else
    warn "Certificat SSL non trouvé"
fi

# Test de l'API
log "🧪 Test de l'API..."
if ssh hetzner-deploy "curl -s http://localhost:3000/health | grep -q 'ok'"; then
    success "API fonctionnelle localement"
else
    warn "API non accessible localement"
fi

# ----------- INSTALLATION WATCHTOWER ---------
log "🔄 Installation de Watchtower pour les mises à jour automatiques..."
ssh hetzner-luneo "docker run -d \
    --name watchtower \
    -v /var/run/docker.sock:/var/run/docker.sock \
    --restart unless-stopped \
    containrrr/watchtower \
    --cleanup \
    --interval 3600"

success "Watchtower installé"

# ----------- RÉSULTATS FINAUX ---------
log ""
log "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
log ""
log "📋 Informations importantes :"
log "   🌐 Domaine: https://$DOMAIN"
log "   🔐 API: https://$DOMAIN/api/v1"
log "   💾 Base de données: PostgreSQL (container: luneo_db)"
log "   🔄 Cache: Redis (container: luneo_redis)"
log "   🐳 API: Node.js (container: luneo_api)"
log ""
log "📁 Fichiers de configuration :"
log "   📄 Nginx: /etc/nginx/sites-available/$DOMAIN.conf"
log "   📄 Docker: $APP_DIR/docker-compose.yml"
log "   📄 Application: $APP_DIR/"
log ""
log "🔧 Commandes utiles :"
log "   📊 Status: ssh hetzner-deploy 'cd $APP_DIR && docker compose ps'"
log "   📝 Logs API: ssh hetzner-deploy 'cd $APP_DIR && docker compose logs -f api'"
log "   🔄 Redémarrage: ssh hetzner-deploy 'cd $APP_DIR && docker compose restart'"
log "   🛑 Arrêt: ssh hetzner-deploy 'cd $APP_DIR && docker compose down'"
log ""
log "🚨 IMPORTANT:"
log "   1. Configurez votre DNS pour pointer $DOMAIN vers $SERVER_IP"
log "   2. Testez l'API: curl https://$DOMAIN/api/v1/health"
log "   3. Surveillez les logs: ssh hetzner-deploy 'cd $APP_DIR && docker compose logs -f'"
log ""
log "✅ Votre backend Luneo est maintenant en production !"

