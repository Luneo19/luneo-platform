# 🚂 Guide Rapide - Déploiement Railway Backend

## 📋 Checklist Express

### ✅ Étapes Obligatoires

1. **Créer le projet Railway**
   - Aller sur [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Sélectionner le dépôt `luneo-platform`
   - Root Directory : `apps/backend`

2. **Ajouter PostgreSQL**
   - + New → Database → PostgreSQL
   - Railway crée automatiquement `DATABASE_URL`

3. **Configurer les Variables d'Environnement**

   **OBLIGATOIRES :**
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=<générez-32-caractères>
   JWT_REFRESH_SECRET=<générez-32-caractères>
   NODE_ENV=production
   PORT=3001
   ```

   **RECOMMANDÉES :**
   ```env
   REDIS_URL=${{Redis.REDIS_URL}}  # Si vous ajoutez Redis
   FRONTEND_URL=https://app.luneo.app
   CORS_ORIGIN=https://app.luneo.app
   SENDGRID_API_KEY=SG.xxx...
   STRIPE_SECRET_KEY=sk_live_...
   OPENAI_API_KEY=sk-...
   CLOUDINARY_CLOUD_NAME=xxx
   CLOUDINARY_API_KEY=xxx
   CLOUDINARY_API_SECRET=xxx
   ```

4. **Exécuter les migrations Prisma**
   ```bash
   railway run --service backend "cd apps/backend && pnpm prisma migrate deploy"
   ```

5. **Vérifier le déploiement**
   ```bash
   curl https://votre-app.railway.app/health
   ```

---

## 🔑 Générer les Secrets JWT

```bash
# Option 1 : OpenSSL
openssl rand -base64 32

# Option 2 : Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**⚠️ Important** : Utilisez 2 secrets DIFFÉRENTS pour JWT_SECRET et JWT_REFRESH_SECRET !

---

## 📁 Fichiers de Configuration

Les fichiers suivants sont **déjà configurés** dans `apps/backend/` :

- ✅ `railway.toml` - Configuration Railway
- ✅ `nixpacks.toml` - Configuration du build (pnpm + monorepo)

**Pas besoin de les modifier**, ils sont prêts !

---

## 🐛 Problèmes Courants

### "Cannot find module"
→ Vérifier que Root Directory = `apps/backend`

### "DATABASE_URL not found"
→ Vérifier que PostgreSQL est ajouté et que vous utilisez `${{Postgres.DATABASE_URL}}`

### "Prisma Client not generated"
→ Les migrations incluent la génération. Vérifier les logs de build.

---

## 📚 Documentation Complète

Pour plus de détails, voir : [`DEPLOIEMENT_RAILWAY.md`](./DEPLOIEMENT_RAILWAY.md)

---

## 🎯 Résultat Attendu

Une fois déployé, votre API sera accessible à :
- **Health Check** : `https://votre-app.railway.app/health`
- **API** : `https://votre-app.railway.app/api`
- **Swagger** : `https://votre-app.railway.app/api/docs` (si non en prod)

N'oubliez pas de mettre à jour votre frontend avec la nouvelle URL de l'API ! 🚀











