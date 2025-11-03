# 🚀 Guide de Déploiement Complet Hetzner + Cloudflare

## 📋 Vue d'ensemble

Ce guide vous accompagne pour déployer votre backend Luneo sur un serveur Hetzner avec SSL automatique et configuration Cloudflare.

## 🎯 Objectifs

- ✅ Serveur Hetzner configuré et sécurisé
- ✅ SSL automatique avec Let's Encrypt
- ✅ Nginx comme reverse proxy
- ✅ Docker Compose pour l'application
- ✅ PostgreSQL et Redis
- ✅ Monitoring et sécurité
- ✅ Déploiement automatique

## 🔧 Prérequis

- [x] Serveur Hetzner VPS (IP: 116.203.31.129)
- [x] Accès SSH au serveur
- [x] Domaine configuré (luneo.com)
- [x] Token Cloudflare (optionnel pour SSL wildcard)
- [x] Code source Luneo prêt

## 📝 Étapes de Déploiement

### Étape 1 : Connexion Initiale

```bash
# Connexion SSH au serveur
ssh root@116.203.31.129
```

**Mot de passe requis** : Utilisez le mot de passe fourni par Hetzner lors de la création du VPS.

### Étape 2 : Configuration Automatique du Serveur

Une fois connecté en tant que root, exécutez le script de déploiement automatique :

```bash
# Télécharger et exécuter le script
curl -o /tmp/deploy.sh https://raw.githubusercontent.com/votre-repo/luneo-backend/main/backend/scripts/deploy-hetzner-complete.sh
chmod +x /tmp/deploy.sh
/tmp/deploy.sh
```

**OU** si vous avez déjà copié le script :

```bash
# Exécuter le script local
./scripts/deploy-hetzner-complete.sh
```

### Étape 3 : Copie du Code Source

Depuis votre machine locale, copiez le code source :

```bash
# Copier le code source vers le serveur
./scripts/copy-source-to-server.sh
```

### Étape 4 : Configuration DNS

Configurez votre DNS pour pointer vers le serveur :

```
Type: A
Name: luneo.com
Value: 116.203.31.129
TTL: Auto
```

```
Type: A
Name: api.luneo.com
Value: 116.203.31.129
TTL: Auto
```

### Étape 5 : Test et Vérification

```bash
# Test de l'API
curl https://luneo.com/api/v1/health

# Test des services Docker
ssh deploy@116.203.31.129 "cd /home/deploy/luneo-backend/backend && docker compose ps"

# Vérification des logs
ssh deploy@116.203.31.129 "cd /home/deploy/luneo-backend/backend && docker compose logs api"
```

## 🏗️ Architecture Déployée

```
Internet
    ↓
Cloudflare DNS
    ↓
Hetzner VPS (116.203.31.129)
    ↓
Nginx (Port 80/443)
    ↓
Docker Compose
    ├── luneo_api (Port 3000)
    ├── luneo_db (PostgreSQL)
    └── luneo_redis (Redis)
```

## 📁 Structure des Fichiers

```
/home/deploy/luneo-backend/
├── backend/
│   ├── src/                    # Code source
│   ├── package.json           # Dépendances
│   ├── docker-compose.yml     # Services Docker
│   ├── .env                   # Variables d'environnement
│   └── scripts/               # Scripts de déploiement
└── logs/                      # Logs des applications
```

## 🔐 Configuration de Sécurité

### Firewall (UFW)
- ✅ SSH (Port 22)
- ✅ HTTP (Port 80)
- ✅ HTTPS (Port 443)
- ❌ Tous les autres ports bloqués

### Fail2ban
- ✅ Protection contre les attaques par force brute
- ✅ Configuration automatique

### SSL/TLS
- ✅ Certificats Let's Encrypt
- ✅ Redirection HTTP → HTTPS
- ✅ Configuration SSL moderne

## 🐳 Services Docker

### API Backend
```yaml
container_name: luneo_api
image: node:20-alpine
ports: ["3000:3000"]
environment:
  - NODE_ENV=production
  - DATABASE_URL=postgresql://luneo_user:password@db:5432/luneo_production
```

### Base de Données
```yaml
container_name: luneo_db
image: postgres:15-alpine
environment:
  - POSTGRES_USER=luneo_user
  - POSTGRES_PASSWORD=Luneo2024Secure!
  - POSTGRES_DB=luneo_production
```

### Cache Redis
```yaml
container_name: luneo_redis
image: redis:7-alpine
command: redis-server --requirepass Luneo2024Secure!
```

## 📊 Monitoring

### Watchtower
- ✅ Mises à jour automatiques des containers
- ✅ Nettoyage des images inutilisées

### Logs
```bash
# Logs de l'API
docker compose logs -f api

# Logs de la base de données
docker compose logs -f db

# Logs Redis
docker compose logs -f redis

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Commandes de Gestion

### Redémarrage des Services
```bash
cd /home/deploy/luneo-backend/backend
docker compose restart
```

### Arrêt des Services
```bash
cd /home/deploy/luneo-backend/backend
docker compose down
```

### Démarrage des Services
```bash
cd /home/deploy/luneo-backend/backend
docker compose up -d
```

### Mise à Jour du Code
```bash
# Depuis votre machine locale
./scripts/copy-source-to-server.sh
```

## 🚨 Dépannage

### API Non Accessible
```bash
# Vérifier les containers
docker compose ps

# Vérifier les logs
docker compose logs api

# Vérifier Nginx
sudo systemctl status nginx
sudo nginx -t
```

### Problème SSL
```bash
# Renouveler le certificat
sudo certbot renew --dry-run

# Vérifier les certificats
sudo certbot certificates
```

### Problème de Base de Données
```bash
# Vérifier la connexion
docker compose exec db psql -U luneo_user -d luneo_production

# Vérifier les logs
docker compose logs db
```

## 📈 Optimisations

### Performance
- ✅ Nginx avec compression gzip
- ✅ Cache Redis pour les sessions
- ✅ Pool de connexions PostgreSQL
- ✅ Headers de sécurité

### Sécurité
- ✅ SSL/TLS moderne
- ✅ Fail2ban actif
- ✅ Firewall configuré
- ✅ Utilisateur non-root (deploy)

## 🔗 URLs de Test

- **API Health**: https://luneo.com/api/v1/health
- **API Root**: https://luneo.com/api/v1
- **SendGrid Webhook**: https://luneo.com/webhooks/sendgrid
- **Documentation**: https://luneo.com/api/docs

## ✅ Checklist de Validation

- [ ] Serveur Hetzner accessible via SSH
- [ ] Script de déploiement exécuté avec succès
- [ ] Code source copié sur le serveur
- [ ] DNS configuré et propagé
- [ ] SSL fonctionnel (https://luneo.com)
- [ ] API accessible (https://luneo.com/api/v1/health)
- [ ] Base de données connectée
- [ ] Redis fonctionnel
- [ ] SendGrid configuré
- [ ] Monitoring actif
- [ ] Logs accessibles

## 🎉 Félicitations !

Votre backend Luneo est maintenant déployé en production sur Hetzner avec :

- ✅ Infrastructure sécurisée et scalable
- ✅ SSL automatique avec Let's Encrypt
- ✅ Monitoring et logs
- ✅ Déploiement automatisé
- ✅ Configuration optimisée pour la production

**Votre API est maintenant accessible à l'adresse : https://luneo.com/api/v1**

