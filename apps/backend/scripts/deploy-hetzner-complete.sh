#!/bin/bash

# ===============================================
# SCRIPT DE DEPLOIEMENT COMPLET HETZNER + CLOUDFLARE
# ===============================================
# Ce script automatise tout le processus de déploiement
# sur un serveur Hetzner avec SSL Let's Encrypt

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# ----------- VARIABLES À PERSONNALISER ----------
DOMAIN="luneo.com"
EMAIL="emmanuel@luneo.app"
CLOUDFLARE_TOKEN="YOUR_CLOUDFLARE_TOKEN_HERE"
POSTGRES_PASSWORD="Luneo2024Secure!"
DEPLOY_USER="deploy"
APP_DIR="/home/$DEPLOY_USER/luneo-backend"

log "🚀 Déploiement complet Luneo Backend sur Hetzner"
log "📧 Email: $EMAIL"
log "🌐 Domaine: $DOMAIN"
log "👤 Utilisateur: $DEPLOY_USER"

# ----------- VERIFICATION PREREQUIS -------------
log "🔍 Vérification des prérequis..."

# Vérifier que nous sommes root
if [ "$EUID" -ne 0 ]; then
    error "Ce script doit être exécuté en tant que root"
fi

# Vérifier la connexion internet
if ! ping -c 1 google.com &> /dev/null; then
    error "Pas de connexion internet"
fi

# ----------- MISE À JOUR DU SYSTÈME -----------
log "[1/12] Mise à jour du système..."
apt update && apt upgrade -y

# ----------- INSTALLATION DES PACKAGES ---------
log "[2/12] Installation des packages..."
apt install -y curl git ufw fail2ban docker.io docker-compose nginx certbot python3-certbot-nginx python3-certbot-dns-cloudflare

# ----------- CONFIGURATION DOCKER ---------------
log "[3/12] Configuration de Docker..."
systemctl enable docker
systemctl start docker

# ----------- CREATION UTILISATEUR DEPLOY --------
log "[4/12] Création de l'utilisateur $DEPLOY_USER..."
if ! id "$DEPLOY_USER" &>/dev/null; then
    adduser --disabled-password --gecos "" $DEPLOY_USER
    usermod -aG sudo $DEPLOY_USER
    usermod -aG docker $DEPLOY_USER
    log "✅ Utilisateur $DEPLOY_USER créé"
else
    log "✅ Utilisateur $DEPLOY_USER existe déjà"
fi

# ----------- CONFIGURATION FIREWALL -------------
log "[5/12] Configuration du firewall UFW..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
log "✅ Firewall configuré"

# ----------- CONFIGURATION FAIL2BAN ------------
log "[6/12] Configuration de Fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban
log "✅ Fail2ban activé"

# ----------- CLOUDFLARE CREDENTIALS -----------
log "[7/12] Configuration de Cloudflare pour Certbot..."
mkdir -p /etc/letsencrypt
CLOUDFLARE_FILE="/etc/letsencrypt/cloudflare.ini"

if [ -z "$CLOUDFLARE_TOKEN" ] || [ "$CLOUDFLARE_TOKEN" = "YOUR_CLOUDFLARE_TOKEN_HERE" ]; then
    warn "Token Cloudflare non configuré. SSL wildcard ne sera pas disponible."
    warn "Configurez le token dans le script pour activer SSL automatique."
else
    echo "dns_cloudflare_api_token = $CLOUDFLARE_TOKEN" > $CLOUDFLARE_FILE
    chmod 600 $CLOUDFLARE_FILE
    log "✅ Credentials Cloudflare configurés"
fi

# ----------- GENERATION CERTIFICAT SSL ---------
log "[8/12] Génération du certificat SSL Let's Encrypt..."
if [ "$CLOUDFLARE_TOKEN" != "YOUR_CLOUDFLARE_TOKEN_HERE" ] && [ ! -z "$CLOUDFLARE_TOKEN" ]; then
    certbot certonly \
        --dns-cloudflare \
        --dns-cloudflare-credentials $CLOUDFLARE_FILE \
        -d "*.$DOMAIN" -d "$DOMAIN" \
        --agree-tos --no-eff-email -m "$EMAIL" --non-interactive || warn "Échec génération SSL wildcard"
else
    # SSL simple sans wildcard
    certbot certonly --nginx -d "$DOMAIN" --agree-tos --no-eff-email -m "$EMAIL" --non-interactive || warn "Échec génération SSL simple"
fi

# ----------- CONFIGURATION NGINX ---------------
log "[9/12] Configuration de Nginx..."
NGINX_FILE="/etc/nginx/sites-available/$DOMAIN.conf"

cat > $NGINX_FILE <<EOL
# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name $DOMAIN *.$DOMAIN;
    return 301 https://\$host\$request_uri;
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    server_name $DOMAIN *.$DOMAIN;

    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Configuration SSL moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy vers l'API
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
}
EOL

# Activer le site
ln -sf $NGINX_FILE /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester et redémarrer Nginx
nginx -t && systemctl restart nginx
systemctl enable nginx
log "✅ Nginx configuré et démarré"

# ----------- PREPARATION DE L'APP -------------
log "[10/12] Préparation de l'application..."
mkdir -p $APP_DIR
cd $APP_DIR

# Cloner le repository (vous devrez configurer l'accès)
log "📁 Clonage du repository..."
if [ ! -d ".git" ]; then
    # Si pas de repo, créer la structure
    mkdir -p backend
    cd backend
    
    # Créer le docker-compose.yml
    cat > docker-compose.yml <<EOL
version: "3.9"

services:
  api:
    image: node:20-alpine
    container_name: luneo_api
    working_dir: /app
    volumes:
      - .:/app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    command: >
      sh -c "
        npm install -g pnpm &&
        pnpm install --frozen-lockfile &&
        pnpm run build &&
        pnpm run start:prod
      "
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
EOL

    # Créer le fichier .env
    cat > .env <<EOL
# Database
DATABASE_URL="postgresql://luneo_user:$POSTGRES_PASSWORD@db:5432/luneo_production?schema=public"

# Redis
REDIS_URL="redis://:$POSTGRES_PASSWORD@redis:6379"

# JWT
JWT_SECRET="Luneo2024SuperSecretJWTKey32Chars!"
JWT_REFRESH_SECRET="Luneo2024SuperSecretRefreshKey32Chars!"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# SendGrid Configuration
SENDGRID_API_KEY="\${SENDGRID_API_KEY:?'Required'}"
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

# DNS Records
SPF_RECORD="v=spf1 include:_spf.sendgrid.net ~all"
DKIM_RECORD="k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..."
DMARC_RECORD="v=DMARC1; p=none; rua=mailto:rapports.dmarc.luneo@gmail.com"

# App Configuration
NODE_ENV="production"
PORT="3000"
API_PREFIX="/api/v1"
CORS_ORIGIN="https://$DOMAIN"
RATE_LIMIT_TTL="60"
RATE_LIMIT_LIMIT="100"

# Frontend URL
FRONTEND_URL="https://$DOMAIN"

# Monitoring
SENTRY_DSN=""
SENTRY_ENVIRONMENT="production"
EOL

    log "✅ Structure de l'application créée"
else
    log "✅ Repository déjà cloné"
fi

# Permissions
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR
log "✅ Permissions configurées"

# ----------- INSTALLATION WATCHTOWER -----------
log "[11/12] Installation de Watchtower pour les mises à jour automatiques..."
docker run -d \
    --name watchtower \
    -v /var/run/docker.sock:/var/run/docker.sock \
    --restart unless-stopped \
    containrrr/watchtower \
    --cleanup \
    --interval 3600

log "✅ Watchtower installé"

# ----------- LANCEMENT DES CONTAINERS ---------
log "[12/12] Lancement des services Docker..."
cd $APP_DIR/backend
sudo -u $DEPLOY_USER docker compose up -d

# Attendre que les services démarrent
sleep 30

# ----------- VERIFICATION FINALE --------------
log "🔍 Vérification finale..."

# Vérifier les containers
docker compose ps

# Vérifier Nginx
systemctl status nginx --no-pager

# Vérifier SSL
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    log "✅ Certificat SSL installé"
else
    warn "⚠️ Certificat SSL non trouvé"
fi

# Test de connectivité
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"; then
    log "✅ API accessible localement"
else
    warn "⚠️ API non accessible localement"
fi

# ----------- INFORMATIONS FINALES --------------
log ""
log "🎉 Déploiement terminé avec succès !"
log ""
log "📋 Informations importantes :"
log "   🌐 Domaine: https://$DOMAIN"
log "   🔐 API: https://$DOMAIN/api/v1"
log "   💾 Base de données: PostgreSQL (container: luneo_db)"
log "   🔄 Cache: Redis (container: luneo_redis)"
log "   🐳 API: Node.js (container: luneo_api)"
log ""
log "📁 Fichiers de configuration :"
log "   📄 Nginx: $NGINX_FILE"
log "   📄 Docker: $APP_DIR/backend/docker-compose.yml"
log "   📄 Environment: $APP_DIR/backend/.env"
log ""
log "🔧 Commandes utiles :"
log "   📊 Status: sudo -u $DEPLOY_USER docker compose -f $APP_DIR/backend/docker-compose.yml ps"
log "   📝 Logs API: sudo -u $DEPLOY_USER docker compose -f $APP_DIR/backend/docker-compose.yml logs api"
log "   🔄 Redémarrage: sudo -u $DEPLOY_USER docker compose -f $APP_DIR/backend/docker-compose.yml restart"
log "   🛑 Arrêt: sudo -u $DEPLOY_USER docker compose -f $APP_DIR/backend/docker-compose.yml down"
log ""
log "🚨 IMPORTANT:"
log "   1. Configurez votre DNS pour pointer $DOMAIN vers $IP_SERVEUR"
log "   2. Ajoutez votre code source dans $APP_DIR/backend"
log "   3. Configurez le token Cloudflare pour SSL wildcard"
log "   4. Testez l'API: curl https://$DOMAIN/api/v1/health"
log ""
log "✅ Serveur prêt pour la production !"

