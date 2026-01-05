# 🚂 Guide Complet de Déploiement sur Railway

Ce guide vous explique comment déployer le backend Luneo sur Railway.

> ⚡ **Résumé Rapide** : 
> 1. Créez un projet Railway et connectez votre dépôt Git
> 2. Configurez le Root Directory sur `apps/backend`
> 3. Ajoutez PostgreSQL et Redis comme services
> 4. Configurez toutes les variables d'environnement (voir section 5)
> 5. Déployez et vérifiez que `/health` fonctionne

## 📋 Prérequis

- Un compte [Railway](https://railway.app) (gratuit ou payant)
- Un dépôt Git (GitHub, GitLab, ou Bitbucket) contenant votre code
- Les clés API de tous les services externes (Stripe, SendGrid, Cloudinary, etc.)

---

## 🚀 Étapes de Déploiement

### 1. Préparer le Projet sur Railway

#### Option A : Depuis GitHub/GitLab/Bitbucket (Recommandé)

1. **Connecter votre dépôt**
   - Allez sur [railway.app](https://railway.app)
   - Cliquez sur **"New Project"**
   - Sélectionnez **"Deploy from GitHub repo"** (ou GitLab/Bitbucket)
   - Autorisez Railway à accéder à votre dépôt
   - Sélectionnez le dépôt `luneo-platform`

2. **Configurer le service Backend**
   - Railway détectera automatiquement que c'est un projet Node.js
   - Sélectionnez le dossier `apps/backend` comme **Root Directory**
   - Ou créez un nouveau service et spécifiez `apps/backend` comme racine

#### Option B : Depuis le CLI Railway

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Initialiser le projet
railway init

# Lier le projet à votre service Railway
railway link
```

---

### 2. Configuration du Build

Railway utilise les fichiers de configuration suivants dans `apps/backend/` :

- **`railway.toml`** : Configuration générale Railway
- **`nixpacks.toml`** : Configuration du build (utilisé par Nixpacks builder)

La configuration est déjà optimisée pour :
- Utiliser **pnpm** (gestionnaire de paquets du monorepo)
- Installer depuis la racine du monorepo
- Générer le client Prisma
- Builder l'application NestJS
- Lancer le serveur avec la bonne commande

**Fichiers de configuration** :

`apps/backend/railway.toml` :
```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
PORT = "3001"
```

`apps/backend/nixpacks.toml` :
```toml
[phases.setup]
nixPkgs = ["nodejs-20.x", "pnpm"]

[phases.install]
cmds = [
  "cd ../.. && pnpm install --frozen-lockfile",
  "cd apps/backend && pnpm prisma generate"
]

[phases.build]
cmds = [
  "cd apps/backend && pnpm run build"
]

[start]
cmd = "cd apps/backend && node dist/src/main.js"
```

---

### 3. Ajouter PostgreSQL sur Railway

1. **Dans votre projet Railway**
   - Cliquez sur **"+ New"**
   - Sélectionnez **"Database"**
   - Choisissez **"Add PostgreSQL"**

2. **Récupérer l'URL de connexion**
   - Railway générera automatiquement une variable d'environnement `DATABASE_URL`
   - Elle sera automatiquement liée à votre service backend

3. **Exécuter les migrations Prisma**
   - Allez dans votre service backend
   - Ouvrez l'onglet **"Variables"**
   - Ajoutez une variable d'environnement temporaire :
     ```
     RUN_MIGRATIONS=true
     ```
**Option A : Via Railway CLI (Recommandé)**
   ```bash
   # Se connecter au service
   railway link
   
   # Exécuter les migrations
   railway run --service backend "cd apps/backend && pnpm prisma migrate deploy"
   ```

**Option B : Via l'interface Railway**
   1. Allez dans votre service backend
   2. Ouvrez l'onglet **"Deployments"**
   3. Cliquez sur **"..."** → **"Open Shell"**
   4. Exécutez :
      ```bash
      cd apps/backend
      pnpm prisma migrate deploy
      ```

---

### 4. Ajouter Redis (Optionnel mais Recommandé)

1. **Dans votre projet Railway**
   - Cliquez sur **"+ New"**
   - Sélectionnez **"Database"**
   - Choisissez **"Add Redis"**

2. **Récupérer l'URL**
   - Railway générera automatiquement `REDIS_URL`
   - Elle sera liée automatiquement à votre backend

---

### 5. Configurer les Variables d'Environnement

Dans Railway, allez dans votre service backend → **"Variables"** et ajoutez toutes ces variables :

#### 🔐 **Variables OBLIGATOIRES**

```env
# Database (générée automatiquement par Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (si vous avez ajouté Redis)
REDIS_URL=${{Redis.REDIS_URL}}

# JWT - CRITIQUE : Générer des secrets sécurisés
JWT_SECRET=<générez-un-secret-de-32-caractères-minimum>
JWT_REFRESH_SECRET=<générez-un-secret-de-32-caractères-minimum>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application
NODE_ENV=production
PORT=3001
API_PREFIX=/api
```

#### 🔧 **Variables RECOMMANDÉES**

```env
# Frontend URL (pour CORS et redirections)
FRONTEND_URL=https://app.luneo.app
CORS_ORIGIN=https://app.luneo.app,https://luneo.app

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

#### 💳 **Stripe (si utilisé)**

```env
STRIPE_SECRET_KEY=sk_live_... (ou sk_test_... en développement)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=https://app.luneo.app/dashboard/billing/success
STRIPE_CANCEL_URL=https://app.luneo.app/dashboard/billing/cancel
```

#### 📧 **SendGrid (Email)**

```env
SENDGRID_API_KEY=SG.xxx...
SENDGRID_DOMAIN=luneo.app
SENDGRID_FROM_NAME=Luneo
SENDGRID_FROM_EMAIL=no-reply@luneo.app
SENDGRID_REPLY_TO=support@luneo.app
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FROM=Luneo <no-reply@luneo.app>
DOMAIN_VERIFIED=true
```

#### 🖼️ **Cloudinary (Stockage d'images)**

```env
CLOUDINARY_CLOUD_NAME=votre-cloud-name
CLOUDINARY_API_KEY=votre-api-key
CLOUDINARY_API_SECRET=votre-api-secret
```

#### 🤖 **OpenAI (IA)**

```env
OPENAI_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_... (optionnel)
```

#### 🔐 **OAuth (Google/GitHub)**

```env
GOOGLE_CLIENT_ID=votre-google-client-id
GOOGLE_CLIENT_SECRET=votre-google-client-secret
GITHUB_CLIENT_ID=votre-github-client-id
GITHUB_CLIENT_SECRET=votre-github-client-secret
```

#### 📊 **Monitoring (Sentry)**

```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production
```

---

### 6. Générer les Secrets JWT

**⚠️ IMPORTANT** : Utilisez des secrets forts et uniques pour la production !

```bash
# Option 1 : Générer avec OpenSSL
openssl rand -base64 32

# Option 2 : Générer avec Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3 : Utiliser un générateur en ligne
# https://randomkeygen.com/
```

Utilisez deux secrets différents pour `JWT_SECRET` et `JWT_REFRESH_SECRET`.

---

### 7. Configuration du Root Directory

**Important pour les monorepos** :

1. Dans Railway, ouvrez votre service backend
2. Allez dans **"Settings"**
3. Sous **"Root Directory"**, entrez : `apps/backend`
   - ⚠️ **Important** : Railway doit être configuré avec `apps/backend` comme root directory
   - Les fichiers `railway.toml` et `nixpacks.toml` sont configurés pour remonter à la racine du monorepo (`cd ../..`) pour installer les dépendances

4. **Alternative** : Si Railway est configuré à la racine du monorepo, vous devrez ajuster les commandes dans `nixpacks.toml`

---

### 8. Déployer

#### Via l'interface Railway :
- Railway déploie automatiquement à chaque push sur votre branche principale
- Ou cliquez sur **"Deploy"** dans l'interface

#### Via Railway CLI :
```bash
railway up
```

---

### 9. Vérifier le Déploiement

1. **Vérifier les logs**
   - Allez dans **"Deployments"** → Sélectionnez le dernier déploiement
   - Vérifiez qu'il n'y a pas d'erreurs

2. **Tester l'endpoint de health check**
   ```bash
   curl https://votre-app.railway.app/health
   ```
   Devrait retourner :
   ```json
   {
     "status": "ok",
     "timestamp": "2024-..."
   }
   ```

3. **Vérifier la documentation Swagger** (si non en production)
   - `https://votre-app.railway.app/api/docs`

---

### 10. Configurer un Domaine Personnalisé (Optionnel)

1. Dans Railway, ouvrez votre service
2. Allez dans **"Settings"** → **"Domains"**
3. Cliquez sur **"Generate Domain"** pour obtenir un domaine Railway
4. Ou ajoutez votre propre domaine :
   - Cliquez sur **"Custom Domain"**
   - Entrez votre domaine (ex: `api.luneo.app`)
   - Suivez les instructions pour configurer le DNS

**Configuration DNS** :
```
Type: CNAME
Name: api (ou @ pour la racine)
Value: [domaine-railway].railway.app
```

---

## 🔧 Résolution de Problèmes

### Erreur : "Cannot find module"
**Solution** : Vérifiez que le Root Directory est bien configuré sur `apps/backend`

### Erreur : "Prisma Client not generated"
**Solution** : Le fichier `nixpacks.toml` inclut déjà la génération de Prisma. Vérifiez qu'il contient :
```toml
[phases.install]
cmds = [
  "cd ../.. && pnpm install --frozen-lockfile",
  "cd apps/backend && pnpm prisma generate"
]
```

Si le problème persiste, vérifiez que le Root Directory est bien configuré sur `apps/backend`.

### Erreur : "DATABASE_URL not found"
**Solution** : 
1. Vérifiez que PostgreSQL est bien ajouté au projet
2. Vérifiez que la variable `DATABASE_URL` utilise la référence Railway : `${{Postgres.DATABASE_URL}}`

### Erreur : "Port already in use"
**Solution** : Railway définit automatiquement `PORT`. Assurez-vous que votre code utilise `process.env.PORT` et non un port fixe.

### Build échoue avec pnpm
**Solution** : Vérifiez que votre `package.json` racine contient :
```json
{
  "packageManager": "pnpm@8.10.0"
}
```

---

## 📊 Monitoring et Logs

### Voir les logs en temps réel
```bash
railway logs --follow
```

### Voir les logs dans l'interface
- Allez dans votre service → **"Deployments"** → Cliquez sur un déploiement → **"View Logs"**

---

## 🔄 Déploiement Continu (CI/CD)

Railway déploie automatiquement à chaque push sur votre branche principale.

Pour déployer une branche spécifique :
1. Allez dans **"Settings"** → **"Source"**
2. Sélectionnez la branche souhaitée

---

## 💰 Coûts Railway

- **Gratuit** : $5 de crédits gratuits par mois
- **Pro** : $20/mois avec plus de ressources
- PostgreSQL : ~$5/mois pour 1 GB
- Redis : ~$5/mois pour 256 MB

---

## ✅ Checklist de Déploiement

- [ ] Projet créé sur Railway
- [ ] Dépôt Git connecté
- [ ] Root Directory configuré sur `apps/backend`
- [ ] PostgreSQL ajouté et `DATABASE_URL` configuré
- [ ] Redis ajouté (optionnel mais recommandé)
- [ ] Migrations Prisma exécutées
- [ ] Toutes les variables d'environnement ajoutées
- [ ] Secrets JWT générés et configurés
- [ ] Build réussi sans erreurs
- [ ] Health check fonctionne (`/health`)
- [ ] Domain personnalisé configuré (si nécessaire)
- [ ] CORS configuré correctement
- [ ] Logs vérifiés sans erreurs critiques

---

## 📞 Support

- Documentation Railway : https://docs.railway.app
- Discord Railway : https://discord.gg/railway

---

## 🎉 Une fois Déployé

Votre API sera disponible à :
- **Health Check** : `https://votre-app.railway.app/health`
- **API** : `https://votre-app.railway.app/api`
- **Swagger** : `https://votre-app.railway.app/api/docs` (si non en production)

N'oubliez pas de mettre à jour votre frontend avec la nouvelle URL de l'API !




















