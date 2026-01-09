# 🚀 Instructions Finales - Déploiement Railway

## ⚠️ Problème Identifié

Le token Railway fourni (`98f816d7-42b1-4095-966e-81b2322482e0`) retourne "Not Authorized" sur l'API Railway. Railway CLI nécessite un **login interactif** pour fonctionner.

## ✅ Solution : Login Interactif Railway CLI

### Étape 1 : Login Railway

```bash
railway login
```

Cette commande va :
- Ouvrir votre navigateur
- Vous demander d'autoriser Railway CLI
- Configurer automatiquement l'authentification

### Étape 2 : Lier le Projet

```bash
railway link --project 0e3eb9ba-6846-4e0e-81d2-bd7da54da971
```

### Étape 3 : Vérifier le Statut

```bash
railway status
```

Vous devriez voir :
- Le projet lié
- Les services disponibles
- Le statut actuel

### Étape 4 : Déployer

```bash
railway up --ci
```

Cette commande va :
- Uploader le code
- Builder le projet
- Déployer sur Railway

### Étape 5 : Analyser les Logs

```bash
# Logs en temps réel
railway logs --follow

# Logs de build
railway logs --build

# Logs d'un service spécifique
railway logs --service <service-name>
```

### Étape 6 : Appliquer les Migrations (si nécessaire)

```bash
cd apps/backend
railway run -- npx prisma migrate deploy
```

## 📋 Commandes Utiles

```bash
# Voir le domaine
railway domain

# Voir les variables d'environnement
railway variables

# Voir les services
railway service list

# Redéployer le dernier déploiement
railway redeploy

# Ouvrir le dashboard Railway
railway open
```

## 🔍 Diagnostic des Erreurs

### Si `railway login` échoue :

1. Vérifiez que Railway CLI est installé :
   ```bash
   railway --version
   ```

2. Si non installé :
   ```bash
   npm i -g @railway/cli
   # ou
   brew install railway
   ```

### Si le déploiement échoue :

1. Vérifiez les logs :
   ```bash
   railway logs --build
   ```

2. Vérifiez les variables d'environnement :
   ```bash
   railway variables
   ```

3. Vérifiez la configuration :
   - `railway.json` (racine)
   - `railway.toml` (dans `apps/backend/`)

## 📊 État Actuel

- ✅ **Frontend (Vercel)** : Déployé avec succès
  - URL: https://frontend-80u3mc4ht-luneos-projects.vercel.app

- ⏳ **Backend (Railway)** : En attente d'authentification
  - Project ID: `0e3eb9ba-6846-4e0e-81d2-bd7da54da971`
  - Action requise: `railway login` puis `railway up --ci`

## 🎯 Checklist Rapide

- [ ] `railway login` (authentification)
- [ ] `railway link --project 0e3eb9ba-6846-4e0e-81d2-bd7da54da971` (lier le projet)
- [ ] `railway status` (vérifier)
- [ ] `railway up --ci` (déployer)
- [ ] `railway logs --follow` (surveiller)
- [ ] `railway run -- npx prisma migrate deploy` (migrations)

Une fois authentifié avec `railway login`, toutes les autres commandes fonctionneront automatiquement !


