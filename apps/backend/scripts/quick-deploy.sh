#!/bin/bash

# ===============================================
# DÉPLOIEMENT RAPIDE LUNEO BACKEND
# Script simplifié pour déploiement immédiat
# ===============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Configuration
DOMAIN="luneo.app"
EMAIL="admin@luneo.app"
POSTGRES_PASSWORD="luneo_secure_2024"
DEPLOY_USER="deploy"

echo "🚀 DÉPLOIEMENT RAPIDE LUNEO BACKEND"
echo "=================================="
echo "Domaine: $DOMAIN"
echo "Email: $EMAIL"
echo "=================================="

# Vérification que nous sommes en root
if [ "$EUID" -ne 0 ]; then
    error "Ce script doit être exécuté en tant que root"
fi

# Étape 1: Mise à jour système
log "Mise à jour du système..."
apt update && apt upgrade -y

# Étape 2: Installation des paquets
log "Installation des paquets..."
apt install -y curl git ufw fail2ban docker.io docker-compose nginx certbot python3-certbot-nginx

# Étape 3: Configuration firewall
log "Configuration du firewall..."
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

# Étape 4: Création utilisateur deploy
log "Création utilisateur deploy..."
if ! id "$DEPLOY_USER" &>/dev/null; then
    adduser --disabled-password --gecos "" $DEPLOY_USER
    usermod -aG sudo $DEPLOY_USER
    usermod -aG docker $DEPLOY_USER
fi

# Étape 5: Configuration Nginx simple
log "Configuration Nginx..."
cat > /etc/nginx/sites-available/luneo.conf <<EOL
server {
    listen 80;
    server_name $DOMAIN api.$DOMAIN;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL

ln -sf /etc/nginx/sites-available/luneo.conf /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Étape 6: Préparation application
log "Préparation application..."
APP_DIR="/home/$DEPLOY_USER/luneo-app"
mkdir -p $APP_DIR

# Docker Compose simple
cat > $APP_DIR/docker-compose.yml <<EOL
version: "3.9"
services:
  backend:
    image: node:20-alpine
    working_dir: /app
    command: sh -c "npm install && npm run build && npm run start:prod"
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    volumes:
      - ./:/app
      - /app/node_modules
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://luneo_user:$POSTGRES_PASSWORD@postgres:5432/luneo_prod
      - JWT_SECRET=luneo_jwt_secret_2024_production_secure
      - JWT_REFRESH_SECRET=luneo_refresh_secret_2024_production_secure
      - SENDGRID_API_KEY=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
      - SENDGRID_DOMAIN=luneo.app
      - SMTP_FROM=Luneo <no-reply@luneo.app>

  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: luneo_user
      POSTGRES_PASSWORD: $POSTGRES_PASSWORD
      POSTGRES_DB: luneo_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOL

chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR

# Étape 7: Clonage du code (si possible)
log "Clonage du code..."
cd $APP_DIR
sudo -u $DEPLOY_USER git clone https://github.com/luneo/luneo-enterprise.git . || {
    echo "⚠️  Impossible de cloner. Vous devrez copier le code manuellement."
}

# Étape 8: Lancement des services
log "Lancement des services..."
sudo -u $DEPLOY_USER docker compose up -d

# Étape 9: SSL avec Let's Encrypt
log "Configuration SSL..."
sleep 30
certbot --nginx -d $DOMAIN -d api.$DOMAIN --non-interactive --agree-tos --email $EMAIL

# Étape 10: Vérification finale
log "Vérification finale..."
sleep 10
docker compose ps
curl -f http://localhost:3000/health || echo "⚠️  Health check échoué"

echo ""
echo "🎉 DÉPLOIEMENT TERMINÉ !"
echo "========================"
echo "🌐 API: https://api.$DOMAIN"
echo "🔗 Health: https://api.$DOMAIN/health"
echo "👤 User: $DEPLOY_USER"
echo "📁 App: $APP_DIR"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Copier votre code dans $APP_DIR"
echo "2. Configurer les variables d'environnement"
echo "3. Redémarrer: cd $APP_DIR && docker compose restart"
echo "========================"

