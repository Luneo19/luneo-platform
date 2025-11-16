# 🚀 DÉPLOIEMENT VERCEL - GUIDE ÉTAPE PAR ÉTAPE

**Date**: Novembre 2025  
**Projet**: Luneo Platform  
**Durée estimée**: 15-20 minutes

---

## 📋 PRÉREQUIS

- ✅ Compte Vercel (https://vercel.com)
- ✅ Compte GitHub/GitLab/Bitbucket avec repository `luneo-platform`
- ✅ Variables d'environnement préparées (voir `VARIABLES_VERCEL_COMPLÈTES.md`)

---

## 🎯 ÉTAPE 1: VÉRIFICATION LOCALE (5 min)

### 1.1 Vérifier le build local

```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend

# Installer les dépendances
npm install

# Build de test
npm run build

# Vérifier qu'il n'y a pas d'erreurs
```

**✅ Résultat attendu**: Build réussi sans erreurs

### 1.2 Vérifier les fichiers critiques

```bash
# Vérifier que ces fichiers existent
ls -la vercel.json
ls -la next.config.mjs
ls -la package.json
ls -la public/favicon.svg
ls -la public/manifest.json
```

**✅ Résultat attendu**: Tous les fichiers présents

---

## 🔧 ÉTAPE 2: CONFIGURATION VERCEL (10 min)

### 2.1 Se connecter à Vercel

1. Aller sur **https://vercel.com/dashboard**
2. Se connecter avec votre compte GitHub/GitLab/Bitbucket

### 2.2 Importer le projet

1. Cliquer sur **"Add New"** → **"Project"**
2. Dans la liste des repositories, trouver **`luneo-platform`**
3. Cliquer sur **"Import"**

### 2.3 Configurer le projet

**Configuration requise**:

- **Framework Preset**: Next.js (auto-détecté)
- **Root Directory**: `apps/frontend` ⚠️ **IMPORTANT**
- **Build Command**: `npm run build` (ou laisser vide)
- **Output Directory**: `.next` (ou laisser vide)
- **Install Command**: `npm install` (ou laisser vide)

**⚠️ ATTENTION**: Le **Root Directory** doit être `apps/frontend` car le projet est dans un monorepo !

### 2.4 Configurer les variables d'environnement

**Avant de déployer**, configurer les variables critiques :

1. Dans la section **"Environment Variables"**, cliquer **"Add"**
2. Ajouter les variables une par une (voir `VARIABLES_VERCEL_COMPLÈTES.md`)

**Variables minimales à configurer**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://obrijgptqztacolemsbk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[votre-clé-anon]
SUPABASE_SERVICE_ROLE_KEY=[votre-clé-service-role]
NEXT_PUBLIC_API_URL=https://app.luneo.app/api
NEXT_PUBLIC_APP_URL=https://app.luneo.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23liJmVOHyn8tfxgLi
GITHUB_CLIENT_SECRET=81bbea63bfc5651e048e5e7f62f69c5d4aad55f9
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Pour chaque variable**:
- **Name**: Nom de la variable
- **Value**: Valeur de la variable
- **Environments**: Sélectionner **"Production, Preview, and Development"**
- Cliquer **"Save"**

---

## 🚀 ÉTAPE 3: DÉPLOIEMENT (5 min)

### Option A: Déploiement via Dashboard

1. Après configuration, cliquer sur **"Deploy"**
2. Attendre la fin du build (2-5 minutes)
3. Vérifier l'URL de déploiement fournie

### Option B: Déploiement via CLI

```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend

# Installer Vercel CLI si nécessaire
npm install -g vercel

# Se connecter
vercel login

# Déployer (preview)
vercel

# Ou déployer en production
vercel --prod
```

### Option C: Déploiement via Script

```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
./scripts/deploy-vercel.sh
```

---

## ✅ ÉTAPE 4: VÉRIFICATION POST-DÉPLOIEMENT (5 min)

### 4.1 Vérifier le Build

Dans Vercel Dashboard → **Deployments**:
- ✅ Statut: **Ready** (vert)
- ✅ Build time: < 5 minutes
- ✅ Pas d'erreurs dans les logs

### 4.2 Tester l'Application

**URL de déploiement**: Vercel fournit une URL comme `https://luneo-platform-xxx.vercel.app`

**Tests à effectuer**:

1. **Page d'accueil**
   - [ ] Charge correctement
   - [ ] Favicon s'affiche
   - [ ] Pas d'erreurs console (F12)

2. **Navigation**
   - [ ] Menu fonctionne
   - [ ] Liens fonctionnent
   - [ ] Pas de 404

3. **Authentification**
   - [ ] Page `/login` accessible
   - [ ] Page `/register` accessible
   - [ ] Formulaire de connexion présent

4. **Dashboard** (après connexion)
   - [ ] Dashboard charge
   - [ ] Navigation fonctionne
   - [ ] Pas d'erreurs

### 4.3 Vérifier les Métriques

Dans Vercel Dashboard → **Analytics**:
- ✅ Temps de chargement < 3s
- ✅ Core Web Vitals dans le vert
- ✅ Pas d'erreurs 500

---

## 🔍 DÉPANNAGE RAPIDE

### Erreur: "Build Failed"

**Cause**: Erreur dans le code ou configuration

**Solution**:
1. Vérifier les logs dans Vercel Dashboard
2. Tester le build local: `npm run build`
3. Vérifier les erreurs TypeScript: `npm run type-check`

### Erreur: "Root Directory not found"

**Cause**: Root Directory mal configuré

**Solution**:
1. Vercel Dashboard → Settings → General
2. Vérifier **Root Directory**: `apps/frontend`
3. Redéployer

### Erreur: "Environment Variables Missing"

**Cause**: Variables non configurées

**Solution**:
1. Vercel Dashboard → Settings → Environment Variables
2. Ajouter les variables manquantes
3. Redéployer

### Erreur: "Supabase Connection Failed"

**Cause**: Variables Supabase incorrectes

**Solution**:
1. Vérifier `NEXT_PUBLIC_SUPABASE_URL`
2. Vérifier `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Vérifier que le projet Supabase est actif

---

## 📊 CHECKLIST COMPLÈTE

### Avant Déploiement
- [ ] Build local réussi
- [ ] Tests passent
- [ ] Linting OK
- [ ] Type checking OK
- [ ] Variables d'environnement préparées
- [ ] Favicon présent
- [ ] `vercel.json` configuré

### Configuration Vercel
- [ ] Projet créé
- [ ] Repository lié
- [ ] Root Directory: `apps/frontend`
- [ ] Variables d'environnement ajoutées
- [ ] Domaine configuré (si nécessaire)

### Après Déploiement
- [ ] Build réussi
- [ ] Application accessible
- [ ] Page d'accueil charge
- [ ] Navigation fonctionne
- [ ] Authentification fonctionne
- [ ] Pas d'erreurs console
- [ ] Favicon s'affiche
- [ ] Analytics activés

---

## 🎯 PROCHAINES ÉTAPES

Une fois déployé avec succès:

1. **Configurer le domaine personnalisé** (si nécessaire)
   - Vercel Dashboard → Settings → Domains
   - Ajouter `app.luneo.app`
   - Configurer DNS

2. **Configurer les webhooks**
   - Stripe webhooks → URL Vercel
   - Supabase webhooks → URL Vercel

3. **Activer le monitoring**
   - Vercel Analytics (automatique)
   - Sentry (si configuré)
   - Speed Insights (automatique)

---

## 📞 SUPPORT

- **Documentation Vercel**: https://vercel.com/docs
- **Documentation Next.js**: https://nextjs.org/docs/deployment
- **Vercel Support**: https://vercel.com/support

---

**Une fois toutes les étapes complétées, votre application sera en ligne !** 🎉


