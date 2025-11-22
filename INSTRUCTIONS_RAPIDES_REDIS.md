# ⚡ INSTRUCTIONS RAPIDES - CONFIGURER UPSTASH REDIS

**Temps:** 2 minutes

---

## 🚀 MÉTHODE LA PLUS RAPIDE

### **Exécuter ce script:**

```bash
./scripts/setup-upstash-complete.sh
```

**Le script va:**
1. ✅ Ouvrir Upstash dans votre navigateur
2. ✅ Vous guider étape par étape
3. ✅ Vous demander les credentials
4. ✅ Configurer automatiquement

---

## 📋 ÉTAPES MANUELLES (Si préféré)

### **1. Créer la database**

👉 **Ouvrir:** https://console.upstash.com

**Actions:**
- Créer un compte (gratuit) ou se connecter
- Cliquer **"Create Database"**
- **Name:** `luneo-production-redis`
- **Type:** Regional
- **Region:** Europe (Ireland)
- **Eviction:** `allkeys-lru`
- Cliquer **"Create"**

### **2. Copier les credentials**

Dans la page de la database:
- Onglet **"REST API"**
- Copier **"UPSTASH_REDIS_REST_URL"**
- Copier **"UPSTASH_REDIS_REST_TOKEN"**

### **3. Configurer**

```bash
echo 'UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"' >> apps/frontend/.env.local
echo 'UPSTASH_REDIS_REST_TOKEN="AXXXxxxxx"' >> apps/frontend/.env.local
```

### **4. Vérifier**

```bash
node scripts/check-services-config.js
```

---

## ✅ RÉSULTAT

Après configuration:
- ✅ **Score: 100/100**
- ✅ Rate limiting fonctionnel
- ✅ Caching Redis activé

---

**📝 Note:** Le compte Upstash gratuit offre 10,000 requêtes/jour.

