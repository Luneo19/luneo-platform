#!/bin/bash
set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

log "🚀 Configuration automatique du serveur Hetzner..."

# Mise à jour du système
log "📦 Mise à jour du système..."
apt update && apt upgrade -y

# Installation des packages
log "🔧 Installation des packages..."
apt install -y curl git ufw fail2ban docker.io docker-compose nginx certbot python3-certbot-nginx python3-certbot-dns-cloudflare

# Configuration Docker
log "🐳 Configuration de Docker..."
systemctl enable docker
systemctl start docker

# Création de l'utilisateur deploy
log "👤 Création de l'utilisateur deploy..."
if ! id "deploy" &>/dev/null; then
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    usermod -aG docker deploy
    log "✅ Utilisateur deploy créé"
else
    log "✅ Utilisateur deploy existe déjà"
fi

# Configuration du firewall
log "🔥 Configuration du firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

# Configuration Fail2ban
log "🛡️ Configuration de Fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# Configuration Nginx
log "🌐 Configuration de Nginx..."
systemctl enable nginx
systemctl start nginx

log "✅ Configuration du serveur terminée !"
log "🔄 Déconnectez-vous et reconnectez-vous avec: ssh deploy@116.203.31.129"
