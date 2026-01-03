# 🚀 Déploiement sur Railway - Guide Complet

## 📋 Prérequis

1. Compte Railway créé
2. Projet Railway créé
3. Base de données PostgreSQL ajoutée (via Railway)
4. Variables d'environnement configurées

---

## 🔧 Configuration Railway

### 1. **Fichiers de Configuration Créés**

- ✅ `railway.json` - Configuration principale
- ✅ `railway.toml` - Configuration alternative
- ✅ `apps/backend/railway.json` - Configuration spécifique backend

### 2. **Structure du Projet**

Railway détectera automatiquement :
- **Root directory :** `apps/backend`
- **Build command :** `pnpm install && pnpm prisma generate && pnpm build`
- **Start command :** `pnpm start`
- **Port :** Automatiquement détecté depuis `process.env.PORT`

---

## 📝 Étapes de Déploiement

### Étape 1 : Créer le Projet sur Railway

1. Aller sur [railway.app](https://railway.app)
2. Cliquer sur "New Project"
3. Sélectionner "Deploy from GitHub repo"
4. Choisir votre repository `luneo-platform`
5. Railway détectera automatiquement le projet

### Étape 2 : Configurer la Base de Données

1. Dans votre projet Railway, cliquer sur "New"
2. Sélectionner "Database" → "PostgreSQL"
3. Railway créera automatiquement une base PostgreSQL
4. **Important :** Noter la variable `DATABASE_URL` générée

### Étape 3 : Configurer les Variables d'Environnement

Dans les **Settings** → **Variables** de votre service backend, ajouter :

#### Variables Requises

```bash
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Node Environment
NODE_ENV=production

# Port (fourni automatiquement par Railway)
PORT=${{PORT}}

# JWT
JWT_SECRET=votre-secret-jwt-super-securise
JWT_EXPIRES_IN=7d

# Redis (si utilisé)
REDIS_URL=${{Redis.REDIS_URL}}  # Si vous ajoutez Redis

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=votre-cloud-name
CLOUDINARY_API_KEY=votre-api-key
CLOUDINARY_API_SECRET=votre-api-secret

# Email (SendGrid ou autre)
SENDGRID_API_KEY=SG....
FROM_EMAIL=noreply@votre-domaine.com

# Sentry (optionnel mais recommandé)
SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=production

# App
APP_URL=https://votre-backend.railway.app
FRONTEND_URL=https://votre-frontend.vercel.app

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

#### Variables Optionnelles

```bash
# AI Providers
OPENAI_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Monitoring
LOG_LEVEL=info
```

### Étape 4 : Configurer le Build

Railway détectera automatiquement :
- **Root Directory :** `apps/backend`
- **Build Command :** `pnpm install && pnpm prisma generate && pnpm build`
- **Start Command :** `pnpm start`

**Si Railway ne détecte pas automatiquement :**

1. Aller dans **Settings** → **Build**
2. Définir :
   - **Root Directory :** `apps/backend`
   - **Build Command :** `pnpm install && pnpm prisma generate && pnpm build`
   - **Start Command :** `pnpm start`

### Étape 5 : Migration Prisma

Railway exécutera automatiquement `prisma generate` pendant le build.

**Pour les migrations :**

1. Option 1 : Script post-deploy (recommandé)
   - Créer un script qui exécute les migrations après le déploiement
   
2. Option 2 : Migration manuelle
   ```bash
   railway run pnpm prisma migrate deploy
   ```

### Étape 6 : Déployer

1. Railway déploiera automatiquement à chaque push sur la branche principale
2. Ou cliquer sur "Deploy" dans le dashboard Railway
3. Suivre les logs de build et de déploiement

---

## 🔍 Vérifications Post-Déploiement

### 1. Health Check

Vérifier que l'endpoint de santé répond :
```bash
curl https://votre-backend.railway.app/health
```

### 2. Logs

Vérifier les logs dans Railway :
- **Deployments** → Sélectionner le déploiement → **Logs**
- Vérifier qu'il n'y a pas d'erreurs
- Vérifier que Prisma s'est connecté correctement

### 3. Base de Données

Vérifier que les migrations ont été appliquées :
```bash
railway run pnpm prisma migrate status
```

### 4. API

Tester un endpoint :
```bash
curl https://votre-backend.railway.app/api/health
```

---

## 🛠️ Scripts Utiles

### Migration Prisma

```bash
# Via Railway CLI
railway run pnpm prisma migrate deploy

# Ou directement dans Railway
# Settings → Deploy → Add Deploy Hook
# Command: pnpm prisma migrate deploy
```

### Générer Prisma Client

```bash
railway run pnpm prisma generate
```

### Voir les logs

```bash
railway logs
```

### Accéder à la base de données

```bash
railway connect postgres
```

---

## 📊 Configuration Recommandée

### Resources Railway

- **CPU :** 1-2 vCPU (minimum)
- **RAM :** 2-4 GB (minimum)
- **Storage :** 10 GB (pour logs et cache)

### Scaling

- **Auto-scaling :** Activé (recommandé)
- **Min instances :** 1
- **Max instances :** 3-5 (selon trafic)

---

## 🔒 Sécurité

### Variables Sensibles

- ✅ Ne jamais commiter les secrets dans Git
- ✅ Utiliser Railway Variables pour tous les secrets
- ✅ Utiliser `${{Service.VARIABLE}}` pour références entre services

### HTTPS

- ✅ Railway fournit HTTPS automatiquement
- ✅ Certificat SSL géré automatiquement

### CORS

Vérifier que CORS est configuré pour accepter votre frontend :
```typescript
// Dans main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

---

## 🐛 Dépannage

### Erreur : "Cannot find module"

**Solution :** Vérifier que `pnpm install` s'exécute correctement

### Erreur : "Prisma Client not generated"

**Solution :** S'assurer que `pnpm prisma generate` est dans le build command

### Erreur : "Database connection failed"

**Solution :** 
1. Vérifier `DATABASE_URL` dans les variables
2. Vérifier que la base de données est démarrée
3. Vérifier les migrations : `railway run pnpm prisma migrate deploy`

### Erreur : "Port already in use"

**Solution :** Railway fournit automatiquement `PORT`, s'assurer que le code utilise `process.env.PORT`

---

## 📝 Checklist Déploiement

- [ ] Projet Railway créé
- [ ] Base de données PostgreSQL ajoutée
- [ ] Variables d'environnement configurées
- [ ] Root directory configuré (`apps/backend`)
- [ ] Build command configuré
- [ ] Start command configuré
- [ ] Migrations Prisma appliquées
- [ ] Health check fonctionne
- [ ] Logs vérifiés (pas d'erreurs)
- [ ] API testée
- [ ] CORS configuré
- [ ] HTTPS activé (automatique)

---

## 🚀 Déploiement Automatique

### GitHub Integration

1. Connecter votre repo GitHub à Railway
2. Railway déploiera automatiquement à chaque push
3. Configurer la branche de production (généralement `main` ou `production`)

### Deploy Hooks

Pour exécuter les migrations automatiquement :

1. **Settings** → **Deploy** → **Deploy Hooks**
2. Ajouter un hook :
   - **Name :** Run Prisma Migrations
   - **Command :** `pnpm prisma migrate deploy`
   - **Run on :** After Deploy

---

## 📊 Monitoring

### Logs Railway

- Accéder aux logs en temps réel dans le dashboard
- Filtrer par niveau (info, warn, error)
- Exporter les logs si nécessaire

### Métriques

Railway fournit :
- CPU usage
- Memory usage
- Network traffic
- Request count

### Alertes

Configurer des alertes pour :
- Erreurs critiques
- Utilisation CPU > 80%
- Utilisation RAM > 80%
- Taux d'erreur > 5%

---

## ✅ Prêt pour Production

Une fois déployé, votre backend sera accessible sur :
```
https://votre-service.railway.app
```

**Health Check :**
```
https://votre-service.railway.app/health
```

**API :**
```
https://votre-service.railway.app/api/*
```

---

## 🎯 Prochaines Étapes

1. **Tester l'API** avec Postman ou curl
2. **Configurer le frontend** pour pointer vers l'URL Railway
3. **Configurer les webhooks** (Stripe, etc.)
4. **Monitorer les performances**
5. **Configurer les backups** de la base de données

---

**✅ Configuration Railway complète ! Prêt pour déploiement.**

