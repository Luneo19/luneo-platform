#!/bin/bash

# ===============================================
# SCRIPT DE COPIE DU CODE SOURCE VERS LE SERVEUR
# ===============================================
# Ce script copie le code source Luneo vers le serveur Hetzner

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Configuration
SERVER_IP="116.203.31.129"
SERVER_USER="deploy"
REMOTE_DIR="/home/deploy/luneo-backend/backend"
LOCAL_DIR="."

log "📤 Copie du code source vers le serveur Hetzner"
info "Serveur: $SERVER_USER@$SERVER_IP"
info "Dossier distant: $REMOTE_DIR"

# Vérifier la connexion
log "🔍 Test de connexion SSH..."
if ! ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP "echo 'Connexion SSH OK'"; then
    warn "Impossible de se connecter au serveur"
    warn "Assurez-vous que:"
    warn "  1. Le serveur est configuré et l'utilisateur 'deploy' existe"
    warn "  2. Vous avez exécuté le script de déploiement initial"
    warn "  3. La connexion SSH fonctionne"
    exit 1
fi

# Créer le dossier distant si nécessaire
log "📁 Création du dossier distant..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_DIR"

# Copier les fichiers essentiels
log "📦 Copie des fichiers de l'application..."

# Package.json et dépendances
info "  - package.json et pnpm-lock.yaml"
scp package.json $SERVER_USER@$SERVER_IP:$REMOTE_DIR/
scp pnpm-lock.yaml $SERVER_USER@$SERVER_IP:$REMOTE_DIR/ 2>/dev/null || warn "pnpm-lock.yaml non trouvé"

# Configuration TypeScript
info "  - Configuration TypeScript"
scp tsconfig.json $SERVER_USER@$SERVER_IP:$REMOTE_DIR/
scp nest-cli.json $SERVER_USER@$SERVER_IP:$REMOTE_DIR/

# Source code
info "  - Code source (src/)"
rsync -avz --delete src/ $SERVER_USER@$SERVER_IP:$REMOTE_DIR/src/

# Fichiers de configuration
info "  - Fichiers de configuration"
scp prisma/schema.prisma $SERVER_USER@$SERVER_IP:$REMOTE_DIR/prisma/ 2>/dev/null || warn "Schema Prisma non trouvé"

# Dockerfiles
info "  - Dockerfiles"
scp Dockerfile $SERVER_USER@$SERVER_IP:$REMOTE_DIR/ 2>/dev/null || warn "Dockerfile non trouvé"
scp docker-compose.yml $SERVER_USER@$SERVER_IP:$REMOTE_DIR/ 2>/dev/null || warn "docker-compose.yml non trouvé"

# Scripts de déploiement
info "  - Scripts de déploiement"
ssh $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_DIR/scripts"
scp scripts/*.sh $SERVER_USER@$SERVER_IP:$REMOTE_DIR/scripts/ 2>/dev/null || warn "Scripts non trouvés"

# Documentation
info "  - Documentation"
scp *.md $SERVER_USER@$SERVER_IP:$REMOTE_DIR/ 2>/dev/null || warn "Documentation non trouvée"

# Fichiers d'environnement (sans secrets)
info "  - Fichiers d'environnement (exemples)"
scp env.example $SERVER_USER@$SERVER_IP:$REMOTE_DIR/ 2>/dev/null || warn "env.example non trouvé"

# Vérifier la copie
log "🔍 Vérification de la copie..."
ssh $SERVER_USER@$SERVER_IP "ls -la $REMOTE_DIR/"

# Reconstruire l'application sur le serveur
log "🔨 Reconstruction de l'application sur le serveur..."
ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && docker compose down || true"

# Installer les dépendances et construire
ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && npm install -g pnpm && pnpm install --frozen-lockfile && pnpm run build"

# Redémarrer les services
log "🚀 Redémarrage des services..."
ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && docker compose up -d"

# Attendre que les services démarrent
log "⏳ Attente du démarrage des services..."
sleep 30

# Vérifier le statut
log "📊 Vérification du statut des services..."
ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && docker compose ps"

# Test de l'API
log "🧪 Test de l'API..."
if ssh $SERVER_USER@$SERVER_IP "curl -s http://localhost:3000/health | grep -q 'ok'"; then
    log "✅ API fonctionnelle localement"
else
    warn "⚠️ API non accessible localement"
fi

log ""
log "🎉 Copie du code source terminée !"
log ""
log "📋 Prochaines étapes :"
log "   1. 🌐 Configurez votre DNS pour pointer luneo.com vers $SERVER_IP"
log "   2. 🔐 Vérifiez le certificat SSL: https://luneo.com"
log "   3. 🧪 Testez l'API: curl https://luneo.com/api/v1/health"
log "   4. 📊 Surveillez les logs: ssh $SERVER_USER@$SERVER_IP 'cd $REMOTE_DIR && docker compose logs -f'"
log ""
log "✅ Votre backend Luneo est maintenant déployé sur Hetzner !"

