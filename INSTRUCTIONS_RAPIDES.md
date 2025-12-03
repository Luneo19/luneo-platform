# ⚡ Instructions Rapides - Configuration depuis vos Consoles

## 🎯 Vous avez les liens de vos consoles? Parfait!

J'ai créé un script qui vous guide étape par étape pour copier les credentials depuis vos consoles.

---

## 🚀 Exécuter le Script

```bash
./scripts/configure-from-consoles.sh
```

Le script vous demandera de copier les informations depuis:

### 1. **Neon** (Base de données)
- Lien: https://console.neon.tech/app/projects/late-fog-69955127
- Action: Cliquez sur **"Connect"** ou **"Connection string"**
- Sélectionnez la branche **"production"**
- Copiez la connection string complète

### 2. **Upstash** (Redis)
- Lien: https://console.upstash.com/redis/f5689418-2571-465c-bb57-bf594f290899
- Action: Section **"Connection details"**
- Copiez:
  - **Redis URL** (format: `redis://default:token@endpoint:6379`)
  - **REST URL** (format: `https://endpoint.upstash.io`)
  - **REST Token**

### 3. **Cloudinary** (Stockage)
- Lien: https://console.cloudinary.com/app/c-8af446674d728b78cb0129e8f860a0/home/dashboard
- Action: Cliquez sur **"Go to API Keys"**
- Copiez:
  - **Cloud Name** (devrait être: `deh4aokbx`)
  - **API Key**
  - **API Secret**

---

## ✅ Après Configuration

Le script créera automatiquement:
- `apps/backend/.env.local`
- `apps/frontend/.env.local`

Ensuite, testez:

```bash
cd apps/backend
npx prisma db push
```

Si ça fonctionne → ✅ **Configuration réussie!**

---

## 🎉 Résultat

- ✅ Base de données: **Gratuit** (Neon)
- ✅ Cache: **Gratuit** (Upstash)
- ✅ Stockage: **Gratuit** (Cloudinary)
- ✅ **Aucun coût AWS!**

**Économie: $1200/mois → $0/mois** 🎉

---

**Prêt? Exécutez le script maintenant!**

```bash
./scripts/configure-from-consoles.sh
```

