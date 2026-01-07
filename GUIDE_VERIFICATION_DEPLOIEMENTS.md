# 🔍 Guide de Vérification - Déploiements Railway & Vercel

**Date** : 5 janvier 2026, 01:05

## 📊 État Actuel Confirmé

### Repository GitHub ✅
- **URL**: `https://github.com/Luneo19/luneo-platform.git`
- **Dossier local**: `/Users/emmanuelabougadous/luneo-platform`
- **Dernier commit**: `78c5dee` - fix: simplifier loadFeatureFlags

### Railway ✅
- **Project**: `believable-learning`
- **Project ID**: `0e3eb9ba-6846-4e0e-81d2-bd7da54da971`
- **Service**: `backend`
- **Environment**: `production`

### Vercel ⚠️
- **Organisation**: `luneos-projects` (supposé)
- **Projet**: `frontend` (supposé)
- **Local link**: ❌ Non trouvé (pas de `.vercel/project.json`)

---

## 🔍 VÉRIFICATION 1 : Railway - Repository GitHub

### Étapes

1. **Ouvrir Railway Dashboard**
   - URL : https://railway.app/project/0e3eb9ba-6846-4e0e-81d2-bd7da54da971

2. **Vérifier le service `backend`**
   - Cliquer sur le service `backend`
   - Aller dans **Settings** (⚙️)

3. **Vérifier GitHub Integration**
   - Section **"Connect GitHub"** ou **"GitHub"**
   - **Repository attendu** : `Luneo19/luneo-platform`
   - **Branch attendue** : `main` (ou `master`)
   - **Root Directory** : `.` (racine du monorepo)

4. **Si le repository est différent** :
   - Cliquer sur **"Disconnect GitHub"** ou **"Change Repository"**
   - Cliquer sur **"Connect GitHub"**
   - Sélectionner `Luneo19/luneo-platform`
   - Sélectionner la branch `main`
   - Définir Root Directory : `.`

5. **Vérifier les déploiements automatiques**
   - Section **"Deployments"** ou **"Auto Deploy"**
   - Vérifier que **"Auto Deploy"** est activé
   - Vérifier que la branch `main` est sélectionnée

---

## 🔍 VÉRIFICATION 2 : Vercel - Repository GitHub

### Étapes

1. **Ouvrir Vercel Dashboard**
   - URL : https://vercel.com/luneos-projects
   - Cliquer sur le projet **`frontend`**

2. **Vérifier Git Repository**
   - Aller dans **Settings** → **Git**
   - Section **"Git Repository"**
   - **Repository attendu** : `Luneo19/luneo-platform`
   - **Production Branch** : `main` (ou `master`)

3. **Vérifier Root Directory**
   - Section **"Root Directory"**
   - **Valeur attendue** : `apps/frontend`
   - ⚠️ **IMPORTANT** : Si c'est `.` ou vide, le déploiement échouera

4. **Si le repository est différent** :
   - Cliquer sur **"Disconnect"** dans la section Git
   - Cliquer sur **"Connect Git Repository"**
   - Sélectionner `Luneo19/luneo-platform`
   - Configurer :
     - **Root Directory** : `apps/frontend`
     - **Framework Preset** : `Next.js` (détecté automatiquement)
     - **Build Command** : `pnpm run build` (ou laissez Vercel détecter)
     - **Output Directory** : `.next` (ou laissez Vercel détecter)

5. **Vérifier les déploiements automatiques**
   - Section **"Git"** → **"Production Branch"**
   - Vérifier que c'est `main` (ou `master`)

---

## ⚠️ PROBLÈMES COURANTS

### Problème 1 : Repository GitHub incorrect

**Symptômes** :
- Les commits sur `Luneo19/luneo-platform` ne déclenchent pas de déploiement
- Les déploiements se font depuis un autre repository

**Solution** :
- Reconnecter le bon repository GitHub dans Railway/Vercel
- Vérifier que la branch est `main`

### Problème 2 : Root Directory incorrect (Vercel)

**Symptômes** :
- Build échoue avec "Could not find a Next.js installation"
- Build échoue avec "package.json not found"

**Solution** :
- Vercel Root Directory doit être : `apps/frontend`
- Railway Root Directory doit être : `.` (racine du monorepo)

### Problème 3 : Déploiements automatiques désactivés

**Symptômes** :
- Les commits ne déclenchent pas de déploiement
- Besoin de déployer manuellement à chaque fois

**Solution** :
- Activer "Auto Deploy" dans Railway
- Vérifier que la branch `main` est configurée pour Production dans Vercel

---

## ✅ CHECKLIST DE VÉRIFICATION

### Railway
- [ ] Repository GitHub : `Luneo19/luneo-platform`
- [ ] Branch : `main`
- [ ] Root Directory : `.`
- [ ] Auto Deploy : Activé
- [ ] Service : `backend`

### Vercel
- [ ] Repository GitHub : `Luneo19/luneo-platform`
- [ ] Production Branch : `main`
- [ ] Root Directory : `apps/frontend`
- [ ] Auto Deploy : Activé (déploiements automatiques)
- [ ] Projet : `frontend`
- [ ] Organisation : `luneos-projects`

---

## 📋 PROCHAINES ÉTAPES

Après vérification et correction si nécessaire :

1. ⏳ Vérifier que les déploiements automatiques sont activés
2. ⏳ Faire un commit test pour vérifier que les déploiements se déclenchent
3. ⏳ Vérifier que les déploiements utilisent le bon code
4. ⏳ Tester que l'erreur 500 est résolue après le nouveau déploiement

---

## 🔗 LIENS UTILES

- **Railway Dashboard** : https://railway.app/project/0e3eb9ba-6846-4e0e-81d2-bd7da54da971
- **Vercel Dashboard** : https://vercel.com/luneos-projects/frontend
- **GitHub Repository** : https://github.com/Luneo19/luneo-platform



