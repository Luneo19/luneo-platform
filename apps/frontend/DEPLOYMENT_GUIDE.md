# 🚀 Guide de Déploiement - Luneo Enterprise Frontend

## 📋 Vue d'ensemble

Ce guide vous accompagne dans le déploiement du frontend Luneo Enterprise selon vos spécifications techniques premium.

## 🎯 Options de Déploiement

### Option 1: Cloud Simple (Recommandé pour commencer)

**Architecture :**
- **Frontend** → Vercel (gratuit)
- **Backend** → Railway/Render (gratuit)
- **Database** → Supabase (gratuit)
- **Redis** → Upstash (gratuit)

**Avantages :**
- ✅ Gratuit pour commencer
- ✅ Configuration automatique
- ✅ SSL/HTTPS automatique
- ✅ Scaling automatique
- ✅ Pas de gestion serveur

**Coût :** 0-50€/mois

---

### Option 2: Serveur Dédié (Hetzner)

**Architecture :**
- **Frontend + Backend + Database** → Serveur Hetzner
- **Reverse Proxy** → Nginx
- **SSL** → Certbot
- **Monitoring** → Prometheus

**Avantages :**
- ✅ Contrôle total
- ✅ Coût prévisible
- ✅ Performance optimale
- ✅ Pas de limites de trafic

**Coût :** 12-50€/mois

---

### Option 3: Mixte (Recommandé pour la production)

**Architecture :**
- **Frontend** → Vercel
- **Backend + Database** → Hetzner
- **CDN** → Cloudflare

**Avantages :**
- ✅ Performance optimale
- ✅ Simplicité de déploiement
- ✅ Scaling automatique frontend
- ✅ Contrôle backend

**Coût :** 12-50€/mois

---

## 🚀 Déploiement Cloud Simple (Option 1)

### Étape 1: Frontend sur Vercel

1. **Connecter GitHub à Vercel**
   ```bash
   # Push le code vers GitHub
   git add .
   git commit -m "feat: initial frontend setup"
   git push origin main
   ```

2. **Configurer Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Connecter votre repository GitHub
   - Configurer les variables d'environnement :

   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
   NEXT_PUBLIC_APP_URL=https://your-frontend-url.vercel.app
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=https://your-frontend-url.vercel.app
   ```

3. **Déployer**
   - Vercel déploie automatiquement
   - Domaine : `https://your-project.vercel.app`

### Étape 2: Backend sur Railway

1. **Connecter GitHub à Railway**
   - Aller sur [railway.app](https://railway.app)
   - Connecter votre repository backend
   - Configurer les variables d'environnement

2. **Variables d'environnement Backend**
   ```env
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=postgresql://user:pass@host:5432/db
   REDIS_URL=redis://host:6379
   JWT_SECRET=your-jwt-secret
   ```

### Étape 3: Database sur Supabase

1. **Créer un projet Supabase**
   - Aller sur [supabase.com](https://supabase.com)
   - Créer un nouveau projet
   - Noter l'URL et la clé API

2. **Configurer la base de données**
   ```bash
   # Dans votre backend
   npx prisma migrate deploy
   npx prisma generate
   ```

### Étape 4: Redis sur Upstash

1. **Créer une base Redis**
   - Aller sur [upstash.com](https://upstash.com)
   - Créer une nouvelle base Redis
   - Noter l'URL de connexion

---

## 🖥️ Déploiement Serveur Dédié (Option 2)

### Configuration Serveur Hetzner

**Spécifications recommandées :**
- **CPU :** 2 vCPU
- **RAM :** 4GB
- **Storage :** 40GB SSD
- **OS :** Ubuntu 22.04 LTS
- **Coût :** ~12€/mois

### Installation et Configuration

1. **Connexion au serveur**
   ```bash
   ssh root@your-server-ip
   ```

2. **Mise à jour du système**
   ```bash
   apt update && apt upgrade -y
   ```

3. **Installation de Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   usermod -aG docker $USER
   ```

4. **Installation de Docker Compose**
   ```bash
   curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   chmod +x /usr/local/bin/docker-compose
   ```

5. **Configuration du firewall**
   ```bash
   ufw allow ssh
   ufw allow 80
   ufw allow 443
   ufw --force enable
   ```

### Docker Compose Production

Créer `docker-compose.production.yml` :

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.production
    ports:
      - "80:3000"
      - "443:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.luneo.app/api
      - NEXT_PUBLIC_APP_URL=https://app.luneo.app
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.production
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://luneo:password@db:5432/luneo_prod
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-production-jwt-secret
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=luneo_prod
      - POSTGRES_USER=luneo
      - POSTGRES_PASSWORD=secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Configuration Nginx

Créer `nginx.conf` :

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }
    
    upstream backend {
        server backend:3001;
    }

    server {
        listen 80;
        server_name app.luneo.app;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name app.luneo.app;

        ssl_certificate /etc/ssl/certs/cert.pem;
        ssl_certificate_key /etc/ssl/certs/key.pem;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    server {
        listen 80;
        server_name api.luneo.app;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.luneo.app;

        ssl_certificate /etc/ssl/certs/cert.pem;
        ssl_certificate_key /etc/ssl/certs/key.pem;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### SSL avec Certbot

```bash
# Installation de Certbot
apt install certbot python3-certbot-nginx -y

# Génération des certificats SSL
certbot --nginx -d app.luneo.app -d api.luneo.app

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### Déploiement

```bash
# Cloner le repository
git clone https://github.com/your-username/luneo-backend.git
cd luneo-backend

# Démarrer les services
docker-compose -f docker-compose.production.yml up -d

# Vérifier les logs
docker-compose -f docker-compose.production.yml logs -f
```

---

## 🌐 Configuration DNS

### Cloudflare (Recommandé)

1. **Ajouter votre domaine**
   - Aller sur [cloudflare.com](https://cloudflare.com)
   - Ajouter votre domaine `luneo.app`

2. **Configuration DNS**
   ```
   Type    Name    Content                    TTL
   A       @       your-server-ip             Auto
   A       app     your-server-ip             Auto
   A       api     your-server-ip             Auto
   CNAME   www     app.luneo.app              Auto
   ```

3. **Configuration SSL**
   - SSL/TLS → Full (strict)
   - Always Use HTTPS → On

---

## 🔧 Variables d'Environnement

### Frontend (Production)

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.luneo.app/api
NEXT_PUBLIC_APP_URL=https://app.luneo.app

# Authentication
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://app.luneo.app

# Cloudinary (optionnel)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHAT=true
```

### Backend (Production)

```env
# Server
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis
REDIS_URL=redis://host:6379

# Authentication
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# AI Services
OPENAI_API_KEY=your-openai-api-key

# File Upload
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

---

## 📊 Monitoring et Logs

### Logs Docker

```bash
# Voir les logs de tous les services
docker-compose -f docker-compose.production.yml logs -f

# Logs d'un service spécifique
docker-compose -f docker-compose.production.yml logs -f frontend

# Logs avec timestamps
docker-compose -f docker-compose.production.yml logs -f -t
```

### Monitoring des Ressources

```bash
# Installation de htop
apt install htop -y

# Monitoring en temps réel
htop

# Espace disque
df -h

# Mémoire
free -h
```

### Sauvegarde de la Base de Données

```bash
# Script de sauvegarde quotidienne
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec db pg_dump -U luneo luneo_prod > backup_$DATE.sql
gzip backup_$DATE.sql
aws s3 cp backup_$DATE.sql.gz s3://your-backup-bucket/
```

---

## 🔄 CI/CD avec GitHub Actions

### Workflow de Déploiement

Créer `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /root/luneo-backend
          git pull origin main
          docker-compose -f docker-compose.production.yml down
          docker-compose -f docker-compose.production.yml build --no-cache
          docker-compose -f docker-compose.production.yml up -d
          docker system prune -f
```

### Secrets GitHub

Configurer dans GitHub → Settings → Secrets :

- `HOST` : IP de votre serveur
- `USERNAME` : Utilisateur SSH
- `SSH_KEY` : Clé privée SSH

---

## 🚨 Dépannage

### Problèmes Courants

1. **Port déjà utilisé**
   ```bash
   # Vérifier les ports utilisés
   netstat -tulpn | grep :80
   
   # Tuer le processus
   kill -9 PID
   ```

2. **Problème de permissions Docker**
   ```bash
   # Ajouter l'utilisateur au groupe docker
   usermod -aG docker $USER
   newgrp docker
   ```

3. **SSL ne fonctionne pas**
   ```bash
   # Vérifier la configuration nginx
   nginx -t
   
   # Recharger nginx
   systemctl reload nginx
   ```

4. **Base de données inaccessible**
   ```bash
   # Vérifier les logs de la DB
   docker-compose logs db
   
   # Tester la connexion
   docker exec -it db psql -U luneo -d luneo_prod
   ```

### Commandes de Maintenance

```bash
# Redémarrer tous les services
docker-compose -f docker-compose.production.yml restart

# Mettre à jour les images
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# Nettoyer les images inutilisées
docker system prune -f

# Voir l'utilisation des ressources
docker stats
```

---

## ✅ Checklist de Déploiement

### Pré-déploiement

- [ ] Variables d'environnement configurées
- [ ] SSL configuré
- [ ] DNS pointé vers le serveur
- [ ] Base de données migrée
- [ ] Tests passent en local

### Déploiement

- [ ] Code poussé sur la branche main
- [ ] Services démarrés
- [ ] Logs vérifiés
- [ ] Health checks passent
- [ ] SSL fonctionne

### Post-déploiement

- [ ] Site accessible
- [ ] API fonctionne
- [ ] Authentication opérationnelle
- [ ] Base de données accessible
- [ ] Monitoring configuré
- [ ] Sauvegardes programmées

---

## 🎯 Prochaines Étapes

1. **Phase 2** : Pages & routes (Auth, Dashboard)
2. **Phase 3** : Features (Products CRUD, AI Studio, Billing)
3. **Phase 4** : QA & polish (Tests, Accessibility, Performance)
4. **Phase 5** : Deploy (CI/CD, Vercel, Monitoring)

---

**Votre frontend premium est prêt pour la production !** 🚀

Choisissez l'option de déploiement qui correspond le mieux à vos besoins et suivez le guide étape par étape.

