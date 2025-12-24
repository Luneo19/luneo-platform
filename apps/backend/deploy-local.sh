#!/bin/bash
echo "🚀 DÉPLOIEMENT LOCAL VERS PRODUCTION"
echo "===================================="

# Configuration
SERVER_HOST="116.203.31.129"
SERVER_USER="root"
APP_DIR="/home/deploy/app"

# Vérifications pré-déploiement
echo "🔍 Vérifications pré-déploiement..."

# Test de connectivité
if ! ping -c 1 $SERVER_HOST > /dev/null 2>&1; then
    echo "❌ Serveur inaccessible: $SERVER_HOST"
    exit 1
fi
echo "✅ Serveur accessible"

# Test SSH
if ! ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_HOST "echo 'SSH OK'" > /dev/null 2>&1; then
    echo "❌ Connexion SSH échouée"
    exit 1
fi
echo "✅ Connexion SSH OK"

# Déploiement
echo "🚀 Démarrage du déploiement..."

# 1. Pull du code
echo "📥 Pull du code..."
ssh $SERVER_USER@$SERVER_HOST "cd $APP_DIR && git pull origin main"

# 2. Build de l'application
echo "🔨 Build de l'application..."
ssh $SERVER_USER@$SERVER_HOST "cd $APP_DIR && docker-compose -f docker-compose.production.yml build --no-cache"

# 3. Migrations de base de données
echo "🗄️ Migrations de base de données..."
ssh $SERVER_USER@$SERVER_HOST "cd $APP_DIR && docker-compose -f docker-compose.production.yml exec -T backend npx prisma migrate deploy"

# 4. Redémarrage des services
echo "🔄 Redémarrage des services..."
ssh $SERVER_USER@$SERVER_HOST "cd $APP_DIR && docker-compose -f docker-compose.production.yml up -d"

# 5. Attente de la disponibilité
echo "⏳ Attente de la disponibilité des services..."
sleep 30

# 6. Tests post-déploiement
echo "🧪 Tests post-déploiement..."
ssh $SERVER_USER@$SERVER_HOST "cd $APP_DIR && ./advanced-health-checks.sh"

echo ""
echo "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
echo "🌐 API: https://luneo.app/api/v1/"
echo "📊 Health: https://luneo.app/health"
