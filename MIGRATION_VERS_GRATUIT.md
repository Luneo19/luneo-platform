# 🆓 Migration Complète AWS → Alternatives Gratuites

## 🎯 Objectif

Remplacer **TOUS** les services AWS payants par des alternatives **100% GRATUITES**.

**Économie:** $1200/mois → **$0/mois** 🎉

---

## 📋 Checklist de Migration

- [ ] 1. Base de données PostgreSQL → **Neon** (gratuit)
- [ ] 2. Cache Redis → **Upstash** (gratuit)
- [ ] 3. Stockage fichiers → **Cloudinary** (déjà configuré ✅)
- [ ] 4. Hébergement → **Vercel** (gratuit)
- [ ] 5. Mettre à jour les variables d'environnement
- [ ] 6. Tester tout

---

## 🗄️ Étape 1: Base de Données PostgreSQL → Neon

### Créer un compte Neon (5 minutes)

1. **Aller sur:** https://neon.tech
2. **Créer un compte** (gratuit)
3. **Créer un nouveau projet:**
   - Nom: `luneo-production`
   - Région: `Europe (Frankfurt)` ou `US East (Ohio)`
   - PostgreSQL version: `15` ou `16`

4. **Copier la connection string:**
   - Format: `postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require`
   - Exemple: `postgresql://user:pass@ep-cool-darkness-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require`

### Migrer les données (si vous avez des données existantes)

```bash
# 1. Exporter depuis l'ancienne base (si vous avez accès)
pg_dump "postgresql://user:pass@old-db.amazonaws.com:5432/dbname" > backup.sql

# 2. Importer dans Neon
psql "postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require" < backup.sql
```

### Mettre à jour les variables d'environnement

**Fichier:** `.env` ou `.env.local`

```env
# AVANT (AWS RDS)
# DATABASE_URL=postgresql://user:pass@luneo-db.xxx.eu-west-1.rds.amazonaws.com:5432/luneo_production

# APRÈS (Neon - GRATUIT)
DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/neondb?sslmode=require
```

**Où mettre à jour:**
- `apps/backend/.env`
- `apps/backend/.env.local`
- `apps/frontend/.env.local`
- Toute variable d'environnement qui contient `DATABASE_URL`

### Tester la connexion

```bash
# Dans le projet backend
cd apps/backend
npx prisma db push
# ou
npx prisma migrate dev
```

✅ **Résultat:** Base de données gratuite configurée!

---

## 💾 Étape 2: Cache Redis → Upstash

### Créer un compte Upstash (3 minutes)

1. **Aller sur:** https://upstash.com
2. **Créer un compte** (gratuit)
3. **Créer une base Redis:**
   - Nom: `luneo-cache`
   - Type: `Regional` (plus rapide)
   - Région: `eu-west-1` (Europe) ou `us-east-1` (US)

4. **Copier la connection string:**
   - Format: `redis://default:password@region.upstash.io:6379`
   - Exemple: `redis://default:AbCdEf123456@eu-west-1.upstash.io:6379`

### Mettre à jour les variables d'environnement

**Fichier:** `.env` ou `.env.local`

```env
# AVANT (AWS ElastiCache)
# REDIS_URL=redis://luneo-redis.xxx.cache.amazonaws.com:6379

# APRÈS (Upstash - GRATUIT)
REDIS_URL=redis://default:password@region.upstash.io:6379
```

**Où mettre à jour:**
- `apps/backend/.env`
- `apps/backend/.env.local`
- Toute variable d'environnement qui contient `REDIS_URL`

### Tester la connexion

```bash
# Tester Redis
node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping().then(() => console.log('✅ Redis connecté!')).catch(e => console.error('❌ Erreur:', e));
"
```

✅ **Résultat:** Cache Redis gratuit configuré!

---

## 📦 Étape 3: Stockage Fichiers → Cloudinary

### ✅ Déjà Configuré!

Le code utilise déjà Cloudinary. Il suffit de vérifier la configuration:

**Fichier:** `.env` ou `.env.local`

```env
# Cloudinary (GRATUIT jusqu'à 25 GB)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Si vous n'avez pas de compte Cloudinary:**

1. **Aller sur:** https://cloudinary.com
2. **Créer un compte** (gratuit)
3. **Copier les credentials** depuis le dashboard
4. **Mettre à jour** les variables d'environnement

✅ **Résultat:** Stockage gratuit déjà configuré!

---

## 🚀 Étape 4: Hébergement → Vercel

### Frontend (Next.js) - Déploiement sur Vercel

1. **Installer Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Se connecter:**
   ```bash
   vercel login
   ```

3. **Déployer le frontend:**
   ```bash
   cd apps/frontend
   vercel
   ```

4. **Configurer les variables d'environnement:**
   - Aller sur https://vercel.com/dashboard
   - Projet → Settings → Environment Variables
   - Ajouter toutes les variables nécessaires

### Backend (NestJS) - Options Gratuites

#### Option A: Vercel Serverless Functions (Recommandé)

1. **Créer un dossier `api/` dans le backend:**
   ```bash
   cd apps/backend
   mkdir -p api
   ```

2. **Créer `api/index.ts`:**
   ```typescript
   import { NestFactory } from '@nestjs/core';
   import { AppModule } from '../src/app.module';
   import serverless from 'serverless-http';

   let cachedServer: any;

   async function bootstrap() {
     if (!cachedServer) {
       const app = await NestFactory.create(AppModule);
       await app.init();
       cachedServer = serverless(app.getHttpAdapter().getInstance());
     }
     return cachedServer;
   }

   export const handler = async (event: any, context: any) => {
     const server = await bootstrap();
     return server(event, context);
   };
   ```

3. **Installer la dépendance:**
   ```bash
   npm install serverless-http
   ```

4. **Déployer:**
   ```bash
   vercel
   ```

#### Option B: Railway (Alternative)

1. **Aller sur:** https://railway.app
2. **Créer un compte** (gratuit: $5 crédit/mois)
3. **Nouveau projet** → **Deploy from GitHub**
4. **Sélectionner le repo** et le dossier `apps/backend`
5. **Configurer les variables d'environnement** dans Railway

✅ **Résultat:** Hébergement gratuit configuré!

---

## 🔧 Étape 5: Mettre à Jour Toutes les Variables d'Environnement

### Fichier `.env` Complet (Exemple)

```env
# ========================================
# BASE DE DONNÉES - Neon (GRATUIT)
# ========================================
DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/neondb?sslmode=require

# ========================================
# REDIS - Upstash (GRATUIT)
# ========================================
REDIS_URL=redis://default:password@region.upstash.io:6379

# ========================================
# STOCKAGE - Cloudinary (GRATUIT)
# ========================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ========================================
# JWT (Générer de nouveaux secrets)
# ========================================
JWT_SECRET=your_super_secure_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_here_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ========================================
# AUTRES (selon vos besoins)
# ========================================
NODE_ENV=production
PORT=3000

# SUPPRIMER toutes les variables AWS:
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_REGION=...
# AWS_S3_BUCKET_NAME=...
```

### Où Mettre à Jour

1. **Local:**
   - `apps/backend/.env`
   - `apps/backend/.env.local`
   - `apps/frontend/.env.local`

2. **Production (Vercel):**
   - Dashboard Vercel → Projet → Settings → Environment Variables

3. **Production (Railway):**
   - Dashboard Railway → Projet → Variables

---

## ✅ Étape 6: Tester Tout

### Tests à Effectuer

1. **Base de données:**
   ```bash
   cd apps/backend
   npx prisma db push
   npx prisma studio  # Ouvrir l'interface graphique
   ```

2. **Redis:**
   ```bash
   # Tester la connexion Redis
   node -e "const Redis = require('ioredis'); const r = new Redis(process.env.REDIS_URL); r.ping().then(() => console.log('✅ Redis OK')).catch(e => console.error('❌ Erreur:', e));"
   ```

3. **Cloudinary:**
   ```bash
   # Tester l'upload
   node -e "const cloudinary = require('cloudinary').v2; cloudinary.config({cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET}); cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', (err, res) => {if(err) console.error('❌ Erreur:', err); else console.log('✅ Cloudinary OK:', res.secure_url);});"
   ```

4. **Application complète:**
   ```bash
   # Démarrer l'application
   cd apps/backend
   npm run start:dev
   
   # Dans un autre terminal
   cd apps/frontend
   npm run dev
   ```

---

## 📊 Récapitulatif des Changements

| Service AWS | Alternative Gratuite | Action Requise |
|------------|---------------------|----------------|
| **RDS PostgreSQL** | **Neon** | Créer compte → Copier connection string → Mettre à jour `DATABASE_URL` |
| **ElastiCache Redis** | **Upstash** | Créer compte → Copier connection string → Mettre à jour `REDIS_URL` |
| **S3 Storage** | **Cloudinary** | ✅ Déjà configuré (vérifier credentials) |
| **ECS Fargate** | **Vercel** | Déployer avec `vercel` |
| **Load Balancer** | **Vercel** | Inclus automatiquement |
| **CloudFront CDN** | **Cloudinary** | Inclus automatiquement |

---

## 🎯 Temps Estimé

- **Neon (Base de données):** 5 minutes
- **Upstash (Redis):** 3 minutes
- **Cloudinary (Vérification):** 2 minutes
- **Vercel (Déploiement):** 10 minutes
- **Mise à jour variables:** 5 minutes
- **Tests:** 10 minutes

**Total:** ~35 minutes pour migrer complètement!

---

## 💰 Coûts

| Avant (AWS) | Après (Alternatives Gratuites) |
|------------|-------------------------------|
| **~$1200/mois** | **$0/mois** 🎉 |
| RDS: $50-100 | Neon: $0 |
| ElastiCache: $15-30 | Upstash: $0 |
| ECS: $30-100 | Vercel: $0 |
| ALB: $16-20 | Inclus |
| S3: Variable | Cloudinary: $0 |
| CloudFront: Variable | Inclus |

**ÉCONOMIE: 14,400$/an** 💰

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
- Vérifier les credentials dans `.env`
- Vérifier que le compte Cloudinary est actif

### Déploiement Vercel échoue
- Vérifier les variables d'environnement dans Vercel
- Vérifier les logs de build
- Vérifier que toutes les dépendances sont installées

---

## ✅ Checklist Finale

- [ ] Compte Neon créé et base de données configurée
- [ ] `DATABASE_URL` mis à jour partout
- [ ] Compte Upstash créé et Redis configuré
- [ ] `REDIS_URL` mis à jour partout
- [ ] Cloudinary vérifié et configuré
- [ ] Variables AWS supprimées de tous les `.env`
- [ ] Application testée localement
- [ ] Application déployée sur Vercel
- [ ] Tests de production effectués
- [ ] Anciennes ressources AWS supprimées

---

**🎉 Félicitations! Vous avez migré vers des alternatives 100% gratuites!**

**Date:** $(date)
**Économie:** $1200/mois → $0/mois

