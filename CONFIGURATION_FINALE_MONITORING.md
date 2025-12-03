# ✅ CONFIGURATION FINALE - Sentry & GA4

## 🎯 ÉTAT ACTUEL

### ✅ Ce qui est FAIT

1. **Code intégré:**
   - ✅ Composant `GoogleAnalytics.tsx` créé
   - ✅ Intégré dans `layout.tsx`
   - ✅ Sentry déjà configuré dans le code

2. **Comptes vérifiés:**
   - ✅ Compte Sentry existe: `luneo-ai.sentry.io`
   - ⬜ Compte GA4 à vérifier/créer

### ⬜ Ce qui reste à faire (5 minutes)

**Il faut juste obtenir 2 clés et les ajouter dans Vercel:**

---

## 📋 ÉTAPE 1: Obtenir le DSN Sentry (2 min)

1. **Aller sur:** https://luneo-ai.sentry.io/organizations/luneo-ai/projects/new/

2. **Créer le projet:**
   - Filtrer par "Next.js"
   - Cliquer sur "Next.js"
   - Nom du projet: `luneo-frontend`
   - Team: `luneo-ai` (déjà sélectionné)
   - Alertes: "I'll create my own alerts later"
   - Cliquer sur **"Créer un projet"**

3. **Récupérer le DSN:**
   - Après création, Sentry affiche le DSN
   - Format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
   - **COPIER ce DSN**

---

## 📋 ÉTAPE 2: Obtenir le Measurement ID GA4 (2 min)

### Option A: Si vous avez déjà un compte GA4

1. Aller sur https://analytics.google.com/
2. Sélectionner votre propriété "Luneo Platform"
3. Admin (⚙️) → Data Streams → Cliquer sur votre stream web
4. **Copier le Measurement ID** (format: `G-XXXXXXXXXX`)

### Option B: Créer un nouveau compte GA4

1. Aller sur https://analytics.google.com/
2. **"Start measuring"**
3. Créer propriété:
   - Nom: **Luneo Platform**
   - Fuseau: **Europe/Paris**
   - Devise: **EUR**
4. Créer Data Stream:
   - Type: **Web**
   - URL: **https://luneo.app**
   - Nom: **Luneo Production**
5. **Copier le Measurement ID** (`G-XXXXXXXXXX`)

---

## 📋 ÉTAPE 3: Ajouter dans Vercel (1 min)

1. **Aller sur:** https://vercel.com/luneos-projects/frontend/settings/environment-variables

2. **Cliquer sur "Create new"** (onglet en haut)

3. **Ajouter Sentry:**
   ```
   Key: NEXT_PUBLIC_SENTRY_DSN
   Value: [Coller le DSN Sentry]
   Environments: ✅ Production, ✅ Preview, ✅ Development
   ```
   → Cliquer sur **"Save"**

4. **Ajouter Google Analytics:**
   ```
   Key: NEXT_PUBLIC_GA_ID
   Value: G-XXXXXXXXXX [Coller le Measurement ID]
   Environments: ✅ Production, ✅ Preview
   ```
   → Cliquer sur **"Save"**

5. **Redéployer:**
   - Aller sur **Deployments**
   - Cliquer sur **"Redeploy"** sur le dernier déploiement

---

## ✅ VÉRIFICATION

### Sentry
1. Aller sur https://luneo.app
2. Console (F12) → Devrait voir: `Sentry initialized`
3. Sentry Dashboard → Issues → Les erreurs apparaîtront

### Google Analytics
1. Aller sur https://luneo.app
2. DevTools (F12) → Network → Filtrer "google-analytics"
3. Devrait voir des requêtes vers `www.google-analytics.com`
4. GA4 → Realtime → Devrait voir les visiteurs

---

## 🚀 C'EST TOUT !

Une fois ces 2 variables ajoutées dans Vercel, le monitoring sera **100% actif** ! 🎉

**Temps total: 5 minutes**

