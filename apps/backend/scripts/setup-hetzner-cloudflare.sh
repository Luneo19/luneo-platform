#!/bin/bash

# ===============================================
# AUTOMATISATION DEPLOIEMENT HETZNER + CLOUDFLARE
# LUNEO BACKEND PRODUCTION SETUP
# ===============================================

set -e

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

# ----------- VARIABLES À PERSONNALISER ----------
DOMAIN="luneo.app"
EMAIL="admin@luneo.app"
CLOUDFLARE_TOKEN=""
POSTGRES_PASSWORD=""
DEPLOY_USER="deploy"
APP_NAME="luneo-backend"

# ----------- AFFICHAGE DES INFOS ---------------
echo "==============================================="
echo "🚀 INSTALLATION LUNEO BACKEND PRODUCTION"
echo "==============================================="
echo "Domaine : $DOMAIN"
echo "Email : $EMAIL"
echo "Utilisateur de déploiement : $DEPLOY_USER"
echo "==============================================="

# Vérification des variables obligatoires
if [ -z "$CLOUDFLARE_TOKEN" ]; then
    error "CLOUDFLARE_TOKEN est requis. Éditez le script et ajoutez votre token Cloudflare."
fi

if [ -z "$POSTGRES_PASSWORD" ]; then
    error "POSTGRES_PASSWORD est requis. Éditez le script et ajoutez un mot de passe sécurisé."
fi

echo "Appuyez sur Entrée pour continuer ou Ctrl+C pour annuler..."
read

# ----------- MISE À JOUR DU SYSTÈME ------------
log "[1/10] Mise à jour du serveur..."
apt update && apt upgrade -y
success "Serveur mis à jour"

# ----------- INSTALLATION DES PAQUETS ----------
log "[2/10] Installation des paquets de base..."
apt install -y curl git ufw fail2ban docker.io docker-compose certbot python3-certbot-dns-cloudflare nginx
success "Paquets installés"

# ----------- CONFIGURATION UFW -----------------
log "[3/10] Configuration du pare-feu UFW..."
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
ufw status
success "Pare-feu configuré"

# ----------- CREATION UTILISATEUR DEPLOY -------
log "[4/10] Création de l'utilisateur $DEPLOY_USER..."
if id "$DEPLOY_USER" &>/dev/null; then
    warning "Utilisateur $DEPLOY_USER existe déjà"
else
    adduser --disabled-password --gecos "" $DEPLOY_USER
    usermod -aG sudo $DEPLOY_USER
    usermod -aG docker $DEPLOY_USER
    success "Utilisateur $DEPLOY_USER créé"
fi

# ----------- CLOUDFLARE CREDENTIALS -----------
log "[5/10] Configuration de Cloudflare pour Certbot..."
mkdir -p /etc/letsencrypt
CLOUDFLARE_FILE="/etc/letsencrypt/cloudflare.ini"
echo "dns_cloudflare_api_token = $CLOUDFLARE_TOKEN" > $CLOUDFLARE_FILE
chmod 600 $CLOUDFLARE_FILE
success "Credentials Cloudflare configurés"

# ----------- GENERATION CERTIFICAT SSL ---------
log "[6/10] Génération du certificat SSL Let's Encrypt..."
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    warning "Certificat SSL existe déjà pour $DOMAIN"
else
    certbot certonly \
      --dns-cloudflare \
      --dns-cloudflare-credentials $CLOUDFLARE_FILE \
      -d "*.$DOMAIN" -d "$DOMAIN" \
      --agree-tos --no-eff-email -m "$EMAIL" --non-interactive
    success "Certificat SSL généré"
fi

# ----------- CONFIGURATION NGINX ---------------
log "[7/10] Configuration de Nginx..."
NGINX_FILE="/etc/nginx/sites-available/$DOMAIN.conf"

cat > $NGINX_FILE <<EOL
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

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }

    # Webhooks
    location /webhooks/ {
        proxy_pass http://127.0.0.1:3000/webhooks/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOL

ln -sf $NGINX_FILE /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
success "Nginx configuré"

# ----------- PREPARATION DE L'APP -------------
log "[8/10] Préparation de l'application Docker..."
APP_DIR="/home/$DEPLOY_USER/$APP_NAME"
mkdir -p $APP_DIR

# Docker Compose pour Luneo Backend
cat > $APP_DIR/docker-compose.yml <<EOL
version: "3.9"

networks:
  luneo_network:
    driver: bridge

services:
  backend:
    image: node:20-alpine
    container_name: luneo_backend
    working_dir: /app
    command: sh -c "npm install && npm run build && npm run start:prod"
    restart: unless-stopped
    env_file: .env.production
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    networks:
      - luneo_network
    volumes:
      - ./:/app
      - /app/node_modules
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    container_name: luneo_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: luneo_user
      POSTGRES_PASSWORD: $POSTGRES_PASSWORD
      POSTGRES_DB: luneo_production
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - luneo_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U luneo_user -d luneo_production"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: luneo_redis
    restart: unless-stopped
    command: redis-server --requirepass $POSTGRES_PASSWORD
    volumes:
      - redis_data:/data
    networks:
      - luneo_network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:1.27-alpine
    container_name: luneo_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /etc/nginx/sites-available/$DOMAIN.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - backend
    networks:
      - luneo_network

volumes:
  postgres_data:
  redis_data:
EOL

# Fichier .env.production template
cat > $APP_DIR/.env.production <<EOL
# ===== LUNEO BACKEND PRODUCTION =====
NODE_ENV=production
PORT=3000

# ===== DATABASE =====
DATABASE_URL="postgresql://luneo_user:$POSTGRES_PASSWORD@postgres:5432/luneo_production?schema=public"

# ===== REDIS =====
REDIS_URL="redis://:$POSTGRES_PASSWORD@redis:6379"

# ===== JWT (À CHANGER!) =====
JWT_SECRET="CHANGE_ME_JWT_SECRET_32_CHARS_MINIMUM"
JWT_REFRESH_SECRET="CHANGE_ME_JWT_REFRESH_SECRET_32_CHARS_MINIMUM"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# ===== SENDGRID (DÉJÀ CONFIGURÉ) =====
SENDGRID_API_KEY="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"
SENDGRID_DOMAIN="luneo.app"
SENDGRID_FROM_NAME="Luneo"
SENDGRID_FROM_EMAIL="no-reply@luneo.app"
SENDGRID_REPLY_TO="support@luneo.app"

# ===== SMTP =====
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_FROM="Luneo <no-reply@luneo.app>"

# ===== DOMAIN VERIFICATION =====
DOMAIN_VERIFIED="true"
SPF_RECORD="v=spf1 include:_spf.sendgrid.net ~all"
DKIM_RECORD="v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..."
DMARC_RECORD="v=DMARC1; p=none; rua=mailto:rapports.dmarc.luneo@gmail.com"

# ===== EMAIL TEMPLATES =====
EMAIL_TEMPLATE_WELCOME="d-welcome-template-id"
EMAIL_TEMPLATE_PASSWORD_RESET="d-password-reset-template-id"
EMAIL_TEMPLATE_EMAIL_CONFIRMATION="d-email-confirmation-template-id"
EMAIL_TEMPLATE_INVOICE="d-invoice-template-id"
EMAIL_TEMPLATE_NEWSLETTER="d-newsletter-template-id"

# ===== STRIPE (À CONFIGURER) =====
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# ===== CLOUDINARY (À CONFIGURER) =====
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# ===== OAUTH (À CONFIGURER) =====
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# ===== AI PROVIDERS (À CONFIGURER) =====
OPENAI_API_KEY=""
REPLICATE_API_TOKEN=""

# ===== SENTRY (À CONFIGURER) =====
SENTRY_DSN=""
SENTRY_ENVIRONMENT="production"

# ===== APP CONFIG =====
API_PREFIX="/api/v1"
CORS_ORIGIN="https://$DOMAIN"
RATE_LIMIT_TTL="60"
RATE_LIMIT_LIMIT="100"
FRONTEND_URL="https://$DOMAIN"

# ===== LEGACY =====
FROM_EMAIL="noreply@$DOMAIN"
EOL

# Droits pour le dossier
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR
success "Application préparée"

# ----------- CLONAGE DU CODE ----------------
log "[8.5/10] Clonage du code Luneo..."
cd $APP_DIR
sudo -u $DEPLOY_USER git clone https://github.com/luneo/luneo-enterprise.git . || {
    warning "Impossible de cloner le repo. Vous devrez copier le code manuellement."
}
success "Code cloné"

# ----------- LANCEMENT DES CONTAINERS ---------
log "[9/10] Lancement des services Docker..."
cd $APP_DIR
sudo -u $DEPLOY_USER docker compose up -d
success "Services Docker lancés"

# ----------- VERIFICATION FINALE --------------
log "[10/10] Vérification finale..."
sleep 30

echo "==============================================="
echo "🔍 VÉRIFICATIONS EN COURS..."
echo "==============================================="

# Vérifier les conteneurs
docker compose ps

# Vérifier les logs
echo ""
echo "📋 Logs des services:"
docker compose logs --tail=10

# Test de santé
echo ""
echo "🏥 Test de santé:"
curl -f http://localhost:3000/health || warning "Health check échoué"

# Vérifier le certificat SSL
echo ""
echo "🔒 Certificat SSL:"
certbot certificates

echo ""
echo "==============================================="
echo "🎉 INSTALLATION TERMINÉE !"
echo "==============================================="
echo "🌐 API Backend: https://api.$DOMAIN"
echo "🔗 Health Check: https://api.$DOMAIN/health"
echo "📧 Webhook SendGrid: https://api.$DOMAIN/webhooks/sendgrid"
echo "👤 Utilisateur de déploiement: $DEPLOY_USER"
echo "📁 Répertoire de l'app: $APP_DIR"
echo ""
echo "📋 PROCHAINES ÉTAPES:"
echo "1. Éditer $APP_DIR/.env.production avec vos vraies valeurs"
echo "2. Configurer les services externes (Stripe, Cloudinary, etc.)"
echo "3. Mettre à jour le webhook SendGrid avec: https://api.$DOMAIN/webhooks/sendgrid"
echo "4. Tester l'API: curl https://api.$DOMAIN/health"
echo ""
echo "🔄 Pour redémarrer l'app:"
echo "cd $APP_DIR && docker compose restart"
echo ""
echo "📊 Pour voir les logs:"
echo "cd $APP_DIR && docker compose logs -f"
echo "==============================================="

