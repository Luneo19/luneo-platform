# 🚀 CRÉER LE PROJET SENTRY - Guide Rapide

## ✅ ÉTAPE 1: Créer le projet (2 minutes)

1. **Aller sur:** https://luneo-ai.sentry.io/organizations/luneo-ai/projects/new/

2. **Sélectionner Next.js:**
   - Cliquer sur l'onglet **"Populaire"** (déjà sélectionné)
   - Chercher la carte **Next.js** (icône noire avec "N" blanc et "JS" jaune)
   - **Cliquer sur la carte Next.js**

3. **Configurer les alertes:**
   - Sélectionner: **"I'll create my own alerts later"**
   - Décocher "Notify via email" (optionnel)

4. **Nommer le projet:**
   - Dans le champ **"project-slug"**, taper: `luneo-frontend`
   - L'équipe **"luneo-ai"** est déjà sélectionnée

5. **Créer le projet:**
   - Cliquer sur **"Créer un projet"**

---

## ✅ ÉTAPE 2: Récupérer le DSN (30 secondes)

Après création, Sentry affiche automatiquement le DSN.

**Le DSN ressemble à:**
```
https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**OU** aller dans:
- **Settings** → **Projects** → **luneo-frontend** → **Client Keys (DSN)**
- Copier le DSN

---

## ✅ ÉTAPE 3: Ajouter dans Vercel (1 minute)

1. **Aller sur:** https://vercel.com/luneos-projects/frontend/settings/environment-variables

2. **Cliquer sur "Create new"**

3. **Ajouter Sentry DSN:**
   ```
   Key: NEXT_PUBLIC_SENTRY_DSN
   Value: [Coller le DSN Sentry]
   Environments: ✅ Production, ✅ Preview, ✅ Development
   ```
   → Cliquer sur **"Save"**

4. **Redéployer:**
   - Aller sur **Deployments**
   - Cliquer sur **"Redeploy"** sur le dernier déploiement

---

## 🎉 C'EST FAIT !

Une fois le DSN ajouté dans Vercel et redéployé, Sentry sera actif !

**Pour vérifier:**
1. Aller sur https://luneo.app
2. Ouvrir la console (F12)
3. Vous devriez voir: `Sentry initialized`
4. Dans Sentry Dashboard → Issues, les erreurs apparaîtront

