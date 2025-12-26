# 🚂 Commandes Railway CLI - Déploiement Backend

## 🔐 Étape 1 : Connexion à Railway

**Dans votre terminal** (exécutez manuellement) :

```bash
railway login
```

Cette commande va :
- Ouvrir votre navigateur
- Vous demander de vous connecter à Railway
- Autoriser le CLI à accéder à votre compte

---

## 🔗 Étape 2 : Lier le Projet

Une fois connecté, liez votre projet local au projet Railway :

```bash
cd apps/backend
railway link -p 0e3eb9ba-6846-4e0e-81d2-bd7da54da971
```

---

## 📋 Commandes Utiles Railway CLI

### Voir les services du projet
```bash
railway status
```

### Voir les variables d'environnement
```bash
railway variables
```

### Ajouter une variable d'environnement
```bash
railway variables set JWT_SECRET="votre-secret-ici"
```

### Voir les logs en temps réel
```bash
railway logs
```

### Exécuter une commande dans le service
```bash
railway run "cd apps/backend && pnpm prisma migrate deploy"
```

### Déployer depuis le CLI
```bash
railway up
```

### Ouvrir le dashboard Railway dans le navigateur
```bash
railway open
```

---

## 🎯 Workflow Complet de Déploiement

### 1. Configuration initiale (une seule fois)
```bash
# Se connecter
railway login

# Lier le projet
cd apps/backend
railway link -p 0e3eb9ba-6846-4e0e-81d2-bd7da54da971
```

### 2. Configurer les variables d'environnement

```bash
# Variables obligatoires
railway variables set DATABASE_URL="\${{Postgres.DATABASE_URL}}"
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
railway variables set NODE_ENV="production"
railway variables set PORT="3001"

# Variables optionnelles (selon vos besoins)
railway variables set REDIS_URL="\${{Redis.REDIS_URL}}"
railway variables set FRONTEND_URL="https://app.luneo.app"
railway variables set CORS_ORIGIN="https://app.luneo.app"
railway variables set SENDGRID_API_KEY="SG.xxx..."
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set OPENAI_API_KEY="sk-..."
# ... etc (voir GUIDE_RAILWAY_RAPIDE.md pour la liste complète)
```

### 3. Exécuter les migrations Prisma

```bash
railway run "cd apps/backend && pnpm prisma migrate deploy"
```

### 4. Vérifier le déploiement

```bash
# Voir les logs
railway logs

# Obtenir l'URL du service
railway domain

# Tester le health check
curl $(railway domain)/health
```

---

## 📝 Notes Importantes

1. **Root Directory** : Assurez-vous que dans Railway Dashboard → Settings → Root Directory est configuré sur `apps/backend`

2. **Variables avec références Railway** : Pour utiliser la variable d'une autre ressource (comme PostgreSQL), utilisez la syntaxe `${{Postgres.DATABASE_URL}}` dans l'interface web, ou `\${{Postgres.DATABASE_URL}}` dans le CLI (échappement du `$`)

3. **Migrations** : Les migrations doivent être exécutées après chaque déploiement si le schéma a changé

4. **Logs** : Utilisez `railway logs --follow` pour suivre les logs en temps réel

---

## 🆘 En cas de Problème

### "Unauthorized"
→ Exécutez `railway login` à nouveau

### "Project not found"
→ Vérifiez l'ID du projet avec `railway status` ou dans le Dashboard

### "Command not found: railway"
→ Réinstallez Railway CLI :
```bash
curl -fsSL https://railway.com/install.sh | sh
```

---

## 🔗 Documentation

- Guide rapide : [`GUIDE_RAILWAY_RAPIDE.md`](./GUIDE_RAILWAY_RAPIDE.md)
- Guide complet : [`DEPLOIEMENT_RAILWAY.md`](./DEPLOIEMENT_RAILWAY.md)
- Railway CLI Docs : https://docs.railway.app/develop/cli










