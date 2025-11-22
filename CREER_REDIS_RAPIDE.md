# 🚀 CRÉER REDIS EN 2 MINUTES

## ⚡ Étapes rapides

### 1. Créer la Database (30 secondes)
1. Aller sur: **https://console.upstash.com/redis?teamid=0**
2. Cliquer sur **"+ Create Database"** (bouton vert en haut à droite)
3. Remplir:
   - **Name:** `luneo-production-redis`
   - **Type:** `Regional`
   - **Region:** `eu-west-1` (ou votre région préférée)
4. Cliquer **"Create"**

### 2. Récupérer les Credentials (30 secondes)
1. Une fois la database créée, vous êtes sur la page de détails
2. Cliquer sur l'onglet **"REST API"** (dans le menu horizontal)
3. Vous verrez 2 valeurs:
   - `UPSTASH_REDIS_REST_URL` (ex: `https://eu1-merry-crab-12345.upstash.io`)
   - `UPSTASH_REDIS_REST_TOKEN` (ex: `AXXXxxxxxxxxxxxx`)

### 3. Configurer (10 secondes)
Copiez les 2 valeurs et exécutez:

```bash
node scripts/configure-redis-final.js "https://VOTRE_URL.upstash.io" "VOTRE_TOKEN"
```

**C'est tout !** ✅

---

## 📋 Exemple complet

Si vous avez:
- URL: `https://eu1-merry-crab-12345.upstash.io`
- Token: `AXXXxxxxxxxxxxxx`

Exécutez:
```bash
node scripts/configure-redis-final.js "https://eu1-merry-crab-12345.upstash.io" "AXXXxxxxxxxxxxxx"
```

---

## ✅ Vérification

```bash
node scripts/check-services-config.js
```

Vous devriez voir:
```
✅ Upstash Redis
```

---

**Temps total: ~2 minutes** ⏱️

