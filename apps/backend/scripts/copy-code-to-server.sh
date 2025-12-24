#!/bin/bash

# ===============================================
# SCRIPT DE COPIE DU CODE VERS LE SERVEUR
# ===============================================

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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
APP_DIR="/home/deploy/luneo-backend/backend"

log "📦 Copie du code source Luneo vers le serveur"
info "Serveur: $SERVER_IP"
info "Dossier: $APP_DIR"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    warn "package.json non trouvé. Exécutez ce script depuis le dossier backend/"
    exit 1
fi

log "📄 Copie des fichiers de configuration..."
scp package.json deploy@$SERVER_IP:$APP_DIR/
scp pnpm-lock.yaml deploy@$SERVER_IP:$APP_DIR/ 2>/dev/null || warn "pnpm-lock.yaml non trouvé"
scp tsconfig.json deploy@$SERVER_IP:$APP_DIR/
scp nest-cli.json deploy@$SERVER_IP:$APP_DIR/

log "📁 Copie du code source..."
rsync -avz --delete src/ deploy@$SERVER_IP:$APP_DIR/src/

log "🐳 Copie des fichiers Docker..."
scp Dockerfile deploy@$SERVER_IP:$APP_DIR/ 2>/dev/null || warn "Dockerfile non trouvé"

log "🗄️ Copie du schema Prisma..."
scp prisma/schema.prisma deploy@$SERVER_IP:$APP_DIR/prisma/ 2>/dev/null || warn "Schema Prisma non trouvé"

log "📚 Copie de la documentation..."
scp *.md deploy@$SERVER_IP:$APP_DIR/ 2>/dev/null || warn "Documentation non trouvée"

log "✅ Code source copié avec succès !"
log ""
log "🔧 Prochaines étapes :"
log "   1. Connectez-vous au serveur: ssh deploy@$SERVER_IP"
log "   2. Allez dans le dossier: cd $APP_DIR"
log "   3. Lancez l'application: docker compose up -d --build"
log "   4. Vérifiez les logs: docker compose logs -f api"
log ""
log "🌐 Votre API sera accessible sur: https://luneo.com/api/v1"

