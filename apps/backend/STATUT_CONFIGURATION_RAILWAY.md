# ✅ Statut Configuration Railway

## 🎯 État Actuel

**Projet Railway** : `believable-learning`  
**ID Projet** : `0e3eb9ba-6846-4e0e-81d2-bd7da54da971`  
**Service Actuel** : Postgres (⚠️ Il faut créer/configurer le service backend)

---

## ✅ Variables Configurées

Les variables suivantes ont été configurées automatiquement :

- ✅ `NODE_ENV=production`
- ✅ `PORT=3001`
- ✅ `API_PREFIX=/api`
- ✅ `JWT_SECRET` (généré automatiquement)
- ✅ `JWT_REFRESH_SECRET` (généré automatiquement)
- ✅ `JWT_EXPIRES_IN=15m`
- ✅ `JWT_REFRESH_EXPIRES_IN=7d`
- ✅ `FRONTEND_URL=https://app.luneo.app`
- ✅ `CORS_ORIGIN=https://app.luneo.app,https://luneo.app`
- ✅ `RATE_LIMIT_TTL=60`
- ✅ `RATE_LIMIT_LIMIT=100`
- ✅ Configuration SendGrid (sauf API_KEY)

---

## ⚠️ Actions Requises dans Railway Dashboard

### 1. Créer le Service Backend

1. Ouvrez Railway Dashboard : https://railway.app
2. Ouvrez votre projet `believable-learning`
3. Cliquez sur **"+ New"** → **"GitHub Repo"** (ou **"Empty Service"**)
4. Si vous choisissez GitHub Repo :
   - Sélectionnez votre dépôt `luneo-platform`
   - Configurez le **Root Directory** : `apps/backend`
5. Nommez le service : `backend` (ou `api`)

### 2. Configurer les Variables d'Environnement dans le Service Backend

Une fois le service backend créé, allez dans **Variables** et ajoutez :

#### Variables OBLIGATOIRES (via Dashboard uniquement - références Railway) :

```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
```

#### Variables OPTIONNELLES (si vous avez ajouté Redis) :

```
REDIS_URL = ${{Redis.REDIS_URL}}
```

#### Variables à Ajouter (Clés API - à remplir avec vos vraies valeurs) :

```
SENDGRID_API_KEY = SG.xxx... (votre clé SendGrid)
```

**Optionnelles selon vos besoins :**
```
STRIPE_SECRET_KEY = sk_live_... (si utilisé)
STRIPE_WEBHOOK_SECRET = whsec_... (si utilisé)
OPENAI_API_KEY = sk-... (si utilisé)
CLOUDINARY_CLOUD_NAME = xxx (si utilisé)
CLOUDINARY_API_KEY = xxx (si utilisé)
CLOUDINARY_API_SECRET = xxx (si utilisé)
GOOGLE_CLIENT_ID = xxx (si OAuth Google)
GOOGLE_CLIENT_SECRET = xxx (si OAuth Google)
GITHUB_CLIENT_ID = xxx (si OAuth GitHub)
GITHUB_CLIENT_SECRET = xxx (si OAuth GitHub)
```

### 3. Vérifier que toutes les Variables sont Configurées

Les variables suivantes devraient déjà être configurées (configurées automatiquement) :

- NODE_ENV
- PORT
- API_PREFIX
- JWT_SECRET
- JWT_REFRESH_SECRET
- JWT_EXPIRES_IN
- JWT_REFRESH_EXPIRES_IN
- FRONTEND_URL
- CORS_ORIGIN
- RATE_LIMIT_TTL
- RATE_LIMIT_LIMIT
- SENDGRID_DOMAIN
- SENDGRID_FROM_NAME
- SENDGRID_FROM_EMAIL
- SENDGRID_REPLY_TO
- SMTP_HOST
- SMTP_PORT
- SMTP_SECURE
- SMTP_FROM
- DOMAIN_VERIFIED

**Si elles ne sont pas dans le service backend, vous pouvez :**
- Les copier depuis le service Postgres (si elles y sont)
- Les recréer dans le service backend

---

## 🔧 Commandes Utiles

### Voir les services du projet
```bash
railway status
```

### Changer de service (si le backend existe)
```bash
railway service  # Sélectionne le service backend
```

### Voir toutes les variables
```bash
railway variables
```

### Ouvrir le Dashboard
```bash
railway open
```

---

## 🚀 Prochaines Étapes

Une fois le service backend créé et toutes les variables configurées :

1. **Exécuter les migrations Prisma**
   ```bash
   railway service  # Sélectionner le service backend
   railway run "cd apps/backend && pnpm prisma migrate deploy"
   ```

2. **Vérifier le build**
   - Railway devrait automatiquement builder lors du premier déploiement
   - Vérifiez les logs : `railway logs`

3. **Déployer**
   ```bash
   railway up
   ```
   Ou Railway déploiera automatiquement à chaque push sur votre branche principale

4. **Tester le déploiement**
   ```bash
   railway domain  # Obtenir l'URL
   curl $(railway domain)/health  # Tester le health check
   ```

---

## 📋 Checklist Finale

- [ ] Service backend créé dans Railway
- [ ] Root Directory configuré sur `apps/backend`
- [ ] DATABASE_URL configuré avec `${{Postgres.DATABASE_URL}}`
- [ ] Toutes les variables d'environnement configurées
- [ ] Migrations Prisma exécutées
- [ ] Build réussi
- [ ] Health check fonctionne (`/health`)
- [ ] API accessible

---

## 🆘 En cas de Problème

### Variables non visibles dans le service backend
→ Les variables ont été configurées sur le service Postgres par erreur. Recopiez-les dans le service backend via le Dashboard.

### Service backend introuvable
→ Créez-le via Railway Dashboard (voir section 1 ci-dessus)

### Build échoue
→ Vérifiez que le Root Directory est bien `apps/backend` et que tous les fichiers de configuration sont présents (`railway.toml`, `nixpacks.toml`)

---

**Dernière mise à jour** : $(date)
