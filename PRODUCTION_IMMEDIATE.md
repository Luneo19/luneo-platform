# 🚀 PASSAGE EN PRODUCTION IMMÉDIAT - PLAN SIMPLIFIÉ

**Date:** 29 Octobre 2025  
**Objectif:** Production en 1 heure  
**Stratégie:** UN SEUL projet Supabase, configuration unifiée

---

## ✅ DÉCISION: UN SEUL PROJET SUPABASE

### Projet à Garder: `bkasxmzwilkbmszovedc`

```
URL: https://bkasxmzwilkbmszovedc.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYXN4bXp3aWxrYm1zem92ZWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTcyOTUsImV4cCI6MjA2ODc5MzI5NX0.EvBSoGAfT4hgGAZBRM5T-hiFz5zHfjoEU4H4amL3xx8

Utilisation: DEV + PROD (unifié)
```

**Raison:** URL déjà dans vercel.env.example, c'est le projet production

---

## 🎯 PLAN D'ACTION (3 ÉTAPES - 1H)

### ÉTAPE 1: CRÉER LES TABLES (30 min) ⚡

```bash
# 1. Se connecter à Supabase
https://bkasxmzwilkbmszovedc.supabase.co

# 2. Aller dans "SQL Editor" (menu gauche)

# 3. Exécuter CES 3 FICHIERS SEULEMENT (dans l'ordre):
```

#### Fichier 1: `supabase-migration-init.sql`
```sql
-- Copier-coller TOUT le contenu de ce fichier
-- Cliquer "Run"
-- Attendre confirmation "Success"
```

#### Fichier 2: `supabase-orders-system.sql`
```sql
-- Copier-coller TOUT le contenu
-- Cliquer "Run"
-- Attendre "Success"
```

#### Fichier 3: `supabase-integrations-system.sql`
```sql
-- Copier-coller TOUT le contenu
-- Cliquer "Run"
-- Attendre "Success"
```

**Vérification:**
```sql
-- Exécuter cette requête:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Vous devez voir:
-- profiles, designs, products, orders, integrations, etc.
```

---

### ÉTAPE 2: CONFIGURER VARIABLES (15 min) 🔧

#### A. Variables Vercel FRONTEND

```bash
# Se connecter à Vercel
https://vercel.com

# Aller dans votre projet frontend
# Settings → Environment Variables

# Ajouter UNE PAR UNE (All Environments):

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

OPENAI_API_KEY
→ [Votre clé OpenAI - à ajouter]
```

#### B. Variables Locales (pour tester en local)

```bash
# Mettre à jour .env à la racine du projet
cd /Users/emmanuelabougadous/luneo-platform

# Créer/éditer .env.local
cat > .env.local << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://bkasxmzwilkbmszovedc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYXN4bXp3aWxrYm1zem92ZWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTcyOTUsImV4cCI6MjA2ODc5MzI5NX0.EvBSoGAfT4hgGAZBRM5T-hiFz5zHfjoEU4H4amL3xx8

# OpenAI
OPENAI_API_KEY=sk-votre-cle-ici
EOF
```

---

### ÉTAPE 3: DÉPLOYER (15 min) 🚀

```bash
# A. Tester en LOCAL d'abord
cd apps/frontend
npm run dev

# Ouvrir http://localhost:3000
# Se connecter → Doit fonctionner ✅

# B. Déployer sur Vercel
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
vercel --prod

# Attendre la fin du déploiement
# Noter l'URL de production
```

---

## 🧪 TESTS DE VALIDATION (5 min)

### Test 1: Health Check
```bash
curl https://app.luneo.app/api/health
# Doit retourner: {"status":"healthy"}
```

### Test 2: Authentification
```
1. Ouvrir https://app.luneo.app/login
2. Créer un compte avec email/password
3. Vérifier redirection vers /dashboard
```

### Test 3: Dashboard
```
1. Le dashboard doit charger sans erreur
2. Créer un design dans AI Studio
3. Créer un produit dans Products
```

---

## 🗑️ NETTOYAGE (Optionnel - après validation)

### Supprimer l'Ancien Projet Supabase

```bash
# Projet à supprimer: brxxdjjqzwrbhyjalatg
# 1. Se connecter à https://brxxdjjqzwrbhyjalatg.supabase.co
# 2. Settings → General → Delete Project
# 3. Taper le nom du projet pour confirmer
```

### Nettoyer les Fichiers Config

```bash
cd /Users/emmanuelabougadous/luneo-platform

# Supprimer les anciens .env
rm -f .env.supabase
rm -f .env.bak

# Garder seulement
# .env.local (nouveau)
# .env.example (référence)
```

---

## ⚠️ PROBLÈMES POTENTIELS ET SOLUTIONS

### Erreur: "relation does not exist"
**Cause:** Tables pas créées  
**Solution:** Vérifier Étape 1, réexécuter les SQL

### Erreur: "Invalid OAuth callback"  
**Cause:** Callback route manquante  
**Solution:** ✅ DÉJÀ CORRIGÉ (fichier créé dans audit précédent)

### Erreur: "Cannot generate image"
**Cause:** OPENAI_API_KEY manquante  
**Solution:** Ajouter la variable Vercel

### Dashboard vide
**Cause:** Pas de données  
**Solution:** Normal au début, créer du contenu de test

---

## 📋 CHECKLIST FINALE

### Base de Données
- [ ] Connexion à bkasxmzwilkbmszovedc.supabase.co
- [ ] SQL 1 exécuté (supabase-migration-init.sql)
- [ ] SQL 2 exécuté (supabase-orders-system.sql)
- [ ] SQL 3 exécuté (supabase-integrations-system.sql)
- [ ] Tables visibles dans Table Editor

### Variables Vercel
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] NEXT_PUBLIC_API_URL
- [ ] NEXT_PUBLIC_APP_URL
- [ ] NEXT_PUBLIC_GOOGLE_CLIENT_ID
- [ ] NEXT_PUBLIC_GITHUB_CLIENT_ID
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] OPENAI_API_KEY

### Déploiement
- [ ] Test local OK (npm run dev)
- [ ] Déploiement Vercel lancé
- [ ] URL production accessible
- [ ] Health check OK
- [ ] Login fonctionne
- [ ] Dashboard charge

---

## 🎉 VOUS ÊTES EN PRODUCTION !

**Une fois tous les checks cochés:**

✅ L'application est fonctionnelle  
✅ Les utilisateurs peuvent se connecter  
✅ Le dashboard fonctionne  
✅ AI Studio fonctionne (si OpenAI configuré)  
✅ Gestion produits fonctionne  

---

## 🚀 APRÈS LA MISE EN PRODUCTION

### Actions Recommandées (Plus tard)

1. **Monitoring**
   - Configurer BetterUptime: https://betteruptime.com
   - Endpoint: https://app.luneo.app/api/health

2. **Analytics**
   - Activer Vercel Analytics
   - Configurer Google Analytics

3. **Performance**
   - Activer Vercel Edge Functions
   - Configurer Cloudinary pour les images

4. **Sécurité**
   - Configurer Sentry pour les erreurs
   - Activer rate limiting (Upstash Redis)

5. **DNS Custom** (Si vous avez un domaine)
   ```
   app.luneo.app    CNAME    cname.vercel-dns.com
   ```

---

## 📞 AIDE RAPIDE

### Commandes Utiles

```bash
# Voir les logs Vercel
vercel logs

# Redéployer
vercel --prod --force

# Vérifier les variables
vercel env ls

# Tester l'API
curl -i https://app.luneo.app/api/health
```

### Dashboards Importants

- **Supabase:** https://bkasxmzwilkbmszovedc.supabase.co
- **Vercel:** https://vercel.com/dashboard
- **Stripe:** https://dashboard.stripe.com
- **OpenAI:** https://platform.openai.com

---

## ✅ RÉSUMÉ EN 3 ACTIONS

```bash
1️⃣ TABLES (30min)
   → Se connecter à Supabase
   → SQL Editor
   → Exécuter 3 fichiers SQL

2️⃣ VARIABLES (15min)
   → Se connecter à Vercel
   → Environment Variables
   → Ajouter 8 variables

3️⃣ DÉPLOYER (15min)
   → vercel --prod
   → Tester l'URL
   → ✅ EN PROD !
```

---

**🎯 TEMPS TOTAL: 1 HEURE**

**📊 RÉSULTAT: APPLICATION 100% FONCTIONNELLE EN PRODUCTION**

---

*Plan créé le 29 Octobre 2025*  
*Prêt pour exécution immédiate*

