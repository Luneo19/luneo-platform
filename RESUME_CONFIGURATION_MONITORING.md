# ✅ RÉSUMÉ CONFIGURATION MONITORING

## 🎉 CE QUI A ÉTÉ FAIT

### ✅ Sentry
1. **Projet créé** : `luneo-frontend` (plateforme: `javascript-nextjs`)
2. **DSN récupéré** : `https://738c0371c632e6480c8e31cf3ba86c57@o4509948310519808.ingest.de.sentry.io/4510458496680016`
3. **Variable ajoutée dans Vercel** :
   - ✅ Production (existait déjà)
   - ✅ Preview (ajouté)
   - ✅ Development (ajouté)

### ⬜ Google Analytics (GA4)
**À faire** : Créer une propriété GA4 et récupérer le Measurement ID

---

## 📋 PROCHAINES ÉTAPES POUR GA4

### Option 1 : Via l'interface Google Analytics (5 minutes)

1. **Aller sur** : https://analytics.google.com/
2. **Cliquer sur** "Commencer à mesurer"
3. **Étape 1 - Créer un compte** :
   - Nom du compte : `Luneo Platform`
   - Cliquer sur "Suivant"
4. **Étape 2 - Créer une propriété** :
   - Nom de la propriété : `Luneo Platform`
   - Fuseau horaire : `Europe/Paris`
   - Devise : `EUR`
   - Cliquer sur "Suivant"
5. **Étape 3 - Info complémentaire** :
   - Catégorie sectorielle : `Technologie`
   - Taille de l'entreprise : `1-10 employés` (ou autre selon votre cas)
   - Cliquer sur "Suivant"
6. **Étape 4 - Objectifs commerciaux** :
   - Sélectionner les objectifs pertinents
   - Cliquer sur "Suivant"
7. **Étape 5 - Collecte de données** :
   - Sélectionner "Web"
   - URL du site : `https://luneo.app`
   - Nom du flux : `Luneo Production`
   - Cliquer sur "Créer"
8. **Récupérer le Measurement ID** :
   - Format : `G-XXXXXXXXXX`
   - Il sera affiché après la création du flux

### Option 2 : Si vous avez déjà une propriété GA4

1. Aller sur https://analytics.google.com/
2. Sélectionner votre propriété
3. **Admin** (⚙️) → **Data Streams**
4. Cliquer sur votre stream web
5. **Copier le Measurement ID** (format: `G-XXXXXXXXXX`)

---

## 🔧 AJOUTER GA4 DANS VERCEL

Une fois le Measurement ID obtenu :

```bash
cd apps/frontend
echo "G-XXXXXXXXXX" | vercel env add NEXT_PUBLIC_GA_ID production
echo "G-XXXXXXXXXX" | vercel env add NEXT_PUBLIC_GA_ID preview
```

**OU** via l'interface Vercel :
1. Aller sur : https://vercel.com/luneos-projects/frontend/settings/environment-variables
2. Cliquer sur "Create new"
3. Remplir :
   - Key: `NEXT_PUBLIC_GA_ID`
   - Value: `G-XXXXXXXXXX` (votre Measurement ID)
   - Environments: ✅ Production, ✅ Preview
4. Cliquer sur "Save"

---

## 🚀 REDÉPLOIEMENT

Une fois les 2 variables ajoutées :

```bash
cd apps/frontend
vercel --prod
```

**OU** via l'interface Vercel :
1. Aller sur : https://vercel.com/luneos-projects/frontend/deployments
2. Cliquer sur "Redeploy" sur le dernier déploiement

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

## 📊 ÉTAT ACTUEL

- ✅ **Sentry** : 100% configuré et actif
- ⬜ **GA4** : En attente du Measurement ID

**Temps restant estimé** : 5 minutes pour créer GA4 et ajouter la variable

