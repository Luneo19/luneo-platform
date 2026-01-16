# 🚀 DÉPLOIEMENT IMMÉDIAT - LUNEO PLATFORM

**Guide rapide pour déployer maintenant sur Vercel + Railway**

---

## ⚡ DÉPLOIEMENT RAPIDE (5 minutes)

### Option 1 : Script automatique (recommandé)

```bash
# Depuis la racine du projet
./scripts/deploy-production.sh
```

Ce script va :
1. ✅ Vérifier les prérequis (Vercel CLI, Railway CLI)
2. ✅ Déployer le backend sur Railway
3. ✅ Exécuter les migrations Prisma
4. ✅ Déployer le frontend sur Vercel

---

### Option 2 : Déploiement manuel étape par étape

#### 🌐 ÉTAPE 1 : Frontend (Vercel) - 2 minutes

```bash
# 1. Aller dans le dossier frontend
cd apps/frontend

# 2. Se connecter à Vercel (si pas déjà fait)
vercel login

# 3. Lier le projet (si pas déjà fait)
vercel link

# 4. Vérifier Root Directory
#    → Aller sur https://vercel.com/dashboard
#    → Settings → General → Root Directory = "apps/frontend"

# 5. Déployer
vercel --prod --yes
```

**✅ Résultat** : URL frontend disponible dans le terminal

---

#### 🚂 ÉTAPE 2 : Backend (Railway) - 3 minutes

```bash
# 1. Aller dans le dossier backend
cd apps/backend

# 2. Se connecter à Railway (si pas déjà fait)
railway login

# 3. Lier le projet (si pas déjà fait)
railway link
# Suivre les instructions pour sélectionner/créer un projet

# 4. Vérifier Root Directory
#    → Aller sur https://railway.app
#    → Settings → Root Directory = "apps/backend"

# 5. Ajouter PostgreSQL (si pas déjà fait)
#    → Railway Dashboard → "+ New" → "Database" → "PostgreSQL"

# 6. Configurer DATABASE_URL
#    → Railway Dashboard → Variables
#    → Ajouter: DATABASE_URL = ${{Postgres.DATABASE_URL}}

# 7. Exécuter les migrations
railway run "pnpm prisma migrate deploy"

# 8. Déployer
railway up
```

**✅ Résultat** : URL backend disponible dans Railway Dashboard

---

## 🔐 VARIABLES D'ENVIRONNEMENT ESSENTIELLES

### Frontend (Vercel)

**Via Dashboard Vercel** → Settings → Environment Variables :

```env
NEXT_PUBLIC_API_URL=https://votre-backend.railway.app/api
NEXT_PUBLIC_APP_URL=https://votre-projet.vercel.app
NODE_ENV=production
```

### Backend (Railway)

**Via Dashboard Railway** → Variables :

```env
# OBLIGATOIRE
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
PORT=3001
JWT_SECRET=<générer: openssl rand -base64 32>
JWT_REFRESH_SECRET=<générer: openssl rand -base64 32>
FRONTEND_URL=https://votre-projet.vercel.app
CORS_ORIGIN=https://votre-projet.vercel.app

# IMPORTANT (selon vos besoins)
STRIPE_SECRET_KEY=sk_live_xxx...
SENDGRID_API_KEY=SG.xxx...
OPENAI_API_KEY=sk-xxx...
```

---

## ✅ VÉRIFICATION POST-DÉPLOIEMENT

### Frontend
```bash
# Tester l'URL
curl https://votre-projet.vercel.app

# Vérifier les logs
vercel logs
```

### Backend
```bash
# Health check
curl https://votre-backend.railway.app/api/health

# Vérifier les logs
railway logs
```

---

## 🆘 PROBLÈMES COURANTS

### "No Next.js version detected" (Vercel)
**Solution** : Vérifier Root Directory = `apps/frontend`

### "Cannot connect to database" (Railway)
**Solution** : Vérifier `DATABASE_URL=${{Postgres.DATABASE_URL}}`

### Build failed
**Solution** : Vérifier les logs et les variables d'environnement

---

## 📞 SUPPORT

- **Vercel** : https://vercel.com/docs
- **Railway** : https://docs.railway.app
- **Logs** : Utiliser `vercel logs` et `railway logs`

---

**🚀 Prêt à déployer ? Exécutez : `./scripts/deploy-production.sh`**
