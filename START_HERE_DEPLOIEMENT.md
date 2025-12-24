# 🚀 COMMENCER ICI - DÉPLOIEMENT COMPLET

## ✅ CE QUI A ÉTÉ FAIT

1. ✅ **Diagnostic complet** - Tous les problèmes identifiés et documentés
2. ✅ **Corrections appliquées** - Fichiers de configuration corrigés
3. ✅ **Scripts automatisés** - Déploiement en un seul clic
4. ✅ **Documentation complète** - Guides détaillés pour chaque étape

---

## 🎯 DÉMARRAGE RAPIDE (3 ÉTAPES)

### ÉTAPE 1: Installer les CLI

```bash
# Railway CLI
npm i -g @railway/cli
railway login

# Vercel CLI
npm i -g vercel
vercel login
```

### ÉTAPE 2: Lier les projets

```bash
# Railway (Backend)
cd apps/backend
railway link

# Vercel (Frontend)
cd apps/frontend
vercel link
```

### ÉTAPE 3: Déployer automatiquement

```bash
# Depuis la racine du projet
./scripts/deploy-all.sh
```

Ce script va :
- ✅ Vérifier les prérequis
- ✅ Configurer les variables d'environnement (interactif)
- ✅ Déployer le backend sur Railway
- ✅ Déployer le frontend sur Vercel
- ✅ Vérifier que tout fonctionne

---

## 📋 CONFIGURATION MANUELLE (Alternative)

Si vous préférez configurer manuellement, suivez ces guides :

### Backend (Railway)

1. **Configurer Root Directory**:
   - Dashboard Railway → Settings → General → Root Directory = `apps/backend`

2. **Configurer les variables**:
   ```bash
   ./scripts/setup-railway-env.sh
   ```
   Ou manuellement:
   ```bash
   railway variables set DATABASE_URL="postgresql://..."
   railway variables set JWT_SECRET="your-32-char-secret"
   railway variables set JWT_REFRESH_SECRET="your-32-char-refresh-secret"
   railway variables set NODE_ENV="production"
   ```

3. **Déployer**:
   ```bash
   ./scripts/deploy-railway.sh
   ```

### Frontend (Vercel)

1. **Configurer Root Directory**:
   - Dashboard Vercel → Settings → General → Root Directory = `apps/frontend`

2. **Configurer les variables**:
   ```bash
   ./scripts/setup-vercel-env.sh
   ```
   Ou manuellement:
   ```bash
   cd apps/frontend
   echo "https://your-backend.up.railway.app/api" | vercel env add NEXT_PUBLIC_API_URL production
   echo "https://app.luneo.app" | vercel env add NEXT_PUBLIC_APP_URL production
   ```

3. **Déployer**:
   ```bash
   ./scripts/deploy-vercel.sh
   ```

---

## 📚 DOCUMENTATION COMPLÈTE

### Guides Principaux

1. **`DIAGNOSTIC_DEPLOIEMENT_COMPLET.md`**
   - Diagnostic détaillé de tous les problèmes
   - Solutions complètes
   - Checklist de production

2. **`GUIDE_DEPLOIEMENT_RAPIDE.md`**
   - Guide étape par étape
   - Instructions claires pour Railway et Vercel

3. **`COMMANDES_RAPIDES_DEPLOIEMENT.md`**
   - Toutes les commandes utiles
   - Référence rapide

### Guides de Configuration

4. **`VARIABLES_ENVIRONNEMENT_RAILWAY.md`**
   - Liste complète des variables Railway
   - Instructions de configuration

5. **`VARIABLES_ENVIRONNEMENT_VERCEL.md`**
   - Liste complète des variables Vercel
   - Instructions de configuration

---

## 🔧 SCRIPTS DISPONIBLES

Tous les scripts sont dans le dossier `scripts/` :

| Script | Description |
|--------|-------------|
| `deploy-all.sh` | Déploiement complet (backend + frontend) |
| `deploy-railway.sh` | Déploiement backend uniquement |
| `deploy-vercel.sh` | Déploiement frontend uniquement |
| `setup-railway-env.sh` | Configuration variables Railway (interactif) |
| `setup-vercel-env.sh` | Configuration variables Vercel (interactif) |

---

## ⚠️ POINTS IMPORTANTS

### Railway (Backend)

1. **Root Directory** doit être `apps/backend` dans les settings Railway
2. **Variables obligatoires**:
   - `DATABASE_URL`
   - `JWT_SECRET` (min 32 caractères)
   - `JWT_REFRESH_SECRET` (min 32 caractères)
   - `NODE_ENV=production`

3. **Port**: Railway fournit automatiquement `$PORT`, ne pas le définir manuellement

### Vercel (Frontend)

1. **Root Directory** doit être `apps/frontend` dans les settings Vercel
2. **Variables obligatoires**:
   - `NEXT_PUBLIC_API_URL` (URL de votre backend Railway)
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Build**: Vercel détecte automatiquement Next.js, pas besoin de configurer

---

## 🆘 EN CAS DE PROBLÈME

### Backend ne démarre pas

```bash
# Vérifier les logs
railway logs

# Vérifier les variables
railway variables

# Vérifier le build local
cd apps/backend
pnpm run build
```

### Frontend ne build pas

```bash
# Vérifier les logs
vercel logs

# Vérifier les variables
vercel env ls

# Vérifier le build local
cd apps/frontend
pnpm run build
```

### Erreurs CORS

1. Vérifier que `CORS_ORIGIN` dans Railway inclut l'URL Vercel
2. Vérifier que le backend accepte les requêtes depuis le frontend

---

## 📞 BESOIN D'AIDE ?

1. Consultez `DIAGNOSTIC_DEPLOIEMENT_COMPLET.md` pour les problèmes courants
2. Vérifiez les logs avec `railway logs` ou `vercel logs`
3. Vérifiez que toutes les variables d'environnement sont configurées

---

## 🎉 PRÊT À DÉPLOYER !

Tout est prêt. Exécutez simplement :

```bash
./scripts/deploy-all.sh
```

Et suivez les instructions interactives !

**Bon déploiement ! 🚀**
