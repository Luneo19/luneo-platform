#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════╗
# ║  🚀 SCRIPT DÉPLOIEMENT BACKEND LUNEO ENTERPRISE                  ║
# ║     Déploiement automatisé sur Hetzner                           ║
# ╚═══════════════════════════════════════════════════════════════════╝

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║        🚀 DÉPLOIEMENT BACKEND LUNEO ENTERPRISE 🚀                ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
SERVER_IP="76.76.21.21"
SERVER_USER="root"
DOMAIN="api.luneo.app"
APP_DIR="/var/www/luneo-backend"
NODE_VERSION="20"

echo "📋 Configuration:"
echo "  Serveur: $SERVER_IP"
echo "  Domaine: $DOMAIN"
echo "  Dossier: $APP_DIR"
echo ""

# Fonction pour exécuter commandes sur serveur
remote_exec() {
    ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$@"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ÉTAPE 1: Vérification connexion serveur"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if remote_exec "echo 'Connexion SSH réussie'"; then
    echo "✅ Connexion SSH établie"
else
    echo "❌ Impossible de se connecter au serveur"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ÉTAPE 2: Update système et installation dépendances"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

remote_exec << 'ENDSSH'
echo "📦 Update système..."
apt update -qq
apt upgrade -y -qq

echo "📦 Installation dépendances de base..."
apt install -y curl wget git build-essential

echo "✅ Système mis à jour"
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ÉTAPE 3: Installation Node.js 20"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

remote_exec << 'ENDSSH'
if ! command -v node &> /dev/null; then
    echo "📦 Installation Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo "✅ Node.js déjà installé"
fi

node --version
npm --version
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ÉTAPE 4: Installation PM2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

remote_exec << 'ENDSSH'
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installation PM2..."
    npm install -g pm2
else
    echo "✅ PM2 déjà installé"
fi

pm2 --version
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ÉTAPE 5: Installation PostgreSQL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

remote_exec << 'ENDSSH'
if ! command -v psql &> /dev/null; then
    echo "📦 Installation PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
else
    echo "✅ PostgreSQL déjà installé"
fi

sudo -u postgres psql --version
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ÉTAPE 6: Installation Redis"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

remote_exec << 'ENDSSH'
if ! command -v redis-server &> /dev/null; then
    echo "📦 Installation Redis..."
    apt install -y redis-server
    systemctl start redis-server
    systemctl enable redis-server
else
    echo "✅ Redis déjà installé"
fi

redis-server --version
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ÉTAPE 7: Installation Nginx"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

remote_exec << 'ENDSSH'
if ! command -v nginx &> /dev/null; then
    echo "📦 Installation Nginx..."
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
else
    echo "✅ Nginx déjà installé"
fi

nginx -v
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ÉTAPE 8: Installation Certbot (SSL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

remote_exec << 'ENDSSH'
if ! command -v certbot &> /dev/null; then
    echo "📦 Installation Certbot..."
    apt install -y certbot python3-certbot-nginx
else
    echo "✅ Certbot déjà installé"
fi

certbot --version
ENDSSH

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                   ║"
echo "║        ✅ INFRASTRUCTURE SERVEUR PRÊTE ✅                        ║"
echo "║                                                                   ║"
echo "║  Prochaine étape: Upload et configuration de l'application       ║"
echo "║                                                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""


