# 🚀 **LUNEO SHOPIFY APP - GUIDE DE DÉPLOIEMENT**

## 📋 **PRÉREQUIS**

### **1. Compte Shopify Partner**
- Créer un compte sur [partners.shopify.com](https://partners.shopify.com)
- Créer une nouvelle application
- Obtenir les clés API

### **2. Environnement de développement**
- Node.js 20+
- PostgreSQL
- Redis
- Compte Vercel
- Domaine SSL

---

## 🔧 **CONFIGURATION RAPIDE**

### **Étape 1 : Variables d'environnement**
```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer les variables
nano .env
```

### **Étape 2 : Configuration Shopify**
1. **Partner Dashboard** → **Apps** → **Create app**
2. **App URL** : `https://your-domain.com`
3. **Allowed redirection URL(s)** : `https://your-domain.com/auth/callback`
4. **Webhook endpoint URL** : `https://your-domain.com/api/v1/webhooks`

### **Étape 3 : Installation**
```bash
# Installer les dépendances
npm install

# Démarrer en développement
npm run dev

# Build pour production
npm run build
```

---

## 🚀 **DÉPLOIEMENT**

### **Option 1 : Vercel (Recommandé)**
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod

# Configurer les variables d'environnement
vercel env add SHOPIFY_API_KEY
vercel env add SHOPIFY_API_SECRET
# ... autres variables
```

### **Option 2 : Docker**
```bash
# Build l'image
docker build -t luneo-shopify-app .

# Lancer le container
docker run -p 3001:3001 --env-file .env luneo-shopify-app
```

### **Option 3 : Serveur dédié**
```bash
# Build
npm run build

# Démarrer en production
npm run start:prod
```

---

## 🧪 **TESTS**

### **Test d'installation**
1. Aller sur `https://your-app.com/auth/install?shop=your-test-shop.myshopify.com`
2. Autoriser l'application
3. Vérifier la redirection vers `/app`

### **Test des webhooks**
1. Créer/modifier un produit dans Shopify
2. Vérifier les logs de l'application
3. Confirmer la synchronisation

### **Test App Bridge**
1. Ouvrir l'application dans l'admin Shopify
2. Tester la navigation
3. Vérifier les modals et toasts

---

## 📊 **MONITORING**

### **Logs**
```bash
# Logs en temps réel
npm run logs

# Logs de production
pm2 logs luneo-shopify-app
```

### **Métriques**
- **Uptime** : > 99.9%
- **Performance** : < 2s temps de réponse
- **Erreurs** : < 0.1% taux d'erreur

### **Alertes**
- Webhooks en échec
- Erreurs d'authentification
- Performance dégradée

---

## 🔒 **SÉCURITÉ**

### **Validation HMAC**
- Tous les webhooks sont validés
- Tokens d'accès sécurisés
- Sessions chiffrées

### **Rate Limiting**
- 100 requêtes/15 minutes par IP
- Protection contre les abus
- Blacklist automatique

### **Audit**
- Logs de toutes les actions
- Traçabilité complète
- Conformité RGPD

---

## 🆘 **DÉPANNAGE**

### **Erreurs courantes**

#### **"Invalid HMAC"**
```bash
# Vérifier le webhook secret
echo $SHOPIFY_WEBHOOK_SECRET

# Vérifier la configuration Shopify
# Partner Dashboard → Webhooks → Secret
```

#### **"Access token expired"**
```bash
# Rafraîchir le token
curl -X POST https://your-app.com/api/v1/auth/refresh \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com"
```

#### **"Webhook not received"**
```bash
# Vérifier l'URL du webhook
# Shopify Admin → Settings → Notifications → Webhooks

# Tester manuellement
curl -X POST https://your-app.com/api/v1/webhooks/test \
  -H "X-Shopify-Topic: app/uninstalled"
```

### **Support**
- **Documentation** : [docs.luneo.app](https://docs.luneo.app)
- **Email** : support@luneo.app
- **Chat** : [luneo.app/support](https://luneo.app/support)

---

## 📈 **OPTIMISATION**

### **Performance**
- Cache Redis optimisé
- CDN pour les assets
- Lazy loading des composants

### **Scalabilité**
- Load balancing
- Auto-scaling
- Database sharding

### **Coûts**
- Optimisation des appels API
- Compression des données
- Monitoring des quotas

---

## 🎯 **ROADMAP**

### **Version 1.1**
- [ ] Support WooCommerce
- [ ] Analytics avancées
- [ ] Templates personnalisés

### **Version 1.2**
- [ ] API publique
- [ ] Marketplace
- [ ] Intégrations tierces

### **Version 2.0**
- [ ] IA générative avancée
- [ ] AR/VR complet
- [ ] Blockchain integration

---

## 📞 **CONTACT**

- **Développeur** : [emmanuel@luneo.app](mailto:emmanuel@luneo.app)
- **Support** : [support@luneo.app](mailto:support@luneo.app)
- **Business** : [business@luneo.app](mailto:business@luneo.app)

---

**🚀 LUNEO SHOPIFY APP - PRÊT POUR LA PRODUCTION !**



