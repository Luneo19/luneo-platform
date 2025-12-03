# ⚡ Quick Start - Migration vers Gratuit (15 minutes)

## 🎯 Objectif

Remplacer AWS par des alternatives gratuites en **15 minutes**.

---

## 📋 Étapes Rapides

### 1. Base de Données → Neon (5 min)

1. Créer compte: https://neon.tech
2. Créer projet → Copier connection string
3. Mettre à jour `.env`:
   ```env
   DATABASE_URL=postgresql://user:pass@ep-xxx.region.neon.tech/neondb?sslmode=require
   ```

### 2. Redis → Upstash (3 min)

1. Créer compte: https://upstash.com
2. Créer base Redis → Copier connection string
3. Mettre à jour `.env`:
   ```env
   REDIS_URL=redis://default:pass@region.upstash.io:6379
   ```

### 3. Stockage → Cloudinary (2 min)

1. Vérifier compte: https://cloudinary.com
2. Si pas de compte → Créer (gratuit)
3. Mettre à jour `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### 4. Hébergement → Vercel (5 min)

1. Installer: `npm i -g vercel`
2. Se connecter: `vercel login`
3. Déployer: `cd apps/frontend && vercel`

---

## ✅ Résultat

- ✅ Base de données: **Gratuit** (Neon)
- ✅ Cache: **Gratuit** (Upstash)
- ✅ Stockage: **Gratuit** (Cloudinary)
- ✅ Hébergement: **Gratuit** (Vercel)

**Économie: $1200/mois → $0/mois** 🎉

---

## 📖 Guide Complet

Voir `MIGRATION_VERS_GRATUIT.md` pour les détails.

