# 🚨 Solution DATABASE_URL - Action Immédiate Requise

**Date**: 17 novembre 2025  
**Problème**: Backend retourne `FUNCTION_INVOCATION_FAILED` car DATABASE_URL est invalide

---

## 🔴 Problème

Le backend ne peut pas démarrer car `DATABASE_URL` pointe vers `localhost` qui n'existe pas sur Vercel.

**Erreur**: `FUNCTION_INVOCATION_FAILED`

---

## ✅ Solution Rapide: Neon (2 minutes)

### Étape 1: Créer une Base de Données Neon

1. Allez sur **https://neon.tech**
2. Cliquez sur **"Sign Up"** (gratuit)
3. Connectez-vous avec GitHub/Google
4. Cliquez sur **"Create a project"**
5. Donnez un nom (ex: `luneo-platform`)
6. Sélectionnez une région proche
7. Cliquez sur **"Create project"**

### Étape 2: Obtenir la Connection String

1. Une fois le projet créé, vous verrez la **Connection string**
2. Cliquez sur **"Copy"** pour copier l'URL
3. Format: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`

### Étape 3: Configurer dans Vercel

```bash
cd apps/backend

# Supprimer l'ancienne DATABASE_URL
vercel env rm DATABASE_URL production --yes

# Ajouter la nouvelle
vercel env add DATABASE_URL production
# Collez votre URL Neon ici

# Redéployer
vercel --prod
```

### Étape 4: Vérifier

Attendez 60-90 secondes, puis testez:

```bash
curl https://backend-luneos-projects.vercel.app/health
```

---

## ✅ Solution Alternative: Supabase

Si vous avez déjà Supabase configuré:

### Étape 1: Obtenir DATABASE_URL

1. Allez dans votre projet Supabase Dashboard
2. **Settings** > **Database**
3. Dans **Connection string**, sélectionnez **URI**
4. Copiez l'URL complète
5. Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

**Note**: Remplacez `[PASSWORD]` par votre mot de passe de base de données Supabase.

### Étape 2: Configurer dans Vercel

```bash
cd apps/backend
vercel env rm DATABASE_URL production --yes
vercel env add DATABASE_URL production
# Collez votre URL Supabase
vercel --prod
```

---

## 🎯 Résultat Attendu

Une fois `DATABASE_URL` correctement configurée:

- ✅ Backend démarre sans erreur
- ✅ `/health` retourne `{"status":"ok"}`
- ✅ Routes API fonctionnent
- ✅ Connexion à la base de données réussie

---

## 📊 Statut Actuel

- ✅ Variables configurées (JWT_SECRET, JWT_REFRESH_SECRET, REDIS_URL)
- ✅ Build corrigé (Prisma generate)
- ❌ DATABASE_URL invalide (localhost)
- ❌ Backend ne démarre pas

---

## ⚡ Action Immédiate

**Créez une base de données Neon (2 minutes)** et configurez `DATABASE_URL` pour que le backend fonctionne.

---

**Dernière mise à jour**: 17 novembre 2025

