# 🔍 AUDIT COMPLET CONFIGURATION VERCEL - FRONTEND

**Date** : 22 décembre 2024  
**Projet** : luneo-frontend  
**URL Production** : https://luneo-frontend-luneos-projects.vercel.app

---

## 📊 RÉSUMÉ EXÉCUTIF

### ✅ Points Positifs
- Configuration `vercel.json` bien structurée
- Variables d'environnement partiellement configurées
- Build local réussi
- Configuration monorepo détectée

### ⚠️ Problèmes Critiques Identifiés
1. **Variables d'environnement manquantes** (CRITIQUE)
2. **Routes API nécessitant des variables non configurées**
3. **Configuration Supabase incomplète**
4. **Routes cron potentiellement problématiques**

---

## 🔴 PROBLÈME 1 : VARIABLES D'ENVIRONNEMENT MANQUANTES

### Variables CRITIQUES Manquantes

#### 1. `NEXT_PUBLIC_SUPABASE_URL` ⚠️ CRITIQUE
**Utilisation** :
- `src/lib/supabase/server.ts` (ligne 8)
- `src/lib/auth/get-user.ts` (lignes 29, 103)
- `src/app/api/webhooks/stripe/route.ts` (lignes 121, 213)

**Impact** : L'application ne peut pas se connecter à Supabase, ce qui bloque :
- L'authentification
- Les requêtes API nécessitant Supabase
- Les webhooks Stripe

**Action Requise** :
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Valeur attendue : https://obrijgptqztacolemsbk.supabase.co
```

#### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` ⚠️ CRITIQUE
**Utilisation** :
- `src/lib/supabase/server.ts` (ligne 9)

**Impact** : Impossible de créer un client Supabase côté serveur

**Action Requise** :
```bash
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Valeur attendue : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 3. `STRIPE_WEBHOOK_SECRET` ⚠️ CRITIQUE
**Utilisation** :
- `src/app/api/stripe/webhook/route.ts` (ligne 54)

**Impact** : Les webhooks Stripe ne peuvent pas être vérifiés, causant des erreurs 400

**Action Requise** :
```bash
vercel env add STRIPE_WEBHOOK_SECRET production
# Valeur : whsec_... (depuis Stripe Dashboard)
```

#### 4. `OPENAI_API_KEY` ⚠️ IMPORTANT
**Utilisation** :
- `src/app/api/ai/generate/route.ts` (ligne 16)

**Impact** : La génération d'images AI ne fonctionnera pas

**Action Requise** :
```bash
vercel env add OPENAI_API_KEY production
# Valeur : sk-... (depuis OpenAI Dashboard)
```

#### 5. `BACKEND_URL` ⚠️ IMPORTANT
**Utilisation** :
- `src/app/api/credits/transactions/route.ts` (ligne 27)

**Impact** : Fallback vers `NEXT_PUBLIC_API_URL`, mais devrait pointer vers le backend Railway

**Action Requise** :
```bash
vercel env add BACKEND_URL production
# Valeur : https://backend-production-9178.up.railway.app
```

### Variables Optionnelles Manquantes

#### 6. `MESHY_API_KEY` (Optionnel)
**Utilisation** : `src/app/api/ar/convert-2d-to-3d/route.ts`
**Impact** : Conversion 2D→3D non disponible (retourne 501)

#### 7. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Optionnel)
**Utilisation** : Frontend pour Stripe Checkout
**Impact** : Checkout Stripe ne fonctionnera pas côté frontend

---

## 🔴 PROBLÈME 2 : CONFIGURATION SUPABASE INCOMPLÈTE

### Variables Configurées ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅ (Production)

### Variables Manquantes ❌
- `NEXT_PUBLIC_SUPABASE_URL` ❌
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ❌

### Code Affecté

**Fichier** : `src/lib/supabase/server.ts`
```typescript
return createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,  // ❌ MANQUANT
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,  // ❌ MANQUANT
  // ...
);
```

**Fichier** : `src/lib/auth/get-user.ts`
```typescript
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,  // ❌ MANQUANT
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ✅ CONFIGURÉ
  // ...
);
```

**Impact** : Toutes les routes API utilisant Supabase échoueront avec des erreurs de type `undefined`.

---

## 🔴 PROBLÈME 3 : ROUTES CRON CONFIGURÉES MAIS POTENTIELLEMENT INACCESSIBLES

### Configuration dans `vercel.json`
```json
"crons": [
  {
    "path": "/api/cron/cleanup",
    "schedule": "0 3 * * *"
  },
  {
    "path": "/api/cron/analytics-digest",
    "schedule": "0 8 * * 1"
  }
]
```

### Vérifications Nécessaires
1. ✅ Les routes `/api/cron/cleanup` et `/api/cron/analytics-digest` existent-elles ?
2. ⚠️ Ces routes nécessitent-elles des variables d'environnement ?
3. ⚠️ Ces routes sont-elles protégées par authentification ?

**Action Requise** : Vérifier que ces routes existent et fonctionnent correctement.

---

## 🔴 PROBLÈME 4 : CONFIGURATION MONOREPO

### Configuration Actuelle
- **Root Directory** : Doit être `apps/frontend` dans Vercel
- **Build Command** : `pnpm run build` ✅
- **Install Command** : `pnpm install` ✅
- **Framework** : `nextjs` ✅

### Vérifications
1. ✅ `vercel.json` correctement configuré
2. ✅ `pnpm-workspace.yaml` présent à la racine
3. ⚠️ Vérifier que Vercel détecte correctement le monorepo

**Action Requise** : Vérifier dans Vercel Dashboard → Settings → General que :
- Root Directory = `apps/frontend`
- Framework Preset = Next.js
- Build Command = `pnpm run build`
- Install Command = `pnpm install`

---

## 🔴 PROBLÈME 5 : ROUTES API AVEC VARIABLES MANQUANTES

### Routes Affectées

#### 1. `/api/stripe/webhook`
**Variables Requises** :
- `STRIPE_SECRET_KEY` ✅ (configuré)
- `STRIPE_WEBHOOK_SECRET` ❌ (MANQUANT)
- `NEXT_PUBLIC_SUPABASE_URL` ❌ (MANQUANT)
- `SUPABASE_SERVICE_ROLE_KEY` ✅ (configuré)

**Impact** : Webhook Stripe échouera avec erreur 400 (signature invalide)

#### 2. `/api/ai/generate`
**Variables Requises** :
- `OPENAI_API_KEY` ❌ (MANQUANT)
- `CLOUDINARY_CLOUD_NAME` ✅ (configuré)
- `CLOUDINARY_API_KEY` ✅ (configuré)
- `CLOUDINARY_API_SECRET` ✅ (configuré)
- `UPSTASH_REDIS_REST_URL` ✅ (configuré)
- `NEXT_PUBLIC_SUPABASE_URL` ❌ (MANQUANT)

**Impact** : Génération AI échouera

#### 3. `/api/credits/transactions`
**Variables Requises** :
- `BACKEND_URL` ❌ (MANQUANT) - Fallback vers `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_URL` ✅ (configuré)

**Impact** : Peut fonctionner avec fallback, mais pas optimal

#### 4. `/api/ar/convert-2d-to-3d`
**Variables Requises** :
- `MESHY_API_KEY` ❌ (MANQUANT - optionnel)
- `NEXT_PUBLIC_SUPABASE_URL` ❌ (MANQUANT)

**Impact** : Retourne 501 (non disponible)

---

## ✅ CONFIGURATION CORRECTE

### Variables Bien Configurées
- ✅ `NEXT_PUBLIC_API_URL` (Production)
- ✅ `NEXT_PUBLIC_APP_URL` (Production)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (Production)
- ✅ `STRIPE_SECRET_KEY` (Production)
- ✅ `CLOUDINARY_CLOUD_NAME` (tous environnements)
- ✅ `CLOUDINARY_API_KEY` (tous environnements)
- ✅ `CLOUDINARY_API_SECRET` (tous environnements)
- ✅ `UPSTASH_REDIS_REST_URL` (tous environnements)
- ✅ `UPSTASH_REDIS_REST_TOKEN` (tous environnements)
- ✅ `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (Production)
- ✅ `NEXT_PUBLIC_GITHUB_CLIENT_ID` (Production)

### Configuration `vercel.json`
- ✅ Framework détecté : Next.js
- ✅ Headers de sécurité configurés
- ✅ Redirects configurés
- ✅ Rewrites configurés
- ✅ Cache-Control headers configurés

### Configuration `next.config.mjs`
- ✅ ESLint ignoré pendant le build
- ✅ TypeScript ignoré pendant le build (pour éviter les erreurs bloquantes)
- ✅ Optimisations de production activées
- ✅ Image optimization configurée
- ✅ Webpack optimizations configurées

---

## 📋 CHECKLIST DE CORRECTION

### Étape 1 : Variables d'Environnement Critiques

```bash
cd apps/frontend

# 1. Supabase (CRITIQUE)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Valeur : https://obrijgptqztacolemsbk.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Valeur : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjYwMjIsImV4cCI6MjA3Njg0MjAyMn0.0dxttYi1WPLuqdkI52a0Rary81wtYdjnBt4F0q4tYV8

# 2. Stripe Webhook (CRITIQUE)
vercel env add STRIPE_WEBHOOK_SECRET production
# Valeur : whsec_... (depuis Stripe Dashboard → Webhooks → Signing secret)

# 3. OpenAI (IMPORTANT)
vercel env add OPENAI_API_KEY production
# Valeur : sk-... (depuis OpenAI Dashboard)

# 4. Backend URL (IMPORTANT)
vercel env add BACKEND_URL production
# Valeur : https://backend-production-9178.up.railway.app
```

### Étape 2 : Vérifier la Configuration Monorepo

1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet `luneo-frontend`
3. Settings → General
4. Vérifier :
   - **Root Directory** : `apps/frontend`
   - **Framework Preset** : Next.js
   - **Build Command** : `pnpm run build`
   - **Install Command** : `pnpm install`
   - **Output Directory** : `.next` (ou laisser vide)

### Étape 3 : Vérifier les Routes Cron

Vérifier que les routes suivantes existent :
- `/api/cron/cleanup`
- `/api/cron/analytics-digest`

Si elles n'existent pas, soit :
- Les créer
- Les retirer de `vercel.json`

### Étape 4 : Redéployer

```bash
cd apps/frontend
vercel --prod
```

---

## 🔍 DIAGNOSTIC DES ERREURS DE DÉPLOIEMENT

### Erreurs Probables

#### 1. Build Error : `NEXT_PUBLIC_SUPABASE_URL is not defined`
**Cause** : Variable manquante
**Solution** : Ajouter `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 2. Runtime Error : `Cannot read property 'auth' of undefined`
**Cause** : Client Supabase non initialisé
**Solution** : Vérifier les variables Supabase

#### 3. Webhook Error : `Invalid Stripe webhook signature`
**Cause** : `STRIPE_WEBHOOK_SECRET` manquant ou incorrect
**Solution** : Configurer `STRIPE_WEBHOOK_SECRET`

#### 4. API Error : `OPENAI_API_KEY is not defined`
**Cause** : Variable manquante
**Solution** : Ajouter `OPENAI_API_KEY` (ou gérer gracieusement l'absence)

---

## 📊 MATRICE DE PRIORITÉ

| Variable | Priorité | Impact | Statut |
|----------|----------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | 🔴 CRITIQUE | Bloque l'authentification | ❌ MANQUANT |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 🔴 CRITIQUE | Bloque l'authentification | ❌ MANQUANT |
| `STRIPE_WEBHOOK_SECRET` | 🔴 CRITIQUE | Bloque les webhooks Stripe | ❌ MANQUANT |
| `OPENAI_API_KEY` | 🟡 IMPORTANT | Bloque la génération AI | ❌ MANQUANT |
| `BACKEND_URL` | 🟡 IMPORTANT | Routes API backend | ❌ MANQUANT |
| `MESHY_API_KEY` | 🟢 OPTIONNEL | Conversion 2D→3D | ❌ MANQUANT |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 🟢 OPTIONNEL | Checkout Stripe frontend | ❌ MANQUANT |

---

## 🚀 PLAN D'ACTION IMMÉDIAT

### Phase 1 : Corrections Critiques (5 minutes)
1. ✅ Ajouter `NEXT_PUBLIC_SUPABASE_URL`
2. ✅ Ajouter `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. ✅ Ajouter `STRIPE_WEBHOOK_SECRET`
4. ✅ Redéployer

### Phase 2 : Corrections Importantes (5 minutes)
1. ✅ Ajouter `OPENAI_API_KEY`
2. ✅ Ajouter `BACKEND_URL`
3. ✅ Redéployer

### Phase 3 : Vérifications (10 minutes)
1. ✅ Vérifier la configuration monorepo dans Vercel Dashboard
2. ✅ Vérifier l'existence des routes cron
3. ✅ Tester les routes API critiques
4. ✅ Vérifier les logs de déploiement

---

## 📝 NOTES IMPORTANTES

1. **Variables `NEXT_PUBLIC_*`** : Exposées au navigateur, ne jamais y mettre de secrets
2. **Variables serveur** : Utilisées uniquement dans les routes API (`/api/*`)
3. **Monorepo** : Vercel doit être configuré avec Root Directory = `apps/frontend`
4. **Build** : Les erreurs TypeScript/ESLint sont ignorées pendant le build (configuré dans `next.config.mjs`)

---

## ✅ VALIDATION POST-CORRECTION

Après avoir appliqué les corrections, vérifier :

```bash
# 1. Vérifier les variables
cd apps/frontend
vercel env ls

# 2. Tester le build local
pnpm run build

# 3. Redéployer
vercel --prod

# 4. Vérifier les logs
vercel logs <deployment-url>
```

---

**Toutes les corrections doivent être appliquées avant le prochain déploiement pour éviter les erreurs de runtime.**
