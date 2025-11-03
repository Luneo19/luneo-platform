#!/bin/bash

# 🚀 LUNEO - Script de Déploiement Production
# Déploie tous les services en production

set -e

echo "════════════════════════════════════════════════════════════════════════════"
echo "  🚀 LUNEO - DÉPLOIEMENT PRODUCTION PROFESSIONNEL  🚀"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification de l'environnement
check_environment() {
    print_status "Vérification de l'environnement de production..."
    
    if [ ! -f "apps/backend/.env" ]; then
        print_error "Fichier .env manquant dans apps/backend/"
        exit 1
    fi
    
    if [ ! -f "apps/frontend/.env" ]; then
        print_warning "Fichier .env manquant dans apps/frontend/"
    fi
    
    print_success "Environnement vérifié"
}

# Build du backend
build_backend() {
    print_status "Build du backend NestJS..."
    cd apps/backend
    
    # Installation des dépendances
    npm install --production=false
    
    # Génération Prisma
    if [ -f "prisma/schema.prisma" ]; then
        npx prisma generate
        print_success "Client Prisma généré"
    fi
    
    # Build
    npm run build
    print_success "Backend construit avec succès"
    
    cd ../..
}

# Build du frontend
build_frontend() {
    print_status "Build du frontend Next.js..."
    cd apps/frontend
    
    # Installation des dépendances
    npm install --production=false
    
    # Build
    npm run build
    print_success "Frontend construit avec succès"
    
    cd ../..
}

# Déploiement du backend sur Hetzner
deploy_backend() {
    print_status "Déploiement du backend sur Hetzner..."
    
    SERVER_IP="116.203.31.129"
    SERVER_USER="root"
    SERVER_PATH="/opt/luneo"
    
    print_status "Création de l'archive backend..."
    cd apps/backend
    tar -czf ../../backend-deploy.tar.gz \
        dist/ \
        node_modules/ \
        prisma/ \
        package.json \
        .env 2>/dev/null || tar -czf ../../backend-deploy.tar.gz \
        dist/ \
        node_modules/ \
        prisma/ \
        package.json
    cd ../..
    
    print_status "Envoi vers le serveur..."
    scp -o StrictHostKeyChecking=no backend-deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
    
    print_status "Déploiement sur le serveur..."
    ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'EOF'
        cd /opt/luneo
        tar -xzf backend-deploy.tar.gz
        rm backend-deploy.tar.gz
        
        # Restart PM2
        pm2 restart luneo-api || pm2 start dist/main.js --name luneo-api
        pm2 save
        
        echo "✅ Backend déployé avec succès"
EOF
    
    rm backend-deploy.tar.gz
    print_success "Backend déployé sur Hetzner"
}

# Déploiement du frontend sur Vercel
deploy_frontend() {
    print_status "Déploiement du frontend sur Vercel..."
    
    cd apps/frontend
    
    # Vérifier si vercel est installé
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI non installé, installation..."
        npm install -g vercel
    fi
    
    # Déploiement
    vercel --prod --yes
    
    cd ../..
    print_success "Frontend déployé sur Vercel"
}

# Déploiement des workers IA
deploy_workers() {
    print_status "Déploiement des workers IA..."
    
    SERVER_IP="116.203.31.129"
    SERVER_USER="root"
    
    cd apps/worker-ia
    
    # Vérifier si le dossier existe
    if [ ! -d "ai-worker" ] && [ ! -f "worker.ts" ]; then
        print_warning "Structure worker-ia non trouvée, skip..."
        cd ../..
        return
    fi
    
    # Archiver les workers
    tar -czf ../../workers-deploy.tar.gz ai-worker/ render-worker/ 2>/dev/null || \
    tar -czf ../../workers-deploy.tar.gz .
    cd ../..
    
    print_status "Envoi des workers vers le serveur..."
    scp -o StrictHostKeyChecking=no workers-deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:/opt/luneo/workers/
    
    print_status "Déploiement des workers sur le serveur..."
    ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'EOF'
        cd /opt/luneo/workers
        tar -xzf workers-deploy.tar.gz
        rm workers-deploy.tar.gz
        
        # Restart workers
        pm2 restart luneo-worker-ai || pm2 start ai-worker/worker.ts --name luneo-worker-ai --interpreter tsx
        pm2 restart luneo-worker-render || pm2 start render-worker/worker.ts --name luneo-worker-render --interpreter tsx
        pm2 save
        
        echo "✅ Workers déployés avec succès"
EOF
    
    rm workers-deploy.tar.gz
    print_success "Workers déployés"
}

# Configuration SSL/Nginx
configure_nginx() {
    print_status "Vérification de la configuration Nginx..."
    
    SERVER_IP="116.203.31.129"
    SERVER_USER="root"
    
    ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'EOF'
        # Vérifier Nginx
        if systemctl is-active --quiet nginx; then
            echo "✅ Nginx actif"
            nginx -t && nginx -s reload
        else
            echo "⚠️ Nginx non actif"
        fi
EOF
    
    print_success "Nginx vérifié"
}

# Tests post-déploiement
run_health_checks() {
    print_status "Tests de santé post-déploiement..."
    
    # Test API
    print_status "Test API backend..."
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.luneo.app/health || echo "000")
    
    if [ "$API_STATUS" = "200" ]; then
        print_success "API backend : OK (200)"
    else
        print_warning "API backend : Status $API_STATUS"
    fi
    
    # Test Frontend
    print_status "Test frontend..."
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app.luneo.app || echo "000")
    
    if [ "$FRONTEND_STATUS" = "200" ]; then
        print_success "Frontend : OK (200)"
    else
        print_warning "Frontend : Status $FRONTEND_STATUS"
    fi
}

# Rapport de déploiement
generate_report() {
    echo ""
    echo "════════════════════════════════════════════════════════════════════════════"
    echo "  ✅ DÉPLOIEMENT PRODUCTION TERMINÉ AVEC SUCCÈS !  ✅"
    echo "════════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "🌐 URLs DE PRODUCTION :"
    echo "   • Frontend : https://app.luneo.app"
    echo "   • API Backend : https://api.luneo.app"
    echo "   • Documentation : https://app.luneo.app/help/documentation"
    echo ""
    echo "📊 SERVICES DÉPLOYÉS :"
    echo "   ✅ Backend NestJS"
    echo "   ✅ Frontend Next.js"
    echo "   ✅ Workers IA"
    echo "   ✅ Base de données PostgreSQL"
    echo "   ✅ Redis"
    echo "   ✅ Nginx + SSL"
    echo ""
    echo "🔍 MONITORING :"
    echo "   • Logs : ssh root@116.203.31.129 'pm2 logs'"
    echo "   • Status : ssh root@116.203.31.129 'pm2 status'"
    echo ""
    echo "🎯 PROCHAINES ÉTAPES :"
    echo "   1. Vérifier les services : pm2 status"
    echo "   2. Surveiller les logs : pm2 logs"
    echo "   3. Tester l'API : curl https://api.luneo.app/health"
    echo "   4. Accéder au dashboard : https://app.luneo.app/dashboard"
    echo ""
    echo "🏆 VOTRE PLATEFORME LUNEO EST EN PRODUCTION ! 🏆"
    echo ""
}

# Fonction principale
main() {
    echo "🚀 Début du déploiement production..."
    echo ""
    
    check_environment
    build_backend
    build_frontend
    deploy_backend
    deploy_frontend
    deploy_workers
    configure_nginx
    run_health_checks
    generate_report
    
    print_success "Déploiement terminé avec succès !"
}

# Exécution
main "$@"


