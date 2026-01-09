# 🔧 Actions Manuelles Requises

## ⚠️ Actions à Effectuer dans le Dashboard Railway

### 1. Configurer Sentry (si pas déjà fait)

**Via CLI Railway :**
```bash
railway variables --set "SENTRY_DSN=https://9b98e0a9e22c4d2f88b22edf3d1c7ddf@o4509948310519808.ingest.de.sentry.io/4509948332998736"
railway variables --set "SENTRY_ENVIRONMENT=production"
```

**Ou via Dashboard Railway :**
1. Aller sur https://railway.app
2. Ouvrir le projet `believable-learning`
3. Ouvrir le service `backend`
4. Aller dans l'onglet "Variables"
5. Cliquer sur "+ New Variable"
6. Ajouter :
   - **Key** : `SENTRY_DSN`
   - **Value** : `https://9b98e0a9e22c4d2f88b22edf3d1c7ddf@o4509948310519808.ingest.de.sentry.io/4509948332998736`
7. Répéter pour `SENTRY_ENVIRONMENT` avec la valeur `production`

### 2. Exécuter la Migration `add_user_name_column`

**Option A : Via Railway CLI**
```bash
railway run "cd apps/backend && psql \$DATABASE_URL -f prisma/migrations/add_user_name_column/migration.sql"
```

**Option B : Via Dashboard Railway**
1. Ouvrir le service `backend` dans Railway
2. Aller dans "Deployments"
3. Cliquer sur "..." → "Open Shell"
4. Exécuter :
```bash
cd apps/backend
psql $DATABASE_URL -f prisma/migrations/add_user_name_column/migration.sql
```

**Option C : Via Prisma Migrate**
```bash
railway run "cd apps/backend && pnpm prisma migrate deploy"
```

### 3. Vérifier que la Migration a Réussi

```bash
railway run "cd apps/backend && psql \$DATABASE_URL -c \"SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'name';\""
```

Devrait retourner :
```
 column_name 
-------------
 name
(1 row)
```

### 4. Tester `/api/auth/signup` Après Migration

```bash
curl -X POST https://api.luneo.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Devrait retourner un code 201 avec les données de l'utilisateur créé.

## ✅ Checklist

- [ ] SENTRY_DSN configuré sur Railway
- [ ] SENTRY_ENVIRONMENT configuré sur Railway
- [ ] Migration `add_user_name_column` exécutée
- [ ] Colonne `User.name` vérifiée dans la base de données
- [ ] `/api/auth/signup` testé et fonctionnel

## 📝 Notes

- Les variables Sentry peuvent être configurées via CLI ou Dashboard
- La migration peut être exécutée directement via `psql` ou via `prisma migrate deploy`
- Après la migration, redémarrer le service backend pour que les changements soient pris en compte





