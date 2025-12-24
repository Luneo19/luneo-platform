# 🚀 GUIDE DE DÉPLOIEMENT PRODUCTION

## ⚠️ **AVANT DE DÉPLOYER EN PRODUCTION**

### 🔒 **1. SÉCURITÉ CRITIQUE**

#### Générer des clés JWT sécurisées :
```bash
# Générer des clés JWT sécurisées (64+ caractères)
openssl rand -base64 64
openssl rand -base64 64
```

#### Configurer les variables d'environnement :
```bash
# Copier le template production
cp .env.production .env

# Éditer avec vos vraies valeurs
nano .env
```

### 🗄️ **2. BASE DE DONNÉES PRODUCTION**

#### PostgreSQL requis :
- Base de données dédiée
- SSL activé
- Sauvegarde automatique
- Monitoring

#### Exemple de configuration :
```sql
CREATE DATABASE luneo_production;
CREATE USER luneo_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE luneo_production TO luneo_user;
```

### 🔄 **3. REDIS PRODUCTION**

#### Redis requis :
- Instance dédiée
- Persistence activée
- Monitoring
- Sauvegarde

### 🔑 **4. SERVICES EXTERNES**

#### Stripe (Paiements) :
- Compte production
- Webhooks configurés
- Clés live (pas test)

#### Cloudinary (Stockage) :
- Compte production
- Uploads signés
- CDN configuré

#### AI Providers :
- Clés API production
- Quotas configurés
- Monitoring des coûts

### 📧 **5. EMAIL PRODUCTION**

#### SMTP configuré :
- Serveur SMTP production
- Authentification
- SPF/DKIM configurés

### 📊 **6. MONITORING**

#### Sentry :
- Projet production
- Alertes configurées
- Performance monitoring

## 🚀 **DÉPLOIEMENT**

### Option 1 : Docker (Recommandé)

```bash
# Build l'image production
docker build -t luneo-backend:production .

# Déployer avec docker-compose
docker-compose -f docker-compose.production.yml up -d
```

### Option 2 : Déploiement direct

```bash
# Installer les dépendances
npm ci --only=production

# Build l'application
npm run build

# Démarrer en production
NODE_ENV=production npm run start:prod
```

### Option 3 : Cloud Platforms

#### Vercel :
```bash
vercel --prod
```

#### Railway :
```bash
railway up
```

#### Heroku :
```bash
heroku create
git push heroku main
```

## 🔍 **VÉRIFICATIONS POST-DÉPLOIEMENT**

### 1. Tests de santé :
```bash
curl https://your-domain.com/health
curl https://your-domain.com/api/v1/products
```

### 2. Tests d'authentification :
```bash
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@luneo.com","password":"admin123"}'
```

### 3. Tests de sécurité :
- Rate limiting actif
- CORS configuré
- Headers de sécurité
- SSL/TLS actif

## 📈 **MONITORING PRODUCTION**

### Métriques à surveiller :
- Temps de réponse API
- Taux d'erreur
- Utilisation CPU/Mémoire
- Connexions base de données
- Jobs BullMQ

### Alertes à configurer :
- Temps de réponse > 2s
- Taux d'erreur > 5%
- Espace disque < 20%
- Mémoire > 80%

## 🔄 **MAINTENANCE**

### Sauvegardes :
- Base de données quotidienne
- Logs rotation
- Monitoring des coûts

### Mises à jour :
- Dépendances mensuelles
- Sécurité critiques
- Tests complets avant déploiement

---

**⚠️ IMPORTANT : Ne jamais déployer en production sans avoir testé en staging !**
