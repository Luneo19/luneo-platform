# ⚙️ Guide de Configuration - Services Gratuits

## ✅ Configuration Effectuée

Les fichiers de configuration ont été créés avec les alternatives gratuites.

---

## 📋 Fichiers Créés

1. **`apps/backend/.env.local.example`** - Template pour le backend
2. **`apps/frontend/.env.local.example`** - Template pour le frontend

---

## 🚀 Étapes de Configuration

### 1. Créer les Fichiers `.env.local`

```bash
# Backend
cd apps/backend
cp .env.local.example .env.local

# Frontend
cd apps/frontend
cp .env.local.example .env.local
```

### 2. Remplir les Variables d'Environnement

#### A. Base de Données - Neon

1. Aller sur https://neon.tech
2. Ouvrir votre projet
3. Copier la **connection string**
4. Mettre à jour dans `apps/backend/.env.local`:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.region.neon.tech/neondb?sslmode=require"
```

#### B. Redis - Upstash

1. Aller sur https://upstash.com
2. Ouvrir votre base Redis
3. Copier la **connection string** (format Redis)
4. Mettre à jour dans `apps/backend/.env.local`:

```env
REDIS_URL="redis://default:password@region.upstash.io:6379"
```

5. Pour le frontend, copier aussi les **REST credentials**:
   - REST URL
   - REST Token
6. Mettre à jour dans `apps/frontend/.env.local`:

```env
UPSTASH_REDIS_REST_URL="https://region.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_token_here"
```

#### C. Cloudinary

1. Aller sur https://cloudinary.com
2. Ouvrir le Dashboard
3. Copier les credentials:
   - Cloud Name
   - API Key
   - API Secret
4. Mettre à jour dans `apps/backend/.env.local`:

```env
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

5. Mettre à jour dans `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

#### D. JWT Secrets

Générez des secrets sécurisés (minimum 32 caractères):

```bash
# Générer des secrets aléatoires
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Mettre à jour dans `apps/backend/.env.local`:

```env
JWT_SECRET="votre_secret_genere_ici"
JWT_REFRESH_SECRET="votre_refresh_secret_genere_ici"
```

---

## ✅ Vérification

### 1. Tester la Base de Données

```bash
cd apps/backend
npx prisma db push
```

Si ça fonctionne → ✅ Base de données configurée!

### 2. Tester Redis

```bash
# Tester Redis
node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping().then(() => {
  console.log('✅ Redis connecté!');
  process.exit(0);
}).catch(e => {
  console.error('❌ Erreur Redis:', e.message);
  process.exit(1);
});
"
```

### 3. Tester Cloudinary

```bash
# Tester Cloudinary
node -e "
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
cloudinary.api.ping((err, res) => {
  if (err) {
    console.error('❌ Erreur Cloudinary:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Cloudinary connecté!');
    process.exit(0);
  }
});
"
```

### 4. Démarrer l'Application

```bash
# Backend
cd apps/backend
npm run start:dev

# Frontend (dans un autre terminal)
cd apps/frontend
npm run dev
```

---

## 🔒 Sécurité

### ⚠️ IMPORTANT

1. **Ne jamais commiter `.env.local`** dans Git
2. **Vérifier que `.env.local` est dans `.gitignore`**
3. **Utiliser des secrets différents** pour production
4. **Ne jamais exposer les secrets** dans le code frontend

### Vérifier `.gitignore`

```bash
# Vérifier que .env.local est ignoré
cat .gitignore | grep -E "\.env"
```

Si `.env.local` n'est pas dans `.gitignore`, ajoutez-le:

```bash
echo ".env.local" >> .gitignore
```

---

## 📝 Checklist de Configuration

- [ ] Fichier `apps/backend/.env.local` créé
- [ ] Fichier `apps/frontend/.env.local` créé
- [ ] `DATABASE_URL` configuré (Neon)
- [ ] `REDIS_URL` configuré (Upstash)
- [ ] `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` configurés (frontend)
- [ ] `CLOUDINARY_*` configuré (backend et frontend)
- [ ] `JWT_SECRET` et `JWT_REFRESH_SECRET` générés et configurés
- [ ] Base de données testée (`npx prisma db push`)
- [ ] Redis testé
- [ ] Cloudinary testé
- [ ] Application démarre sans erreur
- [ ] `.env.local` dans `.gitignore`

---

## 🆘 En Cas de Problème

### Base de données ne se connecte pas
- Vérifier que la connection string est correcte
- Vérifier que `sslmode=require` est présent
- Vérifier que le projet Neon est actif

### Redis ne se connecte pas
- Vérifier que la connection string est correcte
- Vérifier que la base Upstash est active
- Vérifier les credentials

### Cloudinary ne fonctionne pas
- Vérifier les credentials dans `.env.local`
- Vérifier que le compte Cloudinary est actif
- Vérifier que les variables sont bien chargées

---

## 🎉 Résultat

Une fois tout configuré:
- ✅ Base de données: **Gratuit** (Neon)
- ✅ Cache: **Gratuit** (Upstash)
- ✅ Stockage: **Gratuit** (Cloudinary)
- ✅ **Aucun coût AWS!**

**Économie: $1200/mois → $0/mois** 🎉

