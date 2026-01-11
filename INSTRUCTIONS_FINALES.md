# 📋 INSTRUCTIONS FINALES - CORRECTION AUTHENTIFICATION

**Date**: 11 Janvier 2026  
**Status**: ✅ **CORRECTIONS APPLIQUÉES - ACTION MANUELLE REQUISE**

---

## ✅ CE QUI A ÉTÉ CORRIGÉ

### 1. Frontend ✅
- ✅ Tous les endpoints `/api/v1/` → `/api/`
- ✅ `.env.local` corrigé (sans `/api`)
- ✅ `client.ts` corrigé (fallback production)
- ✅ Vercel configuré : `NEXT_PUBLIC_API_URL=https://api.luneo.app`

### 2. Backend ✅
- ✅ Route `/api/auth/signup` accessible (pas de 404)
- ✅ Configuration corrigée (fallback `/api/v1` si `/api` détecté)
- ✅ Migration SQL créée pour `User.name`

---

## ⚠️ ACTION MANUELLE REQUISE

### Migration Base de Données

Le schéma Prisma inclut `User.name` mais la base de données ne l'a pas.

**Solution** : Ajouter la colonne `name` à la table `User`

**Option 1 : Via Railway Dashboard**
1. Aller sur Railway Dashboard → Votre projet → Database
2. Ouvrir la console SQL
3. Exécuter :
   ```sql
   ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT;
   ```

**Option 2 : Via Railway CLI**
```bash
cd apps/backend
railway run "psql \$DATABASE_URL -c \"ALTER TABLE \\\"User\\\" ADD COLUMN IF NOT EXISTS \\\"name\\\" TEXT;\""
```

**Option 3 : Via Migration Prisma**
```bash
cd apps/backend
railway run "cd /app/apps/backend && npx prisma migrate deploy"
```

---

## 🧪 TESTER APRÈS MIGRATION

### 1. Test Backend
```bash
curl https://api.luneo.app/api/auth/signup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","firstName":"Test","lastName":"User"}'
```

**Résultat attendu** :
- ✅ 201 Created (nouvel utilisateur)
- ✅ 409 Conflict (utilisateur existe déjà)
- ❌ 500 Error avec message Prisma (migration non appliquée)

---

### 2. Test Frontend

1. **Redémarrer le frontend** :
   ```bash
   cd apps/frontend
   npm run dev
   ```

2. **Tester l'inscription** :
   - Aller sur `http://localhost:3000/register`
   - Remplir le formulaire
   - Soumettre

**Résultat attendu** :
- ✅ Inscription réussie
- ✅ Redirection vers `/overview`
- ❌ Erreur réseau (si migration non appliquée)

---

## 📋 CHECKLIST FINALE

- [x] Frontend corrigé (`/api/v1/` → `/api/`)
- [x] Backend route `/api/auth/signup` accessible
- [x] Vercel configuré (`NEXT_PUBLIC_API_URL`)
- [x] Migration SQL créée
- [ ] Migration appliquée sur Railway
- [ ] Test inscription backend réussi
- [ ] Test inscription frontend réussi

---

## 🚀 COMMANDES RAPIDES

### Appliquer Migration
```bash
cd apps/backend
railway run "psql \$DATABASE_URL -c \"ALTER TABLE \\\"User\\\" ADD COLUMN IF NOT EXISTS \\\"name\\\" TEXT;\""
```

### Tester Endpoint
```bash
curl https://api.luneo.app/api/auth/signup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","firstName":"Test","lastName":"User"}'
```

### Redémarrer Frontend
```bash
cd apps/frontend
npm run dev
```

---

**Document créé le** : 11 Janvier 2026  
**Dernière mise à jour** : 11 Janvier 2026
