#!/bin/bash

# 🚀 Script de déploiement Vercel - Frontend
# Ce script automatise le déploiement sur Vercel

set -e

echo "🚀 Déploiement Vercel - Frontend Luneo"
echo "======================================="

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

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    error "Vercel CLI n'est pas installé. Installez-le avec: npm i -g vercel"
fi

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "apps/frontend/package.json" ]; then
    error "Ce script doit être exécuté depuis la racine du projet"
fi

cd apps/frontend

# Vérifier que le build fonctionne
log "Vérification du build local..."
if ! pnpm run build; then
    error "Le build a échoué. Corrigez les erreurs avant de déployer."
fi

# Vérifier que .next existe
if [ ! -d ".next" ]; then
    error "Le dossier .next n'existe pas. Le build a peut-être échoué."
fi

log "Build réussi ✓"

# Vérifier les variables d'environnement requises
log "Vérification des variables d'environnement..."

REQUIRED_VARS=("NEXT_PUBLIC_API_URL" "NEXT_PUBLIC_APP_URL" "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY")

for var in "${REQUIRED_VARS[@]}"; do
    if ! vercel env ls | grep -q "$var"; then
        warn "Variable $var n'est pas définie dans Vercel"
        echo "Définissez-la avec: vercel env add $var production"
    else
        log "Variable $var est définie ✓"
    fi
done

# Vérifier que Vercel est lié au projet
if [ ! -f ".vercel/project.json" ]; then
    warn "Vercel n'est pas lié à ce projet"
    echo "Liez-le avec: vercel link"
    read -p "Voulez-vous lier maintenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        vercel link
    else
        error "Vous devez lier Vercel avant de déployer"
    fi
fi

# Déployer
log "Déploiement sur Vercel..."
vercel --prod

log "Déploiement terminé!"
echo ""
echo "Vérifiez les logs avec: vercel logs"
echo "Votre application est disponible sur: $(vercel ls | grep production | awk '{print $2}')"
