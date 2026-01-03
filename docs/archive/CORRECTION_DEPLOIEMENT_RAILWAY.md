# 🔧 Correction du Déploiement Railway - Guide Complet

## 📋 Problèmes Identifiés

1. ✅ **Node.js version** : Corrigé (passé à Node 22 dans nixpacks.toml)
2. ⚠️ **Service non lié** : Nécessite configuration via dashboard
3. ⚠️ **PostgreSQL non configuré** : À ajouter via dashboard
4. ⚠️ **Variables d'environnement** : À configurer via dashboard

---

## ✅ Corrections Appliquées

### 1. Version Node.js
- ✅ `nixpacks.toml` mis à jour : Node.js 22
- ✅ `apps/backend/nixpacks.toml` mis à jour : Node.js 22
- ✅ `railway.json` configuré correctement

### 2. Configuration Build
- ✅ Build command : `cd apps/backend && pnpm install && pnpm prisma generate && pnpm build`
- ✅ Start command : `cd apps/backend && pnpm start`

---

## 🔧 Étapes à Effectuer via Dashboard Railway

### ÉTAPE 1 : Accéder au Dashboard

**URL :** https://railway.com/project/fb66d02e-2862-4a62-af66-f97430983d0b

---

### ÉTAPE 2 : Créer/Configurer le Service Backend

1. Dans le dashboard, vérifier si un service existe déjà
2. Si aucun service :
   - Cliquer sur **"+ New"** → **"GitHub Repo"** ou **"Empty Service"**
   - Nommer le service : `backend`
   - **Root Directory :** `apps/backend`
   - **Build Command :** `pnpm install && pnpm prisma generate && pnpm build`
   - **Start Command :** `pnpm start`

3. Si service existe :
   - Aller dans **Settings** du service
   - Vérifier/Configurer :
     - **Root Directory :** `apps/backend`
     - **Build Command :** `pnpm install && pnpm prisma generate && pnpm build`
     - **Start Command :** `pnpm start`

---

### ÉTAPE 3 : Ajouter PostgreSQL

1. Dans le dashboard du projet
2. Cliquer sur **"+ New"** → **"Database"** → **"PostgreSQL"**
3. Railway créera automatiquement :
   - Une base de données PostgreSQL
   - La variable `DATABASE_URL` (automatiquement liée au service)

**Important :** La variable `DATABASE_URL` sera automatiquement disponible pour tous les services du projet.

---

### ÉTAPE 4 : Configurer les Variables d'Environnement

1. Dans le dashboard, aller dans **"Variables"** (ou dans les **Settings** du service)
2. Ajouter les variables suivantes :

#### Variables Essentielles

```bash
NODE_ENV=production
JWT_SECRET=<générer-un-secret-aleatoire>
```

**Générer JWT_SECRET :**
```bash
openssl rand -hex 32
```

#### Variables Recommandées

```bash
APP_URL=https://votre-service.railway.app
FRONTEND_URL=https://votre-frontend.vercel.app
STRIPE_SECRET_KEY=sk_live_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SENDGRID_API_KEY=SG....
FROM_EMAIL=noreply@votre-domaine.com
SENTRY_DSN=https://... (optionnel)
```

**Note :** `DATABASE_URL` sera automatiquement ajouté quand vous ajouterez PostgreSQL.

---

### ÉTAPE 5 : Déclencher le Déploiement

1. Dans le dashboard, aller dans **"Deployments"**
2. Cliquer sur **"Redeploy"** ou **"Deploy"**
3. Ou faire un commit/push sur GitHub (si repo lié)

---

### ÉTAPE 6 : Vérifier les Logs

1. Dans le dashboard, aller dans **"Deployments"**
2. Cliquer sur le dernier déploiement
3. Vérifier les **Build Logs** et **Deploy Logs**
4. Vérifier qu'il n'y a pas d'erreurs

**Erreurs courantes à vérifier :**
- ❌ "Cannot find module" → Vérifier que `pnpm install` s'exécute
- ❌ "Prisma Client not generated" → Vérifier que `pnpm prisma generate` s'exécute
- ❌ "Database connection failed" → Vérifier que PostgreSQL est ajouté et `DATABASE_URL` configuré
- ❌ "Port already in use" → Normal, Railway gère le port automatiquement

---

### ÉTAPE 7 : Vérifier le Health Check

Une fois déployé :

1. Obtenir l'URL du service dans le dashboard
2. Tester le health check :
```bash
curl https://votre-service.railway.app/health
```

**Attendu :** `{"status":"ok"}`

---

## 📊 Configuration Finale

### Fichiers de Configuration Créés

- ✅ `railway.json` - Configuration principale
- ✅ `nixpacks.toml` - Configuration Nixpacks (Node 22)
- ✅ `apps/backend/railway.json` - Configuration backend
- ✅ `apps/backend/nixpacks.toml` - Configuration Nixpacks backend

### Scripts Créés

- ✅ `scripts/fix-railway-deployment.sh` - Script de correction
- ✅ `scripts/deploy-railway-complete.sh` - Script complet
- ✅ `scripts/railway-fix-and-deploy.sh` - Script avec API

---

## 🐛 Dépannage

### Erreur : "Multiple services found"

**Solution :** Spécifier le service dans Railway CLI :
```bash
railway service <service-name>
```

### Erreur : "No service linked"

**Solution :** Lier le service via dashboard ou CLI :
```bash
railway service <service-id>
```

### Erreur : "Node version incompatible"

**Solution :** ✅ Déjà corrigé (Node 22 dans nixpacks.toml)

### Erreur : "Build failed"

**Vérifier :**
1. Root Directory : `apps/backend`
2. Build Command : `pnpm install && pnpm prisma generate && pnpm build`
3. Start Command : `pnpm start`
4. Variables d'environnement configurées

---

## ✅ Checklist Complète

- [ ] Service backend créé/configuré
- [ ] Root Directory : `apps/backend`
- [ ] Build Command configuré
- [ ] Start Command configuré
- [ ] PostgreSQL ajouté
- [ ] `DATABASE_URL` automatiquement configuré
- [ ] `NODE_ENV=production` configuré
- [ ] `JWT_SECRET` configuré
- [ ] Autres variables configurées (optionnel)
- [ ] Déploiement déclenché
- [ ] Logs vérifiés (pas d'erreurs)
- [ ] Health check fonctionne
- [ ] API testée

---

## 🚀 Commandes Utiles (après configuration)

```bash
# Voir les logs
railway logs

# Vérifier le statut
railway status

# Obtenir l'URL
railway domain

# Tester le health check
curl $(railway domain)/health

# Ouvrir le dashboard
railway open
```

---

## 📚 Documentation

- **Guide complet :** `DEPLOIEMENT_RAILWAY.md`
- **Guide rapide :** `RAILWAY_QUICK_START.md`
- **Déploiement automatisé :** `DEPLOIEMENT_RAILWAY_AUTOMATISE.md`

---

**✅ Toutes les corrections sont appliquées !**

**Prochaines étapes :** Suivre les étapes ci-dessus via le dashboard Railway.

**Dashboard :** https://railway.com/project/fb66d02e-2862-4a62-af66-f97430983d0b

