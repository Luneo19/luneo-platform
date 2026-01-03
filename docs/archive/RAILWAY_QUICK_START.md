# 🚂 Railway - Quick Start Guide

## ⚡ Déploiement Rapide (5 minutes)

### Option 1 : Via Railway Dashboard (Recommandé)

1. **Créer un compte Railway**
   - Aller sur [railway.app](https://railway.app)
   - Se connecter avec GitHub

2. **Créer un nouveau projet**
   - Cliquer sur "New Project"
   - Sélectionner "Deploy from GitHub repo"
   - Choisir `luneo-platform`

3. **Ajouter PostgreSQL**
   - Dans le projet, cliquer sur "New"
   - Sélectionner "Database" → "PostgreSQL"
   - Railway créera automatiquement une base de données

4. **Configurer le service backend**
   - Railway détectera automatiquement le projet
   - **Root Directory :** `apps/backend`
   - **Build Command :** `pnpm install && pnpm prisma generate && pnpm build`
   - **Start Command :** `pnpm start`

5. **Configurer les variables d'environnement**
   - Aller dans **Settings** → **Variables**
   - Ajouter les variables (voir `DEPLOIEMENT_RAILWAY.md`)

6. **Déployer**
   - Railway déploiera automatiquement
   - Suivre les logs dans le dashboard

---

### Option 2 : Via Railway CLI

```bash
# 1. Installer Railway CLI
npm install -g @railway/cli

# 2. Se connecter
railway login

# 3. Initialiser le projet
railway init

# 4. Lier à un projet existant (ou créer un nouveau)
railway link

# 5. Ajouter PostgreSQL
railway add postgresql

# 6. Configurer les variables
railway variables set JWT_SECRET=your-secret
railway variables set NODE_ENV=production
# ... autres variables

# 7. Déployer
railway up
```

---

## 🔧 Configuration Automatique

Railway détectera automatiquement :
- ✅ Node.js 18+
- ✅ pnpm (via `packageManager` dans package.json)
- ✅ Build command (via `railway.json` ou `nixpacks.toml`)
- ✅ Start command
- ✅ Port (via `process.env.PORT`)

---

## 📝 Variables d'Environnement Minimales

```bash
# Database (fourni automatiquement par Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Node
NODE_ENV=production

# JWT (à générer)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# App URLs
APP_URL=https://your-service.railway.app
FRONTEND_URL=https://your-frontend.vercel.app
```

**Note :** Railway fournit automatiquement `PORT` et `DATABASE_URL` si vous ajoutez PostgreSQL.

---

## ✅ Vérification Post-Déploiement

```bash
# 1. Vérifier les logs
railway logs

# 2. Vérifier le health check
curl https://your-service.railway.app/health

# 3. Vérifier les migrations
railway run pnpm prisma migrate status
```

---

## 🐛 Problèmes Courants

### "Cannot find module"
**Solution :** Vérifier que `pnpm install` s'exécute dans le build

### "Prisma Client not generated"
**Solution :** S'assurer que `pnpm prisma generate` est dans le build command

### "Database connection failed"
**Solution :** 
1. Vérifier `DATABASE_URL` dans Railway
2. Vérifier que PostgreSQL est démarré
3. Exécuter les migrations : `railway run pnpm prisma migrate deploy`

---

## 📚 Documentation Complète

Voir `DEPLOIEMENT_RAILWAY.md` pour le guide complet.

---

**✅ Prêt à déployer !**

