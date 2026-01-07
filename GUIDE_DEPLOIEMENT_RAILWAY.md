# 🚀 Guide de Déploiement Railway - Diagnostic et Solutions

## 📋 État Actuel

### ✅ Frontend (Vercel)
- **Status**: Déployé avec succès
- **URL**: https://frontend-80u3mc4ht-luneos-projects.vercel.app
- **Build**: Réussi

### ❌ Backend (Railway)
- **Status**: Bloqué - Authentification requise
- **Project ID**: `0e3eb9ba-6846-4e0e-81d2-bd7da54da971`
- **Problème**: Tokens Railway invalides ou expirés

## 🔍 Diagnostic

### Tokens Testés
1. `3d86d8f3-3b3f-41bf-b3ed-45975ddf4a91` (Cursor token) - ❌ Non autorisé
2. `05658a48-024e-420d-b818-d2ef00fdd1f0` (Ancien token scripts) - ❌ Non autorisé

### Erreurs Rencontrées
- `Unauthorized. Please login with railway login`
- `Not Authorized` (API GraphQL)
- `404 Not Found` (API REST)

## ✅ Solutions

### Option 1: Login Interactif (Recommandé)

```bash
# 1. Login Railway
railway login

# 2. Lier le projet
railway link --project 0e3eb9ba-6846-4e0e-81d2-bd7da54da971

# 3. Vérifier le statut
railway status

# 4. Déployer
railway up --ci

# 5. Voir les logs
railway logs

# 6. Appliquer les migrations (si nécessaire)
cd apps/backend
railway run -- npx prisma migrate deploy
```

### Option 2: Token API Railway

1. **Obtenir un nouveau token**:
   - Allez sur https://railway.app/account/tokens
   - Créez un nouveau token API
   - Copiez le token

2. **Utiliser le token**:
   ```bash
   export RAILWAY_TOKEN=3d86d8f3-3b3f-41bf-b3ed-45975ddf4a91
   railway whoami  # Vérifier l'authentification
   railway link --project 0e3eb9ba-6846-4e0e-81d2-bd7da54da971
   railway up --ci
   ```

### Option 3: Script Automatique

Utilisez le script créé:
```bash
bash scripts/deploy-railway-cli-fix.sh
```

## 📊 Analyse des Logs

### Commandes Utiles

```bash
# Voir les logs en temps réel
railway logs --follow

# Voir les logs d'un déploiement spécifique
railway logs --deployment <deployment-id>

# Voir les logs de build
railway logs --build

# Voir le statut actuel
railway status

# Voir les variables d'environnement
railway variables
```

### Analyse des Erreurs Communes

1. **Build Failed**
   - Vérifier `railway.json` et `railway.toml`
   - Vérifier les dépendances dans `package.json`
   - Vérifier les variables d'environnement

2. **Runtime Error**
   - Vérifier les logs: `railway logs`
   - Vérifier les variables d'environnement: `railway variables`
   - Vérifier la configuration du port (Railway fournit `$PORT`)

3. **Database Connection Error**
   - Vérifier `DATABASE_URL` dans les variables Railway
   - Vérifier que la base de données est créée et accessible
   - Appliquer les migrations: `railway run -- npx prisma migrate deploy`

## 🔧 Configuration Railway

### Fichiers de Configuration

1. **`railway.json`** (racine du projet)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd apps/backend && pnpm install && pnpm prisma generate && pnpm build"
  },
  "deploy": {
    "startCommand": "cd apps/backend && node dist/src/main.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **`railway.toml`** (dans `apps/backend/`)
```toml
[build]
builder = "DOCKERFILE"

[deploy]
healthcheckPath = ""
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
startCommand = "node dist/src/main.js"

[env]
NODE_ENV = "production"
```

### Variables d'Environnement Requises

Vérifiez que ces variables sont configurées dans Railway:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `NODE_ENV=production`
- `PORT` (fourni automatiquement par Railway)

## 📝 Checklist de Déploiement

- [ ] Railway CLI installé (`railway --version`)
- [ ] Authentifié (`railway whoami`)
- [ ] Projet lié (`railway link --project <id>`)
- [ ] Variables d'environnement configurées (`railway variables`)
- [ ] Build réussi (`railway up --ci`)
- [ ] Logs vérifiés (`railway logs`)
- [ ] Migrations appliquées (`railway run -- npx prisma migrate deploy`)
- [ ] Health check OK (`curl https://votre-domaine.railway.app/api/v1/health`)

## 🆘 Support

Si les problèmes persistent:
1. Vérifier les logs: `railway logs --follow`
2. Vérifier le statut: `railway status`
3. Vérifier les variables: `railway variables`
4. Contacter le support Railway si nécessaire

