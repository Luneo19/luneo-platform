# 🚀 Guide de Déploiement Hetzner VPS - Luneo Backend

## 📋 Prérequis

### **1. Serveur VPS Hetzner**
- **Type** : CX21 ou plus (2 vCPU, 4GB RAM minimum)
- **OS** : Ubuntu 22.04 LTS
- **Disque** : 40GB SSD minimum

### **2. Domaine**
- **Domaine principal** : `luneo.app`
- **Sous-domaine API** : `api.luneo.app`

## 🔧 Configuration Initiale du Serveur

### **Étape 1: Connexion au Serveur**
```bash
# Connexion SSH
ssh root@votre-ip-serveur

# Mise à jour du système
apt update && apt upgrade -y

# Installation des dépendances
apt install -y curl wget git nginx certbot python3-certbot-nginx
```

### **Étape 2: Installation de Node.js**
```bash
# Installation de Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Installation de pnpm
npm install -g pnpm

# Vérification
node --version  # v20.x.x
pnpm --version  # 8.x.x
```

### **Étape 3: Installation de Docker**
```bash
# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installation de Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Vérification
docker --version
docker-compose --version
```

### **Étape 4: Configuration du Firewall**
```bash
# Configuration UFW
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3000  # Temporaire pour tests
ufw enable
```

## 📁 Préparation du Déploiement

### **Étape 5: Cloner le Projet**
```bash
# Création du répertoire
mkdir -p /opt/luneo
cd /opt/luneo

# Cloner le projet (remplacez par votre repo)
git clone https://github.com/votre-username/luneo-enterprise.git
cd luneo-enterprise/backend
```

### **Étape 6: Configuration des Variables d'Environnement**
```bash
# Copier le fichier d'exemple
cp env.production.example .env

# Éditer le fichier .env
nano .env
```

**Contenu du fichier `.env` :**
```env
# Database
DATABASE_URL="postgresql://luneo_user:VOTRE_MOT_DE_PASSE@localhost:5432/luneo_production?schema=public"

# Redis
REDIS_URL="redis://:VOTRE_MOT_DE_PASSE@localhost:6379"

# JWT
JWT_SECRET="votre-super-secret-jwt-key-32-chars-long"
JWT_REFRESH_SECRET="votre-super-secret-refresh-key-32-chars-long"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# SendGrid Configuration
SENDGRID_API_KEY="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"
SENDGRID_DOMAIN="luneo.app"
SENDGRID_FROM_NAME="Luneo"
SENDGRID_FROM_EMAIL="no-reply@luneo.app"
SENDGRID_REPLY_TO="support@luneo.app"

# SMTP Configuration
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_FROM="Luneo <no-reply@luneo.app>"

# Domain Verification Status
DOMAIN_VERIFIED="true"

# DNS Records
SPF_RECORD="v=spf1 include:_spf.sendgrid.net ~all"
DKIM_RECORD="v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..."
DMARC_RECORD="v=DMARC1; p=none; rua=mailto:rapports.dmarc.luneo@gmail.com"

# Email Templates
EMAIL_TEMPLATE_WELCOME="d-welcome-template-id"
EMAIL_TEMPLATE_PASSWORD_RESET="d-password-reset-template-id"
EMAIL_TEMPLATE_EMAIL_CONFIRMATION="d-email-confirmation-template-id"

# Monitoring
SENTRY_DSN="VOTRE_SENTRY_DSN"
SENTRY_ENVIRONMENT="production"

# App
NODE_ENV="production"
PORT="3000"
API_PREFIX="/api/v1"
CORS_ORIGIN="https://luneo.app"
RATE_LIMIT_TTL="60"
RATE_LIMIT_LIMIT="100"

# Frontend URL
FRONTEND_URL="https://luneo.app"
```

## 🐳 Déploiement avec Docker

### **Étape 7: Configuration Docker Compose**
```bash
# Vérifier la configuration
cat docker-compose.production.yml

# Démarrage des services
docker-compose -f docker-compose.production.yml up -d
```

### **Étape 8: Vérification des Services**
```bash
# Vérifier les conteneurs
docker-compose -f docker-compose.production.yml ps

# Vérifier les logs
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs postgres
docker-compose -f docker-compose.production.yml logs redis
```

## 🌐 Configuration Nginx

### **Étape 9: Configuration Nginx**
```bash
# Créer la configuration Nginx
cat > /etc/nginx/sites-available/luneo-api << 'EOF'
server {
    listen 80;
    server_name api.luneo.app;

    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.luneo.app;

    # SSL Configuration (sera configuré par Certbot)
    ssl_certificate /etc/letsencrypt/live/api.luneo.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.luneo.app/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy vers l'application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Activer le site
ln -s /etc/nginx/sites-available/luneo-api /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### **Étape 10: Configuration SSL avec Certbot**
```bash
# Obtenir le certificat SSL
certbot --nginx -d api.luneo.app

# Vérifier le renouvellement automatique
certbot renew --dry-run
```

## 🧪 Tests de Déploiement

### **Étape 11: Tests de l'Application**
```bash
# Test de santé
curl -s https://api.luneo.app/health

# Test de l'API
curl -s https://api.luneo.app/api/v1

# Test des webhooks
curl -X POST https://api.luneo.app/webhooks/sendgrid \
  -H "Content-Type: application/json" \
  -d '[{"event":"delivered","email":"test@example.com"}]'
```

## 🔄 Configuration du Webhook SendGrid

### **Étape 12: Mise à Jour du Webhook**
1. Aller sur [SendGrid Dashboard](https://app.sendgrid.com/)
2. Settings > Mail Settings > Event Webhook
3. Modifier l'URL existante :
   - **Ancienne URL** : `https://api.luneo.app/webhooks/sendgrid`
   - **Nouvelle URL** : `https://api.luneo.app/webhooks/sendgrid`
4. Activer les événements :
   - ✅ delivered
   - ✅ bounce
   - ✅ dropped
   - ✅ spam_report
   - ✅ unsubscribe

## 📊 Monitoring et Maintenance

### **Étape 13: Configuration du Monitoring**
```bash
# Installation de PM2 pour le monitoring
npm install -g pm2

# Configuration PM2 (si pas Docker)
pm2 start dist/main.js --name luneo-api
pm2 startup
pm2 save
```

### **Étape 14: Logs et Maintenance**
```bash
# Voir les logs
docker-compose -f docker-compose.production.yml logs -f backend

# Redémarrer les services
docker-compose -f docker-compose.production.yml restart

# Mise à jour de l'application
git pull origin main
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

## 🎯 Commandes de Déploiement Rapide

### **Script de Déploiement Automatique**
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Déploiement Luneo Backend sur Hetzner VPS..."

# Pull des dernières modifications
git pull origin main

# Build et redémarrage
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

# Tests de santé
sleep 10
curl -f https://api.luneo.app/health || echo "❌ Health check failed"

echo "✅ Déploiement terminé !"
```

## 🎉 Résultat Final

Après ce déploiement, vous aurez :

- ✅ **API Backend** : https://api.luneo.app
- ✅ **Webhooks SendGrid** : Fonctionnels
- ✅ **SSL/HTTPS** : Certificat Let's Encrypt
- ✅ **Monitoring** : Logs et santé
- ✅ **Scalabilité** : Docker + Nginx
- ✅ **Sécurité** : Firewall + HTTPS

**Votre backend Luneo sera en production sur votre VPS Hetzner !**
