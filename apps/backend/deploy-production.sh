#!/bin/bash

# Script de déploiement production pour Luneo Backend
set -e

echo "🚀 Déploiement production Luneo Backend"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de log
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

# Vérifications pré-déploiement
log "Vérification des prérequis..."

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    error "Docker n'est pas installé"
fi

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose n'est pas installé"
fi

# Vérifier le fichier .env.production
if [ ! -f .env.production ]; then
    error "Le fichier .env.production n'existe pas"
fi

log "Prérequis vérifiés ✅"

# Sauvegarde de la version actuelle
log "Sauvegarde de la version actuelle..."
if [ -d "dist" ]; then
    cp -r dist dist.backup.$(date +%Y%m%d_%H%M%S)
fi

# Build de l'application
log "Build de l'application..."
npm run build

# Tests de sécurité
log "Exécution des tests..."
npm run test

# Migration de la base de données
log "Migration de la base de données..."
npx prisma migrate deploy

# Seed de la base de données (si nécessaire)
if [ "$1" = "--seed" ]; then
    log "Seed de la base de données..."
    npx prisma db seed
fi

# Arrêt des services existants
log "Arrêt des services existants..."
docker-compose -f docker-compose.production.yml down || true

# Nettoyage des images
log "Nettoyage des images Docker..."
docker system prune -f

# Build des images
log "Build des images Docker..."
docker-compose -f docker-compose.production.yml build --no-cache

# Démarrage des services
log "Démarrage des services..."
docker-compose -f docker-compose.production.yml up -d

# Attendre que les services soient prêts
log "Attente du démarrage des services..."
sleep 30

# Vérification de la santé
log "Vérification de la santé des services..."

# Vérifier PostgreSQL
if ! docker exec luneo_postgres_prod pg_isready -U luneo_user; then
    error "PostgreSQL n'est pas prêt"
fi

# Vérifier Redis
if ! docker exec luneo_redis_prod redis-cli ping; then
    error "Redis n'est pas prêt"
fi

# Vérifier l'application
if ! curl -f http://localhost:3000/health; then
    error "L'application n'est pas prête"
fi

log "Tous les services sont opérationnels ✅"

# Tests de l'API
log "Tests de l'API..."
curl -s http://localhost:3000/api/v1/products | jq '.success' | grep -q "true" || warn "Test API products échoué"

# Création de la release Sentry
log "Création de la release Sentry..."
npm run sentry:release || warn "Échec de la création de la release Sentry"

# Upload des source maps
log "Upload des source maps..."
npm run sentry:upload-sourcemaps || warn "Échec de l'upload des source maps"

# Nettoyage
log "Nettoyage..."
rm -rf dist.backup.*

# Affichage des informations
log "Déploiement terminé avec succès! 🎉"
echo ""
echo "📊 Informations de déploiement:"
echo "   - Application: http://localhost:3000"
echo "   - Health Check: http://localhost:3000/health"
echo "   - API Docs: http://localhost:3000/api/docs"
echo "   - Sentry Dashboard: https://sentry.io"
echo ""
echo "🔍 Logs des services:"
echo "   - Backend: docker logs luneo_backend_prod"
echo "   - PostgreSQL: docker logs luneo_postgres_prod"
echo "   - Redis: docker logs luneo_redis_prod"
echo "   - Nginx: docker logs luneo_nginx_prod"
echo ""
echo "🛠️ Commandes utiles:"
echo "   - Arrêter: docker-compose -f docker-compose.production.yml down"
echo "   - Logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   - Restart: docker-compose -f docker-compose.production.yml restart"









