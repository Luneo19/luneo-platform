# 🚀 DÉMARRAGE RAPIDE - PRODUCTION EN 3 ÉTAPES

**⏱️ Temps: 45 minutes**  
**🎯 Résultat: Application 100% fonctionnelle en production**

---

## 📝 PRÉPARATION (1 minute)

Vous aurez besoin de:
- ✅ Accès à https://bkasxmzwilkbmszovedc.supabase.co
- ✅ Accès à https://vercel.com
- ✅ Une clé OpenAI (optionnel, pour AI Studio)

---

## ÉTAPE 1️⃣ : CRÉER LES TABLES (20 min)

### A. Se connecter à Supabase

```
https://bkasxmzwilkbmszovedc.supabase.co
```

### B. Ouvrir SQL Editor

- Menu gauche → "SQL Editor"
- Cliquer sur "+ New query"

### C. Copier-coller ce SQL

**Ouvrez le fichier:** `MIGRATION_SQL_MINIMALE.sql`

- Sélectionner TOUT le contenu (Cmd+A)
- Copier (Cmd+C)
- Coller dans SQL Editor
- Cliquer **"Run"** (ou Cmd+Enter)

### D. Vérifier

Vous devriez voir:
```
✅ Success
Tables créées avec succès!
```

Aller dans "Table Editor" → Vous devriez voir:
- profiles
- designs
- products
- orders
- usage_tracking
- revenue_tracking
- integrations
- product_variants

---

## ÉTAPE 2️⃣ : CONFIGURER VERCEL (15 min)

### A. Se connecter

```
https://vercel.com
```

### B. Ouvrir votre projet

- Cliquer sur votre projet "luneo-frontend" ou similaire
- Aller dans **Settings** → **Environment Variables**

### C. Ajouter ces variables (TOUTES - Environment: All)

```env
NEXT_PUBLIC_SUPABASE_URL
→ https://bkasxmzwilkbmszovedc.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
→ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYXN4bXp3aWxrYm1zem92ZWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTcyOTUsImV4cCI6MjA2ODc5MzI5NX0.EvBSoGAfT4hgGAZBRM5T-hiFz5zHfjoEU4H4amL3xx8

NEXT_PUBLIC_API_URL
→ https://app.luneo.app/api

NEXT_PUBLIC_APP_URL
→ https://app.luneo.app

NEXT_PUBLIC_GOOGLE_CLIENT_ID
→ 212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com

NEXT_PUBLIC_GITHUB_CLIENT_ID
→ Ov23liJmVOHyn8tfxgLi

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
→ pk_live_jL5xDF4ylCaiXVDswVAliVA3

OPENAI_API_KEY (Optionnel mais recommandé)
→ [Votre clé OpenAI si vous l'avez]
```

**💡 Astuce:** Cliquer "Add New" pour chaque variable, sélectionner "All Environments"

---

## ÉTAPE 3️⃣ : DÉPLOYER (10 min)

### Option A: Via Terminal (Recommandé)

```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
vercel --prod
```

Attendez le message: `✅ Production: https://app.luneo.app`

### Option B: Via Vercel Dashboard

- Aller sur https://vercel.com/dashboard
- Cliquer sur votre projet
- Onglet "Deployments"
- Cliquer "Redeploy" sur le dernier déploiement
- Cocher "Use existing Build Cache"
- Cliquer "Redeploy"

---

## ✅ VÉRIFICATION (2 min)

### Test 1: API Health Check

Ouvrir dans le navigateur:
```
https://app.luneo.app/api/health
```

Devrait afficher:
```json
{"status":"healthy","timestamp":"..."}
```

### Test 2: Page d'accueil

```
https://app.luneo.app
```

La page doit charger sans erreur ✅

### Test 3: Connexion

```
https://app.luneo.app/login
```

1. Créer un compte
2. Vérifier la redirection vers `/dashboard`
3. Le dashboard doit s'afficher sans erreur

---

## 🎉 FÉLICITATIONS !

**Vous êtes en production !**

### Ce qui fonctionne maintenant:

✅ Authentification (email/password + OAuth)  
✅ Dashboard avec statistiques  
✅ Gestion des produits  
✅ Gestion des commandes  
✅ AI Studio (si OpenAI configuré)  
✅ Customizer 2D  
✅ Configurateur 3D  
✅ Intégrations (Shopify/WooCommerce)  

---

## 🧪 TESTER L'APPLICATION

### Créer un design avec AI Studio

1. Aller sur `/ai-studio`
2. Entrer un prompt: "Logo moderne pour entreprise tech"
3. Cliquer "Générer"
4. L'image devrait apparaître

### Créer un produit

1. Aller sur `/products`
2. Cliquer "Nouveau Produit"
3. Remplir le formulaire
4. Le produit apparaît dans la liste

### Customizer 2D

1. Aller sur `/products`
2. Cliquer sur un produit
3. Cliquer "Customize"
4. L'éditeur 2D s'ouvre

---

## ⚠️ SI QUELQUE CHOSE NE MARCHE PAS

### Erreur: "relation does not exist"

**Cause:** Les tables ne sont pas créées  
**Solution:**
1. Retourner sur Supabase
2. Table Editor → Vérifier que les tables existent
3. Si non, réexécuter l'ÉTAPE 1

### Erreur: "Invalid OAuth"

**Cause:** Variables Vercel manquantes  
**Solution:**
1. Vérifier ÉTAPE 2
2. S'assurer que TOUTES les variables sont ajoutées
3. Redéployer (ÉTAPE 3)

### Dashboard vide

**Cause:** Pas de données (normal au début)  
**Solution:** Créer du contenu de test (designs, produits)

### "Cannot generate image" (AI Studio)

**Cause:** OPENAI_API_KEY manquante  
**Solution:**
1. Obtenir une clé sur https://platform.openai.com
2. L'ajouter dans Vercel (ÉTAPE 2)
3. Redéployer

---

## 🔥 COMMANDES RAPIDES

```bash
# Script d'aide rapide
./COMMANDES_RAPIDES.sh

# Tester en local
cd apps/frontend && npm run dev

# Déployer
cd apps/frontend && vercel --prod

# Voir les logs
vercel logs --follow

# Vérifier API
curl https://app.luneo.app/api/health
```

---

## 📚 DOCUMENTATION

- **Guide complet:** `PRODUCTION_IMMEDIATE.md`
- **Audit détaillé:** `AUDIT_FINAL_CORRECTED_29_OCT_2025.md`
- **SQL minimal:** `MIGRATION_SQL_MINIMALE.sql`

---

## 📞 DASHBOARDS IMPORTANTS

- **Supabase:** https://bkasxmzwilkbmszovedc.supabase.co
- **Vercel:** https://vercel.com/dashboard
- **OpenAI:** https://platform.openai.com
- **Stripe:** https://dashboard.stripe.com

---

## 🚀 APRÈS LA PRODUCTION

### Optionnel - Améliorations

1. **Monitoring:** Configurer BetterUptime
2. **Analytics:** Activer Vercel Analytics
3. **Logs:** Configurer Sentry
4. **Performance:** Activer Vercel Edge
5. **CDN:** Configurer Cloudinary

### Nettoyage

Supprimer l'ancien projet Supabase (brxxdjjqzwrbhyjalatg):
- Dashboard → Settings → Delete Project

---

**🎯 TEMPS TOTAL: ~45 MINUTES**

**📊 RÉSULTAT: APPLICATION EN PRODUCTION ✅**

---

*Guide créé le 29 Octobre 2025*  
*Version simplifiée pour mise en production rapide*

