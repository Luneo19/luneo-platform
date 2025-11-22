# 🔑 INSTRUCTIONS - CREDENTIALS UPSTASH REDIS

**Identifiant fourni:** `e4fbfc42-3b87-4dbc-bfa0-dd598b924340`

---

## 📋 CE QUI EST NÉCESSAIRE

Pour configurer Upstash Redis, nous avons besoin de **2 credentials REST** :

1. **UPSTASH_REDIS_REST_URL** (ex: `https://xxx.upstash.io`)
2. **UPSTASH_REDIS_REST_TOKEN** (ex: `AXXXxxxxx`)

---

## 🎯 COMMENT LES OBTENIR

### **Méthode 1: Depuis le Dashboard Upstash**

1. **Aller sur:** https://console.upstash.com
2. **Se connecter** avec votre compte
3. **Sélectionner** votre database Redis (ou créer une nouvelle)
4. **Onglet "REST API"**
5. **Copier:**
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### **Méthode 2: Si vous avez déjà les credentials**

Si vous avez déjà les credentials REST, configurez-les directement:

```bash
node scripts/configure-redis-direct.js e4fbfc42-3b87-4dbc-bfa0-dd598b924340 "https://VOTRE_URL.upstash.io" "VOTRE_TOKEN"
```

---

## 🚀 CONFIGURATION RAPIDE

Une fois que vous avez les credentials REST:

```bash
# Option 1: Script interactif
node scripts/auto-setup-upstash.js
# Choisir Option 2, coller les credentials

# Option 2: Directement
echo 'UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"' >> apps/frontend/.env.local
echo 'UPSTASH_REDIS_REST_TOKEN="AXXXxxxxx"' >> apps/frontend/.env.local
```

---

## ✅ VÉRIFICATION

```bash
node scripts/check-services-config.js
```

---

**📝 Note:** L'identifiant fourni (`e4fbfc42-3b87-4dbc-bfa0-dd598b924340`) semble être un ID de database plutôt qu'un token API. Pour obtenir les credentials REST, vous devez accéder au dashboard Upstash.

