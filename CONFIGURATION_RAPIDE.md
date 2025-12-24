# ⚡ Configuration Rapide - 5 Minutes

## 🎯 Vous avez déjà créé les comptes?

Parfait! Il suffit de remplir les variables d'environnement.

---

## 🚀 Méthode 1: Script Automatique (Recommandé)

```bash
./scripts/setup-gratuit-env.sh
```

Le script vous demandera:
1. Connection string Neon
2. Connection string Upstash Redis
3. Credentials Cloudinary
4. Il générera automatiquement les JWT secrets

**Temps:** ~2 minutes

---

## 🚀 Méthode 2: Manuel (Si vous préférez)

### 1. Créer les fichiers

```bash
# Backend
cd apps/backend
cp .env.local.example .env.local

# Frontend
cd apps/frontend
cp .env.local.example .env.local
```

### 2. Remplir les valeurs

#### Backend (`apps/backend/.env.local`)

```env
# Neon (Base de données)
DATABASE_URL="postgresql://user:password@ep-xxx.region.neon.tech/neondb?sslmode=require"

# Upstash (Redis)
REDIS_URL="redis://default:password@region.upstash.io:6379"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# JWT (générer avec: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET="votre_secret_32_chars_minimum"
JWT_REFRESH_SECRET="votre_refresh_secret_32_chars_minimum"
```

#### Frontend (`apps/frontend/.env.local`)

```env
# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Upstash REST (pour API routes)
UPSTASH_REDIS_REST_URL="https://region.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_rest_token"
```

---

## ✅ Vérification Rapide

```bash
# 1. Tester la base de données
cd apps/backend
npx prisma db push

# 2. Démarrer l'application
npm run start:dev
```

Si tout fonctionne → ✅ Configuration réussie!

---

## 📖 Où Trouver les Credentials?

### Neon
1. https://neon.tech → Votre projet
2. **Connection string** → Copier
3. Format: `postgresql://user:pass@ep-xxx.region.neon.tech/neondb?sslmode=require`

### Upstash
1. https://upstash.com → Votre base Redis
2. **Redis URL** → Copier (format: `redis://default:pass@region.upstash.io:6379`)
3. **REST API** → Copier URL et Token (pour frontend)

### Cloudinary
1. https://cloudinary.com → Dashboard
2. **Account Details** → Copier:
   - Cloud Name
   - API Key
   - API Secret

---

## 🎉 C'est Tout!

Une fois configuré:
- ✅ Base de données: **Gratuit** (Neon)
- ✅ Cache: **Gratuit** (Upstash)
- ✅ Stockage: **Gratuit** (Cloudinary)
- ✅ **Aucun coût AWS!**

**Économie: $1200/mois → $0/mois** 🎉

---

## 🆘 Besoin d'Aide?

Voir `CONFIGURATION_GUIDE.md` pour le guide complet avec dépannage.

