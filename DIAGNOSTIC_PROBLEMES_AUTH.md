# 🔍 DIAGNOSTIC PROBLÈMES AUTHENTIFICATION

**Date**: 11 Janvier 2026  
**Problème**: Erreur "Network Error" lors de l'inscription

---

## ❌ PROBLÈMES IDENTIFIÉS

### 1. Erreur "Network Error" sur `/register`

**Symptômes** :
- Erreur réseau lors de la soumission du formulaire
- Impossible de créer un compte
- Connexion également affectée

**Causes possibles** :
1. ❌ Backend non accessible depuis le frontend
2. ❌ Configuration API URL incorrecte
3. ❌ CORS mal configuré
4. ❌ Variables d'environnement manquantes
5. ❌ Backend non démarré ou crashé

---

## 🔧 SOLUTIONS

### Solution 1 : Vérifier la Configuration API

**Fichier**: `apps/frontend/src/lib/api/client.ts`

Vérifier que l'URL du backend est correcte :

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

**Action** :
1. Créer/modifier `.env.local` dans `apps/frontend/`
2. Ajouter :
```bash
NEXT_PUBLIC_API_URL=https://api.luneo.app
# ou pour développement local :
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

### Solution 2 : Vérifier le Backend

**Vérifier que le backend répond** :
```bash
curl https://api.luneo.app/health
```

**Si le backend ne répond pas** :
1. Vérifier les logs Railway
2. Vérifier que le déploiement est actif
3. Vérifier les variables d'environnement Railway

---

### Solution 3 : Vérifier CORS

**Fichier**: `apps/backend/src/main.ts`

Vérifier que CORS autorise le frontend :
```typescript
cors({
  origin: [
    'https://app.luneo.app',
    'https://www.luneo.app',
    'http://localhost:3000',
  ],
  credentials: true,
})
```

---

### Solution 4 : Vérifier les Variables d'Environnement

**Backend Railway** :
- `DATABASE_URL` ✅
- `JWT_SECRET` ✅
- `JWT_REFRESH_SECRET` ✅
- `FRONTEND_URL` ✅
- `CORS_ORIGIN` ✅

**Frontend** :
- `NEXT_PUBLIC_API_URL` ❓ (à vérifier)

---

## 🚀 ACTIONS IMMÉDIATES

### 1. Créer `.env.local` pour Frontend

```bash
cd apps/frontend
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://api.luneo.app
NEXT_PUBLIC_APP_URL=https://app.luneo.app
EOF
```

### 2. Redémarrer le Frontend

```bash
cd apps/frontend
npm run dev
```

### 3. Vérifier les Logs

**Backend Railway** :
```bash
cd apps/backend
railway logs --tail 50
```

**Frontend Local** :
Vérifier la console du navigateur pour les erreurs réseau

---

## 📋 CHECKLIST DE VÉRIFICATION

- [ ] Backend accessible (`curl https://api.luneo.app/health`)
- [ ] `.env.local` créé avec `NEXT_PUBLIC_API_URL`
- [ ] Frontend redémarré après modification `.env`
- [ ] CORS configuré correctement
- [ ] Variables Railway configurées
- [ ] Logs backend vérifiés
- [ ] Console navigateur vérifiée

---

## 🔍 DEBUGGING

### Vérifier la Requête Réseau

Dans la console du navigateur (F12) :
1. Onglet **Network**
2. Filtrer par **XHR** ou **Fetch**
3. Regarder la requête vers `/api/v1/auth/signup`
4. Vérifier :
   - URL complète
   - Status code
   - Response body
   - Headers

### Erreurs Courantes

**CORS Error** :
```
Access to fetch at 'https://api.luneo.app/api/v1/auth/signup' 
from origin 'https://app.luneo.app' has been blocked by CORS policy
```
→ Vérifier configuration CORS backend

**Network Error** :
```
Failed to fetch
```
→ Vérifier que le backend est accessible

**404 Not Found** :
```
POST /api/v1/auth/signup 404
```
→ Vérifier le chemin de l'endpoint

---

**Document créé le** : 11 Janvier 2026
