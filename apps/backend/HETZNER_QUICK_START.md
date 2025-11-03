# 🚀 Déploiement Rapide Hetzner VPS - Luneo Backend

## 🎯 Déploiement en 3 Étapes

### **Étape 1: Préparer le VPS Hetzner**

1. **Créer un VPS Hetzner**
   - Type: CX21 (2 vCPU, 4GB RAM, 40GB SSD)
   - OS: Ubuntu 22.04 LTS
   - Localisation: Europe (Frankfurt/Nuremberg)

2. **Configurer SSH**
   ```bash
   # Ajouter votre clé SSH publique
   ssh-copy-id root@VOTRE_IP_SERVEUR
   
   # Tester la connexion
   ssh root@VOTRE_IP_SERVEUR
   ```

### **Étape 2: Déploiement Automatique**

```bash
# Dans le répertoire backend
cd /Users/emmanuelabougadous/saas-backend/backend

# Déploiement automatique
./scripts/deploy-hetzner.sh VOTRE_IP_SERVEUR
```

**Ce script fait automatiquement :**
- ✅ Installation des dépendances (Node.js, Docker, Nginx)
- ✅ Configuration du firewall
- ✅ Upload des fichiers
- ✅ Build de l'application
- ✅ Démarrage des services Docker
- ✅ Configuration Nginx
- ✅ Configuration SSL avec Let's Encrypt
- ✅ Tests de déploiement

### **Étape 3: Configuration des Variables**

```bash
# Configuration interactive des variables d'environnement
./scripts/setup-hetzner-env.sh VOTRE_IP_SERVEUR
```

**Variables à configurer :**
- 🔐 Mot de passe PostgreSQL
- 🔐 Mot de passe Redis  
- 🔐 JWT Secrets
- 📊 Sentry DSN (optionnel)

## 🌐 Résultat Final

Après le déploiement, vous aurez :

- ✅ **API Backend** : `https://api.luneo.app`
- ✅ **Health Check** : `https://api.luneo.app/health`
- ✅ **Webhook SendGrid** : `https://api.luneo.app/webhooks/sendgrid`
- ✅ **SSL/HTTPS** : Certificat Let's Encrypt automatique
- ✅ **Monitoring** : Logs et santé des services
- ✅ **Sécurité** : Firewall configuré

## 🔄 Déploiements Futurs

Pour les mises à jour futures :

```bash
# Connexion au serveur
ssh root@VOTRE_IP_SERVEUR

# Déploiement rapide
/opt/luneo/deploy.sh
```

## 📋 Configuration SendGrid

Après le déploiement, mettez à jour le webhook SendGrid :

1. Aller sur [SendGrid Dashboard](https://app.sendgrid.com/)
2. Settings > Mail Settings > Event Webhook
3. Modifier l'URL : `https://api.luneo.app/webhooks/sendgrid`
4. Activer les événements :
   - ✅ delivered
   - ✅ bounce
   - ✅ dropped
   - ✅ spam_report
   - ✅ unsubscribe

## 🧪 Tests

```bash
# Test de santé
curl https://api.luneo.app/health

# Test webhook
curl -X POST https://api.luneo.app/webhooks/sendgrid \
  -H "Content-Type: application/json" \
  -d '[{"event":"delivered","email":"test@example.com"}]'
```

## 🆘 Support

En cas de problème :

1. **Vérifier les logs** :
   ```bash
   ssh root@VOTRE_IP_SERVEUR
   cd /opt/luneo/luneo-enterprise/backend
   docker-compose -f docker-compose.production.yml logs
   ```

2. **Redémarrer les services** :
   ```bash
   docker-compose -f docker-compose.production.yml restart
   ```

3. **Vérifier la configuration** :
   ```bash
   nginx -t
   systemctl status nginx
   ```

**🎉 Votre backend Luneo sera en production sur Hetzner VPS !**
