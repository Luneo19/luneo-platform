# ✅ Prochaines Étapes - Déploiement Railway

## 🎯 Checklist de Déploiement

### ✅ Étape 1 : Railway CLI installé et connecté
- [x] Railway CLI installé
- [ ] Projet lié (`railway link -p 0e3eb9ba-6846-4e0e-81d2-bd7da54da971`)
- [ ] Vérifié avec `railway status`

### 🔧 Étape 2 : Configuration Railway Dashboard

1. **Ouvrir Railway Dashboard**
   ```bash
   railway open
   ```
   Ou allez sur : https://railway.app

2. **Vérifier le Root Directory**
   - Ouvrez votre service backend
   - Settings → Root Directory
   - Doit être : `apps/backend` (ou laisser vide si configuré dans railway.toml)

3. **Ajouter PostgreSQL** (si pas déjà fait)
   - Cliquez sur "+ New"
   - Sélectionnez "Database" → "PostgreSQL"
   - Railway génère automatiquement `DATABASE_URL`

4. **Ajouter Redis** (optionnel mais recommandé)
   - Cliquez sur "+ New"
   - Sélectionnez "Database" → "Redis"

---

### 🔐 Étape 3 : Configurer les Variables d'Environnement

#### Option A : Via Railway CLI (Rapide)

```bash
cd apps/backend
./setup-railway-env.sh
```

Ce script configure automatiquement :
- NODE_ENV
- PORT
- JWT_SECRET (généré automatiquement)
- JWT_REFRESH_SECRET (généré automatiquement)

**Important** : Vous devrez configurer `DATABASE_URL` manuellement dans le Dashboard Railway avec la valeur : `${{Postgres.DATABASE_URL}}`

#### Option B : Via Railway Dashboard (Recommandé pour les secrets)

1. Ouvrez votre service backend dans Railway
2. Allez dans l'onglet "Variables"
3. Ajoutez les variables une par une :

**Variables OBLIGATOIRES :**
```env
DATABASE_URL = ${{Postgres.DATABASE_URL}}
NODE_ENV = production
PORT = 3001
JWT_SECRET = <générez avec: openssl rand -base64 32>
JWT_REFRESH_SECRET = <générez avec: openssl rand -base64 32>
JWT_EXPIRES_IN = 15m
JWT_REFRESH_EXPIRES_IN = 7d
```

**Variables IMPORTANTES (selon vos besoins) :**
```env
REDIS_URL = ${{Redis.REDIS_URL}}  (si Redis ajouté)
FRONTEND_URL = https://app.luneo.app
CORS_ORIGIN = https://app.luneo.app
SENDGRID_API_KEY = SG.xxx...
STRIPE_SECRET_KEY = sk_live_...
OPENAI_API_KEY = sk-...
CLOUDINARY_CLOUD_NAME = xxx
CLOUDINARY_API_KEY = xxx
CLOUDINARY_API_SECRET = xxx
```

📝 **Liste complète** : Voir `GUIDE_RAILWAY_RAPIDE.md` ou `DEPLOIEMENT_RAILWAY.md`

---

### 🗄️ Étape 4 : Exécuter les Migrations Prisma

Une fois PostgreSQL ajouté et `DATABASE_URL` configuré :

```bash
cd apps/backend
railway run "cd apps/backend && pnpm prisma migrate deploy"
```

Ou si vous préférez via le Dashboard :
- Deployments → ... → Open Shell
- Exécutez :
  ```bash
  cd apps/backend
  pnpm prisma migrate deploy
  ```

---

### 🚀 Étape 5 : Déployer

Railway déploie automatiquement à chaque push sur votre branche principale.

Pour déployer manuellement :
```bash
railway up
```

Ou déclenchez un nouveau déploiement depuis le Dashboard Railway.

---

### ✅ Étape 6 : Vérifier le Déploiement

1. **Voir les logs**
   ```bash
   railway logs --follow
   ```

2. **Obtenir l'URL du service**
   ```bash
   railway domain
   ```

3. **Tester le health check**
   ```bash
   curl $(railway domain)/health
   ```

   Devrait retourner :
   ```json
   {
     "status": "ok",
     "timestamp": "..."
   }
   ```

4. **Tester l'API**
   ```bash
   curl $(railway domain)/api
   ```

---

## 🐛 Résolution de Problèmes

### Le projet n'est pas lié
```bash
cd apps/backend
railway link -p 0e3eb9ba-6846-4e0e-81d2-bd7da54da971
```

### Erreur "DATABASE_URL not found"
→ Vérifiez que PostgreSQL est ajouté et que `DATABASE_URL` est configuré avec `${{Postgres.DATABASE_URL}}`

### Erreur "Prisma Client not generated"
→ Les migrations incluent la génération. Vérifiez les logs de build.

### Build échoue
→ Vérifiez que le Root Directory est bien configuré sur `apps/backend`

---

## 📚 Documentation

- **Guide rapide** : [`GUIDE_RAILWAY_RAPIDE.md`](./GUIDE_RAILWAY_RAPIDE.md)
- **Guide complet** : [`DEPLOIEMENT_RAILWAY.md`](./DEPLOIEMENT_RAILWAY.md)
- **Commandes CLI** : [`COMMANDES_RAILWAY_CLI.md`](./COMMANDES_RAILWAY_CLI.md)

---

## 🎉 Une fois Déployé

Votre API sera accessible à :
- **Health Check** : `https://votre-app.railway.app/health`
- **API** : `https://votre-app.railway.app/api`
- **Swagger** : `https://votre-app.railway.app/api/docs` (si non en production)

**N'oubliez pas** de mettre à jour votre frontend avec la nouvelle URL de l'API ! 🚀
