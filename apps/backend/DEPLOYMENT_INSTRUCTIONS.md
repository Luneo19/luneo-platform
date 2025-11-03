# 🚀 INSTRUCTIONS DE DÉPLOIEMENT LUNEO BACKEND

## 📋 **SCRIPTS CRÉÉS**

J'ai créé **3 scripts** de déploiement pour votre projet Luneo :

### **1. Script Complet (Recommandé)**
- **Fichier** : `scripts/setup-hetzner-cloudflare.sh`
- **Usage** : Déploiement complet avec Cloudflare + SSL wildcard
- **Durée** : ~15 minutes

### **2. Script Rapide**
- **Fichier** : `scripts/quick-deploy.sh`
- **Usage** : Déploiement simplifié sans Cloudflare
- **Durée** : ~10 minutes

### **3. Scripts Existants**
- **Fichier** : `scripts/deploy-hetzner.sh` + `scripts/setup-hetzner-env.sh`
- **Usage** : Déploiement manuel étape par étape

## 🎯 **RECOMMANDATION : SCRIPT COMPLET**

Utilisez le **script complet** pour un déploiement production-ready :

## 📝 **ÉTAPES DE DÉPLOIEMENT**

### **Étape 1: Préparer le Script**

1. **Éditer le script** :
```bash
nano scripts/setup-hetzner-cloudflare.sh
```

2. **Personnaliser les variables** :
```bash
# ----------- VARIABLES À PERSONNALISER ----------
DOMAIN="luneo.app"                           # Votre domaine
EMAIL="admin@luneo.app"                      # Votre email
CLOUDFLARE_TOKEN="VOTRE_TOKEN_CLOUDFLARE"    # Token Cloudflare
POSTGRES_PASSWORD="VOTRE_MOT_DE_PASSE"       # Mot de passe sécurisé
DEPLOY_USER="deploy"                         # Utilisateur de déploiement
```

### **Étape 2: Obtenir le Token Cloudflare**

1. **Aller sur** [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. **Créer un token** avec permissions :
   - Zone:Zone:Read
   - Zone:DNS:Edit
3. **Copier le token** et l'ajouter dans le script

### **Étape 3: Créer le VPS Hetzner**

1. **Aller sur** [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. **Créer un serveur** :
   - **Type** : CX21 (2 vCPU, 4GB RAM, 40GB SSD)
   - **OS** : Ubuntu 22.04 LTS
   - **Localisation** : Europe (Frankfurt/Nuremberg)
   - **Backups** : Activés (recommandé)
3. **Noter l'IP publique** du serveur

### **Étape 4: Configurer DNS Cloudflare**

1. **Ajouter le domaine** `luneo.app` dans Cloudflare
2. **Créer les enregistrements DNS** :
   ```
   Type: A    Name: @      Value: IP_SERVEUR    Proxy: ON
   Type: A    Name: api    Value: IP_SERVEUR    Proxy: ON
   ```
3. **Vérifier** que les nameservers Cloudflare sont configurés chez votre registrar

### **Étape 5: Déployer sur le Serveur**

1. **Se connecter au serveur** :
```bash
ssh root@IP_SERVEUR
```

2. **Télécharger le script** :
```bash
# Option 1: Copier le contenu du script
nano setup.sh
# Coller le contenu de scripts/setup-hetzner-cloudflare.sh

# Option 2: Uploader le fichier
scp scripts/setup-hetzner-cloudflare.sh root@IP_SERVEUR:/root/setup.sh
```

3. **Rendre exécutable et lancer** :
```bash
chmod +x setup.sh
./setup.sh
```

### **Étape 6: Vérifier le Déploiement**

Le script va automatiquement :
- ✅ Mettre à jour le serveur
- ✅ Installer Docker, Nginx, Certbot
- ✅ Configurer le firewall
- ✅ Créer l'utilisateur `deploy`
- ✅ Générer le certificat SSL wildcard
- ✅ Configurer Nginx avec reverse proxy
- ✅ Lancer les services Docker

### **Étape 7: Configuration Finale**

1. **Éditer les variables d'environnement** :
```bash
ssh deploy@IP_SERVEUR
cd /home/deploy/luneo-backend
nano .env.production
```

2. **Configurer les services** :
   - **JWT Secrets** : Générer des clés sécurisées
   - **Stripe** : Ajouter les clés production
   - **Cloudinary** : Configurer le stockage
   - **Sentry** : Ajouter le DSN

3. **Redémarrer l'application** :
```bash
docker compose down
docker compose up -d
```

## 🧪 **TESTS DE VÉRIFICATION**

### **Test 1: Health Check**
```bash
curl https://api.luneo.app/health
```

### **Test 2: API Root**
```bash
curl https://api.luneo.app/api/v1
```

### **Test 3: Webhook SendGrid**
```bash
curl -X POST https://api.luneo.app/webhooks/sendgrid \
  -H "Content-Type: application/json" \
  -d '[{"event":"delivered","email":"test@example.com"}]'
```

### **Test 4: SSL Certificate**
```bash
curl -I https://api.luneo.app
# Doit retourner HTTP/2 200
```

## 🔄 **GESTION POST-DÉPLOIEMENT**

### **Logs**
```bash
cd /home/deploy/luneo-backend
docker compose logs -f backend
```

### **Redémarrage**
```bash
docker compose restart
```

### **Mise à jour**
```bash
git pull
docker compose build --no-cache
docker compose up -d
```

### **Backup**
```bash
# Backup base de données
docker compose exec postgres pg_dump -U luneo_user luneo_production > backup.sql

# Backup volumes
docker run --rm -v luneo-backend_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## 🆘 **DÉPANNAGE**

### **Problème de Connexion SSH**
```bash
# Vérifier la clé SSH
ssh-keygen -t ed25519 -C "votre@email.com"
ssh-copy-id root@IP_SERVEUR
```

### **Problème de Certificat SSL**
```bash
# Vérifier les certificats
certbot certificates

# Renouveler si nécessaire
certbot renew --dry-run
```

### **Problème de Docker**
```bash
# Vérifier les conteneurs
docker compose ps

# Voir les logs d'erreur
docker compose logs backend
```

### **Problème de Nginx**
```bash
# Tester la configuration
nginx -t

# Redémarrer Nginx
systemctl restart nginx
```

## 📊 **RÉSULTAT FINAL**

Après le déploiement, vous aurez :

- ✅ **API Backend** : https://api.luneo.app
- ✅ **Health Check** : https://api.luneo.app/health
- ✅ **Webhook SendGrid** : https://api.luneo.app/webhooks/sendgrid
- ✅ **SSL/HTTPS** : Certificat wildcard Let's Encrypt
- ✅ **Monitoring** : Logs et santé des services
- ✅ **Sécurité** : Firewall + HTTPS + Headers sécurisés
- ✅ **Scalabilité** : Docker + Nginx ready

## 🎉 **FÉLICITATIONS !**

Votre backend Luneo sera en production sur Hetzner VPS avec :
- Infrastructure cloud-ready
- Sécurité enterprise-grade
- Monitoring complet
- Scalabilité horizontale

**Prêt pour des milliers d'utilisateurs !** 🚀

