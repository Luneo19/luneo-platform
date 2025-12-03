# ⚡ CONFIGURATION RAPIDE - Sentry & GA4

## 🎯 Objectif: Ajouter les 2 variables dans Vercel en 5 minutes

---

## 📋 ÉTAPE 1: Obtenir le DSN Sentry (2 min)

### Option A: Si vous avez déjà un compte Sentry

1. Aller sur https://sentry.io/
2. Se connecter
3. Sélectionner votre projet (ou créer "luneo-frontend")
4. Aller dans **Settings** → **Projects** → **[votre-projet]** → **Client Keys (DSN)**
5. **Copier le DSN** (format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### Option B: Créer un nouveau compte Sentry

1. Aller sur https://sentry.io/signup/
2. S'inscrire avec votre email
3. Créer un projet **"Next.js"** nommé **"luneo-frontend"**
4. **Copier le DSN** affiché après création

---

## 📋 ÉTAPE 2: Obtenir le Measurement ID GA4 (2 min)

### Option A: Si vous avez déjà un compte GA4

1. Aller sur https://analytics.google.com/
2. Sélectionner votre propriété "Luneo Platform"
3. Aller dans **Admin** (⚙️) → **Data Streams**
4. Cliquer sur votre stream web
5. **Copier le Measurement ID** (format: `G-XXXXXXXXXX`)

### Option B: Créer un nouveau compte GA4

1. Aller sur https://analytics.google.com/
2. Cliquer sur **"Start measuring"**
3. Créer une propriété:
   - Nom: **Luneo Platform**
   - Fuseau horaire: **Europe/Paris**
   - Devise: **EUR**
4. Créer un Data Stream:
   - Type: **Web**
   - URL: **https://luneo.app**
   - Nom: **Luneo Production**
5. **Copier le Measurement ID** (format: `G-XXXXXXXXXX`)

---

## 📋 ÉTAPE 3: Ajouter dans Vercel (1 min)

1. **Aller sur:** https://vercel.com/luneos-projects/frontend/settings/environment-variables

2. **Cliquer sur "Create new"** (onglet en haut)

3. **Ajouter Sentry:**
   - **Key:** `NEXT_PUBLIC_SENTRY_DSN`
   - **Value:** Coller le DSN Sentry
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
   - Cliquer sur **"Save"**

4. **Ajouter Google Analytics:**
   - **Key:** `NEXT_PUBLIC_GA_ID`
   - **Value:** Coller le Measurement ID (ex: `G-XXXXXXXXXX`)
   - **Environments:** ✅ Production, ✅ Preview
   - Cliquer sur **"Save"**

5. **Redéployer:**
   - Aller sur **Deployments**
   - Cliquer sur **"Redeploy"** sur le dernier déploiement
   - Ou faire un commit Git vide: `git commit --allow-empty -m "chore: add monitoring" && git push`

---

## ✅ VÉRIFICATION

### Sentry
1. Aller sur https://luneo.app
2. Ouvrir la console (F12)
3. Vous devriez voir: `Sentry initialized`
4. Dans Sentry Dashboard → Issues, les erreurs apparaîtront

### Google Analytics
1. Aller sur https://luneo.app
2. Ouvrir DevTools (F12) → Network
3. Filtrer par "google-analytics"
4. Vous devriez voir des requêtes vers `www.google-analytics.com`
5. Dans GA4 → Realtime, vous verrez les visiteurs

---

## 🚀 C'EST FAIT !

Votre monitoring est maintenant actif ! 🎉

