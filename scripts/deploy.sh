#!/bin/bash
# 🚀 Script de déploiement principal modulaire
# Usage: ./scripts/deploy.sh [frontend|backend|all] [staging|production]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"
source "${SCRIPT_DIR}/lib/config.sh"

TARGET="${1:-all}"
ENV="${2:-production}"

log "🚀 Déploiement Luneo - $TARGET ($ENV)"

case "$TARGET" in
    frontend)
        build_frontend
        deploy_vercel "apps/frontend" "frontend"
        ;;
    backend)
        build_backend
        if [ "$ENV" = "production" ]; then
            deploy_hetzner
        else
            deploy_vercel "apps/backend" "backend"
        fi
        ;;
    all)
        check_prerequisites
        build_backend
        build_frontend
        if [ "$ENV" = "production" ]; then
            deploy_hetzner
        else
            deploy_vercel "apps/backend" "backend"
        fi
        deploy_vercel "apps/frontend" "frontend"
        ;;
    *)
        error "Cible invalide: $TARGET (utilisez: frontend, backend, all)"
        ;;
esac

success "✅ Déploiement terminé"


#!/bin/bash
# 🚀 Script de déploiement principal modulaire
# Usage: ./scripts/deploy.sh [frontend|backend|all] [staging|production]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"
source "${SCRIPT_DIR}/lib/config.sh"

TARGET="${1:-all}"
ENV="${2:-production}"

log "🚀 Déploiement Luneo - $TARGET ($ENV)"

case "$TARGET" in
    frontend)
        build_frontend
        deploy_vercel "apps/frontend" "frontend"
        ;;
    backend)
        build_backend
        if [ "$ENV" = "production" ]; then
            deploy_hetzner
        else
            deploy_vercel "apps/backend" "backend"
        fi
        ;;
    all)
        check_prerequisites
        build_backend
        build_frontend
        if [ "$ENV" = "production" ]; then
            deploy_hetzner
        else
            deploy_vercel "apps/backend" "backend"
        fi
        deploy_vercel "apps/frontend" "frontend"
        ;;
    *)
        error "Cible invalide: $TARGET (utilisez: frontend, backend, all)"
        ;;
esac

success "✅ Déploiement terminé"
















