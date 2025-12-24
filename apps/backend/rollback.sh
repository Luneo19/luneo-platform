#!/bin/bash
echo "🔄 ROLLBACK VERS VERSION PRÉCÉDENTE"
echo "==================================="

SERVER_HOST="116.203.31.129"
SERVER_USER="root"
APP_DIR="/home/deploy/app"

echo "⚠️  ATTENTION: Cette action va restaurer la version précédente"
read -p "Êtes-vous sûr de vouloir continuer? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback annulé"
    exit 1
fi

echo "🔄 Démarrage du rollback..."

# 1. Arrêt des services
echo "⏹️  Arrêt des services..."
ssh $SERVER_USER@$SERVER_HOST "cd $APP_DIR && docker-compose -f docker-compose.production.yml down"

# 2. Rollback Git
echo "📥 Rollback Git..."
ssh $SERVER_USER@$SERVER_HOST "cd $APP_DIR && git reset --hard HEAD~1"

# 3. Reconstruction des images
echo "🔨 Reconstruction des images..."
ssh $SERVER_USER@$SERVER_HOST "cd $APP_DIR && docker-compose -f docker-compose.production.yml build --no-cache"

# 4. Redémarrage des services
echo "🚀 Redémarrage des services..."
ssh $SERVER_USER@$SERVER_HOST "cd $APP_DIR && docker-compose -f docker-compose.production.yml up -d"

# 5. Tests post-rollback
echo "🧪 Tests post-rollback..."
sleep 30
ssh $SERVER_USER@$SERVER_HOST "cd $APP_DIR && ./advanced-health-checks.sh"

echo ""
echo "✅ ROLLBACK TERMINÉ AVEC SUCCÈS !"
echo "🌐 API restaurée: https://luneo.app/api/v1/"
