# ✅ SOLUTION PROBLÈMES AUTHENTIFICATION

**Date**: 11 Janvier 2026  
**Status**: ✅ **CORRECTIONS APPLIQUÉES**

---

## 🔍 PROBLÈMES IDENTIFIÉS

### 1. ❌ Double Préfixe `/api` dans l'URL

**Problème** :
- `.env.local` contient : `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
- Les endpoints utilisent : `/api/v1/auth/signup`
- Résultat : `http://localhost:3001/api/api/v1/auth/signup` ❌

**Solution** :
- ✅ Corrigé `.env.local` : `NEXT_PUBLIC_API_URL=http://localhost:3001`
- ✅ Corrigé `client.ts` pour utiliser l'URL sans `/api`
- ✅ Les endpoints incluent déjà `/api/v1`

---

### 2. ❌ Variables Vercel Manquantes

**Problème** :
- En production, `NEXT_PUBLIC_API_URL` n'est pas configurée sur Vercel
- Le frontend ne peut pas communiquer avec le backend

**Solution** :
- ✅ Script créé : `scripts/fix-auth-config.sh`
- ⚠️ **Action requise** : Configurer sur Vercel :
  ```
  NEXT_PUBLIC_API_URL=https://api.luneo.app
  ```
  (sans `/api` à la fin)

---

### 3. ❌ Route Backend 404

**Problème** :
- Test curl montre : `Cannot POST /api/v1/auth/signup` (404)
- Le backend ne répond pas correctement

**Vérifications** :
- ✅ Backend accessible : `https://api.luneo.app/health` ✅
- ✅ Route définie : `@Controller('auth')` avec `@Post('signup')`
- ✅ Préfixe global : `/api/v1` configuré dans `main.ts`

**Cause probable** :
- Le backend Railway peut avoir un problème de routing
- Vérifier les logs Railway pour plus de détails

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. Fichier `apps/frontend/src/lib/api/client.ts`

**Avant** :
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? null // ❌ Cause des erreurs
    : 'http://localhost:3001');
```

**Après** :
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://api.luneo.app' // ✅ Fallback pour production
    : 'http://localhost:3001'); // ✅ Fallback pour développement
```

---

### 2. Fichier `apps/frontend/.env.local`

**Avant** :
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api  # ❌ Double préfixe
```

**Après** :
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001  # ✅ Correct
```

---

### 3. Script de Correction

**Créé** : `scripts/fix-auth-config.sh`

**Fonctions** :
- ✅ Corrige automatiquement `.env.local`
- ✅ Vérifie la configuration backend
- ✅ Affiche les instructions pour Vercel

---

## 🚀 ACTIONS REQUISES

### 1. Configuration Vercel (Production)

**Aller sur** : https://vercel.com/dashboard → Votre projet → Settings → Environment Variables

**Ajouter** :
```
NEXT_PUBLIC_API_URL=https://api.luneo.app
```

**⚠️ IMPORTANT** : Sans `/api` à la fin !

**Redéployer** le frontend après modification.

---

### 2. Redémarrer le Frontend Local

```bash
cd apps/frontend
npm run dev
```

**Tester** : http://localhost:3000/register

---

### 3. Vérifier les Logs Backend

```bash
cd apps/backend
railway logs --tail 50
```

**Chercher** :
- Erreurs de routing
- Erreurs CORS
- Erreurs de validation

---

## 📋 CHECKLIST DE VÉRIFICATION

- [x] `.env.local` corrigé (sans `/api`)
- [x] `client.ts` corrigé (fallback production)
- [x] Script de correction créé
- [ ] Variables Vercel configurées
- [ ] Frontend redémarré
- [ ] Test d'inscription réussi
- [ ] Test de connexion réussi

---

## 🔍 DEBUGGING

### Vérifier l'URL Utilisée

Dans la console du navigateur (F12) :
1. Onglet **Network**
2. Filtrer par **XHR**
3. Regarder la requête vers `/api/v1/auth/signup`
4. Vérifier l'URL complète dans l'onglet **Headers**

**URL attendue** :
- Dev : `http://localhost:3001/api/v1/auth/signup`
- Prod : `https://api.luneo.app/api/v1/auth/signup`

---

### Erreurs Courantes

**CORS Error** :
```
Access to fetch at 'https://api.luneo.app/api/v1/auth/signup' 
from origin 'https://app.luneo.app' has been blocked by CORS policy
```
→ Vérifier configuration CORS backend (déjà configuré ✅)

**Network Error** :
```
Failed to fetch
```
→ Vérifier que `NEXT_PUBLIC_API_URL` est correctement configurée

**404 Not Found** :
```
Cannot POST /api/v1/auth/signup
```
→ Vérifier les logs Railway backend

---

## 📝 NOTES

- Les endpoints incluent déjà `/api/v1` dans leur chemin
- `NEXT_PUBLIC_API_URL` doit être l'URL de base SANS `/api`
- Le backend utilise le préfixe global `/api/v1`
- Les cookies httpOnly sont utilisés pour l'authentification

---

**Document créé le** : 11 Janvier 2026  
**Dernière mise à jour** : 11 Janvier 2026
