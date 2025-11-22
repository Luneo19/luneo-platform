# ✅ CONFIGURATION AUTOMATIQUE COMPLÈTE - UPSTASH REDIS

**Date:** Décembre 2024  
**Status:** Scripts créés ✅

---

## 🚀 MÉTHODE AUTOMATIQUE (Si vous avez un token API Upstash)

### **Étape 1: Obtenir un token API Upstash**

1. Aller sur: https://console.upstash.com
2. Se connecter ou créer un compte
3. Settings → API Keys → Create API Key
4. Copier le token

### **Étape 2: Exécuter le script automatique**

```bash
export UPSTASH_API_TOKEN="votre_token_api"
node scripts/create-upstash-database-auto.js
```

**Le script va:**
- ✅ Créer automatiquement la database Redis
- ✅ Récupérer les credentials REST
- ✅ Configurer automatiquement dans `.env.local`

---

## 📋 MÉTHODE MANUELLE (Recommandée si pas de token API)

### **Étape 1: Créer la database**

1. Aller sur: https://console.upstash.com
2. Créer un compte (gratuit)
3. Créer une database Redis:
   - Name: `luneo-production-redis`
   - Type: Regional
   - Region: Europe (Ireland)
   - Eviction: `allkeys-lru`

### **Étape 2: Récupérer les credentials**

Dans la page de la database:
- Onglet "REST API"
- Copier `UPSTASH_REDIS_REST_URL`
- Copier `UPSTASH_REDIS_REST_TOKEN`

### **Étape 3: Configurer**

```bash
node scripts/auto-setup-upstash.js
# Choisir Option 2 (manuelle)
# Coller l'URL et le Token
```

---

## ✅ VÉRIFICATION

```bash
node scripts/check-services-config.js
```

**Résultat attendu:**
```
✅ Upstash Redis
```

---

## 🎯 RÉSUMÉ

**Services configurés:**
- ✅ Cloudinary
- ✅ SendGrid
- ✅ Sentry
- ⚠️  Upstash Redis (à configurer)

**Pour configurer Upstash Redis:**
1. Créer la database sur https://console.upstash.com
2. Récupérer les credentials REST
3. Exécuter: `node scripts/auto-setup-upstash.js`

---

**Temps estimé:** 5 minutes

