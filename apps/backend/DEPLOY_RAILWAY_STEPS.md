# 🚂 Déploiement Railway - Étapes à Suivre

## ⚠️ IMPORTANT
Les commandes Railway nécessitent un mode interactif (ouverture du navigateur). Exécutez-les **manuellement dans votre terminal**.

---

## 📋 ÉTAPES COMPLÈTES

### 1️⃣ Connexion à Railway (À FAIRE MANUELLEMENT)

```bash
cd apps/backend
railway login
```

Cette commande va :
- Ouvrir votre navigateur
- Vous demander de vous connecter à Railway
- Autoriser le CLI à accéder à votre compte

**⏳ Attendez que le navigateur se ferme et que la commande se termine.**

---

### 2️⃣ Vérifier / Lier le Projet

Une fois connecté, vérifiez si vous avez déjà un projet :

```bash
railway status
```

#### Option A : Vous avez déjà un projet Railway

```bash
# Remplacer <PROJECT_ID> par votre ID de projet
railway link -p <PROJECT_ID>
```

**Pour trouver votre PROJECT_ID :**
- Allez sur https://railway.app
- Ouvrez votre projet
- L'ID est dans l'URL : `https://railway.app/project/<PROJECT_ID>`
- OU : `railway status` affichera l'ID si déjà lié

#### Option B : Créer un nouveau projet

```bash
railway init
```

Suivez les instructions pour créer un nouveau projet.

---

### 3️⃣ Créer une Base de Données PostgreSQL (Si pas déjà fait)

**Via Railway Dashboard :**
1. Allez sur https://railway.app
2. Ouvrez votre projet
3. Cliquez sur **"+ New"**
4. Sélectionnez **"Database"** → **"PostgreSQL"**
5. Railway génère automatiquement `DATABASE_URL`

**⚠️ IMPORTANT :** Notez le nom du service PostgreSQL (ex: "Postgres")

---

### 4️⃣ Configurer les Variables d'Environnement

#### Via Railway CLI :

```bash
# Variables OBLIGATOIRES
railway variables set DATABASE_URL="${{Postgres.DATABASE_URL}}"
railway variables set NODE_ENV="production"
railway variables set PORT="3001"
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_EXPIRES_IN="15m"
railway variables set JWT_REFRESH_EXPIRES_IN="7d"
railway variables set FRONTEND_URL="https://www.luneo.app"
railway variables set CORS_ORIGIN="https://www.luneo.app"
railway variables set API_PREFIX="/api"
```

**⚠️ REMPLACER `Postgres` par le nom réel de votre service PostgreSQL si différent !**

#### Via Railway Dashboard (Alternative) :

1. Allez dans votre projet Railway
2. Ouvrez le service backend
3. Onglet **"Variables"**
4. Ajoutez les variables une par une

**Variables essentielles :**
```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
NODE_ENV = production
PORT = 3001
JWT_SECRET = <généré avec: openssl rand -base64 32>
JWT_REFRESH_SECRET = <généré avec: openssl rand -base64 32>
```

---

### 5️⃣ Configurer le Root Directory

**Dans Railway Dashboard :**
1. Ouvrez votre service backend
2. Settings → **Root Directory**
3. Configurez : `apps/backend` (ou laissez vide si déjà configuré)
4. Sauvegardez

**⚠️ IMPORTANT :** Si vous utilisez le Dockerfile à la racine, le Root Directory doit être `.` (racine)

---

### 6️⃣ Exécuter les Migrations Prisma

```bash
cd apps/backend
railway run pnpm prisma migrate deploy
```

Cette commande va :
- Appliquer toutes les migrations Prisma
- Générer le client Prisma
- Synchroniser le schéma avec la base de données

**⏳ Cette étape peut prendre 1-2 minutes.**

---

### 7️⃣ Déployer l'Application

```bash
railway up
```

Cette commande va :
- Builder l'application
- Créer un container Docker
- Déployer sur Railway
- Démarrer l'application

**⏳ Le déploiement peut prendre 3-5 minutes.**

---

### 8️⃣ Vérifier le Déploiement

#### Voir les logs en temps réel :

```bash
railway logs
```

#### Obtenir l'URL du service :

```bash
railway domain
```

#### Tester le health check :

```bash
# Remplacer <domain> par l'URL obtenue ci-dessus
curl https://<domain>/health
```

Vous devriez voir une réponse JSON avec `{"status": "ok"}`.

---

## ✅ Checklist Post-Déploiement

- [ ] Health check fonctionne : `curl https://<domain>/health`
- [ ] Migrations Prisma appliquées : `railway run pnpm prisma migrate deploy`
- [ ] Variables d'environnement configurées (voir avec `railway variables`)
- [ ] Logs accessibles : `railway logs`
- [ ] Domaine Railway configuré (optionnel)

---

## 🆘 Dépannage

### Erreur : "Unauthorized"
→ Exécutez `railway login` manuellement dans votre terminal

### Erreur : "Project not found"
→ Vérifiez le PROJECT_ID avec `railway status` ou créez un nouveau projet avec `railway init`

### Erreur : "DATABASE_URL not found"
→ Créez PostgreSQL dans Railway Dashboard et configurez `DATABASE_URL = ${{Postgres.DATABASE_URL}}`

### Erreur : "Migrations failed"
→ Vérifiez que `DATABASE_URL` est correct et que PostgreSQL est accessible

### Erreur : "Build failed"
→ Vérifiez les logs : `railway logs`
→ Vérifiez que le Root Directory est correct dans Railway Dashboard

---

## 📊 Prochaines Étapes

Une fois le backend déployé sur Railway :

1. Notez l'URL du backend (ex: `https://backend-production.up.railway.app`)
2. Déployez le frontend sur Vercel
3. Configurez `NEXT_PUBLIC_BACKEND_URL` dans Vercel avec l'URL Railway
4. Testez les endpoints en production

---

## 🔗 Liens Utiles

- Railway Dashboard : https://railway.app
- Documentation Railway : https://docs.railway.app
- Logs Railway : `railway logs`
- Ouvrir Dashboard : `railway open`
