# 🚀 GUIDE COMPLET DE DÉPLOIEMENT VERCEL

**Date**: Novembre 2025  
**Projet**: Luneo Platform Frontend  
**Statut**: ✅ Prêt pour déploiement

---

## 📋 TABLE DES MATIÈRES

1. [Vérification Pré-Déploiement](#vérification-pré-déploiement)
2. [Configuration Vercel](#configuration-vercel)
3. [Variables d'Environnement](#variables-denvironnement)
4. [Déploiement](#déploiement)
5. [Vérification Post-Déploiement](#vérification-post-déploiement)
6. [Dépannage](#dépannage)

---

## ✅ VÉRIFICATION PRÉ-DÉPLOIEMENT

### 1. Vérifier que le projet build correctement

```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend

# Installer les dépendances
npm install

# Build de test
npm run build

# Vérifier qu'il n'y a pas d'erreurs
```

### 2. Vérifier les fichiers de configuration

- ✅ `vercel.json` - Configuration Vercel présente
- ✅ `next.config.mjs` - Configuration Next.js présente
- ✅ `package.json` - Scripts de build présents
- ✅ `public/favicon.svg` - Favicon présent
- ✅ `public/manifest.json` - Manifest PWA présent

### 3. Vérifier la structure du projet

```
apps/frontend/
├── src/
│   ├── app/
│   ├── components/
│   └── ...
├── public/
│   ├── favicon.svg ✅
│   ├── icon.svg ✅
│   ├── manifest.json ✅
│   └── ...
├── vercel.json ✅
├── next.config.mjs ✅
└── package.json ✅
```

---

## 🔧 CONFIGURATION VERCEL

### Option 1: Déploiement via Dashboard Vercel (Recommandé)

#### Étape 1: Se connecter à Vercel

1. Aller sur https://vercel.com/dashboard
2. Se connecter avec votre compte GitHub/GitLab/Bitbucket

#### Étape 2: Importer le projet

1. Cliquer sur **"Add New"** → **"Project"**
2. Sélectionner le repository `luneo-platform`
3. Configurer le projet:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/frontend`
   - **Build Command**: `npm run build` (ou laisser vide pour auto-détection)
   - **Output Directory**: `.next` (ou laisser vide pour auto-détection)
   - **Install Command**: `npm install` (ou laisser vide pour auto-détection)

#### Étape 3: Configurer les variables d'environnement

Voir section [Variables d'Environnement](#variables-denvironnement) ci-dessous.

#### Étape 4: Déployer

1. Cliquer sur **"Deploy"**
2. Attendre la fin du build
3. Vérifier l'URL de déploiement

---

### Option 2: Déploiement via CLI Vercel

#### Étape 1: Installer Vercel CLI

```bash
npm install -g vercel
```

#### Étape 2: Se connecter

```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
vercel login
```

#### Étape 3: Lier le projet

```bash
vercel link
```

Suivre les instructions pour lier à un projet existant ou créer un nouveau projet.

#### Étape 4: Configurer les variables d'environnement

```bash
# Ajouter une variable
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Ou ajouter depuis un fichier .env
vercel env pull .env.local
```

#### Étape 5: Déployer

```bash
# Déploiement preview
vercel

# Déploiement production
vercel --prod
```

---

## 🔐 VARIABLES D'ENVIRONNEMENT

### Variables Critiques (OBLIGATOIRES)

Ces variables doivent être configurées dans Vercel Dashboard → Settings → Environment Variables

#### Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=https://obrijgptqztacolemsbk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Où trouver**:
- URL: https://supabase.com/dashboard/project/obrijgptqztacolemsbk/settings/api
- Anon Key: Section "Project API keys" → "anon public"
- Service Role Key: Section "Project API keys" → "service_role"

#### Application

```bash
NEXT_PUBLIC_API_URL=https://app.luneo.app/api
NEXT_PUBLIC_APP_URL=https://app.luneo.app
```

#### OAuth

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23liJmVOHyn8tfxgLi
GITHUB_CLIENT_SECRET=81bbea63bfc5651e048e5e7f62f69c5d4aad55f9
```

#### Stripe

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Où trouver**: https://dashboard.stripe.com/apikeys

### Variables Optionnelles (Recommandées)

#### OpenAI

```bash
OPENAI_API_KEY=sk-proj-...
```

#### Cloudinary

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=deh4aokbx
CLOUDINARY_API_KEY=541766291559917
CLOUDINARY_API_SECRET=s0yc_QR4w9IsM6_HRq2hM5SDnfI
```

#### SendGrid (Emails)

```bash
SENDGRID_API_KEY=SG....
SENDGRID_DOMAIN=luneo.app
SENDGRID_FROM_NAME=Luneo
SENDGRID_FROM_EMAIL=no-reply@luneo.app
```

#### Redis (Upstash)

```bash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

#### Sentry (Monitoring)

```bash
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
```

### Configuration dans Vercel Dashboard

1. Aller sur: https://vercel.com/dashboard
2. Sélectionner votre projet
3. **Settings** → **Environment Variables**
4. Pour chaque variable:
   - Cliquer **"Add New"**
   - **Name**: Nom de la variable
   - **Value**: Valeur de la variable
   - **Environments**: Sélectionner **"Production, Preview, and Development"**
   - Cliquer **"Save"**

---

## 🚀 DÉPLOIEMENT

### Méthode 1: Déploiement Automatique (Git)

Si votre projet est lié à GitHub/GitLab/Bitbucket:

1. **Push sur la branche `main`**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Vercel déploie automatiquement**
   - Le déploiement démarre automatiquement
   - Vous recevez une notification
   - URL disponible dans le dashboard

### Méthode 2: Déploiement Manuel (CLI)

```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend

# Déploiement preview
vercel

# Déploiement production
vercel --prod
```

### Méthode 3: Déploiement via GitHub Actions

Le workflow CI/CD configuré déploie automatiquement:
- **Preview**: Sur chaque Pull Request
- **Production**: Sur push vers `main`

---

## ✅ VÉRIFICATION POST-DÉPLOIEMENT

### 1. Vérifier le Build

Dans Vercel Dashboard → **Deployments**:
- ✅ Build réussi (statut vert)
- ✅ Pas d'erreurs dans les logs
- ✅ Temps de build raisonnable (< 5 min)

### 2. Tester l'Application

#### Tests Basiques

```bash
# URL de production
https://app.luneo.app

# Tests à effectuer:
1. ✅ Page d'accueil charge
2. ✅ Navigation fonctionne
3. ✅ Page login accessible
4. ✅ Page register accessible
5. ✅ Favicon s'affiche
6. ✅ Pas d'erreurs console
```

#### Tests Fonctionnels

1. **Authentification**
   - [ ] Connexion email/password
   - [ ] Connexion Google OAuth
   - [ ] Connexion GitHub OAuth
   - [ ] Inscription nouveau compte

2. **Dashboard**
   - [ ] Dashboard charge après login
   - [ ] Statistiques s'affichent
   - [ ] Navigation fonctionne

3. **Fonctionnalités**
   - [ ] AI Studio accessible
   - [ ] Products page charge
   - [ ] Settings accessible
   - [ ] Billing accessible

### 3. Vérifier les Métriques

Dans Vercel Dashboard → **Analytics**:
- ✅ Temps de chargement < 3s
- ✅ Core Web Vitals dans le vert
- ✅ Pas d'erreurs 500

### 4. Vérifier les Logs

Dans Vercel Dashboard → **Logs**:
- ✅ Pas d'erreurs critiques
- ✅ Logs de démarrage OK
- ✅ Connexions Supabase OK

---

## 🔍 DÉPANNAGE

### Erreur: Build Failed

**Symptômes**: Build échoue dans Vercel

**Solutions**:
1. Vérifier les logs de build dans Vercel Dashboard
2. Vérifier que `npm run build` fonctionne localement
3. Vérifier les variables d'environnement
4. Vérifier les dépendances dans `package.json`

### Erreur: Environment Variables Missing

**Symptômes**: Application ne fonctionne pas, erreurs dans console

**Solutions**:
1. Vérifier toutes les variables dans Vercel Dashboard
2. Vérifier que les variables commencent par `NEXT_PUBLIC_` sont bien publiques
3. Redéployer après ajout de variables

### Erreur: 404 sur certaines pages

**Symptômes**: Certaines routes retournent 404

**Solutions**:
1. Vérifier `vercel.json` pour les redirects
2. Vérifier que les pages existent dans `src/app/`
3. Vérifier la configuration Next.js

### Erreur: Supabase Connection Failed

**Symptômes**: Erreurs de connexion à Supabase

**Solutions**:
1. Vérifier `NEXT_PUBLIC_SUPABASE_URL`
2. Vérifier `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Vérifier que le projet Supabase est actif
4. Vérifier les RLS policies dans Supabase

### Erreur: API Calls Failed

**Symptômes**: Appels API échouent

**Solutions**:
1. Vérifier `NEXT_PUBLIC_API_URL`
2. Vérifier que le backend est déployé
3. Vérifier CORS dans le backend
4. Vérifier les logs backend

---

## 📊 CHECKLIST DE DÉPLOIEMENT

### Avant Déploiement

- [ ] Build local réussi (`npm run build`)
- [ ] Tests passent (`npm test`)
- [ ] Linting OK (`npm run lint`)
- [ ] Type checking OK (`npm run type-check`)
- [ ] Variables d'environnement préparées
- [ ] Favicon et icônes présents
- [ ] `vercel.json` configuré

### Configuration Vercel

- [ ] Projet créé dans Vercel
- [ ] Repository lié
- [ ] Root directory: `apps/frontend`
- [ ] Build command: `npm run build`
- [ ] Toutes les variables d'environnement ajoutées
- [ ] Domaine personnalisé configuré (si nécessaire)

### Après Déploiement

- [ ] Build réussi
- [ ] Application accessible
- [ ] Page d'accueil charge
- [ ] Navigation fonctionne
- [ ] Authentification fonctionne
- [ ] Pas d'erreurs console
- [ ] Favicon s'affiche
- [ ] Analytics activés
- [ ] Speed Insights activés

---

## 🔗 LIENS UTILES

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Documentation Vercel**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Supabase Dashboard**: https://supabase.com/dashboard/project/obrijgptqztacolemsbk
- **Stripe Dashboard**: https://dashboard.stripe.com

---

## 📝 NOTES IMPORTANTES

### Build Command

Vercel détecte automatiquement Next.js, mais vous pouvez spécifier:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

### Root Directory

Si votre projet est dans un monorepo:
- **Root Directory**: `apps/frontend`
- Vercel cherchera `package.json` dans ce répertoire

### Variables d'Environnement

- Les variables `NEXT_PUBLIC_*` sont exposées au client
- Les autres variables sont uniquement côté serveur
- Redéployer après modification de variables

### Domaine Personnalisé

Pour configurer `app.luneo.app`:
1. Vercel Dashboard → **Settings** → **Domains**
2. Ajouter `app.luneo.app`
3. Configurer DNS selon instructions Vercel

---

## 🎯 COMMANDES RAPIDES

```bash
# Déploiement complet
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
vercel --prod

# Vérifier les variables
vercel env ls

# Voir les logs
vercel logs

# Ouvrir le dashboard
vercel dashboard
```

---

**Une fois déployé, votre application sera accessible sur l'URL fournie par Vercel !** 🚀


