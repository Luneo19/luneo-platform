# ⚡ SOLUTION TEMPORAIRE - API PREFIX

**Date**: 11 Janvier 2026  
**Status**: ✅ **SOLUTION APPLIQUÉE**

---

## 🔍 PROBLÈME IDENTIFIÉ

### Situation Actuelle
- **Railway** : `API_PREFIX=/api` (ne peut pas être modifié facilement via CLI)
- **Backend** : Routes enregistrées sous `/api/auth/signup`
- **Frontend** : Appelait `/api/v1/auth/signup` → 404

### Découverte
- ✅ `/api/auth/signup` **fonctionne** (erreur Prisma, pas 404)
- ❌ `/api/v1/auth/signup` retourne 404

---

## ✅ SOLUTION APPLIQUÉE

### Frontend - Correction Temporaire

**Fichier** : `apps/frontend/src/lib/api/client.ts`

**Changement** : Tous les endpoints `/api/v1/` remplacés par `/api/`

**Avant** :
```typescript
signup: (data: RegisterData) =>
  api.post<AuthSessionResponse>('/api/v1/auth/signup', data),
```

**Après** :
```typescript
signup: (data: RegisterData) =>
  api.post<AuthSessionResponse>('/api/auth/signup', data),
```

**Effet** : Le frontend appelle maintenant `/api/auth/signup` qui fonctionne.

---

## 🧪 TESTS

### Backend
```bash
curl https://api.luneo.app/api/auth/signup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","firstName":"Test","lastName":"User"}'
```

**Résultat** :
- ✅ Route trouvée (pas de 404)
- ⚠️ Erreur Prisma : `Column User.name does not exist`
- 💡 Problème de schéma base de données (à corriger séparément)

---

## 📋 PROCHAINES ÉTAPES

### 1. Corriger le Schéma Prisma

Le backend essaie d'accéder à `User.name` qui n'existe pas. Vérifier :
- Schéma Prisma : `apps/backend/prisma/schema.prisma`
- Migration nécessaire

### 2. Solution Long Terme

**Option A** : Modifier Railway `API_PREFIX` via Dashboard
1. Aller sur Railway Dashboard
2. Variables d'environnement
3. Modifier `API_PREFIX` de `/api` à `/api/v1`
4. Redéployer

**Option B** : Garder `/api` partout
- ✅ Frontend déjà corrigé
- ✅ Backend fonctionne avec `/api`
- ⚠️ Nécessite mise à jour documentation

---

## ✅ CHECKLIST

- [x] Frontend corrigé (`/api/v1/` → `/api/`)
- [x] Test endpoint `/api/auth/signup` réussi (route trouvée)
- [ ] Corriger schéma Prisma (`User.name` → `User.firstName` + `User.lastName`)
- [ ] Tester inscription complète
- [ ] Décider solution long terme (`/api` vs `/api/v1`)

---

**Document créé le** : 11 Janvier 2026  
**Dernière mise à jour** : 11 Janvier 2026
