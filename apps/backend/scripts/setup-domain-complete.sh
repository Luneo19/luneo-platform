#!/bin/bash

# ===============================================
# SCRIPT AUTOMATIQUE - CONFIGURATION DOMAINE COMPLÈTE
# ===============================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Configuration automatique du domaine luneo.com..."

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# ===============================================
# ÉTAPE 1: Configuration Nginx
# ===============================================

log "Configuration de Nginx..."

# Créer la configuration Nginx
cat > nginx.conf << 'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    server {
        listen 80;
        server_name luneo.com *.luneo.com;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://backend/health;
            access_log off;
        }

        # API endpoints
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
NGINX_EOF

success "Configuration Nginx créée"

# ===============================================
# ÉTAPE 2: Redémarrer Nginx
# ===============================================

log "Redémarrage de Nginx..."

# Arrêter Nginx
docker-compose -f docker-compose.production.yml stop nginx 2>/dev/null || true

# Démarrer Nginx
docker-compose -f docker-compose.production.yml up -d nginx

success "Nginx redémarré"

# ===============================================
# ÉTAPE 3: Vérification
# ===============================================

log "Vérification des services..."

# Attendre que Nginx démarre
sleep 5

# Vérifier le statut
echo ""
echo "📊 Statut des conteneurs:"
docker-compose -f docker-compose.production.yml ps

echo ""
echo "🔍 Test de l'API via Nginx:"
curl -s http://localhost/api/v1/email/status | head -c 100
echo ""

# ===============================================
# ÉTAPE 4: Configuration DNS (Instructions)
# ===============================================

echo ""
echo "🌐 CONFIGURATION DNS REQUISE:"
echo "================================"
echo ""
echo "Dans votre gestionnaire de domaine (Cloudflare, etc.), ajoutez:"
echo ""
echo "Type: A"
echo "Name: @"
echo "Content: 116.203.31.129"
echo ""
echo "Type: A"
echo "Name: api"
echo "Content: 116.203.31.129"
echo ""
echo "Type: CNAME"
echo "Name: www"
echo "Content: luneo.com"
echo ""

# ===============================================
# ÉTAPE 5: Test de connectivité
# ===============================================

log "Test de connectivité..."

echo "🔗 URLs de test:"
echo "- http://116.203.31.129/api/v1/email/status"
echo "- http://luneo.com/api/v1/email/status (après configuration DNS)"
echo ""

# ===============================================
# ÉTAPE 6: Prochaines étapes
# ===============================================

echo "📋 PROCHAINES ÉTAPES:"
echo "====================="
echo ""
echo "1. ✅ Configuration Nginx terminée"
echo "2. ⏳ Configurer les enregistrements DNS"
echo "3. ⏳ Configurer SSL/HTTPS avec Let's Encrypt"
echo "4. ⏳ Tests finaux"
echo ""

success "Configuration du domaine terminée avec succès !"
echo ""
echo "🎉 Votre API est maintenant accessible via Nginx !"
echo ""
echo "Testez maintenant:"
echo "curl http://116.203.31.129/api/v1/email/status"

