# 🚀 GUIDE DÉPLOIEMENT VERCEL - PRODUCTION

**Date** : 9 Janvier 2025

---

## ✅ PRÉPARATION

### 1. Vérifier les commits
```bash
git log --oneline -10
```

### 2. Vérifier le build local
```bash
cd apps/frontend
npm run build
```

---

## 📋 ÉTAPES DE DÉPLOIEMENT

### Étape 1 : Push vers le repository
```bash
cd /Users/emmanuelabougadous/luneo-platform
git push origin main
```

### Étape 2 : Vérifier que Vercel est connecté au repo
- Aller sur https://vercel.com
- Vérifier que le projet `luneo-platform` (ou nom du projet) est lié au repo GitHub
- Vérifier que le **Root Directory** est configuré sur `apps/frontend`

### Étape 3 : Vérifier les variables d'environnement Vercel

**Variables CRITIQUES à vérifier dans Vercel Dashboard :**

```
NEXT_PUBLIC_API_URL=https://api.luneo.app/api
NEXT_PUBLIC_APP_URL=https://app.luneo.app
```

**Variables Supabase (si utilisé) :**
```
NEXT_PUBLIC_SUPABASE_URL=https://obrijgptqztacolemsbk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Variables OAuth (optionnel) :**
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_GITHUB_CLIENT_ID=...
```

---

## 🔧 CONFIGURATION VERCEL

### Vérifier vercel.json
Le fichier `apps/frontend/vercel.json` doit contenir :

```json
{
  "buildCommand": "(pnpm prisma generate || echo 'Prisma skipped') && pnpm run build",
  "installCommand": "pnpm install --no-frozen-lockfile",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Root Directory
Dans Vercel Dashboard → Settings → General :
- **Root Directory** : `apps/frontend`

---

## 🚀 DÉPLOIEMENT

### Option A : Déploiement automatique (recommandé)
Si Vercel est connecté au repo GitHub, chaque push sur `main` déclenche un déploiement automatique.

```bash
git push origin main
```

Vérifier le déploiement sur : https://vercel.com/dashboard

### Option B : Déploiement manuel avec Vercel CLI
```bash
cd apps/frontend
vercel --prod
```

---

## ✅ VÉRIFICATIONS POST-DÉPLOIEMENT

### 1. Vérifier que le build passe
- Aller sur Vercel Dashboard → Deployments
- Vérifier que le dernier déploiement est en succès (✅)

### 2. Tester les pages principales
- [ ] Homepage : https://app.luneo.app
- [ ] Login : https://app.luneo.app/login
- [ ] Register : https://app.luneo.app/register
- [ ] Dashboard : https://app.luneo.app/dashboard/overview
- [ ] Analytics : https://app.luneo.app/dashboard/analytics

### 3. Vérifier les APIs
- [ ] `/api/dashboard/stats` - Retourne des données
- [ ] `/api/dashboard/chart-data` - Retourne des données
- [ ] `/api/dashboard/notifications` - Retourne des données (ou [] si vide)

### 4. Vérifier les erreurs
- Vérifier Vercel Dashboard → Functions → Logs
- Vérifier la console navigateur (F12) pour erreurs JS

---

## 🐛 EN CAS D'ERREUR

### Build failed
1. Vérifier les logs dans Vercel Dashboard
2. Vérifier les variables d'environnement
3. Vérifier que `NEXT_PUBLIC_API_URL` est configuré

### Runtime error
1. Vérifier les logs Functions dans Vercel
2. Vérifier la console navigateur
3. Vérifier que les routes API fonctionnent

### 500 Internal Server Error
1. Vérifier les logs Vercel Functions
2. Vérifier que le backend est accessible depuis Vercel
3. Vérifier CORS si backend sur domaine différent

---

## 📝 NOTES IMPORTANTES

### Monorepo Configuration
- Vercel doit être configuré avec **Root Directory** = `apps/frontend`
- Le `buildCommand` utilise `pnpm` au niveau monorepo

### Variables d'environnement
- Toutes les variables `NEXT_PUBLIC_*` sont exposées au navigateur
- Ne JAMAIS mettre de secrets dans `NEXT_PUBLIC_*`
- Utiliser les variables server-side pour les secrets

### Backend API
- Vérifier que `NEXT_PUBLIC_API_URL` pointe vers le backend en production
- Vérifier que le backend est accessible depuis Vercel (CORS, etc.)

---

## 🎯 CHECKLIST FINALE

- [ ] Code commité et pushé
- [ ] Build local passe sans erreur
- [ ] Variables d'environnement Vercel configurées
- [ ] Root Directory configuré (`apps/frontend`)
- [ ] Déploiement déclenché (push ou CLI)
- [ ] Build Vercel réussi
- [ ] Pages principales fonctionnelles
- [ ] APIs retournent des données
- [ ] Pas d'erreurs dans les logs

---

**Status** : ✅ PRÊT POUR DÉPLOIEMENT

*Mise à jour : 9 Janvier 2025*
