#!/bin/bash
echo "🔧 Configuration SSL complète pour Luneo..."

# 1. Copier la config SSL sur le serveur
echo "📋 Copie de la configuration SSL..."
scp nginx-ssl.conf root@116.203.31.129:/home/deploy/app/

# 2. Se connecter et configurer SSL
echo "🔐 Configuration SSL sur le serveur..."
ssh root@116.203.31.129 << 'REMOTE_EOF'
cd /home/deploy/app

# Créer le répertoire pour les challenges Let's Encrypt
mkdir -p /var/www/html

# Arrêter Nginx Docker temporairement
docker-compose -f docker-compose.production.yml stop nginx

# Obtenir le certificat SSL
certbot certonly --webroot -w /var/www/html -d luneo.app -d api.luneo.app --email admin@luneo.app --agree-tos --no-eff-email --non-interactive

# Remplacer la config Nginx
cp nginx-ssl.conf nginx.conf

# Redémarrer avec SSL
docker-compose -f docker-compose.production.yml up -d

echo "✅ SSL configuré avec succès !"
echo "🌐 Testez maintenant :"
echo "curl https://luneo.app/api/v1/email/status"
echo "curl https://api.luneo.app/api/v1/email/status"
REMOTE_EOF

echo "🎉 Configuration SSL terminée !"
