# 🚨 ACTIONS IMMÉDIATES POUR MISE EN PRODUCTION

**Date:** 29 Octobre 2025  
**Priorité:** CRITIQUE  
**Temps estimé:** 4-6 heures

---

## ✅ CORRECTIONS DÉJÀ APPLIQUÉES

1. **✅ OAuth Callback Route**
   - Fichier créé: `apps/frontend/src/app/auth/callback/route.ts`
   - Gère Google et GitHub OAuth
   - Redirection automatique vers dashboard

2. **✅ Page Dashboard Root**
   - Fichier créé: `apps/frontend/src/app/(dashboard)/page.tsx`
   - Redirige automatiquement vers `/dashboard/dashboard`
   - Évite le doublon d'URL

---

## 🔴 ACTIONS CRITIQUES RESTANTES

### 1. BASE DE DONNÉES SUPABASE (2h) - **PRIORITÉ #1**

```bash
# Étape 1: Se connecter
https://bkasxmzwilkbmszovedc.supabase.co

# Étape 2: Aller dans "SQL Editor"

# Étape 3: Exécuter DANS L'ORDRE (copier-coller chaque fichier):
```

**Ordre d'exécution EXACT:**

1. `supabase-migration-init.sql` (Tables de base + auth)
2. `supabase-customizer-system.sql` (Système de customisation)
3. `supabase-orders-system.sql` (Système de commandes)
4. `supabase-integrations-system.sql` (Intégrations)
5. `supabase-templates-cliparts-system.sql` (Templates)
6. `supabase-webhooks-system.sql` (Webhooks)
7. `supabase-design-versioning-SIMPLE.sql` (Versioning)
8. `supabase-optimize-FINAL-PRODUCTION.sql` (Optimisations)

**Vérification après chaque fichier:**
```sql
-- Doit s'exécuter sans erreur
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

---

### 2. VARIABLES D'ENVIRONNEMENT VERCEL (1h) - **PRIORITÉ #2**

#### A. Frontend (app.luneo.app)

```bash
# Se connecter à Vercel
npx vercel login

# Projet frontend
cd apps/frontend

# Ajouter les variables UNE PAR UNE:
npx vercel env add NEXT_PUBLIC_API_URL production
# Valeur: https://backend-[votre-id].vercel.app/api

npx vercel env add NEXT_PUBLIC_APP_URL production
# Valeur: https://app.luneo.app

# OAuth Google
npx vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production
# Valeur: 212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com

# OAuth GitHub
npx vercel env add NEXT_PUBLIC_GITHUB_CLIENT_ID production
# Valeur: Ov23liJmVOHyn8tfxgLi

# Stripe
npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Valeur: pk_live_jL5xDF4ylCaiXVDswVAliVA3

# OpenAI (DALL-E 3)
npx vercel env add OPENAI_API_KEY production
# Valeur: [Votre clé OpenAI]

# Upstash Redis (Optionnel mais recommandé)
npx vercel env add UPSTASH_REDIS_REST_URL production
npx vercel env add UPSTASH_REDIS_REST_TOKEN production
```

#### B. Backend (api.luneo.app)

```bash
cd apps/backend

# Database
npx vercel env add DATABASE_URL production
# Valeur: postgresql://postgres:[password]@db.bkasxmzwilkbmszovedc.supabase.co:5432/postgres

# JWT Secrets (Générer avec: openssl rand -base64 32)
npx vercel env add JWT_SECRET production
npx vercel env add JWT_REFRESH_SECRET production

# OAuth Secrets
npx vercel env add GOOGLE_CLIENT_SECRET production
npx vercel env add GITHUB_CLIENT_SECRET production

# Stripe
npx vercel env add STRIPE_SECRET_KEY production
npx vercel env add STRIPE_WEBHOOK_SECRET production

# SendGrid
npx vercel env add SENDGRID_API_KEY production
npx vercel env add SENDGRID_FROM_EMAIL production
# Valeur: no-reply@luneo.app

# OpenAI
npx vercel env add OPENAI_API_KEY production

# App config
npx vercel env add NODE_ENV production
npx vercel env add FRONTEND_URL production
# Valeur: https://app.luneo.app
```

---

### 3. TESTER COMPILATION BACKEND (15min) - **PRIORITÉ #3**

```bash
cd apps/backend

# Installer dépendances
npm install

# Compiler le backend
npm run build

# VÉRIFIER: Le dossier dist/ doit être créé sans erreurs
ls -la dist/

# Si erreurs TypeScript, les corriger avant de déployer
```

---

### 4. DÉPLOIEMENT VERCEL (30min) - **PRIORITÉ #4**

```bash
# Frontend
cd apps/frontend
vercel --prod

# Attendre la fin du déploiement
# Noter l'URL de production

# Backend
cd apps/backend
vercel --prod

# Attendre la fin du déploiement
# Noter l'URL de production

# Vérifier les déploiements
vercel ls
```

---

### 5. TESTS CRITIQUES (30min) - **PRIORITÉ #5**

#### A. Health Checks

```bash
# Frontend
curl https://app.luneo.app/api/health

# Backend
curl https://backend-[id].vercel.app/health
```

#### B. Authentification

```
1. Ouvrir https://app.luneo.app/login
2. Créer un compte avec email/mot de passe
3. Se déconnecter
4. Se reconnecter avec Google
5. Se reconnecter avec GitHub
6. Vérifier redirection vers /dashboard
```

#### C. Dashboard

```
1. Accéder à https://app.luneo.app/dashboard
2. Vérifier que les stats se chargent
3. Vérifier qu'aucune erreur "relation does not exist"
```

#### D. AI Studio

```
1. Aller sur /ai-studio
2. Entrer un prompt: "modern tech logo"
3. Cliquer "Générer"
4. Vérifier que l'image est générée
5. Télécharger l'image
```

#### E. Produits

```
1. Aller sur /products
2. Créer un nouveau produit
3. Vérifier qu'il apparaît dans la liste
```

---

## ⚠️ PROBLÈMES CONNUS ET SOLUTIONS

### Erreur: "relation does not exist"
**Cause:** Tables Supabase non créées  
**Solution:** Exécuter les migrations SQL (Priorité #1)

### Erreur: "Invalid OAuth callback"
**Cause:** Callback route manquante  
**Solution:** ✅ CORRIGÉ - Fichier créé

### Erreur: "API request failed"
**Cause:** Variables d'environnement manquantes  
**Solution:** Configurer toutes les variables (Priorité #2)

### Erreur: "Cannot connect to database"
**Cause:** DATABASE_URL incorrecte  
**Solution:** Vérifier la connexion Supabase et le mot de passe

### Dashboard vide
**Cause:** Pas de données en base  
**Solution:** Créer du contenu de test (designs, produits)

---

## 📋 CHECKLIST DE VALIDATION

Cocher chaque élément après validation:

### Base de Données
- [ ] Migration 1 exécutée (supabase-migration-init.sql)
- [ ] Migration 2 exécutée (supabase-customizer-system.sql)
- [ ] Migration 3 exécutée (supabase-orders-system.sql)
- [ ] Migration 4 exécutée (supabase-integrations-system.sql)
- [ ] Migration 5 exécutée (supabase-templates-cliparts-system.sql)
- [ ] Migration 6 exécutée (supabase-webhooks-system.sql)
- [ ] Migration 7 exécutée (supabase-design-versioning-SIMPLE.sql)
- [ ] Migration 8 exécutée (supabase-optimize-FINAL-PRODUCTION.sql)
- [ ] Requête `SELECT * FROM profiles` fonctionne

### Variables d'Environnement Frontend
- [ ] NEXT_PUBLIC_API_URL
- [ ] NEXT_PUBLIC_APP_URL
- [ ] NEXT_PUBLIC_SUPABASE_URL (déjà configuré)
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY (déjà configuré)
- [ ] NEXT_PUBLIC_GOOGLE_CLIENT_ID
- [ ] NEXT_PUBLIC_GITHUB_CLIENT_ID
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] OPENAI_API_KEY

### Variables d'Environnement Backend
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] JWT_REFRESH_SECRET
- [ ] GOOGLE_CLIENT_SECRET
- [ ] GITHUB_CLIENT_SECRET
- [ ] STRIPE_SECRET_KEY
- [ ] SENDGRID_API_KEY
- [ ] OPENAI_API_KEY
- [ ] FRONTEND_URL

### Compilation & Déploiement
- [ ] Backend compilé sans erreur (`npm run build`)
- [ ] Frontend déployé sur Vercel
- [ ] Backend déployé sur Vercel
- [ ] Health check frontend OK
- [ ] Health check backend OK

### Tests Fonctionnels
- [ ] Login email/password fonctionne
- [ ] Login OAuth Google fonctionne
- [ ] Login OAuth GitHub fonctionne
- [ ] Dashboard charge sans erreur
- [ ] AI Studio génère des images
- [ ] Création de produit fonctionne
- [ ] Customizer 2D fonctionne
- [ ] Navigation sidebar complète

---

## 🎯 COMMANDES RAPIDES

```bash
# Tout en une fois (après avoir configuré les variables):

# 1. Compiler backend
cd apps/backend && npm run build && cd ../..

# 2. Déployer frontend
cd apps/frontend && vercel --prod && cd ../..

# 3. Déployer backend
cd apps/backend && vercel --prod && cd ../..

# 4. Vérifier
curl https://app.luneo.app/api/health
```

---

## 📞 AIDE RAPIDE

### Supabase Password Reset
Si besoin de récupérer le mot de passe de la base de données:
1. Dashboard Supabase → Settings → Database
2. Noter le "Connection string"
3. Remplacer `[YOUR-PASSWORD]` par le vrai mot de passe

### Vercel Login Issues
```bash
npx vercel logout
npx vercel login
```

### Backend Build Errors
```bash
cd apps/backend
rm -rf node_modules dist
npm install
npm run build
```

---

## ✅ APRÈS MISE EN PRODUCTION

1. **Monitoring:** Configurer BetterUptime ou similaire
2. **Analytics:** Activer Vercel Analytics
3. **Sentry:** Configurer le monitoring d'erreurs
4. **DNS:** Si domaine custom, configurer CNAME
5. **SSL:** Vérifier le certificat HTTPS
6. **Performance:** Activer Vercel Edge Functions

---

**🎯 OBJECTIF:** Application 100% fonctionnelle d'ici 4-6h  
**📊 ÉTAT ACTUEL:** 85% - Corrections mineures appliquées  
**🚀 PROCHAINE ÉTAPE:** Exécuter les migrations SQL sur Supabase

---

*Dernière mise à jour: 29 Octobre 2025, 16:30*

