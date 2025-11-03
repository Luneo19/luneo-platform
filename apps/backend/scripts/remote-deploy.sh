#!/bin/bash

# ===============================================
# SCRIPT DE DEPLOIEMENT DISTANT HETZNER
# ===============================================
# Ce script copie et exécute le déploiement sur le serveur distant

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# Configuration
SERVER_IP="116.203.31.129"
SERVER_USER="root"
DEPLOY_SCRIPT="deploy-hetzner-complete.sh"

log "🚀 Déploiement distant sur Hetzner ($SERVER_IP)"

# Vérifier que le script existe
if [ ! -f "scripts/$DEPLOY_SCRIPT" ]; then
    error "Script de déploiement non trouvé: scripts/$DEPLOY_SCRIPT"
fi

log "📤 Copie du script de déploiement sur le serveur..."
scp scripts/$DEPLOY_SCRIPT $SERVER_USER@$SERVER_IP:/tmp/

log "🔧 Exécution du script de déploiement..."
ssh $SERVER_USER@$SERVER_IP "chmod +x /tmp/$DEPLOY_SCRIPT && /tmp/$DEPLOY_SCRIPT"

log "✅ Déploiement terminé !"
log "🌐 Votre API sera disponible sur: https://luneo.com"
log "🔗 Testez avec: curl https://luneo.com/api/v1/health"

