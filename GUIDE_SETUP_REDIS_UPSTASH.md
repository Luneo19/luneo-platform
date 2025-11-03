# 🔴 GUIDE : Configuration Upstash Redis

**Durée estimée** : 15 minutes  
**Difficulté** : Facile  
**Impact** : +2 points (98/100 → 100/100)

---

## 🎯 OBJECTIF

Activer le **cache Redis** pour :
- ✅ Accélérer les requêtes API répétées
- ✅ Réduire la charge sur Supabase
- ✅ Améliorer le rate limiting
- ✅ Passer le health check à "healthy"

---

## 📋 ÉTAPE 1 : Créer un compte Upstash (5 min)

### 1. Aller sur Upstash
👉 **URL** : https://upstash.com/

### 2. S'inscrire / Se connecter
- Cliquer sur **"Get Started Free"**
- Utiliser votre email : `service.luneo@gmail.com`
- Ou connectez-vous avec GitHub/Google

### 3. Créer une database Redis
- Cliquer sur **"Create Database"**
- **Name** : `luneo-production`
- **Type** : **Global** (pour meilleure performance)
- **Region** : **Europe (Ireland)** (proche de vos users)
- **Eviction** : `allkeys-lru` (recommandé)
- Cliquer **"Create"**

### 4. Récupérer les credentials
Une fois créé, vous verrez :
- **UPSTASH_REDIS_REST_URL** : `https://xxxxx.upstash.io`
- **UPSTASH_REDIS_REST_TOKEN** : `AXXXxxxxxxxxxxxx`

📸 **Copiez ces 2 valeurs** (bouton "Copy" à côté de chaque)

---

## 📋 ÉTAPE 2 : Configurer Vercel (5 min)

### 1. Aller sur Vercel Dashboard
👉 **URL** : https://vercel.com/luneos-projects/frontend/settings/environment-variables

### 2. Ajouter les variables d'environnement

#### Variable 1 : UPSTASH_REDIS_REST_URL
- **Key** : `UPSTASH_REDIS_REST_URL`
- **Value** : `https://xxxxx.upstash.io` (votre URL Upstash)
- **Environment** : ✅ Production, ✅ Preview, ✅ Development
- Cliquer **"Add"**

#### Variable 2 : UPSTASH_REDIS_REST_TOKEN
- **Key** : `UPSTASH_REDIS_REST_TOKEN`
- **Value** : `AXXXxxxxxxxxxxxx` (votre token Upstash)
- **Environment** : ✅ Production, ✅ Preview, ✅ Development
- Cliquer **"Add"**

---

## 📋 ÉTAPE 3 : Redéployer (5 min)

### Option A : Via Cursor (automatique)
Je vais lancer le redéploiement pour vous une fois que vous m'aurez dit "c'est fait".

### Option B : Via Vercel Dashboard (manuel)
1. Aller sur https://vercel.com/luneos-projects/frontend
2. Cliquer sur **"Deployments"**
3. Cliquer sur le dernier déploiement
4. Cliquer **"Redeploy"**
5. Confirmer

---

## ✅ VÉRIFICATION

Après le redéploiement, testez :

```bash
curl https://app.luneo.app/api/health
```

Vous devriez voir :
```json
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "healthy",
      "latency_ms": 214
    },
    "redis": {
      "status": "healthy",  ← ✅ ÉTAIT "not_configured"
      "latency_ms": <50
    }
  }
}
```

---

## 🎯 RÉSULTAT

✅ **Redis configuré**  
✅ **Cache activé**  
✅ **Rate limiting amélioré**  
✅ **Health check: healthy**  
✅ **Score: 100/100** 🏆

---

## 📞 BESOIN D'AIDE ?

Si vous rencontrez un problème :
1. Vérifiez que les URLs/tokens sont corrects
2. Vérifiez que les variables sont bien dans "Production"
3. Attendez 2-3 minutes après redéploiement
4. Dites-moi et je vous aide !

---

**Allez créer votre compte Upstash et récupérez les credentials ! 🚀**

**Dites-moi "c'est fait" quand vous avez les 2 valeurs (URL + TOKEN) !**


