# 🔧 Configuration Railway - Variables d'Environnement

## 📋 Variables à Configurer

### 1. Sentry (Monitoring)
```bash
SENTRY_DSN=https://9b98e0a9e22c4d2f88b22edf3d1c7ddf@o4509948310519808.ingest.de.sentry.io/4509948332998736
SENTRY_ENVIRONMENT=production
```

**Comment configurer :**
1. Aller sur https://railway.app
2. Ouvrir le projet `believable-learning`
3. Ouvrir le service `backend`
4. Aller dans l'onglet "Variables"
5. Cliquer sur "+ New Variable"
6. Ajouter les variables ci-dessus

### 2. Base de Données
La variable `DATABASE_URL` devrait déjà être configurée automatiquement par Railway si PostgreSQL est ajouté.

### 3. Migrations Prisma
Pour exécuter les migrations :
```bash
railway run "cd apps/backend && pnpm prisma migrate deploy"
```

Ou via le Dashboard Railway :
1. Ouvrir le service backend
2. Deployments → ... → Open Shell
3. Exécuter :
```bash
cd apps/backend
pnpm prisma migrate deploy
```

## ✅ Checklist

- [ ] SENTRY_DSN configuré
- [ ] SENTRY_ENVIRONMENT configuré
- [ ] Migration `add_user_name_column` exécutée
- [ ] Vérifier que toutes les migrations sont appliquées

## 🔍 Vérification

Après configuration, vérifier que :
1. Les erreurs sont capturées dans Sentry
2. La colonne `User.name` existe dans la base de données
3. `/api/auth/signup` fonctionne sans erreur DB





