# 🚀 GUIDE CONFIGURATION AUTOMATIQUE UPSTASH REDIS

**Date:** Décembre 2024  
**Objectif:** Configurer Upstash Redis automatiquement

---

## ⚡ MÉTHODE RAPIDE (Recommandée)

### **Option 1: Script Automatique**

```bash
node scripts/auto-setup-upstash.js
```

**Le script vous guidera pour:**
1. Créer la database automatiquement (si vous avez un token API)
2. Ou configurer manuellement avec les credentials

---

## 📋 MÉTHODE MANUELLE (Étape par étape)

### **Étape 1: Créer un compte Upstash**

1. Aller sur: https://console.upstash.com
2. Créer un compte (gratuit disponible)
3. Se connecter

### **Étape 2: Créer une database Redis**

1. Cliquer sur **"Create Database"**
2. Configuration:
   - **Name:** `luneo-production-redis`
   - **Type:** Regional (ou Global)
   - **Region:** Europe (Ireland) ou Europe (Frankfurt)
   - **Eviction:** `allkeys-lru`
3. Cliquer **"Create"**

### **Étape 3: Récupérer les credentials**

1. Dans la page de la database créée
2. Onglet **"REST API"**
3. Copier:
   - `UPSTASH_REDIS_REST_URL` (ex: `https://xxx.upstash.io`)
   - `UPSTASH_REDIS_REST_TOKEN` (ex: `AXXXxxxxx`)

### **Étape 4: Configurer localement**

```bash
# Méthode 1: Via script interactif
./scripts/configure-upstash-redis.sh

# Méthode 2: Manuellement
echo 'UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"' >> apps/frontend/.env.local
echo 'UPSTASH_REDIS_REST_TOKEN="AXXXxxxxx"' >> apps/frontend/.env.local
```

### **Étape 5: Configurer sur Vercel**

1. Aller sur: https://vercel.com/luneos-projects/frontend/settings/environment-variables
2. Ajouter:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Sélectionner: Production, Preview, Development
4. Redéployer

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

## 🎯 CONFIGURATION AUTOMATIQUE VIA API

Si vous avez un token API Upstash:

```bash
# Le script créera automatiquement la database
UPSTASH_API_TOKEN="votre_token" node scripts/auto-setup-upstash.js
```

**Pour obtenir un token API:**
1. Aller sur https://console.upstash.com
2. Settings → API Keys → Create API Key
3. Copier le token

---

## 📊 RÉSULTAT ATTENDU

Après configuration:
- ✅ Rate limiting fonctionnel
- ✅ Caching Redis activé
- ✅ Performance améliorée
- ✅ Score: 100/100

---

**Temps estimé:** 5-10 minutes

