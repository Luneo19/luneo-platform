# 🚀 GUIDE DÉTAILLÉ: CONFIGURATION VERCEL

**Date:** 29 Octobre 2025  
**Objectif:** Configurer les bonnes variables pour le bon projet Supabase

---

## 📍 VOUS ÊTES ICI

Vous avez:
- ✅ Le bon projet Supabase: `obrijgptqztacolemsbk`
- ✅ Toutes les clés API correctes
- ✅ Les tables créées en base de données

Il reste:
- 🔧 Configurer Vercel avec les bonnes variables
- 🚀 Redéployer
- ✅ Tester

---

## 🎯 ÉTAPE 1: ACCÉDER À VERCEL (2 min)

### 1.1 Se connecter

```
https://vercel.com/dashboard
```

### 1.2 Trouver votre projet

Cherchez un projet nommé quelque chose comme:
- "luneo-frontend"
- "luneo-platform"
- "saas-backend" (si c'est le frontend)

**Cliquez dessus**

---

## 🔧 ÉTAPE 2: OUVRIR ENVIRONMENT VARIABLES (1 min)

Une fois dans votre projet:

1. Cliquez sur l'onglet **"Settings"** (en haut)
2. Dans le menu de gauche, cliquez **"Environment Variables"**

Vous verrez une page avec toutes vos variables actuelles.

---

## 📝 ÉTAPE 3: CONFIGURER LES VARIABLES (10 min)

### Comment ajouter/modifier une variable:

**Si la variable EXISTE déjà:**
1. Trouvez-la dans la liste
2. Cliquez sur les **3 petits points** ⋯ à droite
3. Cliquez **"Edit"**
4. Remplacez la valeur
5. Cliquez **"Save"**

**Si la variable N'EXISTE PAS:**
1. Cliquez le bouton **"Add New"** (en haut à droite)
2. Remplissez:
   - **Name**: Le nom de la variable
   - **Value**: La valeur (copiez depuis le fichier VARIABLES_VERCEL_A_COPIER.txt)
   - **Environments**: Sélectionnez **"Production, Preview, and Development"**
3. Cliquez **"Save"**

---

### Variables à Configurer (UNE PAR UNE)

#### ✅ Variable 1: NEXT_PUBLIC_SUPABASE_URL

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://obrijgptqztacolemsbk.supabase.co
Environments: All ✅
```

**C'est LA variable la plus importante !**  
Elle dit à votre app où trouver la base de données.

---

#### ✅ Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjYwMjIsImV4cCI6MjA3Njg0MjAyMn0.0dxttYi1WPLuqdkI52a0Rary81wtYdjnBt4F0q4tYV8
Environments: All ✅
```

**Clé publique pour l'authentification frontend.**

---

#### ✅ Variable 3: SUPABASE_SERVICE_ROLE_KEY

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI2NjAyMiwiZXhwIjoyMDc2ODQyMDIyfQ.r8pgz9G88K41Jpseg_vseH9jevqK17zJcNcM6YQR-YE
Environments: All ✅
```

**Clé secrète pour les opérations backend.**

---

#### ✅ Variable 4: NEXT_PUBLIC_API_URL

```
Name: NEXT_PUBLIC_API_URL
Value: https://app.luneo.app/api
Environments: All ✅
```

---

#### ✅ Variable 5: NEXT_PUBLIC_APP_URL

```
Name: NEXT_PUBLIC_APP_URL
Value: https://app.luneo.app
Environments: All ✅
```

---

#### ✅ Variable 6: NEXT_PUBLIC_GOOGLE_CLIENT_ID

```
Name: NEXT_PUBLIC_GOOGLE_CLIENT_ID
Value: 212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com
Environments: All ✅
```

---

#### ✅ Variable 7: NEXT_PUBLIC_GITHUB_CLIENT_ID

```
Name: NEXT_PUBLIC_GITHUB_CLIENT_ID
Value: Ov23liJmVOHyn8tfxgLi
Environments: All ✅
```

---

#### ✅ Variable 8: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

```
Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_live_jL5xDF4ylCaiXVDswVAliVA3
Environments: All ✅
```

---

#### ⚠️ Variable 9: OPENAI_API_KEY (Optionnel)

```
Name: OPENAI_API_KEY
Value: [Votre clé OpenAI]
Environments: All ✅
```

**Si vous n'avez pas de clé OpenAI, sautez cette étape.**  
L'AI Studio ne fonctionnera pas, mais le reste oui.

---

## 🚀 ÉTAPE 4: REDÉPLOYER (5 min)

Une fois TOUTES les variables ajoutées:

### Option A: Via Terminal (Recommandé)

```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
vercel --prod
```

Attendez que ça se termine (2-3 minutes).

### Option B: Via Vercel Dashboard

1. Restez dans votre projet Vercel
2. Cliquez sur l'onglet **"Deployments"**
3. Sur le dernier déploiement, cliquez les **3 points** ⋯
4. Cliquez **"Redeploy"**
5. Cochez **"Use existing Build Cache"**
6. Cliquez **"Redeploy"**

---

## ✅ ÉTAPE 5: VÉRIFICATION (3 min)

### Test 1: Health Check

Ouvrir dans le navigateur:
```
https://app.luneo.app/api/health
```

**Résultat attendu:**
```json
{"status":"healthy","timestamp":"..."}
```

### Test 2: Page Login

```
https://app.luneo.app/login
```

La page devrait charger sans erreur ✅

### Test 3: Connexion

1. Se connecter avec `emmanuel.abougadous@gmail.com`
2. Vérifier redirection vers `/dashboard`
3. Le dashboard doit charger **SANS ERREUR** !

---

## 🎉 SUCCÈS !

Si tous les tests passent:

✅ Votre app est connectée au bon projet Supabase  
✅ Les variables sont correctes  
✅ L'authentification fonctionne  
✅ Le dashboard s'affiche  

**VOUS ÊTES EN PRODUCTION ! 🚀**

---

## ⚠️ SI QUELQUE CHOSE NE MARCHE PAS

### Erreur: "Invalid API key"

**Cause:** Les variables ne sont pas sauvegardées  
**Solution:** Revenir à l'ÉTAPE 3, vérifier que toutes les variables sont bien ajoutées

### Erreur: "relation does not exist"

**Cause:** Variable NEXT_PUBLIC_SUPABASE_URL incorrecte  
**Solution:** Vérifier qu'elle pointe bien vers `obrijgptqztacolemsbk.supabase.co`

### Dashboard vide

**Cause:** Pas de données (normal)  
**Solution:** Créer des designs/produits de test

### "Cannot generate image"

**Cause:** OPENAI_API_KEY manquante  
**Solution:** Ajouter votre clé OpenAI dans Vercel

---

## 📞 COMMANDES UTILES

```bash
# Voir les variables actuelles
vercel env ls

# Voir les logs en temps réel
vercel logs --follow

# Forcer un redéploiement
vercel --prod --force
```

---

**🎯 TEMPS TOTAL: ~20 minutes**

**📊 RÉSULTAT: APPLICATION 100% FONCTIONNELLE**

---

*Guide créé le 29 Octobre 2025*

