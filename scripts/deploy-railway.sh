#!/bin/bash

# 🚀 Script de déploiement Railway - Backend
# Ce script automatise le déploiement sur Railway

set -e

echo "🚀 Déploiement Railway - Backend Luneo"
echo "========================================"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de log
log() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    error "Railway CLI n'est pas installé. Installez-le avec: npm i -g @railway/cli"
fi

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "apps/backend/package.json" ]; then
    error "Ce script doit être exécuté depuis la racine du projet"
fi

cd apps/backend

# Vérifier que le build fonctionne
log "Vérification du build local..."
if ! pnpm run build; then
    error "Le build a échoué. Corrigez les erreurs avant de déployer."
fi

# Vérifier que dist/src/main.js existe
if [ ! -f "dist/src/main.js" ]; then
    error "Le fichier dist/src/main.js n'existe pas. Le build a peut-être échoué."
fi

log "Build réussi ✓"

# Vérifier les variables d'environnement requises
log "Vérification des variables d'environnement..."

REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET")

for var in "${REQUIRED_VARS[@]}"; do
    if ! railway variables get "$var" &> /dev/null; then
        warn "Variable $var n'est pas définie dans Railway"
        echo "Définissez-la avec: railway variables set $var=\"valeur\""
    else
        log "Variable $var est définie ✓"
    fi
done

# Vérifier que Railway est lié au projet
if ! railway status &> /dev/null; then
    warn "Railway n'est pas lié à ce projet"
    echo "Liez-le avec: railway link"
    read -p "Voulez-vous lier maintenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        railway link
    else
        error "Vous devez lier Railway avant de déployer"
    fi
fi

# Déployer
log "Déploiement sur Railway..."
railway up

log "Déploiement terminé!"
echo ""
echo "Vérifiez les logs avec: railway logs"
echo "Testez le health check: curl \$(railway domain)/health"
